/* Comprobantes separados del pequeño cupo de localStorage.
 * IndexedDB es privado al navegador: no publica imágenes ni cambia permisos.
 * La limpieza se ejecuta al abrir la página y al consultar los pagos. */
const ReceiptStore = (() => {
  let database;
  let loading;
  const urls = new Map();
  const rawGet = Storage.getTransactions.bind(Storage);
  const rawSave = Storage.saveTransactions.bind(Storage);
  const rawCleanup = Storage.cleanupExpiredReceipts.bind(Storage);

  const open = () => new Promise((resolve, reject) => {
    const request = indexedDB.open('safezone_receipts', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('receipts', { keyPath: 'id' });
    request.onsuccess = () => { database = request.result; resolve(); };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Cierra las otras pestañas de Safe Zone e inténtalo de nuevo.'));
  });
  const operation = (mode, action) => new Promise((resolve, reject) => {
    const transaction = database.transaction('receipts', mode);
    const request = action(transaction.objectStore('receipts'));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('No se pudo guardar el comprobante.'));
  });
  const release = key => {
    const url = urls.get(key);
    if (url) URL.revokeObjectURL(url);
    urls.delete(key);
  };
  const remove = async key => {
    if (!database || !key) return;
    await operation('readwrite', store => store.delete(key));
    release(key);
  };
  const attach = (key, blob) => {
    release(key);
    urls.set(key, URL.createObjectURL(blob));
  };
  const put = async (transaction, source) => {
    const blob = await (await fetch(source)).blob();
    const key = transaction.id;
    await operation('readwrite', store => store.put({ id: key, blob, expiresAt: Storage.receiptExpiry(transaction) }));
    attach(key, blob);
    return { ...transaction, receiptStorageKey: key, receiptUrl: null };
  };
  const hydrate = transactions => transactions.map(transaction => ({
    ...transaction,
    receiptUrl: transaction.receiptStorageKey ? (urls.get(transaction.receiptStorageKey) || null) : transaction.receiptUrl
  }));
  const initialize = () => {
    if (loading) return loading;
    loading = (async () => {
      await open();
      const transactions = rawGet();
      const activeKeys = new Set(transactions.filter(t => t.receiptStorageKey).map(t => t.receiptStorageKey));
      const stored = await operation('readonly', store => store.getAll());
      for (const receipt of stored) {
        if (receipt.expiresAt <= Date.now() || !activeKeys.has(receipt.id)) await remove(receipt.id);
        else attach(receipt.id, receipt.blob);
      }
      // Solo eliminar la copia antigua después de confirmar el guardado en IndexedDB.
      for (let index = 0; index < transactions.length; index++) {
        if (!transactions[index].receiptUrl?.startsWith('data:image/')) continue;
        const migrated = await put(transactions[index], transactions[index].receiptUrl);
        const updated = transactions.slice();
        updated[index] = migrated;
        rawSave(updated);
        transactions[index] = migrated;
      }
    })().catch(error => { loading = null; throw error; });
    return loading;
  };

  Storage.cleanupExpiredReceipts = transactions => {
    const cleaned = rawCleanup(transactions);
    transactions.forEach((transaction, index) => {
      if (transaction.receiptStorageKey && !cleaned[index].receiptStorageKey) {
        remove(transaction.receiptStorageKey).catch(error => console.warn('No se pudo limpiar la imagen vencida.', error));
      }
    });
    return cleaned;
  };
  Storage.getTransactions = () => hydrate(rawGet());
  Storage.saveTransactions = transactions => {
    const previous = rawGet();
    const metadata = transactions.map(transaction => transaction.receiptStorageKey
      ? { ...transaction, receiptUrl: null } : transaction);
    rawSave(metadata);
    const keys = new Set(metadata.map(transaction => transaction.receiptStorageKey).filter(Boolean));
    previous.forEach(transaction => {
      if (transaction.receiptStorageKey && !keys.has(transaction.receiptStorageKey)) {
        remove(transaction.receiptStorageKey).catch(error => console.warn('No se pudo eliminar la imagen del pago.', error));
      }
    });
  };
  Storage.savePaymentTransaction = async transaction => {
    try {
      await initialize();
      const saved = await put(transaction, transaction.receiptUrl);
      const transactions = Storage.getTransactions();
      Storage.saveTransactions([saved, ...transactions]);
      return hydrate([saved])[0];
    } catch (error) {
      await remove(transaction.id).catch(() => {});
      throw new Error('No fue posible guardar la foto. Verifica que el navegador permita almacenar datos y tenga espacio disponible.');
    }
  };
  const previousInitialize = Storage.initialize.bind(Storage);
  Storage.initialize = async () => {
    try { await initialize(); }
    catch (error) { console.warn('No se pudo preparar el almacenamiento de comprobantes.', error); }
    return previousInitialize();
  };
  return { initialize };
})();

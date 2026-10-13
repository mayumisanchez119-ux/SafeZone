/* La base compartida es la fuente de pagos y cupos. Nunca confirmar un envío
 * mediante una copia local. Las copias anteriores se conservan para recuperar
 * sus registros al entrar como administradora desde el navegador de origen. */
const PaymentSync = (() => {
  const legacyGet = Storage.getTransactions.bind(Storage);
  const legacySave = Storage.saveTransactions.bind(Storage);
  const legacyAttendees = Storage.getSessionAttendees.bind(Storage);
  let transactions = [];
  let attendees = {};
  let loadingAdmin;
  let migrating;
  let lastAdmin = 0;
  let busy = false;
  let errorMessage = '';
  let initialized = false;
  const submissions = new Map();
  const session = () => {
    try { return JSON.parse(localStorage.getItem('safezone_admin_session') || 'null'); }
    catch (_) { return null; }
  };
  const admin = () => InstructorModule.isAuthenticated();
  const rpc = async (name, body = {}, administrative = false) => {
    const token = administrative ? session()?.access_token : SafeZoneCloud.key;
    if (!token || (administrative && !admin())) throw new Error('Ingresa nuevamente como administradora.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch(SafeZoneCloud.url + '/rest/v1/rpc/safezone_' + name, {
        method: 'POST', headers: { apikey: SafeZoneCloud.key, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal, cache: 'no-store'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se pudo conectar con los datos compartidos.');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('La conexión tardó demasiado. Reintenta: no se mostrará una confirmación sin guardar el pago.');
      throw error;
    } finally { clearTimeout(timeout); }
  };
  const remember = tx => {
    if (!tx || tx.deleted) return;
    transactions = [tx, ...transactions.filter(item => item.id !== tx.id)];
  };
  const redraw = () => {
    App.updateWalletBadge();
    if (App.currentTab === 'sessions') SessionsModule.renderSessions();
    if (App.currentTab === 'wallet') TicketsModule.renderWallet();
    if (App.currentTab === 'instructor-portal' && ['transactions', 'calendar'].includes(InstructorModule.activeSubTab)) InstructorModule.renderInstructorPortal();
    if (App.currentTab === 'teacher-portal') TeacherPortal.render();
  };
  const refreshCounts = async () => {
    const counts = await rpc('payment_counts');
    const map = {};
    Storage.getSessions().forEach(item => { map[item.id] = []; });
    Object.entries(counts || {}).forEach(([id, count]) => {
      map[id] = Array.from({ length: Number(count) }, () => ({ counted: true }));
    });
    attendees = map;
  };
  const imageData = async url => {
    if (!url) return null;
    if (url.startsWith('data:image/')) return url;
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo recuperar uno de los comprobantes antiguos. Su copia local se conserva.');
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('No se pudo leer el comprobante anterior.'));
      reader.readAsDataURL(blob);
    });
  };
  const migrate = () => {
    if (migrating) return migrating;
    migrating = (async () => {
      // No importar las transacciones de demostración ni recrear pagos eliminados.
      if (!localStorage.getItem('safezone_transactions')) return 0;
      await ReceiptStore.initialize();
      const local = legacyGet();
      let count = 0;
      const failures = [];
      for (const tx of local) {
        if (tx.cloudSynced || ['tx-1', 'tx-2'].includes(tx.id)) continue;
        try {
          const receipt = await imageData(tx.receiptUrl);
          if (tx.receiptStorageKey && !tx.receiptUrl && !tx.receiptRemovedAt) throw new Error('No se pudo recuperar la foto local.');
          await rpc('submit_payment', { p_transaction: { ...tx, receiptUrl: null }, p_receipt: receipt, p_import: true }, true);
          tx.cloudSynced = true;
          // Solo marcar la copia local después de la confirmación del servidor.
          legacySave(local);
          count++;
        } catch (error) { failures.push(tx.uniqueCode + ': ' + error.message); }
      }
      await rpc('import_attendees', { p_attendees: legacyAttendees() }, true);
      if (count) App.showToast(`Se recuperaron ${count} pagos de este navegador en la base compartida.`, 8000);
      if (failures.length) throw new Error(`${failures.length} registros antiguos pendientes de recuperación. ${failures[0]}`);
      return count;
    })().finally(() => { migrating = null; });
    return migrating;
  };
  const refreshAdmin = ({ recover = false } = {}) => {
    if (loadingAdmin) return loadingAdmin;
    loadingAdmin = (async () => {
      let recoveryError;
      if (recover) { try { await migrate(); } catch (error) { recoveryError = error; } }
      const result = await rpc('admin_payments', {}, true);
      transactions = result.transactions || [];
      attendees = result.attendees || {};
      Storage.getSessions().forEach(item => { if (!attendees[item.id]) attendees[item.id] = []; });
      lastAdmin = Date.now();
      errorMessage = recoveryError?.message || '';
      redraw();
      if (recoveryError) App.showToast(errorMessage, 10000);
    })().catch(error => {
      errorMessage = error.message;
      throw error;
    }).finally(() => { loadingAdmin = null; });
    return loadingAdmin;
  };
  const lookup = async code => {
    const value = String(code || '').trim().toUpperCase();
    if (!value) return null;
    if (!/^[A-Z0-9-]{5,50}$/.test(value)) throw new Error('Ingresa un código o un número de celular válido.');
    const tx = await rpc('lookup_payment', { p_code: value });
    transactions = transactions.filter(item => item.uniqueCode !== value && item.studentPhone !== value);
    remember(tx);
    return tx;
  };
  Storage.getTransactions = () => transactions;
  Storage.findTransactionByCode = code => transactions.find(tx => tx.uniqueCode === String(code || '').trim().toUpperCase() || tx.studentPhone === String(code || '').trim()) || null;
  Storage.getSessionAttendees = () => attendees;
  Storage.savePaymentTransaction = async tx => {
    const saved = await rpc('submit_payment', { p_transaction: { ...tx, receiptUrl: null }, p_receipt: tx.receiptUrl, p_import: false });
    remember(saved);
    // El pago ya está confirmado: un fallo posterior al actualizar cupos no
    // puede ocultar la confirmación ni provocar un segundo cobro/registro.
    await refreshCounts().catch(error => console.warn('Contador pendiente de actualización', error));
    return saved;
  };
  Storage.redeemTicket = async (code, sessionId, name, phone) => {
    const tx = await rpc('redeem', { p_code: code, p_session: sessionId, p_name: name, p_phone: phone.replace(/\D/g, '') });
    remember(tx);
    await refreshCounts().catch(error => console.warn('Contador pendiente de actualización', error));
    return tx;
  };
  Storage.updateTransactionStatus = async (id, status, note = '') => {
    const result = await rpc('change_payment', { p_id: id, p_status: status, p_note: note }, true);
    remember(result);
    await refreshAdmin().catch(error => console.warn('La modificación se guardó; la lista se actualizará luego.', error));
    return true;
  };
  Storage.deleteTransaction = async id => {
    const deleted = await rpc('delete_payment', { p_id: id }, true);
    if (deleted) transactions = transactions.filter(tx => tx.id !== id);
    await refreshAdmin().catch(error => console.warn('El registro se eliminó; la lista se actualizará luego.', error));
    return deleted;
  };
  // Estos antiguos puntos de escritura no deben fingir un guardado local.
  Storage.saveTransactions = () => { throw new Error('Los pagos deben guardarse en la base compartida.'); };
  Storage.addSessionAttendee = () => { throw new Error('La inscripción debe confirmarse en la base compartida.'); };

  const initialize = Storage.initialize.bind(Storage);
  Storage.initialize = async () => {
    await initialize();
    try {
      if (admin()) await refreshAdmin({ recover: true });
      else await refreshCounts();
    } catch (error) {
      errorMessage = error.message;
      App.showToast('No se pudieron cargar los pagos y cupos compartidos. Revisa tu conexión.', 8000);
    }
    initialized = true;
  };
  const renderAdmin = InstructorModule.renderInstructorPortal.bind(InstructorModule);
  InstructorModule.renderInstructorPortal = () => {
    renderAdmin();
    if (initialized && admin() && !loadingAdmin && Date.now() - lastAdmin > 15000) {
      refreshAdmin({ recover: true }).catch(error => App.showToast(error.message));
    }
  };
  const sheet = InstructorModule.renderTransactionsSheet.bind(InstructorModule);
  InstructorModule.renderTransactionsSheet = () => `<div class="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-300">
    <span role="status">${errorMessage ? App.escapeHtml(errorMessage) : lastAdmin ? 'Pagos guardados en la base compartida · actualización automática' : 'Cargando pagos compartidos…'}</span>
    <button type="button" onclick="PaymentSync.recover()" class="px-3 py-2 rounded-lg border border-pink-500/40 text-pink-300">Actualizar y recuperar datos de este navegador</button></div>` + sheet();
  const receiptModal = InstructorModule.openReceiptModal.bind(InstructorModule);
  InstructorModule.openCloudReceipt = async (id, code) => {
    try {
      App.showToast('Cargando comprobante privado…');
      const image = await rpc('admin_receipt', { p_id: id }, true);
      if (!image) throw new Error('La imagen ya cumplió su periodo de conservación de 15 días.');
      receiptModal(image, code);
    } catch (error) { App.showToast(error.message); }
  };
  // Consultar de nuevo al volver a la pestaña y cada 15 s. No reemplazar un
  // formulario/modal abierto durante la actualización del catálogo o calendario.
  const tick = async () => {
    if (busy || !initialized || document.hidden) return;
    busy = true;
    try {
      if (admin()) await refreshAdmin();
      else await refreshCounts();
      const query = TicketsModule.queriedCode;
      if (App.currentTab === 'wallet' && query) await lookup(query);
      redraw();
    } catch (error) { console.warn('Sincronización pendiente', error); }
    finally { busy = false; }
  };
  setInterval(tick, 15000);
  window.addEventListener('focus', tick);
  window.addEventListener('online', tick);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  return { lookup, refreshAdmin, refreshCounts,
    submissionId: (key, receipt) => {
      const draft = submissions.get(key);
      if (draft?.receipt === receipt) return draft.id;
      const id = crypto.randomUUID();
      submissions.set(key, { id, receipt });
      return id;
    }, recover: async () => {
    try { await refreshAdmin({ recover: true }); if (!errorMessage) App.showToast('Pagos y cupos actualizados desde la base compartida.'); }
    catch (error) { App.showToast(error.message, 8000); }
  } };
})();

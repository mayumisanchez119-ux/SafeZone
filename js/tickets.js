/**
 * Módulo de Ticketeras, Compra con Comprobante, Códigos Únicos y Consulta Pública - SAFE ZONE CLUB
 */

const TicketsModule = {
  currentComboFilter: 'all_types',
  queriedCode: '',
  selectedReceiptBase64: null,

  setComboFilter: (filterType) => {
    TicketsModule.currentComboFilter = filterType;

    const buttons = document.querySelectorAll('.combo-filter-btn');
    buttons.forEach(btn => {
      const isTarget = btn.getAttribute('data-combo-filter') === filterType;
      if (isTarget) {
        btn.classList.add('bg-gradient-to-r', 'from-pink-600', 'to-rose-600', 'text-white', 'shadow-lg', 'shadow-rose-600/30');
        btn.classList.remove('bg-slate-900', 'text-slate-300', 'hover:bg-slate-800');
      } else {
        btn.classList.remove('bg-gradient-to-r', 'from-pink-600', 'to-rose-600', 'text-white', 'shadow-lg', 'shadow-rose-600/30');
        btn.classList.add('bg-slate-900', 'text-slate-300', 'hover:bg-slate-800');
      }
    });

    TicketsModule.renderCombos();
  },

  renderCombos: () => {
    const container = document.getElementById('combos-container');
    if (!container) return;

    const combos = Storage.getCombos();
    
    const filtered = combos.filter(combo => {
      if (TicketsModule.currentComboFilter === 'all_types') return true;
      if (TicketsModule.currentComboFilter === 'universal') return combo.discipline === 'all';
      return combo.discipline === TicketsModule.currentComboFilter;
    });

    container.innerHTML = filtered.map(combo => {
      let scopeBadge = "";
      if (combo.discipline === 'all') {
        scopeBadge = `<span class="bg-pink-950/80 text-pink-300 border border-pink-700/60 text-[10px] font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1">
          <i data-lucide="globe" class="w-3.5 h-3.5"></i> PASE UNIVERSAL SAFE ZONE (ALL-ACCESS)
        </span>`;
      } else if (combo.discipline === 'boxeo') {
        scopeBadge = `<span class="bg-rose-950/80 text-rose-300 border border-rose-700/60 text-[10px] font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1">
          <i data-lucide="swords" class="w-3.5 h-3.5"></i> EXCLUSIVO: SOLO BOXEO
        </span>`;
      } else if (combo.discipline === 'taekwondo') {
        scopeBadge = `<span class="bg-purple-950/80 text-purple-300 border border-purple-700/60 text-[10px] font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1">
          <i data-lucide="zap" class="w-3.5 h-3.5"></i> EXCLUSIVO: SOLO TAEKWONDO
        </span>`;
      } else if (combo.discipline === 'defensa-personal') {
        scopeBadge = `<span class="bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-700/60 text-[10px] font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1">
          <i data-lucide="shield" class="w-3.5 h-3.5"></i> EXCLUSIVO: SOLO DEFENSA PERSONAL
        </span>`;
      }

      return `
        <div class="glass-card glass-card-hover rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group border border-slate-800">
          <div class="absolute top-4 right-4">
            <span class="${combo.badgeColor} text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg shadow-pink-600/20">
              ${combo.badge}
            </span>
          </div>

          <div>
            <div class="mb-3">
              ${scopeBadge}
            </div>

            <div class="mb-4 pr-16">
              <h3 class="text-2xl font-bold text-white mb-2 font-heading group-hover:text-pink-400 transition-colors">${combo.title}</h3>
              <p class="text-slate-300 text-sm leading-relaxed">${combo.description}</p>
            </div>

            <div class="my-5 p-4 rounded-xl bg-slate-950/90 border border-pink-900/30 shadow-inner">
              <div class="flex items-baseline gap-2">
                <span class="text-3xl sm:text-4xl font-extrabold text-pink-500 font-heading">$${combo.price.toLocaleString('es-CO')}</span>
                <span class="text-slate-500 text-sm line-through">$${combo.regularPrice.toLocaleString('es-CO')}</span>
              </div>
              <div class="mt-2 flex items-center justify-between text-xs">
                <span class="text-emerald-400 font-semibold flex items-center gap-1">
                  <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Ahorras $${combo.savings.toLocaleString('es-CO')} COP
                </span>
                <span class="text-pink-300 font-semibold bg-pink-950/80 px-2.5 py-0.5 rounded-full border border-pink-800/50 flex items-center gap-1">
                  <i data-lucide="clock" class="w-3 h-3 text-pink-400"></i> ${combo.validityDays} días de vigencia
                </span>
              </div>
            </div>

            <ul class="space-y-3 mb-8 text-sm text-slate-300">
              ${combo.features.map(feat => `
                <li class="flex items-start gap-2.5">
                  <div class="p-0.5 rounded-full bg-pink-500/20 text-pink-400 mt-0.5 shrink-0">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                  </div>
                  <span>${feat}</span>
                </li>
              `).join('')}
            </ul>
          </div>

          <button type="button" onclick="TicketsModule.openPurchaseModal('${combo.id}')" 
            class="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold tracking-wide shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02] cursor-pointer">
            <i data-lucide="ticket" class="w-5 h-5"></i>
            <span>Comprar y Subir Comprobante</span>
          </button>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  openPurchaseModal: (comboId) => {
    const combos = Storage.getCombos();
    const combo = combos.find(c => c.id === comboId);
    if (!combo) return;

    TicketsModule.selectedReceiptBase64 = null;

    const modal = document.getElementById('purchase-modal');
    const modalContent = document.getElementById('purchase-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <i data-lucide="credit-card" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white font-heading">Comprar ${combo.title}</h3>
              <p class="text-xs text-slate-400">Genera tu Código Único de Tickets</p>
            </div>
          </div>
          <button onclick="TicketsModule.closePurchaseModal()" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="p-4 rounded-2xl bg-gradient-to-br from-pink-950/40 via-slate-950 to-slate-950 border border-pink-500/40 mb-6 space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-pink-400 tracking-wider">Cuentas Oficiales Safe Zone</span>
            <span class="text-sm font-extrabold text-white font-heading">$${combo.price.toLocaleString('es-CO')} COP</span>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <span class="text-slate-300 font-bold">Nequi:</span>
              </div>
              <span class="text-white font-mono font-bold">312 345 6789</span>
            </div>

            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                <span class="text-slate-300 font-bold">Daviplata:</span>
              </div>
              <span class="text-white font-mono font-bold">312 345 6789</span>
            </div>
          </div>
          <p class="text-[11px] text-slate-400">Realiza tu transferencia por el valor del paquete y adjunta la captura o foto del comprobante abajo.</p>
        </div>

        <form id="purchase-form" onsubmit="TicketsModule.processPurchase(event, '${combo.id}')" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Completo de la Alumna *</label>
            <input type="text" id="buyer-name" required placeholder="Ej: Valentina Morales" 
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp / Celular *</label>
              <input type="tel" id="buyer-phone" required placeholder="Ej: 3123456789" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Medio de Pago Utilizado *</label>
              <select id="buyer-payment-method" class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
                <option value="Nequi (312 345 6789)">🟣 Nequi</option>
                <option value="Daviplata (312 345 6789)">🔴 Daviplata</option>
                <option value="Bancolombia Transferencia">🟡 Bancolombia</option>
                <option value="Efectivo / En Mano">💵 Pago en Mano</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Foto / Captura del Comprobante de Pago *</label>
            <div class="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-pink-500/40 hover:border-pink-500 transition-colors text-center relative cursor-pointer group">
              <input type="file" id="receipt-file-input" accept="image/*" onchange="TicketsModule.handleReceiptUpload(event)" 
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
              
              <div id="receipt-preview-container" class="space-y-2">
                <div class="w-10 h-10 rounded-full bg-pink-500/10 text-pink-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i data-lucide="upload-cloud" class="w-5 h-5"></i>
                </div>
                <p class="text-xs text-slate-300 font-medium">Haz clic aquí para seleccionar la foto del comprobante</p>
                <p class="text-[10px] text-slate-500">JPG, PNG o Captura de pantalla de Nequi / Daviplata</p>
              </div>

              <div id="receipt-image-preview" class="hidden">
                <img id="preview-img-el" src="" alt="Comprobante" class="max-h-40 mx-auto rounded-xl border border-slate-700 object-contain shadow-md mb-2">
                <span class="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i> Comprobante adjuntado correctamente (Clic para cambiar)
                </span>
              </div>
            </div>
          </div>

          <div class="pt-2">
            <button type="submit" 
              class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="send" class="w-5 h-5"></i>
              <span>Enviar Pago y Obtener Mi Código Único</span>
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  handleReceiptUpload: (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      TicketsModule.selectedReceiptBase64 = e.target.result;
      const previewContainer = document.getElementById('receipt-preview-container');
      const imagePreview = document.getElementById('receipt-image-preview');
      const imgEl = document.getElementById('preview-img-el');

      if (imgEl && imagePreview && previewContainer) {
        imgEl.src = e.target.result;
        previewContainer.classList.add('hidden');
        imagePreview.classList.remove('hidden');
      }
      if (window.lucide) lucide.createIcons();
    };
    reader.readAsDataURL(file);
  },

  closePurchaseModal: () => {
    const modal = document.getElementById('purchase-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  processPurchase: (event, comboId) => {
    event.preventDefault();
    const combos = Storage.getCombos();
    const combo = combos.find(c => c.id === comboId);
    if (!combo) return;

    const name = document.getElementById('buyer-name').value.trim();
    const phone = document.getElementById('buyer-phone').value.trim();
    const paymentMethod = document.getElementById('buyer-payment-method').value;
    
    const receiptUrl = TicketsModule.selectedReceiptBase64 || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600";

    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    let prefix = "SZ-";
    if (combo.discipline === 'boxeo') prefix = "SZ-BX-";
    else if (combo.discipline === 'taekwondo') prefix = "SZ-TK-";
    else if (combo.discipline === 'defensa-personal') prefix = "SZ-DP-";
    
    const uniqueCode = prefix + randomDigits;
    const now = new Date();

    const newTx = {
      id: "tx-" + Math.random().toString(36).substring(2, 9),
      uniqueCode: uniqueCode,
      type: "combo",
      comboId: combo.id,
      title: combo.title,
      discipline: combo.discipline,
      disciplineLabel: combo.disciplineLabel,
      studentName: name,
      studentPhone: phone,
      studentEmail: "",
      amount: combo.price,
      paymentMethod: paymentMethod,
      receiptUrl: receiptUrl,
      status: "pending",
      createdAt: now.toISOString(),
      approvedAt: null,
      expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      totalTickets: combo.totalTickets,
      remainingTickets: combo.totalTickets,
      history: [
        {
          action: "Registro de Compra",
          detail: `Comprobante de $${combo.price.toLocaleString('es-CO')} recibido. En espera de verificación de staff.`,
          date: now.toISOString()
        }
      ]
    };

    const transactions = Storage.getTransactions();
    transactions.unshift(newTx);
    Storage.saveTransactions(transactions);

    localStorage.setItem('safezone_last_searched_code', uniqueCode);

    TicketsModule.closePurchaseModal();
    TicketsModule.openSuccessCodeModal(newTx);
  },

  copyCodeFromModal: (code) => {
    navigator.clipboard.writeText(code).then(() => {
      const btnText = document.getElementById('copy-btn-text');
      if (btnText) btnText.innerHTML = "✅ ¡CÓDIGO COPIADO AL PORTAPAPELES!";
      App.showToast(`📋 ¡Código ${code} copiado con éxito! Guárdalo bien.`);
      setTimeout(() => {
        if (btnText) btnText.innerHTML = "📋 Copiar Mi Código Único";
      }, 3500);
    }).catch(() => {
      App.showToast(`📋 Código: ${code}`);
    });
  },

  pasteCodeIntoInput: async (inputId) => {
    try {
      const text = await navigator.clipboard.readText();
      const input = document.getElementById(inputId);
      if (input && text) {
        input.value = text.trim().toUpperCase();
        App.showToast(`📋 Código pegado: ${input.value}`);
      }
    } catch (err) {
      App.showToast('ℹ️ Puedes pegar tu código con Ctrl+V o manteniendo presionado la casilla.');
    }
  },

  openSuccessCodeModal: (tx) => {
    App.showSuccessCodeModal(tx);
  },

  closeDetailsModal: () => {
    const modal = document.getElementById('details-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  searchCode: (event) => {
    if (event) event.preventDefault();
    const input = document.getElementById('wallet-search-code-input');
    if (!input) return;
    TicketsModule.queriedCode = input.value.trim();
    TicketsModule.renderWallet();
  },

  renderWallet: () => {
    const container = document.getElementById('wallet-container');
    if (!container) return;

    const defaultCode = TicketsModule.queriedCode || localStorage.getItem('safezone_last_searched_code') || 'SZ-88210';
    const tx = Storage.findTransactionByCode(defaultCode);

    container.innerHTML = `
      <div class="glass-card rounded-3xl p-6 sm:p-8 mb-8 border border-pink-500/40 relative overflow-hidden bg-gradient-to-r from-pink-950/40 via-slate-950 to-slate-950 shadow-2xl">
        <div class="max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-950 border border-pink-700/50 text-pink-300 text-xs font-bold mb-3">
            <i data-lucide="search" class="w-3.5 h-3.5 text-pink-400"></i>
            <span>Consulta Pública por Código o Celular</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-white font-heading">Billetera Digital & Consulta de Tickets</h2>
          <p class="text-slate-300 text-xs sm:text-sm mt-1">
            Ingresa tu <strong class="text-pink-400">Código Único</strong> (ej: <code>SZ-88210</code>) o tu número de celular para ver cuántos tickets te quedan y si tu pago ya fue verificado.
          </p>

          <form onsubmit="TicketsModule.searchCode(event)" class="mt-5 flex flex-col sm:flex-row gap-2">
            <div class="relative flex-grow flex items-center">
              <i data-lucide="ticket" class="w-4 h-4 text-pink-400 absolute left-4 top-1/2 -translate-y-1/2"></i>
              <input type="text" id="wallet-search-code-input" value="${TicketsModule.queriedCode || defaultCode}" placeholder="Ingresa tu Código Único (ej: SZ-88210)..." 
                class="w-full pl-11 pr-24 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-pink-500 focus:outline-none uppercase">
              <button type="button" onclick="TicketsModule.pasteCodeIntoInput('wallet-search-code-input')" 
                class="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-pink-400 hover:text-white border border-pink-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer" title="Pegar código copiado">
                <i data-lucide="clipboard" class="w-3.5 h-3.5"></i>
                <span>Pegar</span>
              </button>
            </div>
            <button type="submit" 
              class="py-3 px-6 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0">
              <i data-lucide="search" class="w-4 h-4"></i>
              <span>Consultar Estado</span>
            </button>
          </form>
        </div>
      </div>

      ${!tx ? `
        <div class="glass-card rounded-2xl p-10 text-center border-dashed border-slate-800">
          <div class="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <i data-lucide="search-x" class="w-8 h-8"></i>
          </div>
          <h4 class="text-lg font-bold text-white mb-1">No se encontró información para el código ingresado</h4>
          <p class="text-xs text-slate-400 max-w-md mx-auto mb-4">Verifica que hayas escrito el código completo o comunícate con la administradora.</p>
          <button onclick="App.switchTab('combos')" class="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-md cursor-pointer">
            Comprar un Pase Nuevo
          </button>
        </div>
      ` : `
        const isSingleClass = tx.type === 'single_class' || tx.sessionId || tx.totalTickets === 1;

        return `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div class="lg:col-span-7">
            <div class="ticket-edge rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div class="ticket-notch-left"></div>
              <div class="ticket-notch-right"></div>

              <div class="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="text-xs font-black font-mono px-2.5 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-700/60 uppercase">
                      ${tx.uniqueCode}
                    </span>
                    ${tx.status === 'approved' ? `
                      <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center gap-1">
                        <i data-lucide="check-circle" class="w-3 h-3"></i> 🟢 ${isSingleClass ? 'Cupo Confirmado' : 'Pago Verificado & Activo'}
                      </span>
                    ` : tx.status === 'pending' ? `
                      <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/50 flex items-center gap-1">
                        <i data-lucide="clock" class="w-3 h-3"></i> 🟡 En Revisión por Staff
                      </span>
                    ` : `
                      <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-950 text-red-400 border border-red-700/50 flex items-center gap-1">
                        <i data-lucide="alert-circle" class="w-3 h-3"></i> 🔴 Rechazado
                      </span>
                    `}
                  </div>
                  <h3 class="text-2xl font-black text-white font-heading">${tx.title}</h3>
                  <p class="text-xs text-slate-300 mt-0.5">Alumna: <strong class="text-white font-semibold">${tx.studentName}</strong> (📱 ${tx.studentPhone})</p>
                </div>

                <div class="text-right shrink-0">
                  ${isSingleClass ? `
                    <span class="text-xs uppercase font-black px-3 py-1 rounded-xl bg-pink-950 text-pink-300 border border-pink-700/60 block">
                      🎟️ Entrada Individual
                    </span>
                  ` : `
                    <span class="text-3xl sm:text-4xl font-black text-pink-400 font-heading">${tx.remainingTickets}</span>
                    <span class="text-xs text-slate-400 block">/ ${tx.totalTickets} tickets libres</span>
                  `}
                </div>
              </div>

              ${!isSingleClass ? `
                <div class="w-full bg-slate-950 rounded-full h-3 mb-6 overflow-hidden border border-slate-800">
                  <div class="bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 h-3 rounded-full transition-all duration-500" 
                    style="width: ${(tx.remainingTickets / tx.totalTickets) * 100}%"></div>
                </div>
              ` : ''}

              <!-- DETALLES DE LA TRANSACCIÓN O SESIÓN -->
              ${isSingleClass ? `
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs mb-4">
                  <div>
                    <span class="text-slate-500 block text-[10px] uppercase font-bold">Fecha de la Clase:</span>
                    <span class="text-pink-300 font-bold block truncate">${tx.sessionDate || 'Fecha Programada'}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[10px] uppercase font-bold">Horario:</span>
                    <span class="text-slate-200 font-semibold">${tx.sessionTime || 'Horario asignado'}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[10px] uppercase font-bold">Lugar:</span>
                    <span class="text-slate-200 font-semibold truncate block">${tx.sessionLocation || 'Sede Bogotá'}</span>
                  </div>
                </div>

                <div class="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-xs text-slate-300 space-y-1 mb-5">
                  <div class="flex items-center gap-1.5 text-amber-400 font-bold">
                    <i data-lucide="alert-triangle" class="w-4 h-4"></i>
                    <span>Términos de la Sesión:</span>
                  </div>
                  <p class="text-[11px] leading-relaxed">
                    Válido <strong>únicamente para esta clase específica</strong>. Si no asistes ese día, <strong>no habrá reembolso de dinero ni reprogramación</strong>. Tu cupo ya queda reservado una vez aprobado.
                  </p>
                </div>
              ` : `
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs mb-6">
                  <div>
                    <span class="text-slate-500 block text-[10px] uppercase font-bold">Cobertura:</span>
                    <span class="text-pink-300 font-semibold block truncate">${tx.discipline === 'all' ? '🌐 Todas las Artes' : tx.discipline.toUpperCase()}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[10px] uppercase font-bold">Fecha Compra:</span>
                    <span class="text-slate-300 font-semibold">${new Date(tx.createdAt).toLocaleDateString('es-CO')}</span>
                  </div>
                  <div>
                    <span class="text-slate-500 block text-[10px] uppercase font-bold">Vigencia (60 Días):</span>
                    <span class="font-bold ${tx.status === 'approved' ? 'text-pink-400' : 'text-slate-500'}">
                      ${tx.status === 'approved' ? new Date(tx.expiryDate).toLocaleDateString('es-CO') : 'Al verificarse'}
                    </span>
                  </div>
                </div>
              `}

              <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                ${!isSingleClass && tx.status === 'approved' && tx.remainingTickets > 0 ? `
                  <button onclick="SessionsModule.setFilter('${tx.discipline === 'all' ? 'all' : tx.discipline}'); App.switchTab('sessions');" 
                    class="w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <i data-lucide="calendar-check" class="w-4 h-4"></i>
                    <span>Redimir Ticket en una Clase Ahora</span>
                  </button>
                ` : isSingleClass && tx.status === 'approved' ? `
                  <div class="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-700/50 text-xs text-emerald-300 flex items-center gap-2">
                    <i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i>
                    <span>¡Cupo confirmado! Solo debes presentar tu código al instructor al llegar.</span>
                  </div>
                ` : tx.status === 'pending' ? `
                  <div class="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 text-xs text-amber-300 flex items-center gap-2 w-full">
                    <i data-lucide="info" class="w-4 h-4 shrink-0"></i>
                    <span>Tu pago está en cola de revisión. Se habilitará inmediatamente cuando la administradora dé el visto bueno.</span>
                  </div>
                ` : `
                  <span class="text-xs text-slate-500 font-semibold">Transacción no activa</span>
                `}

                <button onclick="TicketsModule.copyCodeFromModal('${tx.uniqueCode}')" 
                  class="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0">
                  <i data-lucide="copy" class="w-3.5 h-3.5 text-pink-400"></i>
                  <span>Copiar Código</span>
                </button>
              </div>

            </div>
          </div>

          <div class="lg:col-span-5 space-y-4">
            
            <div class="glass-card rounded-2xl p-5 border border-slate-800">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-white flex items-center gap-1.5">
                  <i data-lucide="image" class="w-4 h-4 text-pink-400"></i> Comprobante Adjunto
                </span>
                <span class="text-[10px] text-slate-400">${tx.paymentMethod}</span>
              </div>
              <div class="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer group" onclick="TicketsModule.openReceiptZoomModal('${tx.receiptUrl}', '${tx.uniqueCode}')">
                <img src="${tx.receiptUrl}" alt="Comprobante" class="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-bold">
                  <i data-lucide="maximize-2" class="w-4 h-4"></i> Clic para ampliar foto
                </div>
              </div>
            </div>

            <div class="glass-card rounded-2xl p-5 border border-slate-800">
              <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <i data-lucide="history" class="w-4 h-4 text-pink-400"></i> Historial de Movimientos
              </h4>
              <div class="space-y-2.5 max-h-48 overflow-y-auto pr-1 text-xs">
                ${tx.history && tx.history.length > 0 ? tx.history.map(h => `
                  <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-pink-300 text-xs">${h.action}</span>
                      <span class="text-[10px] text-slate-500">${new Date(h.date).toLocaleDateString('es-CO')}</span>
                    </div>
                    <p class="text-slate-400 text-[11px] mt-0.5">${h.detail}</p>
                  </div>
                `).join('') : `
                  <p class="text-slate-500 text-xs">Sin movimientos registrados.</p>
                `}
              </div>
            </div>

          </div>

        </div>
      `}
    `;

    if (window.lucide) lucide.createIcons();
  },

  openReceiptZoomModal: (imgUrl, code) => {
    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="p-6 text-center max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <span class="text-xs font-bold text-pink-400 font-mono">Comprobante de Pago • ${code}</span>
          <button onclick="TicketsModule.closeDetailsModal()" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <img src="${imgUrl}" alt="Comprobante" class="max-h-[70vh] mx-auto rounded-2xl border border-slate-800 shadow-2xl object-contain">
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  }
};

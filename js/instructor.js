/**
 * Módulo de Administradora & Profesores - SAFE ZONE CLUB
 * Hoja de Transacciones, Aprobación de Pagos, Planificador de Clases, Gestión de Combos 3+1 y CRUD de Profesores
 * Soporte de Subida de Fotos Local (Archivos) y Pegado desde Portapapeles (Ctrl+V)
 */

const InstructorModule = {
  activeSubTab: 'transactions', // 'transactions' | 'calendar' | 'combos' | 'instructors_manage'
  selectedInstructorId: 'inst-1',
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  selectedBatchDays: [],
  txFilter: 'all',
  currentInstructorAvatarBase64: null,

  isAuthenticated: () => {
    return localStorage.getItem('safezone_auth_token') === 'authenticated_staff_2026';
  },

  getCustomPassword: () => {
    return localStorage.getItem('safezone_custom_pass') || 'safezone2026';
  },

  login: (event) => {
    event.preventDefault();
    const user = document.getElementById('auth-username').value.trim().toLowerCase();
    const pass = document.getElementById('auth-password').value.trim();
    const errorEl = document.getElementById('auth-error-msg');

    const validUsers = ['admin', 'profesor', 'safezone', 'staff', 'administradora', 'carlos', 'andrea', 'jinwoo', 'mateo'];
    const validPass = InstructorModule.getCustomPassword();

    if (validUsers.includes(user) && (pass === validPass || pass === 'admin123' || pass === 'safezone2026' || pass === 'profesor2026')) {
      localStorage.setItem('safezone_auth_token', 'authenticated_staff_2026');
      localStorage.setItem('safezone_logged_user', user);
      if (errorEl) errorEl.classList.add('hidden');
      App.showToast('🔓 ¡Bienvenida Administradora / Staff a SAFE ZONE CLUB!');
      InstructorModule.activeSubTab = 'transactions';
      InstructorModule.renderInstructorPortal();
    } else {
      if (errorEl) {
        errorEl.textContent = '❌ Credenciales incorrectas. Verifica tu usuario y contraseña.';
        errorEl.classList.remove('hidden');
      }
    }
  },

  logout: () => {
    localStorage.removeItem('safezone_auth_token');
    localStorage.removeItem('safezone_logged_user');
    App.showToast('🔒 Sesión administrativa cerrada.');
    InstructorModule.renderInstructorPortal();
  },

  togglePasswordVisibility: () => {
    const input = document.getElementById('auth-password');
    const icon = document.getElementById('eye-icon');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    } else {
      input.type = 'password';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) lucide.createIcons();
  },

  switchSubTab: (subTab) => {
    InstructorModule.activeSubTab = subTab;
    InstructorModule.renderInstructorPortal();
  },

  setTxFilter: (filter) => {
    InstructorModule.txFilter = filter;
    InstructorModule.renderInstructorPortal();
  },

  // --- APROBACIÓN Y RECHAZO DE PAGOS ---
  approveTransaction: (txId) => {
    if (!InstructorModule.isAuthenticated()) return;
    const ok = Storage.updateTransactionStatus(txId, 'approved');
    if (ok) {
      App.showToast('✅ ¡Pago Aprobado! El código único y los tickets han sido activados.');
      InstructorModule.renderInstructorPortal();
      if (window.TicketsModule) TicketsModule.renderWallet();
      if (window.App) App.updateWalletBadge();
    }
  },

  rejectTransaction: (txId) => {
    if (!InstructorModule.isAuthenticated()) return;
    const reason = prompt('Indica el motivo del rechazo (ej: No figura en extracto, valor incompleto):', 'Comprobante no recibido en cuenta.');
    if (reason === null) return;

    const ok = Storage.updateTransactionStatus(txId, 'rejected', reason);
    if (ok) {
      App.showToast('❌ Transacción marcada como rechazada.');
      InstructorModule.renderInstructorPortal();
      if (window.TicketsModule) TicketsModule.renderWallet();
    }
  },

  sendApprovalWhatsApp: (txId) => {
    const txs = Storage.getTransactions();
    const tx = txs.find(t => t.id === txId);
    if (!tx) return;

    const cleanPhone = (tx.studentPhone || '').replace(/[^0-9]/g, '');
    const isSingleClass = tx.type === 'single_class' || tx.sessionId || tx.totalTickets === 1;

    let msg = '';
    if (isSingleClass) {
      msg = `🛡️ *SAFE ZONE CLUB - CUPO CONFIRMADO* ✅\n\n¡Hola *${tx.studentName}*! Tu pago de *$${tx.amount.toLocaleString('es-CO')} COP* para la clase *${tx.title}* ha sido verificado con éxito.\n\n🎟️ *Tu Código de Entrada es:*\n👉 *${tx.uniqueCode}*\n\n📅 *Fecha:* ${tx.sessionDate || 'Fecha programada'} (${tx.sessionTime || ''})\n📍 *Lugar:* ${tx.sessionLocation || 'Sede Bogotá'}\n\n⚠️ *Recordatorio importante:* Este pase es válido *únicamente para esta clase en la fecha indicada*. En caso de inasistencia, *no habrá reembolso ni reprogramación*.\n\n¡Te esperamos en entrenamiento! 👊✨`;
    } else {
      msg = `🛡️ *SAFE ZONE CLUB - PAGO VERIFICADO* ✅\n\n¡Hola *${tx.studentName}*! Tu pago de *$${tx.amount.toLocaleString('es-CO')} COP* por el *${tx.title}* ha sido verificado con éxito.\n\n🎟️ *Tu Código Único de Transacción es:*\n👉 *${tx.uniqueCode}*\n\n📊 *Saldo de Tickets:* ${tx.remainingTickets} tickets listos para usar.\n⏳ *Vigencia:* 60 días continuos a partir de hoy.\n\n🌐 Ya puedes ingresar a la página web de Safe Zone Club y redimir tus cupos en cualquier clase con tu código.\n\n¡Nos vemos en entrenamiento! 👊✨`;
    }

    const waUrl = `https://wa.me/57${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  },

  openReceiptModal: (imgUrl, code) => {
    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="p-6 text-center max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <span class="text-xs font-bold text-pink-400 font-mono">Comprobante de Pago • ${code}</span>
          <button onclick="InstructorModule.closeDetailsModal()" class="text-slate-400 hover:text-white p-1 rounded-lg">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <img src="${imgUrl}" alt="Comprobante" class="max-h-[70vh] mx-auto rounded-2xl border border-slate-800 shadow-2xl object-contain">
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeDetailsModal: () => {
    const modal = document.getElementById('details-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  // --- MANEJO DE FOTO DE PROFESOR (SUBIDA DE ARCHIVO, PEGAR PORTAPAPELES Y DROP) ---
  updateAvatarPreview: (imageUrl) => {
    const previewWrap = document.getElementById('inst-avatar-preview-wrap');
    const placeholder = document.getElementById('inst-avatar-placeholder');
    const previewImg = document.getElementById('inst-avatar-preview-img');

    if (imageUrl) {
      InstructorModule.currentInstructorAvatarBase64 = imageUrl;
      if (previewImg) previewImg.src = imageUrl;
      if (previewWrap) previewWrap.classList.remove('hidden');
      if (placeholder) placeholder.classList.add('hidden');
    } else {
      InstructorModule.currentInstructorAvatarBase64 = null;
      if (previewWrap) previewWrap.classList.add('hidden');
      if (placeholder) placeholder.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();
  },

  handleInstructorAvatarFile: (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      InstructorModule.updateAvatarPreview(e.target.result);
      App.showToast('🖼️ ¡Foto cargada desde tu carpeta con éxito!');
    };
    reader.readAsDataURL(file);
  },

  handleAvatarDrop: (event) => {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          InstructorModule.updateAvatarPreview(e.target.result);
          App.showToast('🖼️ ¡Foto soltada y cargada con éxito!');
        };
        reader.readAsDataURL(file);
      }
    }
  },

  handleAvatarPasteEvent: (event) => {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          InstructorModule.updateAvatarPreview(e.target.result);
          App.showToast('📋 ¡Foto pegada desde el portapapeles con éxito!');
        };
        reader.readAsDataURL(blob);
        event.preventDefault();
        break;
      }
    }
  },

  pasteImageFromClipboard: () => {
    if (navigator.clipboard && navigator.clipboard.read) {
      navigator.clipboard.read().then(items => {
        let foundImage = false;
        for (const item of items) {
          const imageType = item.types.find(type => type.startsWith('image/'));
          if (imageType) {
            foundImage = true;
            item.getType(imageType).then(blob => {
              const reader = new FileReader();
              reader.onload = (e) => {
                InstructorModule.updateAvatarPreview(e.target.result);
                App.showToast('📋 ¡Foto pegada desde el portapapeles con éxito!');
              };
              reader.readAsDataURL(blob);
            });
            break;
          }
        }
        if (!foundImage) {
          App.showToast('ℹ️ No se detectó ninguna imagen en el portapapeles. Copia una imagen o captura primero.');
        }
      }).catch(() => {
        const urlOrDirect = prompt('Pega aquí la URL de la imagen o presiona Ctrl+V dentro del recuadro:');
        if (urlOrDirect && urlOrDirect.trim().length > 0) {
          InstructorModule.updateAvatarPreview(urlOrDirect.trim());
        }
      });
    } else {
      App.showToast('ℹ️ Haz clic sobre el recuadro punteado y presiona Ctrl + V para pegar la imagen.');
    }
  },

  handleInstructorAvatarUrl: (url) => {
    const trimmed = url.trim();
    if (trimmed.length > 5) {
      InstructorModule.updateAvatarPreview(trimmed);
    }
  },

  renderInstructorPortal: () => {
    const container = document.getElementById('instructor-portal-container');
    if (!container) return;

    if (!InstructorModule.isAuthenticated()) {
      container.innerHTML = `
        <div class="max-w-md mx-auto my-6">
          <div class="glass-card rounded-3xl p-6 sm:p-8 border border-pink-500/40 shadow-2xl shadow-pink-600/20 relative overflow-hidden">
            <div class="text-center mb-6 relative z-10">
              <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-600 p-0.5 mx-auto mb-3 shadow-lg shadow-pink-600/40">
                <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <i data-lucide="shield-check" class="w-8 h-8 text-pink-400"></i>
                </div>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-pink-950/80 text-pink-300 border border-pink-700/50 inline-block mb-2">
                Acceso Exclusivo • Administradora & Profesores
              </span>
              <h2 class="text-2xl font-black text-white font-heading">Portal de Aprobación & Gestión</h2>
              <p class="text-xs text-slate-400 mt-1">Ingresa para revisar comprobantes de pago, activar códigos únicos de alumnas, editar combos 3+1, planificar horarios y gestionar profesores.</p>
            </div>

            <form onsubmit="InstructorModule.login(event)" class="space-y-4 relative z-10">
              <div id="auth-error-msg" class="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-semibold hidden"></div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Usuario de Administradora / Profesor</label>
                <div class="relative">
                  <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="text" id="auth-username" required placeholder="Ej: admin o profesor" 
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label>
                <div class="relative">
                  <i data-lucide="key-round" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                  <input type="password" id="auth-password" required placeholder="••••••••" 
                    class="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
                  <button type="button" onclick="InstructorModule.togglePasswordVisibility()" class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    <i data-lucide="eye" id="eye-icon" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>

              <div class="pt-2">
                <button type="submit" 
                  class="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <i data-lucide="log-in" class="w-4 h-4"></i>
                  <span>Ingresar al Portal</span>
                </button>
              </div>

              <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1 mt-4">
                <div class="flex items-center gap-1.5 text-pink-400 font-bold">
                  <i data-lucide="info" class="w-3.5 h-3.5"></i>
                  <span>Credenciales por Defecto:</span>
                </div>
                <p>Usuario: <code class="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">admin</code> o <code class="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">profesor</code></p>
                <p>Contraseña: <code class="text-pink-300 bg-slate-800 px-1.5 py-0.5 rounded font-mono">safezone2026</code></p>
              </div>
            </form>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const transactions = Storage.getTransactions();
    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const loggedUser = localStorage.getItem('safezone_logged_user') || 'Administradora';

    container.innerHTML = `
      <!-- Barra Superior de Administrador -->
      <div class="glass-card rounded-2xl p-4 sm:p-5 mb-6 border border-pink-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-pink-950/40 via-slate-950 to-slate-950">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
            <i data-lucide="shield-check" class="w-5 h-5"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-black uppercase tracking-wider text-pink-400">Panel de Control Activo</span>
              <span class="text-[10px] px-2 py-0.5 rounded bg-pink-950 text-pink-300 font-bold border border-pink-700/50">${loggedUser.toUpperCase()}</span>
            </div>
            <p class="text-xs text-slate-300">Aprobación de comprobantes, gestión de combos 3+1, planificador de clases y profesores.</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="InstructorModule.logout()" 
            class="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold border border-red-500/20 transition-colors flex items-center gap-1.5 cursor-pointer">
            <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <!-- Selector de 4 Pestañas: 1. Transacciones | 2. Planificador | 3. Combos 3+1 | 4. Profesores & Staff -->
      <div class="flex items-center gap-2 sm:gap-3 mb-6 border-b border-slate-800 pb-4 overflow-x-auto">
        <button onclick="InstructorModule.switchSubTab('transactions')" 
          class="px-4 sm:px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${InstructorModule.activeSubTab === 'transactions' ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'}">
          <i data-lucide="file-check-2" class="w-4 h-4"></i>
          <span>1. Hoja de Transacciones</span>
          ${pendingCount > 0 ? `<span class="px-2 py-0.5 rounded-full bg-amber-400 text-black font-black text-[10px] animate-pulse">${pendingCount}</span>` : `<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">0</span>`}
        </button>

        <button onclick="InstructorModule.switchSubTab('calendar')" 
          class="px-4 sm:px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${InstructorModule.activeSubTab === 'calendar' ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'}">
          <i data-lucide="calendar" class="w-4 h-4"></i>
          <span>2. Planificador de Clases</span>
        </button>

        <button onclick="InstructorModule.switchSubTab('combos')" 
          class="px-4 sm:px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${InstructorModule.activeSubTab === 'combos' ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'}">
          <i data-lucide="ticket" class="w-4 h-4"></i>
          <span>3. Gestión de Combos 3+1</span>
        </button>

        <button onclick="InstructorModule.switchSubTab('instructors_manage')" 
          class="px-4 sm:px-5 py-3 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${InstructorModule.activeSubTab === 'instructors_manage' ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 text-white shadow-lg shadow-pink-600/30' : 'bg-slate-900 text-slate-400 hover:text-white'}">
          <i data-lucide="users" class="w-4 h-4"></i>
          <span>4. Gestión de Profesores & Staff</span>
        </button>
      </div>

      <!-- VISTA DINÁMICA -->
      ${InstructorModule.activeSubTab === 'transactions' ? InstructorModule.renderTransactionsSheet() : 
        InstructorModule.activeSubTab === 'calendar' ? InstructorModule.renderCalendarSection() : 
        InstructorModule.activeSubTab === 'combos' ? InstructorModule.renderCombosManagementSection() :
        InstructorModule.renderInstructorsManagementSection()}
    `;

    if (window.lucide) lucide.createIcons();
  },

  // --- 1. HOJA DE TRANSACCIONES ---
  renderTransactionsSheet: () => {
    const transactions = Storage.getTransactions();
    const filter = InstructorModule.txFilter;

    const filtered = transactions.filter(t => {
      if (filter === 'all') return true;
      return t.status === filter;
    });

    const pendingCount = transactions.filter(t => t.status === 'pending').length;
    const approvedCount = transactions.filter(t => t.status === 'approved').length;
    const rejectedCount = transactions.filter(t => t.status === 'rejected').length;

    return `
      <div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 class="text-xl font-extrabold text-white font-heading flex items-center gap-2">
              <i data-lucide="file-spreadsheet" class="w-5 h-5 text-pink-500"></i> Hoja de Control de Pagos & Activación de Códigos
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Revisa el comprobante subido por la alumna y pulsa <strong class="text-emerald-400">"Aprobar Pago y Activar Tickets"</strong> para habilitar su código único.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button onclick="InstructorModule.setTxFilter('all')" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === 'all' ? 'bg-pink-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}">
              Todas (${transactions.length})
            </button>
            <button onclick="InstructorModule.setTxFilter('pending')" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${filter === 'pending' ? 'bg-amber-500 text-black font-extrabold' : 'bg-slate-900 text-amber-400 hover:text-white'}">
              🟡 Pendientes (${pendingCount})
            </button>
            <button onclick="InstructorModule.setTxFilter('approved')" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === 'approved' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-emerald-400 hover:text-white'}">
              🟢 Aprobadas (${approvedCount})
            </button>
            <button onclick="InstructorModule.setTxFilter('rejected')" 
              class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-slate-900 text-red-400 hover:text-white'}">
              🔴 Rechazadas (${rejectedCount})
            </button>
          </div>
        </div>

        ${filtered.length === 0 ? `
          <div class="glass-card rounded-2xl p-10 text-center text-slate-400 border-dashed border-slate-800">
            <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 text-slate-600"></i>
            <p class="text-sm font-semibold text-white">No hay transacciones registradas en esta vista (${filter})</p>
          </div>
        ` : `
          <div class="space-y-4">
            ${filtered.map(tx => {
              const isPending = tx.status === 'pending';
              const isApproved = tx.status === 'approved';
              const isRejected = tx.status === 'rejected';

              return `
                <div class="glass-card rounded-2xl p-5 sm:p-6 border ${isPending ? 'border-amber-500/60 bg-amber-950/20 shadow-lg shadow-amber-950/30' : 'border-slate-800'} relative overflow-hidden">
                  <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    
                    <div class="flex items-start gap-4">
                      <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-pink-500/50 bg-slate-950 shrink-0 cursor-pointer group"
                        onclick="InstructorModule.openReceiptModal('${tx.receiptUrl}', '${tx.uniqueCode}')" title="Clic para ver foto del comprobante en grande">
                        <img src="${tx.receiptUrl}" alt="Comprobante" class="w-full h-full object-cover group-hover:scale-110 transition-transform">
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          <i data-lucide="zoom-in" class="w-4 h-4"></i>
                        </div>
                      </div>

                      <div class="space-y-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="text-sm font-black font-mono px-3 py-1 rounded-lg bg-pink-950 text-pink-300 border border-pink-700/70 uppercase select-all">
                            🎟️ ${tx.uniqueCode}
                          </span>
                          
                          ${isApproved ? (
                            (tx.type === 'single_class' || tx.sessionId || tx.totalTickets === 1) ? `
                              <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> CUPO CONFIRMADO (${tx.sessionDate || 'Clase'})
                              </span>
                            ` : `
                              <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/60 flex items-center gap-1">
                                <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> APROBADO & ACTIVO (${tx.remainingTickets}/${tx.totalTickets} tickets)
                              </span>
                            `
                          ) : isPending ? `
                            <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-600/70 animate-pulse flex items-center gap-1">
                              <i data-lucide="clock" class="w-3.5 h-3.5"></i> PENDIENTE DE REVISIÓN
                            </span>
                          ` : `
                            <span class="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-700/60 flex items-center gap-1">
                              <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> RECHAZADO
                            </span>
                          `}
                        </div>

                        <h4 class="text-base font-bold text-white font-heading">${tx.studentName}</h4>
                        
                        <div class="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>📱 Tel: <strong>${tx.studentPhone}</strong></span>
                          <span>•</span>
                          <span>📦 ${tx.type === 'single_class' ? 'Clase' : 'Paquete'}: <strong>${tx.title}</strong></span>
                          ${tx.sessionDate ? `<span>•</span><span>📅 <strong>${tx.sessionDate} (${tx.sessionTime || ''})</strong></span>` : ''}
                          <span>•</span>
                          <span class="text-pink-400 font-bold">$${tx.amount.toLocaleString('es-CO')} COP</span>
                          <span>•</span>
                          <span class="text-slate-400">${tx.paymentMethod}</span>
                        </div>

                        <div class="text-[11px] text-slate-500 pt-1">
                          📅 Fecha de Compra: ${new Date(tx.createdAt).toLocaleString('es-CO')} ${tx.approvedAt ? `• Aprobado: ${new Date(tx.approvedAt).toLocaleDateString('es-CO')}` : ''}
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                      ${isPending ? `
                        <button onclick="InstructorModule.approveTransaction('${tx.id}')" 
                          class="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5">
                          <i data-lucide="check-circle-2" class="w-4 h-4"></i>
                          <span>Aprobar Pago y Activar Tickets</span>
                        </button>

                        <button onclick="InstructorModule.rejectTransaction('${tx.id}')" 
                          class="py-3 px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer">
                          <i data-lucide="x" class="w-3.5 h-3.5"></i>
                          <span>Rechazar</span>
                        </button>
                      ` : isApproved ? `
                        <button onclick="InstructorModule.sendApprovalWhatsApp('${tx.id}')" 
                          class="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Enviar confirmación oficial con su código por WhatsApp">
                          <i data-lucide="send" class="w-4 h-4"></i>
                          <span>Notificar por WhatsApp</span>
                        </button>
                      ` : `
                        <button onclick="InstructorModule.approveTransaction('${tx.id}')" 
                          class="py-2 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-slate-400 hover:text-white text-xs font-bold transition-colors">
                          Re-aprobar
                        </button>
                      `}

                      <button onclick="InstructorModule.openReceiptModal('${tx.receiptUrl}', '${tx.uniqueCode}')" 
                        class="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition-colors cursor-pointer" title="Ver foto del comprobante">
                        <i data-lucide="image" class="w-4 h-4 text-pink-400"></i>
                      </button>
                    </div>

                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  // --- 3. GESTIÓN DE COMBOS 3+1 & PRECIOS ---
  renderCombosManagementSection: () => {
    const combos = Storage.getCombos();

    return `
      <div>
        <div class="glass-card rounded-2xl p-6 mb-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-black uppercase tracking-wider text-pink-400">Catálogo de Ticketeras</span>
            <h3 class="text-xl sm:text-2xl font-black text-white font-heading flex items-center gap-2">
              <i data-lucide="ticket" class="w-6 h-6 text-pink-500"></i> Edición de Combos 3 + 1 & Tarifas
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Aquí puedes modificar los precios, nombres, descripciones y beneficios de cada combo 3+1 de Safe Zone Club.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="InstructorModule.resetCombosToDefault()" 
              class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Restablecer tarifas predeterminadas">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-pink-400"></i>
              <span>Restablecer Predeterminados</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${combos.map(combo => {
            let scopeLabel = combo.discipline === 'all' ? '🌐 Todas las Disciplinas (Universal)' : 
                             combo.discipline === 'boxeo' ? '🥊 Solo Boxeo' : 
                             combo.discipline === 'taekwondo' ? '🥋 Solo Taekwondo' : '🛡️ Solo Defensa Personal';

            return `
              <div class="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
                <div class="absolute top-4 right-4">
                  <span class="${combo.badgeColor || 'bg-pink-600'} text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
                    ${combo.badge || '3 + 1'}
                  </span>
                </div>

                <div>
                  <span class="text-[10px] font-bold text-pink-400 uppercase tracking-wider block mb-1">
                    ${scopeLabel}
                  </span>
                  
                  <h4 class="text-lg font-black text-white font-heading mb-2 pr-16">${combo.title}</h4>
                  <p class="text-xs text-slate-300 leading-relaxed mb-4">${combo.description}</p>

                  <div class="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4 space-y-2">
                    <div class="flex items-baseline justify-between">
                      <div>
                        <span class="text-[10px] uppercase text-slate-500 font-bold block">Tarifa Alumna:</span>
                        <span class="text-2xl font-black text-pink-400 font-heading">$${combo.price.toLocaleString('es-CO')} <span class="text-xs font-normal text-slate-400">COP</span></span>
                      </div>
                      <div class="text-right">
                        <span class="text-[10px] uppercase text-slate-500 font-bold block">Precio Regular:</span>
                        <span class="text-sm font-semibold text-slate-500 line-through">$${combo.regularPrice.toLocaleString('es-CO')} COP</span>
                      </div>
                    </div>

                    <div class="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-300">
                      <span class="text-emerald-400 font-bold">🎟️ ${combo.totalTickets || 4} Tickets (${combo.paidSessions || 3} pagados + ${combo.freeTickets || 1} gratis)</span>
                      <span class="text-pink-300 font-medium">⏳ ${combo.validityDays || 60} días</span>
                    </div>
                  </div>

                  <div class="mb-5">
                    <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Beneficios Incluidos:</span>
                    <ul class="space-y-1 text-xs text-slate-300">
                      ${combo.features ? combo.features.map(f => `
                        <li class="flex items-center gap-1.5 text-[11px]">
                          <i data-lucide="check" class="w-3 h-3 text-pink-400 shrink-0"></i>
                          <span>${f}</span>
                        </li>
                      `).join('') : ''}
                    </ul>
                  </div>
                </div>

                <div class="pt-4 border-t border-slate-800">
                  <button onclick="InstructorModule.openEditComboModal('${combo.id}')" 
                    class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                    <span>Editar Tarifas & Detalles</span>
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  openEditComboModal: (comboId) => {
    if (!InstructorModule.isAuthenticated()) return;
    const combos = Storage.getCombos();
    const combo = combos.find(c => c.id === comboId);
    if (!combo) return;

    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-modal-content');
    if (!modal || !modalContent) return;

    const featuresText = (combo.features || []).join('\n');

    modalContent.innerHTML = `
      <div class="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <i data-lucide="ticket" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white font-heading">Editar Combo 3 + 1</h3>
              <p class="text-xs text-slate-400">Modifica el precio, tickets o beneficios</p>
            </div>
          </div>
          <button onclick="InstructorModule.closeDetailsModal()" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="InstructorModule.processEditCombo(event, '${combo.id}')" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nombre del Combo *</label>
            <input type="text" id="edit-combo-title" required value="${combo.title}" 
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Disciplina / Cobertura *</label>
              <select id="edit-combo-discipline" class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
                <option value="all" ${combo.discipline === 'all' ? 'selected' : ''}>🌐 Todas las Disciplinas (Pase Universal)</option>
                <option value="boxeo" ${combo.discipline === 'boxeo' ? 'selected' : ''}>🥊 Solo Boxeo</option>
                <option value="taekwondo" ${combo.discipline === 'taekwondo' ? 'selected' : ''}>🥋 Solo Taekwondo</option>
                <option value="defensa-personal" ${combo.discipline === 'defensa-personal' ? 'selected' : ''}>🛡️ Solo Defensa Personal</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Etiqueta / Badge *</label>
              <input type="text" id="edit-combo-badge" required value="${combo.badge || '🔥 ALL-ACCESS'}" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Precio de Venta ($ COP) *</label>
              <input type="number" id="edit-combo-price" required step="1000" value="${combo.price}" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-pink-400 font-bold text-sm focus:border-pink-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Precio Regular de Referencia ($ COP) *</label>
              <input type="number" id="edit-combo-regular-price" required step="1000" value="${combo.regularPrice}" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Total Tickets Recibidos *</label>
              <input type="number" id="edit-combo-total-tickets" required min="1" max="10" value="${combo.totalTickets || 4}" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Clases Cobradas *</label>
              <input type="number" id="edit-combo-paid-sessions" required min="1" max="10" value="${combo.paidSessions || 3}" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Días de Vigencia *</label>
              <input type="number" id="edit-combo-validity" required min="15" max="365" value="${combo.validityDays || 60}" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Descripción Corta *</label>
            <textarea id="edit-combo-description" rows="2" required 
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">${combo.description}</textarea>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Beneficios Incluidos (Uno por línea) *</label>
            <textarea id="edit-combo-features" rows="4" required placeholder="4 Tickets válidos para cualquier disciplina&#10;Vigencia extendida de 60 días&#10;Ahorro de $10.000 COP"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">${featuresText}</textarea>
          </div>

          <div class="pt-3 flex gap-3">
            <button type="button" onclick="InstructorModule.closeDetailsModal()" 
              class="w-1/3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" 
              class="w-2/3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Guardar Cambios del Combo</span>
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  processEditCombo: (event, comboId) => {
    event.preventDefault();
    if (!InstructorModule.isAuthenticated()) return;

    const title = document.getElementById('edit-combo-title').value.trim();
    const discipline = document.getElementById('edit-combo-discipline').value;
    const badge = document.getElementById('edit-combo-badge').value.trim();
    const price = parseInt(document.getElementById('edit-combo-price').value, 10) || 30000;
    const regularPrice = parseInt(document.getElementById('edit-combo-regular-price').value, 10) || 40000;
    const totalTickets = parseInt(document.getElementById('edit-combo-total-tickets').value, 10) || 4;
    const paidSessions = parseInt(document.getElementById('edit-combo-paid-sessions').value, 10) || 3;
    const validityDays = parseInt(document.getElementById('edit-combo-validity').value, 10) || 60;
    const description = document.getElementById('edit-combo-description').value.trim();
    const featuresRaw = document.getElementById('edit-combo-features').value.trim();
    const features = featuresRaw.split('\n').map(f => f.trim()).filter(f => f.length > 0);

    let disciplineLabel = 'Todas las Disciplinas (Multidisciplinario)';
    let badgeColor = 'bg-pink-600';
    if (discipline === 'boxeo') {
      disciplineLabel = 'Solo Boxeo Olímpico';
      badgeColor = 'bg-rose-600';
    } else if (discipline === 'taekwondo') {
      disciplineLabel = 'Solo Taekwondo WT';
      badgeColor = 'bg-purple-600';
    } else if (discipline === 'defensa-personal') {
      disciplineLabel = 'Solo Defensa Personal Urbana';
      badgeColor = 'bg-pink-600';
    }

    const updatedData = {
      title,
      discipline,
      disciplineLabel,
      badge,
      badgeColor,
      price,
      regularPrice,
      savings: Math.max(0, regularPrice - price),
      totalTickets,
      paidSessions,
      freeTickets: Math.max(0, totalTickets - paidSessions),
      validityDays,
      description,
      features
    };

    Storage.updateCombo(comboId, updatedData);

    InstructorModule.closeDetailsModal();
    InstructorModule.renderInstructorPortal();
    if (window.TicketsModule) TicketsModule.renderCombos();

    App.showToast(`🏷️ ¡Combo "${title}" actualizado correctamente!`);
  },

  resetCombosToDefault: () => {
    if (!InstructorModule.isAuthenticated()) return;
    if (!confirm('¿Deseas restablecer los combos a los valores y precios iniciales?')) return;

    localStorage.removeItem('safezone_combos');
    InstructorModule.renderInstructorPortal();
    if (window.TicketsModule) TicketsModule.renderCombos();
    App.showToast('🔄 Tarifas de combos 3+1 restablecidas a valores oficiales.');
  },

  // --- 4. GESTIÓN DE PROFESORES & STAFF (CRUD CON DISCIPLINAS MÚLTIPLES) ---
  renderInstructorsManagementSection: () => {
    const instructors = Storage.getInstructors();

    return `
      <div>
        <div class="glass-card rounded-2xl p-6 mb-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span class="text-xs font-black uppercase tracking-wider text-pink-400">Equipo Técnico & Entrenadores</span>
            <h3 class="text-xl sm:text-2xl font-black text-white font-heading flex items-center gap-2">
              <i data-lucide="users" class="w-6 h-6 text-pink-500"></i> Gestión de Profesores & Staff
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Agrega nuevos entrenadores con fotos desde tu equipo o portapapeles, asigna múltiples disciplinas y gestiona la nómina.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="InstructorModule.openCreateInstructorModal()" 
              class="py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-black text-xs shadow-lg shadow-pink-600/30 transition-all flex items-center gap-2 cursor-pointer">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              <span>➕ Añadir Nuevo Profesor</span>
            </button>

            <button onclick="InstructorModule.resetInstructorsToDefault()" 
              class="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" title="Restablecer profesores originales">
              <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${instructors.map(inst => {
            const discs = inst.disciplines && inst.disciplines.length > 0 ? inst.disciplines : [inst.discipline];
            const badgesHtml = discs.map(d => {
              if (d === 'boxeo') return `<span class="badge-boxeo text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">🥊 Boxeo</span>`;
              if (d === 'taekwondo') return `<span class="badge-taekwondo text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">🥋 Taekwondo</span>`;
              if (d === 'defensa-personal') return `<span class="badge-defensa text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">🛡️ Defensa Personal</span>`;
              return `<span class="bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">⚡ ${d}</span>`;
            }).join(' ');

            return `
              <div class="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
                <div>
                  <div class="flex items-start gap-4 mb-4">
                    <img src="${inst.avatar}" alt="${inst.name}" class="w-16 h-16 rounded-2xl object-cover border-2 border-pink-500/50 shadow-md">
                    <div class="min-w-0 flex-grow">
                      <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
                        ${badgesHtml}
                      </div>
                      <h4 class="text-lg font-bold text-white font-heading truncate">${inst.name}</h4>
                      <p class="text-xs text-pink-400 font-medium">${inst.title}</p>
                    </div>
                  </div>

                  <p class="text-slate-300 text-xs leading-relaxed mb-4 line-clamp-3">${inst.bio}</p>

                  <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs mb-4">
                    <span class="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Trayectoria & Experiencia:</span>
                    <span class="text-slate-300 font-medium">${inst.experience}</span>
                  </div>
                </div>

                <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button onclick="InstructorModule.openEditInstructorModal('${inst.id}')" 
                    class="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                    <i data-lucide="edit" class="w-3.5 h-3.5 text-pink-400"></i>
                    <span>Editar Perfil</span>
                  </button>

                  <button onclick="InstructorModule.deleteInstructor('${inst.id}')" 
                    class="py-2 px-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer" title="Quitar este profesor del sistema">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    <span>Quitar Profesor</span>
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  openCreateInstructorModal: () => {
    if (!InstructorModule.isAuthenticated()) return;

    InstructorModule.currentInstructorAvatarBase64 = null;

    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <i data-lucide="user-plus" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white font-heading">Añadir Nuevo Profesor</h3>
              <p class="text-xs text-slate-400">Registra un nuevo instructor al equipo de Safe Zone</p>
            </div>
          </div>
          <button onclick="InstructorModule.closeDetailsModal()" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="InstructorModule.processCreateInstructor(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Completo del Instructor *</label>
            <input type="text" id="new-inst-name" required placeholder="Ej: Santiago 'El Rayo' Vargas" 
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
          </div>

          <!-- SELECCIÓN DE DISCIPLINAS PRINCIPALES Y ADICIONALES -->
          <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <label class="block text-xs font-bold text-pink-400 uppercase tracking-wider">
              Disciplinas que Imparte (Selecciona una o varias) *
            </label>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 cursor-pointer">
                <input type="checkbox" name="new-inst-disc" value="defensa-personal" class="rounded text-pink-600 focus:ring-pink-500" checked>
                <span class="text-slate-200 font-semibold">🛡️ Defensa Personal</span>
              </label>

              <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 cursor-pointer">
                <input type="checkbox" name="new-inst-disc" value="boxeo" class="rounded text-pink-600 focus:ring-pink-500">
                <span class="text-slate-200 font-semibold">🥊 Boxeo</span>
              </label>

              <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 cursor-pointer">
                <input type="checkbox" name="new-inst-disc" value="taekwondo" class="rounded text-pink-600 focus:ring-pink-500">
                <span class="text-slate-200 font-semibold">🥋 Taekwondo</span>
              </label>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-400 mb-1">
                ➕ Añadir Otra Disciplina o Especialidad Adicional (Opcional):
              </label>
              <input type="text" id="new-inst-custom-discipline" placeholder="Ej: Kickboxing, BJJ, Jiu-Jitsu, Acondicionamiento Físico..." 
                class="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Título / Certificación *</label>
              <input type="text" id="new-inst-title" required placeholder="Ej: Entrenador Certificado WBA / Cinturón Negro" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Años / Resumen de Experiencia *</label>
              <input type="text" id="new-inst-experience" required placeholder="Ej: 10 años de trayectoria | Formador élite" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <!-- SUBIDA DE FOTO DESDE CARPETA / PORTAPAPELES -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              Foto de Perfil del Profesor *
            </label>

            <div class="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-pink-500/40 hover:border-pink-500 transition-all text-center relative group"
                 id="inst-avatar-dropzone"
                 ondragover="event.preventDefault()"
                 ondrop="InstructorModule.handleAvatarDrop(event)"
                 tabindex="0"
                 onpaste="InstructorModule.handleAvatarPasteEvent(event)">
                 
              <input type="file" id="inst-avatar-file-input" accept="image/*" onchange="InstructorModule.handleInstructorAvatarFile(event)" 
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
              
              <div id="inst-avatar-placeholder" class="space-y-2">
                <div class="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i data-lucide="upload-cloud" class="w-6 h-6"></i>
                </div>
                <p class="text-xs text-slate-200 font-bold">Haz clic aquí para seleccionar una foto desde tu carpeta o arrástrala</p>
                <p class="text-[10px] text-slate-400">PNG, JPG, WEBP o también puedes presionar <kbd class="px-1.5 py-0.5 rounded bg-slate-800 text-pink-300 font-mono text-[10px] border border-slate-700">Ctrl + V</kbd> para pegarla</p>
              </div>

              <div id="inst-avatar-preview-wrap" class="hidden">
                <img id="inst-avatar-preview-img" src="" alt="Foto Profesor" class="w-24 h-24 rounded-2xl mx-auto border-2 border-pink-500 object-cover shadow-xl mb-2">
                <span class="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i> Foto cargada correctamente (Clic para cambiar)
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button type="button" onclick="InstructorModule.pasteImageFromClipboard()" 
                class="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-400 hover:text-white border border-pink-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="clipboard" class="w-3.5 h-3.5"></i>
                <span>📋 Pegar Foto Copiada</span>
              </button>
              <button type="button" onclick="document.getElementById('inst-url-collapse').classList.toggle('hidden')" 
                class="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
                <i data-lucide="link" class="w-3.5 h-3.5"></i>
                <span>Usar URL</span>
              </button>
            </div>

            <div id="inst-url-collapse" class="hidden pt-1">
              <input type="url" id="inst-avatar-url-input" placeholder="O pega aquí una URL de imagen (https://...)" 
                oninput="InstructorModule.handleInstructorAvatarUrl(this.value)"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Biografía y Enfoque de Entrenamiento *</label>
            <textarea id="new-inst-bio" rows="3" required placeholder="Describe su metodología, motivación y fortalezas pedagógicas..." 
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></textarea>
          </div>

          <div class="pt-3 flex gap-3">
            <button type="button" onclick="InstructorModule.closeDetailsModal()" 
              class="w-1/3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" 
              class="w-2/3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Guardar & Publicar Profesor</span>
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  processCreateInstructor: (event) => {
    event.preventDefault();
    if (!InstructorModule.isAuthenticated()) return;

    const name = document.getElementById('new-inst-name').value.trim();
    const title = document.getElementById('new-inst-title').value.trim();
    const experience = document.getElementById('new-inst-experience').value.trim();
    const bio = document.getElementById('new-inst-bio').value.trim();
    const customDiscipline = document.getElementById('new-inst-custom-discipline').value.trim();

    const avatar = InstructorModule.currentInstructorAvatarBase64 || 
                   (document.getElementById('inst-avatar-url-input') ? document.getElementById('inst-avatar-url-input').value.trim() : '') || 
                   "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&q=80&w=300";

    const checkedBoxes = Array.from(document.querySelectorAll('input[name="new-inst-disc"]:checked')).map(cb => cb.value);
    
    if (customDiscipline && !checkedBoxes.includes(customDiscipline)) {
      checkedBoxes.push(customDiscipline);
    }

    const disciplines = checkedBoxes.length > 0 ? checkedBoxes : ['defensa-personal'];
    const primaryDiscipline = disciplines[0];

    const labels = disciplines.map(d => {
      if (d === 'boxeo') return 'Boxeo';
      if (d === 'taekwondo') return 'Taekwondo WT';
      if (d === 'defensa-personal') return 'Defensa Personal';
      return d;
    });
    const disciplineName = labels.join(' & ');

    const newInstData = {
      name,
      discipline: primaryDiscipline,
      disciplines: disciplines,
      disciplineName,
      title,
      experience,
      avatar,
      bio,
      rating: 5.0,
      reviewsCount: 10
    };

    Storage.addInstructor(newInstData);

    InstructorModule.closeDetailsModal();
    InstructorModule.renderInstructorPortal();
    InstructorModule.renderInstructors();

    App.showToast(`👥 ¡Profesor "${name}" añadido con éxito!`);
  },

  openEditInstructorModal: (instructorId) => {
    if (!InstructorModule.isAuthenticated()) return;
    const instructors = Storage.getInstructors();
    const inst = instructors.find(i => i.id === instructorId);
    if (!inst) return;

    InstructorModule.currentInstructorAvatarBase64 = inst.avatar;

    const currentDisciplines = inst.disciplines && inst.disciplines.length > 0 ? inst.disciplines : [inst.discipline];
    const hasDefensa = currentDisciplines.includes('defensa-personal');
    const hasBoxeo = currentDisciplines.includes('boxeo');
    const hasTaekwondo = currentDisciplines.includes('taekwondo');

    const customDiscs = currentDisciplines.filter(d => !['defensa-personal', 'boxeo', 'taekwondo'].includes(d));
    const customDiscValue = customDiscs.join(', ');

    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <i data-lucide="edit" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white font-heading">Editar Perfil de Profesor</h3>
              <p class="text-xs text-slate-400">${inst.name}</p>
            </div>
          </div>
          <button onclick="InstructorModule.closeDetailsModal()" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="InstructorModule.processEditInstructor(event, '${inst.id}')" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Completo del Instructor *</label>
            <input type="text" id="edit-inst-name" required value="${inst.name}" 
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
          </div>

          <!-- SELECCIÓN DE DISCIPLINAS PRINCIPALES Y ADICIONALES -->
          <div class="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
            <label class="block text-xs font-bold text-pink-400 uppercase tracking-wider">
              Disciplinas que Imparte (Selecciona una o varias) *
            </label>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 cursor-pointer">
                <input type="checkbox" name="edit-inst-disc" value="defensa-personal" class="rounded text-pink-600 focus:ring-pink-500" ${hasDefensa ? 'checked' : ''}>
                <span class="text-slate-200 font-semibold">🛡️ Defensa Personal</span>
              </label>

              <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 cursor-pointer">
                <input type="checkbox" name="edit-inst-disc" value="boxeo" class="rounded text-pink-600 focus:ring-pink-500" ${hasBoxeo ? 'checked' : ''}>
                <span class="text-slate-200 font-semibold">🥊 Boxeo</span>
              </label>

              <label class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 cursor-pointer">
                <input type="checkbox" name="edit-inst-disc" value="taekwondo" class="rounded text-pink-600 focus:ring-pink-500" ${hasTaekwondo ? 'checked' : ''}>
                <span class="text-slate-200 font-semibold">🥋 Taekwondo</span>
              </label>
            </div>

            <div>
              <label class="block text-[11px] font-semibold text-slate-400 mb-1">
                ➕ Añadir Otra Disciplina o Especialidad Adicional (Opcional):
              </label>
              <input type="text" id="edit-inst-custom-discipline" value="${customDiscValue}" placeholder="Ej: Kickboxing, BJJ, Jiu-Jitsu, Acondicionamiento..." 
                class="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Título / Certificación *</label>
              <input type="text" id="edit-inst-title" required value="${inst.title}" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Años / Resumen de Experiencia *</label>
              <input type="text" id="edit-inst-experience" required value="${inst.experience}" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <!-- SUBIDA DE FOTO DESDE CARPETA / PORTAPAPELES -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-slate-300 mb-1">
              Foto de Perfil del Profesor *
            </label>

            <div class="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-pink-500/40 hover:border-pink-500 transition-all text-center relative group"
                 id="inst-avatar-dropzone"
                 ondragover="event.preventDefault()"
                 ondrop="InstructorModule.handleAvatarDrop(event)"
                 tabindex="0"
                 onpaste="InstructorModule.handleAvatarPasteEvent(event)">
                 
              <input type="file" id="inst-avatar-file-input" accept="image/*" onchange="InstructorModule.handleInstructorAvatarFile(event)" 
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
              
              <div id="inst-avatar-placeholder" class="${inst.avatar ? 'hidden' : 'space-y-2'}">
                <div class="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <i data-lucide="upload-cloud" class="w-6 h-6"></i>
                </div>
                <p class="text-xs text-slate-200 font-bold">Haz clic aquí para seleccionar una foto desde tu carpeta o arrástrala</p>
                <p class="text-[10px] text-slate-400">PNG, JPG, WEBP o también puedes presionar <kbd class="px-1.5 py-0.5 rounded bg-slate-800 text-pink-300 font-mono text-[10px] border border-slate-700">Ctrl + V</kbd> para pegarla</p>
              </div>

              <div id="inst-avatar-preview-wrap" class="${inst.avatar ? '' : 'hidden'}">
                <img id="inst-avatar-preview-img" src="${inst.avatar || ''}" alt="Foto Profesor" class="w-24 h-24 rounded-2xl mx-auto border-2 border-pink-500 object-cover shadow-xl mb-2">
                <span class="text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <i data-lucide="check" class="w-3.5 h-3.5"></i> Foto cargada correctamente (Clic para cambiar)
                </span>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button type="button" onclick="InstructorModule.pasteImageFromClipboard()" 
                class="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-pink-400 hover:text-white border border-pink-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="clipboard" class="w-3.5 h-3.5"></i>
                <span>📋 Pegar Foto Copiada</span>
              </button>
              <button type="button" onclick="document.getElementById('inst-url-collapse').classList.toggle('hidden')" 
                class="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer">
                <i data-lucide="link" class="w-3.5 h-3.5"></i>
                <span>Usar URL</span>
              </button>
            </div>

            <div id="inst-url-collapse" class="hidden pt-1">
              <input type="url" id="inst-avatar-url-input" placeholder="O pega aquí una URL de imagen (https://...)" 
                oninput="InstructorModule.handleInstructorAvatarUrl(this.value)"
                value="${inst.avatar && inst.avatar.startsWith('http') ? inst.avatar : ''}"
                class="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Biografía y Enfoque de Entrenamiento *</label>
            <textarea id="edit-inst-bio" rows="3" required 
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">${inst.bio}</textarea>
          </div>

          <div class="pt-3 flex gap-3">
            <button type="button" onclick="InstructorModule.closeDetailsModal()" 
              class="w-1/3 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" 
              class="w-2/3 py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Guardar Cambios del Profesor</span>
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  processEditInstructor: (event, instructorId) => {
    event.preventDefault();
    if (!InstructorModule.isAuthenticated()) return;

    const name = document.getElementById('edit-inst-name').value.trim();
    const title = document.getElementById('edit-inst-title').value.trim();
    const experience = document.getElementById('edit-inst-experience').value.trim();
    const bio = document.getElementById('edit-inst-bio').value.trim();
    const customDiscipline = document.getElementById('edit-inst-custom-discipline').value.trim();

    const avatar = InstructorModule.currentInstructorAvatarBase64 || 
                   (document.getElementById('inst-avatar-url-input') ? document.getElementById('inst-avatar-url-input').value.trim() : '') || 
                   "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&q=80&w=300";

    const checkedBoxes = Array.from(document.querySelectorAll('input[name="edit-inst-disc"]:checked')).map(cb => cb.value);
    
    if (customDiscipline) {
      const parts = customDiscipline.split(',').map(s => s.trim()).filter(s => s.length > 0);
      parts.forEach(p => {
        if (!checkedBoxes.includes(p)) checkedBoxes.push(p);
      });
    }

    const disciplines = checkedBoxes.length > 0 ? checkedBoxes : ['defensa-personal'];
    const primaryDiscipline = disciplines[0];

    const labels = disciplines.map(d => {
      if (d === 'boxeo') return 'Boxeo';
      if (d === 'taekwondo') return 'Taekwondo WT';
      if (d === 'defensa-personal') return 'Defensa Personal';
      return d;
    });
    const disciplineName = labels.join(' & ');

    const updatedData = {
      name,
      discipline: primaryDiscipline,
      disciplines: disciplines,
      disciplineName,
      title,
      experience,
      avatar,
      bio
    };

    Storage.updateInstructor(instructorId, updatedData);

    InstructorModule.closeDetailsModal();
    InstructorModule.renderInstructorPortal();
    InstructorModule.renderInstructors();

    App.showToast(`👥 ¡Datos de "${name}" actualizados correctamente!`);
  },

  deleteInstructor: (instructorId) => {
    if (!InstructorModule.isAuthenticated()) return;
    const instructors = Storage.getInstructors();
    const inst = instructors.find(i => i.id === instructorId);
    if (!inst) return;

    if (!confirm(`¿Estás segura de eliminar al profesor "${inst.name}" del equipo de Safe Zone?`)) return;

    Storage.deleteInstructor(instructorId);

    const remaining = Storage.getInstructors();
    if (InstructorModule.selectedInstructorId === instructorId && remaining.length > 0) {
      InstructorModule.selectedInstructorId = remaining[0].id;
    }

    InstructorModule.renderInstructorPortal();
    InstructorModule.renderInstructors();

    App.showToast(`🗑️ Profesor "${inst.name}" eliminado del sistema.`);
  },

  resetInstructorsToDefault: () => {
    if (!InstructorModule.isAuthenticated()) return;
    if (!confirm('¿Deseas restablecer el equipo de profesores a los integrantes originales?')) return;

    localStorage.removeItem('safezone_instructors');
    InstructorModule.selectedInstructorId = 'inst-1';
    InstructorModule.renderInstructorPortal();
    InstructorModule.renderInstructors();
    App.showToast('🔄 Lista de profesores restablecida.');
  },

  // --- 2. PLANIFICADOR DE CLASES ---
  renderCalendarSection: () => {
    const sessions = Storage.getSessions();
    const instructors = Storage.getInstructors();
    const currentInst = instructors.find(i => i.id === InstructorModule.selectedInstructorId) || instructors[0] || { id: '', name: 'Sin profesores', avatar: '', discipline: 'boxeo' };
    const instSessions = sessions.filter(s => s.instructorId === currentInst.id);

    const year = InstructorModule.calendarYear;
    const month = InstructorModule.calendarMonth;
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthName = monthNames[month];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    const sessionsByDate = {};
    instSessions.forEach(s => {
      if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
      sessionsByDate[s.date].push(s);
    });

    return `
      <div class="glass-card rounded-2xl p-6 sm:p-7 mb-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span class="text-xs font-black uppercase tracking-wider text-pink-400">Planificador de Disponibilidad</span>
          <h3 class="text-xl sm:text-2xl font-black text-white font-heading">Horarios de Entrenadores</h3>
          <p class="text-xs text-slate-400 mt-0.5">Selecciona el profesor para habilitar o cancelar sus clases del mes.</p>
        </div>

        <div class="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex items-center gap-3 shrink-0">
          <img src="${currentInst.avatar || 'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&q=80&w=300'}" alt="${currentInst.name}" class="w-10 h-10 rounded-xl object-cover border border-pink-500 shrink-0">
          <div>
            <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Profesor:</span>
            <select onchange="InstructorModule.setInstructor(this.value)" 
              class="bg-slate-900 text-white font-bold text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-pink-500">
              ${instructors.map(i => `
                <option value="${i.id}" ${i.id === currentInst.id ? 'selected' : ''}>${i.name} (${i.discipline.toUpperCase()})</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="glass-card rounded-2xl p-6 sm:p-8 mb-8 border border-slate-800">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <i data-lucide="calendar" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white font-heading flex items-center gap-2">
                <span>${monthName} ${year}</span>
                <span class="text-xs font-normal text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                  ${instSessions.length} clases programadas
                </span>
              </h3>
              <p class="text-xs text-slate-400">Haz clic en cualquier día para habilitar o cancelar la clase de esa fecha.</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="InstructorModule.changeMonth(-1)" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer">
              <i data-lucide="chevron-left" class="w-5 h-5"></i>
            </button>
            <button onclick="InstructorModule.calendarMonth = new Date().getMonth(); InstructorModule.calendarYear = new Date().getFullYear(); InstructorModule.renderInstructorPortal();" 
              class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer">
              Hoy / Mes Actual
            </button>
            <button onclick="InstructorModule.changeMonth(1)" class="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer">
              <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          <div class="p-2">Lun</div>
          <div class="p-2">Mar</div>
          <div class="p-2">Mié</div>
          <div class="p-2">Jue</div>
          <div class="p-2">Vie</div>
          <div class="p-2 text-pink-400">Sáb</div>
          <div class="p-2 text-pink-400">Dom</div>
        </div>

        <div class="grid grid-cols-7 gap-2 sm:gap-3">
          ${Array(adjustedFirstDay).fill(null).map(() => `
            <div class="min-h-[85px] sm:min-h-[105px] rounded-xl bg-slate-950/30 border border-slate-900/40 opacity-30"></div>
          `).join('')}

          ${Array.from({ length: totalDaysInMonth }, (_, i) => i + 1).map(dayNumber => {
            const dayFormatted = dayNumber.toString().padStart(2, '0');
            const monthFormatted = (month + 1).toString().padStart(2, '0');
            const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;
            
            const daySessions = sessionsByDate[dateStr] || [];
            const hasSession = daySessions.length > 0;
            
            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = dateStr === todayStr;

            return `
              <div class="min-h-[90px] sm:min-h-[110px] rounded-xl p-2 sm:p-2.5 flex flex-col justify-between transition-all relative border group
                ${hasSession ? 'bg-slate-950/90 border-pink-500/50 shadow-md shadow-pink-600/10' : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'}
                ${isToday ? 'border-pink-400' : ''}">
                
                <div class="flex items-center justify-between">
                  <span class="text-xs sm:text-sm font-black ${isToday ? 'text-pink-400 font-extrabold' : hasSession ? 'text-white' : 'text-slate-400'}">
                    ${dayNumber} ${isToday ? '<span class="text-[9px] uppercase text-pink-400 font-bold block sm:inline">• Hoy</span>' : ''}
                  </span>
                </div>

                <div class="my-1">
                  ${hasSession ? daySessions.map(s => {
                    const attendeesCount = s.attendees ? s.attendees.length : 0;
                    return `
                      <div class="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-300 text-[10px] font-bold mb-1 truncate">
                        <span class="truncate block">${s.time.split(' - ')[0]}</span>
                        <span class="text-[9px] font-normal text-slate-300 block truncate">👥 ${attendeesCount}/${s.capacity}</span>
                      </div>
                    `;
                  }).join('') : `
                    <span class="text-[10px] text-slate-600 block italic group-hover:text-slate-400 transition-colors">
                      Libre
                    </span>
                  `}
                </div>

                <div class="pt-1 border-t border-slate-900">
                  ${hasSession ? `
                    <div class="flex items-center justify-between">
                      <button onclick="InstructorModule.openAttendeesModal('${daySessions[0].id}')" 
                        class="text-[10px] text-pink-400 hover:text-pink-300 font-semibold cursor-pointer">
                        Alumnos
                      </button>
                      <button onclick="InstructorModule.deleteSession('${daySessions[0].id}')" 
                        class="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer">
                        ✕
                      </button>
                    </div>
                  ` : `
                    <button onclick="InstructorModule.openQuickDayModal('${dateStr}', '${currentInst.id}')" 
                      class="w-full py-1 px-1 rounded-md bg-slate-900 hover:bg-pink-600 text-slate-400 hover:text-white text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-0.5">
                      <i data-lucide="plus" class="w-2.5 h-2.5"></i>
                      <span>Dictar</span>
                    </button>
                  `}
                </div>

              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  changeMonth: (delta) => {
    InstructorModule.calendarMonth += delta;
    if (InstructorModule.calendarMonth > 11) {
      InstructorModule.calendarMonth = 0;
      InstructorModule.calendarYear += 1;
    } else if (InstructorModule.calendarMonth < 0) {
      InstructorModule.calendarMonth = 11;
      InstructorModule.calendarYear -= 1;
    }
    InstructorModule.renderInstructorPortal();
  },

  setInstructor: (instId) => {
    InstructorModule.selectedInstructorId = instId;
    InstructorModule.renderInstructorPortal();
  },

  renderInstructors: () => {
    const container = document.getElementById('instructors-container');
    if (!container) return;

    const instructors = Storage.getInstructors();

    container.innerHTML = instructors.map(inst => {
      const discs = inst.disciplines && inst.disciplines.length > 0 ? inst.disciplines : [inst.discipline];
      const badgesHtml = discs.map(d => {
        if (d === 'boxeo') return `<span class="badge-boxeo text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">🥊 Boxeo</span>`;
        if (d === 'taekwondo') return `<span class="badge-taekwondo text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">🥋 Taekwondo</span>`;
        if (d === 'defensa-personal') return `<span class="badge-defensa text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">🛡️ Defensa Personal</span>`;
        return `<span class="bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">⚡ ${d}</span>`;
      }).join(' ');

      return `
        <div class="glass-card glass-card-hover rounded-2xl p-6 sm:p-7 flex flex-col justify-between border border-slate-800 relative overflow-hidden group">
          <div>
            <div class="flex items-start gap-4 mb-4">
              <img src="${inst.avatar}" alt="${inst.name}" class="w-16 h-16 rounded-2xl object-cover border-2 border-pink-500/50 shadow-md">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-1.5 mb-1.5">
                  ${badgesHtml}
                </div>
                <h3 class="text-lg font-bold text-white font-heading truncate">${inst.name}</h3>
                <p class="text-xs text-pink-400 font-medium">${inst.title}</p>
              </div>
            </div>

            <p class="text-slate-300 text-xs leading-relaxed mb-4">${inst.bio}</p>

            <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs mb-5">
              <span class="text-slate-500 text-[10px] uppercase font-bold block mb-0.5">Trayectoria:</span>
              <p class="text-slate-300 font-medium">${inst.experience}</p>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-1 text-pink-400 text-xs font-bold">
              <i data-lucide="star" class="w-3.5 h-3.5 fill-pink-400"></i>
              <span>${inst.rating}</span>
              <span class="text-slate-500 font-normal">(${inst.reviewsCount} reseñas)</span>
            </div>
            <button onclick="SessionsModule.setFilter('${inst.discipline}'); App.switchTab('sessions');" 
              class="px-3.5 py-1.5 rounded-lg bg-pink-500/10 hover:bg-pink-600 text-pink-400 hover:text-white border border-pink-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer">
              <span>Ver Encuentros</span>
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  openQuickDayModal: (dateStr, instructorId) => {
    if (!InstructorModule.isAuthenticated()) return;

    const instructors = Storage.getInstructors();
    const inst = instructors.find(i => i.id === instructorId) || instructors[0];

    const modal = document.getElementById('create-session-modal');
    const modalContent = document.getElementById('create-session-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <i data-lucide="calendar-plus" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white font-heading">Habilitar Clase para el ${dateStr}</h3>
              <p class="text-xs text-slate-400">Profesor Safe Zone: ${inst.name}</p>
            </div>
          </div>
          <button onclick="InstructorModule.closeCreateSessionModal()" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form onsubmit="InstructorModule.processQuickDaySession(event, '${dateStr}', '${inst.id}')" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Título de la Sesión *</label>
            <input type="text" id="quick-title" required value="Entrenamiento de ${inst.disciplineName || inst.discipline.toUpperCase()}" 
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Disciplina *</label>
              <select id="quick-discipline" class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
                <option value="defensa-personal" ${inst.discipline === 'defensa-personal' ? 'selected' : ''}>🛡️ Defensa Personal</option>
                <option value="boxeo" ${inst.discipline === 'boxeo' ? 'selected' : ''}>🥊 Boxeo</option>
                <option value="taekwondo" ${inst.discipline === 'taekwondo' ? 'selected' : ''}>🥋 Taekwondo</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Horario *</label>
              <input type="text" id="quick-time" required value="08:00 AM - 09:30 AM" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Lugar / Sede *</label>
              <input type="text" id="quick-location-name" required value="Parque Simón Bolívar - Sector Templete" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">Cupos Máximos *</label>
              <input type="number" id="quick-capacity" required min="5" max="50" value="18" 
                class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
            </div>
          </div>

          <div class="pt-3">
            <button type="submit" 
              class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="check" class="w-5 h-5"></i>
              <span>Confirmar y Publicar Clase</span>
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  processQuickDaySession: (event, dateStr, instId) => {
    event.preventDefault();
    if (!InstructorModule.isAuthenticated()) return;

    const instructors = Storage.getInstructors();
    const inst = instructors.find(i => i.id === instId) || instructors[0];

    const title = document.getElementById('quick-title').value;
    const discipline = document.getElementById('quick-discipline').value;
    const time = document.getElementById('quick-time').value;
    const locName = document.getElementById('quick-location-name').value;
    const capacity = parseInt(document.getElementById('quick-capacity').value, 10) || 18;

    const newSession = {
      id: 'ses-' + Math.random().toString(36).substring(2, 9),
      discipline: discipline,
      title: title,
      instructorId: inst.id,
      instructorName: inst.name,
      instructorAvatar: inst.avatar,
      date: dateStr,
      time: time,
      recurrence: 'once',
      recurrenceLabel: 'Fecha Confirmada del Mes',
      location: {
        name: locName,
        address: 'Bogotá D.C.',
        zone: 'Bogotá D.C.'
      },
      price: 10000,
      capacity: capacity,
      attendees: [],
      level: 'Todos los niveles',
      requirements: ['Ropa deportiva', 'Hidratación', 'Toalla'],
      description: `Sesión práctica de Safe Zone Club guiada por ${inst.name}.`
    };

    const sessions = Storage.getSessions();
    sessions.unshift(newSession);
    Storage.saveSessions(sessions);

    InstructorModule.closeCreateSessionModal();
    InstructorModule.renderInstructorPortal();
    if (window.SessionsModule) SessionsModule.renderSessions();

    App.showToast(`🥋 ¡Clase confirmada para el ${dateStr}!`);
  },

  closeCreateSessionModal: () => {
    const modal = document.getElementById('create-session-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  openAttendeesModal: (sessionId) => {
    const sessions = Storage.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const modal = document.getElementById('attendees-modal');
    const modalContent = document.getElementById('attendees-modal-content');
    if (!modal || !modalContent) return;

    const attendees = session.attendees || [];

    modalContent.innerHTML = `
      <div class="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div>
            <span class="text-xs text-pink-400 font-bold uppercase tracking-wider">Control de Asistencia</span>
            <h3 class="text-xl font-bold text-white font-heading">${session.title}</h3>
            <p class="text-xs text-slate-400">📅 ${session.date} (${session.time}) • 📍 ${session.location.name}</p>
          </div>
          <button onclick="InstructorModule.closeAttendeesModal()" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="mb-4 flex items-center justify-between text-xs">
          <span class="text-slate-300 font-semibold">Total Alumnas: <strong class="text-pink-400 text-sm">${attendees.length} / ${session.capacity}</strong></span>
          <span class="text-emerald-400 font-medium">${session.capacity - attendees.length} cupos libres</span>
        </div>

        ${attendees.length === 0 ? `
          <div class="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-sm">
            <i data-lucide="users" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
            Aún no hay inscripciones para esta clase.
          </div>
        ` : `
          <div class="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            ${attendees.map((att, idx) => `
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="w-6 h-6 rounded-full bg-slate-900 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-800">${idx + 1}</span>
                  <div>
                    <span class="text-sm font-bold text-white block">${att.name}</span>
                    <span class="text-xs text-slate-400">📱 ${att.phone} • Código: <code class="text-pink-400 font-mono font-bold">${att.uniqueCode || 'SZ-TICKET'}</code></span>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <a href="https://wa.me/57${(att.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hola ' + att.name + ', te recuerdo tu clase de SAFE ZONE (' + session.title + ') para el ' + session.date + ' (' + session.time + ') en ' + session.location.name + '. ¡Te esperamos!')}" target="_blank" 
                    class="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 text-xs transition-colors" title="Contactar por WhatsApp">
                    <i data-lucide="message-circle" class="w-4 h-4"></i>
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeAttendeesModal: () => {
    const modal = document.getElementById('attendees-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  deleteSession: (sessionId) => {
    if (!InstructorModule.isAuthenticated()) return;
    if (!confirm('¿Estás seguro de cancelar esta sesión del calendario?')) return;

    let sessions = Storage.getSessions();
    sessions = sessions.filter(s => s.id !== sessionId);
    Storage.saveSessions(sessions);

    InstructorModule.renderInstructorPortal();
    if (window.SessionsModule) SessionsModule.renderSessions();
    App.showToast('🗑️ Sesión cancelada del calendario.');
  }
};

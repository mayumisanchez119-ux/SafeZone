/**
 * Aplicación Principal - SAFE ZONE CLUB
 * Orquestador de navegación, tabs y estado global
 */

const App = {
  currentTab: 'sessions',

  init: async () => {
    await Storage.initialize();
    SessionsModule.renderSessions();
    TicketsModule.renderCombos();
    TicketsModule.renderWallet();
    InstructorModule.renderInstructors();
    InstructorModule.renderInstructorPortal();

    App.updateWalletBadge();

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        SessionsModule.handleSearch(e.target.value);
      });
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  switchTab: (tabId) => {
    App.currentTab = tabId;

    const tabs = ['sessions', 'combos', 'wallet', 'instructors', 'instructor-portal'];
    tabs.forEach(t => {
      const section = document.getElementById(`tab-${t}`);
      if (section) {
        if (t === tabId) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      }

      const navLinks = document.querySelectorAll(`[data-nav="${t}"]`);
      navLinks.forEach(link => {
        if (t === tabId) {
          link.classList.add('text-pink-400', 'font-bold', 'border-b-2', 'border-pink-500');
          link.classList.remove('text-slate-400');
        } else {
          link.classList.remove('text-pink-400', 'font-bold', 'border-b-2', 'border-pink-500');
          link.classList.add('text-slate-400');
        }
      });
    });

    if (tabId === 'sessions') SessionsModule.renderSessions();
    if (tabId === 'combos') TicketsModule.renderCombos();
    if (tabId === 'wallet') TicketsModule.renderWallet();
    if (tabId === 'instructors') InstructorModule.renderInstructors();
    if (tabId === 'instructor-portal') InstructorModule.renderInstructorPortal();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  updateWalletBadge: () => {
    const transactions = Storage.getTransactions();
    const approvedTxs = transactions.filter(t => t.status === 'approved' && t.remainingTickets > 0);
    const totalRemainingTickets = approvedTxs.reduce((acc, t) => acc + (t.remainingTickets || 0), 0);

    const badgeEls = document.querySelectorAll('.wallet-tickets-count');
    badgeEls.forEach(el => {
      el.textContent = totalRemainingTickets;
    });
  },

  showToast: (message, duration = 4000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `p-4 rounded-2xl bg-slate-950/95 border border-pink-500/50 text-white text-sm shadow-2xl shadow-pink-500/25 flex items-center gap-3 backdrop-blur-lg transform transition-all duration-300 translate-y-4 opacity-0`;
    toast.innerHTML = `
      <div class="p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
        <i data-lucide="bell" class="w-4 h-4"></i>
      </div>
      <p class="font-medium text-xs sm:text-sm leading-snug">${message}</p>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300);
    }, duration);
  },

  showSuccessCodeModal: (tx) => {
    // Cerrar cualquier otro modal abierto
    ['details-modal', 'register-modal', 'purchase-modal', 'create-session-modal', 'attendees-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        el.classList.remove('flex');
      }
    });

    const modal = document.getElementById('success-code-modal');
    const content = document.getElementById('success-code-modal-content');
    if (!modal || !content) return;

    const isSingleClass = tx.type === 'single_class' || tx.sessionId || tx.totalTickets === 1;

    content.innerHTML = `
      <div class="p-6 sm:p-8 text-center max-h-[90vh] overflow-y-auto">
        <div class="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-600 to-rose-600 p-0.5 mx-auto mb-3 shadow-xl shadow-pink-600/50 flex items-center justify-center">
          <div class="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <i data-lucide="check-circle-2" class="w-8 h-8 text-pink-400"></i>
          </div>
        </div>

        <span class="text-xs uppercase font-black text-pink-400 tracking-widest bg-pink-950/80 px-3 py-1 rounded-full border border-pink-700/60 inline-block mb-2">
          ${isSingleClass ? '¡PASE DE ENTRADA REGISTRADO!' : '¡TIQUETERA 3+1 REGISTRADA!'}
        </span>
        <h3 class="text-2xl sm:text-3xl font-black text-white font-heading mb-1">Tu Código Único de Transacción</h3>
        <p class="text-slate-300 text-xs max-w-md mx-auto mb-4">
          ¡Gracias <strong class="text-white">${tx.studentName}</strong>! Tu comprobante por <strong>${tx.title}</strong> ha sido recibido.
        </p>

        <!-- GRAN CAJA DEL CÓDIGO ÚNICO -->
        <div class="my-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-pink-950/90 via-slate-950 to-slate-950 border-2 border-pink-500 shadow-2xl shadow-pink-600/60 relative overflow-hidden">
          <div class="absolute -right-10 -bottom-10 w-36 h-36 bg-pink-600/20 rounded-full blur-2xl"></div>
          
          <span class="text-[11px] uppercase font-black text-pink-300 tracking-widest block mb-1">
            🎟️ CÓDIGO PERSONAL SAFE ZONE:
          </span>
          
          <div class="text-4xl sm:text-5xl md:text-6xl font-black text-white font-mono tracking-widest my-4 select-all drop-shadow-[0_0_30px_rgba(244,63,94,0.7)]">
            ${tx.uniqueCode}
          </div>

          <!-- BOTÓN DE COPIAR GRANDE -->
          <div class="mt-4 flex items-center justify-center">
            <button type="button" id="modal-copy-btn" onclick="App.copyCode('${tx.uniqueCode}')" 
              class="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-black text-sm shadow-xl shadow-pink-600/50 transition-all transform hover:scale-105 flex items-center gap-2.5 cursor-pointer">
              <i data-lucide="copy" class="w-5 h-5"></i>
              <span id="modal-copy-text">📋 Copiar Mi Código Único</span>
            </button>
          </div>

          <div class="mt-4 flex items-center justify-center gap-2 text-xs text-amber-300 font-semibold bg-amber-950/80 py-1.5 px-4 rounded-full border border-amber-700/60 inline-flex">
            <i data-lucide="clock" class="w-4 h-4"></i>
            <span>Estado: Pendiente de Aprobación por Administradora</span>
          </div>
        </div>

        <!-- ACLARACIÓN DESTACADA Y CONDICIONES ESPECÍFICAS -->
        ${isSingleClass ? `
          <div class="p-4 sm:p-5 rounded-2xl bg-amber-950/50 border-2 border-amber-500/80 text-left mb-6 space-y-2.5">
            <div class="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wide">
              <i data-lucide="alert-triangle" class="w-5 h-5 shrink-0 text-amber-400"></i>
              <span>⚠️ TÉRMINOS & CONDICIONES DE ESTA SESIÓN:</span>
            </div>
            <p class="text-xs text-slate-200 leading-relaxed">
              Tu código <strong class="text-pink-400 font-mono font-bold">${tx.uniqueCode}</strong> es el comprobante de tu reserva para <strong>${tx.title}</strong>${tx.sessionDate ? ` el <strong>${tx.sessionDate}</strong> (${tx.sessionTime || ''})` : ''}.
            </p>
            <ul class="text-xs text-slate-300 space-y-2 pt-1">
              <li class="flex items-start gap-2">
                <span class="text-amber-400 font-bold shrink-0">📌</span>
                <span><strong>Válido Únicamente para esta Clase:</strong> Este pago es exclusivo para esta sesión programada. No es una tiquetera ni aplica para transferir a otras fechas.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-red-400 font-bold shrink-0">❌</span>
                <span><strong class="text-red-300 font-bold">Sin Reembolso por Inasistencia:</strong> Si no asistes a la clase en el día y horario programado, <strong>no habrá reembolso de dinero ni reprogramación</strong>.</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-emerald-400 font-bold shrink-0">✅</span>
                <span><strong>Cupo Asegurado:</strong> No necesitas redimir tickets adicionales en la web; tu lugar queda confirmado una vez validado el comprobante por la administradora.</span>
              </li>
            </ul>
          </div>
        ` : `
          <div class="p-4 sm:p-5 rounded-2xl bg-amber-950/40 border-2 border-amber-500/70 text-left mb-6 space-y-2">
            <div class="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm uppercase tracking-wide">
              <i data-lucide="alert-triangle" class="w-5 h-5 shrink-0 text-amber-400"></i>
              <span>⚠️ IMPORTANTE: GUARDA O TOMA CAPTURA A ESTE CÓDIGO</span>
            </div>
            <p class="text-xs text-slate-200 leading-relaxed">
              En <strong>SAFE ZONE CLUB</strong> no necesitas crear un usuario ni recordar contraseñas. Tu código <strong class="text-pink-400 font-mono font-bold">${tx.uniqueCode}</strong> es tu pase personal. <strong>Guárdalo o tómale una captura de pantalla ahora</strong>.
            </p>
            <ul class="text-xs text-slate-300 space-y-1.5 list-disc list-inside pt-1">
              <li>Con este código consultarás tu saldo en <strong>"Consultar Tickets por ID"</strong>.</li>
              <li>Al inscribirte a tus clases, solo ingresas este código y pagarás <strong>$0 COP</strong>.</li>
              <li>Tendrás <strong>60 días de vigencia</strong> para redimir tus 4 tickets una vez verificado el pago.</li>
            </ul>
          </div>
        `}

        <!-- BOTONES DE ACCIÓN -->
        <div class="space-y-3">
          <a href="https://wa.me/573123456789?text=${encodeURIComponent('Hola Safe Zone Club, acabo de pagar ' + (isSingleClass ? 'la clase de ' + tx.title + (tx.sessionDate ? ' (' + tx.sessionDate + ')' : '') : 'el ' + tx.title) + ' y subí mi comprobante. Mi Código Único es: ' + tx.uniqueCode + ' (' + tx.studentName + '). Por favor me confirman cuando esté aprobado. ¡Gracias!')}" 
            target="_blank" 
            class="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            <span>Notificar a la Administradora por WhatsApp</span>
          </a>

          <button onclick="App.closeSuccessCodeModal(); TicketsModule.queriedCode = '${tx.uniqueCode}'; App.switchTab('wallet');" 
            class="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <i data-lucide="search" class="w-4 h-4 text-pink-400"></i>
            <span>Ver Estado de Mi Código en la Billetera</span>
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  closeSuccessCodeModal: () => {
    const modal = document.getElementById('success-code-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  copyCode: (code) => {
    navigator.clipboard.writeText(code).then(() => {
      const textEl = document.getElementById('modal-copy-text');
      if (textEl) textEl.innerHTML = "✅ ¡CÓDIGO COPIADO AL PORTAPAPELES!";
      App.showToast(`📋 ¡Código ${code} copiado! Guárdalo bien.`);
      setTimeout(() => {
        if (textEl) textEl.innerHTML = "📋 Copiar Mi Código Único";
      }, 3500);
    }).catch(() => {
      App.showToast(`📋 Código: ${code}`);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

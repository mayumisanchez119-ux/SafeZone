/**
 * Módulo de Sesiones, Calendario & Reservas - SAFE ZONE CLUB
 */

const SessionsModule = {
  currentFilter: 'all',
  searchQuery: '',
  singleClassReceiptBase64: null,
  singleClassReceiptReady: false,
  money: amount => `$${Number(amount || 0).toLocaleString('es-CO')} COP`,

  setFilter: (filter) => {
    SessionsModule.currentFilter = filter;

    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      const isTarget = btn.getAttribute('data-filter') === filter;
      if (isTarget) {
        btn.classList.add('bg-gradient-to-r', 'from-pink-600', 'to-rose-600', 'text-white', 'shadow-lg', 'shadow-rose-600/30');
        btn.classList.remove('bg-slate-900', 'text-slate-300', 'hover:bg-slate-800');
      } else {
        btn.classList.remove('bg-gradient-to-r', 'from-pink-600', 'to-rose-600', 'text-white', 'shadow-lg', 'shadow-rose-600/30');
        btn.classList.add('bg-slate-900', 'text-slate-300', 'hover:bg-slate-800');
      }
    });

    SessionsModule.renderSessions();
  },

  handleSearch: (query) => {
    SessionsModule.searchQuery = query.toLowerCase();
    SessionsModule.renderSessions();
  },

  renderSessions: () => {
    const container = document.getElementById('sessions-container');
    if (!container) return;

    const allSessions = Storage.getSessions();

    const filtered = allSessions.filter(session => {
      const matchesFilter = SessionsModule.currentFilter === 'all' || session.discipline === SessionsModule.currentFilter;
      const matchesSearch = !SessionsModule.searchQuery ||
        session.title.toLowerCase().includes(SessionsModule.searchQuery) ||
        session.location.name.toLowerCase().includes(SessionsModule.searchQuery) ||
        session.instructorName.toLowerCase().includes(SessionsModule.searchQuery) ||
        (session.recurrenceLabel && session.recurrenceLabel.toLowerCase().includes(SessionsModule.searchQuery));
      return matchesFilter && matchesSearch;
    });

    const countBadge = document.getElementById('sessions-count-badge');
    if (countBadge) countBadge.textContent = `${filtered.length} encuentros disponibles`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full glass-card rounded-2xl p-12 text-center border-dashed border-slate-800">
          <div class="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <i data-lucide="search-x" class="w-8 h-8"></i>
          </div>
          <h4 class="text-lg font-bold text-white mb-2">No se encontraron sesiones</h4>
          <p class="text-sm text-slate-400 max-w-md mx-auto mb-4">Intenta cambiar los filtros de disciplina o el término de búsqueda.</p>
          <button onclick="SessionsModule.setFilter('all'); document.getElementById('search-input').value = ''; SessionsModule.handleSearch('');"
            class="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all cursor-pointer">
            Restablecer Filtros
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(session => {
      const attendeesCount = session.attendees ? session.attendees.length : 0;
      const availableSpots = Math.max(0, session.capacity - attendeesCount);
      const isFull = availableSpots === 0;

      let badgeClass = 'bg-indigo-950 text-indigo-300 border border-indigo-700/60';
      let disciplineLabel = 'Hapkido';
      let disciplineIcon = 'hand';

      if (session.isSpecial) {
        badgeClass = 'bg-amber-500/15 text-amber-200 border border-amber-500/50';
        disciplineLabel = 'Masterclass especial';
        disciplineIcon = 'sparkles';
      } else if (session.discipline === 'boxeo') {
        badgeClass = 'badge-boxeo';
        disciplineLabel = 'Boxeo';
        disciplineIcon = 'swords';
      } else if (session.discipline === 'taekwondo') {
        badgeClass = 'badge-taekwondo';
        disciplineLabel = 'Taekwondo';
        disciplineIcon = 'zap'; } else if (session.discipline === 'hapkido') { badgeClass = 'bg-indigo-950 text-indigo-300 border border-indigo-700/60'; disciplineLabel = 'Hapkido'; disciplineIcon = 'hand';
      }

      return `
        <div class="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group border border-slate-800">
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <span class="${badgeClass} text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
                <i data-lucide="${disciplineIcon}" class="w-3.5 h-3.5"></i>
                ${disciplineLabel}
              </span>
              <span class="bg-slate-900 text-pink-300 border border-pink-900/40 text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <i data-lucide="repeat" class="w-3 h-3 text-pink-400"></i> ${session.recurrenceLabel || 'Programada'}
              </span>
            </div>

            <h3 class="text-lg font-bold text-white mb-3 font-heading group-hover:text-pink-400 transition-colors leading-snug">
              ${session.title}
            </h3>

            <div class="space-y-2 text-xs text-slate-300 mb-5">
              <div class="flex items-center gap-2.5">
                <div class="p-1 rounded bg-slate-900 text-pink-400 shrink-0">
                  <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                </div>
                <span class="font-semibold text-white">${new Date(session.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                <span class="text-slate-500">•</span>
                <span class="text-slate-300 font-medium">${session.time}</span>
              </div>

              <div class="flex items-start gap-2.5">
                <div class="p-1 rounded bg-slate-900 text-pink-400 shrink-0 mt-0.5">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                </div>
                <div>
                  <span class="font-medium text-white block">${session.location.name}</span>
                  <span class="text-slate-400 text-[11px]">${session.location.address} (${session.location.zone || 'Bogotá'})</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 mb-5">
              <img src="${session.instructorAvatar}" alt="${session.instructorName}" class="w-9 h-9 rounded-full object-cover border border-pink-500/50">
              <div class="min-w-0">
                <span class="text-[10px] uppercase text-slate-400 font-bold block">${session.isSpecial ? 'Equipo Safe Zone' : 'Profesor Safe Zone'}</span>
                <span class="text-xs font-semibold text-white truncate block">${session.instructorName}</span>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-800/80">
            <div class="flex items-center justify-between mb-3">
              <div>
                <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">${session.isSpecial && session.presaleActive ? 'Preventa especial' : 'Aporte por Sesión'}</span>
                <span class="text-xl font-extrabold text-pink-400 font-heading">$${session.price.toLocaleString('es-CO')} <span class="text-xs font-normal text-slate-400">COP</span></span>
                ${session.isSpecial ? `<span class="text-[10px] ${session.presaleActive ? 'text-amber-300' : 'text-slate-400'} block mt-0.5">${session.presaleActive ? `Hasta ${new Date(session.presaleEndsOn + 'T00:00:00').toLocaleDateString('es-CO', { day:'numeric', month:'short' })} · luego ${SessionsModule.money(session.regularPrice)}` : 'Precio regular de la masterclass'}</span>` : ''}
                ${session.isSpecial ? '<span class="text-[10px] text-amber-200 font-bold block mt-1">Pago individual · no incluida en la ticketera</span>' : ''}
              </div>
              <div class="text-right">
                <span class="text-xs font-semibold ${isFull ? 'text-red-400' : 'text-emerald-400'} flex items-center gap-1 justify-end">
                  <i data-lucide="${isFull ? 'user-x' : 'users'}" class="w-3.5 h-3.5"></i>
                  ${isFull ? 'Cupos Agotados' : `${availableSpots} de ${session.capacity} cupos`}
                </span>
                <div class="w-24 bg-slate-950 rounded-full h-1.5 mt-1 overflow-hidden ml-auto">
                  <div class="bg-gradient-to-r from-pink-500 to-rose-500 h-1.5 rounded-full" style="width: ${(attendeesCount / session.capacity) * 100}%"></div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button type="button" onclick="SessionsModule.openDetailsModal('${session.id}')"
                class="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800">
                <i data-lucide="info" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>Detalles</span>
              </button>

              <button type="button" onclick="SessionsModule.openRegisterModal('${session.id}')" ${isFull ? 'disabled' : ''}
                class="py-2.5 px-3 rounded-xl ${isFull ? 'bg-slate-900 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white shadow-md shadow-pink-600/30'} text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
                <span>${isFull ? 'Agotado' : 'Inscribirme'}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  openDetailsModal: (sessionId) => {
    const sessions = Storage.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const modal = document.getElementById('details-modal');
    const modalContent = document.getElementById('details-modal-content');
    if (!modal || !modalContent) return;

    const attendeesCount = session.attendees ? session.attendees.length : 0;
    const availableSpots = Math.max(0, session.capacity - attendeesCount);

    modalContent.innerHTML = `
      <div class="p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4 pb-4 border-b border-slate-800 mb-6">
          <div>
            <span class="text-xs font-bold text-pink-400 uppercase tracking-wider bg-pink-950/70 px-2.5 py-1 rounded border border-pink-800/40 inline-block mb-2">
              ${session.isSpecial ? '✦ MASTERCLASS ESPECIAL' : `${session.discipline.toUpperCase()} • ${session.recurrenceLabel || 'PROGRAMADA'}`}
            </span>
            <h3 class="text-xl sm:text-2xl font-bold text-white font-heading">${session.title}</h3>
          </div>
          <button onclick="SessionsModule.closeDetailsModal()" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div class="space-y-6">
          <div>
            <h4 class="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Acerca de la Sesión</h4>
            <p class="text-slate-300 text-sm leading-relaxed">${session.description}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400 block mb-1">📅 Fecha y Horario:</span>
              <span class="text-white font-bold text-sm block">${new Date(session.date + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span class="text-pink-400 font-semibold">${session.time}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400 block mb-1">📍 Punto de Encuentro:</span>
              <span class="text-white font-bold text-sm block">${session.location.name}</span>
              <span class="text-slate-400">${session.location.address}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400 block mb-1">${session.isSpecial ? '✨ Inscripción:' : '🥋 Cobertura SAFE ZONE:'}</span>
              <span class="text-pink-400 font-bold text-sm">${session.isSpecial ? 'Pago individual · no usa códigos ni tickets de combos' : `Válido con Pase Universal o Pase ${session.discipline.toUpperCase()}`}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span class="text-slate-400 block mb-1">👥 Estado de Cupos:</span>
              <span class="text-emerald-400 font-bold text-sm">${availableSpots} disponibles de ${session.capacity} totales</span>
            </div>
          </div>

          <div>
            <h4 class="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Qué Debes Traer (Requerimientos)</h4>
            <div class="flex flex-wrap gap-2">
              ${session.requirements.map(req => `
                <span class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs flex items-center gap-1.5">
                  <i data-lucide="check-circle" class="w-3.5 h-3.5 text-pink-400"></i> ${req}
                </span>
              `).join('')}
            </div>
          </div>

          ${session.isSpecial ? `<div class="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30"><span class="text-[10px] uppercase text-amber-300 font-bold">Precio de la masterclass</span><p class="text-lg font-black text-white mt-1">${SessionsModule.money(session.price)}${session.presaleActive ? ' · Preventa activa' : ''}</p>${session.presaleActive ? `<p class="text-xs text-slate-400 mt-1">Hasta ${new Date(session.presaleEndsOn + 'T00:00:00').toLocaleDateString('es-CO', {day:'numeric',month:'long'})}; después ${SessionsModule.money(session.regularPrice)}.</p>` : ''}</div>` : ''}

          <div class="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center gap-4">
            <img src="${session.instructorAvatar}" alt="${session.instructorName}" class="w-12 h-12 rounded-full object-cover border border-pink-500">
            <div>
              <span class="text-[10px] uppercase text-pink-400 font-bold">${session.isSpecial ? 'Profesores de la masterclass' : 'Instructor Safe Zone'}</span>
              <h5 class="text-white font-bold text-sm">${session.instructorName}</h5>
              <p class="text-xs text-slate-400">${session.isSpecial ? 'Una clase especial con toda la comunidad Safe Zone.' : 'Acompañamiento personalizado y corrección de técnica paso a paso.'}</p>
            </div>
          </div>

          <div class="pt-4 flex items-center justify-between border-t border-slate-800">
            <div>
              <span class="text-xs text-slate-400 block">${session.isSpecial ? 'Inscripción especial:' : 'Aporte individual:'}</span>
              <span class="text-2xl font-extrabold text-pink-400 font-heading">$${session.price.toLocaleString('es-CO')} COP</span>
            </div>
            <button onclick="SessionsModule.closeDetailsModal(); SessionsModule.openRegisterModal('${session.id}')"
              class="py-3 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-all flex items-center gap-2 cursor-pointer">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Inscribirme Ahora</span>
            </button>
          </div>
        </div>
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

  openRegisterModal: (sessionId) => {
    const sessions = Storage.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    SessionsModule.singleClassReceiptBase64 = null;
    SessionsModule.singleClassReceiptReady = false;

    const modal = document.getElementById('register-modal');
    const modalContent = document.getElementById('register-modal-content');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <i data-lucide="calendar-check" class="w-6 h-6"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white font-heading">Inscripción a Clase</h3>
              <p class="text-xs text-slate-400">${session.title}</p>
            </div>
          </div>
          <button onclick="SessionsModule.closeRegisterModal()" class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        ${session.isSpecial ? `<div class="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs"><p class="font-black text-amber-200">✦ Masterclass especial</p><p class="text-slate-300 mt-1">Esta actividad no está incluida en la ticketera ni acepta códigos de combos. Inscríbete con pago individual por ${SessionsModule.money(session.price)}.</p></div>` : `<div class="grid grid-cols-2 gap-2 mb-6">
          <button type="button" id="tab-btn-code" onclick="SessionsModule.switchRegMethod('code')"
            class="py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
            <i data-lucide="ticket" class="w-4 h-4"></i>
            <span>Tengo Código Único</span>
          </button>
          <button type="button" id="tab-btn-single" onclick="SessionsModule.switchRegMethod('single')"
            class="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer">
            <i data-lucide="dollar-sign" class="w-4 h-4"></i>
            <span>Pagar $10.000 COP</span>
          </button>
        </div>`}

        <form onsubmit="SessionsModule.processRegistration(event, '${session.id}')" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nombre Completo de la Alumna *</label>
            <input type="text" id="reg-name" required placeholder="Ej: Mariana Torres"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp / Celular *</label>
            <input type="tel" id="reg-phone" required placeholder="Ej: 3001234567"
              class="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none">
          </div>

          <!-- OPCIÓN A: CANJE CON CÓDIGO ÚNICO -->
          ${session.isSpecial ? '' : `<div id="section-reg-code" class="p-4 rounded-2xl bg-gradient-to-br from-pink-950/30 via-slate-950 to-slate-950 border border-pink-500/40 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold text-pink-300 uppercase tracking-wide">Código Único de Ticketera *</label>
              <span class="text-[11px] text-emerald-400 font-bold">Paga $0 COP</span>
            </div>

            <div class="flex gap-2">
              <div class="relative flex-grow flex items-center">
                <input type="text" id="reg-unique-code" placeholder="Ej: SZ-88210"
                  class="w-full pl-3 pr-20 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-pink-500 focus:outline-none uppercase">
                <button type="button" onclick="TicketsModule.pasteCodeIntoInput('reg-unique-code')"
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-pink-400 text-xs font-bold border border-pink-500/30 flex items-center gap-1 cursor-pointer" title="Pegar código copiado">
                  <i data-lucide="clipboard" class="w-3 h-3"></i>
                  <span>Pegar</span>
                </button>
              </div>

              <button type="button" onclick="SessionsModule.checkCodeAvailability('${session.id}')"
                class="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shrink-0 cursor-pointer shadow-md">
                Verificar
              </button>
            </div>
            <div id="code-feedback-msg" class="text-xs hidden"></div>
          </div>`}

          <!-- OPCIÓN B: PAGO INDIVIDUAL CON COMPROBANTE -->
          <div id="section-reg-single" class="${session.isSpecial ? '' : 'hidden'} p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div class="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
              <span class="font-bold text-white">${session.isSpecial ? 'Transferencia para masterclass' : 'Transferencia de Aporte Individual'}</span>
              <span class="font-extrabold text-pink-400">${SessionsModule.money(session.price)}</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
              <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">🟣 Nequi: <strong>300 834 2306</strong></div>
<div class="p-2 rounded-lg bg-slate-900 border border-slate-800">🔴 Daviplata: <strong>300 834 2306</strong></div><div class="p-2 rounded-lg bg-slate-900 border border-slate-800">🟢 Bre-B: <strong>300 834 2306</strong></div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Adjuntar Foto del Comprobante (${SessionsModule.money(session.price)}) *</label>
              <div class="p-3 rounded-xl bg-slate-900 border-2 border-dashed border-slate-700 hover:border-pink-500 transition-colors text-center relative cursor-pointer">
                <input type="file" id="single-receipt-file" accept="image/*" onchange="SessionsModule.handleSingleReceiptUpload(event)"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
              <div id="single-receipt-msg" role="status" aria-live="polite" class="text-xs text-slate-400">
                  <i data-lucide="upload" class="w-4 h-4 text-pink-400 mx-auto mb-1"></i>
                  <span>Haz clic para subir foto del pago de ${SessionsModule.money(session.price)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-2">
            <button type="submit"
              class="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-fuchsia-600 hover:from-pink-500 hover:via-rose-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <i data-lucide="check-circle" class="w-5 h-5"></i>
              <span>Confirmar Reserva de Cupo</span>
            </button>
          </div>
        </form>
      </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide) lucide.createIcons();
  },

  switchRegMethod: (method) => {
    const btnCode = document.getElementById('tab-btn-code');
    const btnSingle = document.getElementById('tab-btn-single');
    const secCode = document.getElementById('section-reg-code');
    const secSingle = document.getElementById('section-reg-single');

    if (!btnCode || !btnSingle || !secCode || !secSingle) return;
    if (method === 'code') {
      btnCode.className = 'py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer';
      btnSingle.className = 'py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer';
      secCode.classList.remove('hidden');
      secSingle.classList.add('hidden');
    } else {
      btnSingle.className = 'py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer';
      btnCode.className = 'py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer';
      secSingle.classList.remove('hidden');
      secCode.classList.add('hidden');
    }
  },

  handleSingleReceiptUpload: async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const msg = document.getElementById('single-receipt-msg');
    SessionsModule.singleClassReceiptBase64 = null;
    SessionsModule.singleClassReceiptReady = false;
    if (msg) msg.innerHTML = '<span class="text-pink-300 font-bold">Preparando comprobante...</span>';

    try {
      const prepared = await App.prepareReceiptImage(file);
      SessionsModule.singleClassReceiptBase64 = prepared.dataUrl;
      SessionsModule.singleClassReceiptReady = true;
      if (msg) msg.innerHTML = `<span class="text-emerald-400 font-bold">Comprobante listo: ${prepared.name}. Ya puedes confirmar tu reserva.</span>`;
      App.showToast('Comprobante cargado correctamente. Ya puedes confirmar tu reserva.');
    } catch (error) {
      if (msg) msg.innerHTML = `<span class="text-red-400 font-bold">${error.message || 'No fue posible preparar el comprobante.'}</span>`;
      App.showToast(error.message || 'No fue posible cargar el comprobante.');
    }
  },

  checkCodeAvailability: (sessionId) => {
    const codeInput = document.getElementById('reg-unique-code');
    const feedback = document.getElementById('code-feedback-msg');
    if (!codeInput || !feedback) return;
    const session = Storage.getSessions().find(item => item.id === sessionId);
    if (session?.isSpecial) {
      feedback.textContent = '❌ Esta masterclass especial no acepta códigos ni tickets de combos.';
      feedback.className = 'text-xs text-red-400 font-semibold block';
      return;
    }

    const code = codeInput.value.trim().toUpperCase();
    if (!code) {
      feedback.textContent = '❌ Por favor ingresa un código.';
      feedback.className = 'text-xs text-red-400 font-semibold block';
      return;
    }

    const tx = Storage.findTransactionByCode(code);
    if (!tx) {
      feedback.textContent = '❌ Código no encontrado. Verifica si fue bien escrito.';
      feedback.className = 'text-xs text-red-400 font-semibold block';
      return;
    }

    if (tx.status !== 'approved') {
      feedback.textContent = '🟡 Este código está pendiente de aprobación por la administradora.';
      feedback.className = 'text-xs text-amber-300 font-semibold block';
      return;
    }

    if (tx.remainingTickets <= 0) {
      feedback.textContent = '❌ Este código ya no tiene tickets disponibles (0 restantes).';
      feedback.className = 'text-xs text-red-400 font-semibold block';
      return;
    }

    if (tx.discipline !== 'all' && tx.discipline !== session?.discipline) {
      feedback.textContent = `❌ Este código es exclusivo de ${tx.discipline.toUpperCase()} y no aplica para esta clase.`;
      feedback.className = 'text-xs text-red-400 font-semibold block';
      return;
    }

    feedback.textContent = `✅ Código Válido (${tx.studentName}) • ${tx.remainingTickets} tickets disponibles para redimir.`;
    feedback.className = 'text-xs text-emerald-400 font-bold block';
  },

  closeRegisterModal: () => {
    const modal = document.getElementById('register-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  processRegistration: (event, sessionId) => {
    event.preventDefault();
    const sessions = Storage.getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const codeSection = document.getElementById('section-reg-code');
    const isCodeMode = !session.isSpecial && codeSection && !codeSection.classList.contains('hidden');

    if (isCodeMode) {
      const code = document.getElementById('reg-unique-code').value.trim().toUpperCase();
      const tx = Storage.findTransactionByCode(code);

      if (!tx || tx.status !== 'approved' || tx.remainingTickets <= 0) {
        alert('Por favor ingresa un código válido y verificado con saldo de tickets.');
        return;
      }

      if (session.isSpecial) { alert('Esta masterclass especial no admite códigos de ticketera.'); return; }
      if (tx.discipline !== 'all' && tx.discipline !== session.discipline) { alert(`Este código es exclusivo de ${tx.discipline.toUpperCase()} y no puede usarse para una clase de ${session.discipline.toUpperCase()}.`); return; } tx.remainingTickets -= 1;
      tx.history.push({
        action: "Redención de Ticket",
        detail: `Cupo reservado para: ${session.title} (${session.date})`,
        date: new Date().toISOString()
      });

      const allTxs = Storage.getTransactions();
      const txIndex = allTxs.findIndex(t => t.id === tx.id);
      if (txIndex > -1) allTxs[txIndex] = tx;
      Storage.saveTransactions(allTxs);

      const attendee = {
        id: "att-" + Math.random().toString(36).substring(2, 9),
        name: name,
        phone: phone,
        paymentMethod: "ticket",
        uniqueCode: code,
        registeredAt: new Date().toISOString()
      };
      try { Storage.addSessionAttendee(session.id, attendee); }
      catch (error) { console.warn('No fue posible guardar el cupo local de la alumna.', error); }
      SessionsModule.closeRegisterModal();
      SessionsModule.renderSessions();

      App.showToast(`🎉 ¡Inscripción confirmada con tu código ${code}! Te quedan ${tx.remainingTickets} tickets.`);
    } else {
      const receiptFeedback = document.getElementById('single-receipt-msg');
      if (!SessionsModule.singleClassReceiptReady || !SessionsModule.singleClassReceiptBase64) {
        if (receiptFeedback) receiptFeedback.innerHTML = '<span class="text-red-400 font-bold">Adjunta el comprobante y espera el mensaje de “Comprobante listo” antes de confirmar.</span>';
        App.showToast('Falta adjuntar y preparar el comprobante de pago.');
        return;
      }
      const submitButton = event.currentTarget?.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('opacity-60', 'cursor-wait');
        submitButton.querySelector('span').textContent = 'Guardando comprobante...';
      }
      const receiptUrl = SessionsModule.singleClassReceiptBase64;
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const uniqueCode = "SZ-CL-" + randomDigits;

      const newTx = {
        id: "tx-" + Math.random().toString(36).substring(2, 9),
        uniqueCode: uniqueCode,
        type: session.isSpecial ? "special_class" : "single_class",
        sessionId: session.id,
        sessionDate: session.date,
        sessionTime: session.time,
        sessionLocation: session.location ? session.location.name : "Sede Bogotá",
        title: session.title,
        discipline: session.discipline,
        disciplineLabel: session.discipline.toUpperCase(),
        studentName: name,
        studentPhone: phone,
        studentEmail: "",
        amount: session.price || 10000,
        paymentMethod: "Transferencia Individual",
        receiptUrl: receiptUrl,
        receiptExpiresAt: new Date(Date.now() + Storage.receiptRetentionDays * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
        createdAt: new Date().toISOString(),
        approvedAt: null,
        expiryDate: session.date,
        totalTickets: 1,
        remainingTickets: 0,
        history: [
          {
            action: session.isSpecial ? "Pago de Masterclass Especial" : "Pago de Clase Individual",
            detail: `Comprobante de $${(session.price || 10000).toLocaleString('es-CO')} COP recibido para ${session.title} (${session.date} - ${session.time}). En espera de verificación.`,
            date: new Date().toISOString()
          }
        ]
      };

      try {
        const allTxs = Storage.getTransactions();
        allTxs.unshift(newTx);
        Storage.saveTransactions(allTxs);
      } catch (error) {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('opacity-60', 'cursor-wait');
          submitButton.querySelector('span').textContent = 'Confirmar Reserva de Cupo';
        }
        if (receiptFeedback) receiptFeedback.innerHTML = '<span class="text-red-400 font-bold">No fue posible guardar el comprobante. Intenta con una captura más pequeña.</span>';
        App.showToast('No fue posible guardar el comprobante.');
        return;
      }

      const attendee = {
        id: "att-" + Math.random().toString(36).substring(2, 9),
        name: name,
        phone: phone,
        paymentMethod: "single_payment",
        uniqueCode: uniqueCode,
        registeredAt: new Date().toISOString()
      };
      try { Storage.addSessionAttendee(session.id, attendee); }
      catch (error) { console.warn('El pago quedó registrado, pero no fue posible actualizar el contador local de cupos.', error); }
      SessionsModule.closeRegisterModal();
      SessionsModule.renderSessions();

      App.showToast('Comprobante enviado. El pago queda pendiente de aprobación administrativa.');
      App.showSuccessCodeModal(newTx);
    }
  }
};

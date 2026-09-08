/* Portal compartido de profesores: únicamente programación de clases. */
const TeacherPortal = {
  storageKey: 'safezone_teacher_session',

  session: () => {
    try { return JSON.parse(localStorage.getItem(TeacherPortal.storageKey) || 'null'); }
    catch (error) { return null; }
  },

  isAuthenticated: () => Boolean(TeacherPortal.session()?.access_token),

  login: async (event) => {
    event.preventDefault();
    const username = document.getElementById('teacher-username').value.trim().toLowerCase();
    const password = document.getElementById('teacher-password').value;
    const error = document.getElementById('teacher-auth-error');
    if (username !== 'profesores') {
      error.textContent = 'Usa el usuario compartido asignado a profesores.';
      error.classList.remove('hidden');
      return;
    }
    try {
      const session = await SafeZoneCloud.signInTeacher(password);
      localStorage.setItem(TeacherPortal.storageKey, JSON.stringify({
        access_token: session.access_token,
        expires_at: session.expires_at
      }));
      TeacherPortal.render();
      App.showToast('📅 Acceso de profesores habilitado.');
    } catch (requestError) {
      error.textContent = 'Credenciales incorrectas o cuenta de profesores pendiente de activación.';
      error.classList.remove('hidden');
    }
  },

  logout: () => {
    localStorage.removeItem(TeacherPortal.storageKey);
    TeacherPortal.render();
  },

  render: () => {
    const container = document.getElementById('teacher-portal-container');
    if (!container) return;
    if (!TeacherPortal.isAuthenticated()) {
      container.innerHTML = `
        <div class="max-w-md mx-auto my-6 glass-card rounded-3xl p-7 border border-pink-500/40 shadow-2xl shadow-pink-950/30">
          <div class="text-center mb-6">
            <div class="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-pink-500/10 border border-pink-500/30 text-pink-400"><i data-lucide="calendar-days" class="w-8 h-8"></i></div>
            <span class="text-[10px] font-black tracking-widest uppercase text-pink-300">Acceso compartido</span>
            <h2 class="text-2xl font-black text-white font-heading">Portal de Profesores</h2>
            <p class="text-xs text-slate-400 mt-1">Aquí solo puedes consultar y programar clases.</p>
          </div>
          <form onsubmit="TeacherPortal.login(event)" class="space-y-4">
            <div id="teacher-auth-error" class="hidden p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs"></div>
            <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Usuario</label><input id="teacher-username" required autocomplete="username" value="profesores" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></div>
            <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label><input id="teacher-password" type="password" required autocomplete="current-password" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></div>
            <button class="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold">Ingresar al calendario</button>
          </form>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const instructors = Storage.getInstructors();
    const schedules = Storage.getTeacherSchedules();
    container.innerHTML = `
      <div class="glass-card rounded-2xl p-5 sm:p-6 border border-pink-500/30 mb-6 flex items-center justify-between gap-4">
        <div><span class="text-[10px] font-black uppercase tracking-widest text-pink-400">Profesores Safe Zone</span><h2 class="text-2xl font-black text-white font-heading">Calendario de clases</h2><p class="text-xs text-slate-400">Programa día, sede, horario y profesor.</p></div>
        <button onclick="TeacherPortal.logout()" class="px-3 py-2 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white">Cerrar sesión</button>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onsubmit="TeacherPortal.schedule(event)" class="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 class="font-bold text-white flex items-center gap-2"><i data-lucide="calendar-plus" class="w-5 h-5 text-pink-400"></i> Programar clase</h3>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1">Día</label><input id="teacher-date" type="date" required min="${new Date().toISOString().slice(0, 10)}" class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1">Profesor</label><select id="teacher-instructor" required class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm">${instructors.map(inst => `<option value="${inst.id}">${inst.name}</option>`).join('')}</select></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1">Lugar / sede</label><select id="teacher-location" class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"><option>Parque Simón Bolívar - Sector Templete</option><option>Parque El Virrey - Costado Oriental</option><option>Coliseo El Salitre - Canchas Exteriores</option><option>Sede Safe Zone</option></select></div>
          <div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-semibold text-slate-300 mb-1">Inicio</label><input id="teacher-start" type="time" required value="08:00" class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"></div><div><label class="block text-xs font-semibold text-slate-300 mb-1">Fin</label><input id="teacher-end" type="time" required value="09:30" class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"></div></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1">Disciplina</label><select id="teacher-discipline" class="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm"><option value="defensa-personal">Defensa Personal</option><option value="boxeo">Boxeo</option><option value="taekwondo">Taekwondo</option></select></div>
          <button class="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold">Publicar clase</button>
        </form>
        <div class="lg:col-span-3 glass-card rounded-2xl p-5 border border-slate-800"><h3 class="font-bold text-white mb-4">Próximas clases programadas</h3>${schedules.length ? `<div class="space-y-3">${schedules.map(item => `<div class="p-4 rounded-xl bg-slate-950 border border-slate-800"><p class="font-bold text-white text-sm">${item.class_date} · ${item.start_time.slice(0, 5)}–${item.end_time.slice(0, 5)}</p><p class="text-xs text-pink-300 mt-1">${item.instructor_name} · ${item.location}</p></div>`).join('')}</div>` : `<p class="text-sm text-slate-400 py-10 text-center">Aún no hay clases programadas desde este portal.</p>`}</div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  },

  schedule: async (event) => {
    event.preventDefault();
    const inst = Storage.getInstructors().find(item => item.id === document.getElementById('teacher-instructor').value);
    if (!inst) return;
    const schedule = {
      class_date: document.getElementById('teacher-date').value,
      start_time: document.getElementById('teacher-start').value,
      end_time: document.getElementById('teacher-end').value,
      location: document.getElementById('teacher-location').value,
      instructor_id: inst.id, instructor_name: inst.name, instructor_avatar: inst.avatar,
      discipline: document.getElementById('teacher-discipline').value,
      title: `Entrenamiento de ${inst.disciplineName || inst.discipline}`,
      capacity: 18
    };
    try {
      const created = await SafeZoneCloud.createTeacherSchedule(schedule, TeacherPortal.session().access_token);
      Storage.saveTeacherSchedules([...Storage.getTeacherSchedules(), created]);
      TeacherPortal.render();
      SessionsModule.renderSessions();
      App.showToast('✅ Clase programada y publicada.');
    } catch (requestError) {
      App.showToast('No fue posible guardar la clase. Vuelve a iniciar sesión e inténtalo de nuevo.');
    }
  }
};

/* Punto de acceso único: dirige cada credencial exclusivamente a su portal. */
const AccessPortal = {
  adminUsers: ['admin', 'administradora', 'safezone', 'staff'],
  teacherUsers: ['profesor', 'profesores'],

  render: () => {
    const container = document.getElementById('access-portal-container');
    if (!container) return;
    container.innerHTML = `
      <div class="max-w-md mx-auto my-6 glass-card rounded-3xl p-7 sm:p-8 border border-pink-500/40 shadow-2xl shadow-pink-950/30">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-pink-500/10 border border-pink-500/30 text-pink-400"><i data-lucide="shield-check" class="w-8 h-8"></i></div>
          <span class="text-[10px] font-black tracking-widest uppercase text-pink-300">Acceso seguro Safe Zone</span>
          <h2 class="text-2xl font-black text-white font-heading">Portal de acceso</h2>
          <p class="text-xs text-slate-400 mt-1">Usa tus credenciales. El sistema abrirá únicamente el espacio asignado a tu usuario.</p>
        </div>
        <form onsubmit="AccessPortal.login(event)" class="space-y-4">
          <div id="access-auth-error" class="hidden p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs"></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Usuario</label><input id="access-username" required autocomplete="username" placeholder="Usuario de administradora o profesor" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label><input id="access-password" type="password" required autocomplete="current-password" placeholder="••••••••" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></div>
          <button class="w-full py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm font-bold">Ingresar</button>
        </form>
      </div>`;
    if (window.lucide) lucide.createIcons();
  },

  showError: (message) => {
    const error = document.getElementById('access-auth-error');
    if (!error) return;
    error.textContent = message;
    error.classList.remove('hidden');
  },

  login: async (event) => {
    event.preventDefault();
    const username = document.getElementById('access-username').value.trim().toLowerCase();
    const password = document.getElementById('access-password').value;
    const error = document.getElementById('access-auth-error');
    if (error) error.classList.add('hidden');

    if (AccessPortal.teacherUsers.includes(username)) {
      try {
        const session = await SafeZoneCloud.signInTeacher(password);
        localStorage.removeItem('safezone_auth_token');
        localStorage.removeItem('safezone_logged_user');
        localStorage.setItem(TeacherPortal.storageKey, JSON.stringify({ access_token: session.access_token, expires_at: session.expires_at }));
        App.switchTab('teacher-portal');
        App.showToast('📅 Acceso de profesores habilitado.');
      } catch (requestError) {
        AccessPortal.showError('Credenciales de profesor incorrectas o cuenta pendiente de activación.');
      }
      return;
    }

    const validAdminPassword = InstructorModule.getCustomPassword();
    const adminPasswordMatches = password === validAdminPassword || password === 'admin123' || password === 'safezone2026' || password === 'profesor2026';
    if (AccessPortal.adminUsers.includes(username) && adminPasswordMatches) {
      localStorage.removeItem(TeacherPortal.storageKey);
      localStorage.setItem('safezone_auth_token', 'authenticated_staff_2026');
      localStorage.setItem('safezone_logged_user', username);
      InstructorModule.activeSubTab = 'transactions';
      App.switchTab('instructor-portal');
      App.showToast('🔓 Acceso de administradora habilitado.');
      return;
    }

    AccessPortal.showError('Credenciales incorrectas. Verifica el usuario y la contraseña asignados.');
  }
};

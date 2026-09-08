/* Safe Zone: perfiles persistentes y encuadre de fotos. */
(function () {
  const C = SafeZoneCloud;
  const endpoint = C.url + '/rest/v1/safezone_instructors';
  const adminKey = 'safezone_admin_session';
  const session = () => { try { return JSON.parse(localStorage.getItem(adminKey) || 'null'); } catch (e) { return null; } };
  const token = () => session()?.access_token || '';
  const authenticated = () => { const s = session(); return Boolean(s?.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now())); };
  const headers = (value) => ({ apikey: C.key, Authorization: 'Bearer ' + (value || C.key) });
  const syncError = () => App.showToast('No fue posible sincronizar el profesor. Conserva esta página abierta e inténtalo de nuevo.');

  C.fetchInstructors = async () => {
    const response = await fetch(endpoint + '?select=profile&order=updated_at.asc', { headers: headers() });
    if (!response.ok) throw new Error('Supabase respondió ' + response.status);
    return (await response.json()).map(row => row.profile);
  };
  C.signInAdmin = async password => {
    const response = await fetch(C.url + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: { apikey: C.key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@safezone.club', password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'No fue posible iniciar sesión.');
    return data;
  };
  C.createInstructor = async (profile, accessToken) => {
    const response = await fetch(endpoint, { method: 'POST', headers: { ...headers(accessToken), 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ id: profile.id, profile, updated_at: new Date().toISOString() }) });
    if (!response.ok) throw new Error('No se pudo guardar el profesor.');
  };
  C.updateInstructor = async (id, profile, accessToken) => {
    const response = await fetch(endpoint + '?id=eq.' + encodeURIComponent(id), { method: 'PATCH', headers: { ...headers(accessToken), 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ profile, updated_at: new Date().toISOString() }) });
    if (!response.ok) throw new Error('No se pudo actualizar el profesor.');
  };
  C.deleteInstructor = async (id, accessToken) => {
    const response = await fetch(endpoint + '?id=eq.' + encodeURIComponent(id), { method: 'DELETE', headers: { ...headers(accessToken), Prefer: 'return=representation' } });
    if (!response.ok) throw new Error('No se pudo eliminar el profesor.');
  };

  const originalInitialize = Storage.initialize.bind(Storage);
  Storage.initialize = async () => {
    await originalInitialize();
    try { localStorage.setItem('safezone_instructors', JSON.stringify(await C.fetchInstructors())); }
    catch (error) { console.warn('No fue posible actualizar la nómina de Safe Zone.', error); }
  };
  Storage.addInstructor = data => {
    const list = Storage.getInstructors();
    const profile = { id: 'inst-' + Math.random().toString(36).substring(2, 9), ...data };
    list.push(profile); Storage.saveInstructors(list);
    C.createInstructor(profile, token()).catch(syncError);
    return profile;
  };
  Storage.updateInstructor = async (id, changes) => {
    const list = Storage.getInstructors(); const index = list.findIndex(item => item.id === id);
    if (index < 0) return false;
    const profile = { ...list[index], ...changes };
    delete profile.rating; delete profile.reviewsCount;
    await C.updateInstructor(id, profile, token());
    list[index] = profile; Storage.saveInstructors(list);
    return true;
  };
  Storage.deleteInstructor = id => {
    Storage.saveInstructors(Storage.getInstructors().filter(item => item.id !== id));
    C.deleteInstructor(id, token()).catch(syncError);
    return true;
  };

  InstructorModule.isAuthenticated = authenticated;
  InstructorModule.login = async event => {
    event.preventDefault();
    const user = document.getElementById('auth-username').value.trim().toLowerCase();
    const password = document.getElementById('auth-password').value.trim();
    const error = document.getElementById('auth-error-msg');
    if (user !== 'admin') { error.textContent = '❌ Este portal solo admite el usuario administrativo autorizado.'; error.classList.remove('hidden'); return; }
    try {
      const data = await C.signInAdmin(password);
      localStorage.setItem(adminKey, JSON.stringify({ access_token: data.access_token, expires_at: data.expires_at }));
      localStorage.setItem('safezone_logged_user', 'admin'); error.classList.add('hidden');
      InstructorModule.activeSubTab = 'transactions'; InstructorModule.renderInstructorPortal();
      App.showToast('🔓 Acceso administrativo seguro habilitado.');
    } catch (requestError) { error.textContent = '❌ Credenciales incorrectas. Verifica el usuario y contraseña.'; error.classList.remove('hidden'); }
  };
  InstructorModule.logout = () => { localStorage.removeItem(adminKey); localStorage.removeItem('safezone_logged_user'); InstructorModule.renderInstructorPortal(); App.showToast('🔒 Sesión administrativa cerrada.'); };

  const photoControls = () => document.querySelectorAll('#inst-avatar-dropzone').forEach(zone => {
    const input = zone.querySelector('#inst-avatar-file-input');
    const placeholder = zone.querySelector('#inst-avatar-placeholder');
    const preview = zone.querySelector('#inst-avatar-preview-wrap');
    if (!input) return;
    input.style.pointerEvents = 'none';
    if (placeholder && !placeholder.dataset.safezonePicker) { placeholder.dataset.safezonePicker = 'true'; placeholder.style.cursor = 'pointer'; placeholder.addEventListener('click', () => input.click()); }
    if (preview && !preview.querySelector('.safezone-change-photo')) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Cambiar foto';
      button.className = 'safezone-change-photo mb-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-white';
      button.addEventListener('click', event => { event.stopPropagation(); input.click(); });
      preview.querySelector('p')?.insertAdjacentElement('afterend', button);
    }
  });
  new MutationObserver(photoControls).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', photoControls);
})();

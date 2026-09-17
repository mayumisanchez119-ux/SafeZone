/* Evita que fotos pesadas impidan guardar profesores. */
(function () {
  const cloud = SafeZoneCloud;
  const sessionKey = 'safezone_admin_session';
  const token = () => { try { return JSON.parse(localStorage.getItem(sessionKey) || '{}').access_token || ''; } catch (error) { return ''; } };
  // Old caches may contain demo profiles. Only use profiles confirmed by Supabase
  // during this visit; never overwrite or delete the user's existing cache on failure.
  let memory = [];
  let pending = null;
  Storage.instructorsLoadState = 'loading';
  Storage.getInstructors = () => memory;
  Storage.saveInstructors = (profiles) => {
    memory = profiles;
    try { localStorage.setItem('safezone_instructors', JSON.stringify(profiles)); }
    catch (error) { console.warn('La copia local está llena; los perfiles siguen protegidos en Safe Zone.', error); }
  };
  Storage.instructorsLoadMessage = () => `<div role="status" class="col-span-full glass-card rounded-2xl p-8 text-center text-slate-300">${Storage.instructorsLoadState === 'error'
    ? 'No pudimos cargar los profesores. Revisa tu conexión.<br><button type="button" onclick="Storage.loadInstructors()" class="mt-4 px-5 py-3 rounded-xl bg-pink-600 text-white font-bold">Reintentar carga de profesores</button>'
    : 'Cargando profesores…'}</div>`;
  const redraw = () => {
    InstructorModule.renderInstructors();
    if (App.currentTab === 'instructor-portal') InstructorModule.renderInstructorPortal();
    if (App.currentTab === 'teacher-portal') TeacherPortal.render();
  };
  Storage.loadInstructors = () => {
    if (pending) return pending;
    Storage.instructorsLoadState = 'loading';
    redraw();
    pending = (async () => {
      try {
        const profiles = await cloud.fetchInstructors();
        if (!Array.isArray(profiles)) throw new Error('Respuesta de profesores inválida.');
        Storage.saveInstructors(profiles);
        Storage.instructorsLoadState = 'ready';
      } catch (error) {
        Storage.instructorsLoadState = 'error';
        console.warn('No fue posible actualizar los perfiles de Safe Zone.', error);
      } finally {
        pending = null;
        redraw();
      }
    })();
    return pending;
  };
  const initialLoad = Storage.initialize.bind(Storage);
  Storage.initialize = () => Promise.all([initialLoad(), Storage.loadInstructors()]);
  const renderProfiles = InstructorModule.renderInstructors.bind(InstructorModule);
  InstructorModule.renderInstructors = () => {
    const container = document.getElementById('instructors-container');
    if (Storage.instructorsLoadState !== 'ready') {
      if (container) container.innerHTML = Storage.instructorsLoadMessage();
      return;
    }
    renderProfiles();
    if (container && !memory.length) container.innerHTML = '<p role="status" class="col-span-full p-8 text-center text-slate-300">Aún no hay profesores publicados.</p>';
  };
  const renderManagement = InstructorModule.renderInstructorsManagementSection.bind(InstructorModule);
  InstructorModule.renderInstructorsManagementSection = () => Storage.instructorsLoadState === 'ready' ? renderManagement() : Storage.instructorsLoadMessage();
  Storage.addInstructor = async (data) => {
    const profile = Object.assign({ id: 'inst-' + Math.random().toString(36).substring(2, 9) }, data);
    delete profile.rating; delete profile.reviewsCount;
    await cloud.createInstructor(profile, token());
    Storage.saveInstructors(Storage.getInstructors().concat(profile));
    return profile;
  };
  const optimize = (source) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const size = Math.max(image.naturalWidth, image.naturalHeight);
      const ratio = Math.min(1, 720 / size);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };
    image.onerror = reject;
    image.src = source;
  });
  InstructorModule.handleInstructorAvatarFile = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (result) => {
      try { InstructorModule.updateAvatarPreview(await optimize(result.target.result)); App.showToast('Foto optimizada y lista para publicar.'); }
      catch (error) { App.showToast('No fue posible procesar esa foto. Selecciona otra e inténtalo de nuevo.'); }
    };
    reader.readAsDataURL(file);
  };
})();

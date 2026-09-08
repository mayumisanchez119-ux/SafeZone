/* Evita que fotos pesadas impidan guardar profesores. */
(function () {
  const cloud = SafeZoneCloud;
  const sessionKey = 'safezone_admin_session';
  const token = () => { try { return JSON.parse(localStorage.getItem(sessionKey) || '{}').access_token || ''; } catch (error) { return ''; } };
  let memory = null;
  const originalGet = Storage.getInstructors.bind(Storage);
  Storage.getInstructors = () => memory || originalGet();
  Storage.saveInstructors = (profiles) => {
    memory = profiles;
    try { localStorage.setItem('safezone_instructors', JSON.stringify(profiles)); }
    catch (error) { console.warn('La copia local está llena; los perfiles siguen protegidos en Safe Zone.', error); }
  };
  const initialLoad = Storage.initialize.bind(Storage);
  Storage.initialize = async () => {
    await initialLoad();
    try { Storage.saveInstructors(await cloud.fetchInstructors()); }
    catch (error) { console.warn('No fue posible actualizar los perfiles de Safe Zone.', error); }
  };
  Storage.addInstructor = async (data) => {
    const profile = Object.assign({ id: 'inst-' + Math.random().toString(36).substring(2, 9), rating: 5, reviewsCount: 1 }, data);
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

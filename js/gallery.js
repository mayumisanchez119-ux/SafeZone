/* Galería pública de encuentros reales. Las fotos viven en Storage, no en la base de datos. */
const GalleryModule = {
  items: [],
  loadState: 'loading',
  pendingImages: [],
  maxItems: 12,

  escape(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  },

  formatDate(value) {
    if (!value) return '';
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  },

  getAdminToken() {
    try { return JSON.parse(localStorage.getItem('safezone_admin_session') || '{}').access_token || ''; }
    catch (error) { return ''; }
  },

  normalise(items) {
    return Array.isArray(items) ? items
      .filter(item => item && item.id && item.image)
      .sort((a, b) => String(b.eventDate || b.createdAt || '').localeCompare(String(a.eventDate || a.createdAt || '')))
      .slice(0, GalleryModule.maxItems) : [];
  },

  async load() {
    GalleryModule.loadState = 'loading';
    GalleryModule.render();
    try {
      const content = await SafeZoneCloud.fetchContent();
      GalleryModule.items = GalleryModule.normalise(content.gallery);
      GalleryModule.loadState = 'ready';
    } catch (error) {
      GalleryModule.items = [];
      GalleryModule.loadState = 'error';
      console.warn('No fue posible cargar la galería de Safe Zone.', error);
    }
    GalleryModule.render();
    if (App?.currentTab === 'instructor-portal' && InstructorModule?.activeSubTab === 'gallery') InstructorModule.renderInstructorPortal();
  },

  render() {
    const container = document.getElementById('gallery-container');
    if (!container) return;
    if (GalleryModule.loadState === 'loading') {
      container.innerHTML = '<div class="col-span-full glass-card rounded-2xl p-10 text-center text-slate-400 border border-slate-800"><i data-lucide="loader-circle" class="w-8 h-8 mx-auto mb-3 animate-spin text-pink-400"></i><p class="text-sm font-semibold">Cargando encuentros reales…</p></div>';
    } else if (GalleryModule.loadState === 'error') {
      container.innerHTML = '<div class="col-span-full glass-card rounded-2xl p-10 text-center text-slate-400 border border-slate-800"><i data-lucide="wifi-off" class="w-8 h-8 mx-auto mb-3 text-rose-400"></i><p class="text-sm font-semibold text-white">No se pudo cargar la galería.</p><button type="button" onclick="GalleryModule.load()" class="mt-4 px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-bold">Reintentar</button></div>';
    } else if (!GalleryModule.items.length) {
      container.innerHTML = '<div class="col-span-full glass-card rounded-2xl p-10 text-center text-slate-400 border border-dashed border-pink-500/30"><i data-lucide="images" class="w-10 h-10 mx-auto mb-3 text-pink-400"></i><p class="text-base font-bold text-white">Pronto compartiremos nuestros encuentros</p><p class="text-sm mt-1">Las fotos reales de la comunidad aparecerán aquí.</p></div>';
    } else {
      container.innerHTML = GalleryModule.items.map(item => `
        <article class="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:border-pink-500/50 transition-colors group">
          <div class="aspect-[4/3] overflow-hidden bg-slate-900"><img src="${GalleryModule.escape(item.image)}" alt="${GalleryModule.escape(item.title || 'Encuentro Safe Zone')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"></div>
          <div class="p-4"><h3 class="text-sm font-black text-white">${GalleryModule.escape(item.title || 'Encuentro Safe Zone')}</h3>${item.eventDate ? `<p class="text-[11px] text-pink-300 mt-1">${GalleryModule.formatDate(item.eventDate)}</p>` : ''}${item.caption ? `<p class="text-xs text-slate-400 mt-2 leading-relaxed">${GalleryModule.escape(item.caption)}</p>` : ''}</div>
        </article>`).join('');
    }
    if (window.lucide) lucide.createIcons();
  },

  renderAdmin() {
    const cards = GalleryModule.items.length ? GalleryModule.items.map(item => `
      <article class="rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
        <img src="${GalleryModule.escape(item.image)}" alt="${GalleryModule.escape(item.title)}" class="w-full aspect-[4/3] object-cover">
        <div class="p-3 flex items-start justify-between gap-3"><div><p class="text-xs font-bold text-white">${GalleryModule.escape(item.title || 'Encuentro Safe Zone')}</p><p class="text-[10px] text-slate-400 mt-1">${GalleryModule.formatDate(item.eventDate)}</p></div><button type="button" onclick="GalleryModule.remove('${GalleryModule.escape(item.id)}')" class="p-2 rounded-lg text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white" title="Eliminar foto"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>
      </article>`).join('') : '<div class="col-span-full py-8 text-center text-sm text-slate-400 border border-dashed border-slate-700 rounded-xl">Aún no hay fotos publicadas. Sube la primera imagen del próximo encuentro.</div>';
    return `
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <form onsubmit="GalleryModule.publish(event)" class="lg:col-span-2 glass-card rounded-2xl p-5 border border-pink-500/30 space-y-4">
          <div><span class="text-xs font-black uppercase tracking-wider text-pink-400">Galería pública</span><h3 class="text-xl font-black text-white font-heading mt-1">Publicar fotos de un encuentro</h3><p class="text-xs text-slate-400 mt-1">Elige una fecha y varias fotos: todas quedarán agrupadas bajo el mismo encuentro. Se comprimen antes de subirlas para ahorrar espacio. Máximo ${GalleryModule.maxItems} fotos visibles.</p></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Fecha del encuentro *</label><input id="gallery-date" type="date" required class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Fotos *</label><input id="gallery-file" type="file" accept="image/png,image/jpeg,image/webp" multiple required onchange="GalleryModule.preview(event)" class="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-pink-500"><p class="mt-2 text-[11px] text-slate-500">Puedes seleccionar varias imágenes a la vez. Cada una se podrá eliminar individualmente después.</p><div id="gallery-preview" class="hidden mt-3 grid grid-cols-3 gap-2" aria-live="polite"></div></div>
          <button type="submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2"><i data-lucide="images" class="w-4 h-4"></i>Publicar fotos</button>
        </form>
        <div class="lg:col-span-3"><div class="flex items-center justify-between mb-3"><h3 class="font-bold text-white">Fotos publicadas</h3><span class="text-xs text-pink-300">${GalleryModule.items.length}/${GalleryModule.maxItems}</span></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${cards}</div></div>
      </div>`;
  },

  async compress(file) {
    if (!file || !file.type.startsWith('image/')) throw new Error('Selecciona una imagen válida.');
    if (file.size > 10 * 1024 * 1024) throw new Error('La foto debe pesar menos de 10 MB.');
    const source = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = source; });
      const makeBlob = async (maxSize, quality) => {
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      };
      let blob = await makeBlob(1280, 0.78);
      if (blob && blob.size > 900 * 1024) blob = await makeBlob(960, 0.70);
      if (blob && blob.size > 900 * 1024) blob = await makeBlob(720, 0.64);
      if (!blob || blob.size > 1024 * 1024) throw new Error('No fue posible comprimir la foto por debajo de 1 MB. Prueba con una imagen más ligera.');
      return { blob, preview: URL.createObjectURL(blob) };
    } finally { URL.revokeObjectURL(source); }
  },

  async preview(event) {
    const files = Array.from(event.target.files || []);
    const preview = document.getElementById('gallery-preview');
    if (!files.length) return;
    const available = GalleryModule.maxItems - GalleryModule.items.length;
    if (files.length > available) {
      GalleryModule.pendingImages = [];
      event.target.value = '';
      preview.classList.add('hidden');
      preview.innerHTML = '';
      App.showToast(`⚠️ Puedes publicar máximo ${available} foto${available === 1 ? '' : 's'} más.`);
      return;
    }
    try {
      GalleryModule.pendingImages.forEach(item => URL.revokeObjectURL(item.preview));
      GalleryModule.pendingImages = await Promise.all(files.map(file => GalleryModule.compress(file)));
      preview.innerHTML = GalleryModule.pendingImages.map((image, index) => `<img src="${image.preview}" alt="Vista previa ${index + 1}" class="w-full aspect-square object-cover rounded-lg border border-slate-700">`).join('');
      preview.classList.remove('hidden');
    } catch (error) {
      GalleryModule.pendingImages = [];
      event.target.value = '';
      preview.classList.add('hidden');
      preview.innerHTML = '';
      App.showToast(`⚠️ ${error.message}`);
    }
  },

  async persist(nextItems) {
    const token = GalleryModule.getAdminToken();
    if (!token) throw new Error('Tu sesión administrativa venció. Vuelve a iniciar sesión.');
    await SafeZoneCloud.saveGallery(nextItems, token);
    GalleryModule.items = GalleryModule.normalise(nextItems);
  },

  async publish(event) {
    event.preventDefault();
    if (!InstructorModule.isAuthenticated()) return;
    const date = document.getElementById('gallery-date').value;
    if (!date) { App.showToast('⚠️ Selecciona la fecha del encuentro.'); return; }
    if (!GalleryModule.pendingImages.length) { App.showToast('⚠️ Selecciona al menos una foto antes de publicar.'); return; }
    if (GalleryModule.items.length + GalleryModule.pendingImages.length > GalleryModule.maxItems) { App.showToast(`⚠️ La galería admite máximo ${GalleryModule.maxItems} fotos. Elimina una para continuar.`); return; }
    const eventTitle = `Encuentro Safe Zone · ${GalleryModule.formatDate(date)}`;
    const now = Date.now();
    const uploadedPaths = [];
    try {
      const items = [];
      for (const [index, image] of GalleryModule.pendingImages.entries()) {
        const id = `gallery-${now}-${index}-${Math.random().toString(36).slice(2, 7)}`;
        const imagePath = `encuentros/${date}/${id}.jpg`;
        const publicUrl = await SafeZoneCloud.uploadGalleryImage(image.blob, imagePath, GalleryModule.getAdminToken());
        uploadedPaths.push(imagePath);
        items.push({ id, title: eventTitle, eventDate: date, caption: '', image: publicUrl, imagePath, createdAt: new Date().toISOString() });
      }
      await GalleryModule.persist([...items, ...GalleryModule.items]);
      GalleryModule.pendingImages.forEach(item => URL.revokeObjectURL(item.preview));
      GalleryModule.pendingImages = [];
      InstructorModule.renderInstructorPortal(); GalleryModule.render();
      App.showToast(`✅ ${items.length} foto${items.length === 1 ? '' : 's'} publicada${items.length === 1 ? '' : 's'} en Encuentros Reales.`);
    } catch (error) {
      await Promise.all(uploadedPaths.map(path => SafeZoneCloud.removeGalleryImage(path, GalleryModule.getAdminToken()).catch(() => null)));
      App.showToast(`⚠️ ${error.message || 'No fue posible publicar la foto.'}`);
    }
  },

  async remove(id) {
    if (!InstructorModule.isAuthenticated()) return;
    if (!confirm('¿Eliminar esta foto de la galería pública?')) return;
    const item = GalleryModule.items.find(current => current.id === id);
    try {
      await GalleryModule.persist(GalleryModule.items.filter(current => current.id !== id));
      if (item?.imagePath) await SafeZoneCloud.removeGalleryImage(item.imagePath, GalleryModule.getAdminToken());
      InstructorModule.renderInstructorPortal(); GalleryModule.render(); App.showToast('🗑️ Foto eliminada de la galería.');
    }
    catch (error) { App.showToast(`⚠️ ${error.message || 'No fue posible eliminar la foto.'}`); }
  }
};

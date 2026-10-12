/* Galería pública de encuentros reales. Las fotos se guardan en el contenido Safe Zone. */
const GalleryModule = {
  items: [],
  loadState: 'loading',
  pendingImage: null,
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
          <div><span class="text-xs font-black uppercase tracking-wider text-pink-400">Galería pública</span><h3 class="text-xl font-black text-white font-heading mt-1">Publicar foto de encuentro</h3><p class="text-xs text-slate-400 mt-1">La imagen aparecerá en la pestaña pública “Encuentros Reales”. Máximo ${GalleryModule.maxItems} fotos.</p></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Título *</label><input id="gallery-title" required maxlength="80" placeholder="Ej: Entrenamiento de Hapkido en Bogotá" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Fecha del encuentro</label><input id="gallery-date" type="date" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Descripción breve</label><textarea id="gallery-caption" rows="3" maxlength="220" placeholder="Un momento especial de nuestra comunidad…" class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:border-pink-500 focus:outline-none"></textarea></div>
          <div><label class="block text-xs font-semibold text-slate-300 mb-1.5">Foto *</label><input id="gallery-file" type="file" accept="image/png,image/jpeg,image/webp" required onchange="GalleryModule.preview(event)" class="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-pink-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-pink-500"><img id="gallery-preview" class="hidden mt-3 w-full aspect-[4/3] object-cover rounded-xl border border-slate-700" alt="Vista previa de la foto"></div>
          <button type="submit" class="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2"><i data-lucide="image-plus" class="w-4 h-4"></i>Publicar foto</button>
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
      const scale = Math.min(1, 1280 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.82);
    } finally { URL.revokeObjectURL(source); }
  },

  async preview(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try { GalleryModule.pendingImage = await GalleryModule.compress(file); const preview = document.getElementById('gallery-preview'); preview.src = GalleryModule.pendingImage; preview.classList.remove('hidden'); }
    catch (error) { GalleryModule.pendingImage = null; App.showToast(`⚠️ ${error.message}`); event.target.value = ''; }
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
    if (!GalleryModule.pendingImage) { App.showToast('⚠️ Selecciona una foto antes de publicar.'); return; }
    if (GalleryModule.items.length >= GalleryModule.maxItems) { App.showToast(`⚠️ La galería admite máximo ${GalleryModule.maxItems} fotos. Elimina una para continuar.`); return; }
    const item = { id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: document.getElementById('gallery-title').value.trim(), eventDate: document.getElementById('gallery-date').value, caption: document.getElementById('gallery-caption').value.trim(), image: GalleryModule.pendingImage, createdAt: new Date().toISOString() };
    try { await GalleryModule.persist([item, ...GalleryModule.items]); GalleryModule.pendingImage = null; InstructorModule.renderInstructorPortal(); GalleryModule.render(); App.showToast('✅ Foto publicada en Encuentros Reales.'); }
    catch (error) { App.showToast(`⚠️ ${error.message || 'No fue posible publicar la foto.'}`); }
  },

  async remove(id) {
    if (!InstructorModule.isAuthenticated()) return;
    if (!confirm('¿Eliminar esta foto de la galería pública?')) return;
    try { await GalleryModule.persist(GalleryModule.items.filter(item => item.id !== id)); InstructorModule.renderInstructorPortal(); GalleryModule.render(); App.showToast('🗑️ Foto eliminada de la galería.'); }
    catch (error) { App.showToast(`⚠️ ${error.message || 'No fue posible eliminar la foto.'}`); }
  }
};

/* Real star ratings. Browser identifiers prevent accidental repeat submissions,
 * not multiple-person/device identity verification. No sample votes. */
const Ratings = {
  summary: new Map(),
  selected: null,
  busy: false,
  escape: value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])),
  headers: () => ({ apikey: SafeZoneCloud.key, Authorization: `Bearer ${SafeZoneCloud.key}`, 'Content-Type': 'application/json' }),
  visitor: () => {
    let id = localStorage.getItem('safezone_rating_visitor');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('safezone_rating_visitor', id); }
    return id;
  },
  async refresh() {
    try {
      const response = await fetch(`${SafeZoneCloud.url}/rest/v1/safezone_instructor_rating_summary?select=instructor_id,votes,average`, {headers: Ratings.headers()});
      if (!response.ok) throw new Error('ratings unavailable');
      Ratings.summary = new Map((await response.json()).map(row => [row.instructor_id, row]));
      document.querySelectorAll('[data-professor-rating]').forEach(node => {
        const rating = Ratings.summary.get(node.dataset.professorRating);
        node.textContent = rating && Number(rating.votes) > 0 ? `★ ${Number(rating.average).toFixed(1)} / 5` : 'Sin calificaciones todavía';
      });
    } catch (error) {
      document.querySelectorAll('[data-professor-rating]').forEach(node => { node.textContent = 'Calificaciones no disponibles'; });
    }
  },
  open(id) {
    const professor = Storage.getInstructors().find(item => item.id === id);
    if (!professor) return;
    Ratings.selected = id;
    const modal = document.getElementById('details-modal');
    const content = document.getElementById('details-modal-content');
    content.innerHTML = `<div class="p-6 sm:p-8">
      <div class="flex justify-between items-start gap-3"><div><h2 id="rating-title" class="text-xl font-bold text-white">Calificar al profe</h2><p class="text-pink-300 mt-2">${Ratings.escape(professor.name)}</p></div><button type="button" aria-label="Cerrar calificación" onclick="InstructorModule.closeDetailsModal()" class="p-2 text-slate-300">✕</button></div>
      <form onsubmit="Ratings.submit(event)" class="mt-6 space-y-5" aria-labelledby="rating-title">
        <fieldset><legend class="text-sm text-slate-300 mb-3">¿Cómo fue tu experiencia con este profesor?</legend>
          <div class="flex flex-wrap gap-2">${[1,2,3,4,5].map(n => `<label class="cursor-pointer"><input class="peer sr-only" type="radio" name="professor-score" required value="${n}" onchange="Ratings.preview(${n})"><span class="block px-3 py-3 rounded-xl border border-slate-700 text-slate-300 peer-checked:border-pink-400 peer-checked:bg-pink-950 peer-checked:text-pink-300 peer-focus-visible:ring-2 peer-focus-visible:ring-pink-400">${n} ★</span></label>`).join('')}</div>
          <p id="rating-preview" aria-live="polite" class="text-sm text-pink-300 mt-3">Selecciona de 1 a 5 estrellas.</p>
        </fieldset>
        <p class="text-xs text-slate-400">Envía una calificación basada en tu experiencia. Se admite una por profesor desde este navegador.</p>
        <p id="rating-feedback" role="status" class="text-sm text-pink-200"></p>
        <button type="submit" class="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-bold">Enviar calificación</button>
      </form></div>`;
    modal.classList.remove('hidden'); modal.classList.add('flex');
    content.querySelector('input')?.focus();
  },
  preview(score) {
    document.getElementById('rating-preview').textContent = `${'★'.repeat(score)}${'☆'.repeat(5-score)} · ${score} de 5`;
  },
  async submit(event) {
    event.preventDefault();
    if (Ratings.busy) return;
    const form = event.target;
    const score = Number(new FormData(form).get('professor-score'));
    const feedback = form.querySelector('#rating-feedback');
    if (!Number.isInteger(score) || score < 1 || score > 5) { feedback.textContent = 'Selecciona de 1 a 5 estrellas.'; return; }
    const id = Ratings.selected;
    const button = form.querySelector('button[type="submit"]');
    Ratings.busy = true; button.disabled = true; button.textContent = 'Enviando…';
    try {
      const response = await fetch(`${SafeZoneCloud.url}/rest/v1/safezone_instructor_ratings`, {
        method:'POST', headers:{...Ratings.headers(), Prefer:'return=minimal'},
        body:JSON.stringify({instructor_id:id, voter_id:Ratings.visitor(), score})
      });
      if (response.status === 409) { feedback.textContent = 'Ya enviaste una calificación para este profesor desde este navegador.'; return; }
      if (!response.ok) throw new Error('No fue posible enviar');
      feedback.textContent = '¡Gracias! Tu calificación quedó guardada.';
      form.querySelectorAll('input').forEach(input => { input.disabled = true; });
      button.textContent = 'Calificación enviada';
      await Ratings.refresh();
    } catch (error) {
      feedback.textContent = 'No pudimos guardar tu calificación. Revisa tu conexión e inténtalo de nuevo.';
    } finally {
      Ratings.busy = false;
      if (button.textContent !== 'Calificación enviada') { button.disabled = false; button.textContent = 'Enviar calificación'; }
    }
  }
};
const renderWithoutRatings = InstructorModule.renderInstructors;
InstructorModule.renderInstructors = () => {
  renderWithoutRatings();
  void Ratings.refresh();
};

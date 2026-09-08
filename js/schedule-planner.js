/* Shared monthly planner. Mutations finish in Supabase before updating either portal. */
const SchedulePlanner = {
  state: {
    admin: { year: new Date().getFullYear(), month: new Date().getMonth(), instructor: '' },
    teacher: { year: new Date().getFullYear(), month: new Date().getMonth(), instructor: '' }
  },
  busy: false,
  refreshing: null,
  escape: value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  today: () => new Intl.DateTimeFormat('en-CA', {timeZone:'America/Bogota',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),
  token(scope) {
    let session;
    try { session = JSON.parse(localStorage.getItem(scope === 'admin' ? 'safezone_admin_session' : TeacherPortal.storageKey) || 'null'); } catch (_) {}
    if (!session?.access_token || (session.expires_at && session.expires_at * 1000 <= Date.now())) throw new Error('Tu sesión venció. Vuelve a iniciar sesión para guardar cambios.');
    return session.access_token;
  },
  headers(scope) { return {apikey:SafeZoneCloud.key,Authorization:`Bearer ${SchedulePlanner.token(scope)}`,'Content-Type':'application/json',Prefer:'return=representation'}; },
  async refresh() {
    if (SchedulePlanner.refreshing) return SchedulePlanner.refreshing;
    SchedulePlanner.refreshing = (async () => {
      const rows = await SafeZoneCloud.fetchTeacherSchedules();
      Storage.saveTeacherSchedules(rows);
      SchedulePlanner.redraw();
    })();
    try { await SchedulePlanner.refreshing; } finally { SchedulePlanner.refreshing = null; }
  },
  redraw() {
    SessionsModule.renderSessions();
    if (InstructorModule.isAuthenticated() && InstructorModule.activeSubTab === 'calendar') InstructorModule.renderInstructorPortal();
    if (TeacherPortal.isAuthenticated()) TeacherPortal.render();
  },
  async reload() {
    try { await SchedulePlanner.refresh(); App.showToast('Calendario actualizado.'); }
    catch (_) { App.showToast('No se pudo actualizar el calendario. Revisa tu conexión.'); }
  },
  select(scope, id) { SchedulePlanner.state[scope].instructor=id; SchedulePlanner.redraw(); },
  month(scope, delta) {
    const state=SchedulePlanner.state[scope];
    const date=delta===null ? new Date() : new Date(state.year,state.month+delta,1);
    state.year=date.getFullYear(); state.month=date.getMonth(); SchedulePlanner.redraw();
  },
  calendar(scope) {
    const E=SchedulePlanner.escape, state=SchedulePlanner.state[scope];
    const instructors=Storage.getInstructors();
    const instructor=instructors.find(i=>i.id===state.instructor)||instructors[0];
    if (!instructor) return '<p class="glass-card p-6 rounded-2xl text-slate-300">Añade un profesor desde el portal administrativo para empezar.</p>';
    state.instructor=instructor.id;
    const prefix=`${state.year}-${String(state.month+1).padStart(2,'0')}`;
    const rows=Storage.getTeacherSchedules().filter(r=>r.instructor_id===instructor.id && r.class_date.startsWith(prefix)).sort((a,b)=>a.start_time.localeCompare(b.start_time));
    const title=new Date(state.year,state.month,1).toLocaleDateString('es-CO',{month:'long',year:'numeric'});
    const offset=(new Date(state.year,state.month,1).getDay()+6)%7;
    const days=new Date(state.year,state.month+1,0).getDate();
    return `<div class="glass-card rounded-2xl p-5 sm:p-7 mb-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div><span class="text-xs font-black uppercase text-pink-400">Planificador de disponibilidad</span><h2 class="text-2xl font-black text-white">Horarios de Entrenadores</h2><p class="text-xs text-slate-400 mt-1">Selecciona un profesor y un día para programar o eliminar sus clases.</p></div>
      <label class="text-xs text-slate-400">Profesor<select aria-label="Profesor del calendario" onchange="SchedulePlanner.select('${scope}',this.value)" class="block mt-1 w-full sm:w-72 bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 text-white">${instructors.map(i=>`<option value="${E(i.id)}" ${i.id===instructor.id?'selected':''}>${E(i.name)} (${E(i.discipline)})</option>`).join('')}</select></label></div>
      <div class="glass-card rounded-2xl p-4 sm:p-7 border border-slate-800">
      <div class="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-800"><div><h3 class="text-xl font-black text-white capitalize">${E(title)}</h3><p class="text-xs text-slate-400">${rows.length} clases programadas este mes</p></div>
      <div class="flex flex-wrap gap-2"><button aria-label="Mes anterior" onclick="SchedulePlanner.month('${scope}',-1)" class="p-3 rounded-xl bg-slate-900 text-white">‹</button><button onclick="SchedulePlanner.month('${scope}',null)" class="p-3 rounded-xl bg-slate-900 text-slate-300 text-xs">Hoy / Mes Actual</button><button aria-label="Mes siguiente" onclick="SchedulePlanner.month('${scope}',1)" class="p-3 rounded-xl bg-slate-900 text-white">›</button><button onclick="SchedulePlanner.reload()" class="p-3 rounded-xl bg-slate-900 text-pink-300 text-xs">Actualizar</button></div></div>
      <div class="overflow-x-auto"><div style="min-width:700px"><div class="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-slate-400">${['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map(d=>`<div>${d}</div>`).join('')}</div>
      <div class="grid grid-cols-7 gap-2">${'<div aria-hidden="true"></div>'.repeat(offset)}${Array.from({length:days},(_,index)=>{
        const day=index+1, date=`${prefix}-${String(day).padStart(2,'0')}`, items=rows.filter(r=>r.class_date===date);
        return `<div class="rounded-xl border ${date===SchedulePlanner.today()?'border-pink-400':'border-slate-800'} bg-slate-950/70 p-2 flex flex-col gap-2" style="min-height:125px"><span class="text-sm font-bold ${date===SchedulePlanner.today()?'text-pink-400':'text-slate-300'}">${day}${date===SchedulePlanner.today()?' · HOY':''}</span>
        ${items.map(r=>`<div class="p-2 rounded-lg bg-pink-500/10 border border-pink-500/30"><p class="text-xs font-bold text-pink-300">${E(r.start_time.slice(0,5))}–${E(r.end_time.slice(0,5))}</p><p class="text-[10px] text-slate-300 break-words">${E(r.location)}</p><button type="button" data-schedule-id="${E(r.id)}" onclick="SchedulePlanner.confirmDelete('${scope}',this.dataset.scheduleId)" aria-label="Eliminar clase del ${date} a las ${E(r.start_time.slice(0,5))}" class="mt-2 w-full py-1.5 rounded-md border border-red-500/40 text-red-300 text-[10px] hover:bg-red-950">Eliminar clase</button></div>`).join('') || '<span class="text-[10px] text-slate-500 italic">Libre</span>'}
        <button type="button" ${date<SchedulePlanner.today()?'disabled':''} onclick="SchedulePlanner.open('${scope}','${date}')" aria-label="Programar clase el ${date}" class="mt-auto py-2 rounded-md bg-slate-900 hover:bg-pink-600 disabled:opacity-30 text-slate-300 hover:text-white text-[10px] font-bold">+ Dictar</button></div>`;
      }).join('')}</div></div></div><p class="text-xs text-slate-500 mt-4">En celular puedes deslizar el calendario hacia los lados. Cada clase tiene su propio botón para eliminar.</p></div>`;
  },
  open(scope,date) {
    try { SchedulePlanner.token(scope); } catch(error) { App.showToast(error.message); return; }
    const E=SchedulePlanner.escape, instructors=Storage.getInstructors();
    const instructor=instructors.find(i=>i.id===SchedulePlanner.state[scope].instructor)||instructors[0];
    if(!instructor) return;
    const input='w-full mt-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm';
    const label='text-xs text-slate-300 block';
    document.getElementById('details-modal-content').innerHTML=`<div class="p-6 sm:p-8 max-h-[85vh] overflow-y-auto"><div class="flex items-center justify-between mb-5"><h2 class="text-xl font-bold text-white">Programar clase</h2><button type="button" aria-label="Cerrar programación" onclick="SchedulePlanner.close()" class="p-2 text-slate-300">✕</button></div>
      <form onsubmit="SchedulePlanner.submit(event,'${scope}')" class="space-y-4"><label class="${label}">Día<input name="date" type="date" required min="${SchedulePlanner.today()}" value="${E(date)}" class="${input}"></label>
      <label class="${label}">Profesor<select name="instructor" required class="${input}">${instructors.map(i=>`<option value="${E(i.id)}" ${i.id===instructor.id?'selected':''}>${E(i.name)}</option>`).join('')}</select></label>
      <label class="${label}">Lugar / sede<input name="location" required minlength="3" maxlength="160" placeholder="Escribe la sede o dirección" list="safezone-venues" class="${input}"><datalist id="safezone-venues"><option value="Parque Simón Bolívar - Sector Templete"><option value="Parque El Virrey - Costado Oriental"><option value="Coliseo El Salitre - Canchas Exteriores"><option value="Sede Safe Zone"></datalist></label>
      <div class="grid grid-cols-2 gap-3"><label class="${label}">Hora de inicio<input name="start" type="time" required value="08:00" class="${input}"></label><label class="${label}">Hora de fin<input name="end" type="time" required value="09:30" class="${input}"></label></div>
      <label class="${label}">Disciplina<select name="discipline" class="${input}">${[['defensa-personal','Defensa Personal'],['boxeo','Boxeo'],['taekwondo','Taekwondo']].map(([value,text])=>`<option value="${value}" ${value===instructor.discipline?'selected':''}>${text}</option>`).join('')}</select></label>
      <label class="${label}">Cupos<input name="capacity" type="number" min="5" max="50" required value="18" class="${input}"></label><p role="status" id="schedule-feedback" class="text-sm text-pink-200"></p>
      <button type="submit" class="w-full py-3 rounded-xl bg-pink-600 text-white font-bold disabled:opacity-50">Confirmar y publicar clase</button></form></div>`;
    const modal=document.getElementById('details-modal'); modal.classList.remove('hidden');modal.classList.add('flex');
  },
  close() { if(!SchedulePlanner.busy) InstructorModule.closeDetailsModal(); },
  validate(data) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(data.class_date)||data.class_date<SchedulePlanner.today()) throw new Error('Selecciona una fecha de hoy en adelante.');
    if(!/^\d{2}:\d{2}$/.test(data.start_time)||!/^\d{2}:\d{2}$/.test(data.end_time)||data.end_time<=data.start_time) throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
    if(data.location.length<3||data.location.length>160) throw new Error('Escribe un lugar de 3 a 160 caracteres.');
    if(!Number.isInteger(data.capacity)||data.capacity<5||data.capacity>50) throw new Error('Los cupos deben estar entre 5 y 50.');
  },
  overlaps(data,rows) { return rows.some(r=>r.instructor_id===data.instructor_id && r.class_date===data.class_date && data.start_time<r.end_time.slice(0,5) && data.end_time>r.start_time.slice(0,5)); },
  async submit(event,scope) {
    event.preventDefault(); if(SchedulePlanner.busy)return;
    const form=event.target, fields=new FormData(form), feedback=form.querySelector('#schedule-feedback'), button=form.querySelector('button[type="submit"]');
    SchedulePlanner.busy=true;button.disabled=true;button.textContent='Guardando…';
    let saved=false;
    try {
      const token=SchedulePlanner.token(scope);
      const instructor=Storage.getInstructors().find(i=>i.id===fields.get('instructor'));
      if(!instructor)throw new Error('Selecciona un profesor válido.');
      const data={class_date:fields.get('date'),start_time:fields.get('start'),end_time:fields.get('end'),location:fields.get('location').trim(),instructor_id:instructor.id,instructor_name:instructor.name,instructor_avatar:instructor.avatar,discipline:fields.get('discipline'),title:`Entrenamiento de ${fields.get('discipline')}`,capacity:Number(fields.get('capacity'))};
      SchedulePlanner.validate(data);
      const latest=await SafeZoneCloud.fetchTeacherSchedules();
      if(SchedulePlanner.overlaps(data,latest))throw new Error('Este profesor ya tiene una clase que coincide con ese horario. Selecciona otra hora.');
      const created=await SafeZoneCloud.createTeacherSchedule(data,token);
      if(!created?.id)throw new Error('No se confirmó el guardado. Actualiza el calendario antes de reintentar.');
      saved=true;Storage.saveTeacherSchedules([...latest,created]);SchedulePlanner.state[scope].instructor=instructor.id;
      const [year,month]=data.class_date.split('-').map(Number);Object.assign(SchedulePlanner.state[scope],{year,month:month-1});
      InstructorModule.closeDetailsModal();SchedulePlanner.redraw();App.showToast('Clase guardada en Supabase y publicada.');
    } catch(error) { feedback.textContent=saved?'La clase se guardó. Actualiza el calendario para verla.':(error.message||'No fue posible guardar. Revisa tu conexión.'); }
    finally {SchedulePlanner.busy=false;if(!saved){button.disabled=false;button.textContent='Confirmar y publicar clase';}}
  },
  confirmDelete(scope,id) {
    const row=Storage.getTeacherSchedules().find(r=>r.id===id);if(!row)return;
    const E=SchedulePlanner.escape;
    document.getElementById('details-modal-content').innerHTML=`<div class="p-6 sm:p-8"><h2 class="text-xl font-bold text-white">¿Eliminar esta clase programada?</h2><p class="mt-4 text-pink-300">${E(row.instructor_name)}</p><p class="text-slate-300 text-sm mt-2">${E(row.class_date)} · ${E(row.start_time.slice(0,5))}–${E(row.end_time.slice(0,5))}<br>${E(row.location)}</p><p class="text-xs text-slate-400 mt-4">Se quitará del calendario de ambos portales y de los encuentros públicos. No se borrará el perfil del profesor. Esta acción no modifica pagos ni devuelve tickets; si hay alumnos inscritos, revisa sus reservas antes de continuar.</p><p id="delete-feedback" role="status" class="text-sm text-red-300 mt-3"></p><div class="flex gap-3 mt-5"><button onclick="SchedulePlanner.close()" class="flex-1 py-3 rounded-xl bg-slate-900 text-slate-300">Volver</button><button data-schedule-id="${E(id)}" onclick="SchedulePlanner.remove('${scope}',this.dataset.scheduleId,this)" class="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold disabled:opacity-50">Eliminar clase</button></div></div>`;
    const modal=document.getElementById('details-modal');modal.classList.remove('hidden');modal.classList.add('flex');
  },
  async remove(scope,id,button) {
    if(SchedulePlanner.busy)return;SchedulePlanner.busy=true;button.disabled=true;
    try {
      if(!Storage.getTeacherSchedules().some(r=>r.id===id))throw new Error('La clase ya no está en este calendario. Actualiza la página.');
      const response=await fetch(`${SafeZoneCloud.url}/rest/v1/safezone_teacher_schedules?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:SchedulePlanner.headers(scope)});
      if(!response.ok)throw new Error('No se pudo eliminar. Revisa tu sesión y los permisos del calendario.');
      const removed=await response.json();
      if(!removed.some(r=>r.id===id))throw new Error('Supabase no confirmó la eliminación. Actualiza el calendario y verifica tus permisos.');
      Storage.saveTeacherSchedules(Storage.getTeacherSchedules().filter(r=>r.id!==id));
      InstructorModule.closeDetailsModal();SchedulePlanner.redraw();App.showToast('Clase eliminada del calendario compartido.');
    } catch(error) {document.getElementById('delete-feedback').textContent=error.message;}
    finally {SchedulePlanner.busy=false;button.disabled=false;}
  }
};

/* Keep large instructor photos out of the schedule cache; profiles remain untouched. */
(() => {
  let scheduleMemory=null;
  const read=Storage.getTeacherSchedules.bind(Storage);
  Storage.getTeacherSchedules=()=>scheduleMemory || read();
  Storage.saveTeacherSchedules=rows=>{
    scheduleMemory=rows;
    try {localStorage.setItem('safezone_teacher_schedules',JSON.stringify(rows.map(r=>({...r,instructor_avatar:''}))));}
    catch (_) { /* The canonical rows are still in Supabase and memory. */ }
  };
  const renderLogin=TeacherPortal.render.bind(TeacherPortal);
  TeacherPortal.render=()=>{
    if(!TeacherPortal.isAuthenticated())return renderLogin();
    const container=document.getElementById('teacher-portal-container');if(!container)return;
    container.innerHTML=`<div class="flex items-center justify-between mb-5"><h2 class="text-xl font-bold text-white">Portal de Profesores</h2><button onclick="TeacherPortal.logout()" class="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs">Cerrar sesión</button></div>${SchedulePlanner.calendar('teacher')}`;
  };
  InstructorModule.renderCalendarSection=()=>SchedulePlanner.calendar('admin');
  const switchTab=App.switchTab.bind(App);
  App.switchTab=tab=>{switchTab(tab);if(['teacher-portal','instructor-portal','sessions'].includes(tab))void SchedulePlanner.refresh().catch(()=>{});};
  window.addEventListener('focus',()=>{if(['teacher-portal','instructor-portal','sessions'].includes(App.currentTab)&&!SchedulePlanner.busy)void SchedulePlanner.refresh().catch(()=>{});});
})();

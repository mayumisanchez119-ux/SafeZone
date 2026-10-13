/**
 * Data inicial y persistencia centralizada - SAFE ZONE CLUB
 */

const DEFAULT_INSTRUCTORS = [
  {
    id: "inst-1",
    name: "Carlos 'El Toro' Mendoza",
    discipline: "boxeo",
    disciplines: ["boxeo"],
    disciplineName: "Boxeo Olímpico & Profesional",
    title: "Entrenador Certificado de Boxeo Safe Zone",
    experience: "12 años de experiencia | Ex-campeón nacional",
    avatar: "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&q=80&w=300",


    bio: "Especialista en guardia sólida, combinaciones de impacto, esquiva de golpes y acondicionamiento cardiovascular de alta intensidad en Safe Zone Club."
  },
  {
    id: "inst-2",
    name: "Mtra. Jin-Woo & Andrea Park",
    discipline: "taekwondo",
    disciplines: ["taekwondo"],
    disciplineName: "Taekwondo WT",
    title: "Cinturón Negro 4to Dan Taekwondo WT",
    experience: "15 años formando atletas y practicantes",
    avatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=300",


    bio: "Enfocada en flexibilidad dinámica, patadas de contraataque veloz, balance postural y disciplina marcial tradicional."
  },
  {
    id: "inst-3",
    name: "Andrea 'Valkiria' Silva",
    discipline: "hapkido",
    disciplines: ["hapkido", "boxeo"],
    disciplineName: "Hapkido & Boxeo",
    title: "Instructora Senior de Hapkido & Boxeo",
    experience: "9 años de experiencia en artes marciales",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",


    bio: "Técnicas de Hapkido, control corporal y combinaciones de Boxeo para entrenar con confianza y disciplina."
  },
  {
    id: "inst-4",
    name: "Mateo 'Grappler' Rendón",
    discipline: "hapkido",
    disciplines: ["hapkido"],
    disciplineName: "Hapkido",
    title: "Instructor de Hapkido",
    experience: "8 años de experiencia marcial",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",


    bio: "Aprende técnicas de Hapkido, coordinación, movilidad y control corporal en un entorno seguro."
  }
];

// ÚNICAMENTE COMBOS 3 + 1 (PAGAS 3 Y RECIBES 4)
const DEFAULT_COMBOS = [
  {
    id: "combo-universal-31",
    title: "Combo Universal 3 + 1 Safe Zone",
    discipline: "all",
    disciplineLabel: "Todas las Disciplinas (Multidisciplinario)",
    badge: "🔥 ALL-ACCESS",
    badgeColor: "bg-pink-600",
    paidSessions: 3,
    totalTickets: 4,
    freeTickets: 1,
    price: 30000,
    regularPrice: 40000,
    savings: 10000,
    validityDays: 60,
    description: "¡Pagas 3 y recibes 4! Válido indistintamente para Boxeo, Taekwondo o Hapkido en cualquier sede.",
    features: [
      "4 Tickets válidos para CUALQUIER disciplina",
      "Vigencia extendida de 60 días tras aprobación",
      "Flexibilidad total para alternar clases",
      "Ahorro de $10.000 COP (1 clase gratis)"
    ]
  },
  {
    id: "combo-boxeo-31",
    title: "Combo Especialista Boxeo (3 + 1)",
    discipline: "boxeo",
    disciplineLabel: "Solo Boxeo Olímpico",
    badge: "🥊 SOLO BOXEO",
    badgeColor: "bg-rose-600",
    paidSessions: 3,
    totalTickets: 4,
    freeTickets: 1,
    price: 30000,
    regularPrice: 40000,
    savings: 10000,
    validityDays: 60,
    description: "Exclusivo para entrenamientos de Boxeo. Técnica de guardia, desplazamientos, combinaciones y manoplas.",
    features: [
      "4 Tickets exclusivos para sesiones de BOXEO",
      "Vigencia de 60 días para redimir",
      "Enfoque puro en golpeo y cardio",
      "Ahorro de $10.000 COP (1 sesión gratis)"
    ]
  },
  {
    id: "combo-taekwondo-31",
    title: "Combo Especialista Taekwondo (3 + 1)",
    discipline: "taekwondo",
    disciplineLabel: "Solo Taekwondo WT",
    badge: "🥋 SOLO TAEKWONDO",
    badgeColor: "bg-purple-600",
    paidSessions: 3,
    totalTickets: 4,
    freeTickets: 1,
    price: 30000,
    regularPrice: 40000,
    savings: 10000,
    validityDays: 60,
    description: "Exclusivo para sesiones de Taekwondo. Patadas dinámicas, flexibilidad y distancia de combate.",
    features: [
      "4 Tickets exclusivos para sesiones de TAEKWONDO",
      "Vigencia de 60 días para redimir",
      "Perfeccionamiento técnico y agilidad",
      "Ahorro de $10.000 COP (1 sesión gratis)"
    ]
  },
  {
    id: "combo-hapkido-31",
    title: "Combo Especialista Hapkido (3 + 1)",
    discipline: "hapkido",
    disciplineLabel: "Solo Hapkido",
    badge: "🥋 SOLO HAPKIDO",
    badgeColor: "bg-fuchsia-600",
    paidSessions: 3,
    totalTickets: 4,
    freeTickets: 1,
    price: 30000,
    regularPrice: 40000,
    savings: 10000,
    validityDays: 60,
    description: "Exclusivo para entrenamientos de Hapkido. Técnica, movilidad, control corporal y disciplina marcial.",
    features: [
      "4 Tickets exclusivos para HAPKIDO",
      "Vigencia de 60 días para redimir",
      "Técnica, movilidad y control corporal",
      "Ahorro de $10.000 COP (1 sesión gratis)"
    ]
  }
];

function getFutureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const DEFAULT_SESSIONS = [];

const DEFAULT_TRANSACTIONS = [
  {
    id: "tx-1",
    uniqueCode: "SZ-88210",
    type: "combo",
    comboId: "combo-universal-31",
    title: "Combo Universal 3 + 1 Safe Zone",
    discipline: "all",
    disciplineLabel: "Todas las Disciplinas (Multidisciplinario)",
    studentName: "Valentina Gómez",
    studentPhone: "3124567890",
    studentEmail: "valentina.gomez@gmail.com",
    amount: 30000,
    paymentMethod: "Nequi (312 345 6789)",
    receiptUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600",
    status: "approved",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000).toISOString(),
    totalTickets: 4,
    remainingTickets: 2,
    history: [
      { action: "Compra y Aprobación", detail: "Activación de 4 tickets (+4)", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { action: "Redención", detail: "Clase de Boxeo (-1 ticket)", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    id: "tx-2",
    uniqueCode: "SZ-41902",
    type: "combo",
    comboId: "combo-taekwondo-31",
    title: "Combo Especialista Taekwondo (3 + 1)",
    discipline: "taekwondo",
    disciplineLabel: "Solo Taekwondo WT",
    studentName: "Laura Sofia Restrepo",
    studentPhone: "3187654321",
    studentEmail: "laura.restrepo@outlook.com",
    amount: 30000,
    paymentMethod: "Daviplata (312 345 6789)",
    receiptUrl: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=600",
    status: "pending",
    createdAt: new Date().toISOString(),
    approvedAt: null,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    totalTickets: 4,
    remainingTickets: 4,
    history: [
      { action: "Registro de Compra", detail: "Comprobante recibido. Esperando validación de staff.", date: new Date().toISOString() }
    ]
  }
];

const Storage = {
  receiptRetentionDays: 30,
  receiptExpiry: (transaction) => {
    if (transaction.receiptExpiresAt) return new Date(transaction.receiptExpiresAt).getTime();
    const createdAt = new Date(transaction.createdAt || 0).getTime();
    return Number.isFinite(createdAt) ? createdAt + Storage.receiptRetentionDays * 24 * 60 * 60 * 1000 : 0;
  },
  cleanupExpiredReceipts: (transactions) => {
    const now = Date.now(); let changed = false;
    const cleaned = transactions.map(transaction => {
      const expiresAt = Storage.receiptExpiry(transaction);
      if (!transaction.receiptUrl || !expiresAt || expiresAt > now) return transaction;
      changed = true;
      const history = Array.isArray(transaction.history) ? [...transaction.history] : [];
      if (!history.some(item => item.action === 'Comprobante eliminado automáticamente')) {
        history.push({ action: 'Comprobante eliminado automáticamente', detail: 'La imagen del comprobante se eliminó tras 30 días de conservación.', date: new Date().toISOString() });
      }
      return { ...transaction, receiptUrl: null, receiptRemovedAt: new Date().toISOString(), receiptExpiresAt: new Date(expiresAt).toISOString(), history };
    });
    if (changed) localStorage.setItem('safezone_transactions', JSON.stringify(cleaned));
    return cleaned;
  },
  initialize: async () => {
    try {
      const content = await SafeZoneCloud.fetchContent();
      const sources = {
        sessions: 'safezone_sessions',
        combos: 'safezone_combos'
      };

      Object.entries(sources).forEach(([key, storageKey]) => {
        if (Array.isArray(content[key])) {
          localStorage.setItem(storageKey, JSON.stringify(content[key]));
        }
      });
      return true;
    } catch (error) {
      console.warn('Safe Zone no pudo cargar el contenido remoto; se usarán los datos locales.', error);
      return false;
    }
  },

  getTeacherSchedules: () => {
    try { return JSON.parse(localStorage.getItem('safezone_teacher_schedules') || '[]'); }
    catch (error) { return []; }
  },
  saveTeacherSchedules: (schedules) => {
    localStorage.setItem('safezone_teacher_schedules', JSON.stringify(schedules));
  },

  // Las inscripciones se guardan aparte del catálogo de clases. De ese modo no
  // se vuelve a duplicar todo el calendario (ni se agota el almacenamiento)
  // cada vez que una alumna adjunta un comprobante.
  getSessionAttendees: () => {
    try { return JSON.parse(localStorage.getItem('safezone_session_attendees') || '{}'); }
    catch (error) { return {}; }
  },
  addSessionAttendee: (sessionId, attendee) => {
    const attendees = Storage.getSessionAttendees();
    const current = Array.isArray(attendees[sessionId]) ? attendees[sessionId] : [];
    attendees[sessionId] = [...current, attendee];
    localStorage.setItem('safezone_session_attendees', JSON.stringify(attendees));
  },

  getSessions: () => {
    const data = localStorage.getItem('safezone_sessions');
    const sessions = (data ? JSON.parse(data) : DEFAULT_SESSIONS).filter(session => !['ses-1', 'ses-2', 'ses-3'].includes(session.id));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const teacherSessions = Storage.getTeacherSchedules().map(schedule => {
      const special = schedule.class_kind === 'special';
      const specialData = typeof schedule.special_data === 'string'
        ? (() => { try { return JSON.parse(schedule.special_data); } catch (_) { return {}; } })()
        : (schedule.special_data || {});
      const instructors = Array.isArray(specialData.instructors) ? specialData.instructors : [];
      const presaleActive = special && specialData.presale_ends_on >= today;
      const price = special
        ? Number(presaleActive ? specialData.presale_price : specialData.regular_price)
        : 10000;
      const instructorNames = instructors.map(item => item.name).filter(Boolean);
      return {
        id: `teacher-${schedule.id}`,
        discipline: special ? 'especial' : schedule.discipline,
        title: schedule.title,
        instructorId: schedule.instructor_id,
        instructorName: special ? (instructorNames.join(' · ') || 'Equipo Safe Zone') : schedule.instructor_name,
        instructorAvatar: schedule.instructor_avatar,
        instructors,
        date: schedule.class_date,
        time: `${String(schedule.start_time || '').slice(0, 5)} - ${String(schedule.end_time || '').slice(0, 5)}`,
        recurrence: 'once', recurrenceLabel: special ? 'Masterclass especial' : 'Programada por Profesores',
        location: { name: schedule.location, address: schedule.location, zone: 'Bogotá D.C.' },
        price: Number.isFinite(price) && price >= 0 ? price : 0,
        regularPrice: special ? Number(specialData.regular_price) : null,
        presaleEndsOn: special ? specialData.presale_ends_on : null,
        presaleActive,
        isSpecial: special,
        capacity: schedule.capacity, attendees: [], level: 'Todos los niveles',
        requirements: ['Ropa deportiva', 'Hidratación'],
        description: special
          ? (specialData.description || `Masterclass especial con ${instructorNames.join(', ') || 'el equipo Safe Zone'}.`)
          : `Sesión programada por ${schedule.instructor_name}.`
      };
    });
    const ids = new Set(teacherSessions.map(session => session.id));
    const attendeeMap = Storage.getSessionAttendees();
    return [...teacherSessions, ...sessions.filter(session => !ids.has(session.id))].map(session => ({
      ...session,
      attendees: Array.isArray(attendeeMap[session.id]) ? attendeeMap[session.id] : (session.attendees || [])
    }));
  },
  saveSessions: (sessions) => {
    localStorage.setItem('safezone_sessions', JSON.stringify(sessions));
  },

  getInstructors: () => {
    const data = localStorage.getItem('safezone_instructors');
    return data ? JSON.parse(data) : DEFAULT_INSTRUCTORS;
  },
  saveInstructors: (instructors) => {
    localStorage.setItem('safezone_instructors', JSON.stringify(instructors));
  },
  addInstructor: (instructorData) => {
    const instructors = Storage.getInstructors();
    const newInst = {
      id: "inst-" + Math.random().toString(36).substring(2, 9),


      ...instructorData
    };
    instructors.push(newInst);
    Storage.saveInstructors(instructors);
    return newInst;
  },
  updateInstructor: (instructorId, updatedFields) => {
    const instructors = Storage.getInstructors();
    const idx = instructors.findIndex(i => i.id === instructorId);
    if (idx > -1) {
      instructors[idx] = { ...instructors[idx], ...updatedFields };
      Storage.saveInstructors(instructors);
      return true;
    }
    return false;
  },
  deleteInstructor: (instructorId) => {
    let instructors = Storage.getInstructors();
    instructors = instructors.filter(i => i.id !== instructorId);
    Storage.saveInstructors(instructors);
    return true;
  },

  getCombos: () => {
    const data = localStorage.getItem('safezone_combos');
    if (!data) return DEFAULT_COMBOS;
    try {
      const parsed = JSON.parse(data);
      // Solo combos 3+1 (<= 4 tickets)
      const filtered = parsed.filter(c => c.totalTickets <= 4 && ['all', 'boxeo', 'taekwondo', 'hapkido'].includes(c.discipline));
      // Una lista vacía puede ser una decisión válida de la administradora.
      // No se deben restaurar combos eliminados automáticamente.
      return filtered;
    } catch (e) {
      return DEFAULT_COMBOS;
    }
  },
  saveCombos: (combos) => {
    localStorage.setItem('safezone_combos', JSON.stringify(combos));
  },
  updateCombo: (comboId, updatedFields) => {
    const combos = Storage.getCombos();
    const idx = combos.findIndex(c => c.id === comboId);
    if (idx > -1) {
      combos[idx] = { ...combos[idx], ...updatedFields };
      Storage.saveCombos(combos);
      return true;
    }
    return false;
  },

  getTransactions: () => {
    const data = localStorage.getItem('safezone_transactions');
    const transactions = data ? JSON.parse(data) : DEFAULT_TRANSACTIONS;
    return Storage.cleanupExpiredReceipts(transactions);
  },
  saveTransactions: (transactions) => {
    localStorage.setItem('safezone_transactions', JSON.stringify(Storage.cleanupExpiredReceipts(transactions)));
  },
  deleteTransaction: (txId) => {
    const transactions = Storage.getTransactions();
    const index = transactions.findIndex(tx => tx.id === txId);
    if (index < 0) return false;
    transactions.splice(index, 1);
    Storage.saveTransactions(transactions);
    return true;
  },
  findTransactionByCode: (code) => {
    if (!code) return null;
    const cleanCode = code.trim().toUpperCase();
    const txs = Storage.getTransactions();
    return txs.find(t => t.uniqueCode.toUpperCase() === cleanCode || (t.studentPhone && t.studentPhone.includes(cleanCode)));
  },
  updateTransactionStatus: (txId, newStatus, note = '') => {
    const txs = Storage.getTransactions();
    const tx = txs.find(t => t.id === txId);
    if (!tx) return false;

    tx.status = newStatus;
    const now = new Date();
    if (newStatus === 'approved') {
      tx.approvedAt = now.toISOString();
      const exp = new Date();
      exp.setDate(exp.getDate() + 60);
      tx.expiryDate = exp.toISOString();
      tx.history.push({
        action: "Pago Aprobado",
        detail: `Validado por Administradora Safe Zone. Código activo con ${tx.remainingTickets} tickets.`,
        date: now.toISOString()
      });
    } else if (newStatus === 'rejected') {
      tx.history.push({
        action: "Pago Rechazado",
        detail: note || "Comprobante no válido.",
        date: now.toISOString()
      });
    }
    Storage.saveTransactions(txs);
    return true;
  },

  // Compatibilidad defensiva
  getUserWallet: () => {
    return { passes: [], registeredSessions: [] };
  },
  saveUserWallet: () => {}
};

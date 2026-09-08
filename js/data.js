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
    rating: 4.9,
    reviewsCount: 48,
    bio: "Especialista en guardia sólida, combinaciones de impacto, esquiva de golpes y acondicionamiento cardiovascular de alta intensidad en Safe Zone Club."
  },
  {
    id: "inst-2",
    name: "Mtra. Jin-Woo & Andrea Park",
    discipline: "taekwondo",
    disciplines: ["taekwondo", "defensa-personal"],
    disciplineName: "Taekwondo WT & Defensa Personal",
    title: "Cinturón Negro 4to Dan Taekwondo WT",
    experience: "15 años formando atletas y practicantes",
    avatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=300",
    rating: 5.0,
    reviewsCount: 62,
    bio: "Enfocada en flexibilidad dinámica, patadas de contraataque veloz, balance postural y disciplina marcial tradicional."
  },
  {
    id: "inst-3",
    name: "Andrea 'Valkiria' Silva",
    discipline: "defensa-personal",
    disciplines: ["defensa-personal", "boxeo"],
    disciplineName: "Defensa Personal Urbana & Boxeo",
    title: "Instructora Senior Safe Zone & Combate Urbano",
    experience: "9 años capacitando en seguridad personal y prevención",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    rating: 4.95,
    reviewsCount: 74,
    bio: "Técnicas 100% realistas para neutralizar agresiones callejeras, escapes de agarres, control de distancia y manejo del estrés bajo el método Safe Zone."
  },
  {
    id: "inst-4",
    name: "Mateo 'Grappler' Rendón",
    discipline: "defensa-personal",
    disciplines: ["defensa-personal"],
    disciplineName: "Defensa Personal & Grappling",
    title: "Especialista en Grappling & Control en el Suelo",
    experience: "8 años en BJJ y Defensa Policial",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300",
    rating: 4.85,
    reviewsCount: 36,
    bio: "Aprende a neutralizar atacantes de mayor peso mediante palancas, derribos seguros y escapes efectivos desde el piso."
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
    description: "¡Pagas 3 y recibes 4! Válido indistintamente para Boxeo, Taekwondo o Defensa Personal en cualquier sede.",
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
    id: "combo-defensa-31",
    title: "Combo Especialista Defensa Personal (3 + 1)",
    discipline: "defensa-personal",
    disciplineLabel: "Solo Defensa Personal Urbana",
    badge: "🛡️ SOLO DEFENSA",
    badgeColor: "bg-pink-600",
    paidSessions: 3,
    totalTickets: 4,
    freeTickets: 1,
    price: 30000,
    regularPrice: 40000,
    savings: 10000,
    validityDays: 60,
    description: "Exclusivo para Defensa Personal Urbana y Krav Maga. Desarmes, agarres y escapes reales en la calle.",
    features: [
      "4 Tickets exclusivos para DEFENSA PERSONAL",
      "Vigencia de 60 días para redimir",
      "Tácticas urbanas y control situacional",
      "Ahorro de $10.000 COP (1 sesión gratis)"
    ]
  }
];

function getFutureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}

const DEFAULT_SESSIONS = [
  {
    id: "ses-1",
    discipline: "defensa-personal",
    title: "Defensa Personal Urbana: Desarmes y Escapes de Agarre",
    instructorId: "inst-3",
    instructorName: "Andrea 'Valkiria' Silva",
    instructorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300",
    date: getFutureDate(1),
    time: "07:30 AM - 09:00 AM",
    recurrence: "every_saturday",
    recurrenceLabel: "Todos los Sábados",
    location: {
      name: "Parque Simón Bolívar - Sector Templete",
      address: "Av. Calle 63 y Av. 68, Bogotá",
      zone: "Zona Salitre"
    },
    price: 10000,
    capacity: 18,
    attendees: [
      { id: "att-1", name: "Valentina Gómez", phone: "3124567890", paymentMethod: "ticket", uniqueCode: "SZ-88210", registeredAt: "2026-08-29" },
      { id: "att-2", name: "Felipe Morales", phone: "3001234567", paymentMethod: "single_payment", uniqueCode: "SZ-CL-10492", registeredAt: "2026-08-29" }
    ],
    level: "Todos los niveles",
    requirements: ["Ropa deportiva cómoda", "Hidratación", "Toalla de mano"],
    description: "Aprende a reaccionar ante intentos de agarre de muñecas, ropa o estrangulamiento. Técnicas basadas en biomecánica donde la fuerza del atacante se vuelve en su contra."
  },
  {
    id: "ses-2",
    discipline: "boxeo",
    title: "Técnica de Boxeo: Guardia, Jab-Cross y Desplazamiento",
    instructorId: "inst-1",
    instructorName: "Carlos 'El Toro' Mendoza",
    instructorAvatar: "https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&q=80&w=300",
    date: getFutureDate(2),
    time: "08:00 AM - 09:30 AM",
    recurrence: "every_sunday",
    recurrenceLabel: "Todos los Domingos",
    location: {
      name: "Parque El Virrey - Costado Oriental",
      address: "Calle 87 con Cra 15, Bogotá",
      zone: "Zona Norte"
    },
    price: 10000,
    capacity: 15,
    attendees: [
      { id: "att-4", name: "David Castro", phone: "3102345678", paymentMethod: "ticket", uniqueCode: "SZ-BX-55210", registeredAt: "2026-08-28" }
    ],
    level: "Principiante a Intermedio",
    requirements: ["Vendas elásticas (4.5m)", "Guantes (opcionales)", "Agua"],
    description: "Perfecciona tu postura, potencia de golpeo con giro de cadera, combinaciones básicas de 3 golpes y ejercicios de sombra con manoplas."
  },
  {
    id: "ses-3",
    discipline: "taekwondo",
    title: "Taekwondo Dinámico: Patadas Veloces & Distancia de Combate",
    instructorId: "inst-2",
    instructorName: "Mtra. Jin-Woo & Andrea Park",
    instructorAvatar: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=300",
    date: getFutureDate(2),
    time: "09:30 AM - 11:00 AM",
    recurrence: "biweekly_sunday",
    recurrenceLabel: "Un Domingo cada 15 días",
    location: {
      name: "Sede Coliseo El Salitre - Canchas Exteriores",
      address: "Calle 63 # 68-45, Bogotá",
      zone: "Zona Salitre"
    },
    price: 10000,
    capacity: 20,
    attendees: [],
    level: "Todos los niveles",
    requirements: ["Ropa deportiva amplia o dobok", "Hidratación", "Buena disposición para estiramientos"],
    description: "Trabajo intensivo de elasticidad, patada circular (Dollyo Chagi), patada descendente y cambios rápidos de guardia para esquivar ataques."
  }
];

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
  initialize: async () => {
    try {
      const content = await SafeZoneCloud.fetchContent();
      const sources = {
        sessions: 'safezone_sessions',
        instructors: 'safezone_instructors',
        combos: 'safezone_combos'
      };

      Object.entries(sources).forEach(([key, storageKey]) => {
        if (Array.isArray(content[key]) && content[key].length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(content[key]));
        }
      });
      return true;
    } catch (error) {
      console.warn('Safe Zone no pudo cargar el contenido remoto; se usarán los datos locales.', error);
      return false;
    }
  },

  getSessions: () => {
    const data = localStorage.getItem('safezone_sessions');
    return data ? JSON.parse(data) : DEFAULT_SESSIONS;
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
      rating: 5.0,
      reviewsCount: 1,
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
      const filtered = parsed.filter(c => c.totalTickets <= 4);
      return filtered.length > 0 ? filtered : DEFAULT_COMBOS;
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
    return data ? JSON.parse(data) : DEFAULT_TRANSACTIONS;
  },
  saveTransactions: (transactions) => {
    localStorage.setItem('safezone_transactions', JSON.stringify(transactions));
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

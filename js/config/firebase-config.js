/* =====================================================================
   CONFIGURACIÓN FIREBASE & ADAPTADOR RESILIENTE (DUAL ENGINE)
   Grúas Londoño · Conexión oficial a Firebase Auth + Firestore
   con fallback inteligente en LocalStorage para GitHub Pages y entornos
   de evaluación sin configuración previa obligatoria.
   ===================================================================== */

// Credenciales oficiales de Firebase (Proyecto Gruas-Londono)
const firebaseConfig = {
  apiKey: "AIzaSyBCuMPQhYDCH4dmHoaVC_pBobEFtIuVGdc",
  authDomain: "gruas-londono.firebaseapp.com",
  databaseURL: "https://gruas-londono-default-rtdb.firebaseio.com",
  projectId: "gruas-londono",
  storageBucket: "gruas-londono.firebasestorage.app",
  messagingSenderId: "742628395904",
};
window.firebaseConfig = firebaseConfig;

// Determina si Firebase nativo está disponible y configurado
let _isRealFirebase = false;
let auth = null;
let db = null;

try {
  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    // Si la API key es válida (no es el placeholder genérico)
    if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('MOCK') && !firebaseConfig.apiKey.includes('TU_API_KEY')) {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      _isRealFirebase = true;
      console.info('%c[Grúas Londoño]%c Conectado exitosamente a Firebase Cloud Firestore.', 'color: #003366; font-weight: bold;', 'color: #10B981;');
    }
  }
} catch (err) {
  console.warn('[Firebase] Inicialización estándar no disponible, usando motor mock reactivo:', err);
}

// ---------------------------------------------------------------------
// MOCK RESILIENTE (Para GitHub Pages y evaluación directa en navegador)
// Implementa exactamente la misma interfaz de Firebase Auth y Firestore:
// .collection().get(), .doc().set(), .add(), .onSnapshot(), .where(), etc.
// ---------------------------------------------------------------------
if (!_isRealFirebase) {
  console.info('%c[Grúas Londoño]%c Modo demostración activo (Motor LocalStorage reactivo).', 'color: #003366; font-weight: bold;', 'color: #2563EB;');

  // Semillas maestras iniciales
  const SEED_GRÜAS = [
    {
      id: "GRUA-01",
      placa: "ABC-123",
      modelo: "Chevrolet NPR 2021",
      tipo: "Plataforma Hidráulica",
      capacidadToneladas: 4.5,
      conductorAsignado: "Mario Restrepo",
      telefonoConductor: "3104567890",
      disponible: true
    },
    {
      id: "GRUA-02",
      placa: "DEF-456",
      modelo: "International 4300 2023",
      tipo: "Pluma/Gancho de Rescate",
      capacidadToneladas: 12.0,
      conductorAsignado: "Héctor Fabio",
      telefonoConductor: "3158889900",
      disponible: true
    },
    {
      id: "GRUA-03",
      placa: "WXY-123",
      modelo: "Chevrolet FTR 2022",
      tipo: "Plataforma con Winche Pesado",
      capacidadToneladas: 5.0,
      conductorAsignado: "Jorge Gómez",
      telefonoConductor: "3115556677",
      disponible: false
    },
    {
      id: "GRUA-04",
      placa: "GHI-789",
      modelo: "Kenworth T800 2024",
      tipo: "Cama Baja Extensible",
      capacidadToneladas: 35.0,
      conductorAsignado: "Carlos Montoya",
      telefonoConductor: "3182223344",
      disponible: true
    }
  ];

  const SEED_USUARIOS = {
    "usr_admin": {
      uid: "usr_admin",
      nombreCompleto: "Dra. Patricia Londoño",
      correo: "admin@gruaslondono.com",
      telefono: "3109998877",
      rol: "ADMINISTRADOR",
      fechaCreacion: "2026-01-10T10:00:00Z",
      estado: true
    },
    "usr_despacho": {
      uid: "usr_despacho",
      nombreCompleto: "Carlos Mendoza (Despacho)",
      correo: "despacho@gruaslondono.com",
      telefono: "3101234567",
      rol: "OPERADOR",
      fechaCreacion: "2026-01-15T12:00:00Z",
      estado: true
    },
    "usr_conductor": {
      uid: "usr_conductor",
      nombreCompleto: "Jorge Gómez (Conductor G-03)",
      correo: "conductor@gruaslondono.com",
      telefono: "3115556677",
      rol: "CONDUCTOR",
      gruaAsignada: "GRUA-03",
      fechaCreacion: "2026-02-01T08:00:00Z",
      estado: true
    },
    "usr_cliente": {
      uid: "usr_cliente",
      nombreCompleto: "Transportes Andinos S.A.S.",
      correo: "cliente@andinos.com",
      telefono: "3209876543",
      documento: "900123456-1",
      rol: "CLIENTE",
      fechaCreacion: "2026-03-01T08:00:00Z",
      estado: true
    }
  };

  const SEED_SOLICITUDES = [
    {
      id: "SOL-2026-001",
      radicado: "GL-2026-00104",
      fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
      cliente: {
        nombre: "Transportes Andinos S.A.S.",
        documento: "900123456-1",
        telefono: "3209876543",
        correo: "contacto@andinos.com"
      },
      servicio: {
        tipoServicio: "GRUA_PLATAFORMA",
        origen: "Calle 15 # 8-20, Aguachica, Cesar",
        destino: "Km 42 Vía Central, San Alberto",
        puntoReferencia: "Frente a Estación de Servicio Terpel",
        distanciaKm: 42.5,
        tipoEnganche: "carretera",
        topografia: "ondulado"
      },
      vehiculo: {
        placa: "XYZ-789",
        tipo: "Camioneta Toyota Hilux",
        traccion: "4x4",
        transmision: "automatica",
        pesoToneladas: 2.8,
        valorComercialDeclarado: 95000000,
        fallaMecanica: "Dirección trabada, sin llaves"
      },
      cotizacion: {
        tarifaBase: 150000,
        costoDistancia: 178500,
        recargoTopografia: 15000,
        recargoCarga: 42000,
        recargoSeguroMercancia: 190000,
        valorTotal: 575500,
        requiereRevisionManual: false
      },
      estado: "ASIGNADA",
      despacho: {
        idGrua: "GRUA-03",
        placaGrua: "WXY-123",
        nombreConductor: "Jorge Gómez",
        telefonoConductor: "3115556677",
        fechaAsignacion: new Date(Date.now() - 3600000).toISOString()
      },
      bitacora: [
        {
          fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
          autor: "Sistema",
          nota: "Solicitud radicada automáticamente con cotización normada SICETAC."
        },
        {
          fecha: new Date(Date.now() - 3600000).toISOString(),
          autor: "Coord_Despacho",
          nota: "Asignada grúa de plataforma 03 por tracción 4x4 y dirección bloqueada."
        }
      ]
    },
    {
      id: "SOL-2026-002",
      radicado: "GL-2026-00105",
      fecha: new Date(Date.now() - 1800000).toISOString(),
      cliente: {
        nombre: "María Fernanda Rincón",
        documento: "1098765432",
        telefono: "3154443322",
        correo: "mafe.rincon@gmail.com"
      },
      servicio: {
        tipoServicio: "GRUA_PLATAFORMA",
        origen: "Cra 27 # 45-10, Bucaramanga",
        destino: "Floridablanca, Anillo Vial",
        puntoReferencia: "Parque Caracolí",
        distanciaKm: 14.0,
        tipoEnganche: "urbano",
        topografia: "plano"
      },
      vehiculo: {
        placa: "KLS-240",
        tipo: "Automóvil Mazda 3",
        traccion: "4x2",
        transmision: "manual",
        pesoToneladas: 1.4,
        valorComercialDeclarado: 62000000,
        fallaMecanica: "Batería descargada y embrague quemado"
      },
      cotizacion: {
        tarifaBase: 100000,
        costoDistancia: 49000,
        recargoTopografia: 0,
        recargoCarga: 21000,
        recargoSeguroMercancia: 124000,
        valorTotal: 294000,
        requiereRevisionManual: false
      },
      estado: "PENDIENTE",
      bitacora: [
        {
          fecha: new Date(Date.now() - 1800000).toISOString(),
          autor: "Sistema",
          nota: "Solicitud radicada por portal público."
        }
      ]
    }
  ];

  // Carga inicial o persistencia de LocalStorage
  const getStorage = (key, defaultVal) => {
    try {
      const data = localStorage.getItem(`gl_${key}`);
      return data ? JSON.parse(data) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const setStorage = (key, val) => {
    try {
      localStorage.setItem(`gl_${key}`, JSON.stringify(val));
    } catch (e) {
      console.warn("Storage full", e);
    }
  };

  // Inicializar almacenes si no existen
  if (!localStorage.getItem('gl_gruas')) setStorage('gruas', SEED_GRÜAS);
  if (!localStorage.getItem('gl_usuarios')) setStorage('usuarios', SEED_USUARIOS);
  if (!localStorage.getItem('gl_solicitudes')) setStorage('solicitudes', SEED_SOLICITUDES);

  // Event dispatcher para cambios en tiempo real
  const listeners = {
    solicitudes: [],
    gruas: []
  };

  const emitChange = (collName) => {
    const list = listeners[collName] || [];
    const data = getStorage(collName, []);
    list.forEach(cb => {
      try {
        cb({
          docs: data.map(item => ({
            id: item.id || item.uid,
            data: () => item
          })),
          empty: data.length === 0
        });
      } catch (err) {
        console.error("Error en listener", err);
      }
    });
  };

  // Motor Auth Mock
  let currentAuthUser = getStorage('auth_user', null);
  const authListeners = [];

  auth = {
    get currentUser() {
      return currentAuthUser;
    },
    onAuthStateChanged(callback) {
      authListeners.push(callback);
      setTimeout(() => callback(currentAuthUser), 10);
      return () => {
        const idx = authListeners.indexOf(callback);
        if (idx !== -1) authListeners.splice(idx, 1);
      };
    },
    async signInWithEmailAndPassword(email, password) {
      const usuarios = getStorage('usuarios', SEED_USUARIOS);
      const user = Object.values(usuarios).find(u => u.correo.toLowerCase() === email.toLowerCase());
      if (!user) {
        const err = new Error("No existe una cuenta con este correo");
        err.code = "auth/user-not-found";
        throw err;
      }
      currentAuthUser = {
        uid: user.uid,
        email: user.correo,
        displayName: user.nombreCompleto
      };
      setStorage('auth_user', currentAuthUser);
      authListeners.forEach(cb => cb(currentAuthUser));
      return { user: currentAuthUser };
    },
    async createUserWithEmailAndPassword(email, password) {
      if (!password || password.length < 6) {
        const err = new Error("La contraseña debe tener al menos 6 caracteres");
        err.code = "auth/weak-password";
        throw err;
      }
      const usuarios = getStorage('usuarios', SEED_USUARIOS);
      const exists = Object.values(usuarios).some(u => u.correo.toLowerCase() === email.toLowerCase());
      if (exists) {
        const err = new Error("El correo ya está registrado");
        err.code = "auth/email-already-in-use";
        throw err;
      }
      const uid = "usr_" + Date.now();
      currentAuthUser = { uid, email, displayName: email.split('@')[0] };
      setStorage('auth_user', currentAuthUser);
      authListeners.forEach(cb => cb(currentAuthUser));
      return { user: currentAuthUser };
    },
    async signOut() {
      currentAuthUser = null;
      setStorage('auth_user', null);
      authListeners.forEach(cb => cb(null));
    }
  };

  // Motor Firestore Mock
  db = {
    collection(collName) {
      let conditions = [];
      let orderByField = null;
      let orderDir = 'asc';
      let limitCount = null;

      const queryObj = {
        where(field, op, val) {
          conditions.push({ field, op, val });
          return queryObj;
        },
        orderBy(field, dir = 'asc') {
          orderByField = field;
          orderDir = dir;
          return queryObj;
        },
        limit(n) {
          limitCount = n;
          return queryObj;
        },
        async get() {
          let list = getStorage(collName, []);
          // Aplicar filtros
          conditions.forEach(cond => {
            list = list.filter(item => {
              const parts = cond.field.split('.');
              let cur = item;
              for (const p of parts) {
                if (cur == null) return false;
                cur = cur[p];
              }
              if (cond.op === '==') return cur === cond.val;
              if (cond.op === '>=') return cur >= cond.val;
              if (cond.op === '<=') return cur <= cond.val;
              return true;
            });
          });
          if (orderByField) {
            list.sort((a, b) => {
              const va = a[orderByField] || '';
              const vb = b[orderByField] || '';
              return orderDir === 'desc' ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1);
            });
          }
          if (limitCount != null) {
            list = list.slice(0, limitCount);
          }
          return {
            empty: list.length === 0,
            docs: list.map(item => ({
              id: item.id || item.uid,
              ref: db.collection(collName).doc(item.id || item.uid),
              data: () => item
            }))
          };
        },
        onSnapshot(callback, errCb) {
          const runCb = () => {
            queryObj.get().then(res => callback(res)).catch(e => errCb && errCb(e));
          };
          if (!listeners[collName]) listeners[collName] = [];
          listeners[collName].push(runCb);
          setTimeout(runCb, 10);
          return () => {
            const idx = listeners[collName].indexOf(runCb);
            if (idx !== -1) listeners[collName].splice(idx, 1);
          };
        },
        doc(docId) {
          return {
            id: docId,
            async get() {
              const list = getStorage(collName, collName === 'usuarios' ? SEED_USUARIOS : []);
              let data = null;
              if (Array.isArray(list)) {
                data = list.find(item => (item.id || item.uid) === docId);
              } else {
                data = list[docId] || null;
              }
              return {
                id: docId,
                exists: !!data,
                data: () => data
              };
            },
            async set(data, opts = {}) {
              let storeData = getStorage(collName, collName === 'usuarios' ? SEED_USUARIOS : []);
              if (collName === 'usuarios' && !Array.isArray(storeData)) {
                storeData[docId] = { uid: docId, ...data };
              } else if (Array.isArray(storeData)) {
                const idx = storeData.findIndex(item => (item.id || item.uid) === docId);
                if (idx !== -1) {
                  storeData[idx] = opts.merge ? { ...storeData[idx], ...data } : { id: docId, ...data };
                } else {
                  storeData.push({ id: docId, ...data });
                }
              }
              setStorage(collName, storeData);
              emitChange(collName);
            },
            async update(data) {
              let storeData = getStorage(collName, []);
              if (Array.isArray(storeData)) {
                const idx = storeData.findIndex(item => (item.id || item.uid) === docId);
                if (idx !== -1) {
                  // Resolver arrayUnion si existe
                  const updated = { ...storeData[idx] };
                  Object.entries(data).forEach(([k, v]) => {
                    if (v && v.__arrayUnion) {
                      updated[k] = [...(updated[k] || []), ...v.elements];
                    } else {
                      updated[k] = v;
                    }
                  });
                  storeData[idx] = updated;
                  setStorage(collName, storeData);
                  emitChange(collName);
                  return;
                }
              }
            },
            onSnapshot(callback) {
              const checkDoc = async () => {
                const snap = await db.collection(collName).doc(docId).get();
                callback(snap);
              };
              if (!listeners[collName]) listeners[collName] = [];
              listeners[collName].push(checkDoc);
              setTimeout(checkDoc, 10);
              return () => {
                const idx = listeners[collName].indexOf(checkDoc);
                if (idx !== -1) listeners[collName].splice(idx, 1);
              };
            }
          };
        },
        async add(data) {
          const id = "DOC-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          const list = getStorage(collName, []);
          const newItem = { id, ...data };
          list.unshift(newItem);
          setStorage(collName, list);
          emitChange(collName);
          return { id };
        }
      };
      return queryObj;
    }
  };

  // Mock arrayUnion de Firestore
  if (!window.firebase) window.firebase = {};
  if (!window.firebase.firestore) window.firebase.firestore = {};
  window.firebase.firestore.FieldValue = {
    arrayUnion(...elements) {
      return { __arrayUnion: true, elements };
    }
  };
}

// Exportar globalmente
window.auth = auth;
window.db = db;

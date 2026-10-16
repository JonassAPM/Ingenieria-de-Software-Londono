// Configuración central de Firebase
// Reemplaza los valores con las credenciales de tu proyecto en Firebase Console.
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicialización de Firebase
firebase.initializeApp(firebaseConfig);

// Servicios disponibles globalmente para otros módulos
const auth = firebase.auth();
const db = firebase.firestore();

// Exponer en window para depuración y compatibilidad con Vanilla JS modular
window.auth = auth;
window.db = db;

// Configurar Firestore para asegurar compatibilidad en entornos locales
try {
  db.settings({ merge: true });
} catch (error) {
  console.warn('Firestore settings no pudieron aplicarse:', error);
}

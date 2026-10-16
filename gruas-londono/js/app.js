// Orquestador principal de la aplicación.
// Inicializa módulos según estén disponibles en la página.

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar módulos solo si están definidos
  if (typeof AuthView !== 'undefined') {
    AuthView.init();
  }

  if (typeof CotizacionController !== 'undefined') {
    CotizacionController.init();
  }

  if (typeof RadicacionController !== 'undefined') {
    RadicacionController.init();
  }

  if (typeof DespachoController !== 'undefined') {
    DespachoController.init();
  }

  // Actualizar la navegación según el estado de Firebase Auth
  if (typeof auth !== 'undefined') {
    auth.onAuthStateChanged((user) => {
      if (typeof AuthView !== 'undefined') {
        AuthView.updateNav(user);
      }

      const btnOpen = document.getElementById('btn-open-auth');
      if (btnOpen) {
        btnOpen.onclick = () => {
          if (user) {
            if (typeof AuthController !== 'undefined') {
              AuthController.logout();
            }
          } else {
            if (typeof AuthView !== 'undefined') {
              AuthView.openModal('login');
            }
          }
        };
      }
    });
  }
});

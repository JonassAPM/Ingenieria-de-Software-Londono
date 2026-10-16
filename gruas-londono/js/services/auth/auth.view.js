// Vista del módulo de autenticación.
// Gestiona modales, pestañas, estados visuales y mensajes de error.
const AuthView = {
  modal: null,
  loginForm: null,
  registerForm: null,
  tabLogin: null,
  tabRegister: null,
  indicator: null,

  /**
   * Inicializa referencias y listeners del DOM una vez cargado el documento.
   */
  init() {
    this.modal = document.getElementById('auth-modal');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.tabLogin = document.getElementById('tab-login');
    this.tabRegister = document.getElementById('tab-register');
    this.indicator = document.getElementById('auth-user-indicator');

    if (!this.modal || !this.loginForm || !this.registerForm) return;

    this._bindGlobalActions();
    this._bindTabActions();
    this._bindFormActions();
  },

  /**
   * Asigna listeners a botones globales que abren/cierran el modal.
   * El botón principal de navegación (#btn-open-auth) se gestiona
   * dinámicamente en app.js según el estado de la sesión.
   */
  _bindGlobalActions() {
    const openButtons = document.querySelectorAll('[data-open-auth]');
    openButtons.forEach(btn => btn.addEventListener('click', () => this.openModal('login')));

    const closeButtons = document.querySelectorAll('[data-close-auth]');
    closeButtons.forEach(btn => btn.addEventListener('click', () => this.closeModal()));

    // Cerrar al hacer clic fuera del modal
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.closeModal();
      }
    });
  },

  /**
   * Asigna el comportamiento de las pestañas Login / Registro.
   */
  _bindTabActions() {
    this.tabLogin.addEventListener('click', () => this.switchTab('login'));
    this.tabRegister.addEventListener('click', () => this.switchTab('register'));
  },

  /**
   * Asigna el manejo de envío de formularios mediante eventos personalizados.
   */
  _bindFormActions() {
    this.loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      document.dispatchEvent(new CustomEvent('auth:login', { detail: { email, password } }));
    });

    this.registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        nombreCompleto: document.getElementById('reg-nombre').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        telefono: document.getElementById('reg-telefono').value.trim(),
        password: document.getElementById('reg-password').value
      };
      document.dispatchEvent(new CustomEvent('auth:register', { detail: data }));
    });
  },

  /**
   * Abre el modal y activa la pestaña solicitada.
   * @param {'login'|'register'} tab - Pestaña inicial.
   */
  openModal(tab = 'login') {
    this.clearErrors();
    this.modal.classList.remove('hidden');
    this.switchTab(tab);
  },

  /**
   * Cierra el modal de autenticación.
   */
  closeModal() {
    this.modal.classList.add('hidden');
    this.clearErrors();
  },

  /**
   * Alterna entre los formularios de login y registro.
   * @param {'login'|'register'} tab - Pestaña a mostrar.
   */
  switchTab(tab) {
    const isLogin = tab === 'login';
    this.loginForm.classList.toggle('hidden', !isLogin);
    this.registerForm.classList.toggle('hidden', isLogin);
    this.tabLogin.classList.toggle('active', isLogin);
    this.tabRegister.classList.toggle('active', !isLogin);
    this.clearErrors();
  },

  /**
   * Actualiza la navegación de acuerdo al estado de autenticación.
   * @param {object|null} user - Objeto de usuario de Firebase o null.
   */
  updateNav(user) {
    const btnOpen = document.getElementById('btn-open-auth');
    const indicator = this.indicator;

    if (!btnOpen || !indicator) return;

    if (user) {
      btnOpen.textContent = 'Cerrar sesión';
      btnOpen.classList.remove('btn-ghost');
      btnOpen.classList.add('btn-secondary');

      const primerNombre = user.displayName
        ? user.displayName.split(' ')[0]
        : user.email.split('@')[0];
      indicator.textContent = `Hola, ${primerNombre}`;
      indicator.classList.remove('hidden');
    } else {
      btnOpen.textContent = 'Iniciar sesión';
      btnOpen.classList.add('btn-ghost');
      btnOpen.classList.remove('btn-secondary');

      indicator.textContent = '';
      indicator.classList.add('hidden');
    }
  },

  /**
   * Muestra un mensaje de error junto al campo correspondiente.
   * @param {string} formId - ID del formulario.
   * @param {string} fieldId - ID del input relacionado.
   * @param {string} message - Texto del error.
   */
  showError(formId, fieldId, message) {
    const form = document.getElementById(formId);
    if (!form) return;

    const input = form.querySelector(`#${fieldId}`);
    const errorSpan = input ? input.parentElement.querySelector('.error-message') : null;
    if (errorSpan) errorSpan.textContent = message;
  },

  /**
   * Limpia todos los mensajes de error visibles en los formularios.
   */
  clearErrors() {
    document.querySelectorAll('.auth-form .error-message').forEach(span => {
      span.textContent = '';
    });
  },

  /**
   * Muestra una notificación toast en pantalla.
   * @param {string} message - Texto del toast.
   * @param {'success'|'error'|'info'} type - Tipo de notificación.
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
};

/* =====================================================================
   VISTA: AUTENTICACIÓN Y ROLES · GRÚAS LONDOÑO
   Control de páginas y modales oficiales, alternar contraseñas sin dobles
   disparos, panel dinámico, elevación de grúa (crane hoist) ante errores
   y autenticación directa con Google.
   ===================================================================== */
const AuthView = {
  _initialized: false,
  modal: null,
  craneModal: null,
  loginForm: null,
  registerForm: null,
  tabLogin: null,
  tabRegister: null,
  sideLoginCopy: null,
  sideRegisterCopy: null,
  btnOpenAuth: null,
  indicator: null,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    this.modal = document.getElementById('auth-modal');
    this.craneModal = document.getElementById('auth-modal-crane');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.tabLogin = document.getElementById('tab-login');
    this.tabRegister = document.getElementById('tab-register');
    this.sideLoginCopy = document.getElementById('side-login-copy');
    this.sideRegisterCopy = document.getElementById('side-register-copy');
    this.btnOpenAuth = document.getElementById('btn-open-auth');
    this.indicator = document.getElementById('auth-user-indicator');

    // Hidratación instantánea del navbar desde caché para eliminar cualquier parpadeo
    this.applyCachedNav();

    this._bindEvents();
    this._bindPasswordToggles();
  },

  applyCachedNav() {
    try {
      const raw = localStorage.getItem('gl_auth_cache');
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && cached.rol) {
          this.updateNav(
            { uid: cached.uid, email: cached.email },
            { rol: cached.rol, nombreCompleto: cached.nombre }
          );
          return;
        }
      }
      this.updateNav(null, null);
    } catch (_) {
      this.updateNav(null, null);
    }
  },

  _bindEvents() {
    // Redirección a páginas dedicadas en cualquier botón con data-open-auth
    document.querySelectorAll('[data-open-auth]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = btn.dataset.openAuth === 'register' ? 'registro.html' : 'login.html';
        window.location.href = dest;
      });
    });

    // Enlaces de cambio entre login y registro
    document.querySelectorAll('[data-switch-to]').forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = btn.dataset.switchTo === 'register' ? 'registro.html' : 'login.html';
        window.location.href = dest;
      });
    });

    // Cerrar modal si existiera
    document.querySelectorAll('[data-close-auth]').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });

    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) this.closeModal();
      });
    }

    // Tabs
    if (this.tabLogin && this.tabRegister) {
      this.tabLogin.addEventListener('click', () => this.switchTab('login'));
      this.tabRegister.addEventListener('click', () => this.switchTab('register'));
    }

    // Botón oficial de Google
    const btnGoogle = document.getElementById('btn-google-auth');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.AuthController && AuthController.loginConGoogle) {
          AuthController.loginConGoogle();
        }
      });
    }

    // Cuentas demo rápidas (para evaluación)
    document.querySelectorAll('[data-demo-email]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        if (emailInput && passInput) {
          emailInput.value = btn.dataset.demoEmail;
          passInput.value = '123456';
          this.switchTab('login');
          if (this.loginForm) {
            this.loginForm.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }
      });
    });
  },

  _bindPasswordToggles() {
    // Alternar visibilidad de contraseña de manera confiable y limpia
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.setAttribute('aria-label', isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña');
          btn.innerHTML = isPassword
            ? `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
            : `<svg class="icon icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
        }
      });
    });
  },

  openModal(tab = 'login') {
    const dest = tab === 'register' ? 'registro.html' : 'login.html';
    window.location.href = dest;
  },

  closeModal() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      document.body.classList.remove('modal-abierto');
    }
  },

  switchTab(tab) {
    const isLogin = tab === 'login';
    if (this.loginForm) this.loginForm.classList.toggle('hidden', !isLogin);
    if (this.registerForm) this.registerForm.classList.toggle('hidden', isLogin);
    if (this.tabLogin) this.tabLogin.classList.toggle('active', isLogin);
    if (this.tabRegister) this.tabRegister.classList.toggle('active', !isLogin);

    if (this.craneModal) {
      this.craneModal.classList.toggle('register-mode', !isLogin);
    }
    if (this.sideLoginCopy) {
      this.sideLoginCopy.classList.toggle('hidden', !isLogin);
    }
    if (this.sideRegisterCopy) {
      this.sideRegisterCopy.classList.toggle('hidden', isLogin);
    }

    this.clearErrors();
  },

  updateNav(user, perfil) {
    if (!this.btnOpenAuth) this.btnOpenAuth = document.getElementById('btn-open-auth');
    if (!this.indicator) this.indicator = document.getElementById('auth-user-indicator');
    const btnsRegister = document.querySelectorAll('.nav-actions a[href*="registro"]');
    const linkDashboards = document.querySelectorAll('nav.nav-links a[href*="dashboard"]');
    const linkConductors = document.querySelectorAll('nav.nav-links a[href*="conductor"]');

    if (user && perfil) {
      const rol = (perfil.rol || 'CLIENTE').toUpperCase();

      if (this.btnOpenAuth) {
        this.btnOpenAuth.textContent = 'Cerrar sesión';
        this.btnOpenAuth.classList.remove('btn-primary', 'btn-ghost');
        this.btnOpenAuth.classList.add('btn-secondary', 'btn-sm');
      }

      // Ocultar botón 'Crear cuenta' si el usuario ya tiene sesión iniciada
      btnsRegister.forEach(btn => {
        btn.classList.add('hidden');
        btn.style.display = 'none';
      });

      // Indicador de usuario con avatar y chip de rol con color temático corporativo
      if (this.indicator) {
        const inicial = (perfil.nombreCompleto || user.email || 'U').charAt(0).toUpperCase();
        let rolBadgeColor = 'var(--gl-secondary)';
        if (rol === 'ADMINISTRADOR') rolBadgeColor = 'var(--gl-primary)';
        else if (rol === 'CONDUCTOR') rolBadgeColor = '#D97706';
        else if (rol === 'OPERADOR') rolBadgeColor = '#2563EB';

        this.indicator.innerHTML = `
          <div class="user-chip">
            <span class="user-avatar" style="background: ${rolBadgeColor}; color: #FFFFFF; font-weight:700;">${inicial}</span>
            <div class="user-info">
              <strong>${Formatters.escapeHTML(perfil.nombreCompleto || user.email)}</strong>
              <small style="color: ${rolBadgeColor}; font-weight:800; text-transform:uppercase;">${Formatters.escapeHTML(rol)}</small>
            </div>
          </div>
        `;
        this.indicator.classList.remove('hidden');
      }

      // Control estricto de visibilidad en el Navbar según rol:
      // 1. Mesa de Control: solo visible para personal de Despacho y Administración
      const puedeVerDashboard = (rol === 'ADMINISTRADOR' || rol === 'OPERADOR');
      linkDashboards.forEach(link => {
        link.style.display = puedeVerDashboard ? '' : 'none';
        link.classList.remove('nav-rol'); // Color estándar unificado para todos los enlaces
      });

      // 2. Modo Conductor: visible para conductores y personal de despacho/supervisión
      const puedeVerConductor = (rol === 'CONDUCTOR' || rol === 'OPERADOR' || rol === 'ADMINISTRADOR');
      linkConductors.forEach(link => {
        link.style.display = puedeVerConductor ? '' : 'none';
        link.classList.remove('nav-rol');
      });

    } else {
      // VISITANTE ANÓNIMO (Sin sesión iniciada)
      if (this.btnOpenAuth) {
        this.btnOpenAuth.textContent = 'Iniciar sesión';
        this.btnOpenAuth.classList.remove('btn-primary', 'btn-ghost');
        this.btnOpenAuth.classList.add('btn-secondary', 'btn-sm');
      }

      // Restaurar botón 'Crear cuenta' para visitantes anónimos
      btnsRegister.forEach(btn => {
        btn.classList.remove('hidden');
        btn.style.display = '';
      });

      if (this.indicator) {
        this.indicator.innerHTML = '';
        this.indicator.classList.add('hidden');
      }

      // Los módulos operativos (Mesa de Control y Modo Conductor) NO son públicos:
      // se ocultan a visitantes anónimos para mantener la privacidad de la empresa
      linkDashboards.forEach(link => {
        link.style.display = 'none';
        link.classList.remove('nav-rol');
      });
      linkConductors.forEach(link => {
        link.style.display = 'none';
        link.classList.remove('nav-rol');
      });
    }
  },

  showFieldError(formId, fieldId, mensaje) {
    const input = document.getElementById(fieldId);
    const field = input ? input.closest('.field') : null;
    if (field) {
      field.classList.add('has-error');
      let err = field.querySelector('.field-error');
      if (!err) {
        err = document.createElement('span');
        err.className = 'field-error';
        field.appendChild(err);
      }
      err.textContent = mensaje;
    }

    // Efecto físico de izaje: La grúa eleva el panel hacia arriba para que no sobrepase el fondo
    const board = document.querySelector('.auth-hanging-board');
    if (board) {
      board.classList.add('crane-hoisted');
    }
  },

  clearErrors() {
    document.querySelectorAll('.field.has-error').forEach(f => {
      f.classList.remove('has-error');
      const err = f.querySelector('.field-error');
      if (err) err.textContent = '';
    });

    const board = document.querySelector('.auth-hanging-board');
    if (board) {
      board.classList.remove('crane-hoisted');
    }
  }
};

window.AuthView = AuthView;

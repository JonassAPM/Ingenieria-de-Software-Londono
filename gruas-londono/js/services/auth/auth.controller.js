// Controlador de autenticación.
// Orquesta Firebase Auth, Firestore y la vista correspondiente.
const AuthController = {
  /**
   * Inicia sesión con correo y contraseña.
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    AuthView.clearErrors();

    try {
      await auth.signInWithEmailAndPassword(email, password);
      AuthView.showToast('Sesión iniciada correctamente', 'success');
      AuthView.closeModal();
    } catch (error) {
      console.error('Error en login:', error);
      const message = this._traducirError(error.code);
      AuthView.showError('login-form', 'login-email', message);
      AuthView.showToast('No se pudo iniciar sesión', 'error');
    }
  },

  /**
   * Registra un nuevo usuario y crea su perfil en Firestore.
   * @param {object} data - { nombreCompleto, email, telefono, password }
   */
  async register(data) {
    AuthView.clearErrors();

    try {
      const credenciales = await auth.createUserWithEmailAndPassword(data.email, data.password);
      await AuthModel.crearPerfil(
        {
          nombreCompleto: data.nombreCompleto,
          correo: data.email,
          telefono: data.telefono
        },
        credenciales.user.uid
      );

      AuthView.showToast('Cuenta creada exitosamente', 'success');
      AuthView.closeModal();
    } catch (error) {
      console.error('Error en registro:', error);
      const message = this._traducirError(error.code);
      AuthView.showError('register-form', 'reg-email', message);
      AuthView.showToast('No se pudo completar el registro', 'error');
    }
  },

  /**
   * Cierra la sesión activa y redirige a la página principal.
   */
  async logout() {
    try {
      await auth.signOut();
      AuthView.showToast('Sesión cerrada', 'success');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      AuthView.showToast('No se pudo cerrar sesión', 'error');
    }
  },

  /**
   * Verifica si el usuario autenticado tiene uno de los roles permitidos.
   * Si no está autenticado, redirige al index.html.
   * @param {string[]} allowedRoles - Roles permitidos para la ruta.
   * @returns {Promise<object|null>} Perfil del usuario si tiene acceso.
   */
  async checkAuth(allowedRoles = []) {
    const user = auth.currentUser;
    if (!user) {
      window.location.href = 'index.html';
      return null;
    }

    const perfil = await AuthModel.obtenerPerfil(user.uid);
    if (!perfil) {
      await auth.signOut();
      window.location.href = 'index.html';
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(perfil.rol)) {
      window.location.href = 'index.html';
      return null;
    }

    return perfil;
  },

  /**
   * Traduce códigos de error de Firebase Auth a mensajes comprensibles.
   * @param {string} code - Código de error original.
   * @returns {string} Mensaje amigable.
   */
  _traducirError(code) {
    const errores = {
      'auth/invalid-email': 'Correo electrónico no válido',
      'auth/user-disabled': 'Usuario deshabilitado',
      'auth/user-not-found': 'No existe una cuenta con este correo',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este correo ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/too-many-requests': 'Demasiados intentos. Intente más tarde'
    };

    return errores[code] || 'Ocurrió un error durante la autenticación';
  }
};

// Eventos de aplicación para conectar vista y controlador
document.addEventListener('auth:login', (e) => {
  const { email, password } = e.detail;
  AuthController.login(email, password);
});

document.addEventListener('auth:register', (e) => {
  const data = e.detail;
  AuthController.register(data);
});

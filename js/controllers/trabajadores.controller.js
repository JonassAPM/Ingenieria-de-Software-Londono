/* =====================================================================
   CONTROLADOR: ESPACIO DE TRABAJADORES (SUPER USUARIO) · GRÚAS LONDOÑO
   Gestión exclusiva de personal operativo (Conductores, Operadores, Administradores)
   ===================================================================== */
const TrabajadoresController = {
  trabajadores: [],

  async init() {
    if (typeof TrabajadoresView !== 'undefined') {
      TrabajadoresView.init();
    }

    this._bindAuthEvents();
    this._bindTabEvents();
    this._bindFormSubmit();
    this._bindAccionesTabla();

    // Si ya hay usuario autenticado al iniciar
    if (window.AuthController && AuthController.perfilActual) {
      this._evaluarPermisosAdmin(AuthController.perfilActual);
    }
  },

  _bindAuthEvents() {
    document.addEventListener('auth:cambio', (e) => {
      const perfil = e.detail?.perfil;
      this._evaluarPermisosAdmin(perfil);
    });
  },

  _evaluarPermisosAdmin(perfil) {
    const tabBtn = document.getElementById('tab-btn-trabajadores');
    if (!tabBtn) return;

    if (perfil && perfil.rol === 'ADMINISTRADOR') {
      tabBtn.classList.remove('hidden');
      this.cargarTrabajadores();
    } else {
      tabBtn.classList.add('hidden');
      // Si estaba en la sección de trabajadores pero no es admin, regresar a despacho
      this.activarModulo('despacho');
    }
  },

  _bindTabEvents() {
    const btnDespacho = document.getElementById('tab-btn-despacho');
    const btnTrabajadores = document.getElementById('tab-btn-trabajadores');

    if (btnDespacho) {
      btnDespacho.addEventListener('click', () => {
        this.activarModulo('despacho');
      });
    }

    if (btnTrabajadores) {
      btnTrabajadores.addEventListener('click', () => {
        this.activarModulo('trabajadores');
      });
    }
  },

  activarModulo(modulo) {
    const btnDespacho = document.getElementById('tab-btn-despacho');
    const btnTrabajadores = document.getElementById('tab-btn-trabajadores');
    const secDespacho = document.getElementById('modulo-despacho-seccion');
    const secTrabajadores = document.getElementById('modulo-trabajadores-seccion');

    if (modulo === 'trabajadores') {
      if (btnDespacho) {
        btnDespacho.classList.remove('btn-primary', 'active');
        btnDespacho.classList.add('btn-ghost');
      }
      if (btnTrabajadores) {
        btnTrabajadores.classList.remove('btn-secondary', 'btn-ghost');
        btnTrabajadores.classList.add('btn-primary', 'active');
      }
      if (secDespacho) secDespacho.classList.add('hidden');
      if (secTrabajadores) secTrabajadores.classList.remove('hidden');
      this.cargarTrabajadores();
    } else {
      // despacho
      if (btnDespacho) {
        btnDespacho.classList.remove('btn-ghost');
        btnDespacho.classList.add('btn-primary', 'active');
      }
      if (btnTrabajadores) {
        btnTrabajadores.classList.remove('btn-primary', 'active');
        btnTrabajadores.classList.add('btn-secondary');
      }
      if (secDespacho) secDespacho.classList.remove('hidden');
      if (secTrabajadores) secTrabajadores.classList.add('hidden');
    }
  },

  async cargarTrabajadores() {
    if (!window.UserRepository) return;
    try {
      this.trabajadores = await UserRepository.obtenerTrabajadores();
      if (window.TrabajadoresView) {
        TrabajadoresView.renderMetricas(this.trabajadores);
        TrabajadoresView.renderDirectorio(this.trabajadores);
      }
    } catch (err) {
      console.error('[TrabajadoresController] Error cargando trabajadores:', err);
    }
  },

  _bindFormSubmit() {
    const form = document.getElementById('form-crear-trabajador');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const adminUser = AuthController.usuarioActual;
      if (!adminUser) {
        Notifications.showToast('Debes ser Administrador para crear colaboradores', 'error');
        return;
      }

      const rol = document.getElementById('trabajador-rol-select')?.value;
      const nombre = document.getElementById('trabajador-nombre')?.value.trim();
      const correo = document.getElementById('trabajador-correo')?.value.trim();
      const telefono = document.getElementById('trabajador-telefono')?.value.trim();
      const documento = document.getElementById('trabajador-documento')?.value.trim();
      const password = document.getElementById('trabajador-password')?.value;

      if (!nombre || !correo || !password || password.length < 6) {
        Notifications.showToast('Por favor completa todos los campos requeridos (Contraseña mín 6 car.)', 'warning');
        return;
      }

      const datos = {
        nombreCompleto: nombre,
        correo,
        telefono,
        documento,
        rol
      };

      if (rol === 'CONDUCTOR') {
        datos.gruaAsignada = document.getElementById('trabajador-grua-select')?.value || 'GRUA-01';
        datos.categoriaLicencia = document.getElementById('trabajador-licencia-select')?.value || 'C2';
      } else if (rol === 'OPERADOR') {
        datos.turno = document.getElementById('trabajador-turno-select')?.value || 'Diurno';
        datos.estacionControl = document.getElementById('trabajador-estacion-input')?.value.trim() || 'Central Aguachica';
      }

      try {
        Notifications.showToast('Registrando colaborador en base de datos cifrada...', 'info');

        // 1. Crear el usuario en Firebase Auth para que tenga credenciales criptográficas seguras
        let nuevoUid = null;
        if (typeof firebase !== 'undefined' && firebase.initializeApp && window.firebaseConfig && window.firebaseConfig.apiKey && !window.firebaseConfig.apiKey.includes('MOCK')) {
          let secondaryApp = null;
          try {
            const tempAppName = 'WorkerAuthApp_' + Date.now();
            secondaryApp = firebase.initializeApp(window.firebaseConfig, tempAppName);
            const workerCred = await secondaryApp.auth().createUserWithEmailAndPassword(correo, password);
            nuevoUid = workerCred.user.uid;
            await secondaryApp.delete();
          } catch (secErr) {
            if (secondaryApp) {
              try { await secondaryApp.delete(); } catch (_) {}
            }
            if (secErr.code === 'auth/email-already-in-use') {
              throw new Error('Este correo ya se encuentra registrado en el sistema.');
            } else if (secErr.code === 'auth/weak-password') {
              throw new Error('La contraseña debe tener mínimo 6 caracteres.');
            }
            console.warn('[TrabajadoresController] Aviso auth secundario:', secErr);
            nuevoUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
          }
        } else {
          nuevoUid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        }

        // 2. Persistir perfil tipado en Cloud Firestore a través del UserRepository
        datos.uid = nuevoUid;
        await UserRepository.crearTrabajador(datos, adminUser.uid);

        Notifications.showToast(`¡Colaborador ${nombre} registrado con éxito!`, 'success');
        TrabajadoresView.cerrarModalCrear();
        await this.cargarTrabajadores();
      } catch (err) {
        console.error('Error al registrar colaborador:', err);
        Notifications.showToast(err.message || 'Error al guardar colaborador', 'error');
      }
    });
  },

  _bindAccionesTabla() {
    const tabla = document.getElementById('tabla-trabajadores-cuerpo');
    if (!tabla) return;

    tabla.addEventListener('click', async (e) => {
      const btnToggle = e.target.closest('.btn-toggle-worker-state');
      if (btnToggle) {
        const uid = btnToggle.dataset.workerId;
        const estadoActual = btnToggle.dataset.workerState === 'true';
        const nuevoEstado = !estadoActual;

        const adminUser = AuthController.usuarioActual;
        if (!adminUser) return;

        try {
          await UserRepository.cambiarEstado(uid, nuevoEstado, adminUser.uid);
          Notifications.showToast(`Estado del colaborador actualizado a ${nuevoEstado ? 'Activo' : 'Inactivo'}`, 'info');
          await this.cargarTrabajadores();
        } catch (err) {
          Notifications.showToast(err.message || 'No se pudo cambiar el estado', 'error');
        }
      }
    });
  }
};

window.TrabajadoresController = TrabajadoresController;

/* =====================================================================
   MODELO DE DOMINIO Y REPOSITORIO DE USUARIOS · GRÚAS LONDOÑO
   Programación Orientada a Objetos: Jerarquía de Clases y Subclases
   Persistencia 100% en Base de Datos Cloud Firestore (Cero credenciales en código)
   ===================================================================== */

/**
 * Clase Base: Usuario
 */
class Usuario {
  constructor(datos = {}) {
    this.uid = datos.uid || datos.id || '';
    this.nombreCompleto = datos.nombreCompleto || 'Usuario';
    this.correo = datos.correo || datos.email || '';
    this.telefono = datos.telefono || '';
    this.documento = datos.documento || '';
    this.rol = datos.rol || 'CLIENTE';
    this.fechaCreacion = datos.fechaCreacion || new Date().toISOString();
    this.estado = datos.estado !== undefined ? datos.estado : true;
  }

  esActivo() {
    return this.estado === true;
  }

  esTrabajador() {
    return this.rol === 'CONDUCTOR' || this.rol === 'OPERADOR' || this.rol === 'ADMINISTRADOR';
  }

  esAdministrador() {
    return this.rol === 'ADMINISTRADOR';
  }

  obtenerBadgeHTML() {
    const badges = {
      ADMINISTRADOR: '<span class="badge badge-plain" style="border-radius:var(--r-pill); padding:5px 12px; background:#FEF2F2; color:#DC2626; border:1px solid #FCA5A5; font-weight:700; font-size:0.75rem; display:inline-flex; align-items:center; gap:6px;"><span class="live-dot" style="color:#DC2626; width:7px; height:7px;"></span> Administrador</span>',
      OPERADOR: '<span class="badge badge-plain" style="border-radius:var(--r-pill); padding:5px 12px; background:#EFF6FF; color:#2563EB; border:1px solid #93C5FD; font-weight:700; font-size:0.75rem; display:inline-flex; align-items:center; gap:6px;"><span class="live-dot" style="color:#2563EB; width:7px; height:7px;"></span> Operador Despacho</span>',
      CONDUCTOR: '<span class="badge badge-plain" style="border-radius:var(--r-pill); padding:5px 12px; background:#F0FDF4; color:#16A34A; border:1px solid #86EFAC; font-weight:700; font-size:0.75rem; display:inline-flex; align-items:center; gap:6px;"><span class="live-dot" style="color:#16A34A; width:7px; height:7px;"></span> Conductor Flota</span>',
      CLIENTE: '<span class="badge badge-plain" style="border-radius:var(--r-pill); padding:5px 12px; background:#F8FAFC; color:#475569; border:1px solid #CBD5E1; font-weight:600; font-size:0.75rem;">Cliente Registrado</span>'
    };
    return badges[this.rol] || badges.CLIENTE;
  }

  toJSON() {
    return {
      uid: this.uid,
      nombreCompleto: this.nombreCompleto,
      correo: this.correo,
      telefono: this.telefono,
      documento: this.documento,
      rol: this.rol,
      fechaCreacion: this.fechaCreacion,
      estado: this.estado
    };
  }
}

/**
 * Subclase: Cliente (Persona normal o empresa solicitante de grúas)
 * Única clase permitida para creación desde el portal público de registro
 */
class Cliente extends Usuario {
  constructor(datos = {}) {
    super({ ...datos, rol: 'CLIENTE' });
    this.empresa = datos.empresa || '';
    this.direccion = datos.direccion || '';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      empresa: this.empresa,
      direccion: this.direccion
    };
  }
}

/**
 * Subclase: Conductor (Trabajador operativo de grúa en carretera)
 * Exclusivamente creado y gestionado por el Super Administrador
 */
class Conductor extends Usuario {
  constructor(datos = {}) {
    super({ ...datos, rol: 'CONDUCTOR' });
    this.categoriaLicencia = datos.categoriaLicencia || 'C2'; // C2 o C3 en Colombia
    this.gruaAsignada = datos.gruaAsignada || 'GRUA-01';
    this.vigenciaLicencia = datos.vigenciaLicencia || '';
    this.enTurno = datos.enTurno !== undefined ? datos.enTurno : true;
    this.serviciosCompletados = datos.serviciosCompletados || 0;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      categoriaLicencia: this.categoriaLicencia,
      gruaAsignada: this.gruaAsignada,
      vigenciaLicencia: this.vigenciaLicencia,
      enTurno: this.enTurno,
      serviciosCompletados: this.serviciosCompletados
    };
  }
}

/**
 * Subclase: Operador (Trabajador de logística, mesa de control y asignación)
 * Exclusivamente creado y gestionado por el Super Administrador
 */
class Operador extends Usuario {
  constructor(datos = {}) {
    super({ ...datos, rol: 'OPERADOR' });
    this.turno = datos.turno || 'Diurno'; // Diurno, Nocturno, Rotativo
    this.estacionControl = datos.estacionControl || 'Central Aguachica';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      turno: this.turno,
      estacionControl: this.estacionControl
    };
  }
}

/**
 * Subclase: Administrador (Super Usuario con control total de la plataforma)
 */
class Administrador extends Usuario {
  constructor(datos = {}) {
    super({ ...datos, rol: 'ADMINISTRADOR' });
    this.nivelAcceso = 'SUPER_ADMIN';
    this.permisoGestionTrabajadores = true;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      nivelAcceso: this.nivelAcceso,
      permisoGestionTrabajadores: this.permisoGestionTrabajadores
    };
  }
}

/**
 * Fábrica de Usuarios (UserFactory): Instancia la subclase correcta según el rol
 */
const UserFactory = {
  crear(datos) {
    if (!datos) return null;
    const rol = (datos.rol || 'CLIENTE').toUpperCase();
    switch (rol) {
      case 'ADMINISTRADOR':
        return new Administrador(datos);
      case 'OPERADOR':
        return new Operador(datos);
      case 'CONDUCTOR':
        return new Conductor(datos);
      case 'CLIENTE':
      default:
        return new Cliente(datos);
    }
  }
};

/**
 * REPOSITORIO DE USUARIOS (UserRepository)
 * Encapsula el acceso y manipulación de la colección "usuarios" en Cloud Firestore
 */
const UserRepository = {
  coleccion: 'usuarios',

  /**
   * Obtiene un usuario tipado por su UID desde Firestore
   * @param {string} uid
   * @returns {Promise<Usuario|null>}
   */
  async obtenerPorId(uid) {
    if (!uid) return null;
    try {
      const doc = await db.collection(this.coleccion).doc(uid).get();
      if (!doc.exists) return null;
      return UserFactory.crear({ uid: doc.id, ...doc.data() });
    } catch (err) {
      console.error('[UserRepository] Error al obtener usuario:', err);
      return null;
    }
  },

  /**
   * Obtiene todos los usuarios de la base de datos
   * @returns {Promise<Array<Usuario>>}
   */
  async obtenerTodos() {
    try {
      const snap = await db.collection(this.coleccion).get();
      return snap.docs.map(doc => UserFactory.crear({ uid: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('[UserRepository] Error al listar usuarios:', err);
      return [];
    }
  },

  /**
   * Obtiene exclusivamente los trabajadores del sistema (Conductor, Operador, Administrador)
   * @returns {Promise<Array<Usuario>>}
   */
  async obtenerTrabajadores() {
    try {
      const todos = await this.obtenerTodos();
      return todos.filter(u => u.esTrabajador());
    } catch (err) {
      console.error('[UserRepository] Error al obtener trabajadores:', err);
      return [];
    }
  },

  /**
   * Obtiene exclusivamente los clientes registrados
   * @returns {Promise<Array<Cliente>>}
   */
  async obtenerClientes() {
    try {
      const todos = await this.obtenerTodos();
      return todos.filter(u => u.rol === 'CLIENTE');
    } catch (err) {
      console.error('[UserRepository] Error al obtener clientes:', err);
      return [];
    }
  },

  /**
   * Registro Público de Cliente:
   * Por regla estricta de seguridad, este método NUNCA permite crear roles de trabajador.
   * @param {object} datos
   * @param {string} uid
   * @returns {Promise<Cliente>}
   */
  async crearCliente(datos, uid) {
    const cliente = new Cliente({
      ...datos,
      uid,
      rol: 'CLIENTE', // Forzado inmutablemente
      fechaCreacion: new Date().toISOString(),
      estado: true
    });
    await db.collection(this.coleccion).doc(uid).set(cliente.toJSON());
    return cliente;
  },

  /**
   * Creación Privilegiada de Trabajador:
   * Solo puede ser ejecutada por el Super Usuario (ADMINISTRADOR) autenticado.
   * @param {object} datos { nombreCompleto, correo, telefono, documento, rol, gruaAsignada, categoriaLicencia, turno }
   * @param {string} adminUid
   * @returns {Promise<Usuario>}
   */
  async crearTrabajador(datos, adminUid) {
    // 1. Verificación de Seguridad: Comprobar que quien invoca es Administrador en Firestore
    const admin = await this.obtenerPorId(adminUid);
    if (!admin || !admin.esAdministrador()) {
      throw new Error('ACCESO DENEGADO: Solo el Super Administrador puede crear espacios de trabajadores.');
    }

    const rol = (datos.rol || '').toUpperCase();
    if (rol !== 'CONDUCTOR' && rol !== 'OPERADOR' && rol !== 'ADMINISTRADOR') {
      throw new Error('Rol de trabajador inválido. Debe ser Conductor, Operador o Administrador.');
    }

    // 2. Generar UID de trabajador único
    const uid = 'worker_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    // 3. Instanciar la subclase correspondiente
    const trabajador = UserFactory.crear({
      ...datos,
      uid,
      fechaCreacion: new Date().toISOString(),
      estado: true
    });

    // 4. Persistir directamente en Cloud Firestore
    await db.collection(this.coleccion).doc(uid).set(trabajador.toJSON());

    // 5. Si es Conductor y tiene grúa asignada, actualizar la grúa en la colección correspondiente
    if (rol === 'CONDUCTOR' && datos.gruaAsignada) {
      try {
        await db.collection('gruas').doc(datos.gruaAsignada).set({
          conductorAsignado: trabajador.nombreCompleto,
          telefonoConductor: trabajador.telefono
        }, { merge: true });
      } catch (_) {}
    }

    return trabajador;
  },

  /**
   * Cambia el estado activo/inactivo de un trabajador
   * @param {string} uid
   * @param {boolean} nuevoEstado
   * @param {string} adminUid
   */
  async cambiarEstado(uid, nuevoEstado, adminUid) {
    const admin = await this.obtenerPorId(adminUid);
    if (!admin || !admin.esAdministrador()) {
      throw new Error('ACCESO DENEGADO: Acción exclusiva del Super Administrador.');
    }
    await db.collection(this.coleccion).doc(uid).set({ estado: nuevoEstado }, { merge: true });
    return true;
  },

  /**
   * Elimina un trabajador de la base de datos
   * @param {string} uid
   * @param {string} adminUid
   */
  async eliminarTrabajador(uid, adminUid) {
    const admin = await this.obtenerPorId(adminUid);
    if (!admin || !admin.esAdministrador()) {
      throw new Error('ACCESO DENEGADO: Acción exclusiva del Super Administrador.');
    }
    await db.collection(this.coleccion).doc(uid).delete();
    return true;
  },

  /**
   * Verifica si ya existe algún Super Administrador en Firestore.
   * Si no existe ninguno, permite inicializar el primer Administrador del sistema.
   * @param {object} datosAdmin
   * @param {string} uid
   */
  async inicializarPrimerAdminSiNoExiste(datosAdmin, uid) {
    const todos = await this.obtenerTodos();
    const existeAdmin = todos.some(u => u.rol === 'ADMINISTRADOR');
    if (existeAdmin) {
      throw new Error('Ya existe un Super Administrador en la base de datos.');
    }

    const superAdmin = new Administrador({
      ...datosAdmin,
      uid,
      fechaCreacion: new Date().toISOString(),
      estado: true
    });

    await db.collection(this.coleccion).doc(uid).set(superAdmin.toJSON());
    return superAdmin;
  }
};

// Exportar al ámbito global
window.Usuario = Usuario;
window.Cliente = Cliente;
window.Conductor = Conductor;
window.Operador = Operador;
window.Administrador = Administrador;
window.UserFactory = UserFactory;
window.UserRepository = UserRepository;

/* =====================================================================
   MODELO: AUTENTICACIÓN Y ROLES · GRÚAS LONDOÑO
   Delega en UserRepository para devolver instancias tipadas de subclases.
   ===================================================================== */
const AuthModel = {
  coleccion: 'usuarios',

  async obtenerPerfil(uid) {
    if (!uid) return null;
    if (window.UserRepository) {
      return await UserRepository.obtenerPorId(uid);
    }
    try {
      const doc = await db.collection(this.coleccion).doc(uid).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      console.error('Error al obtener perfil en AuthModel:', err);
      return null;
    }
  },

  async crearPerfil(datos, uid) {
    if (window.UserRepository) {
      // Registro público siempre crea Cliente
      return await UserRepository.crearCliente(datos, uid);
    }
    const perfil = {
      uid,
      nombreCompleto: datos.nombreCompleto || 'Usuario Nuevo',
      correo: datos.correo || datos.email,
      telefono: datos.telefono || '',
      rol: 'CLIENTE',
      documento: datos.documento || '',
      fechaCreacion: new Date().toISOString(),
      estado: true
    };
    await db.collection(this.coleccion).doc(uid).set(perfil);
    return perfil;
  }
};

window.AuthModel = AuthModel;


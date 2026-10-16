// Modelo de datos del usuario autenticado.
// Lee el perfil del usuario desde la colección "usuarios" en Firestore.
const AuthModel = {
  coleccion: 'usuarios',

  /**
   * Obtiene el perfil del usuario a partir de su UID de Firebase Auth.
   * @param {string} uid - UID del usuario autenticado.
   * @returns {Promise<object|null>} Datos del perfil o null si no existe.
   */
  async obtenerPerfil(uid) {
    if (!uid) return null;

    try {
      const doc = await db.collection(this.coleccion).doc(uid).get();
      if (!doc.exists) return null;

      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      return null;
    }
  },

  /**
   * Crea el documento de perfil para un usuario recién registrado.
   * @param {object} datos - Información básica del usuario.
   * @param {string} uid - UID generado por Firebase Auth.
   * @returns {Promise<void>}
   */
  async crearPerfil(datos, uid) {
    const perfil = {
      uid,
      nombreCompleto: datos.nombreCompleto,
      correo: datos.correo,
      telefono: datos.telefono,
      rol: 'CLIENTE',
      fechaCreacion: new Date().toISOString(),
      estado: true
    };

    await db.collection(this.coleccion).doc(uid).set(perfil);
  }
};

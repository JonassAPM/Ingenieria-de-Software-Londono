# 🚛 Grúas Londoño · Aplicativo Web de Auxilio Vial y Carga Pesada

Sistema corporativo integral para **Grúas Londoño**, construido bajo el patrón arquitectónico **MVC (Modelo-Vista-Controlador)** en **Vanilla JavaScript nativo**, **HTML5 semántico**, **CSS3 puro con tokens centralizados** y soporte dual para **Firebase (Auth & Cloud Firestore)** y almacenamiento reactivo local para despliegue sin dependencias en **GitHub Pages**.

---

## 1. 📋 Cumplimiento de Especificaciones y Reglas de Negocio

| Requisito / Regla | Estado | Implementación en el Código |
| :--- | :---: | :--- |
| **CUB-01 (Captura Íntegra)** | ✅ Cumple | Asistente de radicación en 4 pasos con validación estricta de tracción (4x2, 4x4), transmisión (Manual, Automática), llaves, avería mecánica y peso en toneladas. |
| **CUB-02 (Ambigüedad Tarifaria)** | ✅ Cumple | Algoritmo matemático normado oficial **SICETAC (MinTransporte Colombia)** en [cotizacion.model.js](file:///c:/Users/HP/OneDrive/Archivos%20U/Antigravity/Ingenieria%20de%20Software/js/models/cotizacion.model.js). Desglose en tiempo real. |
| **CUB-03 (Opacidad en Ruta)** | ✅ Cumple | Máquina de estados finitos (*Pendiente*, *Asignada*, *En Camino*, *En Sitio*, *Finalizada*, *Cancelada*) con bitácora auditable y consulta pública en tiempo real en [tracking.html](file:///c:/Users/HP/OneDrive/Archivos%20U/Antigravity/Ingenieria%20de%20Software/pages/tracking.html). |
| **RN-01 (Fórmula SICETAC)** | ✅ Cumple | $\text{Total} = \text{Base} + (\text{Km} \times \text{TarifaTopografía}) + \text{RecargoTopografía} + (\text{Toneladas} \times \$15.000) + (\text{ValorDeclarado} \times 0.2\%)$. |
| **RN-02 (Integridad de Datos)** | ✅ Cumple | Validación reactiva de campos obligatorios con retroalimentación visual inmediata y prevención de envíos incompletos. |
| **RN-03 (Medios de Pago)** | ✅ Cumple | Registro y selección entre Transferencia Bancaria (PSE / Comprobante) o Efectivo en sitio. |
| **RN-04 (Políticas y Tonelaje)** | ✅ Cumple | Cobro obligatorio de enganche en cancelaciones con grúa «En Camino». Bloqueo estricto si $\text{CapacidadGrúa} < \text{PesoVehículo}$. |
| **Extensión 3b (Sobredimensionadas)** | ✅ Cumple | Si peso $> 15\text{ ton}$ o falla = *VOLCADO / ABISMO*, se detiene el cobro automático y se activa enlace con mensaje precargado hacia WhatsApp asistido. |
| **Generación de Comprobante PDF** | ✅ Cumple | Generación automática en cliente con **jsPDF** al radicar la orden y botón de re-descarga en consulta de radicado. |
| **GitHub Pages Ready** | ✅ Cumple | `index.html` ubicado en la raíz del repositorio con rutas relativas limpias y motor dual fallback sin dependencias externas obligatorias. |

---

## 2. 🏛️ Arquitectura del Software (Patrón MVC Puro)

```text
.
├── index.html                           <-- Portal público, cotizador y wizard de radicación (GitHub Pages root)
├── tracking.html                        <-- Redirección / enlace a consulta pública de radicado
├── dashboard.html                       <-- Redirección / enlace a mesa de control de despacho
├── conductor.html                       <-- Redirección / enlace a terminal móvil de campo
├── firestore.rules                      <-- Reglas oficiales de seguridad para Cloud Firestore
│
├── pages/
│   ├── tracking.html                    <-- Consulta pública con barra de progreso de 4 pasos
│   ├── dashboard.html                   <-- Mesa de control cromática con KPIs y asignación de flota
│   └── conductor.html                   <-- Modo carretera de alto contraste con botones táctiles ≥ 60px
│
├── assets/
│   ├── css/
│   │   ├── variables.css                <-- Tokens globales únicos (colores, tipografía fluida, sombras, z-index)
│   │   ├── base.css                     <-- Reset, tipografía, botones con relieve táctil, modales y toasts
│   │   ├── components.css               <-- Navbar responsive, badges cromáticos, cotizador y stepper
│   │   └── dashboard.css                <-- Layout mesa de control, KPIs ribbon y modo nocturno conductor
│   └── img/
│       └── hero-grua.jpg                <-- Ilustración vectorial premium para el portal de inicio
│
└── js/
    ├── config/
    │   └── firebase-config.js           <-- Configuración dual: Firebase SDK + Mock reactivo LocalStorage
    │
    ├── utils/
    │   ├── formatters.js                <-- Formato oficial en Pesos Colombianos (COP), Km, Ton y fechas
    │   ├── notifications.js             <-- Toasts flotantes con barra de tiempo y accesibilidad
    │   └── pdf-generator.js             <-- Generador de comprobante oficial con jsPDF
    │
    ├── models/
    │   ├── auth.model.js                <-- Perfiles de usuario y roles en colección "usuarios"
    │   ├── cotizacion.model.js          <-- Lógica matemática SICETAC, topografía y Extensión 3b
    │   ├── radicacion.model.js          <-- Secuencia irrepetible GL-2026-XXXXX y esquema de solicitud
    │   └── despacho.model.js            <-- FSM (Máquina de estados finitos), catálogo y regla de tonelaje
    │
    ├── views/
    │   ├── auth.view.js                 <-- Modales de login/registro y chip de usuario en barra
    │   ├── cotizacion.view.js           <-- Factura reactiva en tiempo real y banner WhatsApp
    │   ├── radicacion.view.js           <-- Asistente paso a paso, validación visual y modal de éxito
    │   ├── despacho.view.js             <-- Tablero cromático, modales de asignación/bitácora y vista conductor
    │   └── tracking.view.js             <-- Barra de progreso de 4 pasos interactiva para clientes
    │
    ├── controllers/
    │   ├── auth.controller.js           <-- Login, registro, logout y protección de vistas por roles
    │   ├── cotizacion.controller.js     <-- Recalculo reactivo continuo ante cambios del formulario
    │   ├── radicacion.controller.js     <-- Orquestación de guardado, validación RN-02 y emisión de PDF
    │   ├── despacho.controller.js       <-- Listener onSnapshot en tiempo real y control de flota
    │   └── tracking.controller.js       <-- Búsqueda de órdenes y escucha satelital de cambios
    │
    └── app.js                           <-- Orquestador principal de inicialización modular
```

---

## 3. 👥 Cuentas Demo de Evaluación Rápida

Para facilitar la revisión docente o de pruebas, el modal de inicio de sesión incorpora botones de un clic para iniciar sesión con las siguientes identidades:

- **Coordinador de Despacho (Operador):**
  - Correo: `despacho@gruaslondono.com`
  - Clave: `123456`
  - Permisos: Mesa de control completa, asignación de unidades según tonelaje, cambio de estados y bitácora.
- **Conductor de Grúa (Grúa 03):**
  - Correo: `conductor@gruaslondono.com`
  - Clave: `123456`
  - Permisos: Vista de campo móvil de alto contraste con botones de un toque (`En Camino` $\rightarrow$ `En Sitio` $\rightarrow$ `Finalizar`).
- **Administradora General:**
  - Correo: `admin@gruaslondono.com`
  - Clave: `123456`
  - Permisos: Control maestro de tarifas, usuarios y auditoría.

---

## 4. 🚀 Despliegue en GitHub Pages

1. Sube este repositorio a tu cuenta de GitHub (`git push origin main`).
2. Ve a **Settings** $\rightarrow$ **Pages** en tu repositorio.
3. En **Build and deployment**, selecciona:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` / `root` (`/`)
4. Guarda los cambios. Tu sitio quedará publicado al instante en `https://<tu-usuario>.github.io/<tu-repositorio>/`.
5. La aplicación funciona de inmediato gracias al motor reactivo dual: no se romperá ni mostrará pantalla en blanco por falta de claves.

---

## 5. 🔑 Conexión a Firebase Producción (Opcional)

Si deseas conectar una base de datos real en la nube:
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilita **Authentication** (método Correo electrónico/Contraseña) y **Cloud Firestore** en modo de producción.
3. Copia tus credenciales en `js/config/firebase-config.js` reemplazando el objeto `firebaseConfig`.
4. Publica las reglas de seguridad copiando el contenido de `firestore.rules` en la pestaña **Reglas** de Firestore.

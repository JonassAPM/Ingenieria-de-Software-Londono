# PROMPT MAESTRO DE INGENIERÍA E IMPLEMENTACIÓN: APLICATIVO WEB GRÚAS LONDOÑO

> **DIRECTIVA PARA EL MODELO DE IA (DEEPSEEK V4):**
> Actúa como un Arquitecto de Software Senior y Desarrollador Full-Stack Lead. Tu misión es construir e implementar de forma exhaustiva, completa y ejecutable el sistema para **Grúas Londoño**.
>
> **REGLAS CRÍTICAS DE CONSTRUCCIÓN:**
> 1. **Completitud Absoluta:** No utilices marcadores de posición (`// TODO`, `/* implementar después */`, `... resto del código`). Proporciona cada archivo con su código fuente 100% íntegro, funcional y listo para desplegar.
> 2. **Dualidad Estética / Código:**
>    - **Apariencia Visual (Senior UI/UX):** Interfaz corporativa moderna, limpia, responsiva (mobile-first a desktop 1080p), paleta de colores profesional (azul marino `#003366`, azul slate, gris `#F8FAFC`, acentos cromáticos de estado), diseño consistente, microinteracciones, tipografía clara, feedback visual y validaciones dinámicas.
>    - **Código Fuente (Junior-Friendly / Académico):** Estructura Vanilla limpia, legible, secuencial, sin abstracciones innecesarias, sin metaprogramación compleja, sin frameworks pesados ni dependencias externas complejas. Código modular, intuitivo y pedagógicamente estructurado en JavaScript nativo.
> 3. **Línea Base Técnica Obligatoria:**
>    - **Arquitectura:** Microservicios desacoplados (Autenticación, Cotización SICETAC, Radicación y Despacho Operativo).
>    - **Patrón de Diseño:** MVC (Modelo-Vista-Controlador) adaptado a cada microservicio.
>    - **Persistencia:** Firebase (Cloud Firestore y Firebase Auth) con esquemas en formato JSON plano.
>    - **Frontend:** HTML5 semántico, CSS3 puro con variables CSS y Vanilla JavaScript (ES6+ modular).
>    - **Seguridad:** Firebase Authentication (tokens JWT / sesiones) y Reglas de Seguridad en Firestore.

---

## 1. CONTEXTO OPERATIVO Y REGLAS DE NEGOCIO

### 1.1 El Negocio
Grúas Londoño se dedica a la asistencia vial, rescate y traslado de vehículos y maquinaria pesada (grúas de plataforma, pluma/gancho, camas bajas para maquinaria amarilla).

### 1.2 Cuellos de Botella Técnicos a Resolver (AS-IS)
- **CUB-01 (Captura Ineficiente de Datos):** Errores en direcciones y datos del vehículo (falta de tracción 4x4, tipo de caja, llaves, vehículo volcado).
- **CUB-02 (Ambigüedad Tarifaria):** Precios discrecionales y disputas con clientes. Se exige cálculo algorítmico exacto basado en la regulación oficial colombiana (**SICETAC** - Ministerio de Transporte).
- **CUB-03 (Opacidad en Ruta):** Desconocimiento del estado del despacho. Se resuelve con una máquina de estados finitos (*Pendiente*, *Cotizada*, *Asignada*, *En Camino*, *En Sitio*, *Finalizada*, *Cancelada*) y consulta pública por radicado.

### 1.3 Reglas de Negocio Oficiales
- **RN-01 (Cálculo Normado SICETAC):** Tarifa base de arranque/enganche + (distancia calculada en km × costo por km según topografía: plano, ondulado, montañoso) + recargo por tonelaje de carga + porcentaje por valor comercial declarado.
- **RN-02 (Validación de Integridad):** Campos obligatorios: nombre, cédula/NIT, celular, dirección origen, dirección destino, tipo de vehículo, tipo de caja, tracción y peso estimado.
- **RN-03 (Medios de Pago):** Transferencia bancaria (registro de referencia o comprobante digital) o efectivo en sitio.
- **RN-04 (Políticas Operativas y Cancelación):** Si se cancela con la grúa «En Camino», se cobra cargo de enganche. No se puede asignar una grúa cuya capacidad de tonelaje sea inferior al peso del vehículo a remolcar.
- **Extensión 3b (Cargas Sobredimensionadas):** Si el peso excede 15 toneladas o la ruta es atípica, se detiene el cálculo automático y se envía a revisión manual con enlace a WhatsApp asistido.

---

## 2. ARQUITECTURA DE MICROSERVICIOS Y PATRÓN MVC

Cada microservicio mantiene su propia separación lógica MVC bajo Vanilla JS:
1. **Microservicio 1: Autenticación y Control de Roles (`auth-service`)**
   - *Modelo:* `auth.model.js` (Estructura de usuario, perfil, rol).
   - *Controlador:* `auth.controller.js` (Login, logout, escucha de tokens Firebase Auth).
   - *Vista:* Formularios modales y vistas en DOM (`auth.view.js`).
2. **Microservicio 2: Cotización Normada SICETAC (`cotizacion-service`)**
   - *Modelo:* `cotizacion.model.js` (Tablas maestras SICETAC, topografía, recargos).
   - *Controlador:* `cotizacion.controller.js` (Algoritmo matemático de liquidación y validación de límites).
   - *Vista:* Componente interactivo de cotización y cotizador dinámico (`cotizacion.view.js`).
3. **Microservicio 3: Radicación y Comprobantes (`radicacion-service`)**
   - *Modelo:* `radicacion.model.js` (Estructura de la solicitud en JSON, radicado único `GL-2026-XXXXX`).
   - *Controlador:* `radicacion.controller.js` (Validación de entradas, inserción en Firestore, generación de PDF con jsPDF).
   - *Vista:* Formulario web para clientes y módulo de consulta pública (`radicacion.view.js`).
4. **Microservicio 4: Despacho y Control de Flota (`despacho-service`)**
   - *Modelo:* `despacho.model.js` (Máquina de estados finitos, catálogo de grúas, bitácora de incidencias).
   - *Controlador:* `despacho.controller.js` (Transiciones válidas, asignación de unidades según tonelaje, listeners en tiempo real `onSnapshot`).
   - *Vista:* Tablero operativo cromático (Rojo = Pendiente, Amarillo = En Ruta, Azul = En Sitio, Verde = Finalizada) y vista móvil para conductores (`despacho.view.js`).

---

## 3. ESQUEMA DE BASE DE DATOS (FIREBASE CLOUD FIRESTORE)

Estructura de documentos JSON planos en Firestore:

### Colección: `usuarios`
```json
{
  "uid": "FIREBASE_AUTH_UID",
  "nombreCompleto": "Carlos Mendoza",
  "correo": "despacho@gruaslondono.com",
  "telefono": "3101234567",
  "rol": "OPERADOR",
  "fechaCreacion": "2026-10-14T14:30:00Z",
  "estado": true
}
```

### Colección: `solicitudes`
```json
{
  "id": "AUTO_GENERATED_DOC_ID",
  "radicado": "GL-2026-00104",
  "fecha": "2026-10-14T14:32:00Z",
  "cliente": {
    "nombre": "Transportes Andinos S.A.S.",
    "documento": "900123456-1",
    "telefono": "3209876543",
    "correo": "contacto@andinos.com"
  },
  "servicio": {
    "tipoServicio": "GRUA_PLATAFORMA",
    "origen": "Calle 15 # 8-20, Aguachica, Cesar",
    "destino": "Km 42 Vía Central, San Alberto",
    "puntoReferencia": "Frente a Estación de Servicio Terpel",
    "distanciaKm": 42.5
  },
  "vehiculo": {
    "placa": "XYZ-789",
    "tipo": "Camioneta",
    "traccion": "4x4",
    "transmision": "Automatica",
    "pesoToneladas": 2.8,
    "valorComercialDeclarado": 95000000,
    "fallaMecanica": "Dirección trabada, sin llaves"
  },
  "cotizacion": {
    "tarifaBase": 120000,
    "costoDistancia": 170000,
    "recargoTopografia": 30000,
    "recargoCarga": 45000,
    "valorTotal": 365000,
    "requiereRevisionManual": false
  },
  "estado": "ASIGNADA",
  "despacho": {
    "idGrua": "GRUA-03",
    "placaGrua": "WXY-123",
    "nombreConductor": "Jorge Gómez",
    "telefonoConductor": "3115556677",
    "fechaAsignacion": "2026-10-14T14:40:00Z"
  },
  "bitacora": [
    {
      "fecha": "2026-10-14T14:32:00Z",
      "autor": "Sistema",
      "nota": "Solicitud radicada automáticamente con cotización normada."
    },
    {
      "fecha": "2026-10-14T14:40:00Z",
      "autor": "Coord_Despacho",
      "nota": "Asignada grúa de plataforma 03 por tracción 4x4 y dirección bloqueada."
    }
  ]
}
```

### Colección: `gruas`
```json
{
  "id": "GRUA-03",
  "placa": "WXY-123",
  "modelo": "Chevrolet FTR 2022",
  "tipo": "Plataforma Hidráulica con Winche",
  "capacidadToneladas": 5.0,
  "conductorAsignado": "Jorge Gómez",
  "disponible": false
}
```

### Colección: `parametros_sicetac`
```json
{
  "id": "TARIFAS_2026",
  "baseEngancheUrbano": 100000,
  "baseEngancheCarretera": 150000,
  "valorKmPlano": 3500,
  "valorKmOndulado": 4200,
  "valorKmMontana": 5000,
  "factorPesoTonelada": 15000,
  "porcentajeSeguroMercancia": 0.002
}
```

---

## 4. ESTRUCTURA COMPLETA DE ARCHIVOS DEL PROYECTO

```text
gruas-londono/
│
├── index.html                           <-- Portal público y radicación de clientes
├── tracking.html                        <-- Consulta pública de radicado
├── dashboard.html                       <-- Tablero operativo para Despacho y Administración
├── conductor.html                       <-- Interfaz móvil simplificada de campo
│
├── css/
│   ├── variables.css                    <-- Paleta de colores, tipografías, sombras y bordes
│   ├── base.css                         <-- Reset, estilos globales, botones, cards y modales
│   ├── components.css                   <-- Navbar, badges de estado cromáticos, formularios
│   └── dashboard.css                    <-- Estilos de la bandeja de tarjetas, KPIs y responsive
│
├── js/
│   ├── firebase-config.js               <-- Inicialización de Firebase SDK (Auth y Firestore)
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   ├── auth.model.js
│   │   │   ├── auth.view.js
│   │   │   └── auth.controller.js
│   │   │
│   │   ├── cotizacion/
│   │   │   ├── cotizacion.model.js
│   │   │   ├── cotizacion.view.js
│   │   │   └── cotizacion.controller.js
│   │   │
│   │   ├── radicacion/
│   │   │   ├── radicacion.model.js
│   │   │   ├── radicacion.view.js
│   │   │   └── radicacion.controller.js
│   │   │
│   │   └── despacho/
│   │       ├── despacho.model.js
│   │       ├── despacho.view.js
│   │       └── despacho.controller.js
│   │
│   ├── utils/
│   │   ├── pdf-generator.js             <-- Generador de comprobante con jsPDF
│   │   ├── notifications.js             <-- Toasts de alerta visual UI
│   │   └── formatters.js                <-- Moneda colombiana (COP) y fechas
│   │
│   └── app.js                           <-- Orquestador principal de inicialización
│
├── firestore.rules                      <-- Reglas de seguridad de Firestore
└── README.md                            <-- Manual de instalación, configuración y ejecución
```

---

## 5. ESPECIFICACIÓN DETALLADA DE ARCHIVOS Y CÓDIGO FUENTE

### 5.1 `css/variables.css`
Define las variables CSS corporativas:
- Primario: `#003366`
- Primario oscuro: `#002244`
- Secundario: `#0F4C81`
- Acento / Botones: `#2563EB`
- Fondos: `#F8FAFC` y `#FFFFFF`
- Bordes: `#E2E8F0` y `#CBD5E1`
- Textos: `#0F172A` y `#475569`
- Estados cromáticos:
  - Pendiente: Fondo `#FEE2E2`, Texto `#B91C1C`, Borde `#EF4444`
  - En Ruta: Fondo `#FEF3C7`, Texto `#B45309`, Borde `#F59E0B`
  - En Sitio: Fondo `#DBEAFE`, Texto `#1D4ED8`, Borde `#3B82F6`
  - Finalizada: Fondo `#DCFCE7`, Texto `#15803D`, Borde `#10B981`
  - Cancelada: Fondo `#F1F5F9`, Texto `#475569`, Borde `#94A3B8`

### 5.2 `css/base.css` y `css/components.css`
- Reseteo completo, tipografía nativa del sistema (Segoe UI, Roboto, sans-serif).
- Clases para botones (`.btn`, `.btn-primary`, `.btn-success`, `.btn-danger`, `.btn-block`, con estados hover y active).
- Formularios con etiquetas claras, inputs con bordes suaves, focus ring azul corporativo, validaciones visuales con mensajes de ayuda.
- Contenedores (`.card`, `.modal`, `.badge`, `.toast-container`).
- Adaptabilidad multidispositivo (pantallas móviles desde 360px hasta 1920px).

### 5.3 `js/firebase-config.js`
- Inicialización estandarizada de Firebase versión compat (v9 / v10 vía CDN compat para Vanilla JS puro).
- Objeto de configuración de Firebase (`firebaseConfig`).
- Exportación / disponibilidad global de las variables `auth` y `db` (`firebase.auth()` y `firebase.firestore()`).

### 5.4 Microservicio de Autenticación (`js/services/auth/`)
- `auth.model.js`: Funciones de lectura del perfil del usuario logueado en la colección `usuarios`.
- `auth.view.js`: Funciones para alternar modales de login/registro, desplegar mensajes de error amigables sin exponer excepciones internas y actualizar barra de navegación según sesión activa.
- `auth.controller.js`:
  - `login(email, password)` usando `auth.signInWithEmailAndPassword()`.
  - `register(datos)` con `auth.createUserWithEmailAndPassword()` y guardado en colección `usuarios`.
  - `logout()` con redirección segura.
  - `checkAuth(allowedRoles)` para proteger rutas (si un conductor intenta entrar a `dashboard.html`, redireccionar a `conductor.html` o al inicio).

### 5.5 Microservicio de Cotización SICETAC (`js/services/cotizacion/`)
- `cotizacion.model.js`:
  - Parámetros base en caché de tarifas oficiales.
  - Función de cálculo:
    $$\text{Total} = \text{Base} + (\text{Km} \times \text{TarifaTopografía}) + (\text{Toneladas} \times \text{FactorPeso}) + (\text{ValorDeclarado} \times 0.2\%)$$
- `cotizacion.view.js`: Desglose visual en tiempo real de los ítems de cotización.
- `cotizacion.controller.js`:
  - Detección de carga sobredimensionada (si `pesoToneladas > 15` o `fallaMecanica == "VOLCADO_ABISMO"`): activa la **Extensión 3b**, mostrando aviso para contactar con soporte técnico por WhatsApp con mensaje precargado.

### 5.6 Microservicio de Radicación (`js/services/radicacion/`)
- `radicacion.model.js`: Generación secuencial de código alfanumérico irrepetible con estructura `GL-2026-XXXXX`.
- `radicacion.view.js`: Validación reactiva del formulario de radicación (campos en rojo si faltan datos).
- `radicacion.controller.js`:
  - Sanitización de entradas contra XSS e inyecciones básicas.
  - Inserción transaccional de la solicitud en la colección `solicitudes`.
  - Invocación automática del generador de comprobante digital PDF.
  - Consulta pública: búsqueda por coincidencia exacta de `radicado` y `documento` del cliente, desplegando únicamente los datos no sensibles y el estado actual de la grúa.

### 5.7 Microservicio de Despacho y Operaciones (`js/services/despacho/`)
- `despacho.model.js`:
  - Definición estricta de la Máquina de Estados Finitos:
    - *PENDIENTE* $\rightarrow$ *ASIGNADA* o *CANCELADA*.
    - *ASIGNADA* $\rightarrow$ *EN_CAMINO* o *CANCELADA*.
    - *EN_CAMINO* $\rightarrow$ *EN_SITIO* o *CANCELADA* (aplica cobro enganche).
    - *EN_SITIO* $\rightarrow$ *FINALIZADA*.
  - Validación de tonelaje: $\text{capacidadGrúa} \ge \text{pesoVehículo}$.
- `despacho.view.js`:
  - Renderizado dinámico de tarjetas cromáticas con botones de acción directa según el estado actual.
  - Filtros en vivo por radicado, placa, estado y fecha sin recargar página.
- `despacho.controller.js`:
  - Listener en tiempo real (`onSnapshot`) sobre la colección `solicitudes` para actualizar el tablero de despacho y los contadores KPIs al instante.
  - Métodos para asignar grúa, cambiar estados y agregar notas a la bitácora de la orden.

### 5.8 `js/utils/pdf-generator.js`
- Uso de la librería `jsPDF` (vía CDN) para armar en el cliente el comprobante oficial en formato PDF:
  - Encabezado con nombre corporativo: **GRÚAS LONDOÑO - AUXILIO VIAL Y CARGA PESADA**.
  - Número de Radicado destacado en caja superior.
  - Tabla de datos del cliente, vehículo siniestrado, ruta (origen/destino) y desglose de liquidación SICETAC.
  - Cláusula de validez normativa y políticas de servicio.
  - Descarga automática inmediata tras confirmar la orden.

### 5.9 Interfaces HTML Completas
- `index.html`: Portafolio de servicios, cotizador y formulario de radicación paso a paso con resumen en vivo, modal de inicio de sesión / registro.
- `tracking.html`: Consulta pública con campo de radicado y documento, mostrando barra de progreso visual de 4 pasos (*Solicitud Radicada* $\rightarrow$ *Grúa Asignada* $\rightarrow$ *En Camino* $\rightarrow$ *En Sitio / Finalizado*).
- `dashboard.html`: Mesa de control para coordinadores y administradores: cinta de métricas KPIs, barra de búsqueda reactiva, bandeja de tarjetas por colores, modal de asignación de grúa y panel de bitácora.
- `conductor.html`: Vista móvil para conductores con botones grandes (mínimo 60px de alto), modo de alto contraste para visibilidad en carretera, datos mecánicos de la carga y botones de actualización de estado de un solo toque.

### 5.10 `firestore.rules`
Reglas completas de Firestore para proteger las colecciones:
- Clientes solo leen sus propias órdenes o consultan con radicado y documento.
- Conductores solo leen y actualizan órdenes donde su `idGrua` esté asignado.
- Operadores y Administradores tienen permisos completos de lectura y escritura.

---

## 6. INSTRUCCIONES DE EJECUCIÓN PARA DEEPSEEK V4

1. Genera **todos y cada uno de los archivos** indicados en la estructura, con su código completo y sin omitir líneas.
2. Asegúrate de que las rutas relativas de scripts y hojas de estilo funcionen de manera nativa al abrir los archivos directamente o mediante un servidor local (ej. Live Server de VS Code o Firebase Hosting).
3. Incluye en los archivos HTML los enlaces CDN estables a Firebase (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`) y `jspdf.umd.min.js`.
4. El resultado debe ser un software entregable para su evaluación y puesta en producción.

/* =====================================================================
   ORQUESTADOR PRINCIPAL · GRÚAS LONDOÑO
   Punto de entrada general. Detecta componentes en el DOM e inicializa
   los controladores y vistas correspondientes según la página actual.
   ===================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  console.log('%c[Grúas Londoño]%c Sistema Inicializado bajo Arquitectura MVC', 'color:#003366; font-weight:bold; font-size:13px;', 'color:#2563EB;');

  // 1. Inicializar menú móvil en Navbar
  const navToggle = document.querySelector('.nav-toggle');
  const navbar = document.querySelector('.navbar');
  if (navToggle && navbar) {
    navToggle.addEventListener('click', () => {
      navbar.classList.toggle('nav-open');
      const expanded = navbar.classList.contains('nav-open');
      navToggle.setAttribute('aria-expanded', expanded);
    });
  }

  // 2. Inicializar Módulo de Autenticación
  if (typeof AuthController !== 'undefined' && AuthController.init) {
    AuthController.init();

    // Conectar botón de login/logout del navbar
    const btnAuth = document.getElementById('btn-open-auth');
    if (btnAuth) {
      btnAuth.addEventListener('click', (e) => {
        if (AuthController.usuarioActual) {
          e.preventDefault();
          AuthController.logout();
        }
        // Si no hay sesión activa, el enlace <a href="login.html"> navega limpiamente a la página independiente
      });
    }
  }

  // 3. Inicializar Módulo de Cotización SICETAC
  if (typeof CotizacionController !== 'undefined' && CotizacionController.init) {
    CotizacionController.init();
  }

  // 4. Inicializar Módulo de Radicación
  if (typeof RadicacionController !== 'undefined' && RadicacionController.init) {
    RadicacionController.init();
  }

  // 5. Inicializar Módulo de Despacho y Operaciones
  if (typeof DespachoController !== 'undefined' && DespachoController.init) {
    DespachoController.init();
  }

  // 5b. Inicializar Módulo de Trabajadores (Espacio de Colaboradores - Super Admin)
  if (typeof TrabajadoresController !== 'undefined' && TrabajadoresController.init) {
    TrabajadoresController.init();
  }

  // 6. Inicializar Módulo de Seguimiento Público
  if (typeof TrackingController !== 'undefined' && TrackingController.init) {
    TrackingController.init();
  }

  // 7. Botón de ayuda WhatsApp flotante si aplica
  const btnWaHelp = document.getElementById('btn-whatsapp-flotante');
  if (btnWaHelp) {
    btnWaHelp.addEventListener('click', () => {
      const url = CotizacionModel?.generarEnlaceWhatsApp?.() || 'https://wa.me/573101234567';
      window.open(url, '_blank');
    });
  }

  // 8. Botón X para cerrar banner de demostración
  const btnCloseBanner = document.getElementById('btn-close-demo-banner');
  const demoBanner = document.getElementById('demo-banner');
  if (btnCloseBanner && demoBanner) {
    if (sessionStorage.getItem('demo_banner_dismissed') === 'true') {
      demoBanner.style.display = 'none';
    }
    btnCloseBanner.addEventListener('click', () => {
      demoBanner.style.opacity = '0';
      demoBanner.style.transition = 'opacity 0.2s ease, max-height 0.3s ease';
      setTimeout(() => {
        demoBanner.style.display = 'none';
        sessionStorage.setItem('demo_banner_dismissed', 'true');
      }, 200);
    });
  }

  // 9. ScrollSpy y Línea de Ubicación Activa Dinámica en Navbar
  const navLinks = document.querySelectorAll('.nav-links a');
  function setActiveLink(targetHref) {
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === targetHref || (targetHref === '#inicio' && (href === '#inicio' || href === 'index.html'))) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else if (href.startsWith('#')) {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    });
  }

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      link.addEventListener('click', () => {
        setActiveLink(href);
      });
    }
  });

  // Observador de intersección para mover la línea según el scroll del usuario
  const observedSections = ['inicio', 'servicios', 'cotizador', 'radicacion'];
  const sectionElements = observedSections
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (sectionElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      // Tomamos la sección que tenga mayor intersección visible
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length > 0) {
        // Ordenar por visibilidad
        visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const topSection = visible[0].target;
        setActiveLink('#' + topSection.id);
      }
    }, {
      rootMargin: '-20% 0px -50% 0px',
      threshold: [0.1, 0.3, 0.6]
    });

    sectionElements.forEach(sec => observer.observe(sec));
  }

  // 10. Desplazamiento cinemático suave y gradual para cualquier enlace o botón interno
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href*="#"]');
    if (!anchor) return;

    const rawHref = anchor.getAttribute('href');
    if (!rawHref || rawHref === '#' || rawHref === '#!') return;

    // Extraer el hash objetivo
    let targetId = '';
    if (rawHref.startsWith('#')) {
      targetId = rawHref.substring(1);
    } else if (rawHref.includes('#')) {
      const parts = rawHref.split('#');
      const pagePart = parts[0];
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      if (!pagePart || pagePart === currentPage || (pagePart === 'index.html' && (currentPage === '' || currentPage === 'index.html'))) {
        targetId = parts[1];
      }
    }

    if (targetId) {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        e.preventDefault();
        e.stopPropagation();

        const navHeight = 74;
        const targetRect = targetElement.getBoundingClientRect();
        const startPosition = window.pageYOffset || document.documentElement.scrollTop;
        const targetPosition = Math.max(0, startPosition + targetRect.top - navHeight);
        const distance = targetPosition - startPosition;
        const duration = Math.min(950, Math.max(550, Math.abs(distance) * 0.45));
        let startTime = null;

        function easeInOutQuart(t, b, c, d) {
          t /= d / 2;
          if (t < 1) return c / 2 * t * t * t * t + b;
          t -= 2;
          return -c / 2 * (t * t * t * t - 2) + b;
        }

        function scrollStep(currentTime) {
          if (startTime === null) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const run = easeInOutQuart(timeElapsed, startPosition, distance, duration);
          window.scrollTo(0, run);
          if (timeElapsed < duration) {
            requestAnimationFrame(scrollStep);
          } else {
            window.scrollTo(0, targetPosition);
            if (history.pushState) {
              history.pushState(null, null, '#' + targetId);
            }
            if (typeof setActiveLink === 'function') setActiveLink('#' + targetId);
            targetElement.classList.add('is-visible');
            targetElement.querySelectorAll('.fade-in-item').forEach(el => el.classList.add('is-visible'));
          }
        }

        requestAnimationFrame(scrollStep);
      }
    }
  });

  // 11. Motor de Revelado Suave y Progresivo (Desvanecimiento Opacidad 0 a 100)
  const fadeSelectors = [
    // Hero
    '.hero-content > .hero-pill',
    '.hero-content > h1',
    '.hero-content > .hero-lead',
    '.hero-content > .hero-actions',
    '.hero-content > .hero-stats',
    '.hero-visual',
    // Encabezados
    '.section-header',
    // Servicios y Pasos
    '.service-card',
    '.step-card',
    // Cotizador y Radicación
    '#cotizador-form',
    '#cotizador-summary',
    '.stepper',
    '#radicacion-form',
    // Tracking
    '.tracking-hero .hero-pill',
    '.tracking-hero h1',
    '.tracking-hero p',
    '.tracking-search-card',
    '.tracking-feature-card',
    // Dashboard & Conductor
    '.kpi-ribbon',
    '.despacho-table-card',
    '.conductor-hero .hero-pill',
    '.conductor-hero h1',
    '.conductor-card'
  ];

  const fadeItems = document.querySelectorAll(fadeSelectors.join(', '));
  fadeItems.forEach(el => el.classList.add('fade-in-item'));

  const sectionContainers = document.querySelectorAll(
    'section, .tracking-hero, .tracking-container, .conductor-section, .dashboard-main'
  );

  if (sectionContainers.length > 0 && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const items = entry.target.querySelectorAll('.fade-in-item');
        if (entry.isIntersecting) {
          // Revelar suavemente en cascada de opacidad 0 a 100
          entry.target.classList.add('is-visible');
          items.forEach(item => item.classList.add('is-visible'));
        } else {
          // Solo al salir toda la sección de la pantalla se desarma para permitir re-animar al volver
          entry.target.classList.remove('is-visible');
          items.forEach(item => item.classList.remove('is-visible'));
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px'
    });

    sectionContainers.forEach(sec => sectionObserver.observe(sec));
  } else {
    sectionContainers.forEach(sec => sec.classList.add('is-visible'));
    fadeItems.forEach(item => item.classList.add('is-visible'));
  }

  // Sincronizar al cargar la página si viene con hash
  if (window.location.hash) {
    setActiveLink(window.location.hash);
    try {
      const hashTarget = document.querySelector(window.location.hash);
      if (hashTarget) {
        hashTarget.classList.add('is-visible');
        hashTarget.querySelectorAll('.fade-in-item').forEach(el => el.classList.add('is-visible'));
      }
    } catch (_) {}
  }

  // 12. Motor de Transición Suave entre Páginas (Page Exit Dissolve Engine)
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    // Ignorar si abre en otra pestaña, descargas o teclas modificadoras
    if (link.target === '_blank' || link.hasAttribute('download') || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    try {
      const targetUrl = new URL(link.href, window.location.href);

      // Si no es el mismo origen (dominio externo), permitir navegación directa
      if (targetUrl.origin !== window.location.origin) return;

      // Si apunta exactamente a la misma URL actual (o solo cambia hash interno), permitir comportamiento nativo
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
        return;
      }

      // Enlace de cambio de página interno: ejecutar desvanecimiento suave de salida
      e.preventDefault();

      // Si el enlace clicado está en la barra de navegación, actualizar de inmediato el indicador activo
      const parentNavLinks = link.closest('.nav-links');
      if (parentNavLinks) {
        parentNavLinks.querySelectorAll('a').forEach(a => {
          a.classList.remove('active');
          a.removeAttribute('aria-current');
        });
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }

      // Si estamos en una página de autenticación con tarjeta suspendida,
      // elevar la tarjeta con la grúa inmediatamente hacia arriba
      const hangingBoard = document.querySelector('.auth-hanging-board');
      if (hangingBoard) {
        hangingBoard.classList.remove('crane-drop-entrance');
        hangingBoard.classList.add('crane-lift-exit');
      }

      // Identificar con precisión el contexto de navegación para transiciones coordinadas
      const isAuthTarget = targetUrl.pathname.includes('login') || targetUrl.pathname.includes('registro');
      const isCurrentAuth = window.location.pathname.includes('login') || window.location.pathname.includes('registro');

      if (isCurrentAuth && isAuthTarget) {
        // Caso 1: Cambio entre pantallas de autenticación (Login <-> Registro)
        // El logo y 'Volver al Portal' permanecen quietos; solo el botón alternativo se desvanece con desplazamiento suave
        document.body.classList.add('switching-auth-mode');
        try { sessionStorage.setItem('gl_nav_auth_switch', 'true'); } catch (_) {}
      } else if (!isCurrentAuth && isAuthTarget) {
        // Caso 2: Desde portal público hacia autenticación (Inicio/Seguimiento -> Login/Registro)
        // El logo, enlaces y botones se desplazan y desvanecen coordinadamente
        document.body.classList.add('leaving-portal-to-auth');
        try { sessionStorage.removeItem('gl_nav_auth_switch'); } catch (_) {}
      } else if (isCurrentAuth && !isAuthTarget) {
        // Caso 3: Desde autenticación de regreso hacia el portal (Login/Registro -> Inicio/Seguimiento)
        // El logo y botones de autenticación se desplazan y desvanecen hacia la posición del portal
        document.body.classList.add('leaving-auth-to-portal');
        try {
          sessionStorage.setItem('gl_nav_returning_to_portal', 'true');
          sessionStorage.removeItem('gl_nav_auth_switch');
        } catch (_) {}
      } else {
        try {
          sessionStorage.removeItem('gl_nav_auth_switch');
          sessionStorage.removeItem('gl_nav_returning_to_portal');
        } catch (_) {}
      }

      document.body.classList.add('page-is-leaving');

      setTimeout(() => {
        window.location.href = targetUrl.href;
      }, 210);
    } catch (_) {}
  });

  // Restaurar estado si el usuario navega con "Atrás" o "Adelante" del navegador (bfcache)
  window.addEventListener('pageshow', () => {
    document.body.classList.remove(
      'page-is-leaving',
      'leaving-to-auth',
      'switching-auth-mode',
      'leaving-portal-to-auth',
      'leaving-auth-to-portal'
    );
  });
});




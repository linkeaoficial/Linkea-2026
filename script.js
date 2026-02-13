// --- Funcionalidad Menú Hamburguesa (Móvil) ---
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const bodyElement = document.body; // Referencia al body 💃

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    
    // 🧠 Si el menú se abre, bloqueamos el scroll. Si se cierra, lo devolvemos.
    if (navLinks.classList.contains('active')) {
        bodyElement.classList.add('no-scroll');
    } else {
        bodyElement.classList.remove('no-scroll');
    }
});

// Cerrar menú y desbloquear scroll al hacer clic en un enlace 🔗
document.querySelectorAll('#navLinks a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        bodyElement.classList.remove('no-scroll'); // ¡Importante devolver el scroll! 🔄
    });
});


// --- Funcionalidad Modo Oscuro/Claro ---
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

// Revisar preferencia guardada
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        localStorage.setItem('theme', 'light');
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
});

// --- Scroll Suave para enlaces internos (polyfill simple) ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // Compensar por el header fijo
            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    });
});

// --- Lógica del Selector Personalizado ---
const trigger = document.getElementById('selectTrigger');
const optionsContainer = document.getElementById('customOptions');
const container = document.querySelector('.custom-select-container');
const hiddenInput = document.getElementById('hiddenServiceInput');
const optionsList = document.querySelectorAll('.custom-option');

// Abrir/Cerrar menú
trigger.addEventListener('click', () => {
    container.classList.toggle('active');
});

// Seleccionar una opción
optionsList.forEach(option => {
    option.addEventListener('click', () => {
        // Actualizar texto visual
        trigger.querySelector('span').innerText = option.innerText;
        // Actualizar valor oculto para el formulario
        hiddenInput.value = option.dataset.value;
        // Cambiar clase 'selected'
        optionsList.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        // Cerrar menú
        container.classList.remove('active');
    });
});

// Cerrar si se hace clic fuera
window.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
        container.classList.remove('active');
    }
});

// --- Lógica de Scroll Inteligente (Aparece al detenerse) ---
const scrollTopBtn = document.getElementById('scrollToTop');
let isScrolling;

window.addEventListener('scroll', () => {
    // 1. Siempre que estemos escroleando, escondemos el botón
    // Se esconde moviéndose hacia abajo gracias al CSS previo
    scrollTopBtn.classList.remove('visible');

    // 2. Limpiamos el temporizador en cada movimiento
    window.clearTimeout(isScrolling);

    // 3. Establecemos un temporizador que se dispara al dejar de escrolear
    isScrolling = setTimeout(() => {
        // Solo aparece si hemos bajado más de 400px
        if (window.scrollY > 400) {
            scrollTopBtn.classList.add('visible');
        }
    }, 150); // 150ms es el tiempo ideal de "pausa" para el ojo humano
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- Lógica de envío a WhatsApp ---
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');
        const serviceInput = document.getElementById('hiddenServiceInput');

        // Limpiar errores previos
        [nameInput, emailInput, messageInput].forEach(input => input.classList.remove('error'));

        let hasError = false;

        // Validar cada campo
        if (!nameInput.value.trim()) { nameInput.classList.add('error'); hasError = true; }
        if (!emailInput.value.trim() || !emailInput.value.includes('@')) { emailInput.classList.add('error'); hasError = true; }
        if (!messageInput.value.trim()) { messageInput.classList.add('error'); hasError = true; }

        if (hasError) return; // Si hay error, aquí se detiene y no abre WhatsApp

        // Si todo está bien, abrir WhatsApp
        const telefono = "584162779279";
        const textoWhatsApp = `Hola Linkea, mi nombre es *${nameInput.value}* (%0A📧 ${emailInput.value})%0A%0AEstoy interesado en el servicio: *${serviceInput.value}*%0A%0A*Detalles del proyecto:*%0A${messageInput.value}`;
        window.open(`https://wa.me/${telefono}?text=${textoWhatsApp}`, '_blank');
    });

    // Quitar el rojo al empezar a escribir
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => input.classList.remove('error'));
    });
}

// --- Lógica Maestra: Preloader -> Hero -> Cookies ---
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const heroSection = document.querySelector('.hero');
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');

    // 1. Terminar Preloader (800ms)
    setTimeout(() => {
        if (preloader) preloader.classList.add('hide-loader');
        
        // 2. Iniciar Animación Hero (200ms después del preloader)
        setTimeout(() => {
            if (heroSection) heroSection.classList.add('hero-active');
        }, 200);

        // 3. Mostrar Cookies (1.5 segundos después de que la web sea visible)
        // Solo si NO ha aceptado antes
        const cookiesAccepted = localStorage.getItem('linkea-cookies-accepted');
        if (!cookiesAccepted && cookieBanner) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 1500); 
        }

    }, 800); 

    // Evento del botón (se define fuera de los timeouts para que siempre esté listo)
    if (acceptBtn) {
        acceptBtn.onclick = () => {
            localStorage.setItem('linkea-cookies-accepted', 'true');
            cookieBanner.classList.remove('show');
        };
    }
});

// --- LÓGICA LEGAL DESPLEGABLE (FOOTER) ---
document.addEventListener('DOMContentLoaded', () => {
    const legalTriggers = document.querySelectorAll('.legal-trigger');
    const legalPanel = document.getElementById('legal-expandable');
    const legalTitle = document.getElementById('legal-title');
    const legalBody = document.getElementById('legal-body');
    const closeBtn = document.getElementById('close-legal-btn');

    // Textos definidos y corregidos según tu proyecto
    const legalContent = {
        terms: `
            <h4>1. Modelo de Confianza (Pago Contra Entrega)</h4>
            <p>En Linkea no cobramos adelantos. Diseñamos tu proyecto en nuestros servidores y, una vez que lo apruebas al 100%, realizas el pago único para la entrega final. Sin riesgos para ti.</p>
            
            <h4>2. Tecnología WhatsApp "Click-to-Chat"</h4>
            <p>Nuestras tiendas no usan la API de pago de WhatsApp Business, lo que te ahorra costos mensuales. Los pedidos se generan vía enlace y llegan como un mensaje detallado directo a tu chat personal o de empresa.</p>
            
            <h4>3. Tiempos de Entrega</h4>
            <p>El tiempo estimado para el desarrollo y entrega final del proyecto es de <strong>15 días hábiles</strong>, contados a partir de la recepción de todo el material informativo (logos, productos y precios).</p>

            <h4>4. Soporte y Garantía</h4>
            <p>Ofrecemos 30 días de soporte técnico gratuito tras la entrega final para corregir cualquier detalle técnico. No incluimos cambios de diseño estructural después de la aprobación del proyecto de prueba.</p>
        `,
        privacy: `
            <h4>1. Tus Datos</h4>
            <p>Recopilamos únicamente tu <strong>Nombre y Correo Electrónico</strong> para procesar tu solicitud de presupuesto. solo se activa cuando tú decides iniciarlo a través de nuestros enlaces directos a WhatsApp.</p>
            
            <h4>2. Navegación Privada</h4>
            <p>Valoramos tu privacidad. No rastreamos tu comportamiento ni usamos herramientas invasivas. Solo almacenamos localmente tus preferencias de diseño (como el Modo Oscuro) para que tu experiencia sea siempre personalizada.</p>

            <h4>3. Tus Derechos</h4>
            <p>En cualquier momento puedes solicitar la eliminación definitiva de tus datos de nuestra base de contactos enviando un correo a nuestro equipo de soporte.</p>
        `,
        support: `
            <h4>Centro de Ayuda y Soporte</h4>
            <p>¿Tienes dudas técnicas o necesitas asistencia con tu proyecto? Estamos disponibles para ayudarte.</p>
            
            <h4>Canales de Atención</h4>
            <p>Nuestro equipo responde de lunes a domingo (7:00 AM - 11:00 PM). Puedes contactarnos directamente por:</p>
            <ul>
                <li style="margin-bottom: 1.5rem;">
                    <a href="https://wa.me/584162779279" target="_blank" style="display: flex; flex-direction: column; gap: 4px; color: inherit; text-decoration: none;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.066 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            <strong style="color: #3C77FC; font-size: 1.05rem;">WhatsApp:</strong>
                        </div>
                        <span style="opacity: 0.8; padding-left: 36px; font-size: 0.9rem; line-height: 1.4;">Respuesta inmediata para emergencias técnicas.</span>
                    </a>
                </li>
                <li><strong style="color: #3C77FC;">Correo:</strong> linkeaoficial2025@gmail.com</li>
            </ul>

            <h4>Garantía de Servicio</h4>
            <p>Recuerda que todos nuestros proyectos incluyen 30 días de soporte gratuito tras la entrega final para asegurar que tu sistema funcione perfectamente.</p>
        `
    };

    // Al hacer clic en los enlaces
    legalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const type = trigger.getAttribute('data-type');

            // 1. Inyectar contenido
            if (type === 'terms') {
                legalTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 10px; color: var(--primary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg> Términos del Servicio`;
                legalBody.innerHTML = legalContent.terms;
            } else if (type === 'privacy') {
                legalTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 10px; color: var(--primary);"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg> Política de Privacidad`;
                legalBody.innerHTML = legalContent.privacy;
            } else if (type === 'support') {
                legalTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 10px; color: var(--primary);"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><path d="M9 10h.01"></path><path d="M15 10h.01"></path><path d="M12 10h.01"></path></svg> Soporte Técnico`;
                legalBody.innerHTML = legalContent.support;
            }

            // 2. Abrir panel
            legalPanel.classList.add('active');
            
            // 3. Desplazar la vista (Corregido para que el título no se oculte)
            setTimeout(() => {
                if (window.innerWidth <= 768) {
                    // Calculamos la posición real del panel en la página
                    const panelTop = legalPanel.getBoundingClientRect().top + window.pageYOffset;
                    
                    // Restamos 100px para que el título quede a la vista (80px del header + 20px de margen)
                    const offsetPosition = panelTop - 100;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                } else {
                    // En PC lo dejamos como estaba
                    legalPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 250); // Aumentamos a 250ms para esperar que el panel se despliegue un poco
        });
    });

    // Botón de cerrar
    closeBtn.addEventListener('click', () => {
        legalPanel.classList.remove('active');
    });
});

/* --- SISTEMA DE RASTREO LINKEA (Analytics Pro) --- */
const TRACKING_URL = 'https://mi-api-analitica.elitemarketing-a94.workers.dev/api/track';
let startTime = Date.now(); // 🟢 1. Iniciamos el reloj apenas carga el script

// 🟢 2. Añadimos el parámetro 'duracion' con valor por defecto 0
function enviarEvento(tipo, ruta, dispositivo, duracion = 0) {
    // Lógica de Usuarios Únicos...
    const hoy = new Date().toISOString().split('T')[0];
    const ultimaVisita = localStorage.getItem('linkea_last_v');
    const esUnico = (tipo === 'pageview' && ultimaVisita !== hoy);

    fetch(TRACKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            type: tipo, 
            path: ruta, 
            device: dispositivo,
            isUnique: esUnico,
            duration: duracion // 🟢 3. Enviamos los segundos al Worker
        }),
        keepalive: true
    }).then(res => {
        if (res.ok && esUnico) localStorage.setItem('linkea_last_v', hoy);
    }).catch(err => console.log('Error tracking:', err));
}

function getDeviceType() {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
}

// 1. Rastrear Visita (Pageview)
window.addEventListener('load', () => {
    enviarEvento('pageview', window.location.pathname, getDeviceType());
});

// 2. Rastrear Formulario Enviado (Lead)
const formTracker = document.querySelector('.contact-form');
if (formTracker) {
    formTracker.addEventListener('submit', () => {
        setTimeout(() => {
            if (!formTracker.querySelector('.error')) {
                enviarEvento('click', '/formulario-enviado', getDeviceType());
            }
        }, 500);
    });
}

// 3. Rastrear Clics (Chatbot Corregido, WhatsApp, Redes)
document.body.addEventListener('click', (e) => {
    const target = e.target.closest('a, button'); 
    if (!target) return;
    const device = getDeviceType();

    // 🟢 4. CÓDIGO NUEVO AL FINAL DEL ARCHIVO: Detectar cuando se va el usuario
window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Calculamos cuántos segundos pasaron desde que entró
        const totalSegundos = Math.floor((Date.now() - startTime) / 1000);
        
        // Enviamos el evento especial de cierre
        enviarEvento('session_end', window.location.pathname, getDeviceType(), totalSegundos);
    }
});

    // Chatbot: Solo rastrea cuando se ABRE (no cuando se cierra)
    if (target.id === 'botToggler' || target.closest('#botToggler')) {
        if (!document.body.classList.contains('show-chatbot')) {
            enviarEvento('click', '/accion-chatbot', device);
        }
    }

    // Otros enlaces (WhatsApp, Instagram, Facebook)
    if (target.href && target.href.includes('wa.me')) {
        enviarEvento('click', '/contacto-whatsapp', device);
    }
    if (target.href && target.href.includes('instagram.com')) enviarEvento('click', '/red-instagram', device);
    if (target.href && target.href.includes('facebook.com')) enviarEvento('click', '/red-facebook', device);

    // Portafolio
    if (target.closest('.portfolio-item')) {
        const titulo = target.closest('.portfolio-item').querySelector('h3')?.innerText || 'proyecto';
        const slug = '/ver-' + titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
        enviarEvento('click', slug, device);
    }
});
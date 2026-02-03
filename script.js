// --- Funcionalidad Menú Hamburguesa (Móvil) ---
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll('#navLinks a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
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

contactForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Capturar los datos de los campos
    const nombre = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const servicio = document.getElementById('hiddenServiceInput').value;
    const mensaje = document.getElementById('message').value;

    // Tu número de teléfono (ya lo tienes en el HTML)
    const telefono = "584162779279";

    // Construir el mensaje formateado
    const textoWhatsApp = `Hola Linkea, mi nombre es *${nombre}* (%0A📧 ${email})%0A%0AEstoy interesado en el servicio: *${servicio}*%0A%0A*Detalles del proyecto:*%0A${mensaje}`;

    // Crear la URL de WhatsApp
    const url = `https://wa.me/${telefono}?text=${textoWhatsApp}`;

    // Abrir en una nueva ventana/pestaña
    window.open(url, '_blank');
});
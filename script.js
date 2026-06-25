/* ====================================
   LOOT LAB STUDIOS - JAVASCRIPT
   Interactive Elements & Animations
   ==================================== */

// ========== GAME-STYLE PIXEL PARTICLES ==========

class GamePixel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3 - 1;
        this.size = Math.random() * 6 + 4;
        this.life = 1;
        this.maxLife = Math.random() * 3 + 2;
        this.age = 0;
        
        // Random color from brand palette
        const colors = ['#00d9ff', '#1dd1a1', '#a855f7'];
        this.color = colors[Math.floor(Math.random() * colors.length)];

        this.element = document.createElement('div');
        this.element.style.cssText = `
            position: fixed;
            width: ${this.size}px;
            height: ${this.size}px;
            background: ${this.color};
            pointer-events: none;
            z-index: 1;
            box-shadow: 0 0 ${this.size}px ${this.color};
        `;
        document.body.appendChild(this.element);
    }

    update(mouseX, mouseY) {
        // Gravity
        this.vy += 0.1;
        
        // Mouse interaction - pixels are attracted to cursor
        const distX = mouseX - this.x;
        const distY = mouseY - this.y;
        const dist = Math.sqrt(distX * distX + distY * distY);
        const maxDist = 150;
        
        if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 0.5;
            this.vx += (distX / dist) * force;
            this.vy += (distY / dist) * force;
        }
        
        this.x += this.vx;
        this.y += this.vy;
        this.age += 1 / 60; // 60fps
        this.life = 1 - (this.age / this.maxLife);

        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        this.element.style.opacity = Math.max(0, this.life);
    }

    isDead() {
        return this.life <= 0;
    }

    remove() {
        this.element.remove();
    }
}

const gamePixels = [];

function createGamePixels(x, y, count = 12) {
    for (let i = 0; i < count; i++) {
        gamePixels.push(new GamePixel(x, y));
    }
}

function updateGamePixels(mouseX, mouseY) {
    for (let i = gamePixels.length - 1; i >= 0; i--) {
        gamePixels[i].update(mouseX, mouseY);
        if (gamePixels[i].isDead()) {
            gamePixels[i].remove();
            gamePixels.splice(i, 1);
        }
    }
}

// ========== MOUSE TRACKING STATE ==========

let mouseX = 0;
let mouseY = 0;
let mouseVelocityX = 0;
let mouseVelocityY = 0;
let lastMouseX = 0;
let lastMouseY = 0;

// ========== CURSOR GLOW EFFECT ==========
// Removed - using comet trail only for cleaner effect

// ========== PARTICLE SYSTEM ==========

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8 - 3;
        this.life = 1;
        this.decay = Math.random() * 0.01 + 0.005;

        this.element = document.createElement('div');
        this.element.style.cssText = `
            position: fixed;
            width: ${this.size}px;
            height: ${this.size}px;
            background: radial-gradient(circle, #00d9ff 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999;
            box-shadow: 0 0 ${this.size * 2}px rgba(0, 217, 255, 0.8);
        `;
        document.body.appendChild(this.element);
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += 0.1; // Gravity
        this.life -= this.decay;

        this.element.style.left = this.x + 'px';
        this.element.style.top = this.y + 'px';
        this.element.style.opacity = this.life;
    }

    isDead() {
        return this.life <= 0;
    }

    remove() {
        this.element.remove();
    }
}

const particles = [];

function createParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].isDead()) {
            particles[i].remove();
            particles.splice(i, 1);
        }
    }
}

// ========== ANIMATED MOUSE GLOW LINE ==========

const glowCanvas = document.createElement('canvas');
glowCanvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 400;
`;
document.body.appendChild(glowCanvas);

const glowCtx = glowCanvas.getContext('2d');
glowCanvas.width = window.innerWidth;
glowCanvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    glowCanvas.width = window.innerWidth;
    glowCanvas.height = window.innerHeight;
});

const cometTrail = [];
const maxCometLength = 15;

function drawCometTrail() {
    glowCtx.clearRect(0, 0, glowCanvas.width, glowCanvas.height);

    // Draw comet tail with fading effect
    for (let i = 0; i < cometTrail.length; i++) {
        const point = cometTrail[i];
        const progress = i / cometTrail.length;
        
        // Create gradient for tail fade
        const size = 8 * (1 - progress);
        const opacity = 0.6 * (1 - progress);
        
        // Draw comet segment
        const gradient = glowCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size);
        gradient.addColorStop(0, `rgba(0, 217, 255, ${opacity * 0.8})`);
        gradient.addColorStop(0.7, `rgba(0, 217, 255, ${opacity * 0.4})`);
        gradient.addColorStop(1, `rgba(0, 217, 255, 0)`);
        
        glowCtx.fillStyle = gradient;
        glowCtx.beginPath();
        glowCtx.arc(point.x, point.y, size, 0, Math.PI * 2);
        glowCtx.fill();
    }

    // Draw bright comet head - REMOVED for cleaner effect
}

// ========== INTERACTIVE LOGO ==========

const interactiveLogo = document.getElementById('interactiveLogo');
const logoContainer = document.querySelector('.hero-logo-container');

if (interactiveLogo && logoContainer) {
    let logoRotationX = 0;
    let logoRotationY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    // 3D rotation on mouse move
    document.addEventListener('mousemove', (e) => {
        if (window.scrollY < window.innerHeight) { // Only when on hero section
            const rect = logoContainer.getBoundingClientRect();
            const containerCenterX = rect.left + rect.width / 2;
            const containerCenterY = rect.top + rect.height / 2;

            const distX = (e.clientX - containerCenterX) / rect.width;
            const distY = (e.clientY - containerCenterY) / rect.height;

            targetRotationY = distX * 25;
            targetRotationX = -distY * 25;
        }
    });

    // Smooth animation loop for logo rotation
    function animateLogo() {
        logoRotationX += (targetRotationX - logoRotationX) * 0.1;
        logoRotationY += (targetRotationY - logoRotationY) * 0.1;

        interactiveLogo.style.transform = `
            perspective(1000px)
            rotateX(${logoRotationX}deg)
            rotateY(${logoRotationY}deg)
            scale(1)
        `;

        requestAnimationFrame(animateLogo);
    }

    animateLogo();

    // Click for particle burst
    interactiveLogo.addEventListener('click', (e) => {
        const rect = interactiveLogo.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createParticles(centerX, centerY, 30);
        
        // Create explosive game pixel burst!
        for (let i = 0; i < 50; i++) {
            createGamePixels(centerX, centerY, 1);
        }

        // Bonus: Brief scale animation
        interactiveLogo.style.transform += ' scale(0.95)';
        setTimeout(() => {
            interactiveLogo.style.transform = interactiveLogo.style.transform.replace(' scale(0.95)', '');
        }, 100);
    });

    // Hover effect
    interactiveLogo.addEventListener('mouseenter', () => {
        interactiveLogo.style.filter = 'drop-shadow(0 30px 80px rgba(0, 217, 255, 0.4))';
    });

    interactiveLogo.addEventListener('mouseleave', () => {
        interactiveLogo.style.filter = 'drop-shadow(0 20px 60px rgba(0, 217, 255, 0.2))';
        targetRotationX = 0;
        targetRotationY = 0;
    });
}

// ========== PARALLAX & SCROLL EFFECTS ==========

// Parallax effect on mouse move in hero section
let lastCometTime = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseVelocityX = mouseX - lastMouseX;
    mouseVelocityY = mouseY - lastMouseY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    // Add point to comet trail with throttling
    const now = Date.now();
    if (now - lastCometTime > 16) { // ~60fps
        cometTrail.push({ x: mouseX, y: mouseY });
        if (cometTrail.length > maxCometLength) {
            cometTrail.shift();
        }
        lastCometTime = now;
        
        // Occasionally spawn game pixels near cursor
        if (Math.random() < 0.3) {
            createGamePixels(mouseX, mouseY, 2);
        }
    }

    const parallaxElements = document.querySelectorAll('[data-parallax]');
    const xPercent = (e.clientX / window.innerWidth) * 100;
    const yPercent = (e.clientY / window.innerHeight) * 100;

    parallaxElements.forEach((element) => {
        const parallaxValue = element.getAttribute('data-parallax');
        const xMove = (xPercent - 50) * parallaxValue * 0.5;
        const yMove = (yPercent - 50) * parallaxValue * 0.3;

        element.style.transform = `translate(${xMove}px, ${yMove}px)`;
    });
});

// Scroll parallax effect for floating elements
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const elements = document.querySelectorAll('[data-parallax]');

    elements.forEach((element) => {
        const parallaxValue = parseFloat(element.getAttribute('data-parallax')) || 0;
        const yOffset = scrollY * parallaxValue;
        element.style.transform = `translateY(${yOffset}px)`;
    });
});

// ========== SMOOTH SCROLL TO SECTIONS ==========

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');

        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const offsetTop = targetElement.offsetTop;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth',
            });
        }
    });
});

// ========== SCROLL INDICATOR ANIMATION ==========

const scrollIndicator = document.querySelector('.scroll-indicator');

if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const gamesSection = document.getElementById('games');
        if (gamesSection) {
            const offsetTop = gamesSection.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth',
            });
        }
    });
}

// ========== INTERSECTION OBSERVER FOR ANIMATIONS ==========

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.animation = getAnimationForElement(entry.target);
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all animatable elements
document.querySelectorAll('.game-card, .philosophy-card, .about-card, .news-card, .press-button').forEach((element) => {
    observer.observe(element);
});

function getAnimationForElement(element) {
    const classList = element.className;

    if (classList.includes('game-card') || classList.includes('philosophy-card') || classList.includes('news-card')) {
        return 'fade-in-up 0.8s ease-out forwards';
    }

    if (classList.includes('about-card')) {
        return 'fade-in 0.8s ease-out forwards';
    }

    if (classList.includes('press-button')) {
        return 'fade-in-up 0.8s ease-out forwards';
    }

    return 'fade-in 0.6s ease-out forwards';
}

// ========== INTERACTIVE CARD EFFECTS WITH MAGNETIC PULL ==========

// Add hover effects to cards with magnetic interaction
document.querySelectorAll('.game-card, .philosophy-card, .about-card, .news-card, .press-button').forEach((card) => {
    card.addEventListener('mouseenter', () => {
        card.style.boxShadow = '0 20px 40px rgba(0, 217, 255, 0.2)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.boxShadow = 'none';
        card.style.transform = 'translateY(0px) rotateX(0deg) rotateY(0deg)';
    });

    // Magnetic effect - cards tilt toward mouse
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;

        const angleX = (e.clientY - cardCenterY) * 0.05;
        const angleY = -(e.clientX - cardCenterX) * 0.05;
        const distanceX = (e.clientX - cardCenterX) * 0.1;
        const distanceY = (e.clientY - cardCenterY) * 0.1;

        card.style.transform = `translateY(-8px) rotateX(${angleX}deg) rotateY(${angleY}deg) translateZ(30px)`;
        card.style.perspective = '1000px';
    });

    // Create particles on click
    card.addEventListener('click', (e) => {
        createParticles(e.clientX, e.clientY, 12);
    });
});

// ========== BUTTON INTERACTIONS WITH PARTICLES ==========

document.querySelectorAll('.btn-primary, .btn-secondary').forEach((button) => {
    button.addEventListener('click', function (e) {
        // For the "Discover Our Games" button, create pixel break effect
        if (this.getAttribute('data-section') === 'games') {
            const rect = this.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Create massive pixel burst from button
            for (let i = 0; i < 80; i++) {
                createGamePixels(centerX, centerY, 1);
            }
            
            // Brief visual feedback - fade out and back in
            const originalOpacity = this.style.opacity;
            this.style.opacity = '0.3';
            setTimeout(() => {
                this.style.opacity = originalOpacity;
            }, 100);
        } else {
            // For other buttons, just create regular particles
            createParticles(e.clientX, e.clientY, 15);
        }
    });

    // Add hover particle effect
    button.addEventListener('mouseenter', function (e) {
        const rect = this.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createParticles(centerX, centerY, 3);
    });
});

// ========== CONTACT FORM HANDLING ==========

const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const message = contactForm.querySelector('textarea').value;

        // Validate
        if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Simulate form submission
        const originalButtonText = contactForm.querySelector('.btn').textContent;
        const submitButton = contactForm.querySelector('.btn');
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;

        // Simulate delay
        setTimeout(() => {
            showNotification('Message sent! We\'ll get back to you soon.', 'success');
            contactForm.reset();
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }, 1000);
    });
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(29, 209, 161, 0.2)' : 'rgba(168, 85, 247, 0.2)'};
        border: 1px solid ${type === 'success' ? '#1dd1a1' : '#a855f7'};
        color: ${type === 'success' ? '#1dd1a1' : '#a855f7'};
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: 600;
        z-index: 10000;
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out, slideOut 0.3s ease-out 2.7s forwards;
    `;

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// Add animation styles for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
        display: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ========== BUTTON NAVIGATION ==========

// Handle CTA button navigation
document.querySelectorAll('[data-section]').forEach((button) => {
    button.addEventListener('click', () => {
        const sectionId = button.getAttribute('data-section');
        const section = document.getElementById(sectionId);

        if (section) {
            const offsetTop = section.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth',
            });
        }
    });
});

// ========== PERFORMANCE: REQUEST ANIMATION FRAME FOR SMOOTH SCROLL ==========

let ticking = false;
let lastScrollPos = 0;

window.addEventListener('scroll', () => {
    lastScrollPos = window.scrollY;

    if (!ticking) {
        window.requestAnimationFrame(() => {
            // Update any scroll-dependent animations here
            ticking = false;
        });
        ticking = true;
    }
});

// ========== PREFERS REDUCED MOTION ==========

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--transition-smooth', 'none');
    document.documentElement.style.setProperty('--transition-faster', 'none');
    document.documentElement.style.setProperty('--transition-slow', 'none');
}

// ========== PAGE LOAD OPTIMIZATION ==========

// Lazy load images if needed
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => imageObserver.observe(img));
}

// ========== ANIMATION LOOP FOR PARTICLES AND GLOW ==========

function animationLoop() {
    updateParticles();
    updateGamePixels(mouseX, mouseY);
    requestAnimationFrame(animationLoop);
}

animationLoop();

// ========== INTERACTIVE ELEMENTS ON PAGE ==========

// Add hover particle effect to all interactive elements
document.querySelectorAll('a, button').forEach((element) => {
    element.addEventListener('mouseenter', function (e) {
        const rect = this.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        createParticles(centerX, centerY, 2);
    });
});

// ========== MOUSE TRACKING FOR ENHANCED INTERACTIVITY ==========

// ========== INITIALIZE ON DOM READY ==========

document.addEventListener('DOMContentLoaded', () => {
    // Add animation delay to staggered elements
    const staggeredElements = document.querySelectorAll('.news-card, .game-card, .philosophy-card');

    staggeredElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.1}s`;
    });

    // Initialize any interactions that need DOM content
    console.log('Loot Lab Studios website loaded successfully');
});

// ========== PERFORMANCE MONITORING ==========

// Log performance metrics
window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log('Page load time: ' + pageLoadTime + 'ms');
    }
});

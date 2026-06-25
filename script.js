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

// ========== SCROLL & PARALLAX STATE ==========

let scrollY = 0;
let targetScrollY = 0;

function updateScroll() {
    scrollY = window.scrollY;
}

window.addEventListener('scroll', updateScroll, { passive: true });

// Parallax elements with different speed multipliers
const parallaxElements = [
    { selector: '.hero-gradient-1', speed: -0.5 },      // Moves opposite to scroll
    { selector: '.hero-gradient-2', speed: -0.3 },      // Slower movement
    { selector: '.featured-game-image', speed: -0.2 },  // Moves backward to prevent overlap
    { selector: '.game-card', speed: 0.2, stagger: true }, // Staggered effect per card
];

function updateParallax() {
    parallaxElements.forEach(item => {
        const elements = document.querySelectorAll(item.selector);
        
        elements.forEach((el, index) => {
            let offset = scrollY * item.speed;
            
            // Stagger effect for multiple elements
            if (item.stagger) {
                offset += index * 5;
            }
            
            el.style.transform = `translateY(${offset}px)`;
        });
    });
}

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

// ========== INTERACTIVE LOGO + ORBIT CANVAS ==========

const interactiveLogo = document.getElementById('interactiveLogo');
const logoContainer = document.querySelector('.hero-logo-container');
const orbitCanvas = document.getElementById('logoOrbit');

// ---- Canvas orbit system ----
if (orbitCanvas && logoContainer) {
    const ctx2 = orbitCanvas.getContext('2d');
    const SIZE = 700;
    orbitCanvas.width = SIZE;
    orbitCanvas.height = SIZE;
    const CX = SIZE / 2;
    const CY = SIZE / 2;

    let canvasMouseX = CX;
    let canvasMouseY = CY;

    // Track mouse relative to canvas
    logoContainer.addEventListener('mousemove', (e) => {
        const rect = orbitCanvas.getBoundingClientRect();
        const scaleX = SIZE / rect.width;
        const scaleY = SIZE / rect.height;
        canvasMouseX = (e.clientX - rect.left) * scaleX;
        canvasMouseY = (e.clientY - rect.top) * scaleY;
    });
    logoContainer.addEventListener('mouseleave', () => {
        canvasMouseX = CX;
        canvasMouseY = CY;
    });

    // Node class
    class OrbitNode {
        constructor(orbitRadius, angle, speed, size, color, shape) {
            this.orbitRadius = orbitRadius;
            this.baseRadius = orbitRadius;
            this.angle = angle;
            this.speed = speed;
            this.size = size;
            this.color = color;
            this.shape = shape; // 'diamond' | 'square' | 'tri'
            this.x = CX;
            this.y = CY;
            this.pulseOffset = Math.random() * Math.PI * 2;
            this.repelX = 0;
            this.repelY = 0;
        }

        update(t) {
            this.angle += this.speed;

            // Base position
            const bx = CX + Math.cos(this.angle) * this.orbitRadius;
            const by = CY + Math.sin(this.angle) * this.orbitRadius;

            // Mouse repulsion
            const dx = bx - canvasMouseX;
            const dy = by - canvasMouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const repelRadius = 90;

            if (dist < repelRadius) {
                const force = (repelRadius - dist) / repelRadius;
                this.repelX += (dx / dist) * force * 4;
                this.repelY += (dy / dist) * force * 4;
            }

            this.repelX *= 0.85;
            this.repelY *= 0.85;

            this.x = bx + this.repelX;
            this.y = by + this.repelY;
        }

        draw(ctx, t) {
            const pulse = 0.65 + Math.sin(t * 0.04 + this.pulseOffset) * 0.35;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle * 2);
            ctx.globalAlpha = 0.5 + pulse * 0.5;
            ctx.shadowBlur = 12 * pulse;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;

            if (this.shape === 'diamond') {
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size * 0.6, 0);
                ctx.lineTo(0, this.size);
                ctx.lineTo(-this.size * 0.6, 0);
                ctx.closePath();
                ctx.fill();
            } else if (this.shape === 'square') {
                const h = this.size * 0.7;
                ctx.fillRect(-h, -h, h * 2, h * 2);
            } else if (this.shape === 'tri') {
                ctx.beginPath();
                ctx.moveTo(0, -this.size);
                ctx.lineTo(this.size * 0.87, this.size * 0.5);
                ctx.lineTo(-this.size * 0.87, this.size * 0.5);
                ctx.closePath();
                ctx.fill();
            } else if (this.shape === 'cross') {
                const s = this.size * 0.35;
                const l = this.size;
                ctx.fillRect(-s, -l, s * 2, l * 2);
                ctx.fillRect(-l, -s, l * 2, s * 2);
            }
            ctx.restore();
        }
    }

    // Build nodes across 3 orbits
    const nodes = [];
    const cyan = '#00d9ff';
    const purple = '#a855f7';
    const teal = '#00b4cc';

    // Inner ring — 4 large diamonds, fast, cyan
    const innerCount = 4;
    for (let i = 0; i < innerCount; i++) {
        nodes.push(new OrbitNode(290, (i / innerCount) * Math.PI * 2, 0.018, 7, cyan, 'diamond'));
    }

    // Middle ring — 6 squares, medium speed, mix
    const midCount = 6;
    for (let i = 0; i < midCount; i++) {
        const color = i % 2 === 0 ? cyan : purple;
        nodes.push(new OrbitNode(320, (i / midCount) * Math.PI * 2 + 0.3, 0.011, 5, color, 'square'));
    }

    // Outer ring — 8 small triangles, slow, purple
    const outerCount = 8;
    for (let i = 0; i < outerCount; i++) {
        const color = i % 3 === 0 ? cyan : purple;
        nodes.push(new OrbitNode(345, (i / outerCount) * Math.PI * 2 + 0.6, 0.007, 4, color, 'tri'));
    }

    // Accent ring — 3 crosses, very slow, teal
    const accentCount = 3;
    for (let i = 0; i < accentCount; i++) {
        nodes.push(new OrbitNode(305, (i / accentCount) * Math.PI * 2 + 1.0, -0.009, 6, teal, 'cross'));
    }

    let frameT = 0;

    function drawConnections(ctx) {
        const allNodes = nodes;
        for (let i = 0; i < allNodes.length; i++) {
            for (let j = i + 1; j < allNodes.length; j++) {
                const dx = allNodes[i].x - allNodes[j].x;
                const dy = allNodes[i].y - allNodes[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 80) {
                    const alpha = (1 - d / 80) * 0.35;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(allNodes[i].x, allNodes[j].y);
                    ctx.moveTo(allNodes[i].x, allNodes[i].y);
                    ctx.lineTo(allNodes[j].x, allNodes[j].y);
                    ctx.strokeStyle = `rgba(0, 217, 255, ${alpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }

    function drawOrbitTrails(ctx) {
        // Faint orbit circles
        const radii = [290, 320, 345];
        radii.forEach((r, i) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(CX, CY, r, 0, Math.PI * 2);
            ctx.strokeStyle = i === 0 ? 'rgba(0,217,255,0.06)' : 'rgba(168,85,247,0.05)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 12]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        });
    }

    function renderOrbit() {
        frameT++;
        ctx2.clearRect(0, 0, SIZE, SIZE);

        drawOrbitTrails(ctx2);

        nodes.forEach(n => n.update(frameT));
        drawConnections(ctx2);
        nodes.forEach(n => n.draw(ctx2, frameT));

        requestAnimationFrame(renderOrbit);
    }

    renderOrbit();
}

// ---- 3D tilt on mouse move ----
if (interactiveLogo && logoContainer) {
    let logoRotationX = 0;
    let logoRotationY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    document.addEventListener('mousemove', (e) => {
        if (window.scrollY < window.innerHeight) {
            const rect = logoContainer.getBoundingClientRect();
            const distX = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
            const distY = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
            targetRotationY = distX * 25;
            targetRotationX = -distY * 25;
        }
    });

    function animateLogo() {
        logoRotationX += (targetRotationX - logoRotationX) * 0.1;
        logoRotationY += (targetRotationY - logoRotationY) * 0.1;
        interactiveLogo.style.transform = `perspective(1000px) rotateX(${logoRotationX}deg) rotateY(${logoRotationY}deg)`;
        requestAnimationFrame(animateLogo);
    }
    animateLogo();

    interactiveLogo.addEventListener('click', (e) => {
        // Click handler for interactivity (3D tilt effect handles the response)
    });

    interactiveLogo.addEventListener('mouseenter', () => {
        interactiveLogo.style.filter = 'drop-shadow(0 0 60px rgba(0, 217, 255, 0.55))';
    });
    interactiveLogo.addEventListener('mouseleave', () => {
        interactiveLogo.style.filter = 'drop-shadow(0 0 40px rgba(0, 217, 255, 0.35))';
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
    updateParallax();
    requestAnimationFrame(animationLoop);
}

animationLoop();

// ========== TYPEWRITER EFFECT ==========

const typewriterText = document.querySelector('.typewriter-text');
const fullText = 'Where imagination becomes playable';

if (typewriterText) {
    let charIndex = 0;
    
    function typeNextChar() {
        if (charIndex < fullText.length) {
            typewriterText.textContent += fullText[charIndex];
            charIndex++;
            setTimeout(typeNextChar, 55);
        }
    }

    // Start typewriter after logo animation (1.2s delay)
    setTimeout(typeNextChar, 1200);
}

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

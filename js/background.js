import { state } from './state.js';
import { HEART_PATH } from './constants.js';
import { clamp, hexToRgb } from './utils.js';

const particlesState = {
    canvas: null,
    ctx: null,
    list: [],
    animId: null,
    W: 0,
    H: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 1.5)
};

let currentBgMode = null;
let lastSpriteSig = '';

let gradientRaf = null;
let gradientLastTs = 0;
let gradientPhase = 0;

function spriteSignature() {
    const s = state.settings;
    return JSON.stringify({
        shape: s.particlesShape,
        blur: s.particlesBlur,
        colors: s.particlesColors,
        count: s.particlesCount
    });
}

function particlesResize() {
    if (!particlesState.canvas) return;

    const prevW = particlesState.W;
    const prevH = particlesState.H;

    particlesState.W = window.innerWidth;
    particlesState.H = window.innerHeight;
    particlesState.canvas.width = Math.floor(particlesState.W * particlesState.dpr);
    particlesState.canvas.height = Math.floor(particlesState.H * particlesState.dpr);
    particlesState.canvas.style.width = particlesState.W + 'px';
    particlesState.canvas.style.height = particlesState.H + 'px';
    if (particlesState.ctx) {
        particlesState.ctx.setTransform(particlesState.dpr, 0, 0, particlesState.dpr, 0, 0);
    }

    if (prevW > 0 && prevH > 0 && particlesState.list.length) {
        const sx = particlesState.W / prevW;
        const sy = particlesState.H / prevH;
        for (const p of particlesState.list) {
            p.x *= sx;
            p.y *= sy;
        }
    }
}

function randomShape() {
    const shapes = ['dot', 'heart', 'triangle'];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

function pickColor() {
    const colors = state.settings.particlesColors;
    if (!Array.isArray(colors) || !colors.length) return state.settings.accentColor || '#6366f1';
    return colors[Math.floor(Math.random() * colors.length)];
}

function buildSprite(shape, size, color) {
    const blurPx = Math.max(0, state.settings.particlesBlur | 0);
    const dpr = particlesState.dpr;
    const pad = blurPx * 3 + 8;
    const dim = size + pad * 2;

    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(dim * dpr));
    cv.height = Math.max(1, Math.ceil(dim * dpr));
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.filter = blurPx > 0 ? `blur(${blurPx}px)` : 'none';
    c.fillStyle = color;
    c.translate(pad + size / 2, pad + size / 2);

    if (shape === 'dot') {
        c.beginPath();
        c.arc(0, 0, size / 2, 0, Math.PI * 2);
        c.fill();
    } else if (shape === 'heart') {
        const path = new Path2D(HEART_PATH);
        c.save();
        c.scale(size / 24, size / 24);
        c.translate(-12, -12);
        c.fill(path);
        c.restore();
    } else {
        c.beginPath();
        c.moveTo(0, -size / 2);
        c.lineTo(size / 2, size / 2);
        c.lineTo(-size / 2, size / 2);
        c.closePath();
        c.fill();
    }
    return { cv, dim, pad };
}

function createParticle() {
    let shape = state.settings.particlesShape;
    if (shape === 'random') shape = randomShape();
    const size = 24 + Math.random() * 32;
    const color = pickColor();
    return {
        x: Math.random() * particlesState.W,
        y: Math.random() * particlesState.H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size,
        shape,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.012,
        opacity: 0.4 + Math.random() * 0.35,
        sprite: buildSprite(shape, size, color)
    };
}

function syncParticleSprites() {
    const target = clamp(state.settings.particlesCount | 0, 1, 100);
    const list = particlesState.list;

    while (list.length > target) list.pop();
    while (list.length < target) list.push(createParticle());

    for (const p of list) {
        let shape = state.settings.particlesShape;
        if (shape === 'random') shape = p.shape || randomShape();
        p.shape = shape;
        p.sprite = buildSprite(shape, p.size, pickColor());
    }
}

function drawParticle(p) {
    const ctx = particlesState.ctx;
    const s = p.sprite;
    if (!ctx || !s) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.globalAlpha = p.opacity;
    ctx.drawImage(s.cv, -s.dim / 2, -s.dim / 2, s.dim, s.dim);
    ctx.restore();
}

function particlesLoop() {
    const ctx = particlesState.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, particlesState.W, particlesState.H);
    for (const p of particlesState.list) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.x < -p.size) p.x = particlesState.W + p.size;
        if (p.x > particlesState.W + p.size) p.x = -p.size;
        if (p.y < -p.size) p.y = particlesState.H + p.size;
        if (p.y > particlesState.H + p.size) p.y = -p.size;
        drawParticle(p);
    }
    particlesState.animId = requestAnimationFrame(particlesLoop);
}

export function particlesStart() {
    if (!particlesState.canvas || !particlesState.ctx) return;
    particlesStop();
    particlesResize();
    particlesState.list = [];
    const count = clamp(state.settings.particlesCount | 0, 1, 100);
    for (let i = 0; i < count; i++) particlesState.list.push(createParticle());
    particlesLoop();
}

export function particlesStop() {
    if (particlesState.animId) cancelAnimationFrame(particlesState.animId);
    particlesState.animId = null;
    if (particlesState.ctx) {
        particlesState.ctx.clearRect(0, 0, particlesState.W, particlesState.H);
    }
}

export function particlesInit() {
    particlesState.canvas = document.getElementById('particles-canvas');
    if (particlesState.canvas) {
        particlesState.ctx = particlesState.canvas.getContext('2d');
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
        if (state.settings.backgroundMode !== 'particles') return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (particlesState.canvas && particlesState.ctx) particlesResize();
        }, 150);
    });
}

/* ---------- градиент ---------- */

function gradientApplyAngle(angle) {
    const grad = document.querySelector('.bg-gradient');
    if (!grad) return;
    const s = state.settings;
    grad.style.background = `linear-gradient(${angle}deg, ${s.gradientColor1}, ${s.gradientColor2})`;
}

/* Скорость: 50% → полный цикл 30 с. Полный цикл = from → to → from.
   Так что halfCycle (from → to) = 15 с при 50%. */
function gradientLoop(ts) {
    if (!gradientLastTs) gradientLastTs = ts;
    const dt = Math.min(0.1, (ts - gradientLastTs) / 1000);
    gradientLastTs = ts;

    const s = state.settings;
    const from = Math.min(s.gradientAngleFrom, s.gradientAngleTo);
    const to = Math.max(s.gradientAngleFrom, s.gradientAngleTo);
    const range = Math.max(1, to - from);
    const speed = clamp(s.gradientSpeed || 50, 1, 100);
    const halfCycleSec = 15 * (50 / speed);
    const degPerSec = range / halfCycleSec;

    gradientPhase += (degPerSec * dt) / range;

    const p = gradientPhase % 1;
    const angle = p < 0.5
        ? from + (p * 2) * range
        : to - ((p - 0.5) * 2) * range;

    gradientApplyAngle(angle);
    gradientRaf = requestAnimationFrame(gradientLoop);
}

function startGradientAnimation() {
    if (gradientRaf != null) return;
    gradientLastTs = 0;
    gradientPhase = 0;
    gradientRaf = requestAnimationFrame(gradientLoop);
}

function stopGradientAnimation() {
    if (gradientRaf != null) {
        cancelAnimationFrame(gradientRaf);
        gradientRaf = null;
    }
}

/* ---------- общий рендер ---------- */

export function applyBackground() {
    const bgOrbs = document.querySelector('.bg-orbs');
    const bgGrad = document.querySelector('.bg-gradient');
    const bgPart = document.querySelector('.bg-particles');
    const bgSolid = document.querySelector('.bg-solid');

    const mode = state.settings.backgroundMode;

    if (mode !== 'gradient') stopGradientAnimation();

    if (mode === currentBgMode) {
        if (mode === 'gradient') {
            if (state.settings.gradientRotate) {
                startGradientAnimation();
            } else {
                stopGradientAnimation();
                gradientApplyAngle(state.settings.gradientAngle);
            }
        } else if (mode === '1color' && bgSolid) {
            bgSolid.style.background = state.settings.solidColor;
        } else if (mode === 'particles') {
            const sig = spriteSignature();
            if (sig !== lastSpriteSig) {
                lastSpriteSig = sig;
                syncParticleSprites();
            }
        }
        return;
    }

    if (bgOrbs) bgOrbs.style.display = 'none';
    if (bgGrad) bgGrad.style.display = 'none';
    if (bgPart) bgPart.style.display = 'none';
    if (bgSolid) bgSolid.style.display = 'none';
    particlesStop();

    if (mode === 'orbs') {
        if (bgOrbs) bgOrbs.style.display = 'block';
    } else if (mode === '1color') {
        if (bgSolid) {
            bgSolid.style.display = 'block';
            bgSolid.style.background = state.settings.solidColor;
        }
    } else if (mode === 'gradient') {
        if (bgGrad) {
            bgGrad.style.display = 'block';
            if (state.settings.gradientRotate) {
                startGradientAnimation();
            } else {
                gradientApplyAngle(state.settings.gradientAngle);
            }
        }
    } else if (mode === 'particles') {
        if (bgPart) {
            bgPart.style.display = 'block';
            particlesStart();
            lastSpriteSig = spriteSignature();
        }
    }

    currentBgMode = mode;
}

export function applyCustomSurfaceVars(hex, opacityPct) {
    const rgb = hexToRgb(hex);
    const op = clamp(typeof opacityPct === 'number' ? opacityPct : 25, 0, 100);
    const a = 1 - op / 100;
    const s = document.documentElement.style;
    s.setProperty('--surface', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a.toFixed(3)})`);
    s.setProperty('--surface-strong', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, a + 0.15).toFixed(3)})`);
    s.setProperty('--surface-solid', hex);
    s.setProperty('--surface-2', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, a - 0.2).toFixed(3)})`);
}

export function clearCustomSurfaceVars() {
    const s = document.documentElement.style;
    ['--surface', '--surface-strong', '--surface-solid', '--surface-2']
        .forEach(v => s.removeProperty(v));
            }

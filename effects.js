/**
 * VageChain — Decentralized Organism Engine
 * Autonomous nodes · Signal propagation · Mouse presence field
 * Emergent topology · Depth fog · Performance-aware
 */
(function () {
    'use strict';

    const isMobile = window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) return;

    // ── CURSOR PRESENCE RING ─────────────────────────────────
    // const ring = document.createElement('div');
    // ring.id = 'vg-cursor-ring';
    // document.body.appendChild(ring);
    // window.addEventListener('mousemove', e => {
    //     ring.style.left = e.clientX + 'px';
    //     ring.style.top  = e.clientY + 'px';
    //     ring.classList.add('active');
    // }, { passive: true });
    // window.addEventListener('mouseleave', () => ring.classList.remove('active'));

    // ── DESIGN TOKENS ────────────────────────────────────────
    const COL = {
        primary:  [221, 183, 255],
        tertiary: [76,  215, 246],
        bg:       [10,   9,  15],
    };
    const r = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${+a.toFixed(3)})`;
    const lerp = (a, b, t) => a + (b - a) * t;

    // ── CANVAS ───────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.id = 'vg-effects-canvas';
    // document.body.insertBefore(canvas, document.body.firstChild);
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ── DEPTH FOG (CSS divs) ─────────────────────────────────
    if (!isMobile) {
        ['top','bottom','left','right'].forEach(s => {
            if (!document.getElementById('vg-fog-' + s)) {
                const d = document.createElement('div');
                d.id = 'vg-fog-' + s;
                document.body.appendChild(d);
            }
        });
    }

    // ── MOUSE STATE ───────────────────────────────────────────
    const mouse = { x: -999, y: -999, active: false, clicked: false };
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    window.addEventListener('mouseleave', () => { mouse.active = false; });
    window.addEventListener('click', e => {
        mouse.x = e.clientX; mouse.y = e.clientY;
        mouse.clicked = true;
    }, { passive: true });

    // ══════════════════════════════════════════════════════════
    //  NETWORK NODE — autonomous drifting agent
    // ══════════════════════════════════════════════════════════
    const NODE_COUNT  = isMobile ? 0 : 34;
    const CONN_DIST   = 155;   // max edge length
    const MOUSE_PULL  = 185;   // mouse influence radius
    const BORDER_PAD  = 60;

    class NetworkNode {
        constructor() {
            this.x  = BORDER_PAD + Math.random() * (W - BORDER_PAD * 2);
            this.y  = BORDER_PAD + Math.random() * (H - BORDER_PAD * 2);
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            // unique noise phase per node
            this.px = Math.random() * Math.PI * 2;
            this.py = Math.random() * Math.PI * 2;
            this.speed = 0.00055 + Math.random() * 0.0004;
            // colour: 70% primary, 30% tertiary
            this.col = Math.random() < 0.70 ? COL.primary : COL.tertiary;
            this.r   = 2.2 + Math.random() * 2.0;
            this.energy  = 0;        // 0-1, glows when receiving signal
            this.cooldown = 0;       // frames before can fire again
            this.firing  = false;    // visual flag
        }

        update(t) {
            // Sine-based noise drift (approximates organic Perlin movement)
            const ax = Math.sin(t * this.speed + this.px) * 0.022
                     + Math.cos(t * this.speed * 0.6 + this.py) * 0.012;
            const ay = Math.cos(t * this.speed + this.py) * 0.022
                     + Math.sin(t * this.speed * 0.7 + this.px) * 0.012;

            // Mouse attraction field
            if (mouse.active) {
                const dx = mouse.x - this.x, dy = mouse.y - this.y;
                const d  = Math.sqrt(dx * dx + dy * dy);
                if (d < MOUSE_PULL && d > 1) {
                    const strength = (1 - d / MOUSE_PULL) * 0.018;
                    this.vx += (dx / d) * strength;
                    this.vy += (dy / d) * strength;
                }
            }

            // Click shockwave — energise nearby nodes
            if (mouse.clicked) {
                const dx = mouse.x - this.x, dy = mouse.y - this.y;
                const d  = Math.sqrt(dx * dx + dy * dy);
                if (d < 240) this.energy = Math.min(1, this.energy + (1 - d / 240) * 0.9);
            }

            this.vx = (this.vx + ax) * 0.96;
            this.vy = (this.vy + ay) * 0.96;
            this.x += this.vx;
            this.y += this.vy;

            // Soft boundary repulsion
            const margin = BORDER_PAD;
            if (this.x < margin)     this.vx += 0.06;
            if (this.x > W - margin) this.vx -= 0.06;
            if (this.y < margin)     this.vy += 0.06;
            if (this.y > H - margin) this.vy -= 0.06;

            // Energy decay
            this.energy  = Math.max(0, this.energy  - 0.012);
            this.cooldown = Math.max(0, this.cooldown - 1);
            this.firing  = false;
        }

        draw() {
            const glow = this.energy;
            const baseA = 0.35 + glow * 0.55;
            // Bloom halo
            if (glow > 0.05) {
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * (4 + glow * 6));
                g.addColorStop(0, r(this.col, glow * 0.35));
                g.addColorStop(1, r(this.col, 0));
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r * (4 + glow * 6), 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            }
            // Core dot
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r + glow * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = r(this.col, baseA);
            ctx.fill();
        }
    }

    // ══════════════════════════════════════════════════════════
    //  SIGNAL — travels from node A to node B along the edge
    // ══════════════════════════════════════════════════════════
    const MAX_SIGNALS = 24;
    const signals = [];

    class Signal {
        constructor(from, to) {
            this.from  = from;
            this.to    = to;
            this.t     = 0;
            this.speed = 0.007 + Math.random() * 0.006;
            this.col   = from.col;
            this.alpha = 0.55 + Math.random() * 0.3;
        }
        update() { this.t += this.speed; }
        done()   { return this.t >= 1; }
        draw() {
            const x = lerp(this.from.x, this.to.x, this.t);
            const y = lerp(this.from.y, this.to.y, this.t);
            // Envelope: fade in first 15%, out last 15%
            const env = this.t < 0.15 ? this.t / 0.15
                : this.t > 0.85 ? (1 - this.t) / 0.15 : 1;
            const a = this.alpha * env;

            // Glow halo around signal head
            const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
            g.addColorStop(0, r(this.col, a * 0.7));
            g.addColorStop(1, r(this.col, 0));
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.fillStyle = g;
            ctx.fill();

            // Signal dot
            ctx.beginPath();
            ctx.arc(x, y, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = r(this.col, Math.min(a * 1.4, 0.9));
            ctx.fill();
        }
    }

    // ══════════════════════════════════════════════════════════
    //  NETWORK — draw edges, manage connections
    // ══════════════════════════════════════════════════════════
    function drawEdges(nodes) {
        // Track which edges have active signals for brightening
        const activeEdges = new Set();
        signals.forEach(s => {
            activeEdges.add(s.from.idx + '_' + s.to.idx);
            activeEdges.add(s.to.idx + '_' + s.from.idx);
        });

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const a = nodes[i], b = nodes[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const d  = Math.sqrt(dx * dx + dy * dy);
                if (d > CONN_DIST) continue;

                const proximity = 1 - d / CONN_DIST;
                const isActive  = activeEdges.has(i + '_' + j);
                const edgeAlpha = proximity * (isActive ? 0.40 : 0.10);
                const edgeCol   = isActive ? (a.col === COL.primary ? COL.primary : COL.tertiary) : COL.primary;

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = r(edgeCol, edgeAlpha);
                ctx.lineWidth   = isActive ? 0.9 : 0.5;
                ctx.stroke();
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    //  AUTONOMOUS SIGNAL GENERATION
    //  Nodes with energy > threshold fire to random neighbour
    // ══════════════════════════════════════════════════════════
    let autoTimer = 0;
    const AUTO_INTERVAL = 28; // frames between auto-fires

    function autoFire(nodes) {
        autoTimer++;
        if (autoTimer < AUTO_INTERVAL) return;
        autoTimer = 0;

        // Pick a random node to spontaneously fire
        const src = nodes[Math.floor(Math.random() * nodes.length)];
        src.energy = Math.min(1, src.energy + 0.4);
        fireFromNode(src, nodes);
    }

    function fireFromNode(src, nodes) {
        if (src.cooldown > 0 || signals.length >= MAX_SIGNALS) return;
        // Find neighbours
        const neighbours = [];
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i] === src) continue;
            const dx = nodes[i].x - src.x, dy = nodes[i].y - src.y;
            if (Math.sqrt(dx*dx + dy*dy) < CONN_DIST) neighbours.push(nodes[i]);
        }
        if (!neighbours.length) return;
        const tgt = neighbours[Math.floor(Math.random() * neighbours.length)];
        signals.push(new Signal(src, tgt));
        src.firing  = true;
        src.cooldown = 35 + Math.floor(Math.random() * 25);
    }

    function onSignalArrive(sig, nodes) {
        // Energise target
        sig.to.energy = Math.min(1, sig.to.energy + 0.5);
        // Cascade fire with probability ~40%
        if (Math.random() < 0.40 && signals.length < MAX_SIGNALS) {
            setTimeout(() => fireFromNode(sig.to, nodes), 80);
        }
    }

    // ══════════════════════════════════════════════════════════
    //  DEPTH FOG — drawn on canvas each frame (cheap fills)
    // ══════════════════════════════════════════════════════════
    function drawFog() {
        const bg = (a) => `rgba(${COL.bg[0]},${COL.bg[1]},${COL.bg[2]},${a})`;
        let g;
        // top
        g = ctx.createLinearGradient(0, 0, 0, 95);
        g.addColorStop(0, bg(0.50)); g.addColorStop(1, bg(0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, 95);
        // bottom
        g = ctx.createLinearGradient(0, H - 80, 0, H);
        g.addColorStop(0, bg(0)); g.addColorStop(1, bg(0.38));
        ctx.fillStyle = g; ctx.fillRect(0, H - 80, W, 80);
        // sides
        g = ctx.createLinearGradient(0, 0, 65, 0);
        g.addColorStop(0, bg(0.30)); g.addColorStop(1, bg(0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, 65, H);
        g = ctx.createLinearGradient(W - 65, 0, W, 0);
        g.addColorStop(0, bg(0)); g.addColorStop(1, bg(0.30));
        ctx.fillStyle = g; ctx.fillRect(W - 65, 0, 65, H);
    }

    // ══════════════════════════════════════════════════════════
    //  MOBILE FALLBACK — 2 CSS light trails + 4 CSS particles
    // ══════════════════════════════════════════════════════════
    function injectMobileFallbacks() {
        const trails = [
            { cls: 'vg-trail vg-trail-purple', top: '22%', dur: '9s',  del: '0s'  },
            { cls: 'vg-trail vg-trail-cyan',   top: '65%', dur: '13s', del: '-5s' },
        ];
        trails.forEach(d => {
            const el = document.createElement('div');
            el.className = d.cls;
            el.style.cssText = `top:${d.top};animation-duration:${d.dur};animation-delay:${d.del};`;
            document.body.appendChild(el);
        });
        const pts = [
            { s:3, l:'15%', b:'20%', c:'rgba(221,183,255,0.18)', d:'8s',  dl:'0s'  },
            { s:2, l:'55%', b:'35%', c:'rgba(76,215,246,0.16)',  d:'11s', dl:'-3s' },
            { s:3, l:'78%', b:'60%', c:'rgba(221,183,255,0.14)', d:'10s', dl:'-6s' },
            { s:2, l:'38%', b:'10%', c:'rgba(76,215,246,0.15)',  d:'9s',  dl:'-1s' },
        ];
        pts.forEach(p => {
            const el = document.createElement('div');
            el.className = 'vg-particle';
            el.style.cssText = `width:${p.s}px;height:${p.s}px;left:${p.l};bottom:${p.b};background:${p.c};animation-duration:${p.d};animation-delay:${p.dl};display:block;`;
            document.body.appendChild(el);
        });
    }

    // ══════════════════════════════════════════════════════════
    //  BOOT & MAIN LOOP
    // ══════════════════════════════════════════════════════════
    if (isMobile) {
        canvas.style.display = 'none';
        injectMobileFallbacks();
        return;
    }

    // Create nodes with index references for edge lookup
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => {
        const n = new NetworkNode(); n.idx = i; return n;
    });

    let running  = false;
    let t        = 0;

    function loop() {
        if (!running) return;
        requestAnimationFrame(loop);
        t++;
        ctx.clearRect(0, 0, W, H);

        // Depth fog first (background layer)
        drawFog();

        // Update nodes
        nodes.forEach(n => n.update(t));

        // Draw edges (under nodes)
        ctx.save();
        drawEdges(nodes);
        ctx.restore();

        // Update & draw signals
        for (let i = signals.length - 1; i >= 0; i--) {
            signals[i].update();
            signals[i].draw();
            if (signals[i].done()) {
                onSignalArrive(signals[i], nodes);
                signals.splice(i, 1);
            }
        }

        // Draw nodes (on top)
        nodes.forEach(n => n.draw());

        // Autonomous network activity
        autoFire(nodes);

        // Clear one-shot click flag
        mouse.clicked = false;
    }

    loop();

    // Pause when hidden
    document.addEventListener('visibilitychange', () => {
        running = !document.hidden;
        if (running) loop();
    });

})();

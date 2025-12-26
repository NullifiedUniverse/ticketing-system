import React, { useState, useEffect, useRef } from 'react';
import { useEvent } from '../../context/EventContext';
import { getRaffleState } from '../../services/api';

// ========================================== 
// 1. CONFIGURATION & SHARED CONSTANTS
// ========================================== 
const CONFIG = {
    channelName: 'celestial_raffle_sync_v3',
    colors: {
        bgInner: '#020617',
        bgOuter: '#000000',
        primary: '#22d3ee', // Cyan
        secondary: '#a5f3fc', // Light Cyan
        gold: '#FFD700',
        product: '#fbbf24', // Amber
        text: '#ffffff',
        placeholderBg: '#1e293b',
        placeholderStroke: '#475569'
    },
    physics: {
        friction: 0.96,
        starCount: 600,
        shockwaveMaxRadius: 100
    },
    timings: {
        revealDelayL: 800,
        revealDelayS: 1200,
        connectDuration: 6000,
        centerDuration: 3000,
        productInDuration: 1200
    },
    defaults: {
        attendees: "LS-8821\nXY-9921\nAB-1102\nCC-3321\nJJ-2219\nZZ-0012\nMM-3311",
        prizes: "MacBook Pro M3\niPhone 15 Pro\nSony WH-1000XM5\n$500 Amazon Card\nKeychron Q1 Pro"
    }
};

// ========================================== 
// 2. MATH UTILITIES
// ========================================== 
const MathUtils = {
    getSplinePoints: (points, segments = 50) => {
        if (points.length < 2) return [];
        const results = [];
        const p = [points[0], ...points, points[points.length - 1]];
        for (let i = 0; i < p.length - 3; i++) {
            const [p0, p1, p2, p3] = [p[i], p[i + 1], p[i + 2], p[i + 3]];
            for (let j = 0; j < segments; j++) {
                const t = j / segments;
                const t2 = t * t;
                const t3 = t2 * t;
                const q0 = -t3 + 2 * t2 - t;
                const q1 = 3 * t3 - 5 * t2 + 2;
                const q2 = -3 * t3 + 4 * t2 + t;
                const q3 = t3 - t2;
                const x = 0.5 * (p0.x * q0 + p1.x * q1 + p2.x * q2 + p3.x * q3);
                const y = 0.5 * (p0.y * q0 + p1.y * q1 + p2.y * q2 + p3.y * q3);
                results.push({ x, y });
            }
        }
        results.push(points[points.length - 1]);
        return results;
    },
    easeElastic: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
    randomRange: (min, max) => Math.random() * (max - min) + min,
    distance: (p1, p2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
};

// ========================================== 
// 3. CANVAS ENTITY ENGINE
// ========================================== 
const EntityFactory = {
    createStar: (w, h) => ({
        x: MathUtils.randomRange(0, w),
        y: MathUtils.randomRange(0, h),
        z: MathUtils.randomRange(0.5, 2.5),
        size: MathUtils.randomRange(0.5, 2.0),
        alpha: Math.random(),
        blinkSpeed: MathUtils.randomRange(0.001, 0.006),
        vx: MathUtils.randomRange(-0.05, 0.05),
        vy: MathUtils.randomRange(-0.05, 0.05),
        color: Math.random() > 0.9 ? CONFIG.colors.secondary : '#fff',
        isTarget: false
    }),
    createParticle: (x, y, color, speedMult = 1) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = MathUtils.randomRange(0.5, 2.5) * speedMult;
        return {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            decay: MathUtils.randomRange(0.005, 0.015),
            color,
            size: MathUtils.randomRange(1, 4),
            drag: CONFIG.physics.friction
        };
    },
    createShockwave: (x, y, color) => ({
        x, y,
        radius: 1,
        maxRadius: CONFIG.physics.shockwaveMaxRadius,
        alpha: 1,
        color
    }),
    createTrailParticle: (x, y, angle, color) => {
        const spread = 0.3;
        const trailAngle = angle + Math.PI + MathUtils.randomRange(-spread / 2, spread / 2);
        const speed = MathUtils.randomRange(1, 3);
        return {
            x, y,
            vx: Math.cos(trailAngle) * speed,
            vy: Math.sin(trailAngle) * speed,
            life: 1.0,
            decay: MathUtils.randomRange(0.03, 0.05),
            size: MathUtils.randomRange(1, 4),
            color: color || `hsl(${MathUtils.randomRange(180, 220)}, 100%, 70%)`
        };
    }
};

const Systems = {
    updateStars: (stars, w, h) => {
        stars.forEach(star => {
            if (star.isTarget) return;
            star.x += star.vx * star.z;
            star.y += star.vy * star.z;
            if (star.x < -50) star.x = w + 50;
            if (star.x > w + 50) star.x = -50;
            if (star.y < -50) star.y = h + 50;
            if (star.y > h + 50) star.y = -50;
            star.alpha += star.blinkSpeed;
            if (star.alpha > 1 || star.alpha < 0.2) star.blinkSpeed *= -1;
        });
    },
    updateParticles: (particles) => {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.drag) {
                p.vx *= p.drag;
                p.vy *= p.drag;
            }
            p.life -= p.decay;
            if (p.life <= 0) particles.splice(i, 1);
        }
    },
    updateShockwaves: (shockwaves) => {
        for (let i = shockwaves.length - 1; i >= 0; i--) {
            const sw = shockwaves[i];
            sw.radius += (sw.maxRadius - sw.radius) * 0.1;
            sw.alpha -= 0.02;
            if (sw.alpha <= 0) shockwaves.splice(i, 1);
        }
    },
    drawBackground: (ctx, w, h, phase, nebulaPulse) => {
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
        gradient.addColorStop(0, CONFIG.colors.bgInner);
        gradient.addColorStop(1, CONFIG.colors.bgOuter);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        if (phase === 'done' || phase === 'product_incoming' || phase === 'product_reveal') {
            const pulse = Math.sin(nebulaPulse) * 0.1 + 0.9;
            const radius = 300 * pulse;
            const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, radius);
            glow.addColorStop(0, 'rgba(34, 211, 238, 0.15)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);
        }
    },
    drawSplineLine: (ctx, pathPoints, progress, opacity) => {
        if (pathPoints.length < 2 || opacity <= 0.01) return;
        const drawCount = Math.floor(progress * pathPoints.length);
        if (drawCount < 2) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
        for (let i = 1; i < drawCount; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
        }

        ctx.strokeStyle = `rgba(34, 211, 238, ${opacity * 0.5})`;
        ctx.lineWidth = 6;
        ctx.shadowBlur = 20;
        ctx.shadowColor = CONFIG.colors.primary;
        ctx.stroke();

        ctx.strokeStyle = `rgba(220, 255, 255, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 0;
        ctx.stroke();
    },
    drawProductComet: (ctx, comet, opacity, imageObj) => {
        if (!comet) return;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(comet.x, comet.y);
        ctx.rotate(comet.angle);

        if (imageObj && imageObj.complete) {
            // Draw image as comet head
            const size = 120; // Increased meteor scale
            ctx.shadowBlur = 40;
            ctx.shadowColor = CONFIG.colors.product;
            ctx.drawImage(imageObj, -size/2, -size/2, size, size);
        } else {
            // Fallback Vector
            ctx.shadowBlur = 40;
            ctx.shadowColor = CONFIG.colors.product;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = CONFIG.colors.gold;
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    },
    drawProductReveal: (ctx, x, y, scale, prizeName, imageObj, prizeTitle, screenH) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Dynamic Image Size based on Screen Height
        // Default 350px, but constrain to 35% of screen height for ultra-wide/short screens
        const baseSize = 350;
        const maxRelativeSize = screenH ? screenH * 0.35 : 350; 
        const targetSize = Math.min(baseSize, maxRelativeSize);
        const targetHalf = targetSize / 2;

        if (imageObj && imageObj.complete) {
             ctx.shadowBlur = 50;
             ctx.shadowColor = 'rgba(251, 191, 36, 0.4)'; 
             
             // Aspect Ratio Logic (Object-Fit: Contain)
             const imgAspect = imageObj.width / imageObj.height;
             let drawW = targetSize;
             let drawH = targetSize;

             if (imgAspect > 1) {
                 // Landscape: Width fills, Height scales
                 drawH = targetSize / imgAspect;
             } else {
                 // Portrait: Height fills, Width scales
                 drawW = targetSize * imgAspect;
             }

             ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH);
             ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = CONFIG.colors.gold;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 20;
            ctx.shadowColor = CONFIG.colors.product;
            ctx.strokeRect(-25, -25, 50, 50);
            ctx.stroke();
        }

        ctx.restore();

        if (scale > 0.8) {
            ctx.textAlign = 'center';
            ctx.shadowBlur = 20;
            const maxTextWidth = 1000;

            const fillTextFit = (text, cx, cy, fontBase, maxWidth) => {
                ctx.font = fontBase;
                const width = ctx.measureText(text).width;
                if (width > maxWidth) {
                    const scaleRatio = maxWidth / width;
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.scale(scaleRatio, scaleRatio);
                    ctx.fillText(text, 0, 0);
                    ctx.restore();
                } else {
                    ctx.fillText(text, cx, cy);
                }
            };

            // 1. Prize Title (ABOVE Image)
            if (prizeTitle) {
                ctx.fillStyle = CONFIG.colors.gold;
                ctx.textBaseline = 'bottom';
                // Reduced padding to 30px
                const titleY = y - targetHalf - 30; 
                fillTextFit(prizeTitle.toUpperCase(), x, titleY, `900 36px "Inter", "Segoe UI", sans-serif`, maxTextWidth);
            }

            // 2. Prize Name (BELOW Image)
            ctx.fillStyle = CONFIG.colors.product;
            ctx.textBaseline = 'top';
            
            // "Lower and just a bit higher than the image" -> Below image, but closer gap.
            // Reduced padding from 80px to 40px
            const nameY = y + targetHalf + 40; 
            
            fillTextFit(prizeName, x, nameY, `bold 60px "Inter", "Segoe UI", sans-serif`, maxTextWidth);
            
            ctx.shadowBlur = 0;
        }
    }
};

const RaffleDisplay = () => {
    const canvasRef = useRef(null);
    const { selectedEvent, loading: contextLoading } = useEvent();
    const [lastTrigger, setLastTrigger] = useState(0);

    const stateRef = useRef({
        phase: 'idle',
        stars: [],
        targetStars: [],
        particles: [],
        shockwaves: [],
        trailParticles: [],
        pathPoints: [],
        dims: { w: 0, h: 0 },
        startTime: 0,
        lineStartTime: 0,
        centerStartTime: 0,
        productStartTime: 0,
        lineProgress: 0,
        centerProgress: 0,
        nebulaPulse: 0,
        hasCelebrated: false,
        hasProductExploded: false,
        productComet: { x: 0, y: 0, startX: 0, startY: 0, angle: 0 },
        productScale: 0,
        currentPrizeName: "",
        currentPrizeTitle: "", // Added
        prizeImage: null // Image object
    });

    // --- BROADCAST CHANNEL SYNC --- 
    useEffect(() => {
        const channel = new BroadcastChannel(CONFIG.channelName);
        channel.onmessage = (event) => {
            const { type, winner, prize } = event.data;
            if (type === 'START_DRAW') {
                console.log('Broadcast received: START_DRAW', winner);
                startAnimation(winner, prize);
            } else if (type === 'RESET') {
                resetAnimation();
            }
        };
        return () => channel.close();
    }, []);

    // --- POLLING FALLBACK --- 
    useEffect(() => {
        if (!selectedEvent) return;
        const interval = setInterval(async () => {
            try {
                const state = await getRaffleState(selectedEvent.id);
                if (state.animationTrigger > lastTrigger) {
                    setLastTrigger(state.animationTrigger);
                    if (state.status === 'DRAWING' || state.status === 'REVEALED') {
                        startAnimation(state.winner, state.currentPrize);
                    } else if (state.status === 'IDLE') {
                        resetAnimation();
                    }
                }
            } catch (err) {
                // Silent fail
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [selectedEvent, lastTrigger]);

    const resetAnimation = () => {
        const state = stateRef.current;
        state.phase = 'idle';
        state.stars.forEach(s => s.isTarget = false);
        state.targetStars = [];
        state.hasCelebrated = false;
        state.hasProductExploded = false;
        state.prizeImage = null;
    };

    const startAnimation = (winner, prize) => {
        if (!winner) return;
        
        const state = stateRef.current;
        
        // Handle Prize Object/String
        let pName = "Mystery Prize";
        let pTitle = "";
        let pImage = null;

        if (typeof prize === 'object' && prize !== null) {
            pName = prize.name || "Mystery Prize";
            pTitle = prize.title || "";
            pImage = prize.image;
        } else if (typeof prize === 'string') {
            pName = prize;
        }

        state.currentPrizeName = pName;
        state.currentPrizeTitle = pTitle;
        state.prizeImage = null;

        // Load image if exists
        if (pImage) {
            const img = new Image();
            img.src = `/uploads/${pImage}`; // Path relative to public or proxy?
            // Since uploads are in backend/uploads, and we serve static via Express if configured,
            // OR we need a route to serve them.
            // Wait, we didn't add a static route for uploads!
            // I need to add that to server.js or just assume user handles it?
            // I'll assume '/uploads' is mounted. I should probably double check server.js.
            // For now, let's just set the src.
            // *Self-Correction*: I'll add the mount to server.js in a separate step if needed.
            // Actually, server.js serves 'frontend/build' and 'scanner'. It does NOT serve 'uploads' yet.
            // I will fix server.js after this file.
            state.prizeImage = img; 
        }

        state.phase = 'revealing';
        state.startTime = performance.now();
        state.particles = [];
        state.trailParticles = [];
        state.shockwaves = [];
        state.hasCelebrated = false;
        state.hasProductExploded = false;
        state.productScale = 0;

        // Reset previous targets
        state.stars.forEach(s => s.isTarget = false);

        const { w, h } = state.dims;
        const available = [...state.stars];
        const pickedStars = [];
        const MIN_DIST = 120;
        const MARGIN = 150;

        // Masked ID logic: L[S/J]XXXXX
        // We want to verify format to apply custom reveal order.
        const text = (winner.studentId || winner.maskedId || winner.name).toUpperCase();
        // Check for L[SJ] format
        const isStudentId = /^L[SJ]\d{5}$/.test(text);

        const chars = text.split('');
        const charCount = chars.length;

        for (let i = 0; i < charCount; i++) {
            let selected = null;
            for (let attempt = 0; attempt < 50; attempt++) {
                const idx = Math.floor(Math.random() * available.length);
                const candidate = available[idx];

                const tooClose = pickedStars.some(p => MathUtils.distance(p, candidate) < MIN_DIST);
                const inBounds = candidate.x > MARGIN && candidate.x < w - MARGIN && candidate.y > MARGIN && candidate.y < h - MARGIN;

                if (!tooClose && inBounds) {
                    selected = candidate;
                    available.splice(idx, 1);
                    selected.isTarget = true;
                    break;
                }
            }

            if (!selected) {
                selected = { x: w / 2 + (i - charCount / 2) * 100, y: h / 2, size: 2 };
            }

            // DETERMINE REVEAL ORDER
            // Default: Left to Right (0, 1, 2...)
            // Student ID (L S X X X X X): 
            // Indices:   0 1 2 3 4 5 6
            // Order:     0 (L) -> 2,3,4,5,6 (Numbers) -> 1 (S/J)
            
            let revealOrder = i;
            if (isStudentId) {
                if (i === 0) revealOrder = 0; // L first
                else if (i === 1) revealOrder = 7; // S/J LAST (after 5 nums)
                else revealOrder = i - 1; // Numbers shift up (2->1, 3->2...) 
                // So nums reveal at "time 1, 2, 3, 4, 5"
                // S/J reveals at "time 7" (or 6)
            }

            pickedStars.push({
                origX: selected.x,
                origY: selected.y,
                currentX: selected.x,
                currentY: selected.y,
                size: selected.size || 2,
                currentSize: selected.size || 2,
                popScale: 1.0,
                shake: 0,
                char: chars[i],
                charIndex: i,         // Position in string (for centering)
                revealOrder: revealOrder, // Timing index
                revealed: false
            });
        }
        state.targetStars = pickedStars;
    };

    // Init Canvas
    useEffect(() => {
        const init = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const { innerWidth, innerHeight } = window;
            const dpr = window.devicePixelRatio || 1;

            canvas.width = innerWidth * dpr;
            canvas.height = innerHeight * dpr;
            canvas.style.width = `${innerWidth}px`;
            canvas.style.height = `${innerHeight}px`;

            const ctx = canvas.getContext('2d');
            ctx.scale(dpr, dpr);

            stateRef.current.dims = { w: innerWidth, h: innerHeight };
            if (stateRef.current.stars.length === 0) {
                stateRef.current.stars = Array.from({ length: CONFIG.physics.starCount }, () =>
                    EntityFactory.createStar(innerWidth, innerHeight)
                );
            }
        };

        init();
        window.addEventListener('resize', init);
        return () => window.removeEventListener('resize', init);
    }, []);

    // Main Loop
    useEffect(() => {
        let animationFrameId;
        const canvas = canvasRef.current;

        const render = (time) => {
            const ctx = canvas?.getContext('2d');
            if (!ctx) return;

            const state = stateRef.current;
            const { w, h } = state.dims;

            // Updates
            Systems.updateStars(state.stars, w, h);
            Systems.updateParticles(state.particles);
            Systems.updateParticles(state.trailParticles);
            Systems.updateShockwaves(state.shockwaves);

            // Logic Phases
            if (state.phase === 'revealing') {
                const elapsed = time - state.startTime;
                
                state.targetStars.forEach(tStar => {
                    const order = tStar.revealOrder;
                    let shouldReveal = false;

                    // Custom Timing based on order
                    // Base delay 800ms
                    // Each step +1000ms? Or faster?
                    // User wants dramatic reveal.
                    
                    const step = 800; // ms per char
                    const triggerTime = 1000 + (order * step);

                    if (elapsed > triggerTime) shouldReveal = true;

                    if (shouldReveal && !tStar.revealed) {
                        tStar.revealed = true;
                        tStar.popScale = 5.0;
                        tStar.shake = 10;
                        state.shockwaves.push(EntityFactory.createShockwave(tStar.currentX, tStar.currentY, CONFIG.colors.primary));
                        for (let k = 0; k < 20; k++) state.particles.push(EntityFactory.createParticle(tStar.currentX, tStar.currentY, CONFIG.colors.primary, 1.5));
                    }
                    if (tStar.revealed) {
                        tStar.popScale += (1.0 - tStar.popScale) * 0.05;
                        tStar.currentSize += (45 - tStar.currentSize) * 0.05;
                        if (tStar.shake > 0) tStar.shake *= 0.9;
                    }
                });

                // Check if all revealed
                // const allRevealed = state.targetStars.every(s => s.revealed);
                const maxOrder = Math.max(...state.targetStars.map(s => s.revealOrder), 0);
                const finishTime = 1000 + (maxOrder * 800) + 1500; // Buffer

                if (elapsed > finishTime) {
                    state.phase = 'connecting';
                    state.lineStartTime = time;
                    const sorted = [...state.targetStars].sort((a, b) => a.charIndex - b.charIndex);
                    const controlPoints = [{ x: 0, y: h / 2 }, ...sorted.map(s => ({ x: s.currentX, y: s.currentY }))];
                    state.pathPoints = MathUtils.getSplinePoints(controlPoints, 50);
                }
            }

            if (state.phase === 'connecting') {
                const elapsed = time - state.lineStartTime;
                state.lineProgress = Math.min(elapsed / CONFIG.timings.connectDuration, 1);
                state.targetStars.forEach(s => s.popScale += (1.0 - s.popScale) * 0.05);
                if (state.lineProgress >= 1) {
                    state.phase = 'centering';
                    state.centerStartTime = time;
                }
            }

            if (state.phase === 'centering') {
                const elapsed = time - state.centerStartTime;
                state.centerProgress = Math.min(elapsed / CONFIG.timings.centerDuration, 1);
                const ease = MathUtils.easeElastic(state.centerProgress);

                // Dynamic Sizing based on Screen Width
                // Base width 1920 -> charWidth 65, Size 45-80
                const scaleFactor = Math.min(w / 1920, 1); 
                const charWidth = 65 * scaleFactor;
                const baseSize = 45 * scaleFactor;
                const growSize = 35 * scaleFactor;

                const totalWidth = state.targetStars.length * charWidth;
                const startX = w / 2 - totalWidth / 2 + (charWidth / 2);
                
                // Target Y: Move UP by ~25% of screen height from previous
                // Previous was 0.35h. Moving up by 0.23h -> 0.12h.
                const targetY = h * 0.12;

                state.targetStars.forEach((s) => {
                    const finalX = startX + (s.charIndex * charWidth);
                    const finalY = targetY; 
                    
                    s.currentX = s.origX + (finalX - s.origX) * ease;
                    s.currentY = s.origY + (finalY - s.origY) * ease;
                    s.currentSize = baseSize + (growSize * ease);
                });

                const sorted = [...state.targetStars].sort((a, b) => a.charIndex - b.charIndex);
                // Control points should curve to new targetY
                const controlPoints = [{ x: 0, y: h / 2 }, ...sorted.map(s => ({ x: s.currentX, y: s.currentY }))];
                state.pathPoints = MathUtils.getSplinePoints(controlPoints, 50);

                if (state.centerProgress >= 1) {
                    state.phase = 'done';
                    if (!state.hasCelebrated) {
                        state.shockwaves.push(EntityFactory.createShockwave(w / 2, targetY, CONFIG.colors.gold));
                        for (let k = 0; k < 150; k++) state.particles.push(EntityFactory.createParticle(w / 2, targetY, CONFIG.colors.gold, 2));
                        state.hasCelebrated = true;
                        state.productStartTime = time + 1000;
                    }
                }
            }

            if (state.phase === 'done' && time > state.productStartTime && !state.hasProductExploded) {
                state.phase = 'product_incoming';
                state.productComet = {
                    startX: w + 100,
                    startY: -100,
                    x: w + 100,
                    y: -100,
                    targetX: w / 2,
                    targetY: h * 0.55,
                    angle: 0
                };
                state.productStartTime = time;
            }

            if (state.phase === 'product_incoming') {
                const elapsed = time - state.productStartTime;
                const progress = Math.min(elapsed / CONFIG.timings.productInDuration, 1);
                const ease = MathUtils.easeOutCubic(progress);

                const pc = state.productComet;
                const prevX = pc.x;
                const prevY = pc.y;

                pc.x = pc.startX + (pc.targetX - pc.startX) * ease;
                pc.y = pc.startY + (pc.targetY - pc.startY) * ease;
                pc.angle = Math.atan2(pc.y - prevY, pc.x - prevX);

                for (let k = 0; k < 2; k++) {
                    state.trailParticles.push(EntityFactory.createTrailParticle(pc.x, pc.y, pc.angle + Math.PI, CONFIG.colors.product));
                }

                if (progress >= 1) {
                    state.phase = 'product_reveal';
                    state.hasProductExploded = true;
                    state.productScale = 0;
                    state.shockwaves.push(EntityFactory.createShockwave(pc.x, pc.y, CONFIG.colors.product));
                    for (let k = 0; k < 50; k++) state.particles.push(EntityFactory.createParticle(pc.x, pc.y, CONFIG.colors.product, 1.5));
                }
            }

            if (state.phase === 'product_reveal') {
                state.productScale += (1.5 - state.productScale) * 0.1;
            }

            // --- DRAWING --- 
            if (state.phase === 'done' || state.phase === 'product_incoming' || state.phase === 'product_reveal') state.nebulaPulse += 0.02;
            Systems.drawBackground(ctx, w, h, state.phase, state.nebulaPulse);

            state.stars.forEach(star => {
                if (star.isTarget) return;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.globalAlpha = star.alpha * 0.8;
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            const lineOpacity = state.phase === 'centering' ? (1 - state.centerProgress) : 1;
            const drawProgress = state.phase === 'centering' ? 1 : state.lineProgress;

            if ((state.phase === 'connecting' || state.phase === 'centering') && state.pathPoints.length > 0) {
                Systems.drawSplineLine(ctx, state.pathPoints, drawProgress, lineOpacity);
                if (state.phase === 'connecting') {
                    const totalPoints = state.pathPoints.length;
                    const drawIndex = Math.floor(drawProgress * totalPoints);
                    if (drawIndex > 4) {
                        const tip = state.pathPoints[drawIndex - 1];
                        if (tip) {
                            const prev = state.pathPoints[Math.max(0, drawIndex - 4)];
                            const angle = Math.atan2(tip.y - prev.y, tip.x - prev.x);
                            for (let k = 0; k < 3; k++) state.trailParticles.push(EntityFactory.createTrailParticle(tip.x, tip.y, angle));
                        }
                    }
                }
            }

            if (state.phase === 'product_incoming') {
                Systems.drawProductComet(ctx, state.productComet, 1, state.prizeImage);
            }

            state.shockwaves.forEach(sw => {
                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.strokeStyle = sw.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = sw.alpha;
                ctx.stroke();
                ctx.globalAlpha = 1;
            });

            [...state.particles, ...state.trailParticles].forEach(p => {
                ctx.globalAlpha = p.life;
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            });

            state.targetStars.forEach(s => {
                if (s.revealed) {
                    let scale = s.popScale;
                    let glowColor = CONFIG.colors.primary;
                    if (state.phase === 'done' || state.phase === 'product_incoming' || state.phase === 'product_reveal') {
                        const pulse = Math.sin(time * 0.003 + s.charIndex) * 0.1 + 0.05;
                        scale += pulse;
                        glowColor = `hsl(${180 + Math.sin(time * 0.002) * 40}, 100%, 70%)`;
                    }
                    let drawX = s.currentX + (Math.random() - 0.5) * s.shake;
                    let drawY = s.currentY + (Math.random() - 0.5) * s.shake;

                    const fontSize = Math.floor(s.currentSize * scale);
                    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
                    ctx.shadowBlur = 40 * scale;
                    ctx.shadowColor = glowColor;
                    ctx.fillStyle = CONFIG.colors.text;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(s.char, drawX, drawY);
                    ctx.shadowBlur = 0;
                    ctx.fillText(s.char, drawX, drawY);
                } else {
                    ctx.beginPath();
                    ctx.arc(s.currentX, s.currentY, s.size * 2, 0, Math.PI * 2);
                    ctx.fillStyle = '#FFF';
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = '#fff';
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            if (state.phase === 'product_reveal') {
                // Move down to h * 0.55 to clear the Student ID at h * 0.12
                Systems.drawProductReveal(ctx, w / 2, h * 0.55, state.productScale, state.currentPrizeName, state.prizeImage, state.currentPrizeTitle, h);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render(0);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    if (contextLoading) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center text-cyan-500 font-mono">
                <div className="animate-pulse">INITIALIZING CELESTIAL UPLINK...</div>
            </div>
        );
    }

    if (!selectedEvent) {
        return (
            <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-slate-500 font-sans p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-300 mb-2">Signal Lost</h2>
                <p>No active event channel detected.</p>
                <p className="text-sm mt-4">Please select an event in the Control Center.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden cursor-none">
            <canvas ref={canvasRef} className="block w-full h-full" />
            <div className="absolute top-4 right-4 text-xs text-white/10 select-none">
                DISPLAY MODE • {selectedEvent.name.toUpperCase()}
            </div>
        </div>
    );
};

export default RaffleDisplay;
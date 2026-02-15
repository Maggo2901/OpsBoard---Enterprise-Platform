import React, { useEffect, useMemo, useRef, useState } from 'react';

const DEBUG_BOOT = import.meta.env.DEV && import.meta.env.VITE_BOOT_DEBUG === 'true';

const BOOT_TIMING_DEFAULT = {
    totalMs: 2250,
    exitMs: 340,
    gridRampEnd: 600,
    iconStart: 400,
    iconEnd: 1000,
    titleStart: 900,
    titleEnd: 1600,
    statusStart: 1400,
    statusEnd: 2100,
};

const BOOT_TIMING_REDUCED = {
    totalMs: 720,
    exitMs: 180,
    gridRampEnd: 180,
    iconStart: 120,
    iconEnd: 260,
    titleStart: 200,
    titleEnd: 380,
    statusStart: 320,
    statusEnd: 560,
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
}

export default function BootOverlay({ onComplete }) {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [elapsedMs, setElapsedMs] = useState(0);

    const timing = useMemo(
        () => (reducedMotion ? BOOT_TIMING_REDUCED : BOOT_TIMING_DEFAULT),
        [reducedMotion]
    );

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const applyPreference = () => setReducedMotion(mediaQuery.matches);
        applyPreference();

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', applyPreference);
            return () => mediaQuery.removeEventListener('change', applyPreference);
        }
        mediaQuery.addListener(applyPreference);
        return () => mediaQuery.removeListener(applyPreference);
    }, []);

    useEffect(() => {
        if (DEBUG_BOOT) console.debug('[BootOverlay] start', { reducedMotion, timing });
        setIsExiting(false);
        setElapsedMs(reducedMotion ? timing.statusEnd : 0);

        const exitAt = Math.max(0, timing.totalMs - timing.exitMs);
        const exitTimer = window.setTimeout(() => setIsExiting(true), exitAt);
        const doneTimer = window.setTimeout(() => {
            if (DEBUG_BOOT) console.debug('[BootOverlay] complete');
            if (onComplete) onComplete();
        }, timing.totalMs);

        return () => {
            window.clearTimeout(exitTimer);
            window.clearTimeout(doneTimer);
        };
    }, [onComplete, timing, reducedMotion]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return undefined;

        const particles = [];
        const streaks = [];
        const state = {
            width: 0,
            height: 0,
            dpr: 1,
            startedAt: performance.now(),
        };

        const particleCount = reducedMotion ? 22 : 60;
        for (let i = 0; i < particleCount; i += 1) {
            particles.push({
                x: Math.random(),
                y: Math.random(),
                z: 0.35 + Math.random() * 0.9,
                speed: 0.014 + Math.random() * 0.038,
                twinkle: Math.random() * Math.PI * 2,
            });
        }

        const streakCount = reducedMotion ? 2 : 5;
        for (let i = 0; i < streakCount; i += 1) {
            streaks.push({
                y: 0.2 + Math.random() * 0.6,
                speed: 0.08 + Math.random() * 0.09,
                phase: Math.random(),
                width: 80 + Math.random() * 160,
            });
        }

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            state.width = Math.max(1, Math.floor(rect.width));
            state.height = Math.max(1, Math.floor(rect.height));
            state.dpr = Math.min(window.devicePixelRatio || 1, 2);

            canvas.width = Math.floor(state.width * state.dpr);
            canvas.height = Math.floor(state.height * state.dpr);
            canvas.style.width = `${state.width}px`;
            canvas.style.height = `${state.height}px`;
        };

        const drawScene = (elapsed) => {
            const w = state.width;
            const h = state.height;
            if (w <= 0 || h <= 0) return;

            const t = elapsed / 1000;
            const gridRamp = easeOutCubic(elapsed / timing.gridRampEnd);
            const cx = w * 0.5;
            const cy = h * 0.46;

            ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);

            const baseGradient = ctx.createLinearGradient(0, 0, 0, h);
            baseGradient.addColorStop(0, '#060c18');
            baseGradient.addColorStop(0.55, '#071120');
            baseGradient.addColorStop(1, '#04070f');
            ctx.fillStyle = baseGradient;
            ctx.fillRect(0, 0, w, h);

            const radialGlowA = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.52);
            radialGlowA.addColorStop(0, `rgba(86, 140, 244, ${0.16 * gridRamp})`);
            radialGlowA.addColorStop(0.42, `rgba(57, 101, 190, ${0.08 * gridRamp})`);
            radialGlowA.addColorStop(1, 'rgba(5, 10, 20, 0)');
            ctx.fillStyle = radialGlowA;
            ctx.fillRect(0, 0, w, h);

            const vignette = ctx.createRadialGradient(cx, h * 0.42, Math.min(w, h) * 0.24, cx, h * 0.42, Math.max(w, h) * 0.74);
            vignette.addColorStop(0, 'rgba(0,0,0,0)');
            vignette.addColorStop(1, 'rgba(2, 5, 10, 0.6)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, w, h);

            const spacing = 46;
            const driftX = ((t * 14) % spacing);
            const driftY = ((t * 8) % spacing);
            const lineAlpha = 0.045 + 0.04 * gridRamp;
            ctx.strokeStyle = `rgba(118, 156, 243, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let x = -spacing + driftX; x < w + spacing; x += spacing) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
            }
            for (let y = -spacing + driftY; y < h + spacing; y += spacing) {
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
            }
            ctx.stroke();

            ctx.fillStyle = `rgba(164, 201, 255, ${0.18 * gridRamp})`;
            particles.forEach((particle) => {
                const px = ((particle.x + t * particle.speed * particle.z) % 1) * w;
                const py = ((particle.y + Math.sin(t * particle.speed + particle.twinkle) * 0.04 + 1) % 1) * h;
                const size = 0.7 + particle.z * 1.2;
                ctx.globalAlpha = 0.18 + (Math.sin((t + particle.twinkle) * 2.2) + 1) * 0.14;
                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            if (!reducedMotion) {
                streaks.forEach((streak) => {
                    const x = (((t * streak.speed) + streak.phase) % 1.25) * (w + streak.width) - streak.width;
                    const y = h * streak.y;
                    const grad = ctx.createLinearGradient(x, y, x + streak.width, y);
                    grad.addColorStop(0, 'rgba(120, 170, 255, 0)');
                    grad.addColorStop(0.45, 'rgba(142, 190, 255, 0.32)');
                    grad.addColorStop(1, 'rgba(120, 170, 255, 0)');
                    ctx.fillStyle = grad;
                    ctx.fillRect(x, y - 1, streak.width, 2);
                });
            }

            const sweepPhase = (elapsed - timing.statusStart) / (timing.statusEnd - timing.statusStart);
            if (sweepPhase > -0.15 && sweepPhase < 1.15) {
                const sweepX = -w * 0.35 + clamp(sweepPhase, 0, 1) * w * 1.7;
                const sweep = ctx.createLinearGradient(sweepX - 120, 0, sweepX + 120, 0);
                sweep.addColorStop(0, 'rgba(112, 172, 255, 0)');
                sweep.addColorStop(0.5, 'rgba(149, 205, 255, 0.18)');
                sweep.addColorStop(1, 'rgba(112, 172, 255, 0)');
                ctx.fillStyle = sweep;
                ctx.fillRect(sweepX - 120, h * 0.35, 240, h * 0.24);
            }

            const centerBloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.23);
            centerBloom.addColorStop(0, `rgba(124, 183, 255, ${0.24 * gridRamp})`);
            centerBloom.addColorStop(0.45, `rgba(97, 150, 248, ${0.08 * gridRamp})`);
            centerBloom.addColorStop(1, 'rgba(40, 88, 190, 0)');
            ctx.fillStyle = centerBloom;
            ctx.fillRect(cx - w * 0.3, cy - h * 0.24, w * 0.6, h * 0.48);
        };

        resize();
        window.addEventListener('resize', resize);

        if (reducedMotion) {
            drawScene(timing.totalMs * 0.45);
            return () => window.removeEventListener('resize', resize);
        }

        let lastDomUpdateAt = 0;
        const animate = (now) => {
            const elapsed = now - state.startedAt;
            if (now - lastDomUpdateAt > 33) {
                setElapsedMs(elapsed);
                lastDomUpdateAt = now;
            }
            drawScene(elapsed);
            rafRef.current = window.requestAnimationFrame(animate);
        };

        rafRef.current = window.requestAnimationFrame(animate);

        return () => {
            window.cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [reducedMotion, timing]);

    const iconProgress = easeOutCubic(
        (elapsedMs - timing.iconStart) / Math.max(1, timing.iconEnd - timing.iconStart)
    );
    const titleProgress = easeOutCubic(
        (elapsedMs - timing.titleStart) / Math.max(1, timing.titleEnd - timing.titleStart)
    );
    const statusProgress = easeOutCubic(
        (elapsedMs - timing.statusStart) / Math.max(1, timing.statusEnd - timing.statusStart)
    );

    return (
        <div
            className={`boot-overlay-cinematic ${isExiting ? 'boot-overlay-cinematic-exit' : ''}`}
            style={{
                '--boot-icon-delay': `${timing.iconStart}ms`,
                '--boot-icon-duration': `${Math.max(120, timing.iconEnd - timing.iconStart)}ms`,
                '--boot-tile-delay': `${timing.iconStart + 160}ms`,
                '--boot-title-delay': `${timing.titleStart}ms`,
                '--boot-subtitle-delay': `${timing.titleStart + 190}ms`,
                '--boot-status-delay': `${timing.statusStart}ms`,
                '--boot-status-width': `${Math.max(220, Math.min(420, statusProgress * 420))}px`,
            }}
        >
            <canvas ref={canvasRef} className="boot-canvas" aria-hidden="true" />

            <div className="boot-centerpiece">
                <div className="boot-icon-assembly-shell">
                    <span className="boot-square boot-square-a" />
                    <span className="boot-square boot-square-b" />
                    <span className="boot-square boot-square-c" />
                    <span className="boot-square boot-square-d" />

                    <div
                        className="boot-icon-tile"
                        style={{
                            opacity: iconProgress,
                            transform: `scale(${0.92 + iconProgress * 0.08})`,
                        }}
                    >
                        <img
                            src="/OpsBoard_Brand_Pack/assets/png/opsboard-icon-512.png"
                            alt="OpsBoard"
                            className="boot-icon-image"
                            draggable={false}
                        />
                    </div>
                </div>

                <div className="boot-copy">
                    <h1
                        className="boot-title"
                        style={{
                            opacity: titleProgress,
                            transform: `translateY(${(1 - titleProgress) * 10}px)`,
                        }}
                    >
                        OpsBoard
                    </h1>
                    <p
                        className="boot-subtitle"
                        style={{
                            opacity: titleProgress,
                            transform: `translateY(${(1 - titleProgress) * 8}px)`,
                        }}
                    >
                        ENTERPRISE PLATFORM
                    </p>
                    <div
                        className="boot-status-line"
                        style={{
                            opacity: statusProgress,
                            transform: `translateY(${(1 - statusProgress) * 6}px)`,
                        }}
                    >
                        INITIALIZING TASK ORCHESTRATION ENGINE
                        <span className="boot-status-caret" />
                    </div>
                </div>
            </div>
        </div>
    );
}

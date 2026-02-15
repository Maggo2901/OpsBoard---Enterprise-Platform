import React, { useEffect, useState } from "react";

/**
 * SplashIntro (Dark Tech Glow)
 * - Fullscreen overlay
 * - Cinematic sweep + glow pulse
 * - Auto hides after ~2.6s
 */
export function SplashIntro({ onDone }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true);
      onDone?.();
    }, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  if (done) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#070B14]">
      {/* grid */}
      <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_20%,rgba(79,124,255,0.18),transparent_55%),radial-gradient(circle_at_70%_60%,rgba(111,164,255,0.12),transparent_55%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />

      {/* sweeping light bars */}
      <div className="absolute -left-1/2 top-1/4 h-[2px] w-[200%] bg-gradient-to-r from-transparent via-[rgba(79,124,255,0.85)] to-transparent blur-[1px] animate-[ops_sweep_1_1.3s_ease-in-out_0.25s_1]" />
      <div className="absolute -left-1/2 top-2/3 h-[2px] w-[200%] bg-gradient-to-r from-transparent via-[rgba(111,164,255,0.65)] to-transparent blur-[1px] animate-[ops_sweep_2_1.45s_ease-in-out_0.35s_1]" />

      {/* particles */}
      <div className="absolute inset-0 opacity-35 animate-[ops_particles_2.2s_ease-in-out_0s_1] [background-image:radial-gradient(rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:22px_22px]" />

      {/* center logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-4 opacity-0 translate-y-2 scale-[0.98] animate-[ops_logo_in_0.9s_ease-out_0.35s_forwards]">
          <img
            src="/brand/opsboard-icon-192.png"
            alt="OpsBoard"
            className="h-16 w-16 drop-shadow-[0_0_22px_rgba(79,124,255,0.55)]"
          />
          <div className="leading-tight">
            <div className="text-[28px] font-semibold text-[#D6E2FF] drop-shadow-[0_0_18px_rgba(79,124,255,0.35)]">
              OpsBoard
            </div>
            <div className="text-[11px] tracking-[0.28em] uppercase text-[#6F8AC9]">
              Enterprise Platform
            </div>
            <div className="mt-2 text-[10px] tracking-[0.22em] uppercase text-[#42527A]">
              Enterprise Task Orchestration
            </div>
          </div>
        </div>
      </div>

      {/* fade out */}
      <div className="absolute inset-0 pointer-events-none opacity-0 animate-[ops_fade_0.7s_ease-in_2s_forwards] bg-[#070B14]" />

      <style>{`
        @keyframes ops_sweep_1 { 
          0%{ transform:translateX(-20%) scaleX(0.6); opacity:0; }
          35%{ opacity:1; }
          100%{ transform:translateX(20%) scaleX(1.05); opacity:0; }
        }
        @keyframes ops_sweep_2 { 
          0%{ transform:translateX(25%) scaleX(0.6); opacity:0; }
          35%{ opacity:1; }
          100%{ transform:translateX(-25%) scaleX(1.05); opacity:0; }
        }
        @keyframes ops_logo_in {
          0%{ opacity:0; transform:translateY(10px) scale(0.96); }
          100%{ opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes ops_particles {
          0%{ opacity:0; transform:scale(1.06); }
          50%{ opacity:0.35; }
          100%{ opacity:0.0; transform:scale(1.0); }
        }
        @keyframes ops_fade {
          0%{ opacity:0; }
          100%{ opacity:1; }
        }
      `}</style>
    </div>
  );
}

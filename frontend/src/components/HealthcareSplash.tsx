import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HealthcareSplashProps {
  onComplete: () => void;
}

export function HealthcareSplash({ onComplete }: HealthcareSplashProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2400;
    const target = 70;
    let rafId: number;
    const start = performance.now();

    const animate = (time: number) => {
      const elapsed = Math.min(time - start, duration);
      const next = Math.round((elapsed / duration) * target);
      setProgress(next);
      if (elapsed < duration) {
        rafId = window.requestAnimationFrame(animate);
      }
    };

    rafId = window.requestAnimationFrame(animate);
    const timer = window.setTimeout(onComplete, duration + 200);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-4 py-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="healthcare-splash"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full max-w-4xl overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900/95 shadow-[0_50px_120px_-30px_rgba(15,23,42,0.9)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_35%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.14),transparent_30%)]" />

          <div className="relative grid gap-8 px-6 py-10 sm:grid-cols-[1.1fr_auto] sm:px-10 sm:py-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 rounded-3xl bg-white/5 px-4 py-2 text-sm uppercase tracking-[0.3em] text-slate-300/90">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.45)]" />
                Healthcare Visualization
              </div>

              <div>
                <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
                  Preparing your care dashboard
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300/90">
                  A 3D healthcare scene is loading to give you an immersive preview before your dashboard appears. This transition helps set the tone for medical policy insights and patient coverage analytics.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_-30px_rgba(255,255,255,0.45)]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Launch progress</p>
                    <p className="mt-2 text-base font-medium text-slate-100">Loading your healthcare workspace</p>
                  </div>
                  <div className="text-sm font-semibold text-blue-300">{progress}%</div>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-slate-300 shadow-[0_0_20px_rgba(59,130,246,0.45)] transition-all duration-200 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 -left-4 -top-4 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute -right-10 top-24 w-44 h-44 rounded-full bg-slate-200/5 blur-3xl" />

              <div className="relative w-full max-w-[320px]">
                <div className="relative mx-auto h-[320px] w-[320px] rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-900 to-blue-700/10 shadow-[inset_0_0_120px_rgba(59,130,246,0.12)]">
                  <div
                    className="absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.18),transparent_35%)]"
                  />

                  <div className="absolute left-8 top-8 h-32 w-32 rounded-[28px] bg-gradient-to-br from-slate-800 via-blue-500 to-indigo-500 shadow-2xl shadow-blue-900/40" style={{ transform: "perspective(800px) rotateX(22deg) rotateY(-20deg)" }} />
                  <div className="absolute right-6 top-20 h-20 w-20 rounded-[24px] bg-white/90 shadow-lg shadow-slate-900/20" style={{ transform: "perspective(800px) rotateX(16deg) rotateY(12deg)" }} />
                  <div className="absolute left-16 bottom-16 h-16 w-16 rounded-full bg-blue-400/80 shadow-xl shadow-blue-400/30" style={{ transform: "perspective(800px) rotateX(12deg) rotateY(32deg)" }} />

                  <div className="absolute left-14 top-32 flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-950/70 border border-white/10 shadow-xl shadow-slate-950/40" style={{ transform: "perspective(800px) rotateX(12deg) rotateY(-18deg)" }}>
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/95 text-blue-700 shadow-inner shadow-blue-500/10">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-9 w-9">
                        <path d="M12 7v10M7 12h10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute right-10 top-12 h-14 w-14 rounded-2xl bg-indigo-500/80 shadow-[0_20px_40px_-16px_rgba(99,102,241,0.6)]" style={{ transform: "perspective(800px) rotateX(25deg) rotateY(18deg)" }} />
                  <div className="absolute -right-6 bottom-24 h-10 w-10 rounded-full bg-slate-100/20 shadow-lg shadow-blue-500/20" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

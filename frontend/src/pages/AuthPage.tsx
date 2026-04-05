import { useState, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity } from "lucide-react";

interface AuthPageProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  onAuthSuccess?: () => void;
}

function SpinnerLoader() {
  return (
    <div className="relative w-5 h-5">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent border-t-white"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[3px] rounded-full border-2 border-transparent border-b-blue-300"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

const SceneBackground = (() => {
  let Component: typeof import("@/components/SceneBackground").SceneBackground | null = null;
  let promise: Promise<void> | null = null;

  return function LazySceneBackground() {
    if (!Component) {
      if (!promise) {
        promise = import("@/components/SceneBackground").then((mod) => {
          Component = mod.SceneBackground;
        });
      }
      throw promise;
    }
    return <Component />;
  };
})();

export function AuthPage({ onSignIn, onSignUp, onAuthSuccess }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await onSignUp(email, password);
        if (result.needsConfirmation) {
          setMessage("Check your email to confirm your account.");
        }
      } else {
        await onSignIn(email, password);
        onAuthSuccess?.();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4 relative overflow-hidden">
      <Suspense fallback={null}>
        <SceneBackground />
      </Suspense>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.06)_0%,transparent_50%)]" />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-3 mb-5">
            <motion.div
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-[#0000FF] flex items-center justify-center shadow-lg shadow-blue-500/20"
              whileHover={{ rotate: 12, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Activity className="w-6 h-6 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              PolicyPulse
            </h1>
          </div>
          <p className="text-slate-600 text-sm tracking-wide">
            Understand your drug coverage in plain English
          </p>
        </motion.div>

        <motion.div
          className="rounded-2xl p-8 bg-white/80 backdrop-blur-xl border border-slate-200 shadow-xl"
          onMouseMove={handleMouseMove}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={isSignUp ? "signup" : "signin"}
              className="text-xl font-semibold text-slate-900 mb-6 tracking-tight"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {isSignUp ? "Create Account" : "Sign In"}
            </motion.h2>
          </AnimatePresence>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 tracking-wide">
                Email
              </label>
              <motion.div
                animate={{
                  borderColor: focusedField === "email" ? "rgba(59,130,246,0.5)" : "rgba(100,116,139,0.2)",
                  boxShadow: focusedField === "email" ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
                }}
                transition={{ duration: 0.2 }}
                className="rounded-xl overflow-hidden"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </motion.div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 tracking-wide">
                Password
              </label>
              <motion.div
                animate={{
                  borderColor: focusedField === "password" ? "rgba(59,130,246,0.5)" : "rgba(100,116,139,0.2)",
                  boxShadow: focusedField === "password" ? "0 0 0 3px rgba(59,130,246,0.1)" : "none",
                }}
                transition={{ duration: 0.2 }}
                className="rounded-xl overflow-hidden"
              >
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </motion.div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg"
                >
                  {error}
                </motion.p>
              )}
              {message && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg"
                >
                  {message}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-[#0000FF] text-white rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/15"
            >
              {loading && <SpinnerLoader />}
              {isSignUp ? "Create Account" : "Sign In"}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <motion.button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setMessage("");
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

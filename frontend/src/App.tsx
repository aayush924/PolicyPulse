import { useState, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ChatPage } from "@/pages/ChatPage";
import { Header } from "@/components/Header";
import { HealthcareSplash } from "@/components/HealthcareSplash";
import type { AppTab } from "@/components/Header";
import { CustomCursor } from "@/components/CustomCursor";
import { Activity, Bot } from "lucide-react";

const SceneBackground = lazy(() =>
  import("@/components/SceneBackground").then((mod) => ({
    default: mod.SceneBackground,
  })),
);

export default function App() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [chatFocusConversationId, setChatFocusConversationId] = useState<string | null>(null);
  const [initialChatQuestion, setInitialChatQuestion] = useState<string>("");
  const [showSplash, setShowSplash] = useState(false);

  const handleFocusConversationHandled = useCallback(() => {
    setChatFocusConversationId(null);
    setInitialChatQuestion("");
  }, []);

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 relative overflow-hidden">
        <CustomCursor />
        
        {/* Background gradient effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-200/20 via-transparent to-blue-300/10"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        
        <motion.div
          className="flex flex-col items-center gap-8 relative z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Logo animation */}
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-[#0000FF] flex items-center justify-center shadow-2xl shadow-blue-500/30"
              animate={{ 
                rotate: [0, 8, -8, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <Activity className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-2xl bg-blue-500/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-blue-500/0"
              animate={{ 
                borderColor: ["rgba(59,130,246,0)", "rgba(59,130,246,0.4)", "rgba(59,130,246,0)"],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* App name */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.h1 
              className="text-4xl sm:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700"
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              PolicyPulse
            </motion.h1>
            <motion.p 
              className="text-slate-600 text-sm sm:text-base tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Understanding drug coverage
            </motion.p>
          </motion.div>

          {/* Progress bar */}
          <div className="w-32 sm:w-40 h-1 mt-4">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-[#0000FF]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          <motion.p 
            className="text-xs sm:text-sm text-slate-500 mt-4"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Initializing…
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!auth.user || !auth.token) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CustomCursor />
          <AuthPage onSignIn={auth.signIn} onSignUp={auth.signUp} onAuthSuccess={() => setShowSplash(true)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (auth.user && auth.token && showSplash) {
    return <HealthcareSplash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <CustomCursor />

      <Suspense fallback={null}>
        <SceneBackground />
      </Suspense>

      <Header
        email={auth.user.email}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={auth.signOut}
      />

      {activeTab === "dashboard" && (
        <motion.button
          type="button"
          onClick={() => setActiveTab("chat")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-2xl shadow-blue-500/25 transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Bot className="w-4 h-4" />
          <span>Care Assistant</span>
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "dashboard" ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex-1 relative z-10"
          >
            <DashboardPage
              token={auth.token}
              onGoToChat={() => setActiveTab("chat")}
              onOpenConversation={(id) => {
                setChatFocusConversationId(id);
                setActiveTab("chat");
              }}
              onNavigateToChat={(question) => {
                setInitialChatQuestion(question);
                setActiveTab("chat");
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex-1 flex flex-col relative z-10 pt-16"
          >
            <ChatPage
              token={auth.token}
              focusConversationId={chatFocusConversationId}
              onFocusConversationHandled={handleFocusConversationHandled}
              initialQuestion={initialChatQuestion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

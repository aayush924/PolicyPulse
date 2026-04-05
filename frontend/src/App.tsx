import { useState, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ChatPage } from "@/pages/ChatPage";
import { Header } from "@/components/Header";
import type { AppTab } from "@/components/Header";
import { CustomCursor } from "@/components/CustomCursor";
import { Activity } from "lucide-react";

const SceneBackground = lazy(() =>
  import("@/components/SceneBackground").then((mod) => ({
    default: mod.SceneBackground,
  })),
);

export default function App() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [chatFocusConversationId, setChatFocusConversationId] = useState<string | null>(null);

  const handleFocusConversationHandled = useCallback(() => {
    setChatFocusConversationId(null);
  }, []);

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black noise-overlay">
        <CustomCursor />
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative">
            <motion.div
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-[#0000FF] flex items-center justify-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Activity className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div
              className="absolute inset-0 rounded-2xl bg-blue-500/20"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="flex flex-col items-center gap-3">
            <motion.span
              className="text-lg font-semibold text-white/80 tracking-tight"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              PolicyPulse
            </motion.span>
            <div className="w-32 h-1 progress-bar">
              <motion.div
                className="progress-bar-fill h-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
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
          <AuthPage onSignIn={auth.signIn} onSignUp={auth.signUp} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black noise-overlay">
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ChatPage } from "@/pages/ChatPage";
import { Header } from "@/components/Header";
import type { AppTab } from "@/components/Header";

export default function App() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [chatFocusConversationId, setChatFocusConversationId] = useState<string | null>(null);

  const handleFocusConversationHandled = useCallback(() => {
    setChatFocusConversationId(null);
  }, []);

  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!auth.user || !auth.token) {
    return <AuthPage onSignIn={auth.signIn} onSignUp={auth.signUp} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        email={auth.user.email}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={auth.signOut}
      />
      {activeTab === "dashboard" ? (
        <DashboardPage
          token={auth.token}
          onGoToChat={() => setActiveTab("chat")}
          onOpenConversation={(id) => {
            setChatFocusConversationId(id);
            setActiveTab("chat");
          }}
        />
      ) : (
        <ChatPage
          token={auth.token}
          focusConversationId={chatFocusConversationId}
          onFocusConversationHandled={handleFocusConversationHandled}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/pages/AuthPage";
import { SearchPage } from "@/pages/SearchPage";
import { ChatPage } from "@/pages/ChatPage";
import { Header } from "@/components/Header";
import type { AppTab } from "@/components/Header";

export default function App() {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>("search");

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
      {activeTab === "search" ? (
        <SearchPage token={auth.token} />
      ) : (
        <ChatPage token={auth.token} />
      )}
    </div>
  );
}

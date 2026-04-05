import { useAuth } from "@/hooks/useAuth";
import { AuthPage } from "@/pages/AuthPage";
import { SearchPage } from "@/pages/SearchPage";
import { Header } from "@/components/Header";

export default function App() {
  const auth = useAuth();

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
    <div className="min-h-screen">
      <Header email={auth.user.email} onSignOut={auth.signOut} />
      <SearchPage token={auth.token} />
    </div>
  );
}

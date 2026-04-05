import { Activity, LogOut, LayoutDashboard, MessageSquare } from "lucide-react";

export type AppTab = "dashboard" | "chat";

interface HeaderProps {
  email: string;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onSignOut: () => void;
}

export function Header({ email, activeTab, onTabChange, onSignOut }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-semibold text-slate-900">PolicyPulse</span>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => onTabChange("dashboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => onTabChange("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{email}</span>
          <button
            onClick={onSignOut}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

import { motion } from "framer-motion";
import { Activity, LogOut, LayoutDashboard, Bot } from "lucide-react";

export type AppTab = "dashboard" | "chat";

interface HeaderProps {
  email: string;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onSignOut: () => void;
}

const tabs: { id: AppTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Header({ email, activeTab, onTabChange, onSignOut }: HeaderProps) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-slate-200"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <motion.div
            className="flex items-center gap-2.5 shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-[#0000FF] flex items-center justify-center shrink-0"
              whileHover={{ rotate: 12 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Activity className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 hidden sm:block">
              PolicyPulse
            </span>
          </motion.div>

          <nav className="relative flex items-center gap-0.5 bg-slate-100 rounded-xl p-1 border border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative z-10 flex items-center gap-1 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-[#0000FF]/60 rounded-lg"
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-slate-600 hidden md:block font-medium tracking-wide truncate max-w-[200px]">
            {email}
          </span>
          <motion.button
            onClick={onSignOut}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1 text-xs sm:text-sm text-slate-600 hover:text-red-600 transition-colors px-2 sm:px-3 py-1.5 rounded-lg hover:bg-red-50"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign Out</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

import { motion } from "framer-motion";
import { Activity, LogOut, LayoutDashboard, MessageSquare } from "lucide-react";

export type AppTab = "dashboard" | "chat";

interface HeaderProps {
  email: string;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onSignOut: () => void;
}

const tabs: { id: AppTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Chat", icon: MessageSquare },
];

export function Header({ email, activeTab, onTabChange, onSignOut }: HeaderProps) {
  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-2xl border-b border-white/[0.04]"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <motion.div
            className="flex items-center gap-2.5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-[#0000FF] flex items-center justify-center"
              whileHover={{ rotate: 12 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Activity className="w-4 h-4 text-white" />
            </motion.div>
            <span className="text-base font-semibold tracking-tight text-white/90">
              PolicyPulse
            </span>
          </motion.div>

          <nav className="relative flex items-center gap-0.5 bg-white/[0.03] rounded-xl p-1 border border-white/[0.04]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
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
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-white/30 hidden sm:block font-medium tracking-wide">
            {email}
          </span>
          <motion.button
            onClick={onSignOut}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-sm text-white/30 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign Out</span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}

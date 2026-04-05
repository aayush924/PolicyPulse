import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  type Variants,
} from "framer-motion";
import {
  MessageSquare,
  ArrowRight,
  Sparkles,
  FileText,
  Shield,
  Check,
  Table2,
  TrendingUp,
  Database,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { listConversations, fetchPolicyCrossReference } from "@/lib/api";
import type { Conversation, PolicyCrossRefResponse } from "@/types";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { FAQSection } from "@/components/FAQSection";
import { PolicyComparison } from "@/components/PolicyComparison";

interface DashboardPageProps {
  token: string;
  onGoToChat: () => void;
  onOpenConversation: (id: string) => void;
  onNavigateToChat?: (question: string) => void;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const CHART_COLORS = [
  "#3b82f6", "#6366f1", "#0000FF", "#1e3a8a",
  "#06b6d4", "#14b8a6", "#8b5cf6", "#a855f7",
];

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value, duration]);

  return <span ref={ref}>{display}</span>;
}

function ProgressBar({ value, max, delay = 0 }: { value: number; max: number; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div ref={ref} className="progress-bar h-1 w-full">
      <motion.div
        className="progress-bar-fill"
        initial={{ width: "0%" }}
        animate={inView ? { width: `${pct}%` } : {}}
        transition={{ duration: 1.4, delay, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  );
}

function OrbitalLoader({ size = 40 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full border border-blue-500/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[3px] rounded-full border border-transparent border-t-blue-500 border-r-blue-400/50"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute inset-[8px] rounded-full border border-transparent border-b-[#0000FF]/60"
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

export function DashboardPage({
  token,
  onGoToChat,
  onOpenConversation,
  onNavigateToChat,
}: DashboardPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [crossRef, setCrossRef] = useState<PolicyCrossRefResponse | null>(null);
  const [crossRefLoading, setCrossRefLoading] = useState(true);
  const [crossRefError, setCrossRefError] = useState("");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [expandedPolicy, setExpandedPolicy] = useState(false);
  const [activeBarIdx, setActiveBarIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const convs = await listConversations(token);
        if (!cancelled) setConversations(convs.slice(0, 6));
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCrossRefError("");
      setCrossRefLoading(true);
      try {
        const data = await fetchPolicyCrossReference(token);
        if (!cancelled) setCrossRef(data);
      } catch {
        if (!cancelled) {
          setCrossRef(null);
          setCrossRefError("Could not load coverage cross-reference.");
        }
      } finally {
        if (!cancelled) setCrossRefLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function sourceLabel(s: string) {
    if (s === "seed") return "Demo";
    if (s === "ingested") return "Ingested";
    return s;
  }

  const handleCardRipple = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--ripple-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--ripple-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }, []);

  const coveredCount = crossRef?.coverage.flat().filter(Boolean).length ?? 0;
  const totalPolicies = crossRef?.entries.length ?? 0;
  const totalPayers = crossRef?.payers.length ?? 0;
  const totalDrugs = crossRef?.drugs.length ?? 0;

  const payerChartData = crossRef
    ? crossRef.payers.map((payer, j) => ({
        name: payer.length > 16 ? payer.slice(0, 14) + "…" : payer,
        fullName: payer,
        policies: crossRef.drugs.filter((_, i) => crossRef.coverage[i]?.[j]).length,
      }))
    : [];

  const chatTrendData = useMemo(() => {
    const monthLabels = Array.from({ length: 6 }, (_, index) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - index));
      return d.toLocaleString(undefined, { month: "short" });
    });

    const counts = monthLabels.reduce<Record<string, number>>((acc, label) => {
      acc[label] = 0;
      return acc;
    }, {});

    conversations.forEach((conversation) => {
      const date = new Date(conversation.updated_at);
      const label = date.toLocaleString(undefined, { month: "short" });
      if (label in counts) {
        counts[label] += 1;
      }
    });

    return monthLabels.map((label) => ({ month: label, conversations: counts[label] ?? 0 }));
  }, [conversations]);

  const sourceMixData = useMemo(() => {
    if (!crossRef) return [];

    const totals = crossRef.entries.reduce<Record<string, number>>((acc, entry) => {
      entry.sources.forEach((source) => {
        const key = source === "seed" ? "Demo" : source === "ingested" ? "Ingested" : source;
        acc[key] = (acc[key] || 0) + 1;
      });
      return acc;
    }, {});

    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [crossRef]);

  const topDrugCoverageData = useMemo(() => {
    if (!crossRef) return [];

    return crossRef.drugs
      .map((drug, i) => ({
        drug: drug.length > 16 ? drug.slice(0, 14) + "…" : drug,
        coverage: crossRef.coverage[i]?.filter(Boolean).length ?? 0,
      }))
      .sort((a, b) => b.coverage - a.coverage)
      .slice(0, 5);
  }, [crossRef]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 pt-20 sm:pt-24 pb-12 sm:pb-16 relative z-10 bg-white">
      {/* ── Hero Section ──────────────────────────────────── */}
      <motion.section
        className="mb-12 sm:mb-16"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.7 }}>
          <p className="text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-blue-600 mb-3 sm:mb-4">
            Intelligence Platform
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] mb-4 sm:mb-6 text-slate-900">
            <GradientText>Policy coverage,</GradientText>
            <br />
            <GradientText delay={0.15}>decoded.</GradientText>
          </h1>
          <motion.p
            className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Ask questions about drug coverage, prior authorization, and step
            therapy in plain language.
          </motion.p>
        </motion.div>
      </motion.section>

      {/* ── Bento Grid ────────────────────────────────────── */}
      <motion.div
        className="bento-grid mb-12 sm:mb-16"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        {/* CTA Card — spans 2 columns */}
        <GlassCard className="bento-span-2 bento-row-2 p-6 sm:p-8" delay={0} onClick={onGoToChat}>
          <motion.div
            className="relative h-full p-0 sm:p-2 flex flex-col justify-between overflow-hidden"
            onMouseMove={handleCardRipple}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-[#0000FF]/5" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-blue-500/5 blur-3xl" />

            <div className="relative space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 text-blue-600 text-xs sm:text-sm font-medium tracking-wide">
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </motion.span>
                  Policy Assistant
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Open chat</h2>
                <p className="text-slate-600 text-xs sm:text-sm max-w-md leading-relaxed">
                Start a new conversation or continue one from the sidebar—ask
                about specific drugs, payers, or upload a policy document.
              </p>
            </div>

            <motion.div
              className="relative flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6"
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-xs sm:text-sm font-medium text-blue-400">Get started</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
            </motion.div>
          </motion.div>
        </GlassCard>

        {/* Stats cards */}
        {[
          { icon: Database, label: "Total policies", value: totalPolicies, max: totalPolicies, gradient: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400" },
          { icon: TrendingUp, label: "Covered pairs", value: coveredCount, max: totalDrugs * totalPayers, gradient: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-400" },
        ].map((stat, idx) => (
          <GlassCard key={stat.label} className="p-5 sm:p-6" delay={0.1 + idx * 0.1}>
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3 sm:mb-4`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              <AnimatedCounter value={stat.value} />
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-2 sm:mb-3 uppercase tracking-wider font-medium">{stat.label}</p>
            <ProgressBar value={stat.value} max={stat.max} delay={idx * 0.15} />
          </GlassCard>
        ))}

        {/* Feature cards */}
        {[
          {
            icon: Shield,
            title: "Coverage questions",
            desc: '"Which policies cover Botox?" or "What is step therapy for Humira?"',
            gradient: "from-blue-500/15 to-blue-500/5",
            iconColor: "text-blue-400",
            onClick: () => {
              if (onNavigateToChat) {
                onNavigateToChat(
                  "Please help me understand which drugs are covered by these policies and how coverage varies by payer."
                );
              } else {
                onGoToChat();
              }
            },
          },
          {
            icon: Shield,
            title: "Prior authorization",
            desc: "Explain prior authorization rules, required steps, and how to get approvals faster.",
            gradient: "from-cyan-500/15 to-cyan-500/5",
            iconColor: "text-cyan-400",
            onClick: () => {
              if (onNavigateToChat) {
                onNavigateToChat(
                  "Explain prior authorization for prescription drugs and how I can get approvals or appeal denials."
                );
              } else {
                onGoToChat();
              }
            },
          },
          {
            icon: FileText,
            title: "Documents",
            desc: "Attach PDFs in chat so answers can reference your uploaded policy text.",
            gradient: "from-indigo-500/15 to-indigo-500/5",
            iconColor: "text-indigo-400",
            onClick: () => onNavigateToChat?.("I want to upload a PDF and ask questions about my coverage policy."),
          },
        ].map((card, idx) => (
          <GlassCard key={card.title} className="p-6 cursor-pointer" delay={0.3 + idx * 0.1} onClick={card.onClick}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 tracking-tight">{card.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
          </GlassCard>
        ))}

        {[
          { icon: Users, label: "Payers", value: totalPayers, max: totalPayers, gradient: "from-violet-500/20 to-violet-500/5", iconColor: "text-violet-400" },
          { icon: MessageSquare, label: "Conversations", value: conversations.length, max: Math.max(conversations.length, 10), gradient: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-400" },
        ].map((stat, idx) => (
          <GlassCard key={stat.label} className="p-6" delay={0.5 + idx * 0.1}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              <AnimatedCounter value={stat.value} />
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-3 uppercase tracking-wider font-medium">{stat.label}</p>
            <ProgressBar value={stat.value} max={stat.max} delay={0.5 + idx * 0.15} />
          </GlassCard>
        ))}      </motion.div>

      {/* ── Recent Conversations ──────────────────────────── */}
      <motion.section
        className="mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        <motion.div className="flex items-center justify-between mb-6" variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Recent chats</h2>
          </div>
          <motion.button
            type="button"
            onClick={onGoToChat}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-xs font-medium text-blue-500/80 hover:text-blue-600 transition-colors tracking-wider uppercase"
          >
            View all
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <OrbitalLoader size={40} />
          </div>
        ) : conversations.length === 0 ? (
          <GlassCard className="p-12 text-center">
            <p className="text-sm text-slate-500">No conversations yet. Open chat to get started.</p>
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {conversations.map((c, i) => (
                <GlassCard key={c.id} delay={i * 0.06} onClick={() => onOpenConversation(c.id)} className="p-5">
                  <p className="font-medium text-slate-900 truncate text-sm tracking-tight">
                    {c.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    {formatTime(c.updated_at)}
                  </p>
                </GlassCard>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* ── Insights Grid ────────────────────────────────── */}
      {!crossRefLoading && !crossRefError && payerChartData.length > 0 && (
        <motion.section
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={stagger}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-5">
            <div>
              <p className="text-xs sm:text-sm font-medium tracking-[0.2em] uppercase text-blue-600 mb-2">
                Analytics overview
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                Coverage performance and chat trends
              </h2>
            </div>
            <p className="text-sm text-slate-500 max-w-xl">
              Multiple metrics pulled from your policy cross-reference and conversation history to help you identify coverage gaps and user engagement.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <GlassCard className="p-6" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Conversation trend</p>
                  <p className="text-xs text-slate-500 mt-1">Chats opened over the last 6 months</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                  Live
                </span>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chatTrendData} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.18)",
                        background: "#0f172a",
                        color: "#f8fafc",
                      }}
                    />
                    <Line type="monotone" dataKey="conversations" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6" hover={false}>
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">Policy source mix</p>
                <p className="text-xs text-slate-500 mt-1">Demo vs ingested content distribution</p>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceMixData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {sourceMixData.map((entry, idx) => (
                        <Cell key={`slice-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.18)",
                        background: "#0f172a",
                        color: "#f8fafc",
                      }}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ color: "#64748b", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard className="p-6" hover={false}>
              <div className="mb-4">
                <p className="text-sm font-semibold text-slate-900">Top drugs by coverage</p>
                <p className="text-xs text-slate-500 mt-1">Most broadly covered drugs across payers</p>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDrugCoverageData} layout="vertical" margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="drug" type="category" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} width={110} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(148,163,184,0.18)",
                        background: "#0f172a",
                        color: "#f8fafc",
                      }}
                    />
                    <Bar dataKey="coverage" radius={[10, 10, 10, 10]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </motion.section>
      )}

      {/* ── Coverage Chart ────────────────────────────────── */}
      {!crossRefLoading && !crossRefError && payerChartData.length > 0 && (
        <motion.section
          className="mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.95 },
            visible: { 
              opacity: 1, 
              y: 0, 
              scale: 1,
              transition: { duration: 0.6, ease: "easeOut" }
            }
          }}
        >
          <GlassCard className="p-8" hover={false}>
            <motion.div 
              className="flex items-center gap-3 mb-1"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </motion.div>
              <h3 className="font-semibold text-slate-900 tracking-tight">Policies per payer</h3>
              </motion.div>
              <motion.p 
                className="text-sm text-slate-500 mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Number of drugs with coverage under each payer.
              {activeBarIdx !== null && payerChartData[activeBarIdx] && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-2 text-blue-400 font-medium"
                >
                  {payerChartData[activeBarIdx].fullName}: {payerChartData[activeBarIdx].policies} drugs
                </motion.span>
              )}
            </motion.p>
            <motion.div 
              className="h-64 origin-bottom"
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={payerChartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                  onMouseMove={(state) => {
                    if (state?.activeTooltipIndex != null) setActiveBarIdx(state.activeTooltipIndex);
                  }}
                  onMouseLeave={() => setActiveBarIdx(null)}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.25)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "rgba(255,255,255,0.25)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(59,130,246,0.04)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.06)",
                      background: "rgba(10,10,20,0.9)",
                      backdropFilter: "blur(20px)",
                      boxShadow: "0 8px 40px rgba(0,0,0,.6)",
                      fontSize: 13,
                      color: "#e2e8f0",
                    }}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName ?? ""
                    }
                  />
                  <Bar dataKey="policies" radius={[6, 6, 0, 0]} animationDuration={1600}>
                    {payerChartData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        opacity={activeBarIdx === null || activeBarIdx === idx ? 1 : 0.25}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </GlassCard>
        </motion.section>
      )}

      {/* ── Coverage Matrix ───────────────────────────────── */}
      <motion.section
        className="space-y-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={stagger}
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <Table2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Drug × payer coverage</h2>
          </div>
          <p className="text-sm text-slate-500 max-w-3xl leading-relaxed">
            Every cell shows whether we have a policy in the knowledge base for
            that drug and insurance payer.{" "}
            <span className="text-blue-400/70">Demo</span> = bundled sample policies;{" "}
            <span className="text-indigo-400/70">Ingested</span> = chunks from PDFs you uploaded.
          </p>
        </motion.div>

        {crossRefLoading ? (
          <GlassCard className="flex flex-col items-center justify-center gap-4 py-20" hover={false}>
            <OrbitalLoader size={48} />
            <motion.p
              className="text-sm text-slate-500"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading coverage data…
            </motion.p>
          </GlassCard>
        ) : crossRefError ? (
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3"
          >
            {crossRefError}
          </motion.div>
        ) : crossRef && crossRef.drugs.length > 0 && crossRef.payers.length > 0 ? (
          <>
            <GlassCard className="overflow-hidden" hover={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-600 border-r border-slate-200 min-w-[12rem] text-xs uppercase tracking-wider">
                        Drug
                      </th>
                      {crossRef.payers.map((payer) => (
                        <th
                          key={payer}
                          className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap max-w-[10rem] text-xs uppercase tracking-wider"
                          title={payer}
                        >
                          <span className="line-clamp-2">{payer}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crossRef.drugs.map((drug, i) => (
                      <motion.tr
                        key={drug}
                        className="border-b border-slate-200 last:border-0"
                        style={{
                          backgroundColor: hoveredRow === i ? "rgba(59,130,246,0.03)" : "transparent",
                        }}
                        initial={{ opacity: 0, x: -12 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.04, duration: 0.35 }}
                        onMouseEnter={() => setHoveredRow(i)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <td className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 font-medium text-slate-700 border-r border-slate-200 align-top text-sm">
                          {drug}
                        </td>
                        {crossRef.payers.map((payer, j) => {
                          const ok = crossRef.coverage[i]?.[j];
                          return (
                            <td key={payer} className="px-2 py-2.5 text-center align-middle">
                              {ok ? (
                                <motion.span
                                  initial={{ scale: 0, rotate: -90 }}
                                  whileInView={{ scale: 1, rotate: 0 }}
                                  viewport={{ once: true }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 20,
                                    delay: i * 0.03 + j * 0.02,
                                  }}
                                  whileHover={{ scale: 1.3 }}
                                  className="inline-flex"
                                >
                                  <Check
                                    className="w-5 h-5 text-emerald-400 mx-auto"
                                    aria-label={`${drug} covered under ${payer}`}
                                  />
                                </motion.span>
                              ) : (
                                <span className="text-slate-400/70" aria-hidden>—</span>
                              )}
                            </td>
                          );
                        })}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Policy list (collapsible) */}
            <GlassCard className="overflow-hidden" hover={false}>
              <motion.button
                type="button"
                onClick={() => setExpandedPolicy((v) => !v)}
                whileTap={{ scale: 0.998 }}
                className="w-full px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between select-none"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Policy list</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    One row per drug–payer pair ({crossRef.entries.length} total)
                  </p>
                </div>
                <motion.span
                  animate={{ rotate: expandedPolicy ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-slate-400"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </motion.span>
              </motion.button>
              <AnimatePresence initial={false}>
                {expandedPolicy && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500 border-b border-slate-200">
                            <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider">Drug</th>
                            <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider">Payer</th>
                            <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider">HCPCS</th>
                            <th className="px-4 py-2 font-medium text-xs uppercase tracking-wider">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crossRef.entries.map((e, idx) => (
                            <motion.tr
                              key={`${e.drug_name}-${e.payer_name}-${idx}`}
                              className="border-b border-slate-200 hover:bg-slate-100 transition-colors"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.02 }}
                            >
                              <td className="px-4 py-2.5 text-slate-700">{e.drug_name}</td>
                              <td className="px-4 py-2.5 text-slate-500">{e.payer_name}</td>
                              <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{e.hcpcs_code ?? "—"}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex flex-wrap gap-1">
                                  {e.sources.map((s) => (
                                    <span
                                      key={s}
                                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${
                                        s === "seed"
                                  ? "bg-slate-100 text-slate-500"
                                          : "bg-blue-500/10 text-blue-400/80"
                                      }`}
                                    >
                                      {sourceLabel(s)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </>
        ) : (
          <motion.p variants={fadeUp} transition={{ duration: 0.4 }} className="text-sm text-slate-500">
          </motion.p>
        )}
      </motion.section>

      {/* ── Policy Comparison ───────────────────────────────── */}
      <PolicyComparison
        token={token}
        crossRef={crossRef}
      />

      {/* ── FAQ Section ───────────────────────────────────── */}
      <FAQSection onNavigateWithQuestion={onNavigateToChat} />
    </main>
  );
}

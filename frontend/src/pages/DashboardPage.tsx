import { useEffect, useState } from "react";
import {
  MessageSquare,
  ArrowRight,
  Loader2,
  Sparkles,
  FileText,
  Shield,
  Check,
  Table2,
} from "lucide-react";
import { listConversations, fetchPolicyCrossReference } from "@/lib/api";
import type { Conversation, PolicyCrossRefResponse } from "@/types";

interface DashboardPageProps {
  token: string;
  onGoToChat: () => void;
  onOpenConversation: (id: string) => void;
}

export function DashboardPage({ token, onGoToChat, onOpenConversation }: DashboardPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [crossRef, setCrossRef] = useState<PolicyCrossRefResponse | null>(null);
  const [crossRefLoading, setCrossRefLoading] = useState(true);
  const [crossRefError, setCrossRefError] = useState("");

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
    return () => {
      cancelled = true;
    };
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
    return () => {
      cancelled = true;
    };
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

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-12">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-500 text-lg max-w-xl">
              Ask questions about drug coverage, prior authorization, and step therapy in plain
              language. Your chat assistant uses the policies in our knowledge base.
            </p>
          </div>

          <button
            type="button"
            onClick={onGoToChat}
            className="w-full text-left group bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-700 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-blue-100 text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  Policy assistant
                </div>
                <h2 className="text-2xl font-semibold">Open chat</h2>
                <p className="text-blue-100 text-sm max-w-md">
                  Start a new conversation or continue one from the sidebar—ask about specific
                  drugs, payers, or upload a policy document.
                </p>
              </div>
              <span className="shrink-0 w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
                <ArrowRight className="w-6 h-6" />
              </span>
            </div>
          </button>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Coverage questions</h3>
              <p className="text-sm text-slate-500">
                e.g. &ldquo;Which policies cover Botox?&rdquo; or &ldquo;What is step therapy for
                Humira?&rdquo;
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Documents</h3>
              <p className="text-sm text-slate-500">
                Attach PDFs in chat so answers can reference your uploaded policy text.
              </p>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Recent chats
              </h2>
              <button
                type="button"
                onClick={onGoToChat}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[28rem] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-slate-400">
                  No conversations yet. Open chat to get started.
                </div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onOpenConversation(c.id)}
                    className="w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <p className="font-medium text-slate-800 truncate text-sm">{c.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatTime(c.updated_at)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Table2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Drug × payer coverage</h2>
        </div>
        <p className="text-sm text-slate-500 max-w-3xl">
          Every cell shows whether we have a policy in the knowledge base for that drug and insurance
          payer. Rows are drugs, columns are payers. <strong>Demo</strong> = bundled sample policies;{" "}
          <strong>Ingested</strong> = chunks from PDFs you uploaded via the engine.
        </p>

        {crossRefLoading ? (
          <div className="flex justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
          </div>
        ) : crossRefError ? (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            {crossRefError}
          </div>
        ) : crossRef && crossRef.drugs.length > 0 && crossRef.payers.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="sticky left-0 z-20 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 border-r border-slate-200 min-w-[12rem]">
                      Drug
                    </th>
                    {crossRef.payers.map((payer) => (
                      <th
                        key={payer}
                        className="px-3 py-3 text-center font-semibold text-slate-700 whitespace-nowrap max-w-[10rem]"
                        title={payer}
                      >
                        <span className="line-clamp-2">{payer}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {crossRef.drugs.map((drug, i) => (
                    <tr key={drug} className="border-b border-slate-100 last:border-0">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 font-medium text-slate-800 border-r border-slate-100 align-top">
                        {drug}
                      </td>
                      {crossRef.payers.map((payer, j) => {
                        const ok = crossRef.coverage[i]?.[j];
                        return (
                          <td key={payer} className="px-2 py-2.5 text-center align-middle">
                            {ok ? (
                              <Check
                                className="w-5 h-5 text-emerald-600 mx-auto"
                                aria-label={`${drug} covered under ${payer}`}
                              />
                            ) : (
                              <span className="text-slate-200" aria-hidden>
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-800">Policy list</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  One row per drug–payer pair in the index ({crossRef.entries.length} total).
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="px-4 py-2 font-medium">Drug</th>
                      <th className="px-4 py-2 font-medium">Payer</th>
                      <th className="px-4 py-2 font-medium">HCPCS</th>
                      <th className="px-4 py-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crossRef.entries.map((e, idx) => (
                      <tr key={`${e.drug_name}-${e.payer_name}-${idx}`} className="border-b border-slate-50">
                        <td className="px-4 py-2.5 text-slate-800">{e.drug_name}</td>
                        <td className="px-4 py-2.5 text-slate-600">{e.payer_name}</td>
                        <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">
                          {e.hcpcs_code ?? "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {e.sources.map((s) => (
                              <span
                                key={s}
                                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${
                                  s === "seed"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-blue-50 text-blue-700"
                                }`}
                              >
                                {sourceLabel(s)}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No policies indexed yet.</p>
        )}
      </section>
    </main>
  );
}

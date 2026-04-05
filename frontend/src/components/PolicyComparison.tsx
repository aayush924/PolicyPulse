import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Check,
  X,
  AlertTriangle,
  FileText,
  Upload,
  Search,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { comparePolicies, ingestPdf } from "@/lib/api";
import type { PolicyComparisonResponse, PolicyCrossRefResponse } from "@/types";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";

interface PolicyComparisonProps {
  token: string;
  crossRef: PolicyCrossRefResponse | null;
}

const CHART_COLORS = [
  "#3b82f6", "#6366f1", "#0000FF", "#1e3a8a",
  "#06b6d4", "#14b8a6", "#8b5cf6", "#a855f7",
];

export function PolicyComparison({
  token,
  crossRef,
}: PolicyComparisonProps) {
  const [drugName, setDrugName] = useState("");
  const [selectedPayers, setSelectedPayers] = useState<string[]>([]);
  const [comparison, setComparison] = useState<PolicyComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPayer, setUploadPayer] = useState("");

  const availablePayers = crossRef?.payers || [];

  const handleCompare = async () => {
    if (!drugName.trim() || selectedPayers.length === 0) {
      setError("Please enter a drug name and select at least one payer.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await comparePolicies(drugName.trim(), selectedPayers, token);
      setComparison(result);
    } catch (err: any) {
      setError(err.message || "Failed to compare policies");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadPayer.trim()) return;

    setLoading(true);
    setError("");
    try {
      await ingestPdf(uploadFile, uploadPayer.trim(), token);
      setShowUploader(false);
      setUploadFile(null);
      setUploadPayer("");
      // Optionally refresh the cross-reference data
      window.location.reload(); // Simple refresh for now
    } catch (err: any) {
      setError(err.message || "Failed to upload PDF");
    } finally {
      setLoading(false);
    }
  };

  const chartData = comparison?.comparisons.map((item, idx) => ({
    payer: item.payer_name.length > 12 ? item.payer_name.slice(0, 10) + "…" : item.payer_name,
    covered: item.covered ? 1 : 0,
    priorAuth: item.prior_auth_required ? 1 : 0,
    stepTherapy: item.step_therapy_required ? 1 : 0,
    fullName: item.payer_name,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  })) || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="mb-16"
    >
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <BarChart3 className="w-6 h-6 text-blue-600" />
        </motion.div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Compare <GradientText>Insurance Plans</GradientText>
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Compare coverage, requirements, and costs across multiple payers
          </p>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="space-y-6">
          {/* Input Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Drug Name
              </label>
              <input
                type="text"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="e.g., Humira, Botox, Keytruda"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Payers to Compare
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availablePayers.map((payer) => (
                  <button
                    key={payer}
                    onClick={() => {
                      setSelectedPayers(prev =>
                        prev.includes(payer)
                          ? prev.filter(p => p !== payer)
                          : [...prev, payer]
                      );
                    }}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      selectedPayers.includes(payer)
                        ? "bg-blue-100 border-blue-300 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {payer}
                  </button>
                ))}
              </div>
              {selectedPayers.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">Select payers to compare</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <motion.button
              onClick={handleCompare}
              disabled={loading || !drugName.trim() || selectedPayers.length === 0}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-[#0000FF] text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Compare Plans
            </motion.button>

            <motion.button
              onClick={() => setShowUploader(!showUploader)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload PDF
            </motion.button>
          </div>

          {/* PDF Upload Section */}
          <AnimatePresence>
            {showUploader && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      PDF File
                    </label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Payer Name
                    </label>
                    <input
                      type="text"
                      value={uploadPayer}
                      onChange={(e) => setUploadPayer(e.target.value)}
                      placeholder="e.g., UnitedHealthcare, Blue Cross"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <motion.button
                    onClick={handleUpload}
                    disabled={!uploadFile || !uploadPayer.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Upload & Analyze
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {comparison && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Comparison Summary for {comparison.drug_name}
                  </h3>
                  <p className="text-blue-700">{comparison.summary}</p>
                </div>

                {/* Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis
                        dataKey="payer"
                        tick={{ fontSize: 12, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid rgba(148,163,184,0.18)",
                          background: "#0f172a",
                          color: "#f8fafc",
                        }}
                        labelFormatter={(label, payload) => {
                          const data = payload?.[0]?.payload;
                          return data?.fullName || label;
                        }}
                      />
                      <Bar dataKey="covered" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Comparison Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Payer</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600">Coverage</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600">Prior Auth</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-600">Step Therapy</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">Key Requirements</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparison.comparisons.map((item, idx) => (
                        <motion.tr
                          key={item.payer_name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="border-b border-slate-200 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {item.payer_name}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.covered ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.prior_auth_required ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                            ) : (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.step_therapy_required ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                            ) : (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <ul className="list-disc list-inside space-y-1">
                              {item.key_requirements.slice(0, 2).map((req, i) => (
                                <li key={i} className="text-xs">{req}</li>
                              ))}
                              {item.key_requirements.length > 2 && (
                                <li className="text-xs text-slate-500">
                                  +{item.key_requirements.length - 2} more...
                                </li>
                              )}
                            </ul>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </motion.section>
  );
}
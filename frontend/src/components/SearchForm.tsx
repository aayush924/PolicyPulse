import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

const PAYERS = [
  "Blue Cross NC",
  "Cigna",
  "Florida Blue",
  "UnitedHealthcare",
  "Priority Health",
  "EmblemHealth",
  "Aetna",
  "Anthem Blue Cross",
  "Humana",
  "Kaiser Permanente",
];

interface SearchFormProps {
  onSearch: (drugName: string, payerName: string, question?: string) => void;
  loading: boolean;
}

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [drugName, setDrugName] = useState("");
  const [payerName, setPayerName] = useState("");
  const [question, setQuestion] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!drugName.trim() || !payerName) return;
    onSearch(drugName.trim(), payerName, question.trim() || undefined);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Insurance Provider
          </label>
          <select
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          >
            <option value="">Select your payer...</option>
            {PAYERS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Drug Name
          </label>
          <input
            type="text"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            placeholder="e.g., Humira, Keytruda, Ozempic"
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Your Question{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What do I need to do before my insurance covers this?"
          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !drugName.trim() || !payerName}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing Policy...
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            Search Coverage
          </>
        )}
      </button>
    </form>
  );
}

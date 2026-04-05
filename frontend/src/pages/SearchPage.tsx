import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { PolicyResultCard } from "@/components/PolicyResultCard";
import { queryPolicy } from "@/lib/api";
import type { PolicyResult } from "@/types";
import { AlertCircle, FileText } from "lucide-react";

interface SearchPageProps {
  token: string;
}

export function SearchPage({ token }: SearchPageProps) {
  const [results, setResults] = useState<PolicyResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(drugName: string, payerName: string, question?: string) {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await queryPolicy(drugName, payerName, token, question);
      setResults(response.results);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve policy information.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Understand Your Drug Coverage
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          Select your insurance provider and drug to get a clear, 
          patient-friendly breakdown of your coverage requirements.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
        <SearchForm onSearch={handleSearch} loading={loading} />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full animate-pulse">
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-700">
                Analyzing Policy Documents
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Our AI is reviewing coverage criteria and translating them for you...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">Unable to retrieve policy</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {results.map((result, i) => (
            <PolicyResultCard key={i} result={result} />
          ))}
        </div>
      )}

      {results && results.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No matching policies found. Try a different drug or payer combination.
        </div>
      )}
    </main>
  );
}

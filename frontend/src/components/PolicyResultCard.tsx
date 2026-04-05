import type { PolicyResult } from "@/types";
import { StepTherapyStepper } from "./StepTherapyStepper";
import { CoverageChecklist } from "./CoverageChecklist";
import { Pill, Building2, Hash } from "lucide-react";

interface PolicyResultCardProps {
  result: PolicyResult;
}

export function PolicyResultCard({ result }: PolicyResultCardProps) {
  return (
    <div className="space-y-8">
      {/* Summary Header */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Pill className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">{result.drug_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span>{result.payer_name}</span>
          </div>
          {result.hcpcs_code && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Hash className="w-4 h-4 text-blue-500" />
              <span className="font-mono">{result.hcpcs_code}</span>
            </div>
          )}
        </div>
        <p className="text-slate-700 leading-relaxed">{result.patient_summary}</p>

        {result.covered_indications.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {result.covered_indications.map((ind, i) => (
              <span
                key={i}
                className="inline-block px-3 py-1 bg-white/70 text-slate-600 text-xs rounded-full"
              >
                {ind}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Two column layout for step therapy + checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Step Therapy */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
            Step Therapy Roadmap
          </h3>
          <StepTherapyStepper steps={result.step_therapy_roadmap} />
        </div>

        {/* Coverage Checklist */}
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            Coverage Checklist
          </h3>
          <CoverageChecklist items={result.prior_auth_checklist} />
        </div>
      </div>
    </div>
  );
}

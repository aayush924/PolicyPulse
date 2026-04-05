import type { PriorAuthItem } from "@/types";
import { ClipboardCheck, AlertCircle } from "lucide-react";

interface CoverageChecklistProps {
  items: PriorAuthItem[];
}

export function CoverageChecklist({ items }: CoverageChecklistProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No prior authorization criteria found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-slate-200 rounded-xl p-4 hover:border-blue-200 transition-colors bg-white"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <ClipboardCheck className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-medium text-slate-900">
                {item.patient_friendly}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                Clinical: {item.requirement}
              </p>
              <div className="flex items-start gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">{item.action_needed}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

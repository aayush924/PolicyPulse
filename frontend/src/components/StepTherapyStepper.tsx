import type { StepTherapyStep } from "@/types";
import { CheckCircle2 } from "lucide-react";

interface StepTherapyStepperProps {
  steps: StepTherapyStep[];
}

export function StepTherapyStepper({ steps }: StepTherapyStepperProps) {
  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        No step therapy required for this drug.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {steps.map((step, index) => (
        <div key={step.step_number} className="relative">
          <div className="flex gap-4">
            {/* Vertical line + icon */}
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm shrink-0">
                {step.step_number}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-full bg-blue-200 min-h-[40px]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-8 flex-1">
              <h4 className="font-semibold text-slate-900 text-base">
                {step.drug_name}
              </h4>
              <p className="text-slate-600 mt-1 text-sm leading-relaxed">
                {step.patient_explanation}
              </p>
              {step.duration && (
                <span className="inline-block mt-2 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                  Duration: {step.duration}
                </span>
              )}
              {step.tip && (
                <div className="mt-2 flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{step.tip}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Final destination */}
      <div className="flex gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="flex items-center">
          <h4 className="font-semibold text-green-700">Coverage Approved</h4>
        </div>
      </div>
    </div>
  );
}

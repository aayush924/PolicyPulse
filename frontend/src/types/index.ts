export interface StepTherapyStep {
  step_number: number;
  drug_name: string;
  patient_explanation: string;
  duration: string | null;
  tip: string;
}

export interface PriorAuthItem {
  requirement: string;
  patient_friendly: string;
  action_needed: string;
}

export interface PolicyResult {
  drug_name: string;
  payer_name: string;
  hcpcs_code: string | null;
  covered_indications: string[];
  prior_auth_checklist: PriorAuthItem[];
  step_therapy_roadmap: StepTherapyStep[];
  patient_summary: string;
}

export interface QueryResponse {
  results: PolicyResult[];
  raw_context: string | null;
}

export interface AuthState {
  user: { id: string; email: string } | null;
  token: string | null;
  loading: boolean;
}

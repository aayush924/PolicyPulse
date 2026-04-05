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

// ── Chat ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export interface ConversationDocument {
  id: string;
  conversation_id: string;
  filename: string;
  created_at: string;
}

// ── Policy catalog ────────────────────────────────────────────────────

export interface PolicyCrossRefEntry {
  drug_name: string;
  payer_name: string;
  hcpcs_code: string | null;
  sources: string[];
}

export interface PolicyCrossRefResponse {
  drugs: string[];
  payers: string[];
  entries: PolicyCrossRefEntry[];
  coverage: boolean[][];
}

from pydantic import BaseModel


class StepTherapyStep(BaseModel):
    step_number: int
    drug_name: str
    description: str
    duration: str | None = None


class NormalizedPolicy(BaseModel):
    drug_name: str
    hcpcs_code: str | None = None
    covered_indications: list[str]
    prior_auth_criteria: list[str]
    step_therapy: list[StepTherapyStep]
    raw_markdown: str
    payer_name: str


class IngestRequest(BaseModel):
    payer_name: str


class IngestResponse(BaseModel):
    status: str
    policies_extracted: int
    drug_names: list[str]


class QueryRequest(BaseModel):
    drug_name: str
    payer_name: str
    patient_question: str | None = None


class PolicyResult(BaseModel):
    drug_name: str
    payer_name: str
    hcpcs_code: str | None = None
    covered_indications: list[str]
    prior_auth_checklist: list[dict]
    step_therapy_roadmap: list[dict]
    patient_summary: str


class QueryResponse(BaseModel):
    results: list[PolicyResult]
    raw_context: str | None = None


# ── Chat ──────────────────────────────────────────────────────────────

class ChatMessageOut(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: str


class ConversationOut(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: str
    updated_at: str


class ConversationDetailOut(ConversationOut):
    messages: list[ChatMessageOut]


class SendMessageRequest(BaseModel):
    content: str


class SendMessageResponse(BaseModel):
    user_message: ChatMessageOut
    assistant_message: ChatMessageOut

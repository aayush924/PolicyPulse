import type {
  QueryResponse,
  Conversation,
  ConversationDetail,
  ConversationDocument,
  SendMessageResponse,
  PolicyCrossRefResponse,
  PolicyComparisonResponse,
} from "@/types";

const BASE_URL = "";

let onAuthExpired: (() => void) | null = null;

export function setAuthExpiredHandler(handler: () => void) {
  onAuthExpired = handler;
}

async function authFetch(url: string, init: RequestInit): Promise<globalThis.Response> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    onAuthExpired?.();
    throw new Error("Session expired. Please sign in again.");
  }
  return res;
}

export async function queryPolicy(
  drugName: string,
  payerName: string,
  token: string,
  patientQuestion?: string,
): Promise<QueryResponse> {
  const res = await authFetch(`${BASE_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      drug_name: drugName,
      payer_name: payerName,
      patient_question: patientQuestion || null,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || err.error || "Query failed");
  }

  return res.json();
}

export async function ingestPdf(
  file: File,
  payerName: string,
  token: string,
): Promise<{ status: string; policies_extracted: number; drug_names: string[] }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("payer_name", payerName);

  const res = await authFetch(`${BASE_URL}/api/ingest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || err.error || "Ingest failed");
  }

  return res.json();
}

export async function fetchPolicyCrossReference(
  token: string,
): Promise<PolicyCrossRefResponse> {
  const res = await authFetch(`${BASE_URL}/api/policies/cross-reference`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Failed to load policy cross-reference");
  }
  return res.json();
}

export async function comparePolicies(
  drugName: string,
  payerNames: string[],
  token: string,
): Promise<PolicyComparisonResponse> {
  const res = await authFetch(`${BASE_URL}/api/policies/compare`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      drug_name: drugName,
      payer_names: payerNames,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Comparison failed" }));
    throw new Error(err.detail || err.error || "Policy comparison failed");
  }

  return res.json();
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: any; session: any }> {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Sign in failed" }));
    throw new Error(err.error || "Sign in failed");
  }

  return res.json();
}

// ── Chat API ──────────────────────────────────────────────────────────

export async function listConversations(token: string): Promise<Conversation[]> {
  const res = await authFetch(`${BASE_URL}/api/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load conversations");
  return res.json();
}

export async function createConversation(token: string): Promise<Conversation> {
  const res = await authFetch(`${BASE_URL}/api/chat/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function getConversation(
  conversationId: string,
  token: string,
): Promise<ConversationDetail> {
  const res = await authFetch(
    `${BASE_URL}/api/chat/conversations/${conversationId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Failed to load conversation");
  return res.json();
}

export async function deleteConversation(
  conversationId: string,
  token: string,
): Promise<void> {
  const res = await authFetch(
    `${BASE_URL}/api/chat/conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Failed to delete conversation");
}

export async function sendMessage(
  conversationId: string,
  content: string,
  token: string,
): Promise<SendMessageResponse> {
  const res = await authFetch(
    `${BASE_URL}/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Send failed" }));
    throw new Error(err.detail || "Failed to send message");
  }
  return res.json();
}

// ── Document attachment API ───────────────────────────────────────────

export async function uploadConversationDocument(
  conversationId: string,
  file: File,
  token: string,
): Promise<ConversationDocument> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(
    `${BASE_URL}/api/chat/conversations/${conversationId}/documents`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail || err.error || "Document upload failed");
  }

  return res.json();
}

export async function getConversationDocuments(
  conversationId: string,
  token: string,
): Promise<ConversationDocument[]> {
  const res = await authFetch(
    `${BASE_URL}/api/chat/conversations/${conversationId}/documents`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error("Failed to load documents");
  return res.json();
}

export async function deleteConversationDocument(
  conversationId: string,
  documentId: string,
  token: string,
): Promise<void> {
  const res = await authFetch(
    `${BASE_URL}/api/chat/conversations/${conversationId}/documents/${documentId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error("Failed to delete document");
}

export async function signUp(
  email: string,
  password: string,
): Promise<{ user: any; session: any }> {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Sign up failed" }));
    throw new Error(err.error || "Sign up failed");
  }

  return res.json();
}

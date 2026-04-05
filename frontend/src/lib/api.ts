import type { QueryResponse } from "@/types";

const BASE_URL = "";

export async function queryPolicy(
  drugName: string,
  payerName: string,
  token: string,
  patientQuestion?: string,
): Promise<QueryResponse> {
  const res = await fetch(`${BASE_URL}/api/query`, {
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

  const res = await fetch(`${BASE_URL}/api/ingest`, {
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

import os
import json
from google import genai

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GOOGLE_AI_API_KEY"])
    return _client


PATIENT_ADVOCATE_PROMPT = """You are a Patient Advocate AI. Your job is to translate complex medical insurance policy language into clear, empathetic, actionable guidance that any patient can understand.

Given the following policy context for the drug "{drug_name}" under the payer "{payer_name}", create:

1. **Patient Summary**: A 2-3 sentence plain-English summary of what coverage looks like.
2. **Prior Auth Checklist**: Convert each prior authorization criterion into a simple yes/no checklist item with patient-friendly language. Return as a JSON array of objects with "requirement" (clinical term), "patient_friendly" (plain English), and "action_needed" (what the patient should do).
3. **Step Therapy Roadmap**: Convert step therapy into a patient journey. For each step, explain in plain English what drug they need to try, why, and for how long. Use encouraging language. Return as a JSON array of objects with "step_number", "drug_name", "patient_explanation", "duration", and "tip" (a helpful tip for the patient).

IMPORTANT translation examples:
- "Failure of TNF inhibitor" → "You must try and not get adequate relief from a TNF inhibitor (like Humira or Enbrel) before your plan covers this drug"
- "Documented inadequate response" → "Your doctor needs to document that a previous medication didn't work well enough for you"
- "FDA-approved indication" → "Your diagnosis must be one that this drug is officially approved to treat"

Return a JSON object with keys: "patient_summary", "prior_auth_checklist", "step_therapy_roadmap"
Return ONLY valid JSON, no markdown fencing.

Policy Context:
{context}

Patient Question (if any): {question}"""


async def translate_for_patient(
    drug_name: str,
    payer_name: str,
    policy_context: str,
    patient_question: str | None = None,
) -> dict:
    """Translate clinical policy language into patient-friendly guidance."""
    client = _get_client()

    question = patient_question or "Please explain my coverage options."

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=PATIENT_ADVOCATE_PROMPT.format(
            drug_name=drug_name,
            payer_name=payer_name,
            context=policy_context,
            question=question,
        ),
        config=genai.types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=4096,
        ),
    )

    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    return json.loads(raw_text)

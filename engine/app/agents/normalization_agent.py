import os
import json
from google import genai
from app.models.schemas import NormalizedPolicy

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GOOGLE_AI_API_KEY"])
    return _client


NORMALIZATION_PROMPT = """You are a medical policy normalization agent. Extract structured data from the following medical benefit drug policy document.

Return a JSON array where each element represents one drug policy found in the document.
Each element must have this exact schema:
{{
  "drug_name": "string - brand or generic name",
  "hcpcs_code": "string or null - J-code if found (e.g., J0135)",
  "covered_indications": ["list of FDA-approved or payer-approved indications"],
  "prior_auth_criteria": ["list of specific prior authorization requirements"],
  "step_therapy": [
    {{
      "step_number": 1,
      "drug_name": "drug that must be tried first",
      "description": "clinical requirement",
      "duration": "required trial period or null"
    }}
  ]
}}

Rules:
- Extract ALL drugs mentioned with their own policy sections.
- Preserve HCPCS J-codes exactly as written.
- For step therapy, order steps sequentially as the policy specifies.
- If no step therapy exists, return an empty array for that field.
- Return ONLY valid JSON, no markdown fencing.

Document:
{document}"""


async def normalize_policy(markdown: str, payer_name: str) -> list[NormalizedPolicy]:
    """Parse raw policy markdown into structured NormalizedPolicy objects."""
    client = _get_client()

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=NORMALIZATION_PROMPT.format(document=markdown),
        config=genai.types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=8192,
        ),
    )

    raw_text = response.text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    parsed = json.loads(raw_text)
    if isinstance(parsed, dict):
        parsed = [parsed]

    policies = []
    for item in parsed:
        policy = NormalizedPolicy(
            drug_name=item["drug_name"],
            hcpcs_code=item.get("hcpcs_code"),
            covered_indications=item.get("covered_indications", []),
            prior_auth_criteria=item.get("prior_auth_criteria", []),
            step_therapy=[
                {
                    "step_number": s.get("step_number", i + 1),
                    "drug_name": s.get("drug_name", ""),
                    "description": s.get("description", ""),
                    "duration": s.get("duration"),
                }
                for i, s in enumerate(item.get("step_therapy", []))
            ],
            raw_markdown=markdown,
            payer_name=payer_name,
        )
        policies.append(policy)

    return policies

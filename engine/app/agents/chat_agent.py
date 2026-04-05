import os
from google import genai

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GOOGLE_AI_API_KEY"])
    return _client


def _extract_text(response) -> str:
    """Safely extract text from a Gemini response (handles thinking models where .text can be None)."""
    if response.text:
        return response.text.strip()
    for candidate in response.candidates or []:
        for part in candidate.content.parts or []:
            if part.text:
                return part.text.strip()
    return ""


SYSTEM_PROMPT = """You are PolicyPulse Chat, a friendly and knowledgeable patient advocate assistant.
You help patients understand their medical insurance drug coverage policies.

You have access to a database of real drug coverage policies. When policy data is provided below, you MUST use it to answer the patient's question with specific, accurate details from those policies.

Guidelines:
- If the user has attached documents, PRIORITIZE answering from those documents above all else.
- ALWAYS answer based on the policy data provided in the "Policy Context" section below when no document is more relevant.
- Cite specific details: drug names, payer names, step therapy steps, prior auth requirements, covered indications.
- Translate clinical or insurance jargon into plain English.
- Be concise but thorough. Use bullet points or numbered lists when helpful.
- If the policy context contains relevant information, do NOT say "I don't have access to your policy" — you DO have the policy data right here.
- Only say you don't have information if the policy context section is truly empty or irrelevant to the question.
- IMPORTANT: Only use the conversation history and policy context provided. Do NOT reference information from other conversations or make up policy details."""


def _build_prompt(
    conversation_history: list[dict],
    user_message: str,
    policy_context: str | None = None,
    document_context: str | None = None,
) -> str:
    parts = [SYSTEM_PROMPT]

    if document_context:
        parts.append(
            f"\n--- Attached Documents (PRIORITIZE this content when answering) ---\n"
            f"{document_context}\n"
            f"--- End Attached Documents ---"
        )

    if policy_context:
        parts.append(
            f"\n--- Policy Context (use this data to answer) ---\n{policy_context}\n--- End Policy Context ---"
        )
    else:
        parts.append(
            "\n[No specific policy data was found for this query. "
            "Provide general guidance and suggest the patient search for a specific drug/payer on the Search page.]"
        )

    if conversation_history:
        parts.append("\nConversation so far:")
        for msg in conversation_history:
            role_label = "Patient" if msg["role"] == "user" else "PolicyPulse"
            parts.append(f"{role_label}: {msg['content']}")

    parts.append(f"\nPatient: {user_message}")
    parts.append("\nPolicyPulse:")

    return "\n".join(parts)


async def generate_chat_response(
    conversation_history: list[dict],
    user_message: str,
    policy_context: str | None = None,
    document_context: str | None = None,
) -> str:
    """Generate a chat response using only the current conversation's context."""
    client = _get_client()

    prompt = _build_prompt(conversation_history, user_message, policy_context, document_context)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=genai.types.GenerateContentConfig(
            temperature=0.5,
            max_output_tokens=2048,
        ),
    )

    text = _extract_text(response)
    return text or "I'm sorry, I couldn't generate a response. Please try again."


async def generate_title(first_message: str) -> str:
    """Generate a short title for a conversation based on the first message."""
    client = _get_client()

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            "Generate a concise title (5 words max) for a conversation that starts with "
            f"this message. Return ONLY the title text, nothing else.\n\n"
            f'Message: "{first_message}"'
        ),
        config=genai.types.GenerateContentConfig(
            temperature=0.3,
            max_output_tokens=30,
        ),
    )

    title = _extract_text(response).strip('"')
    return title[:80] if title else "New Chat"

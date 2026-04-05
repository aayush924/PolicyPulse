import os
from google import genai

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ["GOOGLE_AI_API_KEY"])
    return _client


async def generate_embedding(text: str) -> list[float]:
    client = _get_client()
    response = client.models.embed_content(
        model="gemini-embedding-001",
        contents=text,
        config=genai.types.EmbedContentConfig(output_dimensionality=768),
    )
    return response.embeddings[0].values

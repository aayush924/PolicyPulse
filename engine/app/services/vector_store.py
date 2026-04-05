from app.services.supabase_client import get_supabase
from app.services.embeddings import generate_embedding


async def upsert_policy_embedding(
    content: str,
    metadata: dict,
    embedding: list[float],
) -> None:
    """Insert a policy chunk with its embedding into the vector store."""
    supabase = get_supabase()
    supabase.table("policy_embeddings").insert({
        "content": content,
        "metadata": metadata,
        "embedding": embedding,
    }).execute()


async def search_policies(
    query_text: str,
    payer_name: str,
    drug_name: str,
    match_count: int = 5,
) -> list[dict]:
    """Perform vector similarity search filtered by payer and drug."""
    embedding = await generate_embedding(query_text)
    supabase = get_supabase()

    result = supabase.rpc("match_policies", {
        "query_embedding": embedding,
        "filter_payer": payer_name,
        "filter_drug": drug_name,
        "match_count": match_count,
    }).execute()

    return result.data or []

from fastapi import APIRouter

from app.models.schemas import PolicyCrossRefEntry, PolicyCrossRefResponse
from app.services.policy_crossref import build_cross_reference

router = APIRouter()


@router.get("/cross-reference", response_model=PolicyCrossRefResponse)
async def get_policy_cross_reference():
    """Drug × payer coverage map from seed policies and ingested embeddings."""
    data = build_cross_reference()
    return PolicyCrossRefResponse(
        drugs=data["drugs"],
        payers=data["payers"],
        entries=[PolicyCrossRefEntry(**e) for e in data["entries"]],
        coverage=data["coverage"],
    )

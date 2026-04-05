from fastapi import APIRouter

from app.models.schemas import (
    PolicyCrossRefEntry,
    PolicyCrossRefResponse,
    ComparePoliciesRequest,
    PolicyComparisonResponse,
    ComparisonItem,
)
from app.services.policy_crossref import build_cross_reference
from app.services.vector_store import search_policies
from app.agents.patient_advocate import translate_for_patient

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


@router.post("/compare", response_model=PolicyComparisonResponse)
async def compare_policies(req: ComparePoliciesRequest):
    """Compare coverage for a drug across multiple payers."""
    comparisons = []

    for payer_name in req.payer_names:
        # Search for policies matching this drug and payer
        search_results = search_policies(f"{req.drug_name} {payer_name}", limit=5)

        covered = False
        prior_auth_required = False
        step_therapy_required = False
        covered_indications = []
        key_requirements = []

        if search_results:
            # Use the first/best match
            policy_data = search_results[0]

            # Check if covered
            covered = any(
                req.drug_name.lower() in ind.lower()
                for ind in policy_data.get("covered_indications", [])
            )

            # Check for prior auth requirements
            prior_auth_criteria = policy_data.get("prior_auth_criteria", [])
            prior_auth_required = len(prior_auth_criteria) > 0

            # Check for step therapy
            step_therapy = policy_data.get("step_therapy", [])
            step_therapy_required = len(step_therapy) > 0

            covered_indications = policy_data.get("covered_indications", [])
            key_requirements = prior_auth_criteria[:3]  # Top 3 requirements

        comparisons.append(ComparisonItem(
            payer_name=payer_name,
            covered=covered,
            prior_auth_required=prior_auth_required,
            step_therapy_required=step_therapy_required,
            covered_indications=covered_indications,
            key_requirements=key_requirements,
        ))

    # Generate summary
    covered_count = sum(1 for c in comparisons if c.covered)
    summary = f"{covered_count} out of {len(comparisons)} payers cover {req.drug_name}."

    return PolicyComparisonResponse(
        drug_name=req.drug_name,
        comparisons=comparisons,
        summary=summary,
    )

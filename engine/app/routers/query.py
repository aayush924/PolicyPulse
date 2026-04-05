import logging

from fastapi import APIRouter, HTTPException

from app.agents.patient_advocate import translate_for_patient
from app.models.schemas import QueryRequest, QueryResponse, PolicyResult
from app.seed_data import SEED_POLICIES
from app.services.vector_store import search_policies

logger = logging.getLogger(__name__)
router = APIRouter()


def _normalize(text: str) -> str:
    return text.lower().strip()


def find_seed_policy(drug_name: str, payer_name: str) -> list[dict] | None:
    """Fuzzy-match against SEED_POLICIES by drug name and payer name.

    Returns matching seed dicts, or None if nothing matches.
    """
    drug_norm = _normalize(drug_name)
    payer_norm = _normalize(payer_name)

    matches = []
    for policy in SEED_POLICIES:
        seed_drug = _normalize(policy["drug_name"])
        seed_payer = _normalize(policy["payer_name"])

        drug_match = (
            drug_norm in seed_drug
            or seed_drug in drug_norm
            or drug_norm.split("(")[0].strip() in seed_drug
            or drug_norm.split(")")[0].split("(")[-1].strip() in seed_drug
        )

        payer_match = (
            payer_norm in seed_payer
            or seed_payer in payer_norm
        )

        if drug_match and payer_match:
            matches.append(policy)

    return matches if matches else None


@router.post("/", response_model=QueryResponse)
async def query_policy(req: QueryRequest):
    """Search for a drug policy and translate it for the patient."""
    matches = None
    try:
        matches = await search_policies(
            query_text=f"{req.drug_name} coverage policy {req.payer_name}",
            payer_name=req.payer_name,
            drug_name=req.drug_name,
        )
    except Exception as e:
        logger.warning("Vector search failed, will try seed data: %s", e)

    if matches:
        combined_context = "\n\n---\n\n".join(
            m.get("content", "") for m in matches
        )

        try:
            translation = await translate_for_patient(
                drug_name=req.drug_name,
                payer_name=req.payer_name,
                policy_context=combined_context,
                patient_question=req.patient_question,
            )
        except Exception as e:
            logger.error("Patient advocate translation failed: %s", e)
            raise HTTPException(
                status_code=500, detail=f"Translation failed: {e}"
            )

        metadata = matches[0].get("metadata", {}) if matches else {}

        result = PolicyResult(
            drug_name=req.drug_name,
            payer_name=req.payer_name,
            hcpcs_code=metadata.get("drug_code"),
            covered_indications=metadata.get("covered_indications", []),
            prior_auth_checklist=translation.get("prior_auth_checklist", []),
            step_therapy_roadmap=translation.get("step_therapy_roadmap", []),
            patient_summary=translation.get("patient_summary", ""),
        )

        return QueryResponse(results=[result], raw_context=combined_context)

    seed_matches = find_seed_policy(req.drug_name, req.payer_name)
    if seed_matches:
        logger.info(
            "Using seed data for %s / %s (%d matches)",
            req.drug_name, req.payer_name, len(seed_matches),
        )
        results = [
            PolicyResult(
                drug_name=s["drug_name"],
                payer_name=s["payer_name"],
                hcpcs_code=s.get("hcpcs_code"),
                covered_indications=s.get("covered_indications", []),
                prior_auth_checklist=s.get("prior_auth_checklist", []),
                step_therapy_roadmap=s.get("step_therapy_roadmap", []),
                patient_summary=s.get("patient_summary", ""),
            )
            for s in seed_matches
        ]
        return QueryResponse(results=results, raw_context="[seed data]")

    raise HTTPException(
        status_code=404,
        detail=f"No policies found for {req.drug_name} under {req.payer_name}.",
    )

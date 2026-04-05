import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, Form, HTTPException

from app.agents.normalization_agent import normalize_policy
from app.services.embeddings import generate_embedding
from app.services.vector_store import upsert_policy_embedding
from app.models.schemas import IngestResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=IngestResponse)
async def ingest_pdf(
    file: UploadFile = File(...),
    payer_name: str = Form(...),
):
    """Ingest a medical policy PDF: parse → normalize → embed → store."""
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        from docling.document_converter import DocumentConverter

        converter = DocumentConverter()
        result = converter.convert(str(tmp_path))
        markdown = result.document.export_to_markdown()
    except Exception as e:
        logger.error("Docling parsing failed: %s", e)
        raise HTTPException(status_code=422, detail=f"PDF parsing failed: {e}")
    finally:
        tmp_path.unlink(missing_ok=True)

    try:
        policies = await normalize_policy(markdown, payer_name)
    except Exception as e:
        logger.error("Normalization failed: %s", e)
        raise HTTPException(status_code=422, detail=f"Policy normalization failed: {e}")

    drug_names = []
    for policy in policies:
        chunk_text = (
            f"Drug: {policy.drug_name}\n"
            f"HCPCS: {policy.hcpcs_code or 'N/A'}\n"
            f"Indications: {', '.join(policy.covered_indications)}\n"
            f"PA Criteria: {', '.join(policy.prior_auth_criteria)}\n"
            f"Step Therapy: {len(policy.step_therapy)} steps\n\n"
            f"Raw Policy:\n{policy.raw_markdown[:2000]}"
        )

        embedding = await generate_embedding(chunk_text)
        metadata = {
            "payer_name": payer_name,
            "drug_name": policy.drug_name,
            "drug_code": policy.hcpcs_code,
            "covered_indications": policy.covered_indications,
            "prior_auth_criteria": policy.prior_auth_criteria,
            "step_therapy": [s.model_dump() if hasattr(s, 'model_dump') else s for s in policy.step_therapy],
        }
        await upsert_policy_embedding(chunk_text, metadata, embedding)
        drug_names.append(policy.drug_name)

    return IngestResponse(
        status="success",
        policies_extracted=len(policies),
        drug_names=drug_names,
    )

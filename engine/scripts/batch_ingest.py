#!/usr/bin/env python3
"""
Batch ingestion script for PolicyPulse.
Processes all PDF files in the Medical Drug Coverage Policy Examples directory
through the Docling -> Gemini normalization -> embedding -> Supabase pipeline.

Usage:
    cd engine
    python -m scripts.batch_ingest [--dir PATH] [--dry-run]

Requires: GOOGLE_AI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY in .env
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

PAYER_MAP = {
    "BCBS": "Blue Cross NC",
    "Cigna": "Cigna",
    "Florida Blue": "Florida Blue",
    "UHC": "UnitedHealthcare",
    "Priority Health": "Priority Health",
    "EmblemHealth": "EmblemHealth",
}


def detect_payer(filename: str) -> str:
    """Infer payer name from the PDF filename."""
    for key, payer in PAYER_MAP.items():
        if key.lower() in filename.lower():
            return payer
    return "Unknown Payer"


async def ingest_file(pdf_path: Path, payer_name: str, dry_run: bool = False) -> None:
    """Run a single PDF through the full pipeline."""
    print(f"\n{'=' * 60}")
    print(f"Processing: {pdf_path.name}")
    print(f"Payer:      {payer_name}")
    print(f"{'=' * 60}")

    from docling.document_converter import DocumentConverter

    print("[1/4] Parsing PDF with Docling...")
    converter = DocumentConverter()
    result = converter.convert(str(pdf_path))
    markdown = result.document.export_to_markdown()
    print(f"       Extracted {len(markdown)} characters of markdown")

    from app.agents.normalization_agent import normalize_policy

    print("[2/4] Normalizing with Gemini...")
    policies = await normalize_policy(markdown, payer_name)
    print(f"       Found {len(policies)} drug policies")

    for p in policies:
        print(
            f"       - {p.drug_name} ({p.hcpcs_code or 'no code'}): "
            f"{len(p.covered_indications)} indications, "
            f"{len(p.prior_auth_criteria)} PA criteria, "
            f"{len(p.step_therapy)} step therapy steps"
        )

    if dry_run:
        print("[DRY RUN] Skipping embedding and storage")
        return

    from app.services.embeddings import generate_embedding
    from app.services.vector_store import upsert_policy_embedding

    print("[3/4] Generating embeddings...")
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
            "step_therapy": [
                s.model_dump() if hasattr(s, "model_dump") else s
                for s in policy.step_therapy
            ],
        }

        print(f"[4/4] Upserting {policy.drug_name} to vector store...")
        await upsert_policy_embedding(chunk_text, metadata, embedding)

    print(f"\nDone: {len(policies)} policies ingested from {pdf_path.name}")


async def main():
    parser = argparse.ArgumentParser(description="Batch ingest policy PDFs")
    parser.add_argument(
        "--dir",
        type=Path,
        default=Path(__file__).resolve().parent.parent.parent
        / "Medical Drug Coverage Policy Examples",
        help="Directory containing policy PDFs",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse and normalize only, skip embedding/storage",
    )
    args = parser.parse_args()

    if not args.dir.exists():
        print(f"Error: Directory not found: {args.dir}")
        sys.exit(1)

    pdfs = sorted(args.dir.glob("*.pdf"))
    if not pdfs:
        print(f"No PDF files found in {args.dir}")
        sys.exit(1)

    print(f"Found {len(pdfs)} PDF files to process")
    print(f"Dry run: {args.dry_run}")

    for pdf_path in pdfs:
        payer_name = detect_payer(pdf_path.name)
        try:
            await ingest_file(pdf_path, payer_name, dry_run=args.dry_run)
        except Exception as e:
            print(f"\nERROR processing {pdf_path.name}: {e}")
            continue

    print(f"\n{'=' * 60}")
    print(f"Batch ingestion complete. Processed {len(pdfs)} files.")


if __name__ == "__main__":
    asyncio.run(main())

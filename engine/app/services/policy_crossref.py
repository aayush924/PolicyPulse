"""Build drug × payer cross-reference from seed data and policy_embeddings."""

import logging

from app.seed_data import SEED_POLICIES
from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)


def _norm_key(drug: str, payer: str) -> tuple[str, str]:
    return (drug.strip().lower(), payer.strip().lower())


def _entries_from_seed() -> list[dict]:
    return [
        {
            "drug_name": p["drug_name"],
            "payer_name": p["payer_name"],
            "hcpcs_code": p.get("hcpcs_code"),
            "sources": ["seed"],
        }
        for p in SEED_POLICIES
    ]


def _entries_from_vector_store() -> list[dict]:
    try:
        supabase = get_supabase()
        result = supabase.table("policy_embeddings").select("metadata").execute()
    except Exception as e:
        logger.warning("Cross-ref: could not read policy_embeddings: %s", e)
        return []

    seen: set[tuple[str, str]] = set()
    out: list[dict] = []
    for row in result.data or []:
        meta = row.get("metadata") or {}
        drug = meta.get("drug_name")
        payer = meta.get("payer_name")
        if not drug or not payer:
            continue
        key = _norm_key(str(drug), str(payer))
        if key in seen:
            continue
        seen.add(key)
        code = meta.get("drug_code")
        out.append(
            {
                "drug_name": str(drug).strip(),
                "payer_name": str(payer).strip(),
                "hcpcs_code": code if code else None,
                "sources": ["ingested"],
            }
        )
    return out


def build_cross_reference() -> dict:
    """Merge seed + ingested rows, dedupe by (drug, payer), build coverage matrix."""
    merged: dict[tuple[str, str], dict] = {}

    def merge_row(row: dict, source: str) -> None:
        key = _norm_key(row["drug_name"], row["payer_name"])
        if key not in merged:
            merged[key] = {
                "drug_name": row["drug_name"],
                "payer_name": row["payer_name"],
                "hcpcs_code": row.get("hcpcs_code"),
                "sources": [],
            }
        entry = merged[key]
        if source not in entry["sources"]:
            entry["sources"].append(source)
        hc = row.get("hcpcs_code")
        if hc and not entry.get("hcpcs_code"):
            entry["hcpcs_code"] = hc

    for row in _entries_from_seed():
        merge_row(row, "seed")
    for row in _entries_from_vector_store():
        merge_row(row, "ingested")

    _src_order = {"seed": 0, "ingested": 1}
    for e in merged.values():
        e["sources"] = sorted(
            e["sources"],
            key=lambda s: _src_order.get(s, 99),
        )

    entries = sorted(
        merged.values(),
        key=lambda e: (e["drug_name"].lower(), e["payer_name"].lower()),
    )

    drugs = sorted({e["drug_name"] for e in entries}, key=str.lower)
    payers = sorted({e["payer_name"] for e in entries}, key=str.lower)

    pair_set = {_norm_key(e["drug_name"], e["payer_name"]) for e in entries}
    coverage: list[list[bool]] = []
    for drug in drugs:
        row = []
        for payer in payers:
            row.append(_norm_key(drug, payer) in pair_set)
        coverage.append(row)

    return {
        "drugs": drugs,
        "payers": payers,
        "entries": entries,
        "coverage": coverage,
    }

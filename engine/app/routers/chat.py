import logging
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Header, UploadFile
from postgrest.exceptions import APIError

from app.agents.chat_agent import generate_chat_response, generate_title
from app.models.schemas import (
    ConversationDocumentOut,
    ConversationOut,
    ConversationDetailOut,
    ChatMessageOut,
    SendMessageRequest,
    SendMessageResponse,
)
from app.seed_data import SEED_POLICIES
from app.services.supabase_client import get_supabase
from app.services.vector_store import search_policies_unfiltered

logger = logging.getLogger(__name__)
router = APIRouter()


def _build_seed_context(query: str) -> str | None:
    """Build policy context from seed data by keyword matching against the user query."""
    query_lower = query.lower()
    matched = []

    for policy in SEED_POLICIES:
        drug = policy["drug_name"].lower()
        payer = policy["payer_name"].lower()

        drug_words = drug.replace("(", " ").replace(")", " ").split()
        if any(w in query_lower for w in drug_words if len(w) > 2) or payer in query_lower:
            lines = [
                f"Drug: {policy['drug_name']} | Payer: {policy['payer_name']}",
                f"HCPCS: {policy.get('hcpcs_code', 'N/A')}",
                f"Covered Indications: {', '.join(policy.get('covered_indications', []))}",
                f"Patient Summary: {policy.get('patient_summary', 'N/A')}",
            ]

            pa = policy.get("prior_auth_checklist", [])
            if pa:
                lines.append("Prior Authorization Requirements:")
                for item in pa:
                    lines.append(f"  - {item.get('patient_friendly', item.get('requirement', ''))}")

            st = policy.get("step_therapy_roadmap", [])
            if st:
                lines.append("Step Therapy Roadmap:")
                for step in st:
                    lines.append(
                        f"  Step {step.get('step_number', '?')}: {step.get('drug_name', '')} — "
                        f"{step.get('patient_explanation', '')}"
                    )

            matched.append("\n".join(lines))

    if not matched:
        summaries = []
        for policy in SEED_POLICIES:
            summaries.append(
                f"- {policy['drug_name']} ({policy['payer_name']}): "
                f"{policy.get('patient_summary', 'N/A')}"
            )
        return "Available policies in our database:\n" + "\n".join(summaries)

    return "\n\n---\n\n".join(matched)


def _require_user(user_id: str | None) -> str:
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user identity")
    return user_id


@router.get("/conversations", response_model=list[ConversationOut])
async def list_conversations(x_user_id: str | None = Header(None)):
    """List all conversations for the authenticated user, newest first."""
    uid = _require_user(x_user_id)
    supabase = get_supabase()

    try:
        result = (
            supabase.table("chat_conversations")
            .select("*")
            .eq("user_id", uid)
            .order("updated_at", desc=True)
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error listing conversations: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    return result.data or []


@router.post("/conversations", response_model=ConversationOut, status_code=201)
async def create_conversation(x_user_id: str | None = Header(None)):
    """Create a new empty conversation."""
    uid = _require_user(x_user_id)
    supabase = get_supabase()

    try:
        result = (
            supabase.table("chat_conversations")
            .insert({"user_id": uid, "title": "New Chat"})
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error creating conversation: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create conversation")

    return result.data[0]


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailOut)
async def get_conversation(
    conversation_id: str,
    x_user_id: str | None = Header(None),
):
    """Get a conversation with all its messages."""
    uid = _require_user(x_user_id)
    supabase = get_supabase()

    try:
        conv = (
            supabase.table("chat_conversations")
            .select("*")
            .eq("id", conversation_id)
            .eq("user_id", uid)
            .maybe_single()
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error fetching conversation: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    try:
        msgs = (
            supabase.table("chat_messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error fetching messages: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    return {**conv.data, "messages": msgs.data or []}


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    x_user_id: str | None = Header(None),
):
    """Delete a conversation and all its messages."""
    uid = _require_user(x_user_id)
    supabase = get_supabase()

    try:
        supabase.table("chat_conversations").delete().eq(
            "id", conversation_id
        ).eq("user_id", uid).execute()
    except APIError as e:
        logger.error("Supabase error deleting conversation: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")


_ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
_MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def _parse_document(file_bytes: bytes, filename: str) -> str:
    """Parse an uploaded file to plain text using Docling (PDF/DOCX) or direct read (TXT)."""
    suffix = Path(filename).suffix.lower()

    if suffix == ".txt":
        return file_bytes.decode("utf-8", errors="replace")

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = Path(tmp.name)

    try:
        from docling.document_converter import DocumentConverter
        converter = DocumentConverter()
        result = converter.convert(str(tmp_path))
        return result.document.export_to_markdown()
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Document parsing failed: {e}")
    finally:
        tmp_path.unlink(missing_ok=True)


def _require_conversation_ownership(supabase, conversation_id: str, uid: str) -> None:
    """Raise 404 if the conversation doesn't exist or doesn't belong to the user."""
    try:
        conv = (
            supabase.table("chat_conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("user_id", uid)
            .maybe_single()
            .execute()
        )
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")


@router.post(
    "/conversations/{conversation_id}/documents",
    response_model=ConversationDocumentOut,
    status_code=201,
)
async def upload_document(
    conversation_id: str,
    file: UploadFile = File(...),
    x_user_id: str | None = Header(None),
):
    """Upload and attach a document (PDF, DOCX, TXT) to a conversation."""
    uid = _require_user(x_user_id)
    supabase = get_supabase()
    _require_conversation_ownership(supabase, conversation_id, uid)

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in _ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{suffix}'. Allowed: PDF, DOCX, TXT.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > _MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

    content = _parse_document(file_bytes, file.filename or "document")

    try:
        result = (
            supabase.table("conversation_documents")
            .insert(
                {
                    "conversation_id": conversation_id,
                    "filename": file.filename,
                    "content": content,
                }
            )
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error inserting document: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save document")

    return result.data[0]


@router.get(
    "/conversations/{conversation_id}/documents",
    response_model=list[ConversationDocumentOut],
)
async def list_documents(
    conversation_id: str,
    x_user_id: str | None = Header(None),
):
    """List documents attached to a conversation."""
    uid = _require_user(x_user_id)
    supabase = get_supabase()
    _require_conversation_ownership(supabase, conversation_id, uid)

    try:
        result = (
            supabase.table("conversation_documents")
            .select("id, conversation_id, filename, created_at")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error listing documents: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    return result.data or []


@router.delete("/conversations/{conversation_id}/documents/{document_id}", status_code=204)
async def delete_document(
    conversation_id: str,
    document_id: str,
    x_user_id: str | None = Header(None),
):
    """Remove a document from a conversation."""
    uid = _require_user(x_user_id)
    supabase = get_supabase()
    _require_conversation_ownership(supabase, conversation_id, uid)

    try:
        supabase.table("conversation_documents").delete().eq(
            "id", document_id
        ).eq("conversation_id", conversation_id).execute()
    except APIError as e:
        logger.error("Supabase error deleting document: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=SendMessageResponse,
)
async def send_message(
    conversation_id: str,
    req: SendMessageRequest,
    x_user_id: str | None = Header(None),
):
    """Send a user message, generate an AI response scoped to this conversation only."""
    uid = _require_user(x_user_id)
    supabase = get_supabase()

    try:
        conv = (
            supabase.table("chat_conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("user_id", uid)
            .maybe_single()
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error verifying conversation: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Fetch existing messages (current conversation context only)
    try:
        history_rows = (
            supabase.table("chat_messages")
            .select("role, content")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error fetching history: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    conversation_history = history_rows.data or []

    # RAG: search for relevant policy context, fall back to seed data
    policy_context: str | None = None
    try:
        matches = await search_policies_unfiltered(req.content, match_count=3)
        if matches:
            policy_context = "\n\n---\n\n".join(
                m.get("content", "") for m in matches
            )
    except Exception as e:
        logger.warning("Chat RAG search failed, falling back to seed data: %s", e)

    if not policy_context:
        policy_context = _build_seed_context(req.content)

    # Fetch attached documents for this conversation
    document_context: str | None = None
    try:
        doc_rows = (
            supabase.table("conversation_documents")
            .select("filename, content")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .execute()
        )
        if doc_rows.data:
            parts = [
                f"### Document: {doc['filename']}\n\n{doc['content']}"
                for doc in doc_rows.data
            ]
            document_context = "\n\n---\n\n".join(parts)
    except Exception as e:
        logger.warning("Failed to fetch conversation documents: %s", e)

    # Generate AI response
    try:
        assistant_text = await generate_chat_response(
            conversation_history=conversation_history,
            user_message=req.content,
            policy_context=policy_context,
            document_context=document_context,
        )
    except Exception as e:
        logger.error("Chat generation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to generate response")

    # Persist both messages
    try:
        user_msg = (
            supabase.table("chat_messages")
            .insert(
                {
                    "conversation_id": conversation_id,
                    "role": "user",
                    "content": req.content,
                }
            )
            .execute()
        )

        assistant_msg = (
            supabase.table("chat_messages")
            .insert(
                {
                    "conversation_id": conversation_id,
                    "role": "assistant",
                    "content": assistant_text,
                }
            )
            .execute()
        )
    except APIError as e:
        logger.error("Supabase error persisting messages: %s", e)
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")

    # Auto-title on first message
    is_first = len(conversation_history) == 0
    if is_first:
        try:
            title = await generate_title(req.content)
            supabase.table("chat_conversations").update({"title": title}).eq(
                "id", conversation_id
            ).execute()
        except Exception as e:
            logger.warning("Title generation failed: %s", e)

    # Bump updated_at
    try:
        supabase.table("chat_conversations").update(
            {"updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", conversation_id).execute()
    except APIError:
        pass

    return SendMessageResponse(
        user_message=user_msg.data[0],
        assistant_message=assistant_msg.data[0],
    )

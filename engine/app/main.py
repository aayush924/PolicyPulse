from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import ingest, query, chat, policies

app = FastAPI(title="PolicyPulse Engine", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/ingest", tags=["Ingestion"])
app.include_router(query.router, prefix="/query", tags=["Query"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(policies.router, prefix="/policies", tags=["Policies"])


@app.get("/health")
async def health():
    return {"status": "ok"}

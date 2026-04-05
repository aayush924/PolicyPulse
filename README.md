# Policy Pulse

Patient-facing web app that turns medical benefit drug policies into plain-language coverage summaries, step therapy roadmaps, and prior authorization checklists. Uses **Agentic RAG**: PDF ingestion (Docling + Gemini), embeddings in **Supabase pgvector**, and a **Patient Advocate** model pass for translation.

## Architecture

| Layer | Stack | Role |
|-------|--------|------|
| **frontend** | React, Vite, TypeScript, Tailwind, Framer Motion, Three.js (R3F + Drei), Recharts | Auth UI, 3D dashboard, payer/drug search, step therapy + checklist |
| **gateway** | Node.js, Express, Supabase Auth | JWT validation, proxy to engine |
| **engine** | FastAPI, Docling, Google GenAI, Supabase | `/ingest`, `/query`, normalization + RAG |

Request flow: **Browser → Gateway (`/api/*`) → Engine** (with Supabase for auth and vector store).

## Prerequisites

- **Node.js** 18+ (for frontend + gateway)
- **Python 3.11–3.13** (3.14 is not recommended; `pydantic-core` may fail to build)
- **Supabase** project with pgvector (run migration SQL once)
- **Google AI** API key (Gemini + text embeddings)

## Environment

Copy `.env.example` to `.env` at the **repository root** (same folder as `package.json`). The gateway loads this path explicitly.

| Variable | Used by | Purpose |
|----------|---------|---------|
| `SUPABASE_URL` | Gateway, Engine | Supabase project URL |
| `SUPABASE_ANON_KEY` | Gateway, Engine | Auth + PostgREST (vector table uses RLS; no service role key required) |
| `GOOGLE_AI_API_KEY` | Engine | Gemini + embeddings |
| `ENGINE_URL` | Gateway | Default `http://localhost:8000` |
| `GATEWAY_PORT` | Gateway | Default `3001` |
| `FRONTEND_URL` | Gateway | CORS origin, default `http://localhost:5173` |

Never commit `.env`.

## Database setup

1. Open Supabase **SQL Editor**.
2. Run the script in `engine/migrations/001_create_tables.sql` (pgvector extension, `policy_embeddings` table, RLS policies, `match_policies` RPC).

## Python environment (engine)

```bash
cd engine
python3.13 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Install Node dependencies

From the repo root:

```bash
npm install
```

### Frontend dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.0.0 | UI framework |
| `react-dom` | ^19.0.0 | React DOM renderer |
| `three` | ^0.183.2 | 3D rendering engine |
| `@react-three/fiber` | ^9.5.0 | React renderer for Three.js |
| `@react-three/drei` | ^10.7.7 | Helpers and abstractions for R3F |
| `framer-motion` | ^12.38.0 | Animation library (transitions, layout animations, springs) |
| `@supabase/supabase-js` | ^2.49.1 | Supabase client (auth + data) |
| `recharts` | ^2.15.0 | Chart components |
| `lucide-react` | ^0.469.0 | Icon set |
| `tailwindcss` | ^4.0.0 | Utility-first CSS (dev) |
| `@tailwindcss/vite` | ^4.0.0 | Tailwind Vite plugin (dev) |
| `vite` | ^6.0.5 | Build tool (dev) |
| `typescript` | ~5.6.2 | Type checking (dev) |

## Run locally

Start three processes (three terminals):

```bash
# 1 — Engine (from engine/, with venv active)
cd engine && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# 2 — Gateway (from repo root or gateway/)
cd gateway && npm run dev

# 3 — Frontend
cd frontend && npm run dev
```

- App: **http://localhost:5173**
- Gateway: **http://localhost:3001**
- Engine: **http://localhost:8000**

Optional: from root, after `npm install` and with `concurrently` available:

```bash
npm run dev
```

(Ensure the engine venv is on your PATH or adjust the `dev:engine` script to activate `.venv` if you use this.)

If port **8000** is busy:

```bash
lsof -ti:8000 | xargs kill -9
```

## Seed data (no ingestion required)

`engine/app/seed_data.py` holds curated examples derived from sample policies in `Medical Drug Coverage Policy Examples/`. If vector search is empty or Supabase is unreachable, `/query` falls back to seed data so the UI works without ingesting PDFs.

Example searches:

| Payer | Drug |
|-------|------|
| Blue Cross NC | Avastin, Herceptin |
| Cigna | Rituxan |
| Florida Blue | Avastin |
| UnitedHealthcare | Botox, Myobloc |

## Batch ingest PDFs

With `.env` configured and migration applied:

```bash
cd engine && source .venv/bin/activate
python -m scripts.batch_ingest --dry-run   # parse + normalize only
python -m scripts.batch_ingest             # full pipeline → Supabase
```

Default PDF directory: `Medical Drug Coverage Policy Examples/`. Override with `--dir /path/to/pdfs`.

## API (engine)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| POST | `/ingest/` | Multipart: `file` (PDF), `payer_name` |
| POST | `/query/` | JSON: `drug_name`, `payer_name`, optional `patient_question` |

Authenticated calls from the browser go through the gateway: **`POST /api/query`**, **`POST /api/ingest`** (Bearer token).

## License

Add a license if you open-source the repo.
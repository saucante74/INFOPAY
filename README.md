# InfoPay AI — Payslip Analytics & Assistant

A hybrid analytics + RAG assistant for payslips: upload PDF payslips, get exact
multi-month calculations (via Pandas), and ask natural-language questions
about payslip line items (via a vector search RAG pipeline on ChromaDB).

## Backend setup

```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and paste your ANTHROPIC_API_KEY

uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/api/health` should return `{"status": "ok"}`.
Interactive docs: `http://localhost:8000/docs` — useful to test `/api/upload`
(with a real PDF) and `/api/chat` without waiting on the frontend.

> Requires Python 3.12. ChromaDB does not currently support Python 3.14
> (native dependency build failures) — see the note at the bottom.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:8000
npm run dev
```

Open `http://localhost:5173`. The frontend expects the backend to be running
on port 8000 (locally or via Docker).

Tailwind v4 is configured via `@theme` directly in `src/index.css` (no
separate `tailwind.config.js` — that's the new Tailwind 4 approach).

## What's already working

- Full Pydantic extraction schema (all 8 required fields)
- PDF -> LLM structured extraction pipeline (handles varied payslip layouts)
- ChromaDB vector indexing (local embeddings, no external API needed for that)
- Pandas analytics engine (sum/average/min/max over the last N months)
- 2-node LangGraph graph (agent + tools) routed via Claude tool-calling
- `/api/upload`, `/api/payslips`, `/api/chat` endpoints
- React frontend: drag & drop upload, summary table, evolution chart, chat
- Docker Compose for both services

## Docker

```bash
# From the project root
cp backend/.env.example backend/.env   # then paste your API key
docker compose up --build
```

The first build takes a few minutes (langchain, langgraph, chromadb are heavy
dependencies). Data (SQLite + ChromaDB) is persisted on the host in
`backend/data/`, so it survives container rebuilds and restarts.

Backend: `http://localhost:8000/api/health`
Frontend: `http://localhost:5173`

## Running tests

Backend only for now (see "What's left to do"). Tests never call the real
Anthropic API or touch the real database/ChromaDB in `backend/data/` — the
LLM, vector store and DB session are all replaced with fakes/an in-memory
SQLite DB (see `backend/tests/conftest.py`).

```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt   # pytest, pytest-mock, pytest-cov, mypy...

pytest tests/                                      # full suite
pytest tests/unit/test_analytics.py                # one file
pytest tests/unit/test_analytics.py::test_somme     # one test
pytest tests/ -v                                    # verbose (per-test pass/fail)
pytest tests/ --cov=app --cov-report=term-missing    # with coverage
```

Also run `mypy --strict app/` before committing — both `mypy` and `pytest`
run in CI on every push/PR touching `backend/` (`.github/workflows/`).

## What's left to do

1. **Test with real payslip PDFs** (varied formats if possible) to validate
   extraction — this is the most fragile part, test it first.
2. Adjust the extraction prompt (`extraction.py`) if some fields are
   misextracted on your real payslip formats.
3. The frontend bundle has a size warning (~650 kB, due to Recharts) — not
   blocking for a demo, can be optimized later with dynamic `import()`
   code-splitting.

## Notes

- Model used throughout: `claude-sonnet-4-6` (`EXTRACTION_MODEL` in
  `extraction.py`, `CHAT_MODEL` in `graph.py`) — change if needed.
- ChromaDB and langchain/langgraph are heavy dependencies (tens of MB) — first
  install can take a few minutes.
- **Python 3.14 compatibility**: ChromaDB currently fails to build on Python
  3.14 (missing wheels for a native dependency, plus an internal Pydantic v1
  compatibility bug). Use Python 3.12 for this project until upstream fixes
  land.
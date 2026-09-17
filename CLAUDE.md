# CLAUDE.md

This file gives Claude Code the context it needs to work effectively in this
repository. Read this before making changes.

## Project overview

InfoPay AI is a hybrid analytics + RAG assistant for French payslips
("bulletins de paie"). Users upload payslip PDFs; the app extracts structured
data, stores it for exact calculations, and answers natural-language
questions using a hybrid agent (exact Pandas calculations + vector search
explanations).

**Core design principle**: the LLM never performs arithmetic itself. It
decides which tool to call (exact calculation vs. explanatory search) and
delegates execution to deterministic code. This is the single most important
architectural decision in this codebase — preserve it in any change.

## Stack

- **Backend**: Python 3.12 (not 3.14 — see Known issues), FastAPI, SQLModel/SQLite,
  Pandas, ChromaDB, LangChain, LangGraph, Claude API (`langchain-anthropic`)
- **Frontend**: React 19 + **TypeScript** (strict) + Vite, Tailwind v4, Recharts,
  lucide-react, axios; ESLint (flat config, type-aware) + Prettier
- **Infra**: Docker Compose (backend + frontend services)

## Commands

Backend:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
cd frontend
npm run dev          # dev server
npm run build        # tsc -b && vite build — type errors fail the build
npm run typecheck    # tsc -b on its own
npm run lint         # ESLint (type-aware)
npm run format       # Prettier --write  (format:check for CI)
```

Regenerate the frontend's API types after any change to a backend route's
request/response shape — they are generated from the live OpenAPI schema,
not hand-written (backend must be running current code):
```bash
cd frontend && npm run generate:api-types   # -> src/api/schema.ts
```

Full stack:
```bash
docker compose up --build
```

Verify backend syntax/imports without running the server:
```bash
cd backend && python3 -m py_compile app/**/*.py
```

Backend tests (pytest, see `backend/tests/`):
```bash
cd backend && source venv/bin/activate
pytest tests/                                     # full suite
pytest tests/ --cov=app --cov-report=term-missing  # with coverage
mypy --strict app/                                 # type check
```

The frontend has **no** test suite yet. When adding one, prefer Vitest +
React Testing Library. Ask before choosing a different framework.

## Conventions

See `CONVENTIONS.md` for the full architecture and language-specific style
guide (SOLID applied to this codebase, idiomatic Python patterns, TypeScript
migration standards). Key points to always respect:

- **Backend**: French docstrings/comments are acceptable in existing files
  (the author is French-speaking), but prefer English for new code unless
  told otherwise — this is being standardized project-wide.
- **The agent graph is intentionally hand-written**, not built with
  `create_react_agent` or similar prebuilt abstractions. Keep it explicit and
  legible — this is a deliberate choice for interview/demo purposes, not an
  oversight to "fix" by simplifying to a prebuilt agent.
- **Never let the LLM compute a number.** Any new capability requiring
  arithmetic (sums, averages, comparisons, trends) must go through
  `analytics.py` / Pandas, exposed as a new tool if needed — not inline LLM
  reasoning.
- **Field names**: the 8 canonical payslip fields are fixed by
  `PayslipExtraction` (`mois_annee`, `salaire_brut`, `net_imposable`,
  `net_a_payer`, `total_cotisations_salariales`, `total_cotisations_patronales`,
  `cotisations_retraite`, `prelevement_source`). Don't rename them without
  updating the schema, the DB model, `analytics.py`'s `FIELD_MAP`, and the
  frontend table/chart together.
- **Data persistence paths**: SQLite lives at `backend/data/infopay.db`,
  ChromaDB at `backend/data/chroma_data/`. Both are gitignored and mounted as
  a single Docker volume (`backend/data:/app/data`). Don't reintroduce
  separate top-level paths.
- **Markdown files** (README, this file, future docs) are written in English
  going forward.


## Workflow

- Git: monorepo, single repo for backend + frontend + docker-compose.yml at
  the root. Branches: `develop` for day-to-day work, `main` for stable
  milestones — but given the one-person, one-week timeline, working directly
  on `main` is also acceptable; don't over-engineer branch discipline for
  this project.
- Before committing generated files (zips, build artifacts, IDE folders like
  `.idea/`), check `.gitignore` covers them. If not, extend `.gitignore`
  rather than committing and cleaning up after.
- **TypeScript migration: done.** `frontend/` is TypeScript end to end
  (branch `feat/migrate-ts`); there are no `.jsx`/`.js` files left under
  `frontend/src/`. New frontend files are `.ts`/`.tsx`, with explicit props
  interfaces and no `any` — see `CONVENTIONS.md`, "TypeScript (frontend)",
  which documents the tsconfig/ESLint choices and the patterns to follow.
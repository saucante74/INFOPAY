# Coding conventions

This document defines the architecture principles and language-specific best
practices for this project. It's referenced from `CLAUDE.md` so agents follow
it, and it's also here so you (the author) can point to it in an interview as
evidence of deliberate, clean-code choices — not just "it works".

Every example below is written against this project's actual code, not
generic textbook code.

---

## SOLID, applied to this codebase

### Single Responsibility — already mostly respected, keep it that way

Each service does one thing: `extraction.py` only extracts, `vectorstore.py`
only indexes/searches, `analytics.py` only computes. Routers stay thin
(parse request → call service → return). **When adding a feature, resist the
urge to put logic in the router** — add it to a service instead.

### Open/Closed — tool-based agent design is naturally open for extension

Adding a third tool to the agent (e.g. a trend/anomaly detector) requires
zero changes to `graph.py`'s control flow — just add the function to
`tools.py`'s `TOOLS` list. That's OCP in practice: the graph is closed for
modification, open for extension via new tools.

### Liskov Substitution — relevant once we introduce abstractions (see DIP below)

Not yet exercised in the current code because there's no class hierarchy.
Becomes relevant the moment you introduce the `Protocol`-based abstractions
below: any concrete implementation must be substitutable without breaking
callers.

### Interface Segregation — keep Pydantic schemas focused

`PayslipExtraction` holds exactly the 8 fields needed for extraction — resist
adding unrelated fields (e.g. UI display preferences) to it "for
convenience". A schema that serves two purposes is a sign it should be two
schemas.

### Dependency Inversion — the highest-value refactor to demonstrate in an interview

Right now, `extraction.py` and `vectorstore.py` hardcode their concrete
implementation (`ChatAnthropic`, `chromadb.PersistentClient`). This works,
but it means swapping the LLM provider or the vector DB requires editing
business logic directly.

**Recommended refactor** — define thin `Protocol` interfaces (Python's
structural typing, PEP 544 — no inheritance required, just matching method
signatures) and depend on those instead of concrete classes:

```python
# app/interfaces.py
from typing import Any, Protocol

class Extractor(Protocol):
    def extract(self, raw_text: str) -> PayslipExtraction: ...

class VectorStore(Protocol):
    def index(self, payslip_id: int, mois_annee: str, raw_text: str) -> None: ...
    def search(self, query: str, n_results: int = 3) -> list[dict[str, Any]]: ...
```

`extraction.py`'s current function becomes a class implementing `Extractor`;
`vectorstore.py`'s functions become a class implementing `VectorStore`. The
router and the agent tools depend on the `Protocol`, not on `ChatAnthropic`
or `chromadb` directly.

**Why this matters for the interview**: it's the concrete, defensible answer
to "how would you make this maintainable as it grows?" — swapping Claude for
another provider, or ChromaDB for FAISS/Pinecone, becomes a one-file change
instead of a hunt through the codebase. Don't do this speculatively for every
class — apply it specifically where you'd realistically want to swap an
implementation (LLM provider, vector store), not everywhere.

---

## Static type checking

The `Protocol`-based interfaces above are only as good as their enforcement.
`mypy --strict` is how that enforcement actually happens — a `Protocol`
nobody type-checks against is just a comment.

**Run it locally:**

```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt   # installs mypy on top of requirements.txt
mypy --strict app/
```

A GitHub Actions workflow (`.github/workflows/mypy.yml`) runs the same
command on every push/PR touching `backend/`, so a type error fails CI
instead of surfacing later.

**`requirements-dev.txt`, separate from `requirements.txt`.** The
`Dockerfile` installs `requirements.txt` straight into the runtime image
(`COPY requirements.txt . && pip install -r requirements.txt`). A type
checker and its stub packages have no business shipping to production, so
`requirements-dev.txt` starts with `-r requirements.txt` (single source of
truth for the real dependencies) and adds `mypy` and `pandas-stubs` on top —
only installed in dev and in CI.

**The `pydantic.mypy` plugin (`backend/mypy.ini`) is required, not
optional.** `langchain-anthropic`'s `ChatAnthropic` declares several
constructor fields with a Pydantic `alias`, e.g.
`model: str = Field(alias="model_name")`. Without the plugin, mypy
synthesises `__init__` from the *aliases* and rejects the normal
`ChatAnthropic(model=..., temperature=...)` call sites used throughout this
codebase (`Unexpected keyword argument "model"`, plus spurious "missing
argument" errors for other aliased, defaulted fields). The plugin teaches
mypy about Pydantic's own `populate_by_name` behavior, so the constructor
call sites can stay exactly as `langchain-anthropic`'s own docs write them.

```ini
# backend/mypy.ini
[mypy]
python_version = 3.12
plugins = pydantic.mypy
```

---

## Python idioms (the equivalent of PHP's `array_map`/`match()`)

Python's idiomatic style differs from PHP's in one key way: **comprehensions
are preferred over `map()`/`filter()`** for most cases — the Python community
considers comprehensions more readable than a chain of higher-order function
calls. Use `map()`/`filter()`/`functools.reduce()` only when passing an
already-named function, not a fresh lambda.

| Task | Avoid | Idiomatic Python |
|---|---|---|
| Transform a list | manual loop + `.append()` | list comprehension: `[f(x) for x in xs]` |
| Filter + transform | nested loop with `if` | `[f(x) for x in xs if cond(x)]` |
| Build a dict | loop with `d[k] = v` | dict comprehension: `{k: v(k) for k in ks}` |
| Multi-branch dispatch | long `if/elif/elif` chain | `match` statement (Python 3.10+, like PHP 8's `match()`) |
| String formatting | `.format()` / `%` | f-strings: `f"{value:.2f}"` |
| File/resource handling | manual open/close | `with` context managers |
| Optional/nullable checks | `if x is not None: y = x else: y = default` | walrus operator or `x or default` where safe |
| Path manipulation | string concatenation | `pathlib.Path` |
| Magic strings for fixed options | bare strings compared with `==` | `enum.Enum` or `Literal[...]` (already used in `analytics.py`'s `Operation`) |

### Concrete example from this codebase: `match` instead of `if/elif`

`analytics.py`'s `run_analytics_query` currently uses `if/elif/elif/else` to
dispatch on `operation`. The idiomatic Python 3.10+ equivalent — direct
parallel to PHP 8's `match()` — is:

```python
match operation:
    case "somme":
        value = series.sum()
    case "moyenne":
        value = series.mean()
    case "min":
        value = series.min()
    case "max":
        value = series.max()
    case _:
        return {"error": f"Opération inconnue: {operation}"}
```

Cleaner, and `match` supports structural pattern matching beyond simple
equality (useful if a future case needs to match on tuples/shapes, not just
scalar values).

### Other conventions to apply going forward

- **Type hints everywhere.** Already done in most of this codebase — keep it
  up. Use built-in generics (`list[str]`, `dict[str, int]`) rather than
  `typing.List`/`typing.Dict` (unnecessary since Python 3.9).
- **Pydantic/dataclasses over raw dicts** for any structured data that
  crosses a function boundary — already the pattern here, don't regress to
  passing loose dicts around except at tool I/O boundaries (which is
  reasonable, since LLM tool calls are inherently untyped JSON).
- **Custom exceptions over bare `Exception`.** E.g. `upload.py` currently
  catches a bare `Exception` from extraction — consider a
  `PayslipExtractionError` raised from `extraction.py` so the router can
  catch something specific rather than "anything went wrong".
- **`functools.lru_cache`** for any pure function called repeatedly with the
  same arguments (not yet needed here, but relevant if `_load_dataframe()` in
  `analytics.py` becomes a bottleneck).

---

## TypeScript best practices (for the upcoming JS → TS migration)

Plan: a dedicated `feature/typescript-migration` branch, converting file by
file (`.jsx` → `.tsx`, `.js` → `.ts`), not a big-bang rewrite.

### Non-negotiables

- **`"strict": true`** in `tsconfig.json` from day one. Migrating into a
  non-strict config and tightening later is more work than starting strict.
- **No `any`.** Where the type is genuinely unknown (e.g. a caught error),
  use `unknown` and narrow with a type guard, not `any`.
- **Type every component's props** with an explicit `interface` or `type`,
  never implicit/inferred-from-usage props.

### High-value patterns for this specific codebase

**1. Generate types from the backend automatically, don't hand-write them
twice.** FastAPI auto-generates an OpenAPI schema at
`http://localhost:8000/openapi.json`. Use `openapi-typescript` to generate a
`Payslip` type directly from the Pydantic schema:

```bash
npm install -D openapi-typescript
npx openapi-typescript http://localhost:8000/openapi.json -o src/api/schema.ts
```

This keeps frontend and backend types in sync automatically — a strong
signal of engineering maturity to mention in an interview ("the frontend
types are generated from the backend schema, not duplicated by hand").

**2. Discriminated unions instead of multiple booleans for UI state.**
`UploadZone.jsx` currently tracks `status` as a loose string
(`null | "uploading" | "error"`) plus a separate `errorMessage` string. In
TypeScript, model this as a proper discriminated union:

```typescript
type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "error"; message: string }
  | { status: "success"; payslip: Payslip };
```

This makes invalid states (e.g. `status: "error"` with no message)
unrepresentable — the compiler catches it, not a runtime bug.

**3. Type the API client's return values**, not just its parameters:

```typescript
export async function fetchPayslips(): Promise<Payslip[]> {
  const { data } = await api.get<Payslip[]>("/api/payslips");
  return data;
}
```

**4. `satisfies` operator (TS 4.9+)** for object literals that should be
checked against a type without widening it — useful for the `SUGGESTIONS`
array or similar constant config objects.

### Tooling

- ESLint with `@typescript-eslint`, Prettier for formatting — set up once at
  the start of the migration branch, not retrofitted after.
- Keep `.jsx` and `.tsx` files both buildable during the migration (Vite
  handles this natively) so the branch stays shippable at every commit,
  rather than one giant unreviewable diff.

---

## What NOT to over-engineer

Given the one-week timeline, apply the DIP refactor (Protocol interfaces) and
the TS migration because they're genuinely good interview talking points and
not expensive. Skip, for now: a full repository/unit-of-work pattern over
SQLModel, a dependency-injection framework, or splitting the FastAPI app into
multiple microservices — none of that is proportionate to this project's
size, and over-engineering a one-week MVP is itself a signal to avoid in an
interview ("do I know when to stop" matters as much as "do I know the
pattern").
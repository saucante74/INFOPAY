"""
Abstractions the application depends on (Dependency Inversion).

These are PEP 544 `Protocol`s: structural typing, so a concrete class only
has to match the method signatures -- no inheritance, no registration.

Callers (routers, agent tools) type their dependencies against these
protocols instead of importing `ChatAnthropic` or `chromadb` directly, so
swapping the LLM provider or the vector database is a change in
`app/dependencies.py` plus one new implementation class, not a hunt through
the business logic.

Only the two genuinely swappable dependencies are abstracted here (LLM
provider, vector store) -- see CONVENTIONS.md, "Dependency Inversion".
"""
from typing import Any, Protocol

from app.models.payslip import PayslipExtraction


class Extractor(Protocol):
    """Turns the raw text of a payslip into the 8 canonical fields."""

    def extract(self, raw_text: str) -> PayslipExtraction:
        ...


class VectorStore(Protocol):
    """Indexes payslip text and searches it by semantic similarity."""

    def index(self, payslip_id: int, mois_annee: str, raw_text: str) -> None:
        ...

    def search(self, query: str, n_results: int = 3) -> list[dict[str, Any]]:
        ...

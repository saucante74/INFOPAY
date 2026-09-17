"""
Composition root: the single place that knows which concrete implementation
backs each abstraction of `app/agent/interfaces.py`.

Everything else (routers, agent tools) depends on the `Protocol`s and asks
for an instance here, so swapping Claude for another provider, or ChromaDB
for FAISS/Pinecone, is a one-line change in this file.

No DI framework on purpose: these are plain factory functions. In FastAPI
routers they are used with `Depends(...)`, which also makes them trivial to
override in tests via `app.dependency_overrides`.
"""
from app.agent.interfaces import Extractor, VectorStore
from app.services.extraction import get_default_extractor
from app.services.vectorstore import get_default_vector_store


def get_extractor() -> Extractor:
    """The payslip extractor used by the application (Claude)."""
    return get_default_extractor()


def get_vector_store() -> VectorStore:
    """The vector store used by the application (ChromaDB, embedded)."""
    return get_default_vector_store()

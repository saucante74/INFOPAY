"""
Couche RAG : indexation du texte brut de chaque bulletin dans ChromaDB,
et recherche par similarité pour répondre aux questions explicatives
("à quoi correspond la ligne X ?").

ChromaDB tourne en mode embarqué (PersistentClient), pas besoin de
serveur séparé pour ce projet.

`ChromaVectorStore` est l'implémentation ChromaDB du Protocol
`app.agent.interfaces.VectorStore`. Passer à FAISS/Pinecone revient à
écrire une classe exposant les mêmes `index()` / `search()` et à la câbler
dans `app/dependencies.py`.
"""
from functools import lru_cache

import chromadb
from chromadb.utils import embedding_functions

CHROMA_PATH = "./data/chroma_data"
COLLECTION_NAME = "payslips"


def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """Découpage simple par fenêtre glissante. Les bulletins sont courts
    (1-2 pages) donc un chunking basique suffit largement."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks or [text]


class ChromaVectorStore:
    """Implémentation de `VectorStore` adossée à une collection ChromaDB
    persistante locale."""

    def __init__(self, path: str = CHROMA_PATH, collection_name: str = COLLECTION_NAME) -> None:
        client = chromadb.PersistentClient(path=path)
        # Embedding function par défaut de Chroma (all-MiniLM-L6-v2, local, gratuit).
        # Suffisant pour ce cas d'usage et évite une dépendance à une API d'embedding.
        embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        self._collection = client.get_or_create_collection(
            name=collection_name,
            embedding_function=embedding_fn,
        )

    def index(self, payslip_id: int, mois_annee: str, raw_text: str) -> None:
        chunks = _chunk_text(raw_text)
        ids = [f"payslip-{payslip_id}-chunk-{i}" for i in range(len(chunks))]
        metadatas = [{"payslip_id": payslip_id, "mois_annee": mois_annee} for _ in chunks]

        self._collection.add(documents=chunks, ids=ids, metadatas=metadatas)

    def search(self, query: str, n_results: int = 3) -> list[dict]:
        results = self._collection.query(query_texts=[query], n_results=n_results)

        hits = []
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        for doc, meta in zip(documents, metadatas):
            hits.append({"text": doc, "mois_annee": meta.get("mois_annee")})
        return hits


@lru_cache(maxsize=1)
def get_default_vector_store() -> ChromaVectorStore:
    """Instance partagée par défaut. Câblée dans `app/dependencies.py`.

    Construite à la première utilisation plutôt qu'à l'import du module :
    le client Chroma n'est ouvert que si l'application s'en sert réellement.
    """
    return ChromaVectorStore()


def index_payslip(payslip_id: int, mois_annee: str, raw_text: str) -> None:
    """Compatibilité ascendante : ancienne API fonctionnelle, déléguée à
    l'instance par défaut. Préférer injecter un `VectorStore`."""
    get_default_vector_store().index(payslip_id, mois_annee, raw_text)


def search_payslip_knowledge(query: str, n_results: int = 3) -> list[dict]:
    """Compatibilité ascendante : voir `index_payslip`."""
    return get_default_vector_store().search(query, n_results)

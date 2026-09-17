"""
Couche RAG : indexation du texte brut de chaque bulletin dans ChromaDB,
et recherche par similarité pour répondre aux questions explicatives
("à quoi correspond la ligne X ?").

ChromaDB tourne en mode embarqué (PersistentClient), pas besoin de
serveur séparé pour ce projet.
"""
import chromadb
from chromadb.utils import embedding_functions

CHROMA_PATH = "./chroma_data"
COLLECTION_NAME = "payslips"

_client = chromadb.PersistentClient(path=CHROMA_PATH)

# Embedding function par défaut de Chroma (all-MiniLM-L6-v2, local, gratuit).
# Suffisant pour ce cas d'usage et évite une dépendance à une API d'embedding.
_embedding_fn = embedding_functions.DefaultEmbeddingFunction()

_collection = _client.get_or_create_collection(
    name=COLLECTION_NAME,
    embedding_function=_embedding_fn,
)


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


def index_payslip(payslip_id: int, mois_annee: str, raw_text: str) -> None:
    chunks = _chunk_text(raw_text)
    ids = [f"payslip-{payslip_id}-chunk-{i}" for i in range(len(chunks))]
    metadatas = [{"payslip_id": payslip_id, "mois_annee": mois_annee} for _ in chunks]

    _collection.add(documents=chunks, ids=ids, metadatas=metadatas)


def search_payslip_knowledge(query: str, n_results: int = 3) -> list[dict]:
    results = _collection.query(query_texts=[query], n_results=n_results)

    hits = []
    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]
    for doc, meta in zip(documents, metadatas):
        hits.append({"text": doc, "mois_annee": meta.get("mois_annee")})
    return hits

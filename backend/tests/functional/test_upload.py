"""
Tests fonctionnels de `/api/upload` et `/api/payslips` via `TestClient`.

`Extractor` et `VectorStore` sont remplacés par les doublures de
conftest.py (`fake_extractor`, `fake_vector_store`) via
`app.dependency_overrides` ; la base est un SQLite en mémoire
(`test_engine`). Rien ici n'écrit dans `backend/data/`.
"""
from __future__ import annotations


def test_upload_happy_path_persists_and_indexes(client, fake_extractor, fake_vector_store, sample_pdf_bytes):
    response = client.post(
        "/api/upload", files={"file": ("bulletin.pdf", sample_pdf_bytes, "application/pdf")}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert body["mois_annee"] == "03/2025"
    assert body["net_a_payer"] == 2300.0
    assert body["filename"] == "bulletin.pdf"
    assert "BULLETIN DE PAIE MARS 2025" in body["raw_text"]

    # L'extracteur a bien reçu le texte extrait du PDF, pas un texte vide.
    assert fake_extractor.calls and "BULLETIN DE PAIE MARS 2025" in fake_extractor.calls[0]

    # L'indexation vectorielle a lieu après le commit, avec l'id réel en base.
    assert fake_vector_store.indexed == [(1, "03/2025")]


def test_upload_rejects_non_pdf_content_type(client, fake_vector_store):
    response = client.post("/api/upload", files={"file": ("notes.txt", b"hello", "text/plain")})

    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]
    assert fake_vector_store.indexed == []  # jamais atteint


def test_upload_returns_422_when_extraction_fails(client, fake_extractor, fake_vector_store, sample_pdf_bytes):
    fake_extractor.exception = ValueError("Impossible d'extraire du texte de ce PDF (scan image ?).")

    response = client.post(
        "/api/upload", files={"file": ("bulletin.pdf", sample_pdf_bytes, "application/pdf")}
    )

    assert response.status_code == 422
    assert "Extraction impossible" in response.json()["detail"]
    assert "scan image" in response.json()["detail"]
    # Rien n'a été indexé puisque la ligne n'a jamais été committée.
    assert fake_vector_store.indexed == []


def test_list_payslips_empty_then_populated(client, sample_pdf_bytes):
    assert client.get("/api/payslips").json() == []

    client.post("/api/upload", files={"file": ("bulletin.pdf", sample_pdf_bytes, "application/pdf")})

    payslips = client.get("/api/payslips").json()
    assert len(payslips) == 1
    assert payslips[0]["mois_annee"] == "03/2025"

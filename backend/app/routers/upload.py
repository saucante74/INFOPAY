from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlmodel import Session

from app.db import get_session
from app.dependencies import get_extractor, get_vector_store
from app.interfaces import Extractor, VectorStore
from app.models.payslip import Payslip
from app.rate_limit import upload_rate_limit
from app.services.extraction import extract_text_from_pdf

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload", dependencies=[Depends(upload_rate_limit)])
async def upload_payslip(
    file: UploadFile,
    session: Session = Depends(get_session),
    extractor: Extractor = Depends(get_extractor),
    vector_store: VectorStore = Depends(get_vector_store),
) -> Payslip:
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")

    file_bytes = await file.read()

    raw_text = extract_text_from_pdf(file_bytes)
    try:
        extracted = extractor.extract(raw_text)
    except Exception as exc:  # extraction LLM ou parsing PDF échoués
        raise HTTPException(status_code=422, detail=f"Extraction impossible: {exc}") from exc

    payslip = Payslip(
        **extracted.model_dump(),
        raw_text=raw_text,
        filename=file.filename,
    )
    session.add(payslip)
    session.commit()
    session.refresh(payslip)

    # Indexation vectorielle pour le RAG, après avoir obtenu l'ID en base.
    # session.refresh() a peuplé la clé primaire auto-incrémentée : l'Optional
    # du modèle SQLModel n'est plus possible ici.
    assert payslip.id is not None
    vector_store.index(payslip.id, payslip.mois_annee, raw_text)

    return payslip


@router.get("/payslips")
def list_payslips(session: Session = Depends(get_session)) -> Sequence[Payslip]:
    from sqlmodel import select

    payslips = session.exec(select(Payslip).order_by(Payslip.mois_annee)).all()
    return payslips

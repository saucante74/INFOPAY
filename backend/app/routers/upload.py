from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlmodel import Session

from app.db import get_session
from app.models.payslip import Payslip
from app.services.extraction import extract_structured_data, extract_text_from_pdf
from app.services.vectorstore import index_payslip

router = APIRouter(prefix="/api", tags=["upload"])


@router.post("/upload")
async def upload_payslip(file: UploadFile, session: Session = Depends(get_session)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")

    file_bytes = await file.read()

    raw_text = extract_text_from_pdf(file_bytes)
    try:
        extracted = extract_structured_data(raw_text)
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

    # Indexation vectorielle pour le RAG, après avoir obtenu l'ID en base
    index_payslip(payslip.id, payslip.mois_annee, raw_text)

    return payslip


@router.get("/payslips")
def list_payslips(session: Session = Depends(get_session)):
    from sqlmodel import select

    payslips = session.exec(select(Payslip).order_by(Payslip.mois_annee)).all()
    return payslips

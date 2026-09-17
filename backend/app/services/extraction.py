"""
Pipeline d'extraction :

    PDF (bytes) --pdfplumber--> texte brut --LLM structuré--> PayslipExtraction

On extrait via le LLM plutôt que par regex/positions fixes car les
bulletins de paie ont des mises en page variées selon les logiciels de
paie (Silae, ADP, PayFit, etc.). Le LLM lit le texte brut et le fait
correspondre au schéma Pydantic, quelle que soit la mise en page.
"""
import io

import pdfplumber
from langchain_anthropic import ChatAnthropic

from app.models.payslip import PayslipExtraction

EXTRACTION_MODEL = "claude-sonnet-4-6"


def extract_text_from_pdf(file_bytes: bytes) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text() or ""
            text_parts.append(page_text)
    return "\n".join(text_parts).strip()


def extract_structured_data(raw_text: str) -> PayslipExtraction:
    if not raw_text:
        raise ValueError("Impossible d'extraire du texte de ce PDF (scan image ?).")

    llm = ChatAnthropic(model=EXTRACTION_MODEL, temperature=0)
    structured_llm = llm.with_structured_output(PayslipExtraction)

    prompt = (
        "Tu es un extracteur de données de bulletins de paie français. "
        "Analyse le texte brut suivant, extrait uniquement du bulletin, et "
        "renvoie les champs demandés. Les montants sont en euros, utilise "
        "le point comme séparateur décimal. Si un champ correspond à "
        "plusieurs lignes du bulletin (ex: cotisations retraite = base + "
        "complémentaire), fais la somme.\n\n"
        f"--- TEXTE DU BULLETIN ---\n{raw_text}\n--- FIN DU TEXTE ---"
    )

    result = structured_llm.invoke(prompt)
    return result  # type: ignore[return-value]

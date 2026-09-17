"""
Schéma Pydantic utilisé pour :
1. Forcer une sortie structurée du LLM lors de l'extraction (with_structured_output)
2. Valider les données avant stockage en base
"""
from datetime import UTC, datetime
from typing import Optional

from pydantic import BaseModel, Field
from sqlmodel import SQLModel, Field as SQLField


class PayslipExtraction(BaseModel):
    """Schéma envoyé au LLM comme cible de l'extraction structurée.

    Les descriptions des champs sont importantes : elles sont injectées
    dans le prompt système du LLM via le tool-calling et guident
    l'extraction, y compris sur des formats de bulletin très différents.
    """

    mois_annee: str = Field(
        description="Mois et année du bulletin de paie, au format 'MM/YYYY' (ex: '03/2025')."
    )
    salaire_brut: float = Field(description="Salaire brut mensuel en euros.")
    net_imposable: float = Field(description="Net imposable en euros.")
    net_a_payer: float = Field(description="Net à payer (net versé au salarié) en euros.")
    total_cotisations_salariales: float = Field(
        description="Total des cotisations salariales (part salarié) en euros."
    )
    total_cotisations_patronales: float = Field(
        description="Total des cotisations patronales (part employeur) en euros."
    )
    cotisations_retraite: float = Field(
        description="Total des cotisations retraite (base + complémentaire) en euros."
    )
    prelevement_source: float = Field(
        description="Montant du prélèvement à la source (impôt sur le revenu) en euros."
    )


class Payslip(SQLModel, table=True):
    """Table SQLite : version persistée d'un bulletin, avec le texte brut
    conservé pour être ré-indexé dans ChromaDB si besoin.
    """

    id: Optional[int] = SQLField(default=None, primary_key=True)
    mois_annee: str
    salaire_brut: float
    net_imposable: float
    net_a_payer: float
    total_cotisations_salariales: float
    total_cotisations_patronales: float
    cotisations_retraite: float
    prelevement_source: float
    raw_text: str = SQLField(description="Texte brut extrait du PDF, source pour le RAG")
    filename: str
    created_at: datetime = SQLField(default_factory=lambda: datetime.now(UTC))

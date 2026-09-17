"""
Moteur de calcul exact. Aucune valeur numérique renvoyée par ces
fonctions ne passe par le LLM : le LLM choisit QUELS calculs faire
(operation, champ, période), mais l'exécution est du Pandas pur.
"""
from datetime import datetime
from typing import Literal, TypedDict

import pandas as pd
from sqlmodel import Session, select

from app.db import engine
from app.models.payslip import Payslip

FIELD_MAP = {
    "salaire_brut": "salaire_brut",
    "net_imposable": "net_imposable",
    "net_a_payer": "net_a_payer",
    "cotisations_salariales": "total_cotisations_salariales",
    "cotisations_patronales": "total_cotisations_patronales",
    "cotisations_retraite": "cotisations_retraite",
    "prelevement_source": "prelevement_source",
}

Operation = Literal["somme", "moyenne", "min", "max"]


class AnalyticsSuccess(TypedDict):
    """Forme renvoyée quand le calcul a pu être exécuté."""

    operation: Operation
    champ: str
    periode: str
    resultat: float


class AnalyticsError(TypedDict):
    """Forme renvoyée quand la requête est invalide ou ne peut aboutir
    (champ inconnu, opération inconnue, aucun bulletin importé)."""

    error: str


# Union à deux formes fixes plutôt que `dict[str, Any]` : le LLM et les
# appelants savent exactement à quoi s'attendre, succès ou erreur.
AnalyticsResult = AnalyticsSuccess | AnalyticsError


def _load_dataframe() -> pd.DataFrame:
    with Session(engine) as session:
        payslips = session.exec(select(Payslip)).all()

    if not payslips:
        return pd.DataFrame()

    df = pd.DataFrame([p.model_dump() for p in payslips])
    # mois_annee au format 'MM/YYYY' -> colonne datetime triable
    df["_date"] = pd.to_datetime(df["mois_annee"], format="%m/%Y")
    return df.sort_values("_date")


def run_analytics_query(
    operation: Operation,
    champ: str,
    derniers_n_mois: int | None = None,
) -> AnalyticsResult:
    """Exécute un calcul exact sur les bulletins stockés.

    Args:
        operation: 'somme' | 'moyenne' | 'min' | 'max'
        champ: une des clés de FIELD_MAP
        derniers_n_mois: si fourni, ne considère que les N bulletins les
            plus récents ; sinon, considère tout l'historique.
    """
    if champ not in FIELD_MAP:
        return {"error": f"Champ inconnu: {champ}. Champs valides: {list(FIELD_MAP)}"}

    df = _load_dataframe()
    if df.empty:
        return {"error": "Aucun bulletin de paie n'a encore été importé."}

    if derniers_n_mois:
        df = df.tail(derniers_n_mois)

    column = FIELD_MAP[champ]
    series = df[column]

    if operation == "somme":
        value = series.sum()
    elif operation == "moyenne":
        value = series.mean()
    elif operation == "min":
        value = series.min()
    elif operation == "max":
        value = series.max()
    else:
        return {"error": f"Opération inconnue: {operation}"}

    return {
        "operation": operation,
        "champ": champ,
        "periode": f"{len(df)} mois ({df['mois_annee'].iloc[0]} à {df['mois_annee'].iloc[-1]})",
        "resultat": round(float(value), 2),
    }

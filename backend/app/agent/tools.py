from typing import Any, Optional, cast

from langchain_core.tools import tool

from app.dependencies import get_vector_store
from app.services.analytics import Operation, run_analytics_query


@tool
def query_analytics(
    operation: str,
    champ: str,
    derniers_n_mois: Optional[int] = None,
) -> dict[str, Any]:
    """Calcule une valeur EXACTE (somme, moyenne, min, max) sur les bulletins
    de paie déjà importés par l'utilisateur. Utilise CET outil dès que la
    question porte sur un total, une moyenne, une évolution chiffrée ou une
    période (ex: 'total cotisations retraite sur 4 mois', 'moyenne du net
    à payer').

    Args:
        operation: 'somme', 'moyenne', 'min' ou 'max'.
        champ: un parmi 'salaire_brut', 'net_imposable', 'net_a_payer',
            'cotisations_salariales', 'cotisations_patronales',
            'cotisations_retraite', 'prelevement_source'.
        derniers_n_mois: nombre de mois les plus récents à considérer.
            Omettre pour utiliser tout l'historique disponible.
    """
    # `operation` reste un `str` nu : la signature de ce tool est le schéma
    # envoyé au LLM, un Literal y changerait le contrat. run_analytics_query
    # valide déjà les valeurs inconnues et renvoie une erreur métier.
    return run_analytics_query(
        operation=cast(Operation, operation), champ=champ, derniers_n_mois=derniers_n_mois
    )


@tool
def search_payslip_knowledge_tool(query: str) -> dict[str, Any]:
    """Recherche dans le texte brut des bulletins de paie pour EXPLIQUER
    une notion, une ligne de paie ou un terme technique (ex: 'à quoi
    correspond la sécurité sociale déplafonnée', 'qu'est-ce que le CSG').
    N'utilise PAS cet outil pour des calculs chiffrés : utilise
    query_analytics dans ce cas.

    Args:
        query: la question ou le terme à rechercher.
    """
    # Résolu à l'appel, pas à l'import : le tool dépend du Protocol
    # VectorStore, pas de ChromaDB. La signature exposée au LLM reste
    # inchangée (aucun paramètre d'infrastructure ne doit y apparaître).
    hits = get_vector_store().search(query)
    return {"extraits_trouves": hits}


TOOLS = [query_analytics, search_payslip_knowledge_tool]

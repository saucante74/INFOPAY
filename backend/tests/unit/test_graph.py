"""
Tests unitaires du graphe LangGraph (`app/agent/graph.py`).

Le seul appel externe du graphe est `_llm.invoke(...)` (un objet unique,
construit au niveau module) : on le remplace entièrement par un double
programmable. `_llm` est un `RunnableBinding` Pydantic — ses attributs ne
sont pas settables individuellement (`AttributeError`), donc on remplace
l'objet module-level en entier plutôt que de patcher `.invoke` dessus.

Le premier test ne passe jamais par les tools : boucle "agent -> END"
uniquement. Le second va jusqu'au bout de la boucle "agent -> tools ->
agent -> END" en laissant `query_analytics` s'exécuter pour de vrai contre
un moteur SQLite en mémoire (`analytics.engine` monkeypatché) — c'est
la seule façon de vérifier que le graphe écrit à la main (voir sa
docstring : volontairement pas de `create_react_agent`) route bien les
tool_calls vers `ToolNode` et boucle correctement, sans reconstruire
LangGraph à la main.
"""
from __future__ import annotations

from langchain_core.messages import AIMessage
from sqlmodel import Session

import app.agent.graph as graph_mod
import app.services.analytics as analytics_mod
from app.models.payslip import Payslip


class _FakeLLM:
    """Remplace `_llm` : `.invoke()` renvoie les réponses de `responses`
    dans l'ordre, une par appel."""

    def __init__(self, responses: list[AIMessage]) -> None:
        self._responses = iter(responses)
        self.call_count = 0

    def invoke(self, messages):
        self.call_count += 1
        return next(self._responses)


def test_agent_answers_directly_when_no_tool_call_is_needed(monkeypatch):
    fake_llm = _FakeLLM([AIMessage(content="Bonjour, comment puis-je vous aider ?")])
    monkeypatch.setattr(graph_mod, "_llm", fake_llm)

    reply = graph_mod.run_chat("bonjour")

    assert reply == "Bonjour, comment puis-je vous aider ?"
    assert fake_llm.call_count == 1  # pas de boucle : END direct


def test_agent_calls_analytics_tool_then_answers(monkeypatch, test_engine):
    monkeypatch.setattr(analytics_mod, "engine", test_engine)
    with Session(test_engine) as session:
        session.add(
            Payslip(
                mois_annee="03/2025",
                salaire_brut=3000.0,
                net_imposable=2400.0,
                net_a_payer=2300.0,
                total_cotisations_salariales=600.0,
                total_cotisations_patronales=900.0,
                cotisations_retraite=350.0,
                prelevement_source=120.0,
                raw_text="x",
                filename="f.pdf",
            )
        )
        session.commit()

    fake_llm = _FakeLLM(
        [
            AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "query_analytics",
                        "args": {"operation": "somme", "champ": "net_a_payer"},
                        "id": "call_1",
                        "type": "tool_call",
                    }
                ],
            ),
            AIMessage(content="Le total du net à payer est de 2300.0 euros."),
        ]
    )
    monkeypatch.setattr(graph_mod, "_llm", fake_llm)

    reply = graph_mod.run_chat("Quel est le total du net à payer ?")

    assert reply == "Le total du net à payer est de 2300.0 euros."
    # 2 appels : la décision d'appeler l'outil, puis la reformulation après
    # que ToolNode a exécuté query_analytics et renvoyé son résultat.
    assert fake_llm.call_count == 2

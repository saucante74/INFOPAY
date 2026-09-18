"""
Tests unitaires des schémas de `app/models/payslip.py` :

- `PayslipExtraction` (Pydantic) : validation des 9 champs canoniques
  utilisés pour guider l'extraction LLM et valider ses résultats (les 8
  historiques + `nom_entreprise`).
- `Payslip` (SQLModel) : compatibilité avec `PayslipExtraction.model_dump()`,
  exactement comme `upload.py` les enchaîne en production.

CLAUDE.md est explicite sur ces champs : "Don't rename them without
updating the schema, the DB model, analytics.py's FIELD_MAP, and the
frontend table/chart together." Ces tests servent de garde-fou contre un
renommage silencieux d'un seul côté.
"""
from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.payslip import Payslip, PayslipExtraction

CANONICAL_FIELDS = {
    "mois_annee",
    "nom_entreprise",
    "salaire_brut",
    "net_imposable",
    "net_a_payer",
    "total_cotisations_salariales",
    "total_cotisations_patronales",
    "cotisations_retraite",
    "prelevement_source",
}


def _valid_kwargs() -> dict:
    return dict(
        mois_annee="03/2025",
        nom_entreprise="ACME SARL",
        salaire_brut=3000.0,
        net_imposable=2400.0,
        net_a_payer=2300.0,
        total_cotisations_salariales=600.0,
        total_cotisations_patronales=900.0,
        cotisations_retraite=350.0,
        prelevement_source=120.0,
    )


def test_payslip_extraction_accepts_valid_data():
    extraction = PayslipExtraction(**_valid_kwargs())
    assert extraction.mois_annee == "03/2025"
    assert extraction.salaire_brut == 3000.0


def test_payslip_extraction_has_exactly_the_8_canonical_fields():
    # Garde-fou contre un renommage/ajout silencieux d'un champ d'un seul
    # côté (voir CLAUDE.md, "Field names").
    assert set(PayslipExtraction.model_fields) == CANONICAL_FIELDS


@pytest.mark.parametrize("missing_field", sorted(CANONICAL_FIELDS))
def test_payslip_extraction_missing_field_raises(missing_field):
    kwargs = _valid_kwargs()
    del kwargs[missing_field]
    with pytest.raises(ValidationError):
        PayslipExtraction(**kwargs)


def test_payslip_extraction_non_numeric_amount_raises():
    kwargs = _valid_kwargs()
    kwargs["salaire_brut"] = "trois mille euros"
    with pytest.raises(ValidationError):
        PayslipExtraction(**kwargs)


def test_payslip_extraction_field_descriptions_are_present():
    # Les descriptions sont injectées dans le prompt du LLM via
    # with_structured_output() : un champ sans description dégraderait
    # silencieusement la qualité d'extraction sans faire planter le code.
    for name, field in PayslipExtraction.model_fields.items():
        assert field.description, f"champ {name!r} sans description"


def test_payslip_row_accepts_extraction_model_dump():
    # Reproduit exactement l'enchaînement de upload.py :
    #   Payslip(**extracted.model_dump(), raw_text=..., filename=...)
    extraction = PayslipExtraction(**_valid_kwargs())
    payslip = Payslip(**extraction.model_dump(), raw_text="texte brut", filename="bulletin.pdf")
    assert payslip.mois_annee == "03/2025"
    assert payslip.net_a_payer == 2300.0
    assert payslip.id is None  # pas encore persisté


def test_payslip_nom_entreprise_defaults_to_none_when_absent():
    # Contrairement à `PayslipExtraction.nom_entreprise` (requis), le champ
    # est optionnel côté `Payslip` : une ligne construite sans lui (comme un
    # bulletin importé avant l'ajout de ce champ, relu depuis une base déjà
    # créée) reste valide plutôt que de lever. Le frontend affiche "Non
    # renseigné" pour ce cas.
    kwargs = _valid_kwargs()
    del kwargs["nom_entreprise"]
    payslip = Payslip(**kwargs, raw_text="texte brut", filename="bulletin.pdf")
    assert payslip.nom_entreprise is None


def test_payslip_created_at_defaults_to_now_and_survives_a_db_round_trip(test_engine):
    from sqlmodel import Session

    extraction = PayslipExtraction(**_valid_kwargs())
    payslip = Payslip(**extraction.model_dump(), raw_text="texte brut", filename="bulletin.pdf")
    assert payslip.created_at.tzinfo is not None  # aware juste après construction

    with Session(test_engine) as session:
        session.add(payslip)
        session.commit()
        session.refresh(payslip)
        assert payslip.created_at.tzinfo is None  # naïf après le premier refresh

    with Session(test_engine) as session:
        reloaded = session.get(Payslip, payslip.id)
        assert reloaded is not None
        assert reloaded.created_at.tzinfo is None  # naïf après un rechargement frais

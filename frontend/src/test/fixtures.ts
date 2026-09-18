/**
 * Shared test fixtures. Not a test file itself (doesn't match `*.test.ts`),
 * just a typed factory so every test that needs a `Payslip` doesn't repeat
 * its 10 fields by hand.
 */
import type { Payslip } from "../api/types";

let nextId = 1;

/** A valid `Payslip`, with any field overridable. Each call gets a fresh `id`. */
export function makePayslip(overrides: Partial<Payslip> = {}): Payslip {
  const id = nextId;
  nextId += 1;
  return {
    id,
    mois_annee: "01/2025",
    nom_entreprise: "ACME SARL",
    salaire_brut: 3000,
    net_imposable: 2400,
    net_a_payer: 2300,
    total_cotisations_salariales: 600,
    total_cotisations_patronales: 900,
    cotisations_retraite: 350,
    prelevement_source: 120,
    raw_text: "texte brut du bulletin",
    filename: "bulletin.pdf",
    created_at: "2025-01-31T00:00:00",
    ...overrides,
  };
}

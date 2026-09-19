/**
 * `../api/client` is mocked wholesale, same convention as `App.test.tsx`:
 * this page mounts `UploadZone`, `ChatPanel` and `usePayslips`, all of
 * which import from it, but none of their own behaviour is this file's
 * concern — only the "download a sample" banner is.
 */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithRouter } from "../test/helpers";
import AnalyzerPage from "./AnalyzerPage";

vi.mock("../api/client", () => ({
  fetchPayslips: vi.fn(),
  deletePayslip: vi.fn(),
  uploadPayslip: vi.fn(),
  formatRetryDelay: vi.fn(),
  getApiErrorMessage: vi.fn(),
  getRateLimit: vi.fn(),
  sendChatMessage: vi.fn(),
}));

describe("AnalyzerPage — sample payslip banner", () => {
  it("links to the Help page's downloadable-examples section", () => {
    renderWithRouter(<AnalyzerPage />);

    expect(
      screen.getByText("Pas de bulletin de paie ?", { exact: false })
    ).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: "Téléchargez un exemple pour tester l'application.",
    });
    expect(link).toHaveAttribute("href", "/aide#exemples");
  });
});

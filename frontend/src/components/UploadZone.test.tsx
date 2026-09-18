import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makePayslip } from "../test/fixtures";
import { assertDefined } from "../test/helpers";
import UploadZone from "./UploadZone";

vi.mock("../api/client", () => ({
  uploadPayslip: vi.fn(),
  getApiErrorMessage: vi.fn(),
  getRateLimit: vi.fn(),
  formatRetryDelay: vi.fn(),
}));

vi.mock("../hooks/useRateLimits", () => ({
  decrementRateLimit: vi.fn(),
}));

// Default: run the action immediately, as `requireAuth` does when already
// logged in — every existing test below exercises that path, unchanged
// from before this mock existed. The one test that cares about the gated
// (logged-out) path overrides this per-test — see "requires login before
// uploading".
vi.mock("../auth/authModal", () => ({
  requireAuth: vi.fn((action?: () => void) => {
    action?.();
  }),
}));

import { formatRetryDelay, getApiErrorMessage, getRateLimit, uploadPayslip } from "../api/client";
import { requireAuth } from "../auth/authModal";
import { decrementRateLimit } from "../hooks/useRateLimits";

const mockUploadPayslip = vi.mocked(uploadPayslip);
const mockGetApiErrorMessage = vi.mocked(getApiErrorMessage);
const mockGetRateLimit = vi.mocked(getRateLimit);
const mockFormatRetryDelay = vi.mocked(formatRetryDelay);
const mockRequireAuth = vi.mocked(requireAuth);
const mockDecrementRateLimit = vi.mocked(decrementRateLimit);

const pdfFile = new File(["contenu"], "bulletin.pdf", { type: "application/pdf" });
const txtFile = new File(["contenu"], "notes.txt", { type: "text/plain" });

function getInput(): HTMLInputElement {
  // The generic parameter, not a cast: `querySelector`'s overload accepts an
  // explicit element type and returns it directly, so there is nothing here
  // for `assertDefined` to narrow beyond null.
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  assertDefined(input, 'expected a <input type="file"> in the rendered UploadZone');
  return input;
}

/** Resolves/rejects only when the test tells it to, so the "uploading"
 * state can be observed before the promise settles. */
function deferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  mockUploadPayslip.mockReset();
  mockGetApiErrorMessage.mockReset();
  mockGetRateLimit.mockReset();
  mockFormatRetryDelay.mockReset();
  mockRequireAuth.mockReset().mockImplementation((action?: () => void) => {
    action?.();
  });
  mockDecrementRateLimit.mockReset();
});

describe("UploadZone", () => {
  it("shows the idle prompt initially", () => {
    render(<UploadZone onUploaded={vi.fn()} />);

    expect(
      screen.getByText(/Glissez un bulletin de paie \(PDF\) ici, ou cliquez pour parcourir/)
    ).toBeInTheDocument();
    expect(mockUploadPayslip).not.toHaveBeenCalled();
  });

  it("rejects a dropped non-PDF file without calling the API", () => {
    // Via drag & drop, not `userEvent.upload()`: user-event enforces the
    // input's `accept="application/pdf"` the way a real OS file picker
    // would and simply refuses to attach a mismatched file, which would
    // never reach the component's own guard at all. A drop bypasses any
    // picker-level filtering, so it's the realistic way an unfiltered file
    // reaches `handleFile`.
    render(<UploadZone onUploaded={vi.fn()} />);
    const dropzone = screen
      .getByText(/Glissez un bulletin de paie \(PDF\) ici, ou cliquez pour parcourir/)
      .closest("label");
    assertDefined(dropzone, "expected the drop zone <label> to be present");

    fireEvent.drop(dropzone, { dataTransfer: { files: [txtFile] } });

    expect(screen.getByText("Seuls les fichiers PDF sont acceptés.")).toBeInTheDocument();
    expect(mockUploadPayslip).not.toHaveBeenCalled();
  });

  it("shows the uploading state while the request is pending, then returns to idle", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn();
    const { promise, resolve } = deferred<ReturnType<typeof makePayslip>>();
    mockUploadPayslip.mockReturnValueOnce(promise);
    render(<UploadZone onUploaded={onUploaded} />);

    await user.upload(getInput(), pdfFile);

    expect(await screen.findByText("Extraction du bulletin en cours…")).toBeInTheDocument();
    expect(screen.queryByText(/Glissez un bulletin de paie \(PDF\) ici/)).not.toBeInTheDocument();

    const payslip = makePayslip();
    resolve(payslip);

    await waitFor(() => {
      expect(
        screen.getByText(/Glissez un bulletin de paie \(PDF\) ici, ou cliquez pour parcourir/)
      ).toBeInTheDocument();
    });
    expect(onUploaded).toHaveBeenCalledWith(payslip);
    expect(mockUploadPayslip).toHaveBeenCalledWith(pdfFile);
    // A successful upload consumed one hit of the `upload` scope's budget.
    expect(mockDecrementRateLimit).toHaveBeenCalledWith("upload");
  });

  it("shows the backend's error message when the upload fails", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn();
    mockUploadPayslip.mockRejectedValueOnce(new Error("boom"));
    mockGetApiErrorMessage.mockReturnValueOnce("Extraction impossible: scan image ?");
    render(<UploadZone onUploaded={onUploaded} />);

    await user.upload(getInput(), pdfFile);

    expect(await screen.findByText("Extraction impossible: scan image ?")).toBeInTheDocument();
    expect(onUploaded).not.toHaveBeenCalled();
    // A failed upload never reached the backend's rate limiter, so nothing
    // should be decremented locally either.
    expect(mockDecrementRateLimit).not.toHaveBeenCalled();
  });

  it("falls back to a generic message when the backend gives no error detail", async () => {
    const user = userEvent.setup();
    mockUploadPayslip.mockRejectedValueOnce(new Error("network error"));
    mockGetApiErrorMessage.mockReturnValueOnce(undefined);
    render(<UploadZone onUploaded={vi.fn()} />);

    await user.upload(getInput(), pdfFile);

    expect(
      await screen.findByText(
        "L'extraction a échoué. Vérifiez que le PDF est bien un bulletin de paie lisible."
      )
    ).toBeInTheDocument();
  });

  it("shows a specific message when the hourly upload limit is reached", async () => {
    const user = userEvent.setup();
    mockUploadPayslip.mockRejectedValueOnce(new Error("429"));
    mockGetRateLimit.mockReturnValueOnce({ retryAfterMinutes: 12 });
    mockFormatRetryDelay.mockReturnValueOnce("dans 12 min");
    render(<UploadZone onUploaded={vi.fn()} />);

    await user.upload(getInput(), pdfFile);

    expect(
      await screen.findByText("Limite d'imports atteinte pour cette heure. Réessayez dans 12 min.")
    ).toBeInTheDocument();
    // The rate-limit message wins over the backend's generic detail.
    expect(mockGetApiErrorMessage).not.toHaveBeenCalled();
  });

  it("uploads a PDF dropped onto the zone", async () => {
    const onUploaded = vi.fn();
    mockUploadPayslip.mockResolvedValueOnce(makePayslip());
    render(<UploadZone onUploaded={onUploaded} />);

    const dropzone = screen
      .getByText(/Glissez un bulletin de paie \(PDF\) ici, ou cliquez pour parcourir/)
      .closest("label");
    assertDefined(dropzone, "expected the drop zone <label> to be present");

    fireEvent.drop(dropzone, { dataTransfer: { files: [pdfFile] } });

    await waitFor(() => {
      expect(mockUploadPayslip).toHaveBeenCalledWith(pdfFile);
    });
    expect(onUploaded).toHaveBeenCalled();
    // Every upload goes through the auth gate, even when (as here, and in
    // every test above) it turns out to already be satisfied.
    expect(mockRequireAuth).toHaveBeenCalledTimes(1);
  });

  it("requires login before uploading: does not call the API when logged out", async () => {
    const user = userEvent.setup();
    mockRequireAuth.mockImplementation(() => {
      // Simulates "logged out": requireAuth opens the modal instead of
      // running the action — verified here by simply *not* calling it.
    });
    render(<UploadZone onUploaded={vi.fn()} />);

    await user.upload(getInput(), pdfFile);

    expect(mockRequireAuth).toHaveBeenCalledTimes(1);
    expect(mockUploadPayslip).not.toHaveBeenCalled();
    // Still showing the idle prompt — no "uploading" state was ever
    // entered, since the actual upload logic never ran.
    expect(
      screen.getByText(/Glissez un bulletin de paie \(PDF\) ici, ou cliquez pour parcourir/)
    ).toBeInTheDocument();
  });

  it("resumes the exact file once login succeeds, without re-selecting it", async () => {
    const user = userEvent.setup();
    const onUploaded = vi.fn();
    let resumeUpload: (() => void) | undefined;
    mockRequireAuth.mockImplementation((action?: () => void) => {
      resumeUpload = action;
    });
    mockUploadPayslip.mockResolvedValueOnce(makePayslip());
    render(<UploadZone onUploaded={onUploaded} />);

    await user.upload(getInput(), pdfFile);
    expect(mockUploadPayslip).not.toHaveBeenCalled();

    // The login modal isn't rendered by UploadZone itself (see
    // App.test.tsx for the full, real modal flow) — this simulates
    // exactly what it does on success: call the stashed action.
    assertDefined(resumeUpload, "expected requireAuth to have been given an action to resume");
    resumeUpload();

    await waitFor(() => {
      expect(mockUploadPayslip).toHaveBeenCalledWith(pdfFile);
    });
    expect(onUploaded).toHaveBeenCalled();
  });

  it("toggles the dragging style on dragOver/dragLeave without uploading", () => {
    render(<UploadZone onUploaded={vi.fn()} />);
    const dropzone = screen
      .getByText(/Glissez un bulletin de paie \(PDF\) ici, ou cliquez pour parcourir/)
      .closest("label");
    assertDefined(dropzone, "expected the drop zone <label> to be present");

    expect(dropzone.className).not.toContain("border-accent bg-accent-soft");

    fireEvent.dragOver(dropzone);
    expect(dropzone.className).toContain("border-accent bg-accent-soft");

    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).not.toContain("border-accent bg-accent-soft");
    expect(mockUploadPayslip).not.toHaveBeenCalled();
  });
});

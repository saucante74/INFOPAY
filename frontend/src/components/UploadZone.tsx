import { FileUp, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

import { formatRetryDelay, getApiErrorMessage, getRateLimit, uploadPayslip } from "../api/client";
import type { Payslip } from "../api/types";

/**
 * Discriminated union instead of the previous `status: null | "uploading" |
 * "error"` string plus a separate `errorMessage` string. The message now only
 * exists on the variant that has one, so "error with no message" and
 * "uploading but a stale message is still displayed" stop being
 * representable — the compiler enforces what the two `useState` calls used to
 * leave to convention.
 *
 * No `success` variant (unlike the sketch in CONVENTIONS.md): the uploaded
 * payslip is handed straight to the parent via `onUploaded`, which owns the
 * list, and the zone returns to `idle`. A `success` state would hold a second
 * copy of state nobody reads — see RAPPORT.md.
 */
type UploadState =
  { status: "idle" } | { status: "uploading" } | { status: "error"; message: string };

interface UploadZoneProps {
  /** Called once the backend has accepted and extracted a payslip. */
  onUploaded: (payslip: Payslip) => void;
}

export default function UploadZone({ onUploaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [upload, setUpload] = useState<UploadState>({ status: "idle" });

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (file?.type !== "application/pdf") {
        setUpload({ status: "error", message: "Seuls les fichiers PDF sont acceptés." });
        return;
      }
      setUpload({ status: "uploading" });
      try {
        const payslip = await uploadPayslip(file);
        setUpload({ status: "idle" });
        onUploaded(payslip);
      } catch (error) {
        const rateLimit = getRateLimit(error);
        setUpload({
          status: "error",
          message: rateLimit
            ? `Limite d'imports atteinte pour cette heure. Réessayez ${formatRetryDelay(rateLimit)}.`
            : (getApiErrorMessage(error) ??
              "L'extraction a échoué. Vérifiez que le PDF est bien un bulletin de paie lisible."),
        });
      }
    },
    [onUploaded]
  );

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => {
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          // `void`: the handler is deliberately fire-and-forget, exactly as
          // before — the upload's outcome is reflected through `upload`
          // state, not awaited by the DOM event.
          void handleFile(e.dataTransfer.files[0]);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer ${
          isDragging
            ? "border-accent bg-accent-soft/40"
            : "border-border bg-surface-raised hover:border-accent/50"
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
          }}
        />
        {upload.status === "uploading" ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-sm text-ink-soft">Extraction du bulletin en cours…</p>
          </>
        ) : (
          <>
            <FileUp className="h-6 w-6 text-ink-soft" />
            <p className="text-sm font-medium">
              Glissez un bulletin de paie (PDF) ici, ou cliquez pour parcourir
            </p>
            <p className="text-xs text-ink-soft">Un fichier à la fois</p>
          </>
        )}
      </label>
      {upload.status === "error" && <p className="mt-2 text-sm text-alert">{upload.message}</p>}
    </div>
  );
}

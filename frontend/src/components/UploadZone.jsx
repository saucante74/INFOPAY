import { useCallback, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { uploadPayslip } from "../api/client";

export default function UploadZone({ onUploaded }) {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState(null); // null | "uploading" | "error"
  const [errorMessage, setErrorMessage] = useState("");

  const handleFile = useCallback(
    async (file) => {
      if (!file || file.type !== "application/pdf") {
        setStatus("error");
        setErrorMessage("Seuls les fichiers PDF sont acceptés.");
        return;
      }
      setStatus("uploading");
      setErrorMessage("");
      try {
        const payslip = await uploadPayslip(file);
        setStatus(null);
        onUploaded(payslip);
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err.response?.data?.detail ||
            "L'extraction a échoué. Vérifiez que le PDF est bien un bulletin de paie lisible."
        );
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
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
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
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {status === "uploading" ? (
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
      {status === "error" && (
        <p className="mt-2 text-sm text-alert">{errorMessage}</p>
      )}
    </div>
  );
}

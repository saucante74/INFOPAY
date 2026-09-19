import { FileDown } from "lucide-react";
import { Link } from "react-router";

import ChatPanel from "../components/ChatPanel";
import PayslipChart from "../components/PayslipChart";
import PayslipTable from "../components/PayslipTable";
import UploadZone from "../components/UploadZone";
import { usePayslips } from "../hooks/usePayslips";

/** The app's home route ("/") — unchanged content, previously inlined in `App.tsx`. */
export default function AnalyzerPage() {
  const { payslips, isLoading, addPayslip, removePayslip } = usePayslips();

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">Assistant et analyse : Bulletin de salaire</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Importez vos bulletins pour suivre leur évolution et poser vos questions à l'assistant.
        </p>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2.5 text-sm text-ink-soft">
            <FileDown className="h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              Pas de bulletin de paie ?{" "}
              <Link to="/aide#exemples" className="font-medium text-accent hover:underline">
                Téléchargez un exemple pour tester l'application.
              </Link>
            </p>
          </div>

          <UploadZone onUploaded={addPayslip} />

          {!isLoading && (
            <>
              <PayslipChart payslips={payslips} />
              <PayslipTable payslips={payslips} onDelete={removePayslip} />
            </>
          )}
        </div>

        <div className="min-h-0">
          <ChatPanel />
        </div>
      </div>
    </>
  );
}

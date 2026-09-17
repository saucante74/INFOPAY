import { FileText } from "lucide-react";

import ChatPanel from "./components/ChatPanel";
import PayslipChart from "./components/PayslipChart";
import PayslipTable from "./components/PayslipTable";
import UploadZone from "./components/UploadZone";
import { usePayslips } from "./hooks/usePayslips";

export default function App() {
  const { payslips, isLoading, addPayslip } = usePayslips();

  return (
    <div className="mx-auto flex h-screen max-w-7xl flex-col gap-4 p-4">
      <header className="flex items-center gap-2 py-2">
        <FileText className="h-5 w-5 text-accent" />
        <h1 className="text-lg font-semibold">InfoPay AI</h1>
        <span className="text-sm text-ink-soft">— Assistant & Analytics de fiches de paie</span>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4 overflow-y-auto pr-1">
          <UploadZone onUploaded={addPayslip} />

          {!isLoading && (
            <>
              <PayslipChart payslips={payslips} />
              <PayslipTable payslips={payslips} />
            </>
          )}
        </div>

        <div className="min-h-0">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}

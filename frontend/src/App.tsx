import ChatPanel from "./components/ChatPanel";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import PayslipChart from "./components/PayslipChart";
import PayslipTable from "./components/PayslipTable";
import UploadZone from "./components/UploadZone";
import { usePayslips } from "./hooks/usePayslips";

export default function App() {
  const { payslips, isLoading, addPayslip } = usePayslips();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4">
        <div>
          <h1 className="text-2xl font-bold">Assistant & Analytics de fiches de paie</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Importez vos bulletins pour suivre leur évolution et poser vos questions à l'assistant.
          </p>
        </div>

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
      </main>

      <Footer />
    </div>
  );
}

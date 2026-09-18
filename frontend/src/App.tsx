import { BrowserRouter, Route, Routes } from "react-router";

import RootLayout from "./layouts/RootLayout";
import AnalyzerPage from "./pages/AnalyzerPage";
import HelpPage from "./pages/HelpPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

/**
 * Declarative `<Routes>`/`<Route>` JSX, not `createBrowserRouter`'s config
 * object: the same "keep the wiring visible" reasoning CONVENTIONS.md
 * applies to the backend's hand-written LangGraph graph and this frontend's
 * hand-written ESLint flat config — the route tree should read like a route
 * tree, not be reconstructed from a data structure.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<AnalyzerPage />} />
          <Route path="aide" element={<HelpPage />} />
          <Route path="confidentialite" element={<PrivacyPage />} />
          <Route path="conditions-utilisation" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

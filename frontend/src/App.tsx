import { BrowserRouter, Route, Routes } from "react-router";

import RequireAuth from "./auth/RequireAuth";
import RootLayout from "./layouts/RootLayout";
import AnalyzerPage from "./pages/AnalyzerPage";
import HelpPage from "./pages/HelpPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";

/**
 * Declarative `<Routes>`/`<Route>` JSX, not `createBrowserRouter`'s config
 * object: the same "keep the wiring visible" reasoning CONVENTIONS.md
 * applies to the backend's hand-written LangGraph graph and this frontend's
 * hand-written ESLint flat config — the route tree should read like a route
 * tree, not be reconstructed from a data structure.
 *
 * Only the analyzer requires a login: it's the only page calling the API.
 * Help and the legal pages stay public (the privacy policy should be
 * readable before anyone signs in).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route
            index
            element={
              <RequireAuth>
                <AnalyzerPage />
              </RequireAuth>
            }
          />
          <Route path="login" element={<LoginPage />} />
          <Route path="aide" element={<HelpPage />} />
          <Route path="confidentialite" element={<PrivacyPage />} />
          <Route path="conditions-utilisation" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

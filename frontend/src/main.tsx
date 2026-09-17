import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

// `getElementById` is typed `HTMLElement | null`. An explicit check rather
// than a `!` assertion: same happy path, but if index.html ever loses its
// `<div id="root">` the failure is this sentence instead of a stack trace
// from inside React.
if (!rootElement) {
  throw new Error("Élément racine introuvable : #root est absent de index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);

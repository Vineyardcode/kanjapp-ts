import "./styles/tokens.css";   // must be first: defines the design tokens
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import KanjiIcon from "./assets/icons/Kanji-Icon";


const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
/* The inner boundary in App.tsx handles a route crash in place, keeping the
   navbar and the URL. This outer one exists because React 19 empties #root on
   an uncaught error: anything throwing OUTSIDE a boundary would blank the page
   and make index.html's boot guard read #root as unmounted, hard-redirecting a
   running session to the external error page. With this, nothing is
   unboundaried, so that can't happen. */
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
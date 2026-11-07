import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";
import { Provider } from "./components/provider";
import Landing from "./pages/landing";
import { adminUrl } from "./lib/site";
import "./styles.css";
import "./roster.css";

// Separate static entry: no admin page, auth client, API server, or database.
if (/\/admin\/?$/.test(window.location.pathname)) {
  window.location.replace(adminUrl);
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider>
        <Landing />
        {import.meta.env.DEV && <AgentFeedback />}
        <RunableBadge />
      </Provider>
    </StrictMode>,
  );
}
(function initErrorReporting() {
  function isDevMode() {
    return location.hash.includes("dev") || location.search.includes("dev=1");
  }

  function reportError(context, error, options = {}) {
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error || "Unknown error");
    const payload = { context, detail, dev: isDevMode(), ...options };
    console.error(`[rose-error] ${context}`, error);
    return payload;
  }

  function reportRecoverableError(context, error, options = {}) {
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error || "Unknown error");
    const payload = { context, detail, dev: isDevMode(), recoverable: true, ...options };
    if (isDevMode()) {
      console.warn(`[rose-warning] ${context}`, error);
    }
    return payload;
  }

  function showFatalLoadScreen(message, detail = "") {
    const title = window.APP_CONFIG?.appName || "Application";
    const root = document.createElement("div");
    root.setAttribute("role", "alert");
    root.className = "fatal-load";
    const card = document.createElement("div");
    card.className = "fatal-load-card";
    const heading = document.createElement("h1");
    heading.className = "fatal-load-title";
    heading.textContent = title;
    const lead = document.createElement("p");
    lead.className = "fatal-load-lead";
    lead.textContent = message;
    const body = document.createElement("p");
    body.className = "fatal-load-copy";
    body.textContent =
      "The app did not finish loading. Refresh once. If it still fails, use dev mode and copy the console error for diagnosis.";
    card.append(heading, lead, body);
    if (detail) {
      const pre = document.createElement("pre");
      pre.className = "fatal-load-detail";
      pre.textContent = detail;
      card.appendChild(pre);
    }
    root.appendChild(card);
    if (window.RoseHTML?.clear) window.RoseHTML.clear(document.body);
    else document.body.textContent = "";
    document.body.appendChild(root);
  }

  window.reportRoseError = reportError;
  window.reportRoseRecoverableError = reportRecoverableError;
  window.showRoseFatalLoadScreen = showFatalLoadScreen;
})();

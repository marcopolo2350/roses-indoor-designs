(function initRoseHtmlSafety() {
  function escape(value) {
    const node = document.createElement("div");
    node.textContent = value == null ? "" : String(value);
    return node.innerHTML;
  }

  function setText(element, value) {
    if (element) element.textContent = value == null ? "" : String(value);
  }

  function clear(element) {
    if (!element) return;
    const active = document.activeElement;
    if (active && element.contains(active) && typeof active.blur === "function") active.blur();
    element.replaceChildren();
  }

  function unsafeAttribute(name, value) {
    const attr = String(name || "").toLowerCase();
    const raw = String(value || "");
    const normalized = raw.trim().toLowerCase();
    if (attr.startsWith("on")) return true;
    if (
      (attr === "href" || attr === "src" || attr === "xlink:href") &&
      /^javascript:/i.test(normalized)
    ) {
      return true;
    }
    if (attr === "style" && /(expression\s*\(|javascript:|url\s*\()/i.test(raw)) return true;
    return false;
  }

  function sanitizeFragment(root) {
    const blockedTags = new Set(["SCRIPT", "IFRAME", "OBJECT", "EMBED", "LINK", "META"]);
    root.querySelectorAll("*").forEach((node) => {
      if (blockedTags.has(node.tagName)) {
        node.remove();
        return;
      }
      [...node.attributes].forEach((attr) => {
        if (unsafeAttribute(attr.name, attr.value)) node.removeAttribute(attr.name);
      });
    });
  }

  function parseTrustedTemplate(html) {
    const template = document.createElement("template");
    template.innerHTML = html == null ? "" : String(html);
    sanitizeFragment(template.content);
    return template.content;
  }

  function setTrustedHTML(element, html) {
    if (!element) return;
    clear(element);
    element.appendChild(parseTrustedTemplate(html));
  }

  window.RoseHTML = {
    escape,
    setText,
    clear,
    parseTrustedTemplate,
    setTrustedHTML,
  };
})();

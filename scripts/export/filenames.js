(function initExportFilenames() {
  function sanitizeBaseName(value, fallback = "room") {
    const withoutControls = String(value || fallback)
      .split("")
      .map((character) => (character.charCodeAt(0) <= 31 ? "_" : character))
      .join("");
    const raw = withoutControls
      .trim()
      .replace(/[<>:"/\\|?*]+/g, "_")
      .replace(/[^a-z0-9_-]+/gi, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    return (raw || fallback).slice(0, 80);
  }

  function roomBaseName(room, suffix = "plan") {
    return `${sanitizeBaseName(room?.name || "room")}_${sanitizeBaseName(suffix, "export")}`;
  }

  function fileName(room, suffix, extension) {
    const ext = sanitizeBaseName(extension || "txt", "txt").replace(/^\.+/, "");
    return `${roomBaseName(room, suffix)}.${ext}`;
  }

  window.ExportFilenames = Object.freeze({
    fileName,
    roomBaseName,
    sanitizeBaseName,
  });
})();

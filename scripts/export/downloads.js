(function initExportDownloads() {
  function safeDownloadName(filename, fallback = "export") {
    const raw = String(filename || fallback).trim();
    const extension = raw.match(/\.([a-z0-9]{1,12})$/i)?.[1] || "";
    const base = window.ExportFilenames.sanitizeBaseName(raw.replace(/\.[^.]+$/, ""), fallback);
    return extension
      ? `${base}.${window.ExportFilenames.sanitizeBaseName(extension, "txt")}`
      : base;
  }

  function clickDownload(href, filename) {
    if (!href) throw new Error("Download href is required");
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = safeDownloadName(filename);
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    return anchor.download;
  }

  function downloadDataUrl(dataUrl, filename) {
    return clickDownload(dataUrl, filename);
  }

  function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    try {
      return clickDownload(url, filename);
    } finally {
      setTimeout(() => window.URL.revokeObjectURL(url), 500);
    }
  }

  function downloadTextFile(filename, text, type = "text/plain;charset=utf-8") {
    return downloadBlob(new window.Blob([text], { type }), filename);
  }

  window.ExportDownloads = Object.freeze({
    clickDownload,
    downloadBlob,
    downloadDataUrl,
    downloadTextFile,
    safeDownloadName,
  });
})();

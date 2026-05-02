// Export compatibility helpers.
function exportBaseName(room = curRoom, suffix = "plan") {
  return window.ExportFilenames.roomBaseName(room, suffix);
}
function downloadTextFile(filename, text, type = "text/plain;charset=utf-8") {
  return window.ExportDownloads.downloadTextFile(filename, text, type);
}

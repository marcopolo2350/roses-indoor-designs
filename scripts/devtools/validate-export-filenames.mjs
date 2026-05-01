globalThis.window = globalThis;

await import("../export/filenames.js");

const names = window.ExportFilenames;

if (names.sanitizeBaseName(' Bad <Room>: "One" ') !== "Bad_Room_One") {
  throw new Error("sanitizeBaseName did not remove unsafe filename characters");
}
if (names.sanitizeBaseName("\u0000<>", "room") !== "room") {
  throw new Error("sanitizeBaseName did not fall back for empty unsafe names");
}
if (names.roomBaseName({ name: "Rose's Room" }, "presentation") !== "Rose_s_Room_presentation") {
  throw new Error("roomBaseName did not combine room and suffix safely");
}
if (
  names.fileName({ name: "Kitchen/Plan" }, "design summary", ".pdf") !==
  "Kitchen_Plan_design_summary.pdf"
) {
  throw new Error("fileName did not produce expected filename");
}

console.log("Export filename validation passed.");

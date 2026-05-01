(function initProjectJsonExports() {
  const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

  function exportProjectJSON() {
    if (!projects?.length) {
      toast("No projects to export");
      return;
    }
    const payload = window.RoseProjectSchema
      ? window.RoseProjectSchema.buildExportDocument(projects, activeProfile)
      : {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          activeProfile,
          projects: JSON.parse(JSON.stringify(projects)),
        };
    const filename = `${window.ExportFilenames.roomBaseName(curRoom || projects[0], "project")}.json`;
    window.ExportDownloads.downloadTextFile(
      filename,
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8",
    );
    toast("Project JSON exported");
  }

  function importProjectJSON() {
    const input = document.getElementById("projectJsonInput");
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function handleProjectJSONSelected(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) {
        toast("Project JSON is too large to import safely");
        return;
      }
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validated = window.RoseProjectSchema
        ? window.RoseProjectSchema.validateImportedProjectDocument(parsed)
        : {
            rooms: Array.isArray(parsed)
              ? parsed
              : Array.isArray(parsed.projects)
                ? parsed.projects
                : null,
          };
      const incoming = validated.rooms;
      if (!incoming?.length) {
        toast("No projects found in JSON");
        return;
      }
      const imported = incoming.map((room) => {
        const clone = JSON.parse(JSON.stringify(room));
        clone.id = clone.id || uid();
        return normalizeRoom(clone);
      });
      const ids = new Set(projects.map((room) => room.id));
      imported.forEach((room) => {
        if (ids.has(room.id)) room.id = uid();
        projects.push(room);
        ids.add(room.id);
      });
      await saveAll();
      renderHome();
      toast(`Imported ${imported.length} room${imported.length === 1 ? "" : "s"}`);
    } catch (err) {
      console.error("PROJECT JSON IMPORT ERROR", err);
      toast("Could not import JSON");
    }
  }

  window.RoseProjectJsonExports = Object.freeze({
    exportProjectJSON,
    handleProjectJSONSelected,
    importProjectJSON,
  });
  window.exportProjectJSON = exportProjectJSON;
  window.importProjectJSON = importProjectJSON;
  window.handleProjectJSONSelected = handleProjectJSONSelected;
})();

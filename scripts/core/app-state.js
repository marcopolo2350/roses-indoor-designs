(function initAppState() {
  const runtime = {
    dirty: false,
    lastSavedAt: 0,
    lastRenderedAt: 0,
    saveTimer: null,
  };

  function markDirty(value = true) {
    runtime.dirty = !!value;
    return runtime.dirty;
  }

  function markSaved(timestamp = Date.now()) {
    runtime.dirty = false;
    runtime.lastSavedAt = timestamp;
    return runtime.lastSavedAt;
  }

  function markRendered(timestamp = Date.now()) {
    runtime.lastRenderedAt = timestamp;
    return runtime.lastRenderedAt;
  }

  function getProjects() {
    return projects;
  }

  function getCurrentRoom() {
    return curRoom;
  }

  function setCurrentRoom(room) {
    curRoom = room || null;
    return curRoom;
  }

  function getSelection() {
    return sel;
  }

  function clearSelection() {
    sel = { type: null, idx: -1 };
    if (typeof multiSelFurnitureIds !== "undefined") multiSelFurnitureIds = [];
  }

  function getTool() {
    return tool;
  }

  function setToolState(nextTool) {
    tool = nextTool;
    return tool;
  }

  function requestRender() {
    if (typeof draw === "function") {
      draw();
      markRendered();
    }
  }

  function scheduleSave(delay = 180) {
    if (runtime.saveTimer) clearTimeout(runtime.saveTimer);
    runtime.saveTimer = setTimeout(async () => {
      runtime.saveTimer = null;
      if (typeof saveAll === "function") {
        await saveAll();
      }
    }, delay);
  }

  function schedule3DRebuild() {
    if (typeof window.scheduleRebuild3D === "function") {
      window.scheduleRebuild3D();
    }
  }

  window.appState = {
    runtime,
    markDirty,
    markRendered,
    markSaved,
    requestRender,
    scheduleSave,
    schedule3DRebuild,
    getProjects,
    getCurrentRoom,
    setCurrentRoom,
    getSelection,
    clearSelection,
    getTool,
    setTool: setToolState,
  };
})();

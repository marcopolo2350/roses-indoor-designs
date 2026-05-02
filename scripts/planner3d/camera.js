(function initPlanner3DCamera() {
  const VIEW_PRESETS = Object.freeze({
    hero: { label: "Hero View" },
    overview: { label: "Overview" },
    corner: { label: "Favorite Corner" },
    eye: { label: "Room View" },
  });

  const PRESENTATION_SHOTS = Object.freeze({
    hero: { label: "Hero View" },
    favorite: { label: "Favorite Corner" },
    overview: { label: "Whole Room" },
    intimate: { label: "Intimate View" },
    before_after: { label: "Before / After" },
  });

  const PHOTO_PRESETS = Object.freeze({
    hero: { label: "Hero Shot" },
    favorite: { label: "Favorite Corner" },
    intimate: { label: "Intimate" },
    overhead: { label: "Overhead" },
  });

  const WALKTHROUGH_PRESETS = Object.freeze({
    favorite_corner: { label: "Favorite Corner" },
    dollhouse: { label: "Dollhouse" },
    stroll: { label: "Stroll" },
    corner_reveal: { label: "Corner Reveal" },
    before_after: { label: "Before / After" },
    romantic_reveal: { label: "Romantic Reveal" },
  });

  function roomHeight(room) {
    return Math.max(1, Number(room?.height) || 9);
  }

  function defaultFocus(room) {
    const points = Array.isArray(room?.polygon) ? room.polygon : [];
    if (!points.length)
      return { x: 0, y: 0, width: 12, height: 12, maxD: 12, height3D: roomHeight(room) };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of points) {
      minX = Math.min(minX, Number(point.x) || 0);
      minY = Math.min(minY, Number(point.y) || 0);
      maxX = Math.max(maxX, Number(point.x) || 0);
      maxY = Math.max(maxY, Number(point.y) || 0);
    }
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      width,
      height,
      maxD: Math.max(width, height),
      height3D: roomHeight(room),
    };
  }

  function roomBounds(room, helpers = {}) {
    if (typeof helpers.getRoomBounds2D === "function") return helpers.getRoomBounds2D(room);
    const focus = focusFor(room, helpers);
    return {
      x0: focus.x - focus.width / 2,
      y0: focus.y - focus.height / 2,
      x1: focus.x + focus.width / 2,
      y1: focus.y + focus.height / 2,
    };
  }

  function focusFor(room, helpers = {}) {
    if (typeof helpers.getRoomFocus === "function") return helpers.getRoomFocus(room);
    return defaultFocus(room);
  }

  function floorRoomsFor(room, helpers = {}) {
    if (typeof helpers.currentFloor3DRooms === "function") {
      const rooms = helpers.currentFloor3DRooms(room);
      if (Array.isArray(rooms) && rooms.length) return rooms;
    }
    return room ? [room] : [];
  }

  function roomsFocusFor(rooms, fallbackRoom, helpers = {}) {
    if (typeof helpers.getRoomsFocus === "function") return helpers.getRoomsFocus(rooms);
    const valid = (rooms || []).filter(
      (room) => Array.isArray(room?.polygon) && room.polygon.length,
    );
    if (!valid.length) return focusFor(fallbackRoom, helpers);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxH = 0;
    for (const room of valid) {
      for (const point of room.polygon) {
        minX = Math.min(minX, Number(point.x) || 0);
        minY = Math.min(minY, Number(point.y) || 0);
        maxX = Math.max(maxX, Number(point.x) || 0);
        maxY = Math.max(maxY, Number(point.y) || 0);
      }
      maxH = Math.max(maxH, roomHeight(room));
    }
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      width,
      height,
      maxD: Math.max(width, height),
      height3D: maxH || roomHeight(fallbackRoom),
    };
  }

  function roomCentroid(room, helpers = {}) {
    const focus = focusFor(room, helpers);
    const furniture = Array.isArray(room?.furniture) ? room.furniture : [];
    if (!furniture.length) return { x: focus.x, z: -focus.y };
    const centroid = furniture.reduce(
      (acc, item) => ({
        x: acc.x + (Number(item.x) || 0),
        z: acc.z - (Number(item.z) || 0),
      }),
      { x: 0, z: 0 },
    );
    centroid.x /= furniture.length;
    centroid.z /= furniture.length;
    return centroid;
  }

  function favoriteCornerPose(room, helpers = {}) {
    const focus = focusFor(room, helpers);
    const centroid = roomCentroid(room, helpers);
    const bounds = roomBounds(room, helpers);
    const insetX = Math.max(1.2, Math.min(focus.width * 0.18, 2.6));
    const insetY = Math.max(1.2, Math.min(focus.height * 0.18, 2.6));
    const corners = [
      { x: bounds.x0 + insetX, z: -bounds.y0 - insetY },
      { x: bounds.x1 - insetX, z: -bounds.y0 - insetY },
      { x: bounds.x1 - insetX, z: -bounds.y1 + insetY },
      { x: bounds.x0 + insetX, z: -bounds.y1 + insetY },
    ];
    let best = null;
    for (const corner of corners) {
      const dx = centroid.x - corner.x;
      const dz = centroid.z - corner.z;
      const dist = Math.hypot(dx, dz);
      const score = dist + (Math.abs(dx) + Math.abs(dz)) * 0.2;
      if (!best || score > best.score) best = { corner, score, dist, dx, dz };
    }
    const yaw = Math.atan2(best.dx, -best.dz);
    const dist = Math.max(
      14,
      Math.min(28, Math.max(focus.width, focus.height, roomHeight(room)) * 1.16),
    );
    return {
      yaw,
      pitch: 0.38,
      dist,
      target: {
        x: focus.x * 0.76 + centroid.x * 0.24,
        y: roomHeight(room) * 0.38,
        z: -focus.y * 0.76 + centroid.z * 0.24,
      },
    };
  }

  function overviewRoomPose(room, helpers = {}) {
    const rooms = floorRoomsFor(room, helpers);
    const focus = rooms.length > 1 ? roomsFocusFor(rooms, room, helpers) : focusFor(room, helpers);
    const height = rooms.length > 1 ? focus.height3D || roomHeight(room) : roomHeight(room);
    return {
      yaw: Math.PI * 0.16,
      pitch: 0.8,
      dist: Math.max(18, Math.min(56, Math.max(focus.width, focus.height, height) * 2.08)),
      target: { x: focus.x, y: height * 0.47, z: -focus.y },
    };
  }

  function intimateRoomPose(room, helpers = {}) {
    const focus = focusFor(room, helpers);
    const centroid = roomCentroid(room, helpers);
    const height = roomHeight(room);
    return {
      yaw: Math.PI * 0.3,
      pitch: 0.42,
      dist: Math.max(15, Math.min(28, Math.max(focus.width, focus.height, height) * 1.15)),
      target: {
        x: focus.x * 0.72 + centroid.x * 0.28,
        y: height * 0.38,
        z: -focus.y * 0.72 + centroid.z * 0.28,
      },
    };
  }

  function heroRoomPose(room, helpers = {}) {
    const favorite = favoriteCornerPose(room, helpers);
    return {
      yaw: favorite.yaw,
      pitch: Math.max(0.34, favorite.pitch || 0.36),
      dist: Math.max(14, Math.min(26, favorite.dist * 1.08)),
      target: { ...favorite.target },
    };
  }

  function viewPose(mode, room, helpers = {}) {
    const focus = focusFor(room, helpers);
    const poses = {
      hero: heroRoomPose(room, helpers),
      overview: overviewRoomPose(room, helpers),
      corner: favoriteCornerPose(room, helpers),
      eye: intimateRoomPose(room, helpers),
      orbit: {
        yaw: Math.PI * 0.18,
        pitch: 0.52,
        dist: 17,
        target: { x: focus.x, y: roomHeight(room) * 0.42, z: -focus.y },
      },
    };
    return poses[mode] || poses.orbit;
  }

  function photoPose(mode, room, helpers = {}) {
    const focus = focusFor(room, helpers);
    const height = roomHeight(room);
    const poses = {
      hero: heroRoomPose(room, helpers),
      favorite: favoriteCornerPose(room, helpers),
      intimate: intimateRoomPose(room, helpers),
      overhead: {
        yaw: Math.PI * 0.12,
        pitch: 0.86,
        dist: Math.max(16, Math.min(30, Math.max(focus.width, focus.height, height) * 1.32)),
        target: { x: focus.x, y: height * 0.46, z: -focus.y },
      },
    };
    return poses[mode] || poses.hero;
  }

  function presentationPose(mode, room, helpers = {}) {
    const poses = {
      hero: heroRoomPose(room, helpers),
      favorite: favoriteCornerPose(room, helpers),
      overview: overviewRoomPose(room, helpers),
      intimate: intimateRoomPose(room, helpers),
    };
    return poses[mode] || poses.hero;
  }

  function label(map, id, fallback) {
    return map[id]?.label || fallback;
  }

  function presetList(map) {
    return Object.entries(map).map(([id, preset]) => [id, preset.label]);
  }

  window.Planner3DCamera = Object.freeze({
    favoriteCornerPose,
    heroRoomPose,
    intimateRoomPose,
    overviewRoomPose,
    photoPose,
    presentationPose,
    roomCentroid,
    viewPose,
    viewPresetLabel: (id) => label(VIEW_PRESETS, id, "Orbit"),
    presentationShotLabel: (id) => label(PRESENTATION_SHOTS, id, "Hero View"),
    photoPresetLabel: (id) => label(PHOTO_PRESETS, id, "Hero Shot"),
    walkthroughPresetLabel: (id) => label(WALKTHROUGH_PRESETS, id, "Walkthrough"),
    presets: Object.freeze({
      view: VIEW_PRESETS,
      presentation: PRESENTATION_SHOTS,
      photo: PHOTO_PRESETS,
      walkthrough: WALKTHROUGH_PRESETS,
    }),
    presetList,
  });
})();

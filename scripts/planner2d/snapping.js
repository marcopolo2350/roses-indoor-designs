/* global MODEL_REGISTRY, closestPointOnSegment, findNearestWindowOpening, snapFurniturePoint, wA, wE, wL, wS */
function isWallMountedFurnitureItem(
  item,
  reg = item?.assetKey ? MODEL_REGISTRY[item.assetKey] : null,
) {
  return item?.mountType === "wall" || reg?.mountType === "wall";
}
function wallSnapForFurniture(
  item,
  point,
  room = curRoom,
  reg = item?.assetKey ? MODEL_REGISTRY[item.assetKey] : null,
) {
  if (!room || !item || !isWallMountedFurnitureItem(item, reg)) return null;
  const source = { x: point?.x || 0, y: Number.isFinite(point?.z) ? point.z : point?.y || 0 };
  const openingTarget =
    reg?.snapToOpening && typeof findNearestWindowOpening === "function"
      ? findNearestWindowOpening(source, room)
      : null;
  if (reg?.snapToOpening && !openingTarget) return { valid: false, windowTarget: null };
  let best = null;
  if (openingTarget) {
    const wall = openingTarget.wall;
    const idx = (room.walls || []).findIndex((candidate) => candidate?.id === wall?.id);
    if (!wall || idx < 0) return { valid: false, windowTarget: null };
    best = {
      wall,
      idx,
      length: wL(room, wall),
      offset: openingTarget.opening?.offset || 0,
      distance: 0,
      point: closestPointOnSegment(source, wS(room, wall), wE(room, wall)),
    };
  } else {
    (room.walls || []).forEach((wall, idx) => {
      const a = wS(room, wall);
      const b = wE(room, wall);
      const projection = closestPointOnSegment(source, a, b);
      if (!best || projection.distance < best.distance) {
        best = {
          wall,
          idx,
          length: wL(room, wall),
          offset: (projection.t || 0) * wL(room, wall),
          distance: projection.distance,
          point: projection,
        };
      }
    });
  }
  if (!best) return null;
  const padding = Math.max(0.32, Math.min((item.w || 2) * 0.5 + 0.08, (best.length || 0) * 0.45));
  const along = Math.max(
    padding,
    Math.min(
      (best.length || 0) - padding,
      Number.isFinite(best.offset) ? best.offset : (best.length || 0) / 2,
    ),
  );
  const angle = wA(room, best.wall);
  const a = wS(room, best.wall);
  const snapped = {
    x: Math.round((a.x + Math.cos(angle) * along) * 2) / 2,
    z: Math.round((a.y + Math.sin(angle) * along) * 2) / 2,
  };
  return {
    valid: true,
    wall: best.wall,
    idx: best.idx,
    length: best.length,
    offset: along,
    distance: best.distance || 0,
    snapped,
    angle,
    windowTarget: openingTarget || null,
  };
}
function snapFurnitureForItem(item, x, z, room = curRoom) {
  const reg = item?.assetKey ? MODEL_REGISTRY[item.assetKey] : null;
  const base = snapFurniturePoint(x, z);
  const wallSnap = wallSnapForFurniture(item, { x: base.x, z: base.z }, room, reg);
  if (wallSnap?.valid) return { ...wallSnap.snapped, wallSnap };
  return base;
}
window.Planner2DSnapping = Object.freeze({
  isWallMountedFurnitureItem,
  snapFurnitureForItem,
  wallSnapForFurniture,
});

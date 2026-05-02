function roomReference(room = curRoom) {
  return room?.referenceOverlay || null;
}
function roomReferenceVisible(room = curRoom) {
  return !!roomReference(room)?.src && roomReference(room)?.visible !== false;
}
function roomReferenceWorldSize(ref = roomReference()) {
  const width = Math.max(2, (ref?.baseWidth || 12) * (ref?.scale || 1));
  const ratio = Math.max(0.2, (ref?.naturalHeight || 1) / (ref?.naturalWidth || 1));
  return { width, height: width * ratio };
}
function roomReferenceBounds(ref = roomReference()) {
  if (!ref) return null;
  const size = roomReferenceWorldSize(ref);
  return {
    x0: (ref.centerX || 0) - size.width / 2,
    y0: (ref.centerY || 0) - size.height / 2,
    x1: (ref.centerX || 0) + size.width / 2,
    y1: (ref.centerY || 0) + size.height / 2,
    width: size.width,
    height: size.height,
  };
}
function referencePointToWorld(localPoint, ref = roomReference()) {
  if (!ref || !localPoint) return null;
  const bounds = roomReferenceBounds(ref);
  return {
    x: bounds.x0 + (localPoint.u || 0) * bounds.width,
    y: bounds.y0 + (localPoint.v || 0) * bounds.height,
  };
}
function referenceWorldToLocal(wp, ref = roomReference()) {
  const bounds = roomReferenceBounds(ref);
  if (!bounds) return null;
  if (wp.x < bounds.x0 || wp.x > bounds.x1 || wp.y < bounds.y0 || wp.y > bounds.y1) return null;
  return { u: (wp.x - bounds.x0) / bounds.width, v: (wp.y - bounds.y0) / bounds.height };
}
function referenceDisplayLabel(ref = roomReference()) {
  if (!ref?.src) return "No reference";
  if (ref.calibrationActive) {
    const count = (ref.calibrationPoints || []).length;
    return count === 0 ? "Tap the first known point" : "Tap the second known point";
  }
  const base = ref.locked ? "Reference locked" : "Reference unlocked";
  return ref.sourceType === "pdf" && ref.pdfPageCount > 1
    ? `${base} \u00b7 page ${ref.pdfPage || 1}/${ref.pdfPageCount}`
    : base;
}
window.Planner2DReferenceOverlay = Object.freeze({
  referenceDisplayLabel,
  referencePointToWorld,
  referenceWorldToLocal,
  roomReference,
  roomReferenceBounds,
  roomReferenceVisible,
  roomReferenceWorldSize,
});

/* global autoFit, formatArea, formatDistance, getRoomBounds2D, polygonArea, showMeasurements:writable */
function printFloorPlan() {
  if (!curRoom || !curRoom.polygon.length) {
    toast("Open a room first");
    return;
  }
  const prevM = showMeasurements;
  showMeasurements = true;
  const prevW = canvas.width,
    prevH = canvas.height;
  canvas.width = 1400;
  canvas.height = 1050;
  autoFit();
  draw();
  const ph = document.getElementById("printHeader");
  if (ph) {
    const b = getRoomBounds2D(curRoom),
      area = polygonArea(curRoom.polygon);
    ph.querySelector("h2").textContent = curRoom.name || "Room";
    ph.querySelector("p").textContent =
      `${formatDistance(b.width)} x ${formatDistance(b.height)} | ${formatArea(area)} | Ceiling: ${formatDistance(curRoom.height)}`;
  }
  window.print();
  canvas.width = prevW;
  canvas.height = prevH;
  showMeasurements = prevM;
  autoFit();
  draw();
}
window.RosePrintExports = Object.freeze({
  printFloorPlan,
});

globalThis.window = globalThis;

await import("../planner3d/camera.js");

const camera = window.Planner3DCamera;
const errors = [];

function expect(label, condition) {
  if (!condition) errors.push(label);
}

function expectPose(label, pose) {
  expect(`${label} must exist`, Boolean(pose));
  expect(`${label} yaw must be finite`, Number.isFinite(pose?.yaw));
  expect(`${label} pitch must be finite`, Number.isFinite(pose?.pitch));
  expect(`${label} distance must be finite`, Number.isFinite(pose?.dist));
  expect(`${label} target.x must be finite`, Number.isFinite(pose?.target?.x));
  expect(`${label} target.y must be finite`, Number.isFinite(pose?.target?.y));
  expect(`${label} target.z must be finite`, Number.isFinite(pose?.target?.z));
}

const room = {
  id: "room-a",
  height: 9,
  polygon: [
    { x: 0, y: 0 },
    { x: 14, y: 0 },
    { x: 14, y: 12 },
    { x: 0, y: 12 },
  ],
  furniture: [
    { id: "sofa", x: 4, z: 4 },
    { id: "table", x: 8, z: 6 },
  ],
};

const secondRoom = {
  id: "room-b",
  height: 10,
  polygon: [
    { x: 14, y: 0 },
    { x: 24, y: 0 },
    { x: 24, y: 10 },
    { x: 14, y: 10 },
  ],
  furniture: [],
};

function getRoomFocus(targetRoom) {
  const xs = targetRoom.polygon.map((point) => point.x);
  const ys = targetRoom.polygon.map((point) => point.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
    width,
    height,
    maxD: Math.max(width, height),
    height3D: targetRoom.height,
  };
}

function getRoomBounds2D(targetRoom) {
  const xs = targetRoom.polygon.map((point) => point.x);
  const ys = targetRoom.polygon.map((point) => point.y);
  return {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  };
}

function currentFloor3DRooms() {
  return [room, secondRoom];
}

function getRoomsFocus(rooms) {
  const xs = rooms.flatMap((targetRoom) => targetRoom.polygon.map((point) => point.x));
  const ys = rooms.flatMap((targetRoom) => targetRoom.polygon.map((point) => point.y));
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
    width,
    height,
    maxD: Math.max(width, height),
    height3D: Math.max(...rooms.map((targetRoom) => targetRoom.height)),
  };
}

const helpers = { currentFloor3DRooms, getRoomBounds2D, getRoomFocus, getRoomsFocus };

expect("Planner3DCamera bridge must be registered", Boolean(camera));
expect("hero view label must be stable", camera.viewPresetLabel("hero") === "Hero View");
expect("unknown view label should fall back to Orbit", camera.viewPresetLabel("bad") === "Orbit");
expect(
  "before/after presentation label must be stable",
  camera.presentationShotLabel("before_after") === "Before / After",
);
expect("overhead photo label must be stable", camera.photoPresetLabel("overhead") === "Overhead");
expect(
  "stroll walkthrough label must be stable",
  camera.walkthroughPresetLabel("stroll") === "Stroll",
);

expectPose("favorite corner pose", camera.favoriteCornerPose(room, helpers));
expectPose("hero room pose", camera.heroRoomPose(room, helpers));
expectPose("intimate room pose", camera.intimateRoomPose(room, helpers));
expectPose("overview room pose", camera.overviewRoomPose(room, helpers));
expectPose("photo overhead pose", camera.photoPose("overhead", room, helpers));
expectPose("presentation overview pose", camera.presentationPose("overview", room, helpers));

expect("hero pose should use a readable pitch", camera.heroRoomPose(room, helpers).pitch >= 0.34);
expect(
  "photo overhead pose should be high-angle",
  camera.photoPose("overhead", room, helpers).pitch > 0.8,
);
expect(
  "multi-room overview should frame beyond the single room width",
  camera.overviewRoomPose(room, helpers).dist > camera.heroRoomPose(room, helpers).dist,
);

if (errors.length) {
  console.error("3D camera validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("3D camera validation passed.");

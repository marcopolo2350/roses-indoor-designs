globalThis.window = globalThis;

await import("../planner3d/lifecycle.js");

const lifecycle = window.Planner3DLifecycle;
let textureDisposed = false;
let materialDisposed = false;
let geometryDisposed = false;
let passDisposed = false;
let rendererDisposed = false;
let contextLost = false;
let removedChild = false;
const removedEvents = [];

const material = {
  map: { dispose: () => (textureDisposed = true) },
  dispose: () => (materialDisposed = true),
};
const mesh = {
  geometry: { dispose: () => (geometryDisposed = true) },
  material,
};
const scene = {
  traverse(callback) {
    callback(mesh);
  },
};

lifecycle.disposeSceneGraph(scene);
if (!textureDisposed || !materialDisposed || !geometryDisposed) {
  throw new Error("disposeSceneGraph did not dispose geometry, texture, and material");
}

lifecycle.disposeComposer({ passes: [{ dispose: () => (passDisposed = true) }] });
if (!passDisposed) {
  throw new Error("disposeComposer did not dispose passes");
}

const renderer = {
  _listeners: {
    el: {
      removeEventListener: (name) => removedEvents.push(name),
    },
    pDown() {},
    pUp() {},
    pMove() {},
    pCancel() {},
  },
  dispose: () => (rendererDisposed = true),
  forceContextLoss: () => (contextLost = true),
  domElement: {
    parentNode: {
      removeChild: () => (removedChild = true),
    },
  },
};

lifecycle.disposeRenderer(renderer);
if (!rendererDisposed || !contextLost || !removedChild || renderer._listeners !== null) {
  throw new Error("disposeRenderer did not fully clean renderer");
}
if (
  !["pointerdown", "pointerup", "pointermove", "pointercancel", "lostpointercapture"].every(
    (name) => removedEvents.includes(name),
  )
) {
  throw new Error("disposeRenderer did not remove expected pointer listeners");
}

console.log("3D lifecycle validation passed.");

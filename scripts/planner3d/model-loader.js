/* global MODEL_ERROR_DETAILS, MODEL_REGISTRY, THREE, assetCache, assetWarned:writable, gltfLoader:writable, resolveAndLoadModelAsset, trackModelStatus */
function ensureGLTFLoader() {
  if (!gltfLoader && window.THREE && THREE.GLTFLoader) gltfLoader = new THREE.GLTFLoader();
  return gltfLoader;
}
function warnAssetFallback(assetKey) {
  console.warn(`[FALLBACK BLOCKED] ${assetKey}`);
  trackModelStatus("blocked", assetKey);
  if (!assetWarned) {
    assetWarned = true;
    toast(
      location.protocol === "file:"
        ? "Mapped model failed. Serve the app over HTTP or use a working asset path."
        : "Mapped model failed to load. Check debug badge",
    );
  }
}
function cloneAssetScene(asset) {
  return asset ? asset.clone(true) : null;
}
function loadModelAsset(assetKey) {
  const reg = MODEL_REGISTRY[assetKey];
  if (!reg) return Promise.resolve(null);
  if (!ensureGLTFLoader()) {
    console.error(
      `[MODEL LOAD FAIL] ${assetKey} -> ${reg.file}`,
      new Error("GLTFLoader unavailable"),
    );
    trackModelStatus("fail", assetKey, reg.file);
    return Promise.resolve(null);
  }
  if (!assetCache.has(assetKey)) {
    assetCache.set(
      assetKey,
      resolveAndLoadModelAsset(assetKey).then((result) => {
        if (result.scene) {
          MODEL_ERROR_DETAILS.delete(assetKey);
          trackModelStatus("ok", assetKey, result.url);
          return { scene: result.scene, url: result.url };
        }
        console.error(`[MODEL LOAD FAIL] ${assetKey} -> ${result.url || reg.file}`, result.error);
        MODEL_ERROR_DETAILS.set(assetKey, (result.error && result.error.message) || "load failed");
        trackModelStatus("fail", assetKey, result.url || reg.file);
        assetCache.delete(assetKey);
        return { scene: null, url: result.url || reg.file };
      }),
    );
  }
  return assetCache.get(assetKey).then((result) => {
    if (result && result.scene) {
      const clone = cloneAssetScene(result.scene);
      if (clone) clone.userData.__sourceUrl = result.url;
      return clone;
    }
    return null;
  });
}
window.Planner3DModelLoader = Object.freeze({
  cloneAssetScene,
  ensureGLTFLoader,
  loadModelAsset,
  warnAssetFallback,
});

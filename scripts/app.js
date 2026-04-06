const RUNTIME_MODULES = [
  './scripts/state.js',
  './scripts/storage.js',
  './scripts/ui.js',
  './scripts/planner2d.js',
  './scripts/catalog.js',
  './scripts/export.js',
  './scripts/planner3d.js',
  './scripts/walkthrough.js',
];

async function loadClassicScript(src) {
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ' + src));
    document.head.appendChild(script);
  });
}

(async () => {
  for (const src of RUNTIME_MODULES) {
    await loadClassicScript(src);
  }
  if (typeof boot === 'function') await boot();
})();

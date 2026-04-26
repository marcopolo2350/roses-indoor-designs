import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["scripts/main.js", "scripts/core/**/*.js", "scripts/cloud/**/*.js", "scripts/devtools/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        clearTimeout: "readonly",
        console: "readonly",
        curRoom: "writable",
        dg: "readonly",
        document: "readonly",
        draw: "readonly",
        ds: "readonly",
        hideP: "readonly",
        document: "readonly",
        location: "readonly",
        multiSelFurnitureIds: "writable",
        normalizeRoom: "readonly",
        performance: "readonly",
        projects: "writable",
        redoSt: "writable",
        ROOM_HISTORY_PREFIX: "readonly",
        saveAll: "readonly",
        scheduleRebuild3D: "readonly",
        sel: "writable",
        setTimeout: "readonly",
        window: "readonly",
        localStorage: "readonly",
        activeProfile: "readonly",
        toast: "readonly",
        tool: "writable",
        undoSt: "writable",
        updateRoomPreviewThumb: "readonly",
        updateUndoStrip: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["scripts/devtools/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
      },
    },
  },
];

(function initStorageService() {
  const databaseName = window.APP_CONFIG?.database?.name || "rose_indoor_designs";
  const storeName = window.APP_CONFIG?.database?.store || "projects";
  const databaseVersion = window.APP_CONFIG?.database?.version || 2;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(databaseName, databaseVersion);
      request.onupgradeneeded = (event) => {
        const database = event.target.result;
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getRecord(keyName, { legacy = false } = {}) {
    try {
      const database = await openDatabase();
      return new Promise((resolve) => {
        const key = legacy ? keyName : window.scopedDbKey(keyName);
        const request = database.transaction(storeName, "readonly").objectStore(storeName).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
          window.reportRoseError?.("indexeddb-read", request.error, { key });
          resolve(null);
        };
      });
    } catch (error) {
      window.reportRoseError?.("indexeddb-open-read", error, { key: keyName, legacy });
      return null;
    }
  }

  async function setRecord(keyName, value) {
    try {
      const database = await openDatabase();
      return new Promise((resolve) => {
        const key = window.scopedDbKey(keyName);
        const transaction = database.transaction(storeName, "readwrite");
        transaction.objectStore(storeName).put(value, key);
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => {
          window.reportRoseError?.("indexeddb-write", transaction.error, { key });
          resolve(false);
        };
      });
    } catch (error) {
      window.reportRoseError?.("indexeddb-open-write", error, { key: keyName });
      return false;
    }
  }

  window.RoseStorageService = Object.freeze({
    openDatabase,
    getRecord,
    setRecord,
  });
})();

(function initStorageKeys() {
  const prefix = window.APP_CONFIG?.storagePrefix || "rose_indoor_designs";
  const profileLocalKey = `${prefix}_active_profile`;

  function currentProfileId() {
    return window.activeProfile || "rose";
  }

  function storageKey(key, { global = false } = {}) {
    return global ? `${prefix}_global::${key}` : `${prefix}_profile::${currentProfileId()}::${key}`;
  }

  function scopedDbKey(key) {
    return storageKey(`db::${key}`);
  }

  function profileSeenKey(profile = currentProfileId()) {
    return `profile_seen_${profile}`;
  }

  function getLocal(key, { global = false } = {}) {
    try {
      return localStorage.getItem(storageKey(key, { global }));
    } catch (error) {
      window.reportRoseError?.("storage-local-read", error, { key, global });
      return null;
    }
  }

  function setLocal(key, value, { global = false } = {}) {
    try {
      localStorage.setItem(storageKey(key, { global }), value);
      return true;
    } catch (error) {
      window.reportRoseError?.("storage-local-write", error, { key, global });
      return false;
    }
  }

  function getActiveProfileId() {
    try {
      return (
        localStorage.getItem(storageKey("active_profile", { global: true })) ||
        localStorage.getItem(profileLocalKey)
      );
    } catch (error) {
      window.reportRoseError?.("profile-storage-read", error);
      return null;
    }
  }

  function setActiveProfileId(profileId) {
    try {
      localStorage.setItem(storageKey("active_profile", { global: true }), profileId);
      localStorage.setItem(profileLocalKey, profileId);
      return true;
    } catch (error) {
      window.reportRoseError?.("profile-storage-write", error, { profileId });
      return false;
    }
  }

  window.PROFILE_LOCAL_KEY = profileLocalKey;
  window.storageKey = storageKey;
  window.scopedDbKey = scopedDbKey;
  window.profileSeenKey = profileSeenKey;
  window.getLocal = getLocal;
  window.setLocal = setLocal;
  window.getActiveProfileId = getActiveProfileId;
  window.setActiveProfileId = setActiveProfileId;
})();

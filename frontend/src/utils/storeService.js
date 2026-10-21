import { useState, useEffect } from "react";
import baseUrl from "../api/api";

export const FALLBACK_STORES = [
  { locName: "Warehouse", locCode: "858", name: "Warehouse", label: "Warehouse", value: "858" },
  { locName: "MG Road", locCode: "718", name: "MG Road", label: "MG Road", value: "718" },
];

export const DISCARDED_LOC_CODES = new Set([
  "700", "701", "702", "703", "704", "705", "706", "707", "708", "709",
  "710", "711", "712", "716", "717", "759", "100", "101", "102", "122",
  "133", "144", "555"
]);

export const DISCARDED_NAME_PATTERNS = [
  "g-edappally", "g.edappally", "edappally",
  "g-palakkad", "g.palakkad", "palakkad",
  "g-calicut", "g.calicut", "calicut",
  "sg-trivandrum", "trivandrum",
  "g-kottayam", "g.kottayam", "kottayam",
  "g-perumbavoor", "g.perumbavoor", "perumbavoor",
  "g-thrissur", "g.thrissur", "thrissur",
  "g-chavakkad", "g.chavakkad", "chavakkad",
  "g-vadakara", "g.vadakara", "vadakara",
  "g-edappal", "g.edappal", "edappal",
  "g-perinthalmanna", "g.perinthalmanna", "perinthalmanna",
  "g-kottakkal", "g.kottakkal", "kottakkal",
  "g-manjeri", "g.manjeri", "manjeri",
  "g-kalpetta", "g.kalpetta", "kalpetta",
  "g-kannur", "g.kannur", "kannur",
  "production", "office", "head office", "dappr squad",
  "z-edapally", "z-edappal", "z-perinthalmanna", "z-kottakkal"
];

export const isAllowedStoreNameOrCode = (locCode, locName) => {
  const code = (locCode || "").toString().trim();
  const name = (locName || "").toLowerCase().trim();

  // Always allow Warehouse and MG Road
  if (code === "858" || code === "103" || code === "718" || name.includes("warehouse") || name.includes("mg road") || name.includes("mgroad")) {
    return true;
  }

  // Block decommissioned old branches
  if (DISCARDED_LOC_CODES.has(code)) {
    return false;
  }
  if (DISCARDED_NAME_PATTERNS.some(pat => 
    name === pat || 
    name === `g.${pat}` || 
    name === `g-${pat}` || 
    name === `sg-${pat}` ||
    name === `z-${pat}`
  )) {
    return false;
  }

  // Any newly added store: ALLOW!
  return true;
};

export const saveCustomStore = (store) => {
  if (!store || !store.locCode) return;
  try {
    const code = store.locCode.toString().trim();
    const name = (store.locName || store.name || code).trim();
    if (!code || !name) return;

    // 1. Read custom stores list
    const rawCustom = localStorage.getItem("rootfin_custom_stores");
    let customList = [];
    if (rawCustom) {
      try {
        customList = JSON.parse(rawCustom) || [];
      } catch (e) {
        customList = [];
      }
    }

    const storeEntry = {
      locName: name,
      locCode: code,
      name: name,
      label: name,
      value: code,
      address: store.address || "",
      phone: store.phone || "",
      email: store.email || ""
    };

    const idx = customList.findIndex(s => s.locCode.toString().trim() === code);
    if (idx >= 0) {
      customList[idx] = storeEntry;
    } else {
      customList.push(storeEntry);
    }
    localStorage.setItem("rootfin_custom_stores", JSON.stringify(customList));

    // 2. Read current active stores and merge
    const currentActive = getActiveStores();
    const activeMap = new Map();
    currentActive.forEach(s => activeMap.set(s.locCode.toString().trim(), s));
    activeMap.set(code, storeEntry);

    const updated = Array.from(activeMap.values()).sort((a, b) => 
      a.locName.localeCompare(b.locName)
    );

    localStorage.setItem("rootfin_active_stores", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("rootfin-stores-updated", { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Error saving custom store:", err);
  }
};

export const getActiveStores = () => {
  const storeMap = new Map();

  // 1. Always start with Warehouse and MG Road
  FALLBACK_STORES.forEach(s => {
    storeMap.set(s.locCode, {
      ...s,
      label: s.locName,
      value: s.locCode
    });
  });

  // 2. Add custom stores saved by the user
  try {
    const rawCustom = localStorage.getItem("rootfin_custom_stores");
    if (rawCustom) {
      const parsedCustom = JSON.parse(rawCustom);
      if (Array.isArray(parsedCustom)) {
        parsedCustom.forEach(s => {
          const code = (s.locCode || "").toString().trim();
          const name = (s.locName || s.name || code).trim();
          if (code && isAllowedStoreNameOrCode(code, name)) {
            storeMap.set(code, {
              locName: name,
              locCode: code,
              name: name,
              label: name,
              value: code,
              address: s.address || "",
              phone: s.phone || "",
              email: s.email || ""
            });
          }
        });
      }
    }
  } catch (e) {
    console.warn("Could not read custom stores:", e);
  }

  // 3. Add cached active stores
  try {
    const cached = localStorage.getItem("rootfin_active_stores");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach(s => {
          const code = (s.locCode || "").toString().trim();
          const name = (s.locName || s.name || code).trim();
          if (code && isAllowedStoreNameOrCode(code, name)) {
            if (!storeMap.has(code)) {
              storeMap.set(code, {
                locName: name,
                locCode: code,
                name: name,
                label: name,
                value: code,
                address: s.address || "",
                phone: s.phone || "",
                email: s.email || ""
              });
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn("Could not read cached active stores:", e);
  }

  return Array.from(storeMap.values()).sort((a, b) => a.locName.localeCompare(b.locName));
};

export const fetchActiveStores = async () => {
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

  const storeMap = new Map();

  // 1. Guaranteed fallback stores
  FALLBACK_STORES.forEach(s => {
    storeMap.set(s.locCode, {
      ...s,
      label: s.locName,
      value: s.locCode
    });
  });

  // 2. Incorporate any user-created custom stores from localStorage
  try {
    const rawCustom = localStorage.getItem("rootfin_custom_stores");
    if (rawCustom) {
      const parsedCustom = JSON.parse(rawCustom);
      if (Array.isArray(parsedCustom)) {
        parsedCustom.forEach(s => {
          const code = (s.locCode || "").toString().trim();
          const name = (s.locName || s.name || code).trim();
          if (code && isAllowedStoreNameOrCode(code, name)) {
            storeMap.set(code, {
              locName: name,
              locCode: code,
              name: name,
              label: name,
              value: code,
              address: s.address || "",
              phone: s.phone || "",
              email: s.email || ""
            });
          }
        });
      }
    }
  } catch (e) {
    console.warn("Could not read custom stores:", e);
  }

  // Helper to add raw store object
  const processStore = (code, rawName, extra = {}) => {
    code = (code || "").toString().trim();
    rawName = (rawName || "").trim();
    if (!code || !rawName) return;

    // Normalizations for Warehouse & MG Road
    if (code === "858" || rawName.toLowerCase().includes("warehouse")) {
      storeMap.set("858", {
        locName: "Warehouse",
        locCode: "858",
        name: "Warehouse",
        label: "Warehouse",
        value: "858",
        address: extra.address || "",
        phone: extra.phone || "",
        email: extra.email || ""
      });
      return;
    }

    if (code === "718" || rawName.toLowerCase().replace(/\s+/g, "") === "mgroad" || rawName.toLowerCase() === "mg road") {
      storeMap.set("718", {
        locName: "MG Road",
        locCode: "718",
        name: "MG Road",
        label: "MG Road",
        value: "718",
        address: extra.address || "",
        phone: extra.phone || "",
        email: extra.email || ""
      });
      return;
    }

    if (!isAllowedStoreNameOrCode(code, rawName)) return;

    // If already exists, prefer cleaner casing (e.g. "Brides Berry" over "BRIDES BERRY")
    const existing = storeMap.get(code);
    if (!existing) {
      storeMap.set(code, {
        locName: rawName,
        locCode: code,
        name: rawName,
        label: rawName,
        value: code,
        address: extra.address || "",
        phone: extra.phone || "",
        email: extra.email || ""
      });
    } else {
      if (existing.locName === existing.locName.toUpperCase() && rawName !== rawName.toUpperCase()) {
        existing.locName = rawName;
        existing.name = rawName;
        existing.label = rawName;
      }
    }
  };

  try {
    // Fetch in parallel from ALL potential sources
    const [storesRes, userStoresRes, allUsersRes] = await Promise.allSettled([
      fetch(`${API_URL}/api/stores`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/user/getAllStores`).then(r => r.ok ? r.json() : null),
      fetch(`${API_URL}/user/getAllUsers`).then(r => r.ok ? r.json() : null)
    ]);

    // 1. Process /api/stores
    if (storesRes.status === "fulfilled" && storesRes.value?.stores && Array.isArray(storesRes.value.stores)) {
      storesRes.value.stores.forEach(s => {
        processStore(s.locCode, s.name || s.locName, s);
      });
    }

    // 2. Process /user/getAllStores
    if (userStoresRes.status === "fulfilled" && userStoresRes.value?.stores && Array.isArray(userStoresRes.value.stores)) {
      userStoresRes.value.stores.forEach(s => {
        processStore(s.locCode, s.locName || s.name, s);
      });
    }

    // 3. Process /user/getAllUsers (any user with a locCode is a store user!)
    if (allUsersRes.status === "fulfilled" && allUsersRes.value?.users && Array.isArray(allUsersRes.value.users)) {
      allUsersRes.value.users.forEach(u => {
        if (u.locCode && u.username) {
          processStore(u.locCode, u.username, u);
        }
      });
    }

    const sorted = Array.from(storeMap.values()).sort((a, b) => 
      a.locName.localeCompare(b.locName)
    );

    localStorage.setItem("rootfin_active_stores", JSON.stringify(sorted));
    window.dispatchEvent(new CustomEvent("rootfin-stores-updated", { detail: sorted }));
    return sorted;
  } catch (error) {
    console.error("Error fetching active stores:", error);
  }

  const current = getActiveStores();
  return current.length > 0 ? current : FALLBACK_STORES;
};

export const useActiveStores = () => {
  const [stores, setStores] = useState(() => getActiveStores());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const updated = await fetchActiveStores();
      if (isMounted && updated && updated.length > 0) {
        setStores(updated);
      }
      if (isMounted) setLoading(false);
    };

    load();

    const handleUpdate = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setStores(e.detail);
      } else {
        setStores(getActiveStores());
      }
    };

    window.addEventListener("rootfin-stores-updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("rootfin-stores-updated", handleUpdate);
    };
  }, []);

  const storeOptions = [
    { value: "all", label: "All Stores" },
    ...stores.map(s => ({ value: s.locCode, label: s.locName }))
  ];

  const warehouseOptions = stores.map(s => s.locName);
  const branchOptions = stores.map(s => s.locName);
  const locations = stores.map(s => ({ value: s.locName, locCode: s.locCode }));

  return {
    stores,
    allLocations: stores,
    storeOptions,
    warehouseOptions,
    branchOptions,
    locations,
    loading,
    refreshStores: fetchActiveStores
  };
};

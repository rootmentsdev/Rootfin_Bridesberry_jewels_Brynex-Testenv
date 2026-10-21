import Store from "../model/Store.js";
import User from "../model/UserModel.js";
import mongoose from "mongoose";

// Fallback guaranteed active stores
export const fallbackStores = [
  { name: "Warehouse", locCode: "858", locName: "Warehouse", isActive: true },
  { name: "MG Road", locCode: "718", locName: "MG Road", isActive: true },
];

// Decommissioned old branch locCodes that must remain excluded
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

export const isAllowedStore = (store) => {
  if (!store) return false;
  const code = (store.locCode || "").toString().trim();
  const name = (store.name || store.locName || "").toLowerCase().trim();

  // 1. Always keep Warehouse and MG Road
  if (code === "858" || code === "103" || code === "718" || name.includes("warehouse") || name.includes("mg road") || name.includes("mgroad")) {
    return true;
  }

  // 2. Block decommissioned old branches
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

  // 3. Any newly created store added by user: ALLOW!
  return true;
};

// Create a new store
export const createStore = async (req, res) => {
  try {
    const storeData = req.body;
    
    if (!storeData.name || !storeData.locCode) {
      return res.status(400).json({ 
        message: "Store name and location code (locCode) are required" 
      });
    }
    
    if (storeData.email === '' || !storeData.email) {
      delete storeData.email;
    }

    const store = await Store.findOneAndUpdate(
      { locCode: storeData.locCode.toString().trim() },
      { ...storeData, isActive: storeData.isActive !== false },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    
    const storeObj = store.toObject ? store.toObject() : { ...store };
    storeObj.id = (storeObj._id || "").toString();
    
    res.status(201).json({
      message: "Store created successfully",
      store: storeObj,
    });
  } catch (error) {
    console.error("Create store error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Store with this location code already exists" 
      });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all stores - includes Warehouse, MG Road, and any newly added stores
export const getStores = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    let dbStores = [];
    try {
      dbStores = await Store.find(filter).sort({ name: 1 }).lean();
    } catch (e) {
      console.warn("Could not query Store collection:", e.message);
    }

    // Also look up User records with locCode (stores added via AddNewStore / ManageStores)
    let storeUsers = [];
    try {
      storeUsers = await User.find({
        locCode: { $exists: true, $ne: "" },
        power: { $nin: ["admin", "superadmin"] }
      }).select("username locCode email address phone").lean();
    } catch (e) {
      console.warn("Could not query User collection:", e.message);
    }
    
    const combinedMap = new Map();

    // 1. Seed with Warehouse and MG Road
    fallbackStores.forEach(s => {
      combinedMap.set(s.locCode, { ...s, id: s.locCode });
    });

    // 2. Add stores from Store collection
    for (const s of dbStores) {
      const code = (s.locCode || "").toString().trim();
      if (code) {
        combinedMap.set(code, {
          id: (s._id || s.id || code).toString(),
          name: s.name,
          locCode: code,
          locName: s.name,
          address: s.address || "",
          phone: s.phone || "",
          email: s.email || "",
          isActive: s.isActive !== false
        });
      }
    }

    // 3. Add stores from User collection (e.g. from AddNewStore)
    for (const u of storeUsers) {
      const code = (u.locCode || "").toString().trim();
      if (code && !combinedMap.has(code)) {
        combinedMap.set(code, {
          id: (u._id || code).toString(),
          name: u.username,
          locCode: code,
          locName: u.username,
          address: u.address || "",
          phone: u.phone || "",
          email: u.email || "",
          isActive: true
        });
      }
    }

    // Filter out decommissioned branches and sort
    const storesList = Array.from(combinedMap.values())
      .filter(isAllowedStore)
      .sort((a, b) => (a.name || a.locName || "").localeCompare(b.name || b.locName || ""));

    return res.status(200).json({
      message: "Stores retrieved successfully",
      stores: storesList.length > 0 ? storesList : fallbackStores,
    });
  } catch (error) {
    console.error("Get stores error (using fallback):", error.message);
    return res.status(200).json({
      message: "Stores retrieved from fallback",
      stores: fallbackStores,
    });
  }
};

// Get store by ID
export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid store ID" });
    }
    
    const store = await Store.findById(id);
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    const obj = store.toObject();
    obj.id = obj._id.toString();
    
    res.status(200).json({
      message: "Store retrieved successfully",
      store: obj,
    });
  } catch (error) {
    console.error("Get store by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get store by location code
export const getStoreByLocCode = async (req, res) => {
  try {
    const { locCode } = req.params;
    
    const store = await Store.findOne({ locCode });
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    const storeObj = store.toObject();
    storeObj.id = storeObj._id.toString();
    
    res.status(200).json({
      message: "Store retrieved successfully",
      store: storeObj,
    });
  } catch (error) {
    console.error("Get store by locCode error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update store
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid store ID" });
    }
    
    const store = await Store.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    const obj = store.toObject();
    obj.id = obj._id.toString();
    
    res.status(200).json({
      message: "Store updated successfully",
      store: obj,
    });
  } catch (error) {
    console.error("Update store error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Store with this location code already exists" 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete store (soft delete by setting isActive to false)
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid store ID" });
    }
    
    const store = await Store.findByIdAndUpdate(id, { isActive: false }, { new: true });
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    res.status(200).json({
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("Delete store error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

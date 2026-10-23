import ExpenseTarget from "../model/ExpenseTarget.js";

// Save or Update Expense Target (permanent, auto-recurs each month)
export const saveExpenseTarget = async (req, res) => {
  try {
    const { storeCode, category, subCategory, targetAmount } = req.body;

    if (!storeCode || !category || targetAmount === undefined) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const filter = {
      storeCode,
      category,
      subCategory: subCategory || ""
    };

    const update = { targetAmount };

    // Upsert: create if not exists, update if exists
    const target = await ExpenseTarget.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    });

    return res.status(200).json({ success: true, target });
  } catch (error) {
    console.error("Error saving expense target:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Fetch Existing Target for a store + category combination
export const getExpenseTarget = async (req, res) => {
  try {
    const { storeCode, category, subCategory } = req.query;

    const filter = {
      storeCode,
      category,
      subCategory: subCategory || ""
    };

    const target = await ExpenseTarget.findOne(filter);

    if (target) {
      return res.status(200).json({ success: true, target });
    } else {
      return res.status(404).json({ success: false, message: "No target found" });
    }
  } catch (error) {
    console.error("Error fetching expense target:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Fetch All Targets (for dashboard aggregations — month param ignored, all limits are permanent)
export const getAllExpenseTargets = async (req, res) => {
  try {
    const targets = await ExpenseTarget.find({});
    return res.status(200).json({ success: true, targets });
  } catch (error) {
    console.error("Error fetching all expense targets:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

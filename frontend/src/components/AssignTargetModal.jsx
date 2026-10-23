import React, { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, CheckCircle, Pencil } from "lucide-react";
import baseUrl from "../api/api";

const AssignTargetModal = ({ isOpen, onClose, cats, fallbackLocations, currentusers }) => {
  const [storeCode, setStoreCode] = useState(currentusers.locCode || "759");
  const [selectedCategory, setSelectedCategory] = useState(cats[0]);
  const [subCategory, setSubCategory] = useState(cats[0].subs?.length > 0 ? "All" : "");
  const [targetAmount, setTargetAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isExisting, setIsExisting] = useState(false); // true = editing an existing limit

  const handleCategoryChange = (val) => {
    const cat = cats.find(c => c.value === val);
    setSelectedCategory(cat);
    setSubCategory(cat.subs?.length > 0 ? "All" : "");
  };

  const fetchExistingTarget = useCallback(async () => {
    if (!isOpen) return;
    setIsLoading(true);
    setSuccessMsg("");
    setIsExisting(false);
    try {
      const query = new URLSearchParams({
        storeCode,
        category: selectedCategory.value,
        subCategory: subCategory || "",
      });
      const res = await fetch(`${baseUrl.baseUrl}api/expense-targets?${query}`);
      const data = await res.json();
      if (data.success && data.target) {
        setTargetAmount(data.target.targetAmount.toString());
        setIsExisting(true);
      } else {
        setTargetAmount("");
        setIsExisting(false);
      }
    } catch (err) {
      console.error("Error fetching target:", err);
      setTargetAmount("");
      setIsExisting(false);
    }
    setIsLoading(false);
  }, [isOpen, storeCode, selectedCategory, subCategory]);

  useEffect(() => {
    fetchExistingTarget();
  }, [fetchExistingTarget]);

  const handleSave = async () => {
    if (!targetAmount || isNaN(targetAmount) || Number(targetAmount) <= 0) {
      alert("Please enter a valid limit amount");
      return;
    }

    setIsSaving(true);
    setSuccessMsg("");
    try {
      const payload = {
        storeCode,
        category: selectedCategory.value,
        subCategory: subCategory || "",
        targetAmount: Number(targetAmount)
      };

      const res = await fetch(`${baseUrl.baseUrl}api/expense-targets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setIsExisting(true);
        setSuccessMsg(isExisting ? "Expense limit updated successfully!" : "Expense limit saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        alert(data.message || "Failed to save limit");
      }
    } catch (err) {
      console.error("Error saving limit:", err);
      alert("Failed to save limit");
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  const storeName = fallbackLocations.find(l => l.locCode === storeCode)?.locName || storeCode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Set Expense Limit</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Limits are permanent and auto-apply every month until updated
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 mt-0.5">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-[#fafafa] space-y-5">

          {/* Store */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Store</label>
            <div className="relative">
              <select
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] pr-10 cursor-pointer"
              >
                {fallbackLocations.map(loc => (
                  <option key={loc.locCode} value={loc.locCode}>{loc.locName}</option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Category + Sub Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Category</label>
              <div className="relative">
                <select
                  value={selectedCategory.value}
                  onChange={e => handleCategoryChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] pr-10 cursor-pointer"
                >
                  {cats.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {selectedCategory.subs?.length > 0 ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Sub Category</label>
                <div className="relative">
                  <select
                    value={subCategory}
                    onChange={e => setSubCategory(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-5 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] pr-10 cursor-pointer"
                  >
                    <option value="All">All</option>
                    {selectedCategory.subs.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            ) : <div className="hidden md:block" />}
          </div>

          {/* Existing limit info banner */}
          {isExisting && !isLoading && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium">
              <Pencil size={14} />
              Existing limit found for <strong>{storeName}</strong> — {selectedCategory.label}. Edit and save to update.
            </div>
          )}

          {/* Limit Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
              Monthly Limit Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">₹</span>
              <input
                type="number"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                placeholder={isLoading ? "Loading..." : "e.g. 5000"}
                disabled={isLoading}
                className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-5 py-4 text-xl font-bold text-gray-900 focus:outline-none focus:border-[#a855f7] focus:ring-1 focus:ring-[#a855f7] transition-all placeholder-gray-300"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              This limit will automatically apply every month. No need to set it again unless you want to change it.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-between items-center rounded-b-2xl">
          <div className="text-sm font-medium text-green-600">
            {successMsg && (
              <span className="flex items-center gap-1">
                <CheckCircle size={16} /> {successMsg}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-8 py-2.5 rounded-xl bg-[#0a142f] text-white font-semibold hover:bg-[#162548] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow"
            >
              {isSaving ? "Saving..." : isExisting ? "Update Limit" : "Save Limit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignTargetModal;

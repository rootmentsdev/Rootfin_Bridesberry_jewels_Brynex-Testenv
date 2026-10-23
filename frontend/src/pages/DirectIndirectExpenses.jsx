import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import baseUrl from "../api/api";
import { ChevronDown, X, Menu, ArrowLeft, Search, Check } from "lucide-react";
import { useSidebar } from "../hooks/useSidebar.js";
import {
  IMAGE_CONFIG,
  processImageFiles,
  getFilesFromDragEvent,
  triggerFileInput,
} from "../utils/imageUpload";

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  searchPlaceholder = "Search...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase().trim();
    return options.filter(
      (opt) =>
        (opt.label || "").toLowerCase().includes(term) ||
        (opt.value || "").toLowerCase().includes(term)
    );
  }, [options, search]);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`w-full flex items-center justify-between rounded-xl border bg-white px-4 py-3.5 text-sm transition-all focus:outline-none ${
          isOpen ? "border-purple-500 ring-2 ring-purple-100 shadow-xs" : "border-gray-200"
        } ${disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "cursor-pointer hover:border-gray-300"}`}
      >
        <span
          className={`truncate ${
            selectedOption ? "text-gray-800 font-medium" : "text-gray-400"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? "rotate-180 text-purple-600" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-gray-100 bg-white shadow-xl overflow-hidden animate-in fade-in-0 duration-150">
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/70">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-purple-50 text-purple-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check size={14} className="text-purple-600 shrink-0 ml-2" />}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-xs text-gray-400">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DIRECT_EXPENSE_CATS = [
  { value: "Dry Cleaning", label: "Dry Cleaning" },
  { value: "Altration", label: "Altration" },
  { value: "Material", label: "Material" },
  { value: "Raw Materials And Consumables", label: "Raw Materials And Consumables" },
  { value: "Freight Charges", label: "Freight Charges" },
  { value: "Product expenses", label: "Product expenses" },
  { value: "Labour Charges - Warehouse", label: "Labour Charges - Warehouse" },
  { value: "Cost of Goods Sold", label: "Cost of Goods Sold" },
  { value: "Labor", label: "Labor" },
  { value: "Materials", label: "Materials" },
  { value: "Subcontractor", label: "Subcontractor" },
  { value: "Job Costing", label: "Job Costing" },
  { value: "Transportation Expenses", label: "Transportation Expenses" },
  { value: "Freight Expenses", label: "Freight Expenses" },
  { value: "Dry Cleaning Expenses", label: "Dry Cleaning Expenses" },
  { value: "Uniform Stitching", label: "Uniform Stitching" },
  { value: "Alteration Expense", label: "Alteration Expense" },
  { value: "Raw Materials / Dress Accessories", label: "Raw Materials / Dress Accessories" },
];

const INDIRECT_EXPENSE_CATS = [
  { value: "Courier Charges", label: "Courier Charges" },
  { value: "Repairs & Maintenance", label: "Repairs & Maintenance" },
  { value: "Incentive", label: "Incentive" },
  { value: "Salary/Salary Advance", label: "Salary/Salary Advance" },
  { value: "Travel Exp", label: "Travel Exp" },
  { value: "Fuel Exp", label: "Fuel Exp" },
  { value: "Office Expense", label: "Office Expense" },
  { value: "Internet Expense", label: "Internet Expense" },
  { value: "Electricity Charges", label: "Electricity Charges" },
  { value: "Water Charges", label: "Water Charges" },
  { value: "Waste Management", label: "Waste Management" },
  { value: "Printing & Stationary", label: "Printing & Stationary" },
  { value: "Staff Welfare", label: "Staff Welfare" },
  { value: "Staff Accommodation", label: "Staff Accommodation" },
  { value: "Rent", label: "Rent" },
  { value: "Asset Purchase", label: "Asset Purchase" },
  { value: "Refund", label: "Refund" },
  { value: "Office Supplies", label: "Office Supplies" },
  { value: "Bank Fees and Charges", label: "Bank Fees and Charges" },
  { value: "Travel Expense", label: "Travel Expense" },
  { value: "Directors Travelling Expense", label: "Directors Travelling Expense" },
  { value: "Employee Travel Expenses", label: "Employee Travel Expenses" },
  { value: "Cluster Travelling Expense", label: "Cluster Travelling Expense" },
  { value: "Telephone Expense", label: "Telephone Expense" },
  { value: "Automobile Expense", label: "Automobile Expense" },
  { value: "IT and Internet Expenses", label: "IT and Internet Expenses" },
  { value: "Rent Expense", label: "Rent Expense" },
  { value: "Janitorial Expense", label: "Janitorial Expense" },
  { value: "Postage", label: "Postage" },
  { value: "Bad Debt", label: "Bad Debt" },
  { value: "Salaries and Employee Wages", label: "Salaries and Employee Wages" },
  { value: "Meals and Entertainment", label: "Meals and Entertainment" },
  { value: "Depreciation Expense", label: "Depreciation Expense" },
  { value: "Consultant Expense", label: "Consultant Expense" },
  { value: "Repairs and Maintenance", label: "Repairs and Maintenance" },
  { value: "Other Expenses", label: "Other Expenses" },
  { value: "Lodging", label: "Lodging" },
  { value: "Transportation Expense", label: "Transportation Expense" },
  { value: "Depreciation And Amortisation", label: "Depreciation And Amortisation" },
  { value: "EPF Contribution-Employer", label: "EPF Contribution-Employer" },
  { value: "ESI Contribution-Employer", label: "ESI Contribution-Employer" },
  { value: "Interest and Fine", label: "Interest and Fine" },
  { value: "Fines and Penalties", label: "Fines and Penalties" },
  { value: "Rates & Taxes", label: "Rates & Taxes" },
  { value: "Interest on TDS", label: "Interest on TDS" },
  { value: "Fine's and penalty-Electricity", label: "Fine's and penalty-Electricity" },
  { value: "Interest & Late fee", label: "Interest & Late fee" },
  { value: "Telephone & Internet Expense", label: "Telephone & Internet Expense" },
  { value: "Office Expenses [parent]", label: "Office Expenses [parent]" },
  { value: "Printing and Stationery", label: "Printing and Stationery" },
  { value: "Internet Expenses", label: "Internet Expenses" },
  { value: "Office Expenses", label: "Office Expenses" },
  { value: "Printer Consumables", label: "Printer Consumables" },
  { value: "Petty Expenses", label: "Petty Expenses" },
  { value: "Fuel Expenses", label: "Fuel Expenses" },
  { value: "Legal Charges", label: "Legal Charges" },
  { value: "Charity", label: "Charity" },
  { value: "Cleaning Expenses", label: "Cleaning Expenses" },
  { value: "Labour Charges Office", label: "Labour Charges Office" },
  { value: "Parking charge", label: "Parking charge" },
  { value: "Subscription Charges", label: "Subscription Charges" },
  { value: "Marketing & Promotion", label: "Marketing & Promotion" },
  { value: "Advertising And Marketing", label: "Advertising And Marketing" },
  { value: "Salary And Wages", label: "Salary And Wages" },
  { value: "Overtime Payment", label: "Overtime Payment" },
  { value: "Consultation Charges", label: "Consultation Charges" },
  { value: "Accounting Charges", label: "Accounting Charges" },
  { value: "Bank Charges", label: "Bank Charges" },
  { value: "Finance Charges", label: "Finance Charges" },
  { value: "Paytm Deductions", label: "Paytm Deductions" },
  { value: "Car Loan Interest", label: "Car Loan Interest" },
  { value: "Utility Charges", label: "Utility Charges" },
  { value: "Staff Welfare Expenses", label: "Staff Welfare Expenses" },
  { value: "Staff Food And Accomodation", label: "Staff Food And Accomodation" },
  { value: "Gift Expenses", label: "Gift Expenses" },
  { value: "Rent Expenses - Warehouse", label: "Rent Expenses - Warehouse" },
  { value: "Generator Expenses", label: "Generator Expenses" },
  { value: "Meeting Expenses", label: "Meeting Expenses" },
  { value: "Vehicle Insurance", label: "Vehicle Insurance" },
  { value: "Printer Service", label: "Printer Service" },
  { value: "Domain Purchase", label: "Domain Purchase" },
  { value: "Filing fees", label: "Filing fees" },
  { value: "Selling Expenses", label: "Selling Expenses" },
  { value: "Discount Allowed", label: "Discount Allowed" },
  { value: "Equipment Rent", label: "Equipment Rent" },
  { value: "MCA Charges", label: "MCA Charges" },
  { value: "GST Late fees and interest", label: "GST Late fees and interest" },
  { value: "Rental Supplies Expense", label: "Rental Supplies Expense" },
  { value: "Training & Development Expenses", label: "Training & Development Expenses" },
  { value: "Interior Designing", label: "Interior Designing" },
  { value: "Audit Fee", label: "Audit Fee" },
  { value: "Lease Registration Charges", label: "Lease Registration Charges" },
  { value: "Payment Gateway Charges", label: "Payment Gateway Charges" },
  { value: "House Rent Allowance", label: "House Rent Allowance" },
  { value: "Utility Connection / Government Fees", label: "Utility Connection / Government Fees" },
  { value: "TDS Late fee", label: "TDS Late fee" },
  { value: "Trademark Expense", label: "Trademark Expense" },
  { value: "Uniform Expense", label: "Uniform Expense" },
  { value: "Food expense", label: "Food expense" },
];

const fallbackLocations = [
  { locName: "Z-Edapally1", locCode: "144" },
  { locName: "Warehouse", locCode: "858" },
  { locName: "G-Edappally", locCode: "702" },
  { locName: "HEAD OFFICE01", locCode: "759" },
  { locName: "SG-Trivandrum", locCode: "700" },
  { locName: "Z- Edappal", locCode: "100" },
  { locName: "Z.Perinthalmanna", locCode: "133" },
  { locName: "Z.Kottakkal", locCode: "122" },
  { locName: "G.Kottayam", locCode: "701" },
  { locName: "G.Perumbavoor", locCode: "703" },
  { locName: "G.Thrissur", locCode: "704" },
  { locName: "G.Chavakkad", locCode: "706" },
  { locName: "G.Calicut ", locCode: "712" },
  { locName: "G.Vadakara", locCode: "708" },
  { locName: "G.Edappal", locCode: "707" },
  { locName: "G.Perinthalmanna", locCode: "709" },
  { locName: "G.Kottakkal", locCode: "711" },
  { locName: "G.Manjeri", locCode: "710" },
  { locName: "G.Palakkad ", locCode: "705" },
  { locName: "G.Kalpetta", locCode: "717" },
  { locName: "G.Kannur", locCode: "716" },
  { locName: "G.Mg Road", locCode: "718" },
  { locName: "Production", locCode: "101" },
  { locName: "Office", locCode: "102" },
  { locName: "WAREHOUSE", locCode: "103" }
];

const DirectIndirectExpenses = ({ initialType = "direct" }) => {
  const isSidebarOpen = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const isIndirectUrl = location.pathname.includes("indirect");
  const [expenseType, setExpenseType] = useState(isIndirectUrl ? "indirect" : initialType);

  useEffect(() => {
    if (location.pathname.includes("indirect")) {
      setExpenseType("indirect");
    } else if (location.pathname.includes("direct")) {
      setExpenseType("direct");
    }
  }, [location.pathname]);

  const currentusers = JSON.parse(localStorage.getItem("rootfinuser")) || {};
  const isAdmin = (currentusers.power || "").toLowerCase() === "admin" || (currentusers.role || "").toLowerCase() === "admin";
  const isSuperAdmin = (currentusers.role || "").toLowerCase() === "superadmin";
  const isFinancialHead = (currentusers.role || "").toLowerCase() === "financial_head";
  const canSelectStore = isAdmin || isSuperAdmin || isFinancialHead;

  const defaultStore = canSelectStore ? "" : (currentusers.locCode || "759");

  const [category, setCategory] = useState("");
  const [branch, setBranch] = useState(defaultStore);
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  
  // Image Upload States
  const fileInputRef = useRef(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadErrors, setUploadErrors] = useState([]);

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const categories = expenseType === "direct" ? DIRECT_EXPENSE_CATS : INDIRECT_EXPENSE_CATS;

  // Reset category when tab switches
  useEffect(() => {
    setCategory("");
  }, [expenseType]);

  // Drag & Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = getFilesFromDragEvent(e);
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFiles = async (files) => {
    setUploading(true);
    setUploadErrors([]);

    try {
      const remainingSlots = IMAGE_CONFIG.MAX_FILES - images.length;
      if (remainingSlots <= 0) {
        setUploadErrors([`You can only upload up to ${IMAGE_CONFIG.MAX_FILES} images.`]);
        setUploading(false);
        return;
      }

      const filesToProcess = files.slice(0, remainingSlots);
      const { images: processedImages, errors: validationErrors } = await processImageFiles(filesToProcess);

      if (validationErrors.length > 0) {
        setUploadErrors(validationErrors);
      }

      if (processedImages.length > 0) {
        setImages((prev) => [...prev, ...processedImages]);
      }
    } catch (error) {
      setUploadErrors(["Error processing images. Please try again."]);
      console.error("Image upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setStatusMessage(null);

    if (!category) {
      setStatusMessage({ type: "error", text: "Please select a Category." });
      return;
    }

    const targetBranch = canSelectStore ? branch : (currentusers.locCode || "759");
    if (!targetBranch) {
      setStatusMessage({ type: "error", text: "Please select a Branch." });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setStatusMessage({ type: "error", text: "Please enter a valid Amount." });
      return;
    }

    if (images.length === 0) {
      setStatusMessage({ type: "error", text: "Please upload at least one Attachment." });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      type: "Expense",
      expenseType: expenseType, // "direct" | "indirect"
      category: category,
      remark: remarks.trim() ? `[${expenseType.toUpperCase()}] ${remarks.trim()}` : `[${expenseType.toUpperCase()}] ${category}`,
      locCode: targetBranch,
      isAdminLevel: canSelectStore,
      amount: `-${amount}`,
      cash: `-${amount}`,
      bank: "0",
      upi: "0",
      paymentMethod: "cash",
      date: new Date().toISOString().split("T")[0],
      attachment: images[0]?.base64 || null,
      attachments: images.map(img => img.base64),
    };

    try {
      const res = await fetch(`${baseUrl.baseUrl}user/createPayment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: "error", text: json?.message || "Failed to save expense." });
      } else {
        setStatusMessage({
          type: "success",
          text: `${expenseType === "direct" ? "Direct" : "Indirect"} Expense saved successfully!`,
        });
        handleCancel();
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: "error", text: "Network error: Failed to save expense." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCategory("");
    if (canSelectStore) setBranch("");
    setAmount("");
    setRemarks("");
    setImages([]);
    setUploadErrors([]);
    navigate("/record-expense");
  };

  return (
    <div className={`min-h-screen bg-[#FAFAFB] transition-all duration-300 ${isSidebarOpen ? "md:ml-64 ml-0" : "ml-0"}`}>
      <div className="w-full px-6 sm:px-10 py-8">
        
        {/* Top Header: Sidebar Menu Toggle, Back Button & Direct / Indirect Expense Pill Switch */}
        <div className="mb-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-xs cursor-pointer transition-colors"
            title="Toggle Sidebar Menu"
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/record-expense")}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-xs cursor-pointer transition-colors"
            title="Back to Expense List"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="inline-flex bg-[#EBECEF] p-1 rounded-full border border-gray-200/60 shadow-xs">
            <button
              type="button"
              onClick={() => setExpenseType("direct")}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                expenseType === "direct"
                  ? "bg-white text-gray-800 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Direct Expense
            </button>
            <button
              type="button"
              onClick={() => setExpenseType("indirect")}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer ${
                expenseType === "indirect"
                  ? "bg-white text-gray-800 shadow-sm font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Indirect Expense
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between text-sm font-medium border shadow-xs transition-all ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs uppercase font-bold text-gray-500 hover:text-gray-800 cursor-pointer ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Form Container (Left-aligned) */}
        <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
          
          {/* Row 1: Category, Branch, Amount (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Category */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={category}
                onChange={(val) => setCategory(val)}
                options={categories}
                placeholder="Select Category"
                searchPlaceholder="Search category..."
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Branch <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                value={branch || (canSelectStore ? "" : (currentusers.locCode || "759"))}
                onChange={(val) => setBranch(val)}
                options={fallbackLocations.map((loc) => ({
                  value: loc.locCode,
                  label: loc.locName,
                }))}
                placeholder="Select Branch"
                searchPlaceholder="Search branch..."
                disabled={!canSelectStore}
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="Enter the amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all font-medium"
              />
            </div>

          </div>

          {/* Row 2: Attachment (Left) and Remarks (Right) (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            {/* Attachment */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Attachment <span className="text-red-500">*</span>
              </label>

              {/* Upload Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-2xl p-8 bg-white flex flex-col items-center justify-center text-center min-h-[200px] transition-colors ${
                  dragActive
                    ? "border-purple-500 bg-purple-50/20"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <p className="text-sm font-semibold text-gray-800">
                  Drag image (s) here or browse images
                </p>
                <p className="mt-1 text-xs text-gray-400 max-w-xs leading-relaxed">
                  You can add up to 15 images, each not exceeding 5MB in size and 7000x7000 pixels resolution.
                </p>

                <button
                  type="button"
                  onClick={() => triggerFileInput(fileInputRef)}
                  disabled={uploading}
                  className="mt-4 rounded-lg bg-[#272B30] hover:bg-black text-white px-7 py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
              </div>

              {/* Error messages if any */}
              {uploadErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadErrors.map((err, idx) => (
                    <p key={idx} className="text-xs text-red-500 font-medium">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Uploaded Images Thumbnails */}
              {images.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold text-gray-500">
                    Uploaded Images ({images.length}/{IMAGE_CONFIG.MAX_FILES})
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square shadow-2xs"
                      >
                        <img
                          src={img.base64 || img}
                          alt={img.name || `Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/70 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                          title="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-normal text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                placeholder="Enter remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full h-[200px] rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all resize-none"
              />
            </div>

          </div>

          {/* Row 3: Action Buttons (Bottom Left) */}
          <div className="flex items-center gap-3 pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#9B48D7] hover:bg-[#8B38C7] text-white px-7 py-2.5 text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] text-gray-700 px-7 py-2.5 text-sm font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default DirectIndirectExpenses;

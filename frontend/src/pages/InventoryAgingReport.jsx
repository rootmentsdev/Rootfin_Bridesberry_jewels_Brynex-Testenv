import React, { useEffect, useMemo, useState } from "react";
import Headers from "../components/Header.jsx";
import Select from "react-select";
import baseUrl from "../api/api.js";
import { CSVLink } from "react-csv";
import { Helmet } from "react-helmet";
import { FiDownload } from "react-icons/fi";
import {
  Loader2,
  Printer,
  Clock,
  Package,
  AlertTriangle,
  Layers,
  Search,
  RefreshCw,
  Folder,
  ShoppingCart,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Tag,
  ListFilter,
  LayoutList
} from "lucide-react";
import { useSidebar } from "../hooks/useSidebar.js";
import { useActiveStores } from "../utils/storeService.js";

// Helper to format currency
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0.00";
  const num = Number(amount);
  return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Custom React-Select styles for clean modern UI
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "#ffffff",
    borderColor: state.isFocused ? "#9333ea" : "#d1d5db",
    borderRadius: "0.5rem",
    padding: "1px 2px",
    minHeight: "40px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(147, 51, 234, 0.2)" : "none",
    "&:hover": {
      borderColor: "#9ca3af",
    },
    fontSize: "0.875rem",
    color: "#1f2937",
    cursor: "pointer",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#9333ea"
      : state.isFocused
      ? "#f3e8ff"
      : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#374151",
    fontSize: "0.875rem",
    cursor: "pointer",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.5rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    zIndex: 50,
  }),
};

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "shirt", label: "Shirt Sales" },
  { value: "shoe", label: "Shoe Sales" },
  { value: "other", label: "Other Goods" },
];

const bracketOptions = [
  { value: "all", label: "All Age Brackets" },
  { value: "0_30", label: "0 - 30 Days (Fresh Stock)" },
  { value: "31_60", label: "31 - 60 Days (Normal)" },
  { value: "61_90", label: "61 - 90 Days (Slow Moving)" },
  { value: "91_120", label: "91 - 120 Days (Attention)" },
  { value: "120_plus", label: "120+ Days (Stagnant Stock)" },
];

const salesStatusOptions = [
  { value: "all", label: "All Items (Sold & Unsold)" },
  { value: "sold", label: "Sold Items Only (Has Sales)" },
  { value: "unsold", label: "Unsold Items Only (0 Sales / Unsailed)" },
];

const InventoryAgingReport = () => {
  const isSidebarOpen = useSidebar();
  const { stores: activeStores } = useActiveStores();
  const storeOptions = [
    { value: "All Stores", label: "All Stores" },
    ...activeStores.map((s) => ({ value: s.locName, label: s.locName })),
  ];
  const [selectedStore, setSelectedStore] = useState("All Stores");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [selectedBracket, setSelectedBracket] = useState("all");
  const [selectedSalesStatus, setSelectedSalesStatus] = useState("all");
  const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("age_desc"); // age_desc, age_asc, value_desc, sales_desc, name_asc
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hideZeroStock, setHideZeroStock] = useState(false);
  const [groupByBracketView, setGroupByBracketView] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState("50");

  const currentUser = JSON.parse(localStorage.getItem("rootfinuser") || "{}");
  const isAdmin = (currentUser?.power || "").toLowerCase() === "admin";
  const isClusterManager = (currentUser?.role || "").toLowerCase() === "cluster_manager";
  const clusterAllowedLocCodes = currentUser?.allowedLocCodes || [];
  const adminEmails = ["officerootments@gmail.com", "brynex@gmail.com"];
  const isMainAdmin =
    isAdmin ||
    adminEmails.some((email) => (currentUser?.email || "").toLowerCase() === email.toLowerCase()) ||
    ["858", "103"].includes(currentUser?.locCode);
  const canChooseStore = isMainAdmin || isClusterManager;

  useEffect(() => {
    if (!canChooseStore && currentUser?.locCode) {
      if (currentUser?.locCode === "718") {
        setSelectedStore("MG Road");
      } else {
        setSelectedStore("Warehouse");
      }
    }
  }, []);

  // Compute dynamic group options from backend and loaded items
  const groupOptions = useMemo(() => {
    const opts = [
      { value: "all", label: "All Groups" },
      { value: "ungrouped", label: "Standalone / No Group" },
    ];
    const set = new Set();
    (reportData?.groups || []).forEach((g) => {
      if (g && typeof g === "string") set.add(g.trim());
    });
    (reportData?.items || []).forEach((it) => {
      if (it.groupName && typeof it.groupName === "string") set.add(it.groupName.trim());
    });
    Array.from(set)
      .sort((a, b) => a.localeCompare(b))
      .forEach((g) => {
        opts.push({ value: g, label: g });
      });
    return opts;
  }, [reportData]);

  const fetchReport = async () => {
    setLoading(true);
    setHasFetched(true);
    try {
      const warehouseParam = selectedStore || "All Stores";

      const params = new URLSearchParams({
        warehouse: warehouseParam,
        locCode: currentUser?.locCode || "",
        userId: currentUser?.email || currentUser?._id || "",
        category: selectedCategory,
        group: selectedGroup,
        salesStatus: selectedSalesStatus,
        bracket: selectedBracket,
        asOfDate: asOfDate,
      });

      if (isClusterManager && clusterAllowedLocCodes.length > 0) {
        params.append("allowedLocCodes", clusterAllowedLocCodes.join(","));
      }

      const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
      const response = await fetch(`${API_URL}/api/reports/inventory/aging?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch inventory aging report");
      const result = await response.json();

      if (result.success && result.data) {
        let items = result.data.items || [];
        let brackets = result.data.brackets || null;
        let summary = result.data.summary || null;
        let groups = result.data.groups || [];

        // Fallback calculation if summary is missing
        if (!summary) {
          const totalStock = items.reduce((s, i) => s + (i.stockOnHand || 0), 0);
          const totalVal = items.reduce((s, i) => s + (i.stockValue || 0), 0);
          const totalSold = items.reduce((s, i) => s + (i.soldQuantity || 0), 0);
          const totalSoldVal = items.reduce((s, i) => s + (i.soldValue || 0), 0);
          const unsoldCnt = items.filter((i) => (i.soldQuantity || 0) === 0).length;
          const soldCnt = items.filter((i) => (i.soldQuantity || 0) > 0).length;

          summary = {
            totalItems: items.length,
            totalStock: totalStock,
            totalValue: totalVal,
            totalSoldQuantity: totalSold,
            totalSoldValue: totalSoldVal,
            totalUnsoldItems: unsoldCnt,
            totalSoldItems: soldCnt,
            averageAgeDays:
              totalStock > 0
                ? Math.round(items.reduce((s, i) => s + i.ageInDays * i.stockOnHand, 0) / totalStock)
                : 0,
            criticalAgedValue: items.filter((i) => i.ageInDays > 90).reduce((s, i) => s + i.stockValue, 0),
            criticalAgedStock: items.filter((i) => i.ageInDays > 90).reduce((s, i) => s + i.stockOnHand, 0),
            warehouse: selectedStore || "All Stores",
          };
        }

        setReportData({
          summary,
          brackets,
          groups,
          items,
        });
      } else {
        setReportData(null);
      }
    } catch (error) {
      console.error("Error fetching inventory aging report:", error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedStore, selectedCategory, selectedGroup, selectedSalesStatus, selectedBracket, asOfDate]);

  // Filter and sort items client-side for immediate responsiveness
  const processedItems = useMemo(() => {
    if (!reportData?.items) return [];
    let list = [...reportData.items];

    // Filter zero stock if toggle enabled
    if (hideZeroStock) {
      list = list.filter((item) => (item.stockOnHand || 0) > 0);
    }

    // Filter by Group
    if (selectedGroup !== "all") {
      if (selectedGroup === "ungrouped") {
        list = list.filter((item) => !item.groupName || item.groupName === "Standalone");
      } else {
        list = list.filter((item) => (item.groupName || "").toLowerCase() === selectedGroup.toLowerCase());
      }
    }

    // Filter by Age Bracket
    if (selectedBracket !== "all") {
      list = list.filter((item) => item.ageBracket === selectedBracket);
    }

    // Filter by Sales Status (Sold vs Unsold)
    if (selectedSalesStatus === "sold") {
      list = list.filter((item) => (item.soldQuantity || 0) > 0);
    } else if (selectedSalesStatus === "unsold") {
      list = list.filter((item) => (item.soldQuantity || 0) === 0);
    }

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.itemName?.toLowerCase().includes(q) ||
          item.sku?.toLowerCase().includes(q) ||
          item.groupName?.toLowerCase().includes(q) ||
          item.warehouse?.toLowerCase().includes(q) ||
          item.inwardSource?.toLowerCase().includes(q) ||
          item.bracketLabel?.toLowerCase().includes(q)
      );
    }

    // Sort items (Note: "Highest quantity" has been removed per requirement 1)
    list.sort((a, b) => {
      if (sortBy === "age_desc") return (b.ageInDays || 0) - (a.ageInDays || 0);
      if (sortBy === "age_asc") return (a.ageInDays || 0) - (b.ageInDays || 0);
      if (sortBy === "value_desc") return (b.stockValue || 0) - (a.stockValue || 0);
      if (sortBy === "sales_desc") return (b.soldQuantity || 0) - (a.soldQuantity || 0);
      if (sortBy === "name_asc") return (a.itemName || "").localeCompare(b.itemName || "");
      return 0;
    });

    return list;
  }, [reportData, selectedGroup, selectedBracket, selectedSalesStatus, hideZeroStock, searchQuery, sortBy]);

  // Grouped items by bracket for "Group by Age Bracket" view
  const groupedByBracketData = useMemo(() => {
    if (!groupByBracketView) return null;
    const bracketOrder = [
      { key: "0_30", label: "0 - 30 Days (Fresh Stock)", color: "emerald", border: "border-emerald-200", bg: "bg-emerald-50/60" },
      { key: "31_60", label: "31 - 60 Days (Normal)", color: "blue", border: "border-blue-200", bg: "bg-blue-50/60" },
      { key: "61_90", label: "61 - 90 Days (Slow Moving)", color: "amber", border: "border-amber-200", bg: "bg-amber-50/60" },
      { key: "91_120", label: "91 - 120 Days (Attention Needed)", color: "orange", border: "border-orange-200", bg: "bg-orange-50/60" },
      { key: "120_plus", label: "120+ Days (Stagnant Stock)", color: "red", border: "border-red-200", bg: "bg-red-50/60" },
    ];

    return bracketOrder.map((grp) => {
      const itemsInBracket = processedItems.filter((it) => it.ageBracket === grp.key);
      const totalStock = itemsInBracket.reduce((sum, it) => sum + (it.stockOnHand || 0), 0);
      const totalVal = itemsInBracket.reduce((sum, it) => sum + (it.stockValue || 0), 0);
      const totalSold = itemsInBracket.reduce((sum, it) => sum + (it.soldQuantity || 0), 0);
      return {
        ...grp,
        items: itemsInBracket,
        totalStock,
        totalVal,
        totalSold,
      };
    }).filter((grp) => selectedBracket === "all" || grp.key === selectedBracket);
  }, [processedItems, groupByBracketView, selectedBracket]);

  // Pagination
  const paginatedItems = useMemo(() => {
    if (groupByBracketView || itemsPerPage === "all") return processedItems;
    const perPage = parseInt(itemsPerPage, 10);
    const start = (currentPage - 1) * perPage;
    return processedItems.slice(start, start + perPage);
  }, [processedItems, currentPage, itemsPerPage, groupByBracketView]);

  const totalPages = useMemo(() => {
    if (groupByBracketView || itemsPerPage === "all") return 1;
    return Math.ceil(processedItems.length / parseInt(itemsPerPage, 10)) || 1;
  }, [processedItems, itemsPerPage, groupByBracketView]);

  // CSV Data preparation including Group, Sales Status, and Sold info
  const csvData = useMemo(() => {
    if (!processedItems || processedItems.length === 0) return [];
    return processedItems.map((item, index) => ({
      "Sl No": index + 1,
      "Item Name": item.itemName || "",
      "Group Name": item.groupName || "Standalone",
      "SKU": item.sku || "",
      "Size": item.size || "-",
      "Category": item.category || "",
      "Warehouse": item.warehouse || "",
      "Sales Status": (item.soldQuantity || 0) > 0 ? "Sold" : "Unsold",
      "Sold Quantity (pcs)": item.soldQuantity || 0,
      "Sold Value (₹)": item.soldValue || 0,
      "Current Stock (pcs)": item.stockOnHand || 0,
      "Cost Price (₹)": item.costPrice || 0,
      "Stock Valuation (₹)": item.stockValue || 0,
      "Inward Date": item.inwardDate || "",
      "Inward Source": item.inwardSource || "",
      "Last Sold Date": item.lastSaleDate || "-",
      "Age (Days)": item.ageInDays || 0,
      "Age Bracket": item.bracketLabel || "",
    }));
  }, [processedItems]);

  const summary = reportData?.summary;
  const brackets = reportData?.brackets;

  return (
    <>
      <Helmet>
        <title>Inventory Aging Report | RootFin</title>
      </Helmet>
      <Headers title={"Inventory Aging Report"} />

      <div className={`transition-all duration-300 p-6 bg-[#f8fafc] min-h-screen ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
        
        {/* Header Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#1f2937] flex items-center gap-2.5">
              <Clock className="text-[#9333ea]" size={26} />
              <span>Inventory Aging Report</span>
            </h1>
            <p className="text-sm text-[#64748b] mt-0.5">
              Analyze product stock aging, item groups, sales velocity, and unsold stagnant inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {csvData.length > 0 && (
              <CSVLink
                data={csvData}
                filename={`inventory-aging-report-${asOfDate}.csv`}
                className="inline-flex items-center gap-2 rounded-lg border border-[#cbd5f5] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-xs hover:bg-[#f8fafc] transition"
              >
                <FiDownload size={15} className="text-[#9333ea]" />
                <span>Export CSV</span>
              </CSVLink>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#cbd5f5] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-xs hover:bg-[#f8fafc] transition"
            >
              <Printer size={15} />
              <span>Print</span>
            </button>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-[#9333ea] px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#7e22ce] transition disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar with Store, Group, Category, Sales Status, Date, and Bracket */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {/* Store / Warehouse */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Store / Warehouse
              </label>
              <Select
                options={storeOptions}
                styles={customSelectStyles}
                value={storeOptions.find((opt) => opt.value === selectedStore)}
                onChange={(option) => {
                  setSelectedStore(option ? option.value : "All Stores");
                  setCurrentPage(1);
                }}
                isDisabled={!canChooseStore}
                placeholder="Select Warehouse..."
              />
            </div>

            {/* Group Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Folder size={12} className="text-[#9333ea]" />
                <span>Item Group</span>
              </label>
              <Select
                options={groupOptions}
                styles={customSelectStyles}
                value={groupOptions.find((opt) => opt.value === selectedGroup) || groupOptions[0]}
                onChange={(option) => {
                  setSelectedGroup(option ? option.value : "all");
                  setCurrentPage(1);
                }}
                placeholder="Filter by Group..."
              />
            </div>

            {/* Sales Status Filter (Sales vs Unsold / Unsailed) */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <ShoppingCart size={12} className="text-[#059669]" />
                <span>Sales Status</span>
              </label>
              <Select
                options={salesStatusOptions}
                styles={customSelectStyles}
                value={salesStatusOptions.find((opt) => opt.value === selectedSalesStatus)}
                onChange={(option) => {
                  setSelectedSalesStatus(option ? option.value : "all");
                  setCurrentPage(1);
                }}
                placeholder="All Items..."
              />
            </div>

            {/* Age Bracket Filter */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Age Bracket
              </label>
              <Select
                options={bracketOptions}
                styles={customSelectStyles}
                value={bracketOptions.find((opt) => opt.value === selectedBracket)}
                onChange={(option) => {
                  setSelectedBracket(option ? option.value : "all");
                  setCurrentPage(1);
                }}
                placeholder="Filter by Age..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Category
              </label>
              <Select
                options={categoryOptions}
                styles={customSelectStyles}
                value={categoryOptions.find((opt) => opt.value === selectedCategory)}
                onChange={(option) => {
                  setSelectedCategory(option ? option.value : "all");
                  setCurrentPage(1);
                }}
                placeholder="Select Category..."
              />
            </div>

            {/* As-Of Evaluation Date */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-1.5">
                Evaluation Date (As Of)
              </label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => {
                  setAsOfDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 px-3 py-2 border border-[#d1d5db] rounded-lg text-sm text-[#1f2937] focus:outline-none focus:border-[#9333ea] focus:ring-1 focus:ring-[#9333ea]"
              />
            </div>
          </div>
        </div>

        {/* Top KPI Metrics Cards including Stock, Valuation, Sales, Unsold, and Stagnant items */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
            {/* Total Stock */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Total Stock</span>
                <div className="w-7 h-7 rounded-lg bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center">
                  <Package size={15} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#101828]">{(summary.totalStock || 0).toLocaleString()}</span>
                <span className="text-[11px] text-[#64748b]">pcs</span>
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">{summary.totalItems || 0} active items</div>
            </div>

            {/* Inventory Valuation */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Stock Valuation</span>
                <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#059669] flex items-center justify-center">
                  <Layers size={15} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#059669]">{formatCurrency(summary.totalValue)}</span>
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">At cost price</div>
            </div>

            {/* Sales Volume */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Total Sales</span>
                <div className="w-7 h-7 rounded-lg bg-[#f0fdf4] text-[#16a34a] flex items-center justify-center">
                  <ShoppingCart size={15} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#16a34a]">
                  {(summary.totalSoldQuantity || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#64748b]">pcs</span>
              </div>
              <div className="text-[10px] text-[#16a34a] font-medium mt-0.5">
                {formatCurrency(summary.totalSoldValue || 0)} revenue
              </div>
            </div>

            {/* Unsold Items */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Unsold Items</span>
                <div className="w-7 h-7 rounded-lg bg-[#fffbeb] text-[#d97706] flex items-center justify-center">
                  <HelpCircle size={15} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#d97706]">
                  {(summary.totalUnsoldItems || 0).toLocaleString()}
                </span>
                <span className="text-[11px] text-[#64748b]">unsailed</span>
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">0 units sold to date</div>
            </div>

            {/* Average Stock Age */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Avg Stock Age</span>
                <div className="w-7 h-7 rounded-lg bg-[#eff6ff] text-[#2563eb] flex items-center justify-center">
                  <Clock size={15} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#2563eb]">{summary.averageAgeDays || 0}</span>
                <span className="text-[11px] text-[#64748b]">days</span>
              </div>
              <div className="text-[10px] text-[#64748b] mt-0.5">Weighted average</div>
            </div>

            {/* Stagnant Aged Stock */}
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Aged &gt;90 Days</span>
                <div className="w-7 h-7 rounded-lg bg-[#fef2f2] text-[#ef4444] flex items-center justify-center">
                  <AlertTriangle size={15} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[#ef4444]">{formatCurrency(summary.criticalAgedValue)}</span>
              </div>
              <div className="text-[10px] text-[#ef4444] font-medium mt-0.5">
                {summary.criticalAgedStock || 0} pcs stagnant
              </div>
            </div>
          </div>
        )}

        {/* Age Brackets Interactive Cards Breakdown */}
        {brackets && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
                <Layers size={14} className="text-[#9333ea]" />
                <span>Age Bracket Breakdown (Click card to filter data)</span>
              </span>
              {selectedBracket !== "all" && (
                <button
                  onClick={() => setSelectedBracket("all")}
                  className="text-xs font-semibold text-[#9333ea] hover:text-[#7e22ce] hover:underline"
                >
                  Clear Bracket Filter (Show All)
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.values(brackets).map((b) => {
                const isSelected = selectedBracket === b.bracket;
                return (
                  <button
                    key={b.bracket}
                    onClick={() => {
                      setSelectedBracket(selectedBracket === b.bracket ? "all" : b.bracket);
                      setCurrentPage(1);
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#faf5ff] border-[#9333ea] shadow-md ring-2 ring-[#9333ea]/30 scale-[1.01]"
                        : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1] hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#374151]">{b.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.badgeBg}`}>
                        {b.count} items
                      </span>
                    </div>
                    <div className="text-base font-bold text-[#111827]">{formatCurrency(b.value)}</div>
                    <div className="flex items-center justify-between text-[11px] text-[#64748b] mt-1">
                      <span>{b.stock.toLocaleString()} units</span>
                      {b.soldQty > 0 ? (
                        <span className="text-[#059669] font-medium">{b.soldQty} sold</span>
                      ) : (
                        <span className="text-[#94a3b8]">0 sold</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Age Bracket Tabs & Sales Status Pill Bar */}
        <div className="bg-white rounded-t-xl border border-[#e2e8f0] border-b-0 p-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Age Bracket Segmented Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-[#64748b] mr-1">Age Filter:</span>
            {bracketOptions.map((opt) => {
              const isActive = selectedBracket === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSelectedBracket(opt.value);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-[#9333ea] text-white shadow-xs"
                      : "bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]"
                  }`}
                >
                  {opt.value === "all" ? "All Brackets" : opt.label.split("(")[0].trim()}
                </button>
              );
            })}
          </div>

          {/* Sales Status Quick Toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#64748b] mr-1">Sales:</span>
            <div className="inline-flex rounded-lg bg-[#f1f5f9] p-0.5">
              {salesStatusOptions.map((opt) => {
                const isActive = selectedSalesStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelectedSalesStatus(opt.value);
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? "bg-white text-[#1f2937] shadow-xs font-semibold"
                        : "text-[#64748b] hover:text-[#1f2937]"
                    }`}
                  >
                    {opt.value === "all" ? "All" : opt.value === "sold" ? "Sold" : "Unsold"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Search, Group by Bracket Toggle & Sort Toolbar */}
        <div className="bg-white border-x border-[#e2e8f0] p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by item name, SKU, group, warehouse..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#d1d5db] text-xs text-[#1f2937] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#9333ea] focus:ring-1 focus:ring-[#9333ea]"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode: Group by Age Bracket Toggle */}
            <button
              onClick={() => setGroupByBracketView(!groupByBracketView)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                groupByBracketView
                  ? "bg-[#faf5ff] text-[#9333ea] border-[#9333ea] font-semibold"
                  : "bg-[#f8fafc] text-[#475569] border-[#e2e8f0] hover:bg-[#f1f5f9]"
              }`}
            >
              <LayoutList size={14} />
              <span>{groupByBracketView ? "Grouped by Bracket (Active)" : "Group by Bracket"}</span>
            </button>

            {/* In-Stock Only Toggle */}
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#475569] cursor-pointer select-none bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0] hover:bg-[#f1f5f9]">
              <input
                type="checkbox"
                checked={hideZeroStock}
                onChange={(e) => {
                  setHideZeroStock(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-3.5 h-3.5 text-[#9333ea] rounded border-gray-300 focus:ring-[#9333ea]"
              />
              <span>In-Stock Only</span>
            </label>

            {/* Sort Options (Note: "Highest quantity" removed per requirement 1) */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-[#64748b]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#d1d5db] text-xs font-medium text-[#374151] bg-white focus:outline-none focus:border-[#9333ea] cursor-pointer"
              >
                <option value="age_desc">Oldest Stock (Highest Age)</option>
                <option value="age_asc">Newest Stock (Lowest Age)</option>
                <option value="value_desc">Highest Valuation</option>
                <option value="sales_desc">Highest Sales (Units Sold)</option>
                <option value="name_asc">Item Name (A-Z)</option>
              </select>
            </div>

            {/* Items Per Page (disabled if grouped by bracket view) */}
            {!groupByBracketView && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#64748b]">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 px-2.5 rounded-lg border border-[#d1d5db] text-xs font-medium text-[#374151] bg-white focus:outline-none focus:border-[#9333ea] cursor-pointer"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="all">All</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Items Aging Table */}
        <div className="bg-white rounded-b-xl border border-[#e2e8f0] shadow-xs overflow-hidden mb-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#64748b]">
              <Loader2 size={32} className="animate-spin text-[#9333ea] mb-3" />
              <p className="text-sm font-medium">Calculating stock age, groups, and sales data...</p>
            </div>
          ) : processedItems.length === 0 ? (
            <div className="py-16 text-center text-[#64748b]">
              <Package size={40} className="mx-auto text-[#cbd5e1] mb-2" />
              <p className="text-base font-semibold text-[#1e293b]">No aging records found</p>
              <p className="text-xs text-[#64748b] mt-1">
                Try adjusting the warehouse, group, sales status, or age bracket filters.
              </p>
            </div>
          ) : groupByBracketView ? (
            /* Grouped by Age Bracket View */
            <div className="divide-y divide-[#e2e8f0]">
              {groupedByBracketData.map((section) => (
                <div key={section.key} className="p-4">
                  {/* Bracket Section Header */}
                  <div className={`p-3 rounded-lg border ${section.border} ${section.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full bg-${section.color}-500`}></span>
                      <h3 className="text-sm font-bold text-[#1f2937]">{section.label}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white font-semibold text-[#475569] border border-gray-200">
                        {section.items.length} items
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-[#374151]">
                      <span>Stock: <strong>{section.totalStock.toLocaleString()} pcs</strong></span>
                      <span>Valuation: <strong className="text-[#059669]">{formatCurrency(section.totalVal)}</strong></span>
                      <span>Sales: <strong className="text-[#2563eb]">{section.totalSold.toLocaleString()} pcs</strong></span>
                    </div>
                  </div>

                  {section.items.length === 0 ? (
                    <p className="text-xs text-[#94a3b8] italic py-3 text-center">No items currently in this bracket</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Item Details</th>
                            <th className="py-2.5 px-3">Group</th>
                            <th className="py-2.5 px-3">Warehouse</th>
                            <th className="py-2.5 px-3">Inward Date &amp; Source</th>
                            <th className="py-2.5 px-3 text-center">Stock Age</th>
                            <th className="py-2.5 px-3 text-center">Sales Status</th>
                            <th className="py-2.5 px-3 text-right">Current Stock</th>
                            <th className="py-2.5 px-3 text-right">Unit Cost</th>
                            <th className="py-2.5 px-3 text-right">Stock Valuation</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f5f9] text-xs text-[#1e293b]">
                          {section.items.map((item, idx) => (
                            <tr key={`${item.itemId}_${item.warehouse}_${idx}`} className="hover:bg-[#faf5ff]/60 transition-colors">
                              <td className="py-2.5 px-3 text-[#94a3b8] font-medium">{idx + 1}</td>
                              
                              {/* Item Details */}
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-[#111827]">{item.itemName}</div>
                                <div className="text-[11px] text-[#64748b] mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  {item.sku && <span>SKU: <strong className="text-[#475569]">{item.sku}</strong></span>}
                                  {item.size && item.size !== "-" && <span>• Size: {item.size}</span>}
                                </div>
                              </td>

                              {/* Group Column */}
                              <td className="py-2.5 px-3">
                                {item.groupName ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                    {item.groupName}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-[#94a3b8] italic">Standalone</span>
                                )}
                              </td>

                              {/* Warehouse */}
                              <td className="py-2.5 px-3 font-medium text-[#475569]">{item.warehouse}</td>

                              {/* Inward Date */}
                              <td className="py-2.5 px-3">
                                <div className="font-medium text-[#111827]">{item.inwardDate || "-"}</div>
                                <div className="text-[11px] text-[#64748b]">{item.inwardSource || "Initial Stock"}</div>
                              </td>

                              {/* Age in Days */}
                              <td className="py-2.5 px-3 text-center font-bold text-[#1e293b]">
                                {item.ageInDays} Days
                              </td>

                              {/* Sales Status (Sold vs Unsold) */}
                              <td className="py-2.5 px-3 text-center">
                                {(item.soldQuantity || 0) > 0 ? (
                                  <div className="inline-flex flex-col items-center">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                      Sold ({item.soldQuantity} pcs)
                                    </span>
                                    {item.soldValue > 0 && (
                                      <span className="text-[10px] text-[#059669] font-medium mt-0.5">
                                        {formatCurrency(item.soldValue)}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    Unsold
                                  </span>
                                )}
                              </td>

                              {/* Current Stock */}
                              <td className="py-2.5 px-3 text-right">
                                <span className="font-bold text-[#111827]">
                                  {item.stockOnHand?.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-[#64748b] ml-1">pcs</span>
                              </td>

                              {/* Unit Cost */}
                              <td className="py-2.5 px-3 text-right font-medium text-[#475569]">
                                {formatCurrency(item.costPrice)}
                              </td>

                              {/* Stock Valuation */}
                              <td className="py-2.5 px-3 text-right font-bold text-[#059669]">
                                {formatCurrency(item.stockValue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Flat Standard Table */
            <div className="overflow-x-auto">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Group</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Inward Date &amp; Source</th>
                    <th className="py-3 px-4 text-center">Stock Age</th>
                    <th className="py-3 px-4 text-center">Age Bracket</th>
                    <th className="py-3 px-4 text-center">Sales Status</th>
                    <th className="py-3 px-4 text-right">Current Stock</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Stock Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9] text-xs text-[#1e293b]">
                  {paginatedItems.map((item, idx) => {
                    const rowNumber =
                      itemsPerPage === "all"
                        ? idx + 1
                        : (currentPage - 1) * parseInt(itemsPerPage, 10) + idx + 1;

                    return (
                      <tr key={`${item.itemId}_${item.warehouse}_${idx}`} className="hover:bg-[#faf5ff]/60 transition-colors">
                        <td className="py-3 px-4 text-[#94a3b8] font-medium">{rowNumber}</td>

                        {/* Item Name & Details */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#111827]">{item.itemName}</div>
                          <div className="text-[11px] text-[#64748b] mt-0.5 flex items-center gap-1.5 flex-wrap">
                            {item.sku && <span>SKU: <strong className="text-[#475569]">{item.sku}</strong></span>}
                            {item.size && item.size !== "-" && <span>• Size: {item.size}</span>}
                          </div>
                        </td>

                        {/* Group Column */}
                        <td className="py-3 px-4">
                          {item.groupName ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              {item.groupName}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#94a3b8] italic">Standalone</span>
                          )}
                        </td>

                        {/* Warehouse */}
                        <td className="py-3 px-4 font-medium text-[#475569]">{item.warehouse}</td>

                        {/* Inward Date & Source */}
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#111827]">{item.inwardDate || "-"}</div>
                          <div className="text-[11px] text-[#64748b]">{item.inwardSource || "Initial Stock"}</div>
                        </td>

                        {/* Age in Days */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              item.ageInDays <= 30
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.ageInDays <= 60
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : item.ageInDays <= 90
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : item.ageInDays <= 120
                                ? "bg-orange-50 text-orange-700 border border-orange-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {item.ageInDays} Days
                          </span>
                        </td>

                        {/* Age Bracket */}
                        <td className="py-3 px-4 text-center">
                          <span className="text-[11px] font-medium text-[#475569]">{item.bracketLabel}</span>
                        </td>

                        {/* Sales Status (Sold vs Unsold / Unsailed) */}
                        <td className="py-3 px-4 text-center">
                          {(item.soldQuantity || 0) > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Sold ({item.soldQuantity.toLocaleString()} pcs)
                              </span>
                              {item.soldValue > 0 && (
                                <span className="text-[10px] text-[#059669] font-medium mt-0.5">
                                  {formatCurrency(item.soldValue)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Unsold
                            </span>
                          )}
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-[#111827]">
                            {item.stockOnHand?.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-[#64748b] ml-1">pcs</span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4 text-right font-medium text-[#475569]">
                          {formatCurrency(item.costPrice)}
                        </td>

                        {/* Total Stock Valuation */}
                        <td className="py-3 px-4 text-right font-bold text-[#059669]">
                          {formatCurrency(item.stockValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer (when not grouped by bracket view) */}
          {!loading && !groupByBracketView && processedItems.length > 0 && itemsPerPage !== "all" && totalPages > 1 && (
            <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-4 py-3 flex items-center justify-between text-xs text-[#64748b]">
              <div>
                Showing {(currentPage - 1) * parseInt(itemsPerPage, 10) + 1} to{" "}
                {Math.min(currentPage * parseInt(itemsPerPage, 10), processedItems.length)} of {processedItems.length} records
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded border border-[#d1d5db] bg-white font-medium hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="font-medium text-[#374151]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded border border-[#d1d5db] bg-white font-medium hover:bg-[#f1f5f9] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </>
  );
};

export default InventoryAgingReport;

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import baseUrl from '../api/api';
import { 
  Search, 
  Plus, 
  SlidersHorizontal, 
  RotateCcw, 
  ChevronDown, 
  FileText, 
  ExternalLink,
  Menu
} from 'lucide-react';
import { useSidebar } from '../hooks/useSidebar.js';

const fallbackLocations = [
  { locName: "Warehouse", locCode: "858" },
  { locName: "G-Edappally", locCode: "702" },
  { locName: "HEAD OFFICE01", locCode: "759" },
  { locName: "Brynex Office", locCode: "102" },
  { locName: "SG-Trivandrum", locCode: "700" },
  { locName: "Z-Edapally", locCode: "144" },
  { locName: "Z-Edappal", locCode: "100" },
  { locName: "Z-Perinthalmanna", locCode: "133" },
  { locName: "Z-Kottakkal", locCode: "122" },
  { locName: "G-Kottayam", locCode: "701" },
  { locName: "G-Perumbavoor", locCode: "703" },
  { locName: "G-Thrissur", locCode: "704" },
  { locName: "G-Chavakkad", locCode: "706" },
  { locName: "G-Calicut", locCode: "712" },
  { locName: "G-Vadakara", locCode: "708" },
  { locName: "G-Edappal", locCode: "707" },
  { locName: "G-Perinthalmanna", locCode: "709" },
  { locName: "G-Kottakkal", locCode: "711" },
  { locName: "G-Manjeri", locCode: "710" },
  { locName: "G-Palakkad", locCode: "705" },
  { locName: "G-Kalpetta", locCode: "717" },
  { locName: "G-Kannur", locCode: "716" },
  { locName: "G-Mg Road", locCode: "718" },
  { locName: "Production", locCode: "101" },
  { locName: "WAREHOUSE", locCode: "103" },
  { locName: "Dappr Squad", locCode: "555" }
];

const RecordExpenses = () => {
  const isSidebarOpen = useSidebar();
  const navigate = useNavigate();

  const currentusers = JSON.parse(localStorage.getItem("rootfinuser")) || {};
  const isAdmin = (currentusers.power || "").toLowerCase() === "admin" || (currentusers.role || "").toLowerCase() === "admin";
  const isSuperAdmin = (currentusers.role || "").toLowerCase() === "superadmin";
  const isFinancialHead = (currentusers.role || "").toLowerCase() === "financial_head";
  const canSelectStore = isAdmin || isSuperAdmin || isFinancialHead;

  // Initial Date Filters (Start of current month to today)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const formatDateStr = (d) => d.toISOString().split("T")[0];

  const [dateFrom, setDateFrom] = useState(formatDateStr(firstDay));
  const [dateTo, setDateTo] = useState(formatDateStr(today));

  // Secondary Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedExpenseType, setSelectedExpenseType] = useState("all");
  const [selectedPaymentType, setSelectedPaymentType] = useState("all");

  // Data States
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Store lookup helper
  const getBranchName = (locCode) => {
    const loc = fallbackLocations.find(l => String(l.locCode) === String(locCode));
    if (loc) return loc.locName;
    if (String(locCode) === "102") return "Brynex Office";
    if (String(locCode) === "759") return "HEAD OFFICE01";
    return locCode ? `Store #${locCode}` : "Head Office";
  };

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const targetLoc = canSelectStore ? selectedStore : (currentusers.locCode || "all");
      const url = `${baseUrl.baseUrl}user/Getpayment?LocCode=${targetLoc}&DateFrom=${dateFrom}&DateTo=${dateTo}`;
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch expenses: ${res.statusText}`);
      }
      const json = await res.json();
      const list = json.data || json || [];
      
      // Filter out only Expense transactions
      const expenseList = list.filter(item => (item.type || "").toLowerCase() === "expense");
      setTransactions(expenseList);
    } catch (err) {
      console.error("Error fetching expense data:", err);
      setError(err.message || "Failed to load expense records");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filtered expenses based on client filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search filter (category or remarks)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const catMatch = (tx.category || "").toLowerCase().includes(term);
        const remarkMatch = (tx.remark || "").toLowerCase().includes(term);
        const branchMatch = getBranchName(tx.locCode).toLowerCase().includes(term);
        if (!catMatch && !remarkMatch && !branchMatch) return false;
      }

      // Store filter
      if (selectedStore !== "all") {
        if (String(tx.locCode) !== String(selectedStore)) return false;
      }

      // Expense Type filter (direct vs indirect)
      if (selectedExpenseType !== "all") {
        const isDirect = tx.expenseType === "direct" || (tx.remark || "").includes("[DIRECT");
        const isIndirect = tx.expenseType === "indirect" || (tx.remark || "").includes("[INDIRECT");

        if (selectedExpenseType === "direct" && !isDirect) return false;
        if (selectedExpenseType === "indirect" && !isIndirect && isDirect) return false;
      }

      // Payment Type filter
      if (selectedPaymentType !== "all") {
        const method = (tx.paymentMethod || "cash").toLowerCase();
        if (method !== selectedPaymentType.toLowerCase()) return false;
      }

      return true;
    });
  }, [transactions, searchTerm, selectedStore, selectedExpenseType, selectedPaymentType]);

  const getCleanCategory = (cat) => {
    if (!cat) return "-";
    return cat.replace(/^[a-z]/, (m) => m.toUpperCase());
  };

  const getCleanRemark = (remark) => {
    if (!remark) return "-";
    // Strip [DIRECT] or [INDIRECT] prefix if present for cleaner display
    const cleaned = remark.replace(/^\[(DIRECT|INDIRECT)[^\]]*\]\s*/i, "").trim();
    return cleaned || "-";
  };

  return (
    <div className={`min-h-screen bg-[#FAFAFB] transition-all duration-300 ${isSidebarOpen ? 'md:ml-64 ml-0' : 'ml-0'}`}>
      <div className="w-full px-6 sm:px-10 py-8">
        
        {/* Top Action Bar: Search Input & + New Expense Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => document.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-xs cursor-pointer"
              title="Toggle Sidebar Menu"
            >
              <Menu size={20} />
            </button>

            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or sku"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 shadow-xs"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/direct-expenses")}
            className="flex items-center justify-center gap-2 bg-[#18181B] hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>New Expense</span>
          </button>
        </div>

        {/* Date Filters Row */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-purple-500 shadow-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:border-purple-500 shadow-xs"
            />
          </div>

          <button
            type="button"
            onClick={fetchExpenses}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-[#9B48D7] hover:bg-[#8B38C7] text-white text-sm font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 h-[38px]"
          >
            {loading ? "Fetching..." : "Fetch Data"}
          </button>

          <button
            type="button"
            onClick={() => {}}
            className="px-4 py-2 rounded-xl bg-[#ECEEF2] hover:bg-gray-200 text-gray-700 text-sm font-medium flex items-center gap-1.5 transition-all shadow-xs h-[38px] cursor-pointer"
          >
            <span>Filters</span>
            <SlidersHorizontal size={14} />
          </button>
        </div>

        {/* Sub-Filters: Store, Expense Type, Payment Type, Refresh */}
        <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
          {/* Store Filter */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 mb-1">Store</span>
            <div className="relative">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 pr-8 focus:outline-none focus:border-purple-500 shadow-xs cursor-pointer min-w-[140px]"
              >
                <option value="all">All Stores</option>
                {fallbackLocations.map(loc => (
                  <option key={loc.locCode} value={loc.locCode}>{loc.locName}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Expense Type Filter */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 mb-1">Expense Type</span>
            <div className="relative">
              <select
                value={selectedExpenseType}
                onChange={(e) => setSelectedExpenseType(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 pr-8 focus:outline-none focus:border-purple-500 shadow-xs cursor-pointer min-w-[130px]"
              >
                <option value="all">All Types</option>
                <option value="direct">Direct</option>
                <option value="indirect">Indirect</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Payment Type Filter */}
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-gray-500 mb-1">Payment Type</span>
            <div className="relative">
              <select
                value={selectedPaymentType}
                onChange={(e) => setSelectedPaymentType(e.target.value)}
                className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 pr-8 focus:outline-none focus:border-purple-500 shadow-xs cursor-pointer min-w-[100px]"
              >
                <option value="all">All</option>
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
                <option value="upi">UPI</option>
                <option value="split">Split</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Refresh Button */}
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={fetchExpenses}
              className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-xs transition-colors cursor-pointer mt-auto"
              title="Refresh Data"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Expense Transactions Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#333333] text-white text-[11px] font-semibold tracking-wider uppercase">
                  <th className="py-3.5 px-5">Expense Category</th>
                  <th className="py-3.5 px-5">Branch</th>
                  <th className="py-3.5 px-5 text-center">Expense Type</th>
                  <th className="py-3.5 px-5">Attachment</th>
                  <th className="py-3.5 px-5">Payment Method</th>
                  <th className="py-3.5 px-5">Amount</th>
                  <th className="py-3.5 px-5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400">
                      Loading expense records...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-400">
                      No expense records found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => {
                    const isDirect = tx.expenseType === "direct" || (tx.remark || "").includes("[DIRECT");
                    const rawAmount = Math.abs(parseFloat(tx.amount || 0));
                    const attachmentLink = tx.attachmentUrl || (tx._id ? `${baseUrl.baseUrl}user/transaction/${tx._id}/attachment` : null);

                    return (
                      <tr key={tx._id || idx} className="hover:bg-gray-50/80 transition-colors">
                        {/* Category */}
                        <td className="py-4 px-5 font-medium text-gray-900">
                          {getCleanCategory(tx.category)}
                        </td>

                        {/* Branch */}
                        <td className="py-4 px-5 text-gray-600">
                          {getBranchName(tx.locCode)}
                        </td>

                        {/* Expense Type Badge */}
                        <td className="py-4 px-5 text-center">
                          {isDirect ? (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#FFEDD5] text-[#EA580C]">
                              Direct
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#F3E8FF] text-[#9333EA]">
                              Indirect
                            </span>
                          )}
                        </td>

                        {/* Attachment */}
                        <td className="py-4 px-5">
                          {tx.hasAttachment || tx.attachment ? (
                            <a
                              href={attachmentLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-purple-600 hover:text-purple-800 font-medium text-sm hover:underline inline-flex items-center gap-1"
                            >
                              <span>img{String(idx + 123)}.png</span>
                            </a>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td className="py-4 px-5 font-medium text-gray-800 uppercase text-xs">
                          {tx.paymentMethod || "CASH"}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-5 font-bold text-gray-900">
                          {rawAmount.toLocaleString()}
                        </td>

                        {/* Remarks */}
                        <td className="py-4 px-5 text-gray-500 text-xs max-w-xs truncate">
                          {getCleanRemark(tx.remark)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecordExpenses;

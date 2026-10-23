import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { CalendarIcon, RefreshCw, HandCoins, Banknote, Receipt, Link2, FileText } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import baseUrl from '../api/api.js';

const STORE_LIST = [
  { locName: "G-Edappal", locCode: "707" },
  { locName: "G-Edappally", locCode: "702" },
  { locName: "G-Kalpetta", locCode: "717" },
  { locName: "G-Kannur", locCode: "716" },
  { locName: "G-Kottakkal", locCode: "711" },
  { locName: "G-Kottayam", locCode: "701" },
  { locName: "G-Manjeri", locCode: "710" },
  { locName: "G-Mg Road", locCode: "718" },
  { locName: "G-Palakkad", locCode: "705" },
  { locName: "G-Perinthalmanna", locCode: "709" },
  { locName: "G-Perumbavoor", locCode: "703" },
  { locName: "G-Thrissur", locCode: "704" },
  { locName: "G-Vadakara", locCode: "708" },
  { locName: "G-Chavakkad", locCode: "706" },
  { locName: "G-Calicut", locCode: "712" },
  { locName: "HEAD OFFICE01", locCode: "759" },
  { locName: "Office", locCode: "102" },
  { locName: "Production", locCode: "101" },
  { locName: "SG-Trivandrum", locCode: "700" },
  { locName: "Warehouse", locCode: "858" },
  { locName: "WAREHOUSE", locCode: "103" },
  { locName: "Z-Edappal", locCode: "100" },
  { locName: "Z-Edapally", locCode: "144" },
  { locName: "Z-Kottakkal", locCode: "122" },
  { locName: "Z-Perinthalmanna", locCode: "133" },
];

const Home = ({ isSidebarOpen }) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });

  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [chartFilter, setChartFilter] = useState("All");
  const [daybookFilter, setDaybookFilter] = useState("All");

  const [incTotals, setIncTotals] = useState({ cash: 0, bank: 0, rbl: 0, upi: 0 });
  const [retTotals, setRetTotals] = useState({ cash: 0, bank: 0, rbl: 0, upi: 0 });
  const [expTotals, setExpTotals] = useState({ cash: 0, bank: 0, rbl: 0, upi: 0 });
  const [netTotals, setNetTotals] = useState({ cash: 0, bank: 0, rbl: 0, upi: 0 });

  const [chartData, setChartData] = useState([]);
  const [pendingStores, setPendingStores] = useState([]);
  const [closedStores, setClosedStores] = useState([]);
  const [lateClosedStores, setLateClosedStores] = useState([]);

  const [reorderAlerts, setReorderAlerts] = useState(0);
  const [purchaseOrders, setPurchaseOrders] = useState(0);
  const [lateClosures, setLateClosures] = useState(0);

  const fmt = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs min-w-[150px]">
          <p className="font-bold mb-2 pb-2 border-b border-gray-700">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <div className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-300 capitalize">{entry.name}</span>
              </div>
              <span className="font-bold">{fmt(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateFrom, dateTo]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const TWS_BASE = "https://rentalapi.rootments.live/api/GetBooking";
    const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "";
    const ALL_LOC_CODES = STORE_LIST.map(s => s.locCode);
    const DEPT_CODES = ["759", "102", "101", "858", "103"];
    const STORE_LOC_CODES = ALL_LOC_CODES.filter(lc => !DEPT_CODES.includes(lc));

    const EXPENSE_CATS = new Set([
      "petty expenses", "staff reimbursement", "maintenance expenses", "telephone internet",
      "utility bill", "salary", "rent", "courier charges", "asset purchase", "promotion_services",
      "spot incentive", "other expenses", "shoe sales return", "shirt sales return",
      "dry cleaning", "altration", "material", "travel exp", "fuel exp",
      "waste management", "water charges", "printing stationary", "staff welfare",
      "staff accommodation", "incentive", "write off",
    ]);

    const safeFetch = async (url) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return {};
        return await res.json();
      } catch (e) { return {}; }
    };

    try {
      // ── 1. Daybook Status ─────────────────────────────────────────────────
      let closedArr = [];
      let lateArr = [];
      try {
        const clsRes = await fetch(`${API_URL}/user/AdminColseView?date=${dateTo}&role=admin`);
        if (clsRes.ok) {
          const clsData = await clsRes.json();
          (clsData.data || []).forEach(c => {
             const created = new Date(c.createdAt);
             // Get the local date string (YYYY-MM-DD) of when the closure was actually created
             const createdDateStr = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}-${String(created.getDate()).padStart(2, '0')}`;
             // If closure was created on a later day than the daybook date, it's late
             if (createdDateStr > dateTo) {
                 lateArr.push(c.locCode);
             } else {
                 closedArr.push(c.locCode);
             }
          });
        }
      } catch (e) { console.error("Daybook error", e); }

      setClosedStores(STORE_LOC_CODES.filter(lc => closedArr.includes(lc)).map(lc => STORE_LIST.find(s => s.locCode === lc)).filter(Boolean));
      setLateClosedStores(STORE_LOC_CODES.filter(lc => lateArr.includes(lc)).map(lc => STORE_LIST.find(s => s.locCode === lc)).filter(Boolean));
      setPendingStores(STORE_LOC_CODES.filter(lc => !closedArr.includes(lc) && !lateArr.includes(lc)).map(lc => STORE_LIST.find(s => s.locCode === lc)).filter(Boolean));

      console.log("Daybook debug:", { dateTo, closedArr, lateArr, STORE_LOC_CODES });

      // ── 2. Quick Overview: Reorder Alerts, Purchase Orders, Late Closures ──
      let expenseTargets = [];
      try {
        const [reorderRes, poRes, closuresRes, targetsRes] = await Promise.all([
          fetch(`${API_URL}/api/reorder-alerts`).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch(`${API_URL}/api/purchase/orders`).then(r => r.ok ? r.json() : []).catch(() => []),
          fetch(`${API_URL}/user/pendingClosures`).then(r => r.ok ? r.json() : {}).catch(() => ({})),
          fetch(`${API_URL}/api/expense-targets/all`).then(r => r.ok ? r.json() : { targets: [] }).catch(() => ({ targets: [] }))
        ]);

        const reorderList = Array.isArray(reorderRes) ? reorderRes : (reorderRes.data || []);
        setReorderAlerts(reorderList.filter(a => (a.status || "").toLowerCase() === "active").length);

        const poList = Array.isArray(poRes) ? poRes : (poRes.data || []);
        setPurchaseOrders(poList.filter(o => o.status !== "Closed" && o.status !== "Cancelled" && o.status !== "Received").length);

        const closuresList = closuresRes.data || closuresRes || [];
        setLateClosures(Array.isArray(closuresList) ? closuresList.length : 0);
        
        expenseTargets = targetsRes.targets || [];
      } catch (e) { console.error("Quick overview error:", e); }

      // ── 3. Financial Summary — all stores (same logic as IncomeExpenseReport) ──
      const twsResults = await Promise.all(
        ALL_LOC_CODES.map(lc => Promise.all([
          safeFetch(`${TWS_BASE}/GetBookingList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`),
          safeFetch(`${TWS_BASE}/GetRentoutList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`),
          safeFetch(`${TWS_BASE}/GetReturnList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`),
          safeFetch(`${TWS_BASE}/GetDeleteList?LocCode=${lc}&DateFrom=${dateFrom}&DateTo=${dateTo}`),
        ]))
      );

      const withLoc = (rows, lc) => (rows || []).map((item) => ({ ...item, locCode: item.locCode || lc }));
      
      const bookingData = twsResults.flatMap((r, i) => withLoc(r[0]?.dataSet?.data, ALL_LOC_CODES[i]));
      const rentoutData = twsResults.flatMap((r, i) => withLoc(r[1]?.dataSet?.data, ALL_LOC_CODES[i]));
      const returnData = twsResults.flatMap((r, i) => withLoc(r[2]?.dataSet?.data, ALL_LOC_CODES[i]));
      const deleteData = twsResults.flatMap((r, i) => withLoc(r[3]?.dataSet?.data, ALL_LOC_CODES[i]));

      let mongoTxns = [];
      try {
        const mongoRes = await fetch(`${API_URL}/user/Getpayment?DateFrom=${dateFrom}&DateTo=${dateTo}`);
        if (mongoRes.ok) {
          const mData = await mongoRes.json();
          mongoTxns = Array.isArray(mData) ? mData : (mData.data || []);
        }
      } catch (err) { console.error("Mongo fetch error:", err); }

      let iCash = 0, iRbl = 0, iBank = 0, iUpi = 0;
      let retCash = 0, retRbl = 0, retBank = 0, retUpi = 0;
      let eCash = 0, eRbl = 0, eBank = 0, eUpi = 0;

      // Booking -> Income
      bookingData.forEach(item => {
        iCash += Number(item.bookingCashAmount || 0);
        iRbl += Number(item.rblRazorPay || 0);
        iBank += Number(item.bookingBankAmount || 0);
        iUpi += Number(item.bookingUPIAmount || 0);
      });

      // RentOut -> Split into Income (Balance Payable) and Returnable Income (Security)
      rentoutData.forEach(item => {
        const security = Number(item.securityAmount || 0);
        const advance = Number(item.advanceAmount || 0);
        const balancePayable = Number(item.invoiceAmount || 0) - advance;
        
        // Returnable Income (Security received on RentOut)
        if (security > 0 || item.securityAmount) {
          retCash += security;
        }
        // Actual non-returnable Income (Balance Payable)
        iCash += balancePayable;
      });

      // Return -> Security Refund (Not included in top Total Expenses card in IncomeExpenseReport)
      // Cancel -> Expense
      deleteData.forEach(item => {
        const rbl = -Math.abs(Number(item.rblRazorPay || 0));
        eCash += -Math.abs(Number(item.deleteCashAmount || 0));
        eRbl += rbl;
        eBank += rbl !== 0 ? 0 : -Math.abs(Number(item.deleteBankAmount || 0));
        eUpi += rbl !== 0 ? 0 : -Math.abs(Number(item.deleteUPIAmount || 0));
      });

      // Mongo Txns
      mongoTxns.forEach(t => {
        const tp = (t.type || "").toLowerCase();
        const sub = (t.subCategory || "").toLowerCase().trim();
        const cat = (t.category || "").toLowerCase().trim();
        const inv = (t.invoiceNo || "").toUpperCase();
        
        const isShoeOrShirtSale = sub === "shoe sales" || sub === "shirt sales" || sub === "mixed sales"
          || cat === "shoe sales" || cat === "shirt sales" || cat === "mixed sales";
        const isSalesReturn = sub === "shoe sales return" || sub === "shirt sales return" || sub === "mixed sales return"
          || cat === "shoe sales return" || cat === "shirt sales return" || cat === "mixed sales return";
        const isReturnInvoice = inv.startsWith("RTN-") || inv.startsWith("RET-");
        
        if (!isShoeOrShirtSale && !isSalesReturn && !isReturnInvoice && (inv.startsWith("INV-") || inv.startsWith("RTN-") || inv.startsWith("RET-"))) return;

        const isBankToCash = cat === "bank to cash" || sub === "bank to cash" || cat.includes("bank to cash") || sub.includes("bank to cash") || cat.includes("cash to branch") || sub.includes("cash to branch");
        const isCashToBank = !isBankToCash && (cat === "bulk amount transfer" || cat === "cash to bank" || sub === "bulk amount transfer" || sub === "cash to bank" || tp === "money transfer");
        
        const isExpenseCategory = tp === "expense" || EXPENSE_CATS.has(cat);
        const cash = Number(t.cash || 0), rbl = Number(t.rbl || t.rblRazorPay || 0), bank = Number(t.bank || 0), upi = Number(t.upi || 0);

        if (isBankToCash) {
          // Bank to cash
        } else if (isCashToBank) {
          // Cash to bank
        } else if (isReturnInvoice || isExpenseCategory) {
          eCash += cash; eRbl += rbl; eBank += bank; eUpi += upi;
        } else if (tp === "income") {
          iCash += cash; iRbl += rbl; iBank += bank; iUpi += upi;
        }
      });

      setIncTotals({ cash: iCash, rbl: iRbl, bank: iBank, upi: iUpi });
      setRetTotals({ cash: retCash, rbl: retRbl, bank: retBank, upi: retUpi });
      setExpTotals({ cash: Math.abs(eCash), rbl: Math.abs(eRbl), bank: Math.abs(eBank), upi: Math.abs(eUpi) });

      // Calculate Net Difference specifically for Dashboard from top cards
      const incTot = iCash + iRbl + iBank + iUpi;
      const expTot = Math.abs(eCash) + Math.abs(eRbl) + Math.abs(eBank) + Math.abs(eUpi);
      const diffTot = incTot - expTot;
      
      const netCash = iCash - Math.abs(eCash);
      const netRbl = iRbl - Math.abs(eRbl);
      const netBank = iBank - Math.abs(eBank);
      const netUpi = iUpi - Math.abs(eUpi);
      
      setNetTotals({ cash: netCash, rbl: netRbl, bank: netBank, upi: netUpi });

      // ── 4. Per-store chart data (store-only, no depts) ───────────────────────────
      const getShortName = (name) => {
        const map = {
          "G-Edappal": "G-EDP", "G-Edappally": "G-EDY", "G-Kalpetta": "G-KPT",
          "G-Kannur": "G-KNR", "G-Kottakkal": "G-KTL", "G-Kottayam": "G-KTM",
          "G-Manjeri": "G-MNJ", "G-Mg Road": "G-MGR", "G-Palakkad": "G-PKD",
          "G-Perinthalmanna": "G-PMN", "G-Perumbavoor": "G-PBV", "G-Thrissur": "G-TCR",
          "G-Vadakara": "G-VDK", "G-Chavakkad": "G-CVD", "G-Calicut": "G-CLT",
          "SG-Trivandrum": "SG-TVM", "Z-Edappal": "Z-EDP", "Z-Edapally": "Z-EDY",
          "Z-Kottakkal": "Z-KTL", "Z-Perinthalmanna": "Z-PMN"
        };
        return map[name] || name;
      };

      const perStoreData = STORE_LOC_CODES.map(lc => {
        const store = STORE_LIST.find(s => s.locCode === lc);
        const storeName = store?.locName || lc;
        const shortName = getShortName(storeName);

        const idx = ALL_LOC_CODES.indexOf(lc);
        if (idx === -1) return { name: shortName, fullName: storeName, income: 0, expense: 0 };

        const sBk = twsResults[idx][0]?.dataSet?.data || [];
        const sRt = twsResults[idx][1]?.dataSet?.data || [];
        const sDl = twsResults[idx][3]?.dataSet?.data || [];
        const sMgTxns = mongoTxns.filter(t => t.locCode === lc);

        let sInc = 0, sExp = 0;
        sBk.forEach(i => { sInc += Number(i.bookingCashAmount || 0) + Number(i.rblRazorPay || 0) + Number(i.bookingBankAmount || 0) + Number(i.bookingUPIAmount || 0); });
        sRt.forEach(i => {
          const advance = Number(i.advanceAmount || 0);
          const balancePayable = Number(i.invoiceAmount || 0) - advance;
          sInc += balancePayable; 
        });
        sDl.forEach(i => { sExp += Math.abs(Number(i.deleteCashAmount || 0)) + Math.abs(Number(i.rblRazorPay || 0)) + Math.abs(Number(i.deleteBankAmount || 0)) + Math.abs(Number(i.deleteUPIAmount || 0)); });
        sMgTxns.forEach(t => {
          const tp = (t.type || "").toLowerCase(), cat = (t.category || "").toLowerCase().trim();
          const inv = (t.invoiceNo || "").toUpperCase();
          const isExp = tp === "expense" || EXPENSE_CATS.has(cat) || inv.startsWith("RTN-") || inv.startsWith("RET-");
          const amt = Number(t.cash || 0) + Number(t.rbl || t.rblRazorPay || 0) + Number(t.bank || 0) + Number(t.upi || 0);
          if (isExp) sExp += amt;
          else if (tp === "income") sInc += amt;
        });
        
        let sExpLimit = 0;
        expenseTargets.filter(et => et.storeCode === lc).forEach(et => {
          sExpLimit += Number(et.targetAmount || 0);
        });

        return { name: shortName, fullName: storeName, income: Math.abs(sInc), expense: Math.abs(sExp), expenseLimit: sExpLimit };
      });

      setChartData(perStoreData); // Keep in STORE_LIST order so names match bars

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sum = (t) => t.cash + t.rbl + t.bank + t.upi;
  const incTotal = sum(incTotals);
  const retTotal = sum(retTotals);
  const expTotal = sum(expTotals);
  const netTotal = sum(netTotals);

  let displayedDaybooks = [];
  if (daybookFilter === "All") displayedDaybooks = [
      ...pendingStores.map(s => ({ ...s, st: 'not' })), 
      ...closedStores.map(s => ({ ...s, st: 'closed' })),
      ...lateClosedStores.map(s => ({ ...s, st: 'late' }))
  ];
  if (daybookFilter === "Closed") displayedDaybooks = closedStores.map(s => ({ ...s, st: 'closed' }));
  if (daybookFilter === "Not Closed") displayedDaybooks = pendingStores.map(s => ({ ...s, st: 'not' }));
  if (daybookFilter === "Late Closed") displayedDaybooks = lateClosedStores.map(s => ({ ...s, st: 'late' }));

  return (
    <>
      <Header />
      <div className={`transition-all duration-300 p-3 sm:p-6 bg-[#fbfcfd] min-h-screen pb-20 ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>

        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-6 gap-4">
          <div>
            <h1 className="text-[26px] font-semibold text-gray-900 tracking-tight leading-tight">Dashboard</h1>
            <p className="text-[14px] text-gray-400 mt-1">Overview of your stores and financial metrics</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            {/* From Date */}
            <div className="flex flex-col">
              <p className="text-[12px] text-gray-400 mb-2">From Date</p>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 h-[42px]" style={{ minWidth: '155px' }}>
                <input
                  id="from-date-picker"
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full text-[14px] font-medium text-gray-800 bg-transparent outline-none cursor-text"
                />
              </div>
            </div>
            {/* To Date */}
            <div className="flex flex-col">
              <p className="text-[12px] text-gray-400 mb-2">To Date</p>
              <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 h-[42px]" style={{ minWidth: '155px' }}>
                <input
                  id="to-date-picker"
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full text-[14px] font-medium text-gray-800 bg-transparent outline-none cursor-text"
                />
              </div>
            </div>
            <div>
              <button
                onClick={fetchDashboardData}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '42px', height: '42px', padding: 0, margin: 0,
                  backgroundColor: '#a855f7', border: 'none', borderRadius: '10px',
                  cursor: 'pointer', flexShrink: 0
                }}
              >
                <RefreshCw size={18} color="white" className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#a855f7]"></div>
          </div>
        ) : (
          <div className="flex flex-col-reverse lg:flex-row gap-5 items-stretch">

            {/* Left Column */}
            <div className="flex-1 flex flex-col space-y-5 min-w-0">

              {/* Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative" style={{ height: '420px' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 z-10">
                  <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">Store Financial Ranking</h3>
                  <div className="flex p-1 bg-[#f9fafb] rounded-full border border-gray-100 text-[12px] font-medium">
                    <button onClick={() => setChartFilter("All")} className={`px-4 py-1.5 rounded-full transition-all ${chartFilter === "All" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>All</button>
                    <button onClick={() => setChartFilter("Income")} className={`flex items-center px-4 py-1.5 rounded-full transition-all ${chartFilter === "Income" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#dfbbfd] mr-1.5"></span> Income
                    </button>
                    <button onClick={() => setChartFilter("Expense")} className={`flex items-center px-4 py-1.5 rounded-full transition-all ${chartFilter === "Expense" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#6a1e9c] mr-1.5"></span> Expense
                    </button>
                  </div>
                </div>

                {/* Horizontal Dashed Lines positioned absolutely behind chart to ensure they go edge to edge */}
                <div className="absolute left-4 right-4 sm:left-6 sm:right-6 top-[85px] bottom-[65px] flex flex-col justify-between pointer-events-none">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="w-full border-t border-dashed border-gray-200 h-0"></div>
                  ))}
                </div>

                <div className="flex-1 w-full overflow-x-auto relative pb-3 custom-horizontal-scrollbar z-10">
                  <div className="min-w-[1000px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={chartData.map(d => {
                          if (chartFilter === "Income") return { name: d.name, fullName: d.fullName, income: d.income };
                          if (chartFilter === "Expense") return { name: d.name, fullName: d.fullName, expense: d.expense, expenseLimit: d.expenseLimit };
                          return d;
                        })} 
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }} 
                        barGap={4}
                      >
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }} dy={10} interval={0} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f3f4f6', opacity: 0.4 }} />
                        {(chartFilter === "All" || chartFilter === "Income") && (
                          <Bar dataKey="income" fill="#dfbbfd" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        )}
                        {(chartFilter === "All" || chartFilter === "Expense") && (
                          <Bar dataKey="expense" fill="#6a1e9c" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {chartFilter === "Expense" && chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.expenseLimit > 0 && entry.expense > entry.expenseLimit ? "#ef4444" : "#6a1e9c"} 
                              />
                            ))}
                          </Bar>
                        )}
                        {chartFilter === "Expense" && (
                          <Bar dataKey="expenseLimit" name="Expense Limit" fill="#fb923c" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Row inside left col */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1">

                {/* Daybook Status */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[360px]">
                  <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 xl:gap-0 mb-6">
                    <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">Daybook Status</h3>
                    <div className="flex space-x-1 bg-[#f9fafb] p-1 rounded-full border border-gray-100 text-[12px] font-medium">
                      <button onClick={() => setDaybookFilter("All")} className={`px-4 py-1.5 rounded-full transition-all ${daybookFilter === "All" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>All</button>
                      <button onClick={() => setDaybookFilter("Closed")} className={`px-4 py-1.5 rounded-full transition-all ${daybookFilter === "Closed" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>Closed</button>
                      <button onClick={() => setDaybookFilter("Not Closed")} className={`px-4 py-1.5 rounded-full transition-all ${daybookFilter === "Not Closed" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>Not</button>
                      <button onClick={() => setDaybookFilter("Late Closed")} className={`px-4 py-1.5 rounded-full transition-all ${daybookFilter === "Late Closed" ? "bg-white shadow-sm font-bold text-gray-800" : "text-gray-400 hover:text-gray-600"}`}>Late</button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-vertical-scrollbar">
                    {displayedDaybooks.map((s, i) => {
                      const isClosed = s.st === 'closed';
                      const isLate = s.st === 'late';
                      const bgClass = isClosed ? 'bg-[#f0fdf4]' : (isLate ? 'bg-[#fffbeb]' : 'bg-[#fff1f2]');
                      const iconColor = isClosed ? 'text-[#16a34a]' : (isLate ? 'text-[#d97706]' : 'text-[#ef4444]');
                      const textLabel = isClosed ? 'Closed' : (isLate ? 'Late Closed' : 'Not Closed');
                      
                      return (
                        <div key={`${s.locCode}-${i}`} className={`flex justify-between items-center py-2 px-3 rounded-xl ${bgClass}`}>
                          <div className="flex items-center gap-3">
                            <div className={iconColor}>
                              <FileText size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-[14px] font-medium text-gray-800">{s.locName}</span>
                          </div>
                          <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md ${iconColor}`}>
                            {textLabel}
                          </span>
                        </div>
                      );
                    })}
                    {displayedDaybooks.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No stores found.</p>}
                  </div>
                </div>

                {/* Quick Overview */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[360px]">
                  <h3 className="text-[16px] font-bold text-gray-900 tracking-tight mb-5">Quick Overview</h3>
                  <div className="flex flex-col justify-between h-full space-y-1">

                    {/* Reorder Alert */}
                    <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                      <div>
                        <h4 className={`text-[28px] leading-none font-bold tracking-tight mb-1 ${reorderAlerts > 0 ? 'text-[#ef4444]' : 'text-gray-900'}`}>{String(reorderAlerts).padStart(2, '0')}</h4>
                        <p className="text-[13px] font-medium text-gray-500">Reorder Alert</p>
                      </div>
                      <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md ${reorderAlerts > 0 ? 'bg-[#fee2e2] text-[#ef4444]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>
                        {reorderAlerts > 0 ? 'Action Needed' : 'All Good'}
                      </span>
                    </div>

                    {/* Purchase Order */}
                    <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                      <div>
                        <h4 className="text-[28px] leading-none font-bold tracking-tight mb-1 text-gray-900">{String(purchaseOrders).padStart(2, '0')}</h4>
                        <p className="text-[13px] font-medium text-gray-500">Purchase Order</p>
                      </div>
                      <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md ${purchaseOrders > 0 ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-gray-100 text-gray-600'}`}>
                        {purchaseOrders > 0 ? 'Active' : 'None'}
                      </span>
                    </div>

                    {/* Late Closure */}
                    <div className="flex justify-between items-center pb-2">
                      <div>
                        <h4 className={`text-[28px] leading-none font-bold tracking-tight mb-1 ${lateClosures > 0 ? 'text-[#ef4444]' : 'text-gray-900'}`}>{lateClosures}</h4>
                        <p className="text-[13px] font-medium text-gray-500">Late Closure</p>
                      </div>
                      <span className={`text-[11px] font-bold px-3 py-1.5 rounded-md ${lateClosures > 0 ? 'bg-[#fee2e2] text-[#ef4444]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>
                        {lateClosures > 0 ? 'Action Needed' : 'All Good'}
                      </span>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Right Column (Summary Cards) */}
            <div className="w-full lg:w-[320px] xl:w-[340px] shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-4">

              {/* Total Income */}
              <div className="bg-white p-5 px-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[15px] font-bold text-[#1f2937]">Total Income</p>
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#d1fae5] text-[#10b981] flex items-center justify-center shrink-0">
                    <HandCoins size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#111827] tracking-tight mt-1 mb-5">{fmt(incTotal)}</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="pt-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Cash :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(incTotals.cash)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Card/Bank :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(incTotals.bank + incTotals.rbl)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">UPI :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(incTotals.upi)}</strong>
                  </div>
                </div>
              </div>

              {/* Returnable Income */}
              <div className="bg-white p-5 px-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[15px] font-bold text-[#1f2937]">Returnable Income</p>
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#ffedd5] text-[#f97316] flex items-center justify-center shrink-0">
                    <HandCoins size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#111827] tracking-tight mt-1 mb-5">{fmt(retTotal)}</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="pt-4">
                  <p className="text-[13px] font-medium text-gray-500">Total returnable income held</p>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="bg-white p-5 px-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[15px] font-bold text-[#1f2937]">Total Expenses</p>
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#ffe4e6] text-[#e11d48] flex items-center justify-center shrink-0">
                    <HandCoins size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#111827] tracking-tight mt-1 mb-5">{fmt(Math.abs(expTotal))}</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="pt-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Cash :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(Math.abs(expTotals.cash))}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Card/Bank :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(Math.abs(expTotals.bank + expTotals.rbl))}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">UPI :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(Math.abs(expTotals.upi))}</strong>
                  </div>
                </div>
              </div>

              {/* Net Difference */}
              <div className="bg-white p-5 px-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-[15px] font-bold text-[#1f2937]">Net Difference</p>
                  <div className="w-[34px] h-[34px] rounded-[10px] bg-[#e0e7ff] text-[#6366f1] flex items-center justify-center shrink-0">
                    <HandCoins size={18} strokeWidth={2.5} />
                  </div>
                </div>
                <h3 className="text-[28px] font-extrabold text-[#111827] tracking-tight mt-1 mb-5">{fmt(netTotal)}</h3>
                <div className="w-full border-t border-gray-100"></div>
                <div className="pt-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Cash :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(netTotals.cash)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">Card/Bank :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(netTotals.bank + netTotals.rbl)}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-medium text-gray-500">UPI :</span>
                    <strong className="text-[#1f2937] text-[13px] font-bold">{fmt(netTotals.upi)}</strong>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Home;

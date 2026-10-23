import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    FileText,
    ChevronDown,
    ShoppingBag,
    LineChart,
    DollarSign,
    FolderClosed,
    Notebook,
    Store,
    Package,
    Box,
    SlidersHorizontal,
    ArrowLeftRight,
    List,
    Layers,
    ShoppingCart,
    ClipboardList,
    FileText as FileTextIcon,
    Truck,
    RotateCcw,
    ReceiptText,
    Users,
    PackageCheck,
    AlertTriangle,
    ShoppingBasket,
    UserPlus,
    UserCog,
    KeyRound,
    Menu,
    ChevronLeft,
    ArrowDownRight,
    ArrowUpRight,
    Wallet
} from "lucide-react";
import salesInventoryAccessConfig from "../config/salesInventoryAccess.json";
import baseUrl from "../api/api.js";
import rootfinLogo from "../assets/rootfin-logo.png";
import { getActiveStores, fetchActiveStores } from "../utils/storeService.js";

const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7001";

const formatLocationName = (name) => {
    if (!name) return name;
    let formatted = name.trim();
    if (/^warehouse$/i.test(formatted)) return "Warehouse";
    if (/^brides\s*berry$/i.test(formatted) || /^bridesberry$/i.test(formatted)) return "Brides Berry";
    formatted = formatted.replace(/^([A-Z])([A-Z][a-z])/g, '$1 $2');
    formatted = formatted.replace(/^([A-Z])([a-z])/g, '$1 $2');
    return formatted;
};

const Nav = () => {
    const location = useLocation();
    const currentuser = JSON.parse(localStorage.getItem("rootfinuser")) || {};

    const userEmail = currentuser?.email?.toLowerCase() || "";
    const userLocCode = (currentuser?.locCode || "").toString().trim();
    const isAdmin = currentuser?.power === 'admin';
    const isSuperAdmin = (currentuser?.role || "").toLowerCase() === "superadmin";
    const isAdminOrSuperAdmin = isAdmin || isSuperAdmin;
    const isClusterManager = (currentuser?.role || "").toLowerCase() === "cluster_manager";
    const isFinancialHead = (currentuser?.role || "").toLowerCase() === "financial_head";
    const isWarehouse = currentuser?.power === 'warehouse' || userLocCode === '858' || userLocCode === '103';
    const isBridesBerry = userLocCode === '155' || userEmail.includes('bridesberry') || (currentuser?.username || "").toLowerCase().includes('bridesberry');

    const isInAllowedList = (salesInventoryAccessConfig?.allowedEmails || [])
        .map(email => email.toLowerCase())
        .includes(userEmail);
    const hasSalesInventoryAccess = isAdmin || isInAllowedList || isBridesBerry;

    const activePath = location.pathname;

    const [isHovered, setIsHovered] = useState(false);
    const isOpen = isHovered;

    const [allLocations, setAllLocations] = useState(() => getActiveStores());
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLocationMenu, setShowLocationMenu] = useState(false);
    const userMenuRef = useRef(null);
    const locationMenuRef = useRef(null);

    const getInitialUser = () => {
        try {
            return JSON.parse(localStorage.getItem("rootfinuser")) || {};
        } catch {
            return {};
        }
    };
    const [currentUser, setCurrentUser] = useState(getInitialUser());

    useEffect(() => {
        const loadStores = async () => {
            try {
                const stores = await fetchActiveStores();
                if (stores && Array.isArray(stores) && stores.length > 0) {
                    setAllLocations(stores);
                }
            } catch (error) {
                console.error("Error fetching stores in Nav:", error);
            }
        };
        loadStores();
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (locationMenuRef.current && !locationMenuRef.current.contains(event.target)) {
                setShowLocationMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const handleToggleSidebar = () => {
            setIsHovered(prev => !prev);
        };
        document.addEventListener("toggle-sidebar", handleToggleSidebar);
        return () => document.removeEventListener("toggle-sidebar", handleToggleSidebar);
    }, []);

    const handleChangeLocation = (e) => {
        const selectedCode = e.target.value;
        const selectedItem = allLocations.find(item => item.locCode === selectedCode);
        if (selectedItem) {
            const updatedUser = {
                ...currentUser,
                locCode: selectedItem.locCode,
                username: selectedItem.locName,
            };
            localStorage.setItem("rootfinuser", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            window.location.reload();
        }
    };

    const handleLogout = () => {
        try {
            localStorage.removeItem("rootfinuser");
            window.location.reload();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const locationDisplayName =
        allLocations.find(loc => loc.locCode === currentUser?.locCode)?.locName ||
        currentUser?.storeName ||
        currentUser?.username ||
        currentUser?.locName ||
        "";

    // Determine user display name for the profile tab
    const getDisplayName = () => {
        if (currentUser?.power === "admin" || currentUser?.role === "admin" || currentUser?.role === "superadmin") {
            return "Admin";
        }
        if (isClusterManager) {
            return "Cluster Manager";
        }
        if (isFinancialHead) {
            return "Financial Head";
        }
        const candidateName = currentUser?.name || currentUser?.username;
        const isStoreName = allLocations.some(
            loc => loc.locName?.toLowerCase().trim() === candidateName?.toLowerCase().trim()
        );
        if (candidateName && !isStoreName) {
            return candidateName;
        }
        return "Staff User";
    };

    const displayName = getDisplayName();

    useEffect(() => {
        document.body.classList.add("sidebar-closed");
        document.body.classList.remove("sidebar-open");
        window.dispatchEvent(new CustomEvent("sidebar-changed", { detail: { isOpen: false } }));
    }, []);

    const getInitialSection = useMemo(() => {
        if (activePath === "/reports/sales" || activePath === "/reports/sales-by-invoice" || activePath === "/reports/inventory" || activePath === "/reports/income-expense" || activePath === "/securityReport" || activePath === "/Revenuereport" || activePath === "/BookingReport" || activePath === "/RentOutReport" || activePath === "/reports/sales-by-group") {
            return "reports";
        }
        if (activePath.startsWith("/inventory") ||
            activePath.startsWith("/shoe-sales/items") ||
            activePath.startsWith("/shoe-sales/item-groups") ||
            activePath.startsWith("/shoe-sales/inactive")) {
            return "inventory";
        }
        if (activePath.startsWith("/sales")) {
            return "sales";
        }
        if (activePath.startsWith("/purchase")) {
            return "purchase";
        }
        if (activePath.startsWith("/manage-users")) {
            return "manageUsers";
        }
        return null;
    }, [activePath]);

    const [openSection, setOpenSection] = useState(getInitialSection);

    useEffect(() => {
        setOpenSection(getInitialSection);
    }, [getInitialSection]);

    const isReportsOpen = openSection === "reports";
    const isInventoryOpen = openSection === "inventory";
    const isSalesOpen = openSection === "sales";
    const isPurchaseOpen = openSection === "purchase";
    const isManageUsersOpen = openSection === "manageUsers";

    const inventoryLinks = [
        { to: "/shoe-sales/items", label: "Items", Icon: List },
        // Only show these for admin and warehouse users
        ...(currentuser?.power === 'admin' || currentuser?.power === 'warehouse' || isBridesBerry ? [
            { to: "/shoe-sales/item-groups", label: "Item Groups", Icon: Layers },
            { to: "/inventory/adjustments", label: "Inventory Adjustments", Icon: SlidersHorizontal },
        ] : []),
        { to: "/inventory/transfer-orders", label: "Transfer Orders", Icon: ArrowLeftRight },
        { to: "/inventory/store-orders", label: "Store Orders", Icon: ShoppingBasket },
        // Only show these for admin and warehouse users
        ...(currentuser?.power === 'admin' || currentuser?.power === 'warehouse' || isBridesBerry ? [
            { to: "/inventory/reorder-alerts", label: "Reorder Alerts", Icon: AlertTriangle },
            { to: "/shoe-sales/inactive", label: "Inactive", Icon: FolderClosed }
        ] : [])
    ];
    const salesLinks = [
        { to: "/sales/invoices", label: "Invoices", Icon: FileTextIcon },
        { to: "/sales/returns", label: "Invoice Return", Icon: RotateCcw }
    ];
    const isInventoryActive = inventoryLinks.some((link) => link.to === activePath) ||
        activePath.startsWith("/shoe-sales/items") ||
        ((currentuser?.power === 'admin' || currentuser?.power === 'warehouse' || isBridesBerry) && activePath.startsWith("/shoe-sales/item-groups")) ||
        ((currentuser?.power === 'admin' || currentuser?.power === 'warehouse' || isBridesBerry) && activePath.startsWith("/shoe-sales/inactive")) ||
        activePath.startsWith("/inventory/store-orders");
    const isSalesActive = salesLinks.some((link) => link.to === activePath);
    const purchaseLinks = [
        { to: "/purchase/orders", label: "Purchase Orders", Icon: ClipboardList },
        { to: "/purchase/receives", label: "Purchase Receives", Icon: PackageCheck },
        { to: "/purchase/bills", label: "Bills", Icon: ReceiptText },
        { to: "/purchase/vendor-credits", label: "Purchase Return", Icon: ReceiptText },
        { to: "/purchase/vendors", label: "Vendors", Icon: Users },
    ];
    const isPurchaseActive = purchaseLinks.some((link) => link.to === activePath);

    const manageUsersLinks = [
        { to: "/manage-users/add-store", label: "Add New Store", Icon: Store },
        { to: "/manage-users/add-user", label: "Add New User", Icon: UserPlus },
        { to: "/manage-users/existing-users", label: "Existing Users", Icon: UserCog },
        { to: "/manage-users/reset-password", label: "Reset Password", Icon: KeyRound },
    ];
    const isManageUsersActive = manageUsersLinks.some((link) => link.to === activePath);

    const isReportsActive = [
        "/securityReport",
        "/Revenuereport",
        "/BookingReport",
        "/RentOutReport",
        "/reports/income-expense",
        "/reports/sales-by-group",
        ...(hasSalesInventoryAccess ? ["/reports/sales", "/reports/sales-by-invoice", "/reports/inventory"] : [])
    ].includes(activePath);

    const groupButtonClasses = (isOpen, hasActiveChild) => {
        return `sidebar-button flex items-center justify-between w-full px-5 py-3 text-[14px] font-medium rounded-full transition-all ${hasActiveChild
            ? "bg-[#a855f7] text-white font-semibold shadow-sm"
            : "text-zinc-400 hover:text-white hover:bg-[#27272a]/60"
        }`;
    };

    const subLinkClasses = (path) =>
        `block w-full pl-6 pr-4 py-2.5 text-[13px] whitespace-nowrap truncate transition-colors ${activePath === path
            ? "bg-[#a855f7] text-white font-semibold"
            : "text-zinc-400 font-medium hover:text-white hover:bg-[#27272a]/40"
        }`;

    const singleLinkClasses = (path) => {
        const isActive = activePath === path || 
            (path === "/" && activePath === "/dashboard") ||
            (path === "/record-expense" && (activePath === "/record-expense" || activePath === "/direct-expenses" || activePath === "/indirect-expenses"));
        return `flex items-center gap-3.5 px-5 py-3 text-[14px] font-medium whitespace-nowrap truncate transition-all rounded-full ${isActive
            ? "bg-[#a855f7] text-white font-semibold shadow-sm"
            : "text-zinc-400 hover:text-white hover:bg-[#27272a]/60"
        }`;
    };

    const isInvoiceCreatePage = activePath === "/sales/invoices/new" || activePath.startsWith("/sales/invoices/edit");
    const sidebarWidth = isInvoiceCreatePage ? "w-56" : "w-64";
    const sidebarTranslate = isInvoiceCreatePage ? "-translate-x-56" : "-translate-x-64";

    return (
        <div className={`flex ${location.pathname === "/login" ? "hidden" : "block"}`}>
            {/* Invisible hover strip on left edge to trigger sidebar on mouse hover or tap */}
            <div
                onMouseEnter={() => setIsHovered(true)}
                onClick={() => setIsHovered(!isHovered)}
                className="fixed top-0 left-0 w-8 md:w-6 h-full z-[99990] cursor-pointer no-print"
                title="Tap or Hover to view menu"
            />

            {/* Mobile Backdrop overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[99998] lg:hidden"
                    onClick={() => setIsHovered(false)}
                />
            )}

            {/* Sidebar */}
            <div
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`fixed top-0 left-0 h-full ${sidebarWidth} z-[99999] transform flex flex-col justify-between bg-[#18181b] text-white transition-transform duration-300 shadow-2xl ${isOpen ? "translate-x-0" : sidebarTranslate
                    }`}
            >
                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="pl-7 pr-5 pt-6 pb-15 flex items-center justify-between">
                        <Link to="/" className="flex items-center">
                            <img
                                src={rootfinLogo}
                                alt="RootFin"
                                className="h-6 w-auto object-contain select-none"
                            />
                        </Link>
                    </div>
                    <nav className="space-y-5 px-3 overflow-y-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                        {/* ── CLUSTER MANAGER: only Financial Summary + Reports ── */}
                        {isClusterManager ? (
                            <>
                                <Link to="/datewisedaybook" className={singleLinkClasses("/datewisedaybook")}>
                                    <FileTextIcon size={18} className="shrink-0" />
                                    <span>Financial Summary</span>
                                </Link>

                                <div>
                                    <button
                                        onClick={() => setOpenSection(isReportsOpen ? null : "reports")}
                                        className={groupButtonClasses(isReportsOpen, isReportsActive)}
                                    >
                                        <div className="flex w-full items-center gap-3.5">
                                            <LineChart size={18} className="shrink-0" />
                                            <span className="flex-1 text-left whitespace-nowrap truncate">Reports</span>
                                            <ChevronDown size={16} className={`shrink-0 transition-transform ${isReportsOpen ? "rotate-180" : "rotate-0"} ${isReportsActive ? "text-white" : "text-zinc-400 group-hover:text-white"}`} />
                                        </div>
                                    </button>
                                    {isReportsOpen && (
                                        <div className="mt-1 space-y-0.5 border-l border-[#27272a] ml-[25px]">
                                            <Link to="/BookingReport" className={subLinkClasses('/BookingReport')}><span>Booking Report</span></Link>
                                            <Link to="/RentOutReport" className={subLinkClasses('/RentOutReport')}><span>Rent Out Report</span></Link>
                                            <Link to="/securityReport" className={subLinkClasses('/securityReport')}><span>Security Report</span></Link>
                                            <Link to="/Revenuereport" className={subLinkClasses('/Revenuereport')}><span>Revenue Report</span></Link>
                                            <Link to="/reports/sales-by-invoice" className={subLinkClasses('/reports/sales-by-invoice')}><span>Sales by Invoice</span></Link>
                                            <Link to="/reports/sales" className={subLinkClasses('/reports/sales')}><span>Sales Report</span></Link>
                                            <Link to="/reports/sales-by-group" className={subLinkClasses('/reports/sales-by-group')}><span>Sales by Group</span></Link>
                                            <Link to="/reports/inventory" className={subLinkClasses('/reports/inventory')}><span>Inventory Report</span></Link>
                                            <Link to="/reports/income-expense" className={subLinkClasses('/reports/income-expense')}><span>Income &amp; Expense</span></Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : isFinancialHead ? (
                            <>
                                {/* Day Book */}
                                <Link to="/daybook" className={singleLinkClasses("/daybook")}>
                                    <FileText size={18} className="shrink-0" />
                                    <span>Day Book</span>
                                </Link>

                                {/* Financial Summary */}
                                <Link to="/datewisedaybook" className={singleLinkClasses("/datewisedaybook")}>
                                    <FileTextIcon size={18} className="shrink-0" />
                                    <span>Financial Summary</span>
                                </Link>

                                {/* Record Expense */}
                                <Link to="/record-expense" className={singleLinkClasses("/record-expense")}>
                                    <Wallet size={18} className="shrink-0" />
                                    <span>Record Expense</span>
                                </Link>

                                {/* Reports */}
                                <div>
                                    <button
                                        onClick={() => setOpenSection(isReportsOpen ? null : "reports")}
                                        className={groupButtonClasses(isReportsOpen, isReportsActive)}
                                    >
                                        <div className="flex w-full items-center gap-3.5">
                                            <LineChart size={18} className="shrink-0" />
                                            <span className="flex-1 text-left whitespace-nowrap truncate">Reports</span>
                                            <ChevronDown size={16} className={`shrink-0 transition-transform ${isReportsOpen ? "rotate-180" : "rotate-0"} ${isReportsActive ? "text-white" : "text-zinc-400 group-hover:text-white"}`} />
                                        </div>
                                    </button>
                                    {isReportsOpen && (
                                        <div className="mt-1 space-y-0.5 border-l border-[#27272a] ml-[25px]">
                                            <Link to="/BookingReport" className={subLinkClasses('/BookingReport')}><span>Booking Report</span></Link>
                                            <Link to="/RentOutReport" className={subLinkClasses('/RentOutReport')}><span>Rent Out Report</span></Link>
                                            <Link to="/securityReport" className={subLinkClasses('/securityReport')}><span>Security Report</span></Link>
                                            <Link to="/Revenuereport" className={subLinkClasses('/Revenuereport')}><span>Revenue Report</span></Link>
                                            <Link to="/reports/sales-by-invoice" className={subLinkClasses('/reports/sales-by-invoice')}><span>Sales by Invoice</span></Link>
                                            <Link to="/reports/sales" className={subLinkClasses('/reports/sales')}><span>Sales Report</span></Link>
                                            <Link to="/reports/sales-by-group" className={subLinkClasses('/reports/sales-by-group')}><span>Sales by Group</span></Link>
                                            <Link to="/reports/inventory" className={subLinkClasses('/reports/inventory')}><span>Inventory Report</span></Link>
                                            <Link to="/reports/income-expense" className={subLinkClasses('/reports/income-expense')}><span>Income &amp; Expense</span></Link>
                                        </div>
                                    )}
                                </div>

                                {/* Income & Expenses */}
                                <Link to="/income" className={singleLinkClasses("/income")}><DollarSign size={18} className="shrink-0" /><span>Income</span></Link>
                                <Link to="/expenses" className={singleLinkClasses("/expenses")}><DollarSign size={18} className="shrink-0" /><span>Expenses</span></Link>
                            </>
                        ) : (
                            <>
                                {/* Dashboard - Only for Admin / Super Admin */}
                                {isAdminOrSuperAdmin && (
                                    <Link to="/" className={singleLinkClasses("/")}>
                                        <LineChart size={18} className="shrink-0" />
                                        <span>Dashboard</span>
                                    </Link>
                                )}

                                {/* Day Book - Standalone */}
                                <Link to="/daybook" className={singleLinkClasses("/daybook")}>
                                    <FileText size={18} className="shrink-0" />
                                    <span>Day Book</span>
                                </Link>

                                {/* Financial Summary - Standalone */}
                                <Link to="/datewisedaybook" className={singleLinkClasses("/datewisedaybook")}>
                                    <FileTextIcon size={18} className="shrink-0" />
                                    <span>Financial Summary</span>
                                </Link>

                                {/* Sales */}
                                {hasSalesInventoryAccess && (
                                    <div>
                                        <button onClick={() => setOpenSection(isSalesOpen ? null : "sales")} className={groupButtonClasses(isSalesOpen, isSalesActive)}>
                                            <div className="flex w-full items-center gap-3.5">
                                                <ShoppingCart size={18} className="shrink-0" />
                                                <span className="flex-1 text-left whitespace-nowrap truncate">Sales</span>
                                                <ChevronDown size={16} className={`shrink-0 transition-transform ${isSalesOpen ? "rotate-180" : "rotate-0"} ${isSalesActive ? "text-white" : "text-zinc-400 group-hover:text-white"}`} />
                                            </div>
                                        </button>
                                        {isSalesOpen && (
                                            <div className="mt-1 space-y-0.5 border-l border-[#27272a] ml-[25px]">
                                                {salesLinks.map(({ to, label }) => (
                                                    <Link key={to} to={to} className={subLinkClasses(to)}><span>{label}</span></Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Inventory */}
                                {hasSalesInventoryAccess && (
                                    <div>
                                        <button onClick={() => setOpenSection(isInventoryOpen ? null : "inventory")} className={groupButtonClasses(isInventoryOpen, isInventoryActive)}>
                                            <div className="flex w-full items-center gap-3.5">
                                                <Box size={18} className="shrink-0" />
                                                <span className="flex-1 text-left whitespace-nowrap truncate">Inventory</span>
                                                <ChevronDown size={16} className={`shrink-0 transition-transform ${isInventoryOpen ? "rotate-180" : "rotate-0"} ${isInventoryActive ? "text-white" : "text-zinc-400 group-hover:text-white"}`} />
                                            </div>
                                        </button>
                                        {isInventoryOpen && (
                                            <div className="mt-1 space-y-0.5 border-l border-[#27272a] ml-[25px]">
                                                {inventoryLinks.map(({ to, label }) => (
                                                    <Link key={to} to={to} className={subLinkClasses(to)}><span>{label}</span></Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Purchase */}
                                {(currentuser?.power === 'admin' || currentuser?.power === 'warehouse' || isBridesBerry) && (
                                    <div>
                                        <button onClick={() => setOpenSection(isPurchaseOpen ? null : "purchase")} className={groupButtonClasses(isPurchaseOpen, isPurchaseActive)}>
                                            <div className="flex w-full items-center gap-3.5">
                                                <Truck size={18} className="shrink-0" />
                                                <span className="flex-1 text-left whitespace-nowrap truncate">Purchase</span>
                                                <ChevronDown size={16} className={`shrink-0 transition-transform ${isPurchaseOpen ? "rotate-180" : "rotate-0"} ${isPurchaseActive ? "text-white" : "text-zinc-400 group-hover:text-white"}`} />
                                            </div>
                                        </button>
                                        {isPurchaseOpen && (
                                            <div className="mt-1 space-y-0.5 border-l border-[#27272a] ml-[25px]">
                                                {purchaseLinks.map(({ to, label }) => (
                                                    <Link key={to} to={to} className={subLinkClasses(to)}><span>{label}</span></Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Reports */}
                                <div>
                                    <button onClick={() => setOpenSection(isReportsOpen ? null : "reports")} className={groupButtonClasses(isReportsOpen, isReportsActive)}>
                                        <div className="flex w-full items-center gap-3.5">
                                            <LineChart size={18} className="shrink-0" />
                                            <span className="flex-1 text-left whitespace-nowrap truncate">Reports</span>
                                            <ChevronDown size={16} className={`shrink-0 transition-transform ${isReportsOpen ? "rotate-180" : "rotate-0"} ${isReportsActive ? "text-white" : "text-zinc-400 group-hover:text-white"}`} />
                                        </div>
                                    </button>
                                    {isReportsOpen && (
                                        <div className="mt-1 space-y-0.5 border-l border-[#27272a] ml-[25px]">
                                            <Link to="/BookingReport" className={subLinkClasses('/BookingReport')}><span>Booking Report</span></Link>
                                            <Link to="/RentOutReport" className={subLinkClasses('/RentOutReport')}><span>Rent Out Report</span></Link>
                                            <Link to="/securityReport" className={subLinkClasses('/securityReport')}><span>Security Report</span></Link>
                                            <Link to="/Revenuereport" className={subLinkClasses('/Revenuereport')}><span>Revenue Report</span></Link>
                                            {hasSalesInventoryAccess && (
                                                <>
                                                    <Link to="/reports/sales-by-invoice" className={subLinkClasses('/reports/sales-by-invoice')}><span>Sales by Invoice</span></Link>
                                                    <Link to="/reports/sales" className={subLinkClasses('/reports/sales')}><span>Sales Report</span></Link>
                                                    <Link to="/reports/sales-by-group" className={subLinkClasses('/reports/sales-by-group')}><span>Sales by Group</span></Link>
                                                    <Link to="/reports/inventory" className={subLinkClasses('/reports/inventory')}><span>Inventory Report</span></Link>
                                                </>
                                            )}
                                            <Link to="/reports/income-expense" className={subLinkClasses('/reports/income-expense')}><span>Income &amp; Expense</span></Link>
                                        </div>
                                    )}
                                </div>

                                {/* Income & Expenses */}
                                <Link to="/income" className={singleLinkClasses("/income")}><DollarSign size={18} className="shrink-0" /><span>Income</span></Link>
                                <Link to="/record-expense" className={singleLinkClasses("/record-expense")}><Wallet size={18} className="shrink-0" /><span>Record Expense</span></Link>
                                <Link to="/expenses" className={singleLinkClasses("/expenses")}><DollarSign size={18} className="shrink-0" /><span>All Expenses</span></Link>

                                {/* Admin only */}
                                {(currentuser?.power === 'admin' || currentuser?.locCode === '102') && (
                                    <>
                                        {currentuser?.power === 'admin' && (
                                            <Link to="/CloseReport" className={singleLinkClasses("/CloseReport")}><FolderClosed size={18} className="shrink-0" /><span>Close Report</span></Link>
                                        )}
                                        {(currentuser?.power === 'admin' || currentuser?.role === 'superadmin') && (
                                            <Link to="/AdminClose" className={singleLinkClasses("/AdminClose")}><Notebook size={18} className="shrink-0" /><span>Admin Close</span></Link>
                                        )}
                                        
                                        {(currentuser?.power === 'admin' || currentuser?.role === 'superadmin') && (
                                            <Link to="/PendingDaybookClosures" className={singleLinkClasses("/PendingDaybookClosures")}><Notebook size={18} className="shrink-0" /><span>Late Closures</span></Link>
                                        )}

                                        {/* Manage Users — admin and super admin */}
                                        {(currentuser?.power === 'admin' || currentuser?.role === 'superadmin') && (
                                            <div>
                                                <button onClick={() => setOpenSection(isManageUsersOpen ? null : "manageUsers")} className={groupButtonClasses(isManageUsersOpen, isManageUsersActive)}>
                                                    <div className="flex w-full items-center gap-3.5">
                                                        <Users size={18} className="shrink-0" />
                                                        <span className="flex-1 text-left whitespace-nowrap truncate">Manage Users</span>
                                                        <ChevronDown size={16} className={`shrink-0 transition-transform ${isManageUsersOpen ? "rotate-180" : "rotate-0"} ${isManageUsersActive ? "text-white" : "text-zinc-400 group-hover:text-white"}`} />
                                                    </div>
                                                </button>
                                                {isManageUsersOpen && (
                                                    <div className="mt-1 space-y-0.5 border-l border-[#27272a] ml-[25px]">
                                                        {manageUsersLinks.map(({ to, label }) => (
                                                            <Link key={to} to={to} className={subLinkClasses(to)}><span>{label}</span></Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </nav>
                </div>

                {/* Fixed Bottom Section: User Profile Tab */}
                <div className="p-4 bg-[#18181b]">
                    <div className="relative" ref={userMenuRef}>
                        {/* User Menu Popover */}
                        {showUserMenu && (
                            <div
                                className="absolute bottom-full left-0 right-0 mb-2 bg-[#18181b] border border-zinc-700 shadow-2xl rounded-2xl p-4 text-white z-50 space-y-3"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="pb-3 border-b border-zinc-800 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#a855f7] to-[#ec4899] flex items-center justify-center shrink-0 shadow-lg text-white font-bold text-lg">
                                        {displayName?.charAt(0)?.toUpperCase() || "U"}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-bold text-white truncate">
                                            {displayName}
                                        </span>
                                        <span className="text-[11px] text-purple-400 capitalize font-medium">
                                            {currentUser?.power === 'admin' ? 'Administrator' : (currentUser?.role ? currentUser.role.replace('_', ' ') : 'Staff User')}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer mt-2"
                                >
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}

                        {/* Profile Tab Trigger */}
                        <div
                            onClick={() => {
                                setShowUserMenu(prev => !prev);
                                setShowLocationMenu(false);
                            }}
                            className={`flex items-center gap-3 p-1.5 pr-4 bg-[#27272a] hover:bg-[#3f3f46] transition-all rounded-full cursor-pointer border ${showUserMenu ? "border-purple-500/50" : "border-transparent"
                                }`}
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#a855f7] to-[#ec4899] flex items-center justify-center shrink-0 text-white font-bold text-[15px] shadow-sm">
                                {displayName?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div className="flex flex-col overflow-hidden text-left">
                                <span className="text-[13px] font-semibold text-white truncate leading-tight">
                                    {displayName}
                                </span>
                                <span className="text-[11px] text-zinc-400 truncate">
                                    {currentUser?.email || "admin@gmail.com"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Nav;

import { IoPersonCircleOutline } from "react-icons/io5";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import baseUrl from '../api/api';
import { getActiveStores, fetchActiveStores, FALLBACK_STORES } from "../utils/storeService.js";

const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7001";

// Function to format location names with proper spacing
const formatLocationName = (name) => {
    if (!name) return name;
    
    let formatted = name.trim();
    
    // Exact overrides for known stores
    if (/^warehouse$/i.test(formatted)) {
        return "Warehouse";
    }
    if (/^g[-.\s]?mg\s*road$/i.test(formatted) || /^mg\s*road$/i.test(formatted) || /^suitorguy\s+mg\s*road$/i.test(formatted)) {
        return "MG Road";
    }
    
    // Pattern: G- or Z- prefix with capital letter
    formatted = formatted.replace(/^([A-Z])-([A-Z][a-z])/g, '$1 $2');
    
    return formatted;
};

const Header = (prop) => {
    const [AllLoation, setAllLoation] = useState(() => getActiveStores());

    const [Value, setValue] = useState({ locCode: '', locName: '' });

    const [logOut, setlogOut] = useState(false);
    const [selectedValue, setSelectedValue] = useState("");
    const [pendingClosuresCount, setPendingClosuresCount] = useState(0);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef(null);
    
    // Initialize currentUser from localStorage immediately to prevent blank display
    const getInitialUser = () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("rootfinuser"));
            return storedUser || {};
        } catch (error) {
            return {};
        }
    };
    const [currentUser, setCurrentUser] = useState(getInitialUser());

    // Function to sync user from localStorage
    const syncUserFromStorage = (locations) => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("rootfinuser"));
            if (storedUser) {
                const foundLoc = locations.find(loc => loc.locCode === storedUser.locCode);
                const activeLoc = foundLoc || locations[0];
                if (activeLoc) {
                    const updatedUser = {
                        ...storedUser,
                        locCode: activeLoc.locCode,
                        username: activeLoc.locName
                    };
                    if (!foundLoc && locations.length > 0) {
                        try {
                            localStorage.setItem("rootfinuser", JSON.stringify(updatedUser));
                        } catch (e) {}
                    }
                    setCurrentUser(updatedUser);
                    setSelectedValue(activeLoc.locCode);
                } else {
                    setCurrentUser(storedUser);
                    setSelectedValue(storedUser.locCode);
                }
            }
        } catch (error) {
            console.error("Error syncing user from storage:", error);
        }
    };

    useEffect(() => {
        const load = async () => {
            const locations = await fetchActiveStores();
            if (locations && locations.length > 0) {
                setAllLoation(locations);
                syncUserFromStorage(locations);
            }
        };
        load();

        const handleStoresUpdated = (e) => {
            if (e.detail && Array.isArray(e.detail)) {
                setAllLoation(e.detail);
                syncUserFromStorage(e.detail);
            }
        };

        window.addEventListener("rootfin-stores-updated", handleStoresUpdated);
        return () => window.removeEventListener("rootfin-stores-updated", handleStoresUpdated);
    }, []);

    // Fetch pending closures count for admins
    useEffect(() => {
        const fetchNotifications = async () => {
            const user = getInitialUser();
            if (user?.power === 'admin' || user?.role === 'superadmin') {
                try {
                    const res = await fetch(`${API_URL}/user/pendingClosures`);
                    if (res.ok) {
                        const data = await res.json();
                        setPendingClosuresCount(data.data?.length || 0);
                    }
                } catch (e) {
                    console.error("Error fetching pending closures", e);
                }
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    // Close notifications on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notificationRef.current && !notificationRef.current.contains(e.target)) {
                setIsNotificationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Additional useEffect to periodically sync user from localStorage
    // This ensures the location stays visible even if state is lost
    useEffect(() => {
        const syncInterval = setInterval(() => {
            if (AllLoation.length > 0) {
                syncUserFromStorage(AllLoation);
            }
        }, 1000); // Check every second

        // Also listen for storage changes (in case localStorage is updated from another tab/window)
        const handleStorageChange = (e) => {
            if (e.key === 'rootfinuser' && AllLoation.length > 0) {
                syncUserFromStorage(AllLoation);
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            clearInterval(syncInterval);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [AllLoation]);

    const handleChange = (e) => {
        const selectedCode = e.target.value;
        const selectedItem = AllLoation.find(item => item.locCode === selectedCode);
        if (selectedItem) {
            setSelectedValue(selectedItem.locCode);
            setValue({
                locCode: selectedItem.locCode,
                locName: selectedItem.locName,
            });

            const updatedUser = {
                ...currentUser,
                locCode: selectedItem.locCode,
                username: selectedItem.locName,
            };

            localStorage.setItem("rootfinuser", JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            window.location.reload()
        }
    };

    const HanndleRemove = () => {
        try {
            localStorage.removeItem("rootfinuser");
            window.location.reload();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Get display name with fallback to localStorage
    const getDisplayName = () => {
        if (currentUser?.username) {
            return currentUser.username;
        }
        // Fallback: try to get from localStorage directly
        try {
            const storedUser = JSON.parse(localStorage.getItem("rootfinuser"));
            if (storedUser?.username) {
                return storedUser.username;
            }
        } catch (error) {
            // Ignore errors
        }
        return "";
    };

    const displayName = getDisplayName();

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-full pl-14 md:pl-16 pr-6 py-3.5 flex flex-wrap items-center justify-between mx-auto">
                <div className="flex items-center gap-3">
                    {prop.title && (
                        <h1 className="text-xl font-bold text-gray-800">{prop.title}</h1>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Notification bell for admin */}
                    {(currentUser.power === 'admin' || currentUser.role === 'superadmin') && (
                        <div className="relative" ref={notificationRef}>
                            <button
                                type="button"
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                                <Bell size={20} />
                                {pendingClosuresCount > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full transform translate-x-1/4 -translate-y-1/4">
                                        {pendingClosuresCount}
                                    </span>
                                )}
                            </button>

                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                        <h3 className="text-sm font-semibold text-gray-800">Pending Requests</h3>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {pendingClosuresCount > 0 ? (
                                            <Link 
                                                to="/PendingDaybookClosures" 
                                                onClick={() => setIsNotificationOpen(false)}
                                                className="block px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-50"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">Late Daybook Closures</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">Require super admin approval</p>
                                                    </div>
                                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{pendingClosuresCount}</span>
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                                                No pending requests.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div
                        onClick={() => setlogOut((prev) => !prev)}
                        className="hidden cursor-pointer w-full md:block md:w-auto"
                        id="navbar-multi-level"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Location: {formatLocationName(displayName)}</p>
                            </div>
                            <IoPersonCircleOutline className="text-4xl text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            {logOut && (
                <div className="flex flex-col items-stretch w-64 rounded-lg shadow-lg bg-white absolute right-5 top-16 p-4 space-y-3 border border-gray-100 z-50">
                    <div className="pb-3 border-b border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Current Location</p>
                        <p className="text-sm font-semibold text-gray-800">{formatLocationName(displayName)}</p>
                    </div>
                    
                    {(currentUser.power === 'admin' || (currentUser.role || '').toLowerCase() === 'cluster_manager') && (
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-gray-600">Switch Location</label>
                            <select
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm transition-colors"
                                value={selectedValue}
                                onChange={handleChange}
                            >
                                <option value="">-- Select a location --</option>
                                {(currentUser.power === 'admin'
                                    ? AllLoation
                                    : AllLoation.filter(item => (currentUser.allowedLocCodes || []).includes(item.locCode))
                                ).map((item) => (
                                    <option key={item.locCode} value={item.locCode}>
                                        {formatLocationName(item.locName)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <button
                        className="w-full px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer font-medium text-sm transition-colors"
                        onClick={HanndleRemove}
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
};

export default Header;

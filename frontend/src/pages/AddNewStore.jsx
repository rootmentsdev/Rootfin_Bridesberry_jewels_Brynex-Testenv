import { useState } from "react";
import { FaEye, FaEyeSlash, FaTimes } from "react-icons/fa";
import { Store } from "lucide-react";
import baseUrl from "../api/api";
import { useSidebar } from "../hooks/useSidebar.js";
import { useActiveStores, fetchActiveStores, saveCustomStore } from "../utils/storeService.js";

const AddNewStore = () => {
    const isSidebarOpen = useSidebar();
    const { stores: availableStores } = useActiveStores();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [locCode, setLocCode] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [gst, setGst] = useState("");
    const [power, setPower] = useState("normal");
    const [role, setRole] = useState("");
    const [allowedLocCodes, setAllowedLocCodes] = useState([]);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showStoreDropdown, setShowStoreDropdown] = useState(false);
    const [storeSearchTerm, setStoreSearchTerm] = useState("");

    const filteredStores = (availableStores || []).filter(store => 
        (store.locName || "").toLowerCase().includes((storeSearchTerm || "").toLowerCase()) &&
        !(allowedLocCodes || []).includes(store.locCode)
    );

    const handleStoreSelect = (locCode) => {
        if (!allowedLocCodes.includes(locCode)) {
            setAllowedLocCodes([...allowedLocCodes, locCode]);
        }
        setStoreSearchTerm("");
        setShowStoreDropdown(false);
    };

    const handleRemoveStore = (locCode) => {
        setAllowedLocCodes(allowedLocCodes.filter(code => code !== locCode));
    };

    const getStoreName = (locCode) => {
        const store = availableStores.find(s => s.locCode === locCode);
        return store ? store.locName : locCode;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username || !email) {
            alert("Please fill in Store Name and Email.");
            return;
        }

        if (!locCode || !locCode.trim()) {
            alert("Please enter a Location Code (Loc Code) for the store.");
            return;
        }

        if (!password) {
            alert("Password is required for new stores.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (password.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        const payload = {
            username: username.trim(),
            email: email.trim(),
            locCode: locCode.trim(),
            address: address || "",
            phone: phone || "",
            gst: gst || "",
            power,
            role: role || undefined,
            allowedLocCodes: role === "cluster_manager" ? allowedLocCodes : [],
            password,
        };

        try {
            setLoading(true);
            
            const response = await fetch(`${baseUrl.baseUrl}user/signin`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                const trimmedName = username.trim();
                const trimmedCode = locCode.trim();

                // 1. Optimistically save to local store cache and broadcast event
                saveCustomStore({
                    locName: trimmedName,
                    locCode: trimmedCode,
                    name: trimmedName,
                    address: address || "",
                    phone: phone || "",
                    email: email || ""
                });

                // 2. Also register in Store collection on the backend (dual-create)
                try {
                    await fetch(`${baseUrl.baseUrl}api/stores`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            name: trimmedName,
                            locCode: trimmedCode,
                            locName: trimmedName,
                            address: address || "",
                            phone: phone || "",
                            email: email || "",
                            isActive: true
                        }),
                    });
                } catch (storeCreateErr) {
                    console.warn("Could not dual-create in /api/stores:", storeCreateErr);
                }

                // 3. Immediately refresh active stores across the application
                try {
                    await fetchActiveStores();
                } catch (storeSyncErr) {
                    console.error("Failed to refresh active stores:", storeSyncErr);
                }

                alert(data.message || "Store created successfully!");

                // Reset form
                setUsername("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setLocCode("");
                setAddress("");
                setPhone("");
                setGst("");
                setPower("normal");
                setRole("");
                setAllowedLocCodes([]);
            } else {
                alert(data.message || "Failed to create store. Please try again.");
            }
        } catch (error) {
            console.error("Error creating store:", error);
            alert("An error occurred while creating the store. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`bg-white min-h-screen transition-all duration-300 ${isSidebarOpen ? 'ml-[240px]' : 'ml-0'}`}>
            {/* Header Section */}
            <div className="bg-white px-8 py-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-4 rounded-xl">
                        <Store className="text-white" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">ADD NEW STORE</h1>
                        <p className="text-gray-500 text-sm">Add and manage new users</p>
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="bg-white px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Row 1: Store Name */}
                    <div className="grid grid-cols-1 gap-8">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 uppercase">
                                Store Name *
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="e.g., G.MG Road"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 2: Email, Phone, GST */}
                    <div className="grid grid-cols-3 gap-8">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 uppercase">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="e.g., store@example.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 uppercase">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 uppercase">
                                GST Number *
                            </label>
                            <input
                                type="text"
                                value={gst}
                                onChange={(e) => setGst(e.target.value)}
                                placeholder="e.g., 123450000AAz5"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    {/* Row 3: Loc Code & Store Address */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 uppercase">
                                Loc Code *
                            </label>
                            <input
                                type="text"
                                value={locCode}
                                onChange={(e) => setLocCode(e.target.value)}
                                placeholder="e.g., 102"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 uppercase">
                                Store Address *
                            </label>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="e.g., store@example.com"
                                rows="1"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                            />
                        </div>
                    </div>

                    {/* Row 4: Password & Confirm Password */}
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 uppercase">
                                Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                                <span
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 cursor-pointer hover:text-blue-700"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-600 uppercase">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm Password"
                                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    required
                                />
                                <span
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600 cursor-pointer hover:text-blue-700"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => {
                                setUsername("");
                                setEmail("");
                                setPassword("");
                                setConfirmPassword("");
                                setLocCode("");
                                setAddress("");
                                setPhone("");
                                setGst("");
                                setPower("normal");
                                setRole("");
                                setAllowedLocCodes([]);
                            }}
                            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
                                loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700"
                            }`}
                        >
                            {loading ? "SAVING..." : "SAVE USER"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNewStore;

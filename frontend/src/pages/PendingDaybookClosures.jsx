import React, { useState, useEffect } from "react";
import useSidebar from "../hooks/useSidebar";
import Header from "../components/Header";
import baseUrl from "../api/api";
import { useActiveStores, FALLBACK_STORES } from "../utils/storeService";

// Function to format location names with proper spacing
const formatLocationName = (name) => {
    if (!name) return name;
    let formatted = name.trim();
    formatted = formatted.replace(/^([A-Z])([A-Z][a-z])/g, '$1 $2');
    formatted = formatted.replace(/^([A-Z])([a-z])/g, '$1 $2');
    return formatted;
};

const PendingDaybookClosures = () => {
  const isSidebarOpen = useSidebar();
  const [closures, setClosures] = useState([]);
  const [loading, setLoading] = useState(true);
  const { stores } = useActiveStores();

  const getStoreName = (locCode) => {
    const store = (stores && stores.length > 0 ? stores : FALLBACK_STORES).find(
      s => String(s.locCode) === String(locCode)
    );
    return store ? formatLocationName(store.locName || store.name) : locCode;
  };

  useEffect(() => {
    fetchClosures();
  }, []);

  const fetchClosures = async () => {
    try {
      const res = await fetch(`${baseUrl.baseUrl}user/pendingClosures`);
      const data = await res.json();
      setClosures(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await fetch(`${baseUrl.baseUrl}user/approveClosure/${id}`, { method: "PUT" });
      fetchClosures();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className={`transition-all duration-300 p-3 sm:p-6 bg-[#f5f7fb] min-h-screen ${isSidebarOpen ? 'lg:ml-64 ml-0' : 'ml-0'}`}>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Pending Daybook Closures</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : closures.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
            No pending closures request found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {closures.map(c => {
              const storeName = getStoreName(c.locCode);
              return (
              <div key={c._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base leading-tight">{storeName}</h3>
                      <p className="text-sm text-gray-500">Code: {c.locCode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">
                      {new Date(c.date).toLocaleDateString('en-GB')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(c.date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </p>
                  </div>
                </div>
                
                <hr className="border-gray-100 my-2" />
                
                <div className="grid grid-cols-3 gap-2 mt-2 mb-5">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">System Cash</p>
                    <p className="font-bold text-gray-900 text-sm">{Number(c.cash || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">Physical Cash</p>
                    <p className="font-bold text-gray-900 text-sm">{Number(c.Closecash || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">Bank</p>
                    <p className="font-bold text-gray-900 text-sm">{Number(c.bank || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleApprove(c._id)}
                  className="w-full py-2 bg-[#9f54e5] hover:bg-[#8b45cd] text-white rounded-lg font-medium transition-colors mt-auto text-sm"
                >
                  Approve Closure
                </button>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default PendingDaybookClosures;

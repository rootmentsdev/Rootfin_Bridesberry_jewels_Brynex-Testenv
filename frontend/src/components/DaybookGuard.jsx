import React, { useState, useEffect } from "react";

import baseUrl from "../api/api";
import LoadingScreen from "./LoadingScreen";

const DaybookGuard = ({ children }) => {
  const currentuser = JSON.parse(localStorage.getItem("rootfinuser"));
  const isAdminOrSuperAdmin = (currentuser?.power === "admin" || currentuser?.role === "superadmin");
  const isClusterManager = (currentuser?.role || "").toLowerCase() === "cluster_manager";
  const isFinancialHead = (currentuser?.role || "").toLowerCase() === "financial_head";

  const [loading, setLoading] = useState(!isAdminOrSuperAdmin && !isClusterManager && !isFinancialHead);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeReason, setFreezeReason] = useState(null);

  useEffect(() => {
    if (isAdminOrSuperAdmin || isClusterManager || isFinancialHead || !currentuser) {
      setLoading(false);
      return;
    }

    const checkYesterdayClosure = async () => {
      try {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yyyy = yesterday.getFullYear();
        const mm = String(yesterday.getMonth() + 1).padStart(2, "0");
        const dd = String(yesterday.getDate()).padStart(2, "0");
        const formattedYesterday = `${yyyy}-${mm}-${dd}`;

        const apiUrl = `${baseUrl.baseUrl}user/getsaveCashBank?locCode=${currentuser.locCode}&date=${formattedYesterday}`;
        const response = await fetch(apiUrl, { method: "GET" });

        if (!response.ok && response.status === 404) {
          setIsFrozen(true);
          setFreezeReason("missing_yesterday");
        } else if (response.ok) {
          const data = await response.json();
          if (data?.data?.status === "pending_approval") {
            setIsFrozen(true);
            setFreezeReason("pending_approval");
          }
        }
      } catch (error) {
        console.error("Error checking yesterday's closure:", error);
      } finally {
        setLoading(false);
      }
    };

    checkYesterdayClosure();
  }, [currentuser, isAdminOrSuperAdmin, isClusterManager]);

  if (loading) {
    return <LoadingScreen title="ROOTFIN" subtitle="Verifying access..." />;
  }

  if (isFrozen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md shadow-sm">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Blocked</h2>
          <p className="text-gray-600">
            {freezeReason === 'pending_approval'
              ? "Your late daybook closure for yesterday is pending approval. You cannot access this page until it is accepted."
              : "You cannot open this page because yesterday's daybook is not closed. Please close the daybook first to proceed."}
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default DaybookGuard;

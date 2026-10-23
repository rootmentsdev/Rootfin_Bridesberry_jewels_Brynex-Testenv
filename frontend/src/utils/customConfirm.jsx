import React from 'react';
import { createRoot } from 'react-dom/client';

export const customConfirm = (message) => {
  return new Promise((resolve) => {
    // Create a container element for the modal
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = createRoot(container);

    const handleResolve = (value) => {
      // Unmount and remove the container
      root.unmount();
      container.remove();
      resolve(value);
    };

    root.render(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" style={{ animation: "fadeIn 0.2s ease-in-out" }}>
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmation Required</h3>
          <p className="text-sm text-gray-600 mb-6 font-medium whitespace-pre-wrap">{message}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => handleResolve(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleResolve(true)}
              className="flex-1 px-4 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-lg font-medium transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  });
};

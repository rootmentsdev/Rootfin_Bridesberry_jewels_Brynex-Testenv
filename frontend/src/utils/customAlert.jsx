import React from 'react';
import { createRoot } from 'react-dom/client';

export const customAlert = (message, type = 'success') => {
  return new Promise((resolve) => {
    // Create a container element for the modal
    const container = document.createElement('div');
    document.body.appendChild(container);

    const root = createRoot(container);

    const handleResolve = () => {
      // Unmount and remove the container
      root.unmount();
      container.remove();
      resolve(true);
    };

    const isSuccess = type === 'success';

    root.render(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4" style={{ animation: "fadeIn 0.2s ease-in-out" }}>
        <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
            {isSuccess ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{isSuccess ? 'Success' : 'Error'}</h3>
          <p className="text-sm text-gray-600 mb-6 font-medium whitespace-pre-wrap">{message}</p>
          <button
            onClick={handleResolve}
            className={`w-full px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${isSuccess ? 'bg-[#a855f7] hover:bg-[#9333ea]' : 'bg-red-600 hover:bg-red-700'}`}
          >
            OK
          </button>
        </div>
      </div>
    );
  });
};

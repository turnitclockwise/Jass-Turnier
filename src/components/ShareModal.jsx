
import React from 'react';
import { Share2, X } from 'lucide-react';

const ShareModal = ({ tournamentId, setShowShareModal }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Share2 size={24} className="text-indigo-600" />
            Share Tournament
          </h2>
          <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Tournament ID:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tournamentId}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-lg font-mono text-center"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tournamentId);
                  alert('ID copied!');
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-gray-700">
              ⏱️ This tournament will expire in 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

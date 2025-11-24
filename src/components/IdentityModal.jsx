
import React from 'react';
import { CheckCircle } from 'lucide-react';

const IdentityModal = ({ tournament, identifiedPlayer, identifyAsPlayer, setShowIdentityModal }) => {
  if (!tournament) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-gray-100 mb-4">Identify Yourself</h3>
        <p className="text-sm text-gray-400 mb-4">
          Select your name to submit scores for your matches
        </p>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {tournament.players.map((name, idx) => (
            <button
              key={idx}
              onClick={() => identifyAsPlayer(idx)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                identifiedPlayer === idx
                  ? 'border-thunderbird bg-red-900/20 text-white'
                  : 'border-gray-600 bg-gray-700 hover:border-red-700 text-gray-300'
              }`}
            >
              {name}
              {identifiedPlayer === idx && (
                <CheckCircle className="inline ml-2 text-thunderbird" size={18} />
              )}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowIdentityModal(false)}
          className="mt-4 w-full px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default IdentityModal;

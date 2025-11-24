
import React from 'react';
import { Share2, X, Link as LinkIcon } from 'lucide-react';

const ShareModal = ({ tournamentId, setShowShareModal }) => {
  const joinLink = `${window.location.origin}?tournamentId=${tournamentId}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join My Jass Tournament',
          text: `Join Tournament ${tournamentId}`,
          url: joinLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(joinLink);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Share2 size={24} className="text-thunderbird" />
            Share Tournament
          </h2>
          <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-200">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-2">Tournament ID:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={tournamentId}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-lg font-mono text-center text-white"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tournamentId);
                  alert('ID copied!');
                }}
                className="px-4 py-2 bg-thunderbird text-white rounded hover:bg-red-700"
              >
                Copy
              </button>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-2">Join Link:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinLink}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-sm text-white"
              />
              <button
                onClick={handleShare}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <p className="text-xs text-yellow-300">
              ⏱️ This tournament will expire in 24 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

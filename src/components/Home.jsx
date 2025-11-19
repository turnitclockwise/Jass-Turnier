
import React from 'react';
import { Trophy, PlusCircle, Users } from 'lucide-react';

const Home = ({ setView, joinTournamentById, joinId, setJoinId, loading }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Trophy className="text-yellow-500 mx-auto mb-4" size={64} />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Jass-Turnier</h1>
          <p className="text-gray-600 mb-8">Verwalte dis Kartenspiel-Turnier</p>
          
          <div className="space-y-4">
            <button
              onClick={() => setView('setup')}
              className="w-full py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-3 text-lg font-semibold"
            >
              <PlusCircle size={24} />
              Neus Turnier erstelle
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">oder</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && joinId.length === 6 && joinTournamentById(joinId)}
                placeholder="Turnier-ID igäh"
                maxLength={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest uppercase focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => joinTournamentById(joinId)}
                disabled={loading || joinId.length !== 6}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center gap-2 font-semibold"
              >
                {loading ? 'Lädt...' : (
                  <>
                    <Users size={20} />
                    Turnier biiträte
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

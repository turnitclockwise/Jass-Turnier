
import React from 'react';
import { Trophy, UserCheck } from 'lucide-react';

const Standings = ({
  standings,
  rankingMode,
  setRankingMode,
  showExtendedStats,
  setShowExtendedStats,
  tournament,
  identifiedPlayer,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Trophy className="text-yellow-400" size={24} />
          Standings
        </h2>
        <button
          onClick={() => setShowExtendedStats(!showExtendedStats)}
          className="text-sm text-thunderbird hover:text-red-700 font-medium"
        >
          {showExtendedStats ? 'Hide' : 'Show'} Stats
        </button>
      </div>
      
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setRankingMode('total')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            rankingMode === 'total'
              ? 'bg-thunderbird text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Total Points
        </button>
        <button
          onClick={() => setRankingMode('average')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            rankingMode === 'average'
              ? 'bg-thunderbird text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Average Points
        </button>
      </div>
      
      <div className="space-y-2">
        {standings.map((player, idx) => {
          const avgPoints = player.gamesPlayed > 0 ? (player.totalPoints / player.gamesPlayed).toFixed(1) : '0.0';
          const winRate = player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(0) : '0';
          const totalPoints = player.totalPoints + (player.bonusPoints || 0);
          const avgWithBonus = player.gamesPlayed > 0 ? (totalPoints / player.gamesPlayed).toFixed(1) : '0.0';
          
          return (
            <div
              key={player.id}
              className={`p-3 rounded-lg ${
                idx === 0 ? 'bg-yellow-500/10 border-2 border-yellow-500/30' : 'bg-gray-700'
              } ${identifiedPlayer === player.id ? 'ring-2 ring-thunderbird' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-bold ${idx === 0 ? 'text-yellow-300' : 'text-gray-300'}`}>#{idx + 1}</span>
                    <span className={`font-medium ${idx === 0 ? 'text-yellow-200' : 'text-gray-100'}`}>
                      {player.name}
                    </span>
                    {player.id === identifiedPlayer && (
                      <UserCheck size={14} className="text-thunderbird" />
                    )}
                  </div>
                  
                  {!showExtendedStats && (
                    <div className="text-sm text-gray-400">
                      {player.gamesPlayed} games • {player.wins}W-{player.losses}L-{player.draws}D
                    </div>
                  )}
                  
                  {showExtendedStats && (
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-600 px-2 py-1 rounded">
                          <span className="text-gray-400">Record:</span>
                          <span className="ml-1 font-semibold text-gray-200">
                            {player.wins}W-{player.losses}L-{player.draws}D
                          </span>
                        </div>
                        <div className="bg-gray-600 px-2 py-1 rounded">
                          <span className="text-gray-400">Win Rate:</span>
                          <span className="ml-1 font-semibold text-gray-200">{winRate}%</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-600 px-2 py-1 rounded">
                          <span className="text-gray-400">Avg Points:</span>
                          <span className="ml-1 font-semibold text-gray-200">{avgWithBonus}</span>
                        </div>
                        <div className="bg-gray-600 px-2 py-1 rounded">
                          <span className="text-gray-400">Games:</span>
                          <span className="ml-1 font-semibold text-gray-200">{player.gamesPlayed}</span>
                        </div>
                      </div>
                      {tournament.bonusPointsEnabled && (
                        <div className="bg-gray-600 px-2 py-1 rounded">
                          <span className="text-gray-400">Bonus Points:</span>
                          <span className="ml-1 font-semibold text-purple-400">+{player.bonusPoints || 0}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-600 px-2 py-1 rounded">
                          <span className="text-gray-400">Highest:</span>
                          <span className="ml-1 font-semibold text-green-400">{player.highestScore}</span>
                        </div>
                        <div className="bg-gray-600 px-2 py-1 rounded">
                          <span className="text-gray-400">Lowest:</span>
                          <span className="ml-1 font-semibold text-red-400">
                            {player.lowestScore !== null ? player.lowestScore : '-'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-600 px-2 py-1 rounded">
                        <span className="text-gray-400">Points Against:</span>
                        <span className="ml-1 font-semibold text-gray-200">{player.pointsAgainst}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-right ml-4">
                  {rankingMode === 'total' ? (
                    <>
                      <div className={`font-bold text-lg ${idx === 0 ? 'text-yellow-200' : 'text-gray-100'}`}>{totalPoints}</div>
                      {tournament.bonusPointsEnabled && (player.bonusPoints || 0) > 0 && (
                        <div className="text-xs text-purple-400">
                          {player.totalPoints} + {player.bonusPoints}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">total pts</div>
                    </>
                  ) : (
                    <>
                      <div className={`font-bold text-lg ${idx === 0 ? 'text-yellow-200' : 'text-gray-100'}`}>{avgWithBonus}</div>
                      <div className="text-xs text-gray-500">avg pts</div>
                    </>
                  )}
                  {player.totalMatches > 0 && (
                    <div className="text-sm text-gray-400 mt-1">
                      {player.totalMatches} 🏆
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Standings;

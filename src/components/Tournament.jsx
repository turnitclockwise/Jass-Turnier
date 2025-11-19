
import React from 'react';
import { Trophy, Share2, UserCheck } from 'lucide-react';
import MatchCard from './MatchCard';
import Standings from './Standings';

const Tournament = ({
  tournament,
  currentRound,
  setCurrentRound,
  tournamentId,
  setShowShareModal,
  clearTournament,
  setShowIdentityModal,
  identifiedPlayer,
  rankingMode,
  setRankingMode,
  showExtendedStats,
  setShowExtendedStats,
  getStandings,
  getStandingsByAverage,
  isPlayerInMatch,
  submitScore,
  verifyScore,
  disputeScore,
  resolveDispute,
  isAdmin,
}) => {
  if (!tournament || !tournament.schedule || tournament.schedule.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-700">Loading Tournament...</h2>
          <p className="text-gray-500">Please wait while the data is being fetched.</p>
        </div>
      </div>
    );
  }

  const currentRoundData = tournament.schedule[currentRound];
  const standings = rankingMode === 'total' ? getStandings() : getStandingsByAverage();

  // Ensure matches is an array
  const matches = currentRoundData && currentRoundData.matches
    ? Array.isArray(currentRoundData.matches)
      ? currentRoundData.matches
      : Object.values(currentRoundData.matches)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Trophy className="text-indigo-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Jass Tournament</h1>
                <p className="text-sm text-gray-600">
                  Round {currentRound + 1} of {tournament.schedule.length}
                </p>
                {tournamentId && (
                  <p className="text-xs text-indigo-600 font-mono">ID: {tournamentId}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {tournamentId && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Share2 size={18} />
                  Share
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to exit this tournament? All local data will be cleared.')) {
                    clearTournament();
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Exit
              </button>
              <button
                onClick={() => setShowIdentityModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <UserCheck size={18} />
                {identifiedPlayer !== null ? tournament.players[identifiedPlayer] : 'Identify'}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {tournament.schedule.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentRound(idx)}
                className={`px-3 py-1 rounded ${
                  currentRound === idx
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                R{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Matches</h2>
              
              {currentRoundData && currentRoundData.sitting && currentRoundData.sitting.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    On break: {currentRoundData.sitting.map(id => tournament.players[id]).join(', ')}
                  </p>
                </div>
              )}

              {matches.map((match, idx) => {
                if (!match || !match.team1 || !match.team2) {
                  console.error('❌ Invalid match data:', match);
                  return (
                    <div key={idx} className="border-2 border-red-200 rounded-lg p-4 mb-4 bg-red-50">
                      <p className="text-red-600">⚠️ Error: Invalid match data</p>
                    </div>
                  );
                }
                
                return (
                  <MatchCard
                    key={match.id}
                    match={match}
                    tournament={tournament}
                    roundIdx={currentRound}
                    matchIdx={idx}
                    identifiedPlayer={identifiedPlayer}
                    isPlayerInMatch={isPlayerInMatch(match)}
                    isAdmin={isAdmin}
                    onSubmitScore={submitScore}
                    onVerifyScore={verifyScore}
                    onDisputeScore={disputeScore}
                    onResolveDispute={resolveDispute}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <Standings
              standings={standings}
              rankingMode={rankingMode}
              setRankingMode={setRankingMode}
              showExtendedStats={showExtendedStats}
              setShowExtendedStats={setShowExtendedStats}
              tournament={tournament}
              identifiedPlayer={identifiedPlayer}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tournament;

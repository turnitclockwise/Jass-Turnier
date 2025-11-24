
import React from 'react';
import { Trophy, Share2, UserCheck, LogOut } from 'lucide-react'; // Import LogOut
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
      <div className="min-h-screen bg-shark p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-300">Loading Tournament...</h2>
          <p className="text-gray-400">Please wait while the data is being fetched.</p>
        </div>
      </div>
    );
  }

  const currentRoundData = tournament.schedule[currentRound];
  const standings = rankingMode === 'total' ? getStandings() : getStandingsByAverage();

  const matches = currentRoundData && currentRoundData.matches
    ? Array.isArray(currentRoundData.matches)
      ? currentRoundData.matches
      : Object.values(currentRoundData.matches)
    : [];

  return (
    <div className="min-h-screen bg-shark p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="text-thunderbird" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-100">Jass Tournament</h1>
                <p className="text-sm text-gray-400">
                  Round {currentRound + 1} of {tournament.schedule.length}
                </p>
                {tournamentId && (
                  <p className="text-xs text-thunderbird font-mono">ID: {tournamentId}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {tournamentId && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-thunderbird text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Share2 size={18} />
                  <span className="hidden sm:inline">Share</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to exit this tournament? All local data will be cleared.')) {
                    clearTournament();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Exit</span>
              </button>
              <button
                onClick={() => setShowIdentityModal(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <UserCheck size={18} />
                <span className="hidden sm:inline">
                  {identifiedPlayer !== null ? tournament.players[identifiedPlayer] : 'Identify'}
                </span>
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
                    ? 'bg-thunderbird text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                R{idx + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-100 mb-4">Matches</h2>
              
              {currentRoundData && currentRoundData.sitting && currentRoundData.sitting.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm font-medium text-yellow-300">
                    On break: {currentRoundData.sitting.map(id => tournament.players[id]).join(', ')}
                  </p>
                </div>
              )}

              {matches.map((match, idx) => {
                if (!match || !match.team1 || !match.team2) {
                  console.error('❌ Invalid match data:', match);
                  return (
                    <div key={idx} className="border-2 border-red-500/50 rounded-lg p-4 mb-4 bg-red-500/10">
                      <p className="text-red-400">⚠️ Error: Invalid match data</p>
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

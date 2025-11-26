import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Share2, UserCheck, LogOut, Check, Circle, Club, Diamond, Heart, Spade } from 'lucide-react';
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
  const { t } = useTranslation();

  if (!tournament || !tournament.schedule || tournament.schedule.length === 0) {
    return (
      <div className="min-h-screen bg-shark p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-300">{t('tournament.loading_title')}</h2>
          <p className="text-gray-400">{t('tournament.loading_subtitle')}</p>
        </div>
      </div>
    );
  }

  const getRoundStatus = (roundIdx) => {
    const round = tournament.schedule[roundIdx];
    if (!round || !round.matches) return 'future';

    const allMatchesVerified = (Array.isArray(round.matches) ? round.matches : Object.values(round.matches)).every(
      (match) => match && match.scoreSubmission && match.scoreSubmission.status === 'verified'
    );

    if (allMatchesVerified) {
      return 'past';
    }

    let isCurrent = true;
    for (let i = 0; i < roundIdx; i++) {
        const prevRound = tournament.schedule[i];
        if (!prevRound || !prevRound.matches) {
            isCurrent = false;
            break;
        }
        const allPrevVerified = (Array.isArray(prevRound.matches) ? prevRound.matches : Object.values(prevRound.matches)).every(
            (m) => m && m.scoreSubmission && m.scoreSubmission.status === 'verified'
        );
        if (!allPrevVerified) {
            isCurrent = false;
            break;
        }
    }

    if(isCurrent) return 'current';

    return 'future';
  };

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
              <div className="grid grid-cols-2 gap-1">
                <Heart className="text-thunderbird" size={20} />
                <Spade className="text-white" size={20} />
                <Club className="text-white" size={20} />
                <Diamond className="text-thunderbird" size={20} />
                
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-100">{t('tournament.title')}</h1>
                <p className="text-sm text-gray-400">
                  {t('tournament.round_of', { current: currentRound + 1, total: tournament.schedule.length })}
                </p>
                {tournamentId && (
                  <p className="text-xs text-indigo-300 font-mono">{t('tournament.id', { id: tournamentId })}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {tournamentId && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-indigo-400 text-white rounded-lg hover:bg-indigo-900 flex items-center gap-2"
                >
                  <Share2 size={18} />
                  <span className="hidden sm:inline">{t('tournament.share')}</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (confirm(t('tournament.exit_confirm'))) {
                    clearTournament();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">{t('tournament.exit')}</span>
              </button>
              <button
                onClick={() => setShowIdentityModal(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <UserCheck size={18} />
                <span className="hidden sm:inline">
                  {identifiedPlayer !== null ? tournament.players[identifiedPlayer] : t('tournament.identify')}
                </span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {tournament.schedule.map((_, idx) => {
                const status = getRoundStatus(idx);
                let buttonClass = 'px-3 py-1 rounded flex items-center gap-2 ';
                let icon = null;

                if (idx === currentRound) {
                    buttonClass += 'bg-thunderbird text-white ';
                } else {
                    buttonClass += 'bg-gray-700 text-gray-300 hover:bg-gray-600 ';
                }

                if (status === 'past') {
                    icon = <Check size={16} className="text-green-400" />;
                } else if (status === 'future') {
                    icon = <Circle size={12} className="text-yellow-400" />;
                }

                if (status === 'current') {
                    buttonClass += ' animate-pulse border-2 border-red-500';
                }

                return (
                    <button
                    key={idx}
                    onClick={() => setCurrentRound(idx)}
                    className={buttonClass}
                    >
                    {icon}
                    {t('tournament.round', { number: idx + 1 })}
                    </button>
                );
                })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-100 mb-4">{t('tournament.matches')}</h2>
              
              {currentRoundData && currentRoundData.sitting && currentRoundData.sitting.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm font-medium text-yellow-300">
                    {t('tournament.on_break', { players: currentRoundData.sitting.map(id => tournament.players[id]).join(', ') })}
                  </p>
                </div>
              )}

              {matches.map((match, idx) => {
                if (!match || !match.team1 || !match.team2) {
                  console.error(t('tournament.invalid_match_data_log'), match);
                  return (
                    <div key={idx} className="border-2 border-red-500/50 rounded-lg p-4 mb-4 bg-red-500/10">
                      <p className="text-red-400">{t('tournament.invalid_match_data_error')}</p>
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

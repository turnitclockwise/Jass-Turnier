import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, UserCheck } from 'lucide-react';

const StatItem = ({ label, value, colorClass = 'text-gray-100' }) => (
    <div>
        <span className="text-gray-400 text-xs">{label}: </span>
        <span className={`font-semibold ${colorClass}`}>{value}</span>
    </div>
);

const Standings = ({
  standings,
  rankingMode,
  setRankingMode,
  showExtendedStats,
  setShowExtendedStats,
  tournament,
  identifiedPlayer,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Trophy className="text-yellow-400" size={24} />
          {t('standings.title')}
        </h2>
        <button
          onClick={() => setShowExtendedStats(!showExtendedStats)}
          className="text-sm text-thunderbird hover:text-red-700 font-medium"
        >
          {showExtendedStats ? t('standings.hide_stats') : t('standings.show_stats')}
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
          {t('standings.total_points')}
        </button>
        <button
          onClick={() => setRankingMode('average')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            rankingMode === 'average'
              ? 'bg-thunderbird text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {t('standings.average_points')}
        </button>
      </div>
      
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-6 bg-wood-light rounded-t-md" />
        <div className="absolute right-4 top-0 bottom-0 w-6 bg-wood-light rounded-t-md" />

        <div className="space-y-3 pt-4 pb-2 px-2">
          {standings.map((player, idx) => {
            const totalPoints = player.totalPoints + (player.bonusPoints || 0);
            const avgWithBonus = player.gamesPlayed > 0 ? (totalPoints / player.gamesPlayed).toFixed(1) : '0.0';
            const winRate = player.gamesPlayed > 0 ? ((player.wins / player.gamesPlayed) * 100).toFixed(0) : '0';
            const isTopPlayer = idx === 0;

            return (
              <div
                key={player.id}
                className={`relative px-12 bg-wood-rung bg-cover bg-center border-4 border-wood-dark rounded-md shadow-md transition-all duration-300 ease-in-out overflow-hidden ${
                    showExtendedStats ? 'h-36' : 'h-16'
                } ${identifiedPlayer === player.id ? 'ring-2 ring-white' : ''}`}>
                
                <div className="absolute top-0 left-0 right-0 flex items-center w-full h-16">
                    <div className={`absolute left-0 top-0 flex items-center justify-center w-12 h-16 font-bold text-lg text-shadow-lg ${
                    isTopPlayer ? 'text-yellow-300' : 'text-white'
                    }`}>
                        #{idx + 1}
                    </div>

                    <div className="flex-1 flex items-center justify-center pl-4">
                        <span className={`font-bold text-xl text-shadow-md ${isTopPlayer ? 'text-yellow-200' : 'text-white'}`}>
                            {player.name}
                        </span>
                        {player.id === identifiedPlayer && (
                            <UserCheck size={16} className="ml-2 text-thunderbird" />
                        )}
                    </div>

                    <div className="flex flex-col items-end w-24 text-right pr-4">
                        {rankingMode === 'total' ? (
                            <span className={`font-black text-2xl text-shadow-sm ${isTopPlayer ? 'text-yellow-100' : 'text-white'}`}>
                                {totalPoints}
                            </span>
                        ) : (
                            <span className={`font-black text-2xl text-shadow-sm ${isTopPlayer ? 'text-yellow-100' : 'text-white'}`}>
                                {avgWithBonus}
                            </span>
                        )}
                        <span className="text-xs text-gray-200 text-shadow-sm">{rankingMode === 'total' ? t('standings.total_pts') : t('standings.avg_pts')} pts</span>
                    </div>
                </div>

                <div className={`absolute bottom-0 left-0 right-0 bg-gray-900/75 backdrop-blur-sm p-2 transition-transform duration-300 ease-in-out ${showExtendedStats ? 'translate-y-0' : 'translate-y-full'}`}>
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                      <StatItem label={t('standings.record')} value={`${player.wins}W-${player.losses}L-${player.draws}D`} />
                      <StatItem label={t('standings.win_rate')} value={`${winRate}%`} />
                      <StatItem label={t('standings.average_points')} value={avgWithBonus} />
                      <StatItem label={t('standings.games')} value={player.gamesPlayed} />
                      <StatItem label={t('standings.highest')} value={player.highestScore} colorClass="text-green-400" />
                      <StatItem label={t('standings.lowest')} value={player.lowestScore !== null ? player.lowestScore : '-'} colorClass="text-red-400" />
                      {tournament.bonusPointsEnabled && player.bonusPoints > 0 && (
                        <div className="col-span-3">
                            <StatItem label={t('standings.bonus_points')} value={`+${player.bonusPoints || 0}`} colorClass="text-purple-400" />
                        </div>
                      )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Standings;

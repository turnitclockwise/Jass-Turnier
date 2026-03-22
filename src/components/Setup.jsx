import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Users, X } from 'lucide-react';

const Setup = ({
  numTables,
  setNumTables,
  playerNames,
  addPlayer,
  removePlayer,
  updatePlayerName,
  bonusPointsEnabled,
  setBonusPointsEnabled,
  bonusPointsPerMatch,
  setBonusPointsPerMatch,
  fixedTeams,
  addFixedTeam,
  removeFixedTeam,
  updateFixedTeamPlayer,
  startTournament,
}) => {
  const { t } = useTranslation();

  const getAvailablePlayersForTeam = (teamIndex) => {
    const selectedPlayersInOtherTeams = fixedTeams
      .filter((_, index) => index !== teamIndex)
      .flat()
      .map(p => parseInt(p, 10));
    return playerNames
      .map((_, index) => index)
      .filter(index => !selectedPlayersInOtherTeams.includes(index));
  };

  return (
    <div className="min-h-screen bg-shark p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="text-fuchsia-300" size={32} />
            <h1 className="text-3xl font-bold text-gray-100">{t('setup.title')}</h1>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('setup.num_tables_label')}
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={numTables}
              onChange={(e) => setNumTables(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
            />
            <p className="text-sm text-gray-400 mt-1">
              {t('setup.num_tables_description', { count: numTables * 4 })}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('setup.player_names_label')}
            </label>
            {playerNames.map((name, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updatePlayerName(idx, e.target.value)}
                  placeholder={t('setup.player_placeholder', { number: idx + 1 })}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                />
                {playerNames.length > 1 && (
                  <button
                    onClick={() => removePlayer(idx)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    {t('setup.remove_player')}
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPlayer}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {t('setup.add_player')}
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3 mb-3">
              <Users className="text-fuchsia-300" size={24} />
              <h2 className="text-xl font-bold text-gray-100">{t('setup.fixed_teams_label')}</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {t('setup.fixed_teams_description')}
            </p>
            {fixedTeams.map((team, teamIndex) => {
              const availablePlayers = getAvailablePlayersForTeam(teamIndex);
              return (
                <div key={teamIndex} className="flex gap-2 mb-2 items-center">
                  <select
                    value={team[0]}
                    onChange={(e) => updateFixedTeamPlayer(teamIndex, 0, e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                  >
                    <option value="">{t('setup.select_player')}</option>
                    {availablePlayers.map(playerIndex => (
                      <option key={playerIndex} value={playerIndex} disabled={team[1] === playerIndex.toString()}>
                        {playerNames[playerIndex]}
                      </option>
                    ))}
                  </select>
                  <span className="text-gray-400">{t('setup.and')}</span>
                  <select
                    value={team[1]}
                    onChange={(e) => updateFixedTeamPlayer(teamIndex, 1, e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                  >
                    <option value="">{t('setup.select_player')}</option>
                    {availablePlayers.map(playerIndex => (
                      <option key={playerIndex} value={playerIndex} disabled={team[0] === playerIndex.toString()}>
                        {playerNames[playerIndex]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeFixedTeam(teamIndex)}
                    className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>
              );
            })}
            <button
              onClick={addFixedTeam}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={fixedTeams.length * 2 >= playerNames.length || playerNames.length < 2}
            >
              {t('setup.add_fixed_team')}
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="bonusPoints"
                checked={bonusPointsEnabled}
                onChange={(e) => setBonusPointsEnabled(e.target.checked)}
                className="w-5 h-5 text-thunderbird rounded focus:ring-2 focus:ring-thunderbird bg-gray-600 border-gray-500"
              />
              <label htmlFor="bonusPoints" className="text-sm font-medium text-gray-300">
                {t('setup.bonus_points_label')}
              </label>
            </div>
            
            {bonusPointsEnabled && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('setup.bonus_points_per_match_label')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={bonusPointsPerMatch}
                  onChange={(e) => setBonusPointsPerMatch(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t('setup.bonus_points_description', { count: bonusPointsPerMatch })}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={startTournament}
            className="w-full px-6 py-3 bg-thunderbird text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            {t('setup.start_tournament')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;

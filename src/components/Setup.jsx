
import React from 'react';
import { Trophy } from 'lucide-react';

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
  startTournament,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-indigo-600" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Jass-Turnier Iirichtig</h1>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aazahl Tisch
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={numTables}
              onChange={(e) => setNumTables(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Mindestens {numTables * 4} Spieler benötigt
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spielernäme
            </label>
            {playerNames.map((name, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updatePlayerName(idx, e.target.value)}
                  placeholder={`Spieler ${idx + 1}`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                {playerNames.length > 1 && (
                  <button
                    onClick={() => removePlayer(idx)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Entferne
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPlayer}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Spieler hinzuefüege
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="bonusPoints"
                checked={bonusPointsEnabled}
                onChange={(e) => setBonusPointsEnabled(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <label htmlFor="bonusPoints" className="text-sm font-medium text-gray-700">
                Bonus Punkte für Match aktiviere
              </label>
            </div>
            
            {bonusPointsEnabled && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonus Punkte pro Match
                </label>
                <input
                  type="number"
                  min="0"
                  value={bonusPointsPerMatch}
                  onChange={(e) => setBonusPointsPerMatch(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jedes Match git zuesätzlich {bonusPointsPerMatch} Bonuspünkt
                </p>
              </div>
            )}
          </div>

          <button
            onClick={startTournament}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
          >
            Turnier starte
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;

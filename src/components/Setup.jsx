
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
    <div className="min-h-screen bg-shark p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-thunderbird" size={32} />
            <h1 className="text-3xl font-bold text-gray-100">Jass-Turnier Setup</h1>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Anzahl Tische
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
              Mindestens {numTables * 4} Spieler benötigt
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Spielernamen
            </label>
            {playerNames.map((name, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => updatePlayerName(idx, e.target.value)}
                  placeholder={`Spieler ${idx + 1}`}
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                />
                {playerNames.length > 1 && (
                  <button
                    onClick={() => removePlayer(idx)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Entfernen
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPlayer}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Spieler hinzufügen
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
                Bonus Punkte für Match?
              </label>
            </div>
            
            {bonusPointsEnabled && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bonus Punkte pro Match
                </label>
                <input
                  type="number"
                  min="0"
                  value={bonusPointsPerMatch}
                  onChange={(e) => setBonusPointsPerMatch(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Jeder Match gibt zusätzlich {bonusPointsPerMatch} Bonuspunkte
                </p>
              </div>
            )}
          </div>

          <button
            onClick={startTournament}
            className="w-full px-6 py-3 bg-thunderbird text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;

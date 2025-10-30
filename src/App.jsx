import React, { useState, useEffect } from 'react';
import { Users, Trophy, Table, Clock, CheckCircle, AlertCircle, XCircle, Edit2, UserCheck } from 'lucide-react';

const App = () => {
  const [view, setView] = useState('setup');
  const [numTables, setNumTables] = useState(2);
  const [playerNames, setPlayerNames] = useState(['']);
  const [tournament, setTournament] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [identifiedPlayer, setIdentifiedPlayer] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  const generateSchedule = (players, tables) => {
    const n = players.length;
    const rounds = n - 1;
    const playersPerTable = 4;
    const totalPlayers = tables * playersPerTable;
    const schedule = [];

    const partnerships = new Set();
    const opponentMatchups = new Map();

    for (let round = 0; round < rounds; round++) {
      const sitting = [];
      const availablePlayers = [];

      if (n > totalPlayers) {
        const numSitting = n - totalPlayers;
        for (let i = 0; i < numSitting; i++) {
          sitting.push((round + i) % n);
        }
      }

      for (let i = 0; i < n; i++) {
        if (!sitting.includes(i)) {
          availablePlayers.push(i);
        }
      }

      const matches = [];
      const used = new Set();

      for (let table = 0; table < tables && used.size < availablePlayers.length; table++) {
        const remaining = availablePlayers.filter(p => !used.has(p));
        
        if (remaining.length >= 4) {
          let team1 = null;
          let team2 = null;

          for (let i = 0; i < remaining.length - 1; i++) {
            for (let j = i + 1; j < remaining.length; j++) {
              const p1 = remaining[i];
              const p2 = remaining[j];
              const partnerKey = `${Math.min(p1, p2)}-${Math.max(p1, p2)}`;
              
              if (!partnerships.has(partnerKey) && !team1) {
                team1 = [p1, p2];
                partnerships.add(partnerKey);
                used.add(p1);
                used.add(p2);
                break;
              }
            }
            if (team1) break;
          }

          const remaining2 = remaining.filter(p => !used.has(p));
          if (remaining2.length >= 2) {
            for (let i = 0; i < remaining2.length - 1; i++) {
              for (let j = i + 1; j < remaining2.length; j++) {
                const p1 = remaining2[i];
                const p2 = remaining2[j];
                const partnerKey = `${Math.min(p1, p2)}-${Math.max(p1, p2)}`;
                
                if (!partnerships.has(partnerKey)) {
                  team2 = [p1, p2];
                  partnerships.add(partnerKey);
                  used.add(p1);
                  used.add(p2);
                  break;
                }
              }
              if (team2) break;
            }
          }

          if (team1 && team2) {
            matches.push({
              id: `r${round}-m${table}`,
              table: table + 1,
              team1: team1,
              team2: team2,
              scoreSubmission: {
                status: 'none',
                team1Score: null,
                team2Score: null,
                team1Matches: 0,
                team2Matches: 0,
                submittedBy: null,
                submittedAt: null,
                verifiedBy: null,
                verifiedAt: null,
                disputedBy: null,
                disputeReason: '',
                disputedAt: null,
                autoAccepted: false
              }
            });
          }
        }
      }

      schedule.push({
        roundNumber: round + 1,
        matches,
        sitting
      });
    }

    return schedule;
  };

  const startTournament = () => {
    const validPlayers = playerNames.filter(name => name.trim() !== '');
    const minPlayers = numTables * 4;

    if (validPlayers.length < minPlayers) {
      alert(`Need at least ${minPlayers} players for ${numTables} table(s)`);
      return;
    }

    const schedule = generateSchedule(validPlayers, numTables);
    const playerStats = validPlayers.map((name, idx) => ({
      id: idx,
      name,
      totalPoints: 0,
      totalMatches: 0,
      gamesPlayed: 0
    }));

    setTournament({
      players: validPlayers,
      playerStats,
      schedule,
      createdAt: Date.now()
    });
    setView('tournament');
  };

  const addPlayer = () => {
    setPlayerNames([...playerNames, '']);
  };

  const removePlayer = (index) => {
    setPlayerNames(playerNames.filter((_, i) => i !== index));
  };

  const updatePlayerName = (index, name) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const identifyAsPlayer = (playerId) => {
    setIdentifiedPlayer(playerId);
    setShowIdentityModal(false);
  };

  const isPlayerInMatch = (match) => {
    if (identifiedPlayer === null) return false;
    return [...match.team1, ...match.team2].includes(identifiedPlayer);
  };

  const submitScore = (roundIdx, matchIdx, team1Score, team2Score, team1Matches, team2Matches) => {
    const match = tournament.schedule[roundIdx].matches[matchIdx];
    
    if (team1Score + team2Score !== 628) {
      alert('Scores must add up to exactly 628 points!');
      return;
    }

    if (team1Matches + team2Matches > 4) {
      alert('Total Matches cannot exceed 4!');
      return;
    }

    const updatedTournament = { ...tournament };
    const updatedMatch = { ...match };
    
    updatedMatch.scoreSubmission = {
      status: 'pending',
      team1Score,
      team2Score,
      team1Matches,
      team2Matches,
      submittedBy: identifiedPlayer,
      submittedAt: Date.now(),
      verifiedBy: null,
      verifiedAt: null,
      disputedBy: null,
      disputeReason: '',
      disputedAt: null,
      autoAccepted: false
    };

    updatedTournament.schedule[roundIdx].matches[matchIdx] = updatedMatch;
    setTournament(updatedTournament);
  };

  const verifyScore = (roundIdx, matchIdx) => {
    const updatedTournament = { ...tournament };
    const match = updatedTournament.schedule[roundIdx].matches[matchIdx];
    
    match.scoreSubmission.status = 'verified';
    match.scoreSubmission.verifiedBy = identifiedPlayer;
    match.scoreSubmission.verifiedAt = Date.now();

    const { team1Score, team2Score, team1Matches, team2Matches } = match.scoreSubmission;
    
    match.team1.forEach(playerId => {
      const player = updatedTournament.playerStats[playerId];
      player.totalPoints += team1Score;
      player.totalMatches += team1Matches;
      player.gamesPlayed += 1;
    });

    match.team2.forEach(playerId => {
      const player = updatedTournament.playerStats[playerId];
      player.totalPoints += team2Score;
      player.totalMatches += team2Matches;
      player.gamesPlayed += 1;
    });

    setTournament(updatedTournament);
  };

  const disputeScore = (roundIdx, matchIdx, reason) => {
    const updatedTournament = { ...tournament };
    const match = updatedTournament.schedule[roundIdx].matches[matchIdx];
    
    match.scoreSubmission.status = 'disputed';
    match.scoreSubmission.disputedBy = identifiedPlayer;
    match.scoreSubmission.disputeReason = reason || 'Score disputed';
    match.scoreSubmission.disputedAt = Date.now();

    setTournament(updatedTournament);
  };

  const resolveDispute = (roundIdx, matchIdx, acceptScore) => {
    if (acceptScore) {
      verifyScore(roundIdx, matchIdx);
    } else {
      const updatedTournament = { ...tournament };
      updatedTournament.schedule[roundIdx].matches[matchIdx].scoreSubmission.status = 'none';
      setTournament(updatedTournament);
    }
  };

  const getStandings = () => {
    if (!tournament) return [];
    return [...tournament.playerStats].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return b.totalMatches - a.totalMatches;
    });
  };

  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-indigo-600" size={32} />
              <h1 className="text-3xl font-bold text-gray-800">Jass Tournament Setup</h1>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Tables
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={numTables}
                onChange={(e) => setNumTables(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Minimum players needed: {numTables * 4}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player Names
              </label>
              {playerNames.map((name, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updatePlayerName(idx, e.target.value)}
                    placeholder={`Player ${idx + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  {playerNames.length > 1 && (
                    <button
                      onClick={() => removePlayer(idx)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addPlayer}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Add Player
              </button>
            </div>

            <button
              onClick={startTournament}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Start Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentRoundData = tournament.schedule[currentRound];
  const standings = getStandings();

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
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowIdentityModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <UserCheck size={18} />
                {identifiedPlayer !== null ? tournament.players[identifiedPlayer] : 'Identify'}
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setCurrentRound(Math.max(0, currentRound - 1))}
              disabled={currentRound === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Previous Round
            </button>
            <button
              onClick={() => setCurrentRound(Math.min(tournament.schedule.length - 1, currentRound + 1))}
              disabled={currentRound === tournament.schedule.length - 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Next Round
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Matches</h2>
              
              {currentRoundData.sitting.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    On break: {currentRoundData.sitting.map(id => tournament.players[id]).join(', ')}
                  </p>
                </div>
              )}

              {currentRoundData.matches.map((match, idx) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  tournament={tournament}
                  roundIdx={currentRound}
                  matchIdx={idx}
                  identifiedPlayer={identifiedPlayer}
                  isPlayerInMatch={isPlayerInMatch(match)}
                  onSubmitScore={submitScore}
                  onVerifyScore={verifyScore}
                  onDisputeScore={disputeScore}
                  onResolveDispute={resolveDispute}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-500" size={24} />
                Standings
              </h2>
              <div className="space-y-2">
                {standings.map((player, idx) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg ${
                      idx === 0 ? 'bg-yellow-50 border-2 border-yellow-400' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-700">#{idx + 1}</span>
                          <span className={`font-medium ${idx === 0 ? 'text-yellow-700' : 'text-gray-800'}`}>
                            {player.name}
                          </span>
                          {player.id === identifiedPlayer && (
                            <UserCheck size={14} className="text-indigo-600" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {player.gamesPlayed} games played
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-gray-800">{player.totalPoints}</div>
                        <div className="text-sm text-gray-600">
                          {player.totalMatches} 🏆
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showIdentityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Identify Yourself</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select your name to submit scores for your matches
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tournament.players.map((name, idx) => (
                <button
                  key={idx}
                  onClick={() => identifyAsPlayer(idx)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    identifiedPlayer === idx
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {name}
                  {identifiedPlayer === idx && (
                    <CheckCircle className="inline ml-2 text-indigo-600" size={18} />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowIdentityModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MatchCard = ({
  match,
  tournament,
  roundIdx,
  matchIdx,
  identifiedPlayer,
  isPlayerInMatch,
  onSubmitScore,
  onVerifyScore,
  onDisputeScore,
  onResolveDispute
}) => {
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [team1Matches, setTeam1Matches] = useState(0);
  const [team2Matches, setTeam2Matches] = useState(0);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const { scoreSubmission } = match;
  const canSubmit = identifiedPlayer !== null && isPlayerInMatch && scoreSubmission.status === 'none';
  const canVerify = identifiedPlayer !== null && isPlayerInMatch && 
                    scoreSubmission.status === 'pending' && 
                    scoreSubmission.submittedBy !== identifiedPlayer;

  useEffect(() => {
    if (team1Score !== '') {
      const score1 = parseInt(team1Score) || 0;
      const score2 = 628 - score1;
      setTeam2Score(score2.toString());
    }
  }, [team1Score]);

  const handleSubmit = () => {
    const score1 = parseInt(team1Score) || 0;
    const score2 = parseInt(team2Score) || 0;
    onSubmitScore(roundIdx, matchIdx, score1, score2, team1Matches, team2Matches);
    setTeam1Score('');
    setTeam2Score('');
    setTeam1Matches(0);
    setTeam2Matches(0);
  };

  const handleDispute = () => {
    onDisputeScore(roundIdx, matchIdx, disputeReason);
    setShowDisputeModal(false);
    setDisputeReason('');
  };

  const getStatusIcon = () => {
    switch (scoreSubmission.status) {
      case 'none':
        return <Clock className="text-gray-400" size={20} />;
      case 'pending':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'verified':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'disputed':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (scoreSubmission.status) {
      case 'none':
        return 'No score submitted';
      case 'pending':
        return 'Pending verification';
      case 'verified':
        return 'Score verified';
      case 'disputed':
        return 'Score disputed';
      default:
        return '';
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Table className="text-indigo-600" size={20} />
          <span className="font-bold text-gray-800">Table {match.table}</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-600">{getStatusText()}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs font-semibold text-blue-800 mb-1">TEAM 1</p>
          {match.team1.map(id => (
            <p key={id} className="text-sm text-blue-900">{tournament.players[id]}</p>
          ))}
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs font-semibold text-green-800 mb-1">TEAM 2</p>
          {match.team2.map(id => (
            <p key={id} className="text-sm text-green-900">{tournament.players[id]}</p>
          ))}
        </div>
      </div>

      {scoreSubmission.status === 'none' && canSubmit && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Team 1 Score</label>
              <input
                type="number"
                min="0"
                max="628"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="0-628"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Team 2 Score</label>
              <input
                type="number"
                min="0"
                max="628"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Auto-calculated"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Team 1 Matches</label>
              <input
                type="number"
                min="0"
                max="4"
                value={team1Matches}
                onChange={(e) => setTeam1Matches(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Team 2 Matches</label>
              <input
                type="number"
                min="0"
                max="4"
                value={team2Matches}
                onChange={(e) => setTeam2Matches(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Submit Score
          </button>
        </div>
      )}

      {scoreSubmission.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <p className="font-semibold text-gray-700">Team 1: {scoreSubmission.team1Score}</p>
              <p className="text-gray-600">Matches: {scoreSubmission.team1Matches} 🏆</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Team 2: {scoreSubmission.team2Score}</p>
              <p className="text-gray-600">Matches: {scoreSubmission.team2Matches} 🏆</p>
            </div>
          </div>
          {canVerify && (
            <div className="flex gap-2">
              <button
                onClick={() => onVerifyScore(roundIdx, matchIdx)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                ✓ Confirm
              </button>
              <button
                onClick={() => setShowDisputeModal(true)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                ✗ Dispute
              </button>
            </div>
          )}
        </div>
      )}

      {scoreSubmission.status === 'verified' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Team 1: {scoreSubmission.team1Score}</p>
              <p className="text-gray-600">Matches: {scoreSubmission.team1Matches} 🏆</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Team 2: {scoreSubmission.team2Score}</p>
              <p className="text-gray-600">Matches: {scoreSubmission.team2Matches} 🏆</p>
            </div>
          </div>
        </div>
      )}

      {scoreSubmission.status === 'disputed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800 mb-2">⚠️ Score Disputed</p>
          <p className="text-sm text-red-700 mb-2">{scoreSubmission.disputeReason}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onResolveDispute(roundIdx, matchIdx, true)}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Accept Score
            </button>
            <button
              onClick={() => onResolveDispute(roundIdx, matchIdx, false)}
              className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Dispute Score</h3>
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Explain why you're disputing this score..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-4"
              rows="4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDispute}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Submit Dispute
              </button>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
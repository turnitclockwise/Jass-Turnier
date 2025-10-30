import React, { useState, useEffect } from 'react';
import { Trophy, Users, PlusCircle, Play, Award, Edit2, Check, X, Share2, QrCode } from 'lucide-react';
import { database } from './firebase';
import { ref, set, onValue } from 'firebase/database';
import { nanoid } from 'nanoid';

const JassTournamentApp = () => {
  const [view, setView] = useState('home'); // home, setup, join, tournament
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [numTables, setNumTables] = useState(2);
  const [tournament, setTournament] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [tournamentId, setTournamentId] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('tournament');
    if (id) {
      setTournamentId(id);
      setView('tournament');
    }
  }, []);

  useEffect(() => {
    if (view === 'tournament' && tournamentId) {
      const tournamentRef = ref(database, 'tournaments/' + tournamentId);
      onValue(tournamentRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setTournament(data);
          setPlayers(data.playerStats);
          setCurrentRound(data.currentRound);
        } else {
          setView('home');
          alert("Tournament not found!");
        }
      });
    }
  }, [view, tournamentId]);


  // Improved round-robin schedule generator
  const generateSchedule = (playerList, tables) => {
    const n = playerList.length;
    const rounds = n - 1;
    const schedule = [];
    
    const maxPlayersPerRound = tables * 4;
    const playersPerRound = Math.floor(Math.min(n, maxPlayersPerRound) / 4) * 4;
    const breaksPerRound = n - playersPerRound;
    
    const usedPartnerships = new Set();
    const usedOpponents = new Map();
    
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        usedOpponents.set(`${i}-${j}`, 0);
      }
    }
    
    const breakCount = new Array(n).fill(0);
    const lastBreak = new Array(n).fill(-2);
    
    for (let round = 0; round < rounds; round++) {
      const roundMatches = [];
      let available = [...Array(n).keys()];
      const sitting = [];
      
      const breakPriority = available.map(p => ({
        player: p,
        breaks: breakCount[p],
        lastBreak: lastBreak[p],
        priorityScore: -breakCount[p] * 1000 + (lastBreak[p] === round - 1 ? -10000 : 0)
      })).sort((a, b) => b.priorityScore - a.priorityScore);
      
      for (let i = 0; i < breaksPerRound; i++) {
        let selectedPlayer = null;
        for (const candidate of breakPriority) {
          if (!sitting.includes(candidate.player)) {
            selectedPlayer = candidate.player;
            break;
          }
        }
        if (selectedPlayer !== null) {
          sitting.push(selectedPlayer);
          breakCount[selectedPlayer]++;
          lastBreak[selectedPlayer] = round;
        }
      }
      
      available = available.filter(p => !sitting.includes(p));
      
      for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
      }
      
      const used = new Set();
      const maxMatches = Math.floor(available.length / 4);
      
      for (let t = 0; t < maxMatches; t++) {
        let bestMatch = null;
        let bestScore = -Infinity;
        
        for (let attempts = 0; attempts < 200; attempts++) {
          const remainingPlayers = available.filter(p => !used.has(p));
          if (remainingPlayers.length < 4) break;
          
          const shuffled = [...remainingPlayers].sort(() => Math.random() - 0.5);
          const p1 = shuffled[0];
          const p2 = shuffled[1];
          const p3 = shuffled[2];
          const p4 = shuffled[3];
          
          const configs = [
            { team1: [p1, p2], team2: [p3, p4] },
            { team1: [p1, p3], team2: [p2, p4] },
            { team1: [p1, p4], team2: [p2, p3] }
          ];
          
          for (const config of configs) {
            const t1 = config.team1.sort((a, b) => a - b);
            const t2 = config.team2.sort((a, b) => a - b);
            
            const p1Key = `${t1[0]}-${t1[1]}`;
            const p2Key = `${t2[0]}-${t2[1]}`;
            const opp1Key = `${Math.min(t1[0], t2[0])}-${Math.max(t1[0], t2[0])}`;
            const opp2Key = `${Math.min(t1[0], t2[1])}-${Math.max(t1[0], t2[1])}`;
            const opp3Key = `${Math.min(t1[1], t2[0])}-${Math.max(t1[1], t2[0])}`;
            const opp4Key = `${Math.min(t1[1], t2[1])}-${Math.max(t1[1], t2[1])}`;
            
            const p1Used = usedPartnerships.has(p1Key);
            const p2Used = usedPartnerships.has(p2Key);
            
            if (p1Used && p2Used && round < rounds / 2) {
              continue;
            }
            
            const partnershipPenalty = (p1Used ? 50 : 0) + (p2Used ? 50 : 0);
            const oppScore = (
              (usedOpponents.get(opp1Key) || 0) +
              (usedOpponents.get(opp2Key) || 0) +
              (usedOpponents.get(opp3Key) || 0) +
              (usedOpponents.get(opp4Key) || 0)
            );
            
            const score = -oppScore - partnershipPenalty;
            
            if (score > bestScore) {
              bestScore = score;
              bestMatch = {
                team1: t1,
                team2: t2,
                oppKeys: [opp1Key, opp2Key, opp3Key, opp4Key],
                partnerKeys: [p1Key, p2Key]
              };
            }
          }
        }
        
        if (bestMatch) {
          roundMatches.push({
            id: `r${round}-m${t}`,
            team1: bestMatch.team1,
            team2: bestMatch.team2,
            team1Score: null,
            team2Score: null,
            team1Matches: 0,
            team2Matches: 0,
            submitted: false
          });
          
          bestMatch.partnerKeys.forEach(key => usedPartnerships.add(key));
          bestMatch.oppKeys.forEach(key => {
            usedOpponents.set(key, (usedOpponents.get(key) || 0) + 1);
          });
          
          bestMatch.team1.forEach(p => used.add(p));
          bestMatch.team2.forEach(p => used.add(p));
        } else {
          break;
        }
      }
      
      schedule.push({
        roundNumber: round + 1,
        matches: roundMatches,
        sitting: sitting
      });
    }
    
    return schedule;
  };

  const startTournament = async () => {
    if (players.length < 4) {
      alert('Need at least 4 players to start tournament');
      return;
    }

    if (numTables * 4 > players.length) {
      alert(`With ${players.length} players, you can have maximum ${Math.floor(players.length / 4)} tables`);
      return;
    }
    const id = nanoid(6);
    const schedule = generateSchedule(players, numTables);
    const playerStats = players.map((name, idx) => ({
      id: idx,
      name: name,
      totalPoints: 0,
      totalMatches: 0,
      gamesPlayed: 0
    }));

    const tournamentData = {
      id,
      schedule: schedule,
      playerStats: playerStats,
      numTables: numTables,
      currentRound: 0,
      started: true
    };

    const tournamentRef = ref(database, 'tournaments/' + id);
    await set(tournamentRef, tournamentData);

    setTournamentId(id);
    window.history.pushState({}, '', `?tournament=${id}`);
    setView('tournament');
  };

  const submitScore = async (matchId, team1Score, team2Score, team1Matches, team2Matches) => {
    const updatedSchedule = [...tournament.schedule];
    const match = updatedSchedule[currentRound].matches.find(m => m.id === matchId);
    
    if (!match) return;

    const updatedStats = [...tournament.playerStats];
    
    if (match.submitted) {
      match.team1.forEach(playerId => {
        updatedStats[playerId].totalPoints -= match.team1Score;
        updatedStats[playerId].totalMatches -= match.team1Matches;
        updatedStats[playerId].gamesPlayed -= 1;
      });

      match.team2.forEach(playerId => {
        updatedStats[playerId].totalPoints -= match.team2Score;
        updatedStats[playerId].totalMatches -= match.team2Matches;
        updatedStats[playerId].gamesPlayed -= 1;
      });
    }

    match.team1Score = parseInt(team1Score);
    match.team2Score = parseInt(team2Score);
    match.team1Matches = parseInt(team1Matches);
    match.team2Matches = parseInt(team2Matches);
    match.submitted = true;

    match.team1.forEach(playerId => {
      updatedStats[playerId].totalPoints += match.team1Score;
      updatedStats[playerId].totalMatches += match.team1Matches;
      updatedStats[playerId].gamesPlayed += 1;
    });

    match.team2.forEach(playerId => {
      updatedStats[playerId].totalPoints += match.team2Score;
      updatedStats[playerId].totalMatches += match.team2Matches;
      updatedStats[playerId].gamesPlayed += 1;
    });

    const updatedTournament = {
      ...tournament,
      schedule: updatedSchedule,
      playerStats: updatedStats
    };

    const tournamentRef = ref(database, 'tournaments/' + tournamentId);
    await set(tournamentRef, updatedTournament);
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      setPlayers([...players, newPlayerName.trim()]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const shareTournament = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('Tournament URL copied to clipboard!');
    });
  };

  // Setup View
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Trophy className="text-yellow-500 mx-auto mb-4" size={64} />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Jass Tournament</h1>
            <p className="text-gray-600 mb-8">Manage your card game tournament</p>
            
            <div className="space-y-4">
              <button
                onClick={() => setView('setup')}
                className="w-full py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-3 text-lg font-semibold shadow-md"
              >
                <PlusCircle size={24} />
                Create New Tournament
              </button>
              <button
                onClick={() => setView('join')}
                className="w-full py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-3 text-lg font-semibold shadow-md"
              >
                <Users size={24} />
                Join Tournament
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Join Tournament</h1>
            <input
              type="text"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              placeholder="Enter Tournament ID"
              className="w-full p-3 border rounded-md mb-4 text-center"
            />
            <button
              onClick={() => {
                window.history.pushState({}, '', `?tournament=${tournamentId}`);
                setView('tournament');
              }}
              className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }


  if (view === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-yellow-500" size={32} />
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
                onChange={(e) => setNumTables(parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Players
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                  placeholder="Enter player name"
                  className="flex-grow p-2 border rounded-md"
                />
                <button
                  onClick={addPlayer}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add
                </button>
              </div>
              <ul className="space-y-2">
                {players.map((player, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-100 p-2 rounded-md"
                  >
                    <span>{player}</span>
                    <button
                      onClick={() => removePlayer(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={startTournament}
              disabled={players.length < 4}
              className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 flex items-center justify-center gap-2 text-lg font-semibold"
            >
              <Play size={22} />
              Start Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tournament View
  if (view === 'tournament' && tournament) {
    const round = tournament.schedule[currentRound];

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold">Round {currentRound + 1}</h1>
              <div className="flex gap-2">
              <button onClick={shareTournament} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                  <Share2 size={20} />
                </button>
                <button
                  onClick={() => setCurrentRound(r => Math.max(0, r - 1))}
                  disabled={currentRound === 0}
                  className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setCurrentRound(r => Math.min(tournament.schedule.length - 1, r + 1))}
                  disabled={currentRound === tournament.schedule.length - 1}
                  className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Matches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {round.matches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  players={tournament.playerStats}
                  onSubmit={submitScore}
                />
              ))}
            </div>

            {round.sitting.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Sitting Out:</h3>
                <p className="text-gray-600">
                  {round.sitting.map(p => tournament.playerStats[p].name).join(', ')}
                </p>
              </div>
            )}
          </div>
          <Leaderboard players={tournament.playerStats} />
        </div>
      </div>
    );
  }

  return <div>Loading...</div>; // Fallback
};

const MatchCard = ({ match, players, onSubmit }) => {
  const [scores, setScores] = useState({
    team1: match.team1Score || '',
    team2: match.team2Score || ''
  });
  const [matches, setMatches] = useState({
    team1: match.team1Matches || '',
    team2: match.team2Matches || ''
  });
  const [editing, setEditing] = useState(!match.submitted);

  const team1Names = match.team1.map(p => players[p].name).join(' & ');
  const team2Names = match.team2.map(p => players[p].name).join(' & ');

  const handleSubmit = () => {
    onSubmit(match.id, scores.team1, scores.team2, matches.team1, matches.team2);
    setEditing(false);
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${match.submitted ? 'bg-green-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold">{team1Names}</p>
          <p className="text-sm text-gray-500 vs">vs</p>
          <p className="font-semibold">{team2Names}</p>
        </div>
        {editing ? (
          <button onClick={handleSubmit} className="text-green-500 hover:text-green-700">
            <Check size={24} />
          </button>
        ) : (
          <button onClick={() => setEditing(true)} className="text-blue-500 hover:text-blue-700">
            <Edit2 size={20} />
          </button>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        {editing ? (
          <>
            <input
              type="number"
              value={scores.team1}
              onChange={(e) => setScores({...scores, team1: e.target.value})}
              placeholder="Score"
              className="p-1 border rounded-md w-full"
            />
            <input
              type="number"
              value={scores.team2}
              onChange={(e) => setScores({...scores, team2: e.target.value})}
              placeholder="Score"
              className="p-1 border rounded-md w-full"
            />
            <input
              type="number"
              value={matches.team1}
              onChange={(e) => setMatches({...matches, team1: e.target.value})}
              placeholder="Matches"
              className="p-1 border rounded-md w-full"
            />
            <input
              type="number"
              value={matches.team2}
              onChange={(e) => setMatches({...matches, team2: e.target.value})}
              placeholder="Matches"
              className="p-1 border rounded-md w-full"
            />
          </>
        ) : (
          <>
            <div>
              <p className="font-bold text-lg">{match.team1Score || 'N/A'}</p>
              <p className="text-xs text-gray-500">({match.team1Matches} matches)</p>
            </div>
            <div>
              <p className="font-bold text-lg">{match.team2Score || 'N/A'}</p>
              <p className="text-xs text-gray-500">({match.team2Matches} matches)</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


const Leaderboard = ({ players }) => {
  const sortedPlayers = [...players].sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Award size={24} className="text-yellow-500" />
        Leaderboard
      </h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="p-2">Rank</th>
            <th className="p-2">Player</th>
            <th className="p-2">Points</th>
            <th className="p-2">Matches Won</th>
            <th className="p-2">Games Played</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((p, idx) => (
            <tr key={p.id} className="border-b hover:bg-gray-50">
              <td className="p-2 font-semibold">{idx + 1}</td>
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.totalPoints}</td>
              <td className="p-2">{p.totalMatches}</td>
              <td className="p-2">{p.gamesPlayed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default JassTournamentApp;
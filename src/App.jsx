import React, { useState, useEffect } from 'react';
import { Users, Trophy, Table, Clock, CheckCircle, AlertCircle, XCircle, Edit2, UserCheck, Share2, PlusCircle, Play, Award, X } from 'lucide-react';

// Firebase Service - Ready for integration with your firebase.js
// In your actual project, replace this with:
// import { ref, set, get, onValue, update, off } from 'firebase/database';
// import { database } from './firebase';

const FirebaseService = {
  enabled: false, // Set to true when Firebase is properly configured
  database: null,
  
  // Simulated Firebase functions for Claude Artifacts
  // Replace these with real Firebase calls in your project
  
  generateId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },
  
  async createTournament(tournamentData) {
    if (!this.enabled) {
      console.warn('⚠️ Firebase disabled - running in local mode');
      return {
        ...tournamentData,
        id: this.generateId(),
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
    }
    
    // REPLACE THIS IN YOUR PROJECT WITH:
    /*
    const tournamentId = this.generateId();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000);
    
    const tournament = {
      ...tournamentData,
      id: tournamentId,
      createdAt: Date.now(),
      expiresAt: expiresAt,
      creatorId: 'temp-creator-id',
      currentAdmin: 'temp-creator-id',
      status: 'active',
      connectedUsers: {},
      version: 1
    };
    
    const tournamentRef = ref(database, `tournaments/${tournamentId}`);
    await set(tournamentRef, tournament);
    return tournament;
    */
    
    throw new Error('Firebase not configured');
  },
  
  async getTournament(tournamentId) {
    if (!this.enabled) {
      console.warn('⚠️ Firebase disabled - cannot load tournament');
      return null;
    }
    
    // REPLACE THIS IN YOUR PROJECT WITH:
    /*
    const tournamentRef = ref(database, `tournaments/${tournamentId}`);
    const snapshot = await get(tournamentRef);
    return snapshot.exists() ? snapshot.val() : null;
    */
    
    return null;
  },
  
  subscribeTournament(tournamentId, callback) {
    if (!this.enabled) {
      return () => {};
    }
    
    // REPLACE THIS IN YOUR PROJECT WITH:
    /*
    const tournamentRef = ref(database, `tournaments/${tournamentId}`);
    
    onValue(tournamentRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    });
    
    return () => off(tournamentRef);
    */
    
    return () => {};
  },
  
  async updateMatch(tournamentId, roundIndex, matchId, matchData) {
    if (!this.enabled) return;
    
    // REPLACE THIS IN YOUR PROJECT WITH:
    /*
    const tournamentRef = ref(database, `tournaments/${tournamentId}`);
    const snapshot = await get(tournamentRef);
    const tournament = snapshot.val();
    
    if (tournament && tournament.schedule && tournament.schedule[roundIndex]) {
      const matchIndex = tournament.schedule[roundIndex].matches.findIndex(m => m.id === matchId);
      if (matchIndex !== -1) {
        const matchRef = ref(database, `tournaments/${tournamentId}/schedule/${roundIndex}/matches/${matchIndex}`);
        await update(matchRef, matchData);
      }
    }
    */
  },
  
  async updatePlayerStats(tournamentId, playerStats) {
    if (!this.enabled) return;
    
    // REPLACE THIS IN YOUR PROJECT WITH:
    /*
    const statsRef = ref(database, `tournaments/${tournamentId}/playerStats`);
    await set(statsRef, playerStats);
    */
  },
  
  async updateCurrentRound(tournamentId, roundIndex) {
    if (!this.enabled) return;
    
    // REPLACE THIS IN YOUR PROJECT WITH:
    /*
    const roundRef = ref(database, `tournaments/${tournamentId}/currentRound`);
    await set(roundRef, roundIndex);
    */
  }
};

const App = () => {
  const [view, setView] = useState('home');
  const [numTables, setNumTables] = useState(2);
  const [playerNames, setPlayerNames] = useState(['']);
  const [tournament, setTournament] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [identifiedPlayer, setIdentifiedPlayer] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [tournamentId, setTournamentId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [rankingMode, setRankingMode] = useState('total'); // 'total' or 'average'
  const [showExtendedStats, setShowExtendedStats] = useState(false);

  useEffect(() => {
    if (!tournamentId) return;
    
    const unsubscribe = FirebaseService.subscribeTournament(tournamentId, (updatedTournament) => {
      setTournament({
        players: updatedTournament.players,
        schedule: updatedTournament.schedule,
        playerStats: updatedTournament.playerStats
      });
      setCurrentRound(updatedTournament.currentRound || 0);
    });
    
    return unsubscribe;
  }, [tournamentId]);

  const generateSchedule = (players, tables) => {
    const n = players.length;
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
            table: t + 1,
            team1: bestMatch.team1,
            team2: bestMatch.team2,
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
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      highestScore: 0,
      lowestScore: null,
      pointsAgainst: 0
    }));

    const tournamentData = {
      players: validPlayers,
      playerStats,
      schedule,
      numTables,
      currentRound: 0
    };

    if (FirebaseService.enabled) {
      try {
        const createdTournament = await FirebaseService.createTournament(tournamentData);
        setTournamentId(createdTournament.id);
        setTournament(tournamentData);
        setView('tournament');
        setShowShareModal(true);
      } catch (error) {
        console.error('Firebase error:', error);
        setTournament(tournamentData);
        setView('tournament');
      }
    } else {
      // Local mode without Firebase
      const localId = FirebaseService.generateId();
      setTournamentId(localId);
      setTournament(tournamentData);
      setView('tournament');
      setShowShareModal(true);
    }
  };

  const joinTournamentById = async (id) => {
    setLoading(true);
    try {
      const tournamentData = await FirebaseService.getTournament(id);
      if (tournamentData) {
        setTournamentId(id);
        setTournament({
          players: tournamentData.players,
          schedule: tournamentData.schedule,
          playerStats: tournamentData.playerStats
        });
        setCurrentRound(tournamentData.currentRound || 0);
        setView('tournament');
      } else {
        alert(`Tournament "${id}" not found`);
      }
    } catch (error) {
      alert('Error joining tournament');
    } finally {
      setLoading(false);
    }
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

  const submitScore = async (roundIdx, matchIdx, team1Score, team2Score, team1Matches, team2Matches) => {
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
    
    if (tournamentId) {
      await FirebaseService.updateMatch(tournamentId, roundIdx, match.id, {
        scoreSubmission: updatedMatch.scoreSubmission
      });
    }
  };

  const verifyScore = async (roundIdx, matchIdx) => {
    const updatedTournament = { ...tournament };
    const match = updatedTournament.schedule[roundIdx].matches[matchIdx];
    
    match.scoreSubmission.status = 'verified';
    match.scoreSubmission.verifiedBy = identifiedPlayer;
    match.scoreSubmission.verifiedAt = Date.now();

    const { team1Score, team2Score, team1Matches, team2Matches } = match.scoreSubmission;
    
    // Update Team 1 players
    match.team1.forEach(playerId => {
      const player = updatedTournament.playerStats[playerId];
      player.totalPoints += team1Score;
      player.totalMatches += team1Matches;
      player.gamesPlayed += 1;
      player.pointsAgainst += team2Score;
      
      // Update highest/lowest scores
      if (team1Score > player.highestScore) {
        player.highestScore = team1Score;
      }
      if (player.lowestScore === null || team1Score < player.lowestScore) {
        player.lowestScore = team1Score;
      }
      
      // Update Win/Loss/Draw
      if (team1Score > team2Score) {
        player.wins += 1;
      } else if (team1Score < team2Score) {
        player.losses += 1;
      } else {
        player.draws += 1;
      }
    });

    // Update Team 2 players
    match.team2.forEach(playerId => {
      const player = updatedTournament.playerStats[playerId];
      player.totalPoints += team2Score;
      player.totalMatches += team2Matches;
      player.gamesPlayed += 1;
      player.pointsAgainst += team1Score;
      
      // Update highest/lowest scores
      if (team2Score > player.highestScore) {
        player.highestScore = team2Score;
      }
      if (player.lowestScore === null || team2Score < player.lowestScore) {
        player.lowestScore = team2Score;
      }
      
      // Update Win/Loss/Draw
      if (team2Score > team1Score) {
        player.wins += 1;
      } else if (team2Score < team1Score) {
        player.losses += 1;
      } else {
        player.draws += 1;
      }
    });

    setTournament(updatedTournament);
    
    if (tournamentId) {
      await FirebaseService.updateMatch(tournamentId, roundIdx, match.id, {
        scoreSubmission: match.scoreSubmission
      });
      await FirebaseService.updatePlayerStats(tournamentId, updatedTournament.playerStats);
    }
  };

  const disputeScore = async (roundIdx, matchIdx, reason) => {
    const updatedTournament = { ...tournament };
    const match = updatedTournament.schedule[roundIdx].matches[matchIdx];
    
    match.scoreSubmission.status = 'disputed';
    match.scoreSubmission.disputedBy = identifiedPlayer;
    match.scoreSubmission.disputeReason = reason || 'Score disputed';
    match.scoreSubmission.disputedAt = Date.now();

    setTournament(updatedTournament);
    
    if (tournamentId) {
      await FirebaseService.updateMatch(tournamentId, roundIdx, match.id, {
        scoreSubmission: match.scoreSubmission
      });
    }
  };

  const resolveDispute = async (roundIdx, matchIdx, acceptScore) => {
    if (acceptScore) {
      await verifyScore(roundIdx, matchIdx);
    } else {
      const updatedTournament = { ...tournament };
      updatedTournament.schedule[roundIdx].matches[matchIdx].scoreSubmission.status = 'none';
      setTournament(updatedTournament);
      
      if (tournamentId) {
        await FirebaseService.updateMatch(tournamentId, roundIdx, updatedTournament.schedule[roundIdx].matches[matchIdx].id, {
          scoreSubmission: updatedTournament.schedule[roundIdx].matches[matchIdx].scoreSubmission
        });
      }
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

  const getStandingsByAverage = () => {
    if (!tournament) return [];
    return [...tournament.playerStats].sort((a, b) => {
      const avgA = a.gamesPlayed > 0 ? a.totalPoints / a.gamesPlayed : 0;
      const avgB = b.gamesPlayed > 0 ? b.totalPoints / b.gamesPlayed : 0;
      
      if (avgB !== avgA) {
        return avgB - avgA;
      }
      return b.totalMatches - a.totalMatches;
    });
  };

  if (view === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Trophy className="text-yellow-500 mx-auto mb-4" size={64} />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Jass Tournament</h1>
            <p className="text-gray-600 mb-8">Manage your card game tournament</p>
            
            <div className="space-y-4">
              <button
                onClick={() => setView('setup')}
                className="w-full py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-3 text-lg font-semibold"
              >
                <PlusCircle size={24} />
                Create New Tournament
              </button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <input
                  type="text"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && joinId.length === 6 && joinTournamentById(joinId)}
                  placeholder="Enter Tournament ID"
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest uppercase focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => joinTournamentById(joinId)}
                  disabled={loading || joinId.length !== 6}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center gap-2 font-semibold"
                >
                  {loading ? 'Loading...' : (
                    <>
                      <Users size={20} />
                      Join Tournament
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
  const standings = rankingMode === 'total' ? getStandings() : getStandingsByAverage();

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

      {showShareModal && tournamentId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Share2 size={24} className="text-indigo-600" />
                Share Tournament
              </h2>
              <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Tournament ID:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tournamentId}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-lg font-mono text-center"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tournamentId);
                      alert('ID copied!');
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-gray-700">
                  ⏱️ This tournament will expire in 24 hours
                </p>
              </div>
            </div>
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
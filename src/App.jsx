import React, { useState, useEffect } from 'react';
import { Trophy, Users, PlusCircle, Play, Award, Edit2, Check, X, Share2, QrCode } from 'lucide-react';

// NOTE: This app requires Firebase SDK to be loaded via CDN in your HTML
// Add these scripts to your index.html:
// <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>

// Firebase configuration - UPDATE WITH YOUR ACTUAL CONFIG
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "jass-turnierplan.firebaseapp.com",
  databaseURL: "https://jass-turnierplan-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jass-turnierplan",
  storageBucket: "jass-turnierplan.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Firebase Service using global firebase object (CDN)
const FirebaseService = {
  database: null,
  initialized: false,
  
  init() {
    if (this.initialized) return;
    
    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        }
        this.database = firebase.database();
        this.initialized = true;
        console.log('✅ Firebase initialized successfully');
      } else {
        console.error('❌ Firebase SDK not loaded. Add CDN scripts to your HTML.');
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
    }
  },
  
  generateId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },
  
  async createTournament(tournamentData) {
    if (!this.initialized) throw new Error('Firebase not initialized');
    
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
    
    try {
      await this.database.ref(`tournaments/${tournamentId}`).set(tournament);
      console.log('✅ Tournament saved to Firebase:', tournamentId);
      return tournament;
    } catch (error) {
      console.error('❌ Error saving tournament:', error);
      throw error;
    }
  },
  
  async getTournament(tournamentId) {
    if (!this.initialized) throw new Error('Firebase not initialized');
    
    try {
      const snapshot = await this.database.ref(`tournaments/${tournamentId}`).once('value');
      if (snapshot.exists()) {
        console.log('✅ Tournament loaded:', tournamentId);
        return snapshot.val();
      } else {
        console.warn('❌ Tournament not found:', tournamentId);
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading tournament:', error);
      return null;
    }
  },
  
  subscribeTournament(tournamentId, callback) {
    if (!this.initialized) return () => {};
    
    const ref = this.database.ref(`tournaments/${tournamentId}`);
    ref.on('value', (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    }, (error) => {
      console.error('❌ Error subscribing to tournament:', error);
    });
    
    return () => ref.off('value');
  },
  
  async updateMatch(tournamentId, roundIndex, matchId, matchData) {
    if (!this.initialized) return;
    
    try {
      const snapshot = await this.database.ref(`tournaments/${tournamentId}`).once('value');
      const tournament = snapshot.val();
      
      if (tournament && tournament.schedule && tournament.schedule[roundIndex]) {
        const matchIndex = tournament.schedule[roundIndex].matches.findIndex(m => m.id === matchId);
        if (matchIndex !== -1) {
          await this.database.ref(`tournaments/${tournamentId}/schedule/${roundIndex}/matches/${matchIndex}`).update(matchData);
          console.log('✅ Match updated in Firebase');
        }
      }
    } catch (error) {
      console.error('❌ Error updating match:', error);
    }
  },
  
  async updatePlayerStats(tournamentId, playerStats) {
    if (!this.initialized) return;
    
    try {
      await this.database.ref(`tournaments/${tournamentId}/playerStats`).set(playerStats);
      console.log('✅ Player stats updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating player stats:', error);
    }
  },
  
  async updateCurrentRound(tournamentId, roundIndex) {
    if (!this.initialized) return;
    
    try {
      await this.database.ref(`tournaments/${tournamentId}/currentRound`).set(roundIndex);
      console.log('✅ Current round updated in Firebase');
    } catch (error) {
      console.error('❌ Error updating current round:', error);
    }
  }
};

const JassTournamentApp = () => {
  const [view, setView] = useState('home'); // home, setup, join, tournament
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [numTables, setNumTables] = useState(2);
  const [tournament, setTournament] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [tournamentId, setTournamentId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Initialize Firebase on mount
  useEffect(() => {
    FirebaseService.init();
  }, []);
  
  // Check URL for tournament ID on mount
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/join\/([A-Z0-9]+)/i);
    if (match) {
      const id = match[1].toUpperCase();
      joinTournamentById(id);
    }
  }, []);
  
  // Subscribe to tournament updates when tournament is active
  useEffect(() => {
    if (!tournamentId) return;
    
    console.log('📡 Subscribing to tournament updates:', tournamentId);
    const unsubscribe = FirebaseService.subscribeTournament(tournamentId, (updatedTournament) => {
      console.log('🔄 Tournament updated from Firebase');
      setTournament({
        schedule: updatedTournament.schedule,
        playerStats: updatedTournament.playerStats,
        started: true
      });
      setCurrentRound(updatedTournament.currentRound || 0);
    });
    
    return () => {
      console.log('🔌 Unsubscribing from tournament updates');
      unsubscribe();
    };
  }, [tournamentId]);

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

    const schedule = generateSchedule(players, numTables);
    const playerStats = players.map((name, idx) => ({
      id: idx,
      name: name,
      totalPoints: 0,
      totalMatches: 0,
      gamesPlayed: 0
    }));

    const tournamentData = {
      schedule: schedule,
      playerStats: playerStats,
      numTables: numTables,
      currentRound: 0,
      started: true
    };

    try {
      const createdTournament = await FirebaseService.createTournament(tournamentData);
      setTournamentId(createdTournament.id);
      setTournament(tournamentData);
      setCurrentRound(0);
      setView('tournament');
      setShowShareModal(true);
    } catch (error) {
      alert('Error creating tournament. Please try again.');
      console.error(error);
    }
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

    setTournament({
      ...tournament,
      schedule: updatedSchedule,
      playerStats: updatedStats
    });
    
    if (tournamentId) {
      await FirebaseService.updateMatch(tournamentId, currentRound, matchId, {
        team1Score: match.team1Score,
        team2Score: match.team2Score,
        team1Matches: match.team1Matches,
        team2Matches: match.team2Matches,
        submitted: true
      });
      await FirebaseService.updatePlayerStats(tournamentId, updatedStats);
    }
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
  
  const joinTournamentById = async (id) => {
    setLoading(true);
    try {
      const tournamentData = await FirebaseService.getTournament(id);
      if (tournamentData) {
        setTournamentId(id);
        setTournament({
          schedule: tournamentData.schedule,
          playerStats: tournamentData.playerStats,
          started: true
        });
        setCurrentRound(tournamentData.currentRound || 0);
        setView('tournament');
        console.log('✅ Joined tournament:', id);
      } else {
        alert(`Tournament "${id}" not found. Please check the ID and try again.`);
        setView('home');
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      alert('Error joining tournament. Please try again.');
      setView('home');
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinSubmit = () => {
    const id = joinId.trim().toUpperCase();
    if (id.length !== 6) {
      alert('Tournament ID must be 6 characters');
      return;
    }
    joinTournamentById(id);
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
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinSubmit()}
                  placeholder="Enter Tournament ID"
                  maxLength={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleJoinSubmit}
                  disabled={loading || joinId.length !== 6}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users size={20} />
                      Join Tournament
                    </>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Enter the 6-character tournament ID to join an existing tournament
              </p>
            </div>
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
                className="w-full pAdd as Appgit add .
git commit -m "Add Jass tournament app"
git push -u origin mainThe following snippets may be helpful:
From src/App.jsx in local codebase:

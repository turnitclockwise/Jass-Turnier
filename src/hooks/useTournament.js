
import { useState } from 'react';
import { generateSchedule } from '../services/scheduleService';
import FirebaseService from '../services/tournamentService';

const useTournament = () => {
  const [tournament, setTournament] = useState(null);
  const [tournamentId, setTournamentId] = useState(null);
  const [identifiedPlayer, setIdentifiedPlayer] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(false);

  const startTournament = async (playerNames, numTables, bonusPointsEnabled, bonusPointsPerMatch, setView, setShowShareModal) => {
    const validPlayers = playerNames.filter(name => name.trim() !== '');
    const minPlayers = numTables * 4;

    if (validPlayers.length < minPlayers) {
      alert(`Mindestens ${minPlayers} Spieler benötigt für ${numTables} Tisch(e)`);
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
      pointsAgainst: 0,
      bonusPoints: 0
    }));

    const tournamentData = {
      players: validPlayers,
      playerStats,
      schedule,
      numTables,
      bonusPointsEnabled,
      bonusPointsPerMatch
    };

    try {
      console.log('🚀 Creating tournament...');
      const createdTournament = await FirebaseService.createTournament(tournamentData);
      console.log('📦 Tournament object:', createdTournament);
      
      setTournamentId(createdTournament.id);
      setTournament(tournamentData);
      setView('tournament');
      setShowShareModal(true);
      
      console.log('✅ Tournament setup complete, ID:', createdTournament.id);
    } catch (error) {
      console.error('❌ Error creating tournament:', error);
      alert('Fehler beim Erstellen des Turniers: ' + error.message);
    }
  };

  const joinTournamentById = async (id, setView) => {
    setLoading(true);
    try {
      console.log('🔍 Loading tournament:', id);
      const tournamentData = await FirebaseService.getTournament(id);
      
      if (tournamentData) {
        console.log('✅ Tournament data received:', tournamentData);
        
        const normalizedSchedule = (tournamentData.schedule || []).map(round => {
          if (round && round.matches && !Array.isArray(round.matches)) {
            return { ...round, matches: Object.values(round.matches) };
          }
          return round;
        });

        setTournamentId(id);
        setTournament({
          ...tournamentData,
          players: tournamentData.players || [],
          schedule: normalizedSchedule,
          playerStats: tournamentData.playerStats || [],
          bonusPointsEnabled: tournamentData.bonusPointsEnabled || false,
          bonusPointsPerMatch: tournamentData.bonusPointsPerMatch || 43,
        });
        setView('tournament');
      } else {
        alert(`Turnier "${id}" nöd gfunde`);
        console.warn('❌ Tournament not found');
      }
    } catch (error) {
      console.error('❌ Error joining tournament:', error);
      alert('Fehler bim Biiträte: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearTournament = (setPlayers) => {
    localStorage.removeItem('jassTournament');
    setView('home');
    setTournament(null);
    setTournamentId(null);
    setPlayers([]);
    setIdentifiedPlayer(null);
    console.log('🧹 Tournament cleared from localStorage');
  };

  return {
    tournament,
    setTournament,
    tournamentId,
    setTournamentId,
    identifiedPlayer,
    setIdentifiedPlayer,
    isAdmin,
    setIsAdmin,
    view,
    setView,
    loading,
    setLoading,
    startTournament,
    joinTournamentById,
    clearTournament,
  };
};

export default useTournament;

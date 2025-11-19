
import { useEffect } from 'react';
import FirebaseService from '../services/tournamentService';

const useFirebaseSync = (tournamentId, setTournament) => {
  useEffect(() => {
    if (!tournamentId) return;

    const unsubscribe = FirebaseService.subscribeTournament(tournamentId, (updatedTournament) => {
      if (updatedTournament) {
        console.log('🔄 Tournament updated from Firebase');
        // Basic validation
        const players = updatedTournament.players || [];
        const schedule = updatedTournament.schedule || [];
        const playerStats = updatedTournament.playerStats || [];

        setTournament({
          players,
          schedule,
          playerStats,
          // Keep other top-level properties if they exist
          ...updatedTournament,
        });
      } else {
        console.warn('Received null or empty update from Firebase.');
      }
    });

    return unsubscribe;
  }, [tournamentId, setTournament]);
};

export default useFirebaseSync;

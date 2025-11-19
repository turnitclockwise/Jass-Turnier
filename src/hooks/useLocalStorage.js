
import { useEffect } from 'react';

const useLocalStorage = (tournament, tournamentId, identifiedPlayer, view, rankingMode, showExtendedStats, displayRound) => {
  useEffect(() => {
    // Save to localStorage
    if (tournamentId) {
      const dataToStore = {
        tournament,
        tournamentId,
        identifiedPlayer,
        view,
        rankingMode,
        showExtendedStats,
        displayRound,
      };
      localStorage.setItem('jassTournament', JSON.stringify(dataToStore));
      console.log('💾 Saved to localStorage');
    }
  }, [tournament, tournamentId, identifiedPlayer, view, rankingMode, showExtendedStats, displayRound]);
};

export default useLocalStorage;

import { ref, set, get, onValue, update, runTransaction } from 'firebase/database';
import { database } from './firebase';

// Helper to normalize the tournament data from Firebase
const normalizeTournamentData = (data) => {
  if (!data) return null;

  // Ensure top-level properties are arrays if they exist, or initialize as empty arrays
  data.players = Array.isArray(data.players) ? data.players : Object.values(data.players || {});
  data.playerStats = Array.isArray(data.playerStats) ? data.playerStats : Object.values(data.playerStats || {});
  
  // Normalize schedule and matches
  if (data.schedule && !Array.isArray(data.schedule)) {
    data.schedule = Object.values(data.schedule);
  }
  data.schedule = (data.schedule || []).map(round => {
    if (round && round.matches && !Array.isArray(round.matches)) {
      round.matches = Object.values(round.matches);
    }
    // Ensure scoreSubmission object exists and has a defined status
    if(round && round.matches) {
        round.matches = round.matches.map(match => {
            if (!match.scoreSubmission) {
                match.scoreSubmission = { status: 'none' };
            }
            return match;
        });
    }
    return round;
  });

  return data;
};

const _calculateStandings = (tournamentForCalc) => {
    if (!tournamentForCalc || !tournamentForCalc.playerStats || !tournamentForCalc.schedule) return [];
    
    const stats = JSON.parse(JSON.stringify(tournamentForCalc.playerStats));

    stats.forEach(p => {
      p.totalPoints = 0;
      p.totalMatches = 0;
      p.gamesPlayed = 0;
      p.wins = 0;
      p.losses = 0;
      p.draws = 0;
      p.highestScore = 0;
      p.lowestScore = null;
      p.pointsAgainst = 0;
      p.bonusPoints = 0;
    });

    tournamentForCalc.schedule.forEach(round => {
      if (!round || !round.matches) return;
      const matches = Array.isArray(round.matches) ? round.matches : Object.values(round.matches);
      matches.forEach(match => {
        if (match && match.scoreSubmission && match.scoreSubmission.status === 'verified') {
          const { team1Score, team2Score, team1Matches, team2Matches } = match.scoreSubmission;

          const processPlayer = (playerId, score, opponentScore, matches) => {
            const playerStat = stats[playerId];
            if (playerStat) {
              playerStat.gamesPlayed++;
              playerStat.totalPoints += score;
              playerStat.pointsAgainst += opponentScore;
              playerStat.totalMatches += matches;
              
              if (score > playerStat.highestScore) playerStat.highestScore = score;
              if (playerStat.lowestScore === null || score < playerStat.lowestScore) playerStat.lowestScore = score;
              
              if (score > opponentScore) playerStat.wins++;
              else if (score < opponentScore) playerStat.losses++;
              else playerStat.draws++;
              
              if (tournamentForCalc.bonusPointsEnabled) {
                const bonus = tournamentForCalc.bonusPointsPerMatch * matches;
                playerStat.bonusPoints += bonus;
              }
            }
          };

          match.team1.forEach(pId => processPlayer(pId, team1Score, team2Score, team1Matches));
          match.team2.forEach(pId => processPlayer(pId, team2Score, team1Score, team2Matches));
        }
      });
    });
    return stats;
  };


const FirebaseService = {
  generateId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  async createTournament(tournamentData) {
    const tournamentId = this.generateId();
    const tournamentRef = ref(database, 'tournaments/' + tournamentId);
    
    const dataToSave = {
      ...tournamentData,
      id: tournamentId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    await set(tournamentRef, dataToSave);
    return dataToSave;
  },

  async getTournament(tournamentId) {
    const tournamentRef = ref(database, 'tournaments/' + tournamentId);
    const snapshot = await get(tournamentRef);
    if (snapshot.exists()) {
      return normalizeTournamentData(snapshot.val());
    } else {
      return null;
    }
  },

  subscribeTournament(tournamentId, callback) {
    const tournamentRef = ref(database, 'tournaments/' + tournamentId);
    const unsubscribe = onValue(tournamentRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(normalizeTournamentData(snapshot.val()));
      }
    });
    return unsubscribe;
  },

  async updateMatch(tournamentId, roundIndex, matchId, newScoreSubmission) {
    const tournamentRef = ref(database, 'tournaments/' + tournamentId);
    
    try {
      await runTransaction(tournamentRef, (currentData) => {
        if (currentData) {
          const matchIndex = parseInt(matchId.split('-')[1].substring(1), 10);
          if (isNaN(matchIndex) || !currentData.schedule?.[roundIndex]?.matches?.[matchIndex]) {
            console.error("Match not found for update:", matchId);
            return;
          }
          
          currentData.schedule[roundIndex].matches[matchIndex].scoreSubmission = newScoreSubmission;

          if (newScoreSubmission.status === 'verified' || newScoreSubmission.status === 'none') {
            const updatedStats = _calculateStandings(currentData);
            currentData.playerStats = updatedStats;
          }
          
          return currentData;
        }
        return currentData;
      });
      console.log('Transaction for score update committed successfully!');
    } catch (error) {
      console.error('Transaction for score update failed: ', error);
    }
  },
};

export default FirebaseService;

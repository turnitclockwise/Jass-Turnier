export const Validators = {
  validateScore(team1Score, team2Score) {
    const total = team1Score + team2Score;
    if (total !== 628) {
      return { valid: false, error: 'Summe muss genau 628 ergeben!' };
    }
    return { valid: true };
  },

  validateMatches(team1Matches, team2Matches) {
    const total = team1Matches + team2Matches;
    if (total > 4) {
      return { valid: false, error: 'Total Matches kann 4 nicht übersteigen' };
    }
    return { valid: true };
  },

  validatePlayerCount(playerCount, numTables) {
    const minPlayers = numTables * 4;
    if (playerCount < minPlayers) {
      return { 
        valid: false, 
        error: `Mindestens ${minPlayers} Spieler benötigt für ${numTables} Tisch(e)` 
      };
    }
    return { valid: true };
  }
};


const generateTeamSchedule = (players, tables, fixedTeams) => {
    const teams = fixedTeams.map(team => team.map(p => parseInt(p, 10)));
    const numTeams = teams.length;
    const schedule = [];
    const rounds = numTeams - (numTeams % 2 === 0 ? 1 : 0);

    const maxMatchesPerRound = tables;
    const teamsPlayingPerRound = Math.min(numTeams, maxMatchesPerRound * 2);
    const numMatchesPerRound = Math.floor(teamsPlayingPerRound / 2);
    const breaksPerRound = numTeams - (numMatchesPerRound * 2);

    const usedOpponentTeams = new Map();
    for (let i = 0; i < numTeams; i++) {
        for (let j = i + 1; j < numTeams; j++) {
            usedOpponentTeams.set(`${i}-${j}`, 0);
        }
    }
    
    const breakCount = new Array(numTeams).fill(0);
    const lastBreak = new Array(numTeams).fill(-2);

    for (let round = 0; round < rounds; round++) {
        const roundMatches = [];
        let availableTeams = [...Array(numTeams).keys()];
        const sittingTeams = [];

        if (breaksPerRound > 0) {
            const breakPriority = availableTeams.map(t => ({
                team: t,
                breaks: breakCount[t],
                lastBreak: lastBreak[t],
                priorityScore: -breakCount[t] * 1000 + (lastBreak[t] === round - 1 ? -10000 : 0)
            })).sort((a, b) => b.priorityScore - a.priorityScore);
            
            for (let i = 0; i < breaksPerRound; i++) {
                let selectedTeam = null;
                for (const candidate of breakPriority) {
                    if (!sittingTeams.includes(candidate.team)) {
                        selectedTeam = candidate.team;
                        break;
                    }
                }
                if (selectedTeam !== null) {
                    sittingTeams.push(selectedTeam);
                    breakCount[selectedTeam]++;
                    lastBreak[selectedTeam] = round;
                }
            }
        }
        
        availableTeams = availableTeams.filter(t => !sittingTeams.includes(t));
        
        const usedTeamsInRound = new Set();
        
        for (let t = 0; t < numMatchesPerRound; t++) {
            let bestMatch = null;
            let bestScore = -Infinity;
            let availableForMatch = availableTeams.filter(teamIdx => !usedTeamsInRound.has(teamIdx));
            if (availableForMatch.length < 2) break;

            for (let i = 0; i < availableForMatch.length; i++) {
                for (let j = i + 1; j < availableForMatch.length; j++) {
                    const teamA_idx = availableForMatch[i];
                    const teamB_idx = availableForMatch[j];

                    const oppKey = `${Math.min(teamA_idx, teamB_idx)}-${Math.max(teamA_idx, teamB_idx)}`;
                    const oppScore = usedOpponentTeams.get(oppKey) || 0;
                    const score = -oppScore;

                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = { teamA: teamA_idx, teamB: teamB_idx, oppKey: oppKey };
                    }
                }
            }

            if (bestMatch) {
                roundMatches.push({
                    id: `r${round}-m${t}`,
                    table: t + 1,
                    team1: teams[bestMatch.teamA].sort((a,b) => a-b),
                    team2: teams[bestMatch.teamB].sort((a,b) => a-b),
                    scoreSubmission: { status: 'none', team1Score: null, team2Score: null, team1Matches: 0, team2Matches: 0, submittedBy: null, submittedAt: null, verifiedBy: null, verifiedAt: null, disputedBy: null, disputeReason: '', disputedAt: null, autoAccepted: false }
                });

                usedOpponentTeams.set(bestMatch.oppKey, (usedOpponentTeams.get(bestMatch.oppKey) || 0) + 1);
                usedTeamsInRound.add(bestMatch.teamA);
                usedTeamsInRound.add(bestMatch.teamB);
            }
        }
        
        const sittingPlayers = sittingTeams.map(teamIndex => teams[teamIndex]).flat();
        
        const allPlayersInTeams = teams.flat();
        const playersWithNoTeam = players.map((_,i) => i).filter(p => !allPlayersInTeams.includes(p));

        schedule.push({
            roundNumber: round + 1,
            matches: roundMatches,
            sitting: [...sittingPlayers, ...playersWithNoTeam].sort((a,b) => a-b)
        });
    }
    return schedule;
};


const generateIndividualSchedule = (players, tables, fixedTeams = []) => {
    const n = players.length;
    const rounds = n - 1;
    const schedule = [];
    const maxPlayersPerRound = tables * 4;
    const playersPerRound = Math.floor(Math.min(n, maxPlayersPerRound) / 4) * 4;
    const breaksPerRound = n - playersPerRound;
    const usedPartnerships = new Set();
    const usedOpponents = new Map();

    const playerToPartner = new Map();
    if (fixedTeams) {
        fixedTeams.forEach(team => {
            if (team[0] && team[1]) {
                playerToPartner.set(parseInt(team[0], 10), parseInt(team[1], 10));
                playerToPartner.set(parseInt(team[1], 10), parseInt(team[0], 10));
            }
        });
    }

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
            let partnershipPenalty = 0;
            if (playerToPartner.size > 0) {
                const [p1_t1, p2_t1] = config.team1;
                if (playerToPartner.has(p1_t1) && playerToPartner.get(p1_t1) !== p2_t1) {
                    partnershipPenalty += 1000;
                } else if (playerToPartner.has(p2_t1) && playerToPartner.get(p2_t1) !== p1_t1) {
                    partnershipPenalty += 1000;
                }

                const [p1_t2, p2_t2] = config.team2;
                if (playerToPartner.has(p1_t2) && playerToPartner.get(p1_t2) !== p2_t2) {
                    partnershipPenalty += 1000;
                } else if (playerToPartner.has(p2_t2) && playerToPartner.get(p2_t2) !== p1_t2) {
                    partnershipPenalty += 1000;
                }
            }

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
            
            if (p1Used && p2Used && round < rounds / 2) continue;
            
            partnershipPenalty += (p1Used ? 50 : 0) + (p2Used ? 50 : 0);
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


export const generateSchedule = (players, tables, fixedTeams = []) => {
    const n = players.length;

    if (fixedTeams && fixedTeams.length > 1 && fixedTeams.every(t => t[0] !== '' && t[1] !== '')) {
        const playerInTeamSet = new Set(fixedTeams.flat().map(p => parseInt(p, 10)));
        const numPlayersInTeams = playerInTeamSet.size;

        if (numPlayersInTeams === n || numPlayersInTeams === n - 1) {
             if ((numPlayersInTeams % 2) === 0 && fixedTeams.length === numPlayersInTeams / 2) {
                return generateTeamSchedule(players, tables, fixedTeams);
             }
        }
    }

    return generateIndividualSchedule(players, tables, fixedTeams);
};

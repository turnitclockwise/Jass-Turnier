
import React, { useState, useCallback, useEffect } from 'react';
import useTournament from './hooks/useTournament';
import useLocalStorage from './hooks/useLocalStorage';
import useFirebaseSync from './hooks/useFirebaseSync';
import FirebaseService from './services/tournamentService';

import Home from './components/Home';
import Setup from './components/Setup';
import Tournament from './components/Tournament';
import ShareModal from './components/ShareModal';
import IdentityModal from './components/IdentityModal';

const App = () => {
  const {
    tournament,
    setTournament,
    tournamentId,
    setTournamentId,
    identifiedPlayer,
    setIdentifiedPlayer,
    isAdmin,
    view,
    setView,
    loading,
    startTournament: createTournament,
    joinTournamentById,
    clearTournament,
  } = useTournament();

  const [numTables, setNumTables] = useState(1);
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [bonusPointsEnabled, setBonusPointsEnabled] = useState(true);
  const [bonusPointsPerMatch, setBonusPointsPerMatch] = useState(43);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [rankingMode, setRankingMode] = useState('total');
  const [showExtendedStats, setShowExtendedStats] = useState(false);
  const [displayRound, setDisplayRound] = useState(0);

  useLocalStorage(tournament, tournamentId, identifiedPlayer, view, rankingMode, showExtendedStats, displayRound);
  useFirebaseSync(tournamentId, setTournament);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTournamentId = urlParams.get('tournamentId');

    if (urlTournamentId) {
      console.log(`🎯 Found tournament ID in URL: ${urlTournamentId}. Joining...`);
      handleJoinTournament(urlTournamentId);
    } else {
      const savedState = localStorage.getItem('jassTournament');
      if (savedState) {
        try {
          const {
            tournamentId: savedTournamentId,
            identifiedPlayer: savedIdentifiedPlayer,
            view: savedView,
            rankingMode: savedRankingMode,
            showExtendedStats: savedShowExtendedStats,
            displayRound: savedDisplayRound,
          } = JSON.parse(savedState);

          if (savedTournamentId) {
            console.log('🔄 Restoring session from localStorage...');
            setTournamentId(savedTournamentId);
            setIdentifiedPlayer(savedIdentifiedPlayer || null);
            setView(savedView || 'tournament');
            setRankingMode(savedRankingMode || 'total');
            setShowExtendedStats(savedShowExtendedStats || false);
            setDisplayRound(savedDisplayRound || 0);
            console.log('✅ Session restored.');
          }
        } catch (error) {
          console.error('❌ Failed to parse or restore from localStorage:', error);
          localStorage.removeItem('jassTournament');
        }
      }
    }
  }, []);

  const addPlayer = () => setPlayerNames([...playerNames, '']);
  const removePlayer = (idx) => setPlayerNames(playerNames.filter((_, i) => i !== idx));
  const updatePlayerName = (idx, name) => {
    const newNames = [...playerNames];
    newNames[idx] = name;
    setPlayerNames(newNames);
  };

  const handleStartTournament = () => {
    createTournament(playerNames, numTables, bonusPointsEnabled, bonusPointsPerMatch, setView, setShowShareModal);
  };

  const handleJoinTournament = (id) => {
    joinTournamentById(id, setView);
  };

  const identifyAsPlayer = (id) => {
    setIdentifiedPlayer(id);
    setShowIdentityModal(false);
  };

  const isPlayerInMatch = (match) => {
    if (identifiedPlayer === null || !match) return false;
    return match.team1.includes(identifiedPlayer) || match.team2.includes(identifiedPlayer);
  };

  const getStandings = useCallback(() => {
    if (!tournament || !tournament.playerStats) return [];
    const standings = [...tournament.playerStats];
    return standings.sort((a, b) => (b.totalPoints + (b.bonusPoints || 0)) - (a.totalPoints + (a.bonusPoints || 0)));
  }, [tournament]);

  const getStandingsByAverage = useCallback(() => {
    if (!tournament || !tournament.playerStats) return [];
    const standings = [...tournament.playerStats];
    return standings.sort((a, b) => {
      const avgA = a.gamesPlayed > 0 ? ((a.totalPoints + (a.bonusPoints || 0)) / a.gamesPlayed) : 0;
      const avgB = b.gamesPlayed > 0 ? ((b.totalPoints + (b.bonusPoints || 0)) / b.gamesPlayed) : 0;
      return avgB - avgA;
    });
  }, [tournament]);

  const handleScoreUpdate = (roundIdx, matchIdx, newSubmission) => {
    if (tournamentId) {
      const matchKey = `r${roundIdx}-m${matchIdx}`;
      FirebaseService.updateMatch(tournamentId, roundIdx, matchKey, newSubmission);
    }
  };

  const submitScore = (roundIdx, matchIdx, team1Score, team2Score, team1Matches, team2Matches) => {
    const newSubmission = {
      status: 'pending',
      team1Score, team2Score, team1Matches, team2Matches,
      submittedBy: identifiedPlayer,
      submittedAt: Date.now(),
    };
    handleScoreUpdate(roundIdx, matchIdx, newSubmission);
  };

  const verifyScore = (roundIdx, matchIdx) => {
    const match = tournament.schedule[roundIdx]?.matches[matchIdx];
    if (!match || !match.scoreSubmission) return;

    if (match.scoreSubmission.submittedBy === identifiedPlayer) {
      alert('You cannot verify a score you submitted.');
      return;
    }

    const updatedSubmission = {
      ...match.scoreSubmission,
      status: 'verified',
      verifiedBy: identifiedPlayer,
      verifiedAt: Date.now(),
    };
    handleScoreUpdate(roundIdx, matchIdx, updatedSubmission);
  };

  const disputeScore = (roundIdx, matchIdx, reason) => {
    const match = tournament.schedule[roundIdx]?.matches[matchIdx];
    if (!match || !match.scoreSubmission) return;

    const updatedSubmission = {
      ...match.scoreSubmission,
      status: 'disputed',
      disputedBy: identifiedPlayer,
      disputeReason: reason,
      disputedAt: Date.now(),
    };
    handleScoreUpdate(roundIdx, matchIdx, updatedSubmission);
  };

  const resolveDispute = (roundIdx, matchIdx, accept) => {
    const match = tournament.schedule[roundIdx]?.matches[matchIdx];
    if (!match || !match.scoreSubmission) return;

    let updatedSubmission;
    if (accept) {
      updatedSubmission = { ...match.scoreSubmission, status: 'verified' };
    } else {
      updatedSubmission = { 
        status: 'none', team1Score: null, team2Score: null, team1Matches: 0, team2Matches: 0, 
      };
    }
    handleScoreUpdate(roundIdx, matchIdx, updatedSubmission);
  };

  if (view === 'home') {
    return <Home setView={setView} joinTournamentById={handleJoinTournament} joinId={joinId} setJoinId={setJoinId} loading={loading} />;
  } else if (view === 'setup') {
    return (
      <Setup
        numTables={numTables}
        setNumTables={setNumTables}
        playerNames={playerNames}
        addPlayer={addPlayer}
        removePlayer={removePlayer}
        updatePlayerName={updatePlayerName}
        bonusPointsEnabled={bonusPointsEnabled}
        setBonusPointsEnabled={setBonusPointsEnabled}
        bonusPointsPerMatch={bonusPointsPerMatch}
        setBonusPointsPerMatch={setBonusPointsPerMatch}
        startTournament={handleStartTournament}
      />
    );
  } else if (view === 'tournament' && tournament) {
    return (
      <>
        <Tournament
          tournament={tournament}
          currentRound={displayRound}
          setCurrentRound={setDisplayRound}
          tournamentId={tournamentId}
          setShowShareModal={setShowShareModal}
          clearTournament={() => clearTournament(setPlayerNames)}
          setShowIdentityModal={setShowIdentityModal}
          identifiedPlayer={identifiedPlayer}
          rankingMode={rankingMode}
          setRankingMode={setRankingMode}
          showExtendedStats={showExtendedStats}
          setShowExtendedStats={setShowExtendedStats}
          getStandings={getStandings}
          getStandingsByAverage={getStandingsByAverage}
          isPlayerInMatch={isPlayerInMatch}
          submitScore={submitScore}
          verifyScore={verifyScore}
          disputeScore={disputeScore}
          resolveDispute={resolveDispute}
          isAdmin={isAdmin}
        />
        {showShareModal && <ShareModal tournamentId={tournamentId} setShowShareModal={setShowShareModal} />}
        {showIdentityModal && (
          <IdentityModal
            tournament={tournament}
            identifiedPlayer={identifiedPlayer}
            identifyAsPlayer={identifyAsPlayer}
            setShowIdentityModal={setShowIdentityModal}
          />
        )}
      </>
    );
  }
  return null;
};

export default App;

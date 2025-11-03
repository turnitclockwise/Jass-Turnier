import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, off, update } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUvM9YU7zNrDQhaEPrdowI0J6z3a81zBc",

  authDomain: "jass-turnierplan.firebaseapp.com",

  databaseURL: "https://jass-turnierplan-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "jass-turnierplan",

  storageBucket: "jass-turnierplan.firebasestorage.app",

  messagingSenderId: "751293431135",

  appId: "1:751293431135:web:632367007426a3672c0aea"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const FirebaseService = {
  enabled: true,

  generateId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  async createTournament(tournamentData) {
    if (!this.enabled) {
      return {
        ...tournamentData,
        id: this.generateId(),
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
    }
    const tournamentId = this.generateId();
    const tournamentRef = ref(db, 'tournaments/' + tournamentId);
    const newTournament = {
      ...tournamentData,
      id: tournamentId,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    };
    await set(tournamentRef, newTournament);
    return newTournament;
  },

  async getTournament(tournamentId) {
    if (!this.enabled) return null;
    const tournamentRef = ref(db, 'tournaments/' + tournamentId);
    const snapshot = await get(tournamentRef);
    return snapshot.val();
  },

  subscribeTournament(tournamentId, callback) {
    if (!this.enabled) return () => {};
    const tournamentRef = ref(db, 'tournaments/' + tournamentId);
    const unsubscribe = onValue(tournamentRef, (snapshot) => {
      callback(snapshot.val());
    });
    return unsubscribe;
  },

  async updateMatch(tournamentId, roundIndex, matchId, matchData) {
    if (!this.enabled) return;
    const matchRef = ref(db, `tournaments/${tournamentId}/rounds/${roundIndex}/matches/${matchId}`);
    await update(matchRef, matchData);
  },

  async updatePlayerStats(tournamentId, playerStats) {
    if (!this.enabled) return;
    const playerStatsRef = ref(db, `tournaments/${tournamentId}/playerStats`);
    await update(playerStatsRef, playerStats);
  },

  async updateCurrentRound(tournamentId, roundIndex) {
    if (!this.enabled) return;
    const currentRoundRef = ref(db, `tournaments/${tournamentId}/currentRound`);
    await set(currentRoundRef, roundIndex);
  }
};

export default FirebaseService;
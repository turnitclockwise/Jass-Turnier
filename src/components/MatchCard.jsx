
import React, { useState } from 'react';
import { Table, Clock, AlertCircle, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { Validators } from '../utils/validators';

const MatchCard = ({
  match,
  tournament,
  roundIdx,
  matchIdx,
  identifiedPlayer,
  isPlayerInMatch,
  isAdmin,
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
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  const { scoreSubmission } = match || {};

  if (!scoreSubmission) {
    return (
        <div className="border-2 border-gray-700 rounded-lg p-4 mb-4 bg-gray-800">
            <p className="text-gray-300">Loading scores...</p>
        </div>
    );
  }

  const canSubmit = identifiedPlayer !== null && isPlayerInMatch && scoreSubmission.status === 'none';
  const canVerify = identifiedPlayer !== null && isPlayerInMatch && 
                    scoreSubmission.status === 'pending' && 
                    scoreSubmission.submittedBy !== identifiedPlayer;
  const canEdit = scoreSubmission.status === 'verified' && (isAdmin || isPlayerInMatch);

  const validateAll = (s1, s2, m1, m2) => {
    const scoreValidation = Validators.validateScore(s1, s2);
    const matchesValidation = Validators.validateMatches(m1, m2);
    const newErrors = {};
    if (!scoreValidation.valid) newErrors.score = scoreValidation.error;
    if (!matchesValidation.valid) newErrors.matches = matchesValidation.error;
    setErrors(newErrors);
    return scoreValidation.valid && matchesValidation.valid;
  };

  const handleTeam1Change = (value) => {
    const score1 = parseInt(value) || 0;
    setTeam1Score(value);
    if (value !== '') {
      const score2 = 628 - score1;
      if (score2 >= 0 && score2 <= 628) {
        setTeam2Score(score2.toString());
        validateAll(score1, score2, team1Matches, team2Matches);
      } else {
        validateAll(score1, parseInt(team2Score) || 0, team1Matches, team2Matches);
      }
    }
  };

  const handleTeam2Change = (value) => {
    const score2 = parseInt(value) || 0;
    setTeam2Score(value);
    if (value !== '') {
      const score1 = 628 - score2;
      if (score1 >= 0 && score1 <= 628) {
        setTeam1Score(score1.toString());
        validateAll(score1, score2, team1Matches, team2Matches);
      } else {
        validateAll(parseInt(team1Score) || 0, score2, team1Matches, team2Matches);
      }
    }
  };

  const handleMatchesChange = (setter, value, isTeam1) => {
    const val = parseInt(value) || 0;
    setter(val);
    const m1 = isTeam1 ? val : team1Matches;
    const m2 = isTeam1 ? team2Matches : val;
    validateAll(parseInt(team1Score) || 0, parseInt(team2Score) || 0, m1, m2);
  };

  const handleSubmit = () => {
    const score1 = parseInt(team1Score) || 0;
    const score2 = parseInt(team2Score) || 0;
    if (!validateAll(score1, score2, team1Matches, team2Matches)) return;

    if (isEditing) {
      onSubmitScore(roundIdx, matchIdx, score1, score2, team1Matches, team2Matches, true);
      setIsEditing(false);
    } else {
      onSubmitScore(roundIdx, matchIdx, score1, score2, team1Matches, team2Matches);
    }
    setTeam1Score('');
    setTeam2Score('');
    setTeam1Matches(0);
    setTeam2Matches(0);
    setErrors({});
  };

  const handleEdit = () => {
    setTeam1Score(scoreSubmission.team1Score.toString());
    setTeam2Score(scoreSubmission.team2Score.toString());
    setTeam1Matches(scoreSubmission.team1Matches);
    setTeam2Matches(scoreSubmission.team2Matches);
    setIsEditing(true);
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
        return <AlertCircle className="text-yellow-400" size={20} />;
      case 'verified':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'disputed':
        return <XCircle className="text-red-400" size={20} />;
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
    <div className="border-2 border-gray-700 rounded-lg p-4 mb-4 bg-green-carpet bg-cover bg-center">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <Table className="text-white" size={20} />
          <span className="font-bold text-white">Table {match.table}</span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm text-gray-300">{getStatusText()}</span>
        </div>
      </div>

      <div className="bg-slate-board bg-cover bg-center rounded-lg p-4 border-4 border-dark-brown">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 rounded-lg">
            <p className="text-xs font-semibold text-gray-200 mb-1">TEAM 1</p>
            {match.team1.map(id => (
              <p key={id} className="text-sm text-white">{tournament.players[id]}</p>
            ))}
          </div>
          <div className="p-3 rounded-lg">
            <p className="text-xs font-semibold text-gray-200 mb-1">TEAM 2</p>
            {match.team2.map(id => (
              <p key={id} className="text-sm text-white">{tournament.players[id]}</p>
            ))}
          </div>
        </div>

        {(scoreSubmission.status === 'none' || isEditing) && canSubmit && (
          <div className={`space-y-3 ${isEditing ? 'bg-blue-900/20 border border-blue-500/30 rounded-lg p-3' : ''}`}>
            {isEditing && <p className="text-sm font-medium text-blue-300 mb-2">✏️ Editing Score</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Team 1 Score</label>
                <input
                  type="number"
                  min="0"
                  max="628"
                  value={team1Score}
                  onChange={(e) => handleTeam1Change(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                  placeholder="0-628"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Team 2 Score</label>
                <input
                  type="number"
                  min="0"
                  max="628"
                  value={team2Score}
                  onChange={(e) => handleTeam2Change(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                  placeholder="Auto-calculated"
                />
              </div>
            </div>
            {errors.score && <p className="text-red-400 text-xs mt-1">{errors.score}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Team 1 Matches</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={team1Matches}
                  onChange={(e) => handleMatchesChange(setTeam1Matches, e.target.value, true)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Team 2 Matches</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={team2Matches}
                  onChange={(e) => handleMatchesChange(setTeam2Matches, e.target.value, false)}
                  className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-thunderbird"
                />
              </div>
            </div>
            {errors.matches && <p className="text-red-400 text-xs mt-1">{errors.matches}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-thunderbird text-white rounded-lg hover:bg-red-700 font-medium disabled:bg-gray-600"
                disabled={Object.keys(errors).length > 0}
              >
                {isEditing ? 'Update Score' : 'Submit Score'}
              </button>
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {scoreSubmission.status === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <p className="font-semibold text-yellow-300">Team 1: {scoreSubmission.team1Score}</p>
                <p className="text-yellow-400">Matches: {scoreSubmission.team1Matches} 🏆</p>
              </div>
              <div>
                <p className="font-semibold text-yellow-300">Team 2: {scoreSubmission.team2Score}</p>
                <p className="text-yellow-400">Matches: {scoreSubmission.team2Matches} 🏆</p>
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

        {scoreSubmission.status === 'verified' && !isEditing && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="grid grid-cols-2 gap-2 text-sm flex-1">
                <div>
                  <p className="font-semibold text-green-300">Team 1: {scoreSubmission.team1Score}</p>
                  <p className="text-green-400">Matches: {scoreSubmission.team1Matches} 🏆</p>
                </div>
                <div>
                  <p className="font-semibold text-green-300">Team 2: {scoreSubmission.team2Score}</p>
                  <p className="text-green-400">Matches: {scoreSubmission.team2Matches} 🏆</p>
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={handleEdit}
                  className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                  title="Edit Score"
                >
                  <Edit2 size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {scoreSubmission.status === 'disputed' && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm font-medium text-red-300 mb-2">⚠️ Score Disputed</p>
            <p className="text-sm text-red-400 mb-2">{scoreSubmission.disputeReason}</p>
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
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-gray-100 mb-4">Dispute Score</h3>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Explain why you're disputing this score..."
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-thunderbird mb-4"
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
                  className="flex-1 px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;

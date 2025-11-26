import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, PlusCircle, Users } from 'lucide-react';

const Home = ({ setView, joinTournamentById, joinId, setJoinId, loading }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-shark p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <Trophy className="text-thunderbird mx-auto mb-4" size={64} />
          <h1 className="text-4xl font-bold text-gray-100 mb-2">{t('home.title')}</h1>
          <p className="text-gray-300 mb-8">{t('home.subtitle')}</p>
          
          <div className="space-y-4">
            <button
              onClick={() => setView('setup')}
              className="w-full py-4 bg-thunderbird text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-3 text-lg font-semibold"
            >
              <PlusCircle size={24} />
              {t('home.new_tournament')}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">{t('home.or')}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <input
                type="text"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && joinId.length === 6 && joinTournamentById(joinId)}
                placeholder={t('home.tournament_id_placeholder')}
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-lg text-center text-lg font-mono tracking-widest uppercase text-white focus:ring-2 focus:ring-thunderbird"
              />
              <button
                onClick={() => joinTournamentById(joinId)}
                disabled={loading || joinId.length !== 6}
                className="w-full py-3 bg-thunderbird text-white rounded-lg hover:bg-red-700 disabled:bg-gray-500 flex items-center justify-center gap-2 font-semibold"
              >
                {loading ? t('home.loading') : (
                  <>
                    <Users size={20} />
                    {t('home.join_tournament')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

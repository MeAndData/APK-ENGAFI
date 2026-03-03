import React, { useState, useEffect } from 'react';
import { db } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { Moon, Sun, Type, Eye, Trash2, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsScreen: React.FC = () => {
  const [githubUser, setGithubUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const user = await response.json();
        setGithubUser(user);
      } else {
        setGithubUser(null);
      }
    } catch (e) {
      console.error('Failed to fetch user:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchUser();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();

      const authWindow = window.open(
        url,
        'github_oauth',
        'width=600,height=700'
      );

      if (!authWindow) {
        alert('Пожалуйста, разрешите всплывающие окна для подключения аккаунта GitHub.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setGithubUser(null);
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const settings = useLiveQuery(() => {
    try {
      return db.settings.toArray();
    } catch (e) {
      console.error('Settings query failed:', e);
      return Promise.resolve([]);
    }
  }, []);
  
  const getSetting = (key: string, defaultValue: any) => {
    const s = settings?.find(x => x.key === key);
    return s ? s.value : defaultValue;
  };

  const updateSetting = async (key: string, value: any) => {
    await db.settings.put({ key, value });
  };

  const theme = getSetting('theme', 'light');
  const textSize = getSetting('textSize', 'M');
  const translationMode = getSetting('translationMode', 'all');

  const resetProgress = async () => {
    if (window.confirm('Вы уверены, что хотите сбросить весь прогресс и избранное?')) {
      await db.favorites.clear();
      await db.learning_progress.clear();
      alert('Прогресс сброшен');
    }
  };

  const resetAll = async () => {
    if (window.confirm('Это удалит все данные и потребует повторного импорта. Продолжить?')) {
      await db.delete();
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="sticky top-0 bg-white z-30 px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Настройки</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Appearance */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Внешний вид</label>
          
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">Тема оформления</p>
                <p className="text-[10px] text-gray-400 font-medium">Светлая или темная</p>
              </div>
            </div>
            <select 
              value={theme} 
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="light">Светлая</option>
              <option value="dark">Темная</option>
            </select>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                <Type size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">Размер текста</p>
                <p className="text-[10px] text-gray-400 font-medium">Масштаб шрифта</p>
              </div>
            </div>
            <div className="flex bg-white p-1 rounded-lg border border-gray-200">
              {['S', 'M', 'L'].map(size => (
                <button
                  key={size}
                  onClick={() => updateSetting('textSize', size)}
                  className={`px-3 py-1 rounded text-[10px] font-black transition-all ${
                    textSize === size ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Translation Mode */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Отображение</label>
          <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                <Eye size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">Режим перевода</p>
                <p className="text-[10px] text-gray-400 font-medium">Какие языки показывать в списке</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'all', label: 'Все языки (EN, RU, TJ)' },
                { id: 'en-ru', label: 'Английский + Русский' },
                { id: 'en-tj', label: 'Английский + Таджикский' },
                { id: 'study', label: 'Учебный (скрыть переводы)' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => updateSetting('translationMode', mode.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${
                    translationMode === mode.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                      : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                  }`}
                >
                  {mode.label}
                  {translationMode === mode.id && <ChevronRight size={16} />}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* GitHub Integration */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Аккаунт</label>
          <div className="bg-gray-50 rounded-2xl p-4">
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw size={20} className="animate-spin text-gray-400" />
              </div>
            ) : githubUser ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={githubUser.avatar_url} 
                    alt={githubUser.login} 
                    className="w-10 h-10 rounded-full border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-800">{githubUser.name || githubUser.login}</p>
                    <p className="text-[10px] text-gray-400 font-medium">@{githubUser.login}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-white border border-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="text-center">
                  <p className="font-bold text-sm text-gray-800">GitHub</p>
                  <p className="text-[10px] text-gray-400 font-medium">Подключите GitHub для синхронизации</p>
                </div>
                <button
                  onClick={handleConnect}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Подключить GitHub
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Data Management */}
        <section className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">Данные</label>
          <button
            onClick={resetProgress}
            className="w-full bg-amber-50 rounded-2xl p-4 flex items-center gap-4 text-amber-700 hover:bg-amber-100 transition-all active:scale-[0.98]"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <RefreshCw size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Сбросить прогресс</p>
              <p className="text-[10px] font-medium opacity-70">Очистить избранное и историю</p>
            </div>
          </button>

          <button
            onClick={resetAll}
            className="w-full bg-red-50 rounded-2xl p-4 flex items-center gap-4 text-red-700 hover:bg-red-100 transition-all active:scale-[0.98]"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Trash2 size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">Сбросить всё</p>
              <p className="text-[10px] font-medium opacity-70">Удалить базу данных и настройки</p>
            </div>
          </button>
        </section>

        <div className="pt-8 pb-4 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Vocabulary App v1.0.0</p>
          <p className="text-[10px] text-gray-400 mt-1">Made with ❤️ for EN/RU/TJ learners</p>
        </div>
      </div>
    </div>
  );
};

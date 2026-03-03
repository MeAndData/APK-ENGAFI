import React, { useState } from 'react';
import { db, normalizeText } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { Star, Search, X, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FavoritesScreen: React.FC = () => {
  const [type, setType] = useState<'words' | 'phrases'>('words');
  const [query, setQuery] = useState('');

  const favorites = useLiveQuery(() => {
    const typeKey = type.slice(0, -1) as 'word' | 'phrase';
    return db.favorites.where('type').equals(typeKey).toArray().then(async favs => {
      try {
        const itemIds = favs.map(f => f.itemId);
        
        let items: any[] = [];
        if (type === 'words') {
          items = await db.words.where('id').anyOf(itemIds).toArray();
        } else {
          items = await db.phrases.where('id').anyOf(itemIds).toArray();
        }

        if (query) {
          const normalized = normalizeText(query);
          items = items.filter(item => 
            item.search_en.includes(normalized) || 
            item.search_ru.includes(normalized) || 
            item.search_tj.includes(normalized)
          );
        }

        return items;
      } catch (e) {
        console.error('Favorites query failed:', e);
        return [];
      }
    }).catch(e => {
      console.error('Favorites outer query failed:', e);
      return [];
    });
  }, [type, query]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="sticky top-0 bg-white z-30 px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Избранное</h1>
        
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск в избранном..."
            className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setType('words')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'words' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Слова
          </button>
          <button
            onClick={() => setType('phrases')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              type === 'phrases' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            Фразы
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {favorites?.map(item => (
          <FavoriteItem key={item.id} item={item} type={type} />
        ))}
        {favorites?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Star size={48} className="mb-4 opacity-20" />
            <p className="text-sm">В избранном пока пусто</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FavoriteItem: React.FC<{ item: any, type: 'words' | 'phrases' }> = ({ item, type }) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item?.id) return;
    const typeKey = type.slice(0, -1) as 'word' | 'phrase';
    try {
      await db.favorites.delete([item.id, typeKey]);
    } catch (e) {
      console.error('Delete favorite failed:', e);
    }
  };

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.en}</h3>
          <p className="text-sm text-gray-500 font-medium">{item.ru}</p>
        </div>
        <button onClick={toggleFavorite} className="p-2 text-amber-400 hover:text-gray-300 transition-colors">
          <Star size={18} fill="currentColor" />
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-50"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Таджикский</span>
            <p className="text-indigo-600 font-bold">{item.tj}</p>
            <div className="flex gap-2 mt-2">
              {item.level && (
                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                  {item.level}
                </span>
              )}
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">
                {item.category}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

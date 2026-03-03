import React, { useState } from 'react';
import { db, type Phrase } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { MessageSquare, Star, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PhrasesScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useLiveQuery(() => {
    return db.phrases.orderBy('category').uniqueKeys() as Promise<string[]>;
  }, []);

  const phrases = useLiveQuery(() => {
    if (!selectedCategory) return db.phrases.limit(100).toArray();
    return db.phrases.where('category').equals(selectedCategory).toArray();
  }, [selectedCategory]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="sticky top-0 bg-white z-30 px-6 py-4 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Разговорник</h1>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              !selectedCategory ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            Все
          </button>
          {categories?.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === c ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {phrases?.map(p => (
          <PhraseItem key={p.id} phrase={p} />
        ))}
        {phrases?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Нет фраз в этой категории</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PhraseItem: React.FC<{ phrase: Phrase }> = ({ phrase }) => {
  const [expanded, setExpanded] = useState(false);
  const isFavorite = useLiveQuery(() => {
    if (!phrase?.id) return Promise.resolve(false);
    return db.favorites.get([phrase.id, 'phrase']).then(fav => !!fav);
  }, [phrase.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phrase?.id) return;
    try {
      const fav = await db.favorites.get([phrase.id, 'phrase']);
      if (fav) {
        await db.favorites.delete([phrase.id, 'phrase']);
      } else {
        await db.favorites.put({ itemId: phrase.id, type: 'phrase', createdAt: Date.now() });
      }
    } catch (e) {
      console.error('Toggle favorite failed:', e);
    }
  };

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">{phrase.en}</h3>
          <p className="text-sm text-gray-500 font-medium">{phrase.ru}</p>
        </div>
        <button onClick={toggleFavorite} className={`p-2 transition-colors ${isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
          <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-2"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Таджикский</span>
              <p className="text-indigo-600 font-bold">{phrase.tj}</p>
            </div>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold self-start">
              {phrase.category}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

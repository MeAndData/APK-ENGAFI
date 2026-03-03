import React, { useState } from 'react';
import { db, type Word } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Layers, Star, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const CategoriesScreen: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const levels = ['A1', 'A2', 'B1', 'B2'];

  const categories = useLiveQuery(() => {
    if (!selectedLevel) return Promise.resolve([]);
    return db.words.where('level').equals(selectedLevel).uniqueKeys() as Promise<string[]>;
  }, [selectedLevel]);

  const words = useLiveQuery(() => {
    if (!selectedLevel || !selectedCategory) return Promise.resolve([]);
    return db.words
      .where('level').equals(selectedLevel)
      .and(w => w.category === selectedCategory)
      .toArray();
  }, [selectedLevel, selectedCategory]);

  const handleBack = () => {
    if (selectedCategory) setSelectedCategory(null);
    else if (selectedLevel) setSelectedLevel(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="sticky top-0 bg-white z-30 px-6 py-4 border-b border-gray-100 flex items-center gap-4">
        {(selectedLevel || selectedCategory) && (
          <button onClick={handleBack} className="p-2 -ml-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
            <ChevronRight size={24} className="rotate-180" />
          </button>
        )}
        <h1 className="text-xl font-bold text-gray-900">
          {!selectedLevel ? 'Уровни' : !selectedCategory ? `Уровень ${selectedLevel}` : selectedCategory}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selectedLevel ? (
          <div className="grid grid-cols-2 gap-4">
            {levels.map(l => (
              <button
                key={l}
                onClick={() => setSelectedLevel(l)}
                className="aspect-square bg-indigo-50 rounded-3xl p-6 flex flex-col items-center justify-center text-center hover:bg-indigo-100 transition-all active:scale-95 group"
              >
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm group-hover:shadow-md transition-all">
                  <Layers size={24} />
                </div>
                <span className="text-2xl font-black text-indigo-900">{l}</span>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Уровень</span>
              </button>
            ))}
          </div>
        ) : !selectedCategory ? (
          <div className="space-y-3">
            {categories?.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className="w-full bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-all">
                    <Layers size={20} />
                  </div>
                  <span className="font-bold text-gray-800">{c}</span>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {words?.map(w => (
              <WordItem key={w.id} word={w} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const WordItem: React.FC<{ word: Word }> = ({ word }) => {
  const [expanded, setExpanded] = useState(false);
  const isFavorite = useLiveQuery(() => {
    if (!word?.id) return Promise.resolve(false);
    return db.favorites.get([word.id, 'word']).then(fav => !!fav);
  }, [word.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!word?.id) return;
    try {
      const fav = await db.favorites.get([word.id, 'word']);
      if (fav) {
        await db.favorites.delete([word.id, 'word']);
      } else {
        await db.favorites.put({ itemId: word.id, type: 'word', createdAt: Date.now() });
      }
    } catch (e) {
      console.error('Toggle favorite failed:', e);
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
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{word.en}</h3>
          <p className="text-sm text-gray-500 font-medium">{word.ru}</p>
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
            className="mt-3 pt-3 border-t border-gray-50"
          >
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Таджикский</span>
            <p className="text-indigo-600 font-bold">{word.tj}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

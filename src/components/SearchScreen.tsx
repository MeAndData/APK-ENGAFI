import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, X, ChevronDown, Star, Copy, Check } from 'lucide-react';
import { db, normalizeText, type Word, type Phrase } from '../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';

export const SearchScreen: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [type, setType] = useState<'words' | 'phrases'>('words');
  const [level, setLevel] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(normalizeText(query));
      setPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useLiveQuery(() => {
    try {
      const normalized = normalizeText(debouncedQuery);
      
      if (type === 'words') {
        let collection = db.words.toCollection();
        if (level) collection = collection.filter(w => w.level === level);
        if (category) collection = collection.filter(w => w.category === category);
        if (normalized) {
          collection = collection.filter(w => 
            w.search_en.includes(normalized) || 
            w.search_ru.includes(normalized) || 
            w.search_tj.includes(normalized)
          );
        }
        return collection.offset((page - 1) * pageSize).limit(pageSize).toArray();
      } else {
        let collection = db.phrases.toCollection();
        if (category) collection = collection.filter(p => p.category === category);
        if (normalized) {
          collection = collection.filter(p => 
            p.search_en.includes(normalized) || 
            p.search_ru.includes(normalized) || 
            p.search_tj.includes(normalized)
          );
        }
        return collection.offset((page - 1) * pageSize).limit(pageSize).toArray();
      }
    } catch (e) {
      console.error('Search results query failed:', e);
      return Promise.resolve([]);
    }
  }, [debouncedQuery, type, level, category, page]);

  const categories = useLiveQuery(() => {
    try {
      if (type === 'words') {
        return db.words.orderBy('category').uniqueKeys() as Promise<string[]>;
      } else {
        return db.phrases.orderBy('category').uniqueKeys() as Promise<string[]>;
      }
    } catch (e) {
      console.error('Search categories query failed:', e);
      return Promise.resolve([]);
    }
  }, [type]);

  const levels = ['A1', 'A2', 'B1', 'B2'];

  const resetFilters = () => {
    setLevel(null);
    setCategory(null);
    setPage(1);
  };

  const hasFilters = level || category;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header & Search */}
      <div className="sticky top-0 bg-white z-30 px-4 pt-4 pb-2 border-b border-gray-100 shadow-sm">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-gray-100 p-1 rounded-xl flex-1">
            <button
              onClick={() => { setType('words'); resetFilters(); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'words' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Слова
            </button>
            <button
              onClick={() => { setType('phrases'); resetFilters(); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                type === 'phrases' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              Фразы
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-all ${
              showFilters || hasFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-gray-200 text-gray-500'
            }`}
          >
            <Filter size={20} />
          </button>
        </div>

        {/* Active Filters Bar */}
        {hasFilters && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Фильтры:</span>
            {level && (
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                {level} <X size={10} onClick={() => setLevel(null)} className="cursor-pointer" />
              </span>
            )}
            {category && (
              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                {category} <X size={10} onClick={() => setCategory(null)} className="cursor-pointer" />
              </span>
            )}
            <button onClick={resetFilters} className="text-[10px] font-bold text-indigo-600 hover:underline ml-auto">Сброс</button>
          </div>
        )}
      </div>

      {/* Filters Modal/Drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 border-b border-gray-200 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {type === 'words' && (
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Уровень</label>
                  <div className="flex flex-wrap gap-2">
                    {levels.map(l => (
                      <button
                        key={l}
                        onClick={() => setLevel(level === l ? null : l)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          level === l ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {categories?.map(c => (
                    <button
                      key={c}
                      onClick={() => setCategory(category === c ? null : c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        category === c ? 'bg-emerald-600 border-emerald-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {results?.map((item: any) => (
          <ItemCard key={item.id} item={item} type={type} />
        ))}
        
        {results?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-sm">Ничего не найдено</p>
          </div>
        )}

        {results && results.length >= pageSize && (
          <button
            onClick={() => setPage(page + 1)}
            className="w-full py-4 text-indigo-600 font-bold text-sm hover:bg-indigo-50 rounded-2xl transition-all"
          >
            Загрузить еще
          </button>
        )}
      </div>
    </div>
  );
};

const ItemCard: React.FC<{ item: any, type: 'words' | 'phrases' }> = ({ item, type }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const isFavorite = useLiveQuery(() => {
    if (!item?.id) return Promise.resolve(false);
    return db.favorites.get([item.id, type.slice(0, -1)]).then(fav => !!fav);
  }, [item?.id, type]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item?.id) return;
    const typeKey = type.slice(0, -1) as 'word' | 'phrase';
    try {
      const fav = await db.favorites.get([item.id, typeKey]);
      if (fav) {
        await db.favorites.delete([item.id, typeKey]);
      } else {
        await db.favorites.put({ itemId: item.id, type: typeKey, createdAt: Date.now() });
      }
    } catch (e) {
      console.error('Toggle favorite failed:', e);
    }
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${item.en} - ${item.ru} - ${item.tj}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      onClick={() => setExpanded(!expanded)}
      className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.en}</h3>
          <p className="text-sm text-gray-500 font-medium">{item.ru}</p>
        </div>
        <div className="flex gap-1">
          <button onClick={copyToClipboard} className="p-2 text-gray-300 hover:text-indigo-500 transition-colors">
            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
          </button>
          <button onClick={toggleFavorite} className={`p-2 transition-colors ${isFavorite ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'}`}>
            <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-gray-50 space-y-2"
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Таджикский</span>
              <p className="text-indigo-600 font-bold">{item.tj}</p>
            </div>
            <div className="flex gap-2">
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

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, normalizeText } from '../db/database';
import { BookOpen } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Подготовка словаря...');

  useEffect(() => {
    const importData = async () => {
      try {
        let isImported = null;
        try {
          isImported = await db.settings.get('is_imported');
        } catch (dbError) {
          console.warn('Database not ready, retrying...', dbError);
          // If DB is not ready, we wait a bit and retry once
          await new Promise(r => setTimeout(r, 1000));
          isImported = await db.settings.get('is_imported');
        }

        if (isImported?.value) {
          onComplete();
          return;
        }

        setStatus('Загрузка данных...');
        setProgress(10);

        const wordsResponse = await fetch('/assets/words.json');
        const wordsData = await wordsResponse.json();
        setProgress(30);

        const phrasesResponse = await fetch('/assets/phrases.json');
        const phrasesData = await phrasesResponse.json();
        setProgress(50);

        setStatus('Импорт слов...');
        const totalWords = wordsData.length;
        const batchSize = 500;
        for (let i = 0; i < totalWords; i += batchSize) {
          const batch = wordsData.slice(i, i + batchSize).map((w: any) => ({
            ...w,
            level: w.category?.includes('Oxford') ? w.category.split(' ')[1] : 'A1',
            search_en: normalizeText(w.en),
            search_ru: normalizeText(w.ru),
            search_tj: normalizeText(w.tj),
          }));
          await db.words.bulkPut(batch);
          setProgress(50 + Math.floor((i / totalWords) * 30));
        }

        setStatus('Импорт фраз...');
        const totalPhrases = phrasesData.length;
        for (let i = 0; i < totalPhrases; i += batchSize) {
          const batch = phrasesData.slice(i, i + batchSize).map((p: any) => ({
            ...p,
            search_en: normalizeText(p.en),
            search_ru: normalizeText(p.ru),
            search_tj: normalizeText(p.tj),
          }));
          await db.phrases.bulkPut(batch);
          setProgress(80 + Math.floor((i / totalPhrases) * 15));
        }

        await db.settings.put({ key: 'is_imported', value: true });
        setProgress(100);
        setStatus('Готово!');
        setTimeout(onComplete, 500);
      } catch (error) {
        console.error('Import failed:', error);
        setStatus('Ошибка импорта. Попробуйте перезагрузить.');
      }
    };

    importData();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center p-8 z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8 text-indigo-600"
      >
        <BookOpen size={64} />
      </motion.div>
      <h1 className="text-2xl font-bold mb-2 text-gray-900">EN/RU/TJ Dictionary</h1>
      <p className="text-gray-500 mb-8">{status}</p>
      
      <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-indigo-600 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-400 font-mono">{progress}%</p>
    </div>
  );
};

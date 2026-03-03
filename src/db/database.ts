import Dexie, { type Table } from 'dexie';

export interface Word {
  id?: number;
  en: string;
  ru: string;
  tj: string;
  level: string;
  category: string;
  search_en: string;
  search_ru: string;
  search_tj: string;
}

export interface Phrase {
  id?: number;
  en: string;
  ru: string;
  tj: string;
  category: string;
  search_en: string;
  search_ru: string;
  search_tj: string;
}

export interface Favorite {
  itemId: number;
  type: 'word' | 'phrase';
  createdAt: number;
}

export interface Setting {
  key: string;
  value: any;
}

export interface LearningProgress {
  itemId: number;
  type: 'word' | 'phrase';
  easiness?: number;
  interval?: number;
  nextReview?: number;
}

export class AppDatabase extends Dexie {
  words!: Table<Word>;
  phrases!: Table<Phrase>;
  favorites!: Table<Favorite, [number, string]>;
  settings!: Table<Setting>;
  learning_progress!: Table<LearningProgress, [number, string]>;

  constructor() {
    super('VocabularyAppDB');
    this.version(3).stores({
      words: '++id, en, ru, tj, level, category, search_en, search_ru, search_tj',
      phrases: '++id, en, ru, tj, category, search_en, search_ru, search_tj',
      favorites: '[itemId+type], type, createdAt',
      settings: 'key',
      learning_progress: '[itemId+type]',
    });
  }
}

export const db = new AppDatabase();

db.open().catch(err => {
  console.error('Failed to open db:', err);
});

export const normalizeText = (text: string): string => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
};

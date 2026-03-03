import React, { useState } from 'react';
import { Search, Layers, MessageSquare, Star, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SearchScreen } from './SearchScreen';
import { CategoriesScreen } from './CategoriesScreen';
import { PhrasesScreen } from './PhrasesScreen';
import { FavoritesScreen } from './FavoritesScreen';
import { SettingsScreen } from './SettingsScreen';

type Tab = 'search' | 'categories' | 'phrases' | 'favorites' | 'settings';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('search');

  const renderContent = () => {
    switch (activeTab) {
      case 'search': return <SearchScreen />;
      case 'categories': return <CategoriesScreen />;
      case 'phrases': return <PhrasesScreen />;
      case 'favorites': return <FavoritesScreen />;
      case 'settings': return <SettingsScreen />;
      default: return <SearchScreen />;
    }
  };

  const navItems = [
    { id: 'search', icon: Search, label: 'Поиск' },
    { id: 'categories', icon: Layers, label: 'Уровни' },
    { id: 'phrases', icon: MessageSquare, label: 'Фразы' },
    { id: 'favorites', icon: Star, label: 'Избранное' },
    { id: 'settings', icon: Settings, label: 'Настройки' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 flex justify-around items-center z-40 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

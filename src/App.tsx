/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { MainLayout } from './components/MainLayout';
import { db } from './db/database';
import { useLiveQuery } from 'dexie-react-hooks';

const App: React.FC = () => {
  const [isReady, setIsReady] = useState(false);
  const settings = useLiveQuery(() => {
    try {
      return db.settings.toArray();
    } catch (e) {
      console.error('App settings query failed:', e);
      return Promise.resolve([]);
    }
  }, []);
  
  const theme = settings?.find(s => s.key === 'theme')?.value || 'light';
  const textSize = settings?.find(s => s.key === 'textSize')?.value || 'M';

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Apply text size to document
    const sizeMap: Record<string, string> = {
      'S': '14px',
      'M': '16px',
      'L': '18px'
    };
    document.documentElement.style.fontSize = sizeMap[textSize] || '16px';
  }, [theme, textSize]);

  if (!isReady) {
    return <SplashScreen onComplete={() => setIsReady(true)} />;
  }

  return <MainLayout />;
};

export default App;

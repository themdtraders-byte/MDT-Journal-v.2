
'use client';

import { useEffect, useState } from 'react';
import { MdtLogo } from './mdt-logo';
import { useJournalStore } from '@/hooks/use-journal-store';
import RotatingContentDisplay from './rotating-content-display';

const SplashScreen = () => {
  const { appSettings } = useJournalStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white overflow-hidden relative">
      <div className="relative z-10 flex flex-col items-center animate-zoom-in" style={{ animationDuration: '1.5s' }}>
        <MdtLogo className="w-[500px] h-auto animate-fade-in" style={{ animationDuration: '2s' }} />
      </div>
      {isClient && (
          <div className="absolute bottom-10 text-center px-4 w-full max-w-4xl">
            <RotatingContentDisplay contentTypes={['quote']} />
          </div>
      )}
    </div>
  );
};

export default SplashScreen;

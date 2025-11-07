
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import SupportDialog from './support-dialog';
import AboutDialog from './about-dialog';
import StayConnectedDialog from './stay-connected-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { TooltipContent } from '@radix-ui/react-tooltip';
import { Share } from './icons/flat/Share';
import { Info } from './icons/flat/Info';
import { LifeBuoy } from './icons/flat/LifeBuoy';
import RotatingContentDisplay from './rotating-content-display';

const MainFooter = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isStayConnectedOpen, setIsStayConnectedOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <footer className="flex items-center justify-between p-1 px-2 border-t header-glassmorphic h-7">
        <p className="text-xs text-muted-foreground hidden md:block pl-2">© Products of The MD Traders Co.</p>
        <div className="flex-1 text-center px-4 overflow-hidden min-w-0">
            {isClient && <RotatingContentDisplay location="footer" contentTypes={['tip', 'advice', 'quote']} />}
        </div>
        <TooltipProvider>
            <div className="flex items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsSupportOpen(true)}>
                            <LifeBuoy className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Support</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsAboutOpen(true)}>
                            <Info className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>About</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsStayConnectedOpen(true)}>
                            <Share className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Stay Connected</p></TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
      </footer>
      <SupportDialog open={isSupportOpen} onOpenChange={setIsSupportOpen} />
      <AboutDialog open={isAboutOpen} onOpenChange={setIsAboutOpen} />
      <StayConnectedDialog open={isStayConnectedOpen} onOpenChange={setIsStayConnectedOpen} />
    </>
  );
};

export default MainFooter;


'use client';

import React from 'react';
import MainLayoutContent from '@/components/main-layout';
import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <TooltipProvider>
        <MainLayoutContent>{children}</MainLayoutContent>
      </TooltipProvider>
    </SidebarProvider>
  );
}

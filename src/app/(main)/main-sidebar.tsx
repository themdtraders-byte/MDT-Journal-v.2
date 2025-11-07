
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { AppLogo } from '@/components/app-logo';
import { Home, Table, BarChart, Layers, FileSpreadsheet, Bot, Brain, Globe, Trophy, Calendar, Settings, Trash2, Notebook } from 'lucide-react';
import React from 'react';

const MainSidebar = ({
    onSettingsClick,
    onTrashClick
}: {
    onSettingsClick: () => void;
    onTrashClick: () => void;
}) => {
  const pathname = usePathname();
  
  const menuItems = [
    { name: 'Dashboard', href: '/home', icon: Home },
    { name: 'Data Table', href: '/data/table', icon: Table },
    { name: 'Chart Lab', href: '/performance/chart', icon: BarChart },
    { name: 'Find Edge', href: '/performance/pivot', icon: Layers },
    { name: 'Analytics', href: '/performance/analytics', icon: FileSpreadsheet },
    { name: 'Calendar', href: '/data/calendar', icon: Calendar },
    { name: 'Simulator', href: '/performance/simulator', icon: Bot },
    { name: 'Notebook', href: '/note', icon: Notebook },
    { name: 'Build Up', href: '/plans/strategy', icon: Brain },
    { name: 'Web tools', href: '/market', icon: Globe },
    { name: 'Gamification', href: '/gamification', icon: Trophy },
  ];

  const isActive = (href: string) => {
    if (!pathname) return false;

    if (href === '/home') {
      return pathname === href || pathname === '/';
    }
     if (href === '/plans/strategy') {
        return pathname.startsWith('/plans');
    }
    if(href === '/data/table') {
        return pathname.startsWith('/data') && !pathname.endsWith('/calendar');
    }
     if(href === '/data/calendar') {
        return pathname === '/data/calendar';
    }
    
    if (href === '/performance/analytics') {
      return pathname.startsWith('/performance') && !pathname.includes('/chart') && !pathname.includes('/pivot') && !pathname.includes('/simulator') && !pathname.includes('/discipline');
    }
     if (href === '/performance/chart') {
      return pathname === '/performance/chart';
    }
     if (href === '/performance/pivot') {
      return pathname === '/performance/pivot';
    }
     if (href === '/performance/simulator') {
      return pathname === '/performance/simulator';
    }
    
    return pathname.startsWith(href);
  };


  return (
    <Sidebar>
      <SidebarHeader className="justify-center">
        <AppLogo className="w-8 h-8 flex-shrink-0"/>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <Link href={item.href!}>
                <SidebarMenuButton isActive={isActive(item.href!)} tooltip={item.name}>
                    <item.icon className="h-5 w-5"/>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter>
          <SidebarMenu>
               <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Settings" onClick={onSettingsClick}>
                      <Settings className="h-5 w-5" />
                  </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Trash" onClick={onTrashClick}>
                      <Trash2 className="h-5 w-5" />
                  </SidebarMenuButton>
              </SidebarMenuItem>
          </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default MainSidebar;

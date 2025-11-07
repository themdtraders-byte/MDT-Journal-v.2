
'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Badge as BadgeIcon, BrainCircuit, CheckCircle, CheckSquare, Clock, Diamond, DollarSign, Eye, Globe, BookOpen, Bot, Calendar, GitBranch, Heart, HelpCircle, Moon, Percent, Pilcrow, Repeat, Shield, Sparkles, Star, Target, TrendingUp, Trophy, Zap, Share, BookUser, ShieldCheck, FileCheck2, History, Rocket, User, UserCircle, UserRound, Crown, Medal, Sun } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { achievements as allAchievements, badges as allBadges, levels, progressTrackers, generateLeaderboardData, type LeaderboardEntry } from '@/lib/gamification';
import type { Journal } from '@/types';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { processGamification, type GamificationData } from '@/lib/gamification-engine';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const LevelProgressItem = ({ title, value, max, format = 'number' }: { title: string; value: number; max: number; format?: 'currency' | 'number' }) => {
    const progress = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    const formattedValue = format === 'currency' ? formatNumber(value) : value.toLocaleString();
    const formattedMax = format === 'currency' ? formatNumber(max) : max.toLocaleString();

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                            <span className="font-medium text-muted-foreground">{title}</span>
                            <span className="font-semibold">{formattedValue} / {formattedMax}</span>
                        </div>
                        <Progress value={progress} className="h-1.5" colorClassName="bg-gradient-to-r from-primary to-accent" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{progress.toFixed(1)}% towards goal</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const bgColors = [
    'bg-glass-blue', 'bg-glass-green', 'bg-glass-teal', 'bg-glass-purple', 
    'bg-glass-red', 'bg-glass-yellow', 'bg-glass-cyan', 'bg-glass-orange', 
    'bg-glass-pink'
];

const AchievementItem = ({ name, description, unlocked, index }: { name: string, description: string, unlocked: boolean, index: number }) => (
    <div className={cn(
        "flex items-start gap-3 p-3 border rounded-lg transition-all",
        unlocked ? `border-transparent ${bgColors[index % bgColors.length]}` : 'bg-muted/30 border-border'
    )}>
        <div className={cn(
            "p-1.5 rounded-full",
            unlocked ? `bg-background/20 text-foreground` : 'bg-muted text-muted-foreground'
        )}>
            <Star className="h-5 w-5" />
        </div>
        <div className="flex-1">
            <h4 className={cn("font-semibold text-sm", unlocked ? 'text-foreground' : 'text-muted-foreground')}>{name}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {unlocked && <CheckCircle className="h-5 w-5 text-foreground/80" />}
    </div>
);

const BadgeItem = ({ name, description, icon: Icon, unlocked, index }: { name: string, description: string, icon: React.ElementType, unlocked: boolean, index: number }) => (
    <div className={cn(
        "flex flex-col items-center text-center gap-1 p-3 border rounded-lg transition-all h-full",
         unlocked ? `border-transparent ${bgColors[index % bgColors.length]}` : 'bg-muted/30 opacity-60'
    )}>
        <div className={cn(
            "p-2 rounded-full",
            unlocked ? 'bg-background/20 text-foreground' : 'bg-muted text-muted-foreground'
        )}>
            <Icon className="h-6 w-6" />
        </div>
        <h4 className={cn("font-semibold text-sm", unlocked ? 'text-foreground' : 'text-muted-foreground')}>{name}</h4>
        <p className="text-xs text-muted-foreground flex-grow">{description}</p>
    </div>
);

const ProgressItem = ({ title, value, max, format }: { title: string, value: number, max: number, format: 'currency' | 'percentage' | 'number' }) => {
  const progress = max > 0 ? (value / max) * 100 : 0;
  
  const formatValue = (val: number) => {
    if (format === 'currency') return `$${val.toFixed(2)}`;
    if (format === 'percentage') return `${val.toFixed(1)}%`;
    return Math.floor(val);
  };
  
  return (
    <div className="p-3 border rounded-lg bg-muted/50">
      <div className="flex justify-between items-center mb-1 text-xs">
        <h4 className="font-semibold">{title}</h4>
        <p className="text-muted-foreground">{formatValue(value)} / {formatValue(max)}</p>
      </div>
      <Progress value={progress} className="h-1.5" colorClassName="bg-gradient-to-r from-primary to-accent" />
    </div>
  )
}

const PodiumCard = ({ trader, rank }: { trader: LeaderboardEntry, rank: number }) => {
    const rankGradients = [
        'bg-gradient-to-br from-yellow-400 to-amber-600 border-yellow-500', 
        'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-400', 
        'bg-gradient-to-br from-yellow-600 to-orange-700 border-yellow-700'
    ];
     const rankText = ['1st', '2nd', '3rd'];

    const Icon = trader.icon || User;

    return (
        <div className={cn("flex flex-col items-center gap-2 p-3 glassmorphic rounded-lg text-center border-2", rankGradients[rank - 1])}>
            <div className="font-black text-2xl text-background/80 [text-shadow:_0_1px_2px_rgba(0,0,0,0.4)]">
                {rankText[rank-1]}
            </div>
             <div 
                className="w-16 h-16 rounded-full bg-cover bg-center flex items-center justify-center border-2 overflow-hidden border-background/50" 
                style={{ backgroundImage: `url(${trader.country.flag})` }}
            >
                 <div className="w-full h-full flex items-center justify-center backdrop-blur-sm bg-black/10">
                    <Icon className="h-8 w-8 text-black" />
                </div>
            </div>
            <h3 className="font-bold text-base text-background">{trader.name}</h3>
            <p className="text-xs text-background/80 font-bold">{trader.totalPoints} Points</p>
        </div>
    )
}

const LeaderboardTab = ({ journal, gamificationData }: { journal: Journal, gamificationData: GamificationData }) => {
    const { appSettings } = useJournalStore(state => ({ appSettings: state.appSettings }));
    const leaderboard = useMemo(() => {
        if (!journal || !gamificationData || !appSettings) return [];

        // Recalculate user entry based on the latest journal data
        const currentUserGamificationData = processGamification(journal, appSettings);
        if (!currentUserGamificationData) return [];
        const userEntry = currentUserGamificationData.leaderboardEntry;

        const botData = generateLeaderboardData(gamificationData.currentLevel, journal.trades.length);

        const sortedData = [...botData, userEntry]
            .sort((a,b) => b.totalPoints - a.totalPoints)
            .map((t,i) => ({...t, rank: i + 1}));
            
        return sortedData;
    }, [journal, gamificationData, appSettings]);

    if (!leaderboard || leaderboard.length === 0) return <div className="flex justify-center items-center h-full"><p>Loading leaderboard...</p></div>;

    const top3 = leaderboard.slice(0, 3);
    const restOfLeaderboard = leaderboard.slice(3);
    
    return (
        <div className="space-y-4">
            <Card className="glassmorphic">
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Top Traders</CardTitle>
                </CardHeader>
                 <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {top3.map(trader => <PodiumCard key={trader.rank} trader={trader} rank={trader.rank} />)}
                    </div>
                 </CardContent>
            </Card>
            <Card className="glassmorphic">
                <CardHeader className="p-4">
                    <CardTitle className="text-base">Full Rankings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="p-2">Rank</TableHead>
                                    <TableHead className="p-2">Name</TableHead>
                                    <TableHead className="p-2">Trades</TableHead>
                                    <TableHead className="p-2">Avg Gain</TableHead>
                                    <TableHead className="p-2">Win Rate</TableHead>
                                    <TableHead className="p-2">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {restOfLeaderboard.map((trader, index) => {
                                    const Icon = trader.icon || User;
                                    const isUser = trader.name === 'You';
                                    return (
                                    <TableRow key={trader.rank} className={cn(isUser && "bg-primary/20")}>
                                        <TableCell className="font-bold p-2">{trader.rank}</TableCell>
                                        <TableCell className="p-2">
                                            <div className="flex items-center gap-2">
                                                 <div 
                                                    className="w-6 h-6 rounded-full bg-cover bg-center flex items-center justify-center overflow-hidden" 
                                                    style={{ backgroundImage: `url(${trader.country.flag})` }}
                                                >
                                                    <div className="w-full h-full flex items-center justify-center backdrop-blur-sm bg-black/10">
                                                        <Icon className="h-3 w-3 text-black" />
                                                    </div>
                                                </div>
                                                <span>{trader.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-2">{trader.totalTrades}</TableCell>
                                        <TableCell className="p-2 text-green-500">${trader.avgGain.toFixed(2)}</TableCell>
                                        <TableCell className="p-2">{trader.winRate.toFixed(1)}%</TableCell>
                                        <TableCell className="font-bold p-2">{trader.totalPoints}</TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};


const GamificationPage = () => {
  const { journals, activeJournalId, appSettings } = useJournalStore(state => ({
    journals: state.journals,
    activeJournalId: state.activeJournalId,
    appSettings: state.appSettings
  }));

  const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
  
  const gamificationData = useMemo(() => {
    if (!activeJournal || !appSettings) return null; // CRITICAL: Add guard here
    return processGamification(activeJournal, appSettings);
  }, [activeJournal, appSettings]);

  if (!activeJournal || !gamificationData) {
    return null;
  }
  
  const {
    currentLevel,
    nextLevel,
    unlockedAchievements,
    unlockedBadges,
    progress
  } = gamificationData;
  
  const badgeIcons: { [key: string]: React.ElementType } = {
    "The Planner": Shield, "The Journaler": Diamond, "The Analyzer": Target, "The Strategist": BrainCircuit, "The Disciplinarian": CheckSquare,
    "Sniper": Award, "The Streak": TrendingUp, "The Money Maker": DollarSign, "The Consistent": Calendar, "The Comeback Kid": Repeat,
    "Liquidity Hunter": Eye, "Trend Follower": TrendingUp, "The Reversalist": GitBranch, "The Scalper": Clock, "The Swing Trader": Clock, "The Breakout King": Zap, "The Pullback Pro": Pilcrow, "The Zone Trader": Bot, "The News Caster": Globe, "The Indicator Wizard": Sparkles,
    "Risk Manager": Shield, "The Break Even Master": CheckCircle, "The Protector": Shield, "The Partial Close King": CheckSquare, "The Safe Trader": Shield,
    "London Session Specialist": Globe, "New York Session Specialist": Globe, "Asia Session Specialist": Globe, "The EUR/USD Expert": DollarSign, "The Gold Miner": Trophy, "The Crypto King": DollarSign, "The Session Hunter": Globe,
    "The Cold-Blooded": Heart, "The Emotional Master": BrainCircuit, "The Revenger": Bot, "The Comebacker": Repeat,
    "The Mentor": HelpCircle, "The Learner": BookOpen, "The Sharer": Share,
    "The Early Bird": Sun, "The Night Owl": Moon, "The Weekend Warrior": Calendar, "The Multi-Tasker": Bot, "The All-Rounder": Bot, "The Long-Term Investor": Clock, "The Pips King": Trophy, "The Percent Master": Percent, "The Daily Grind": Calendar, "The Profit Creator": DollarSign,
  };
  
  return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Gamification Center</h1>
        <p className="text-muted-foreground">
            Track your progress, unlock achievements, and compete on the leaderboard.
        </p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glassmorphic">
                <CardContent className="p-3">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-bold text-base text-primary">{currentLevel.name}</p>
                                <p className="text-xs font-semibold">{activeJournal.xp.toLocaleString()} XP</p>
                            </div>
                            <div className="space-y-2">
                                <LevelProgressItem title="Level Progress" value={activeJournal.trades.length} max={nextLevel.minTrades} format="number" />
                                <LevelProgressItem title="Account Growth" value={progress.account_growth.value} max={progress.account_growth.target} format="currency" />
                                <LevelProgressItem title="Avg. Score" value={gamificationData.avgDisciplineScore} max={nextLevel.avgScore} format="number" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
             <Card className="glassmorphic">
                <CardHeader className="p-2"><CardTitle className="text-sm">Progress Trackers</CardTitle></CardHeader>
                <CardContent className="p-2 grid grid-cols-1 gap-2">
                    {progressTrackers.flatMap(group => group.trackers).map(tracker => {
                        if (tracker.id === 'account_growth' || tracker.id === 'level_up') return null; // Already shown in main card
                        return (
                            <ProgressItem
                                key={tracker.id}
                                title={tracker.title}
                                value={progress[tracker.id as keyof typeof progress]?.value || 0}
                                max={tracker.target}
                                format={tracker.format as any}
                            />
                        )
                    })}
                </CardContent>
             </Card>
        </div>
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          <div className="py-4">
            <TabsContent value="achievements">
                <Accordion type="multiple" defaultValue={Object.keys(allAchievements)} className="w-full space-y-2">
                    {Object.entries(allAchievements).map(([category, items], catIndex) => (
                        <AccordionItem key={category} value={category} className="border-none">
                           <AccordionTrigger className="p-2 hover:no-underline rounded-md hover:bg-muted/50">
                               <CardTitle className="text-base">{category}</CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-2 pt-2">
                               {items.map((ach, i) => <AchievementItem key={i} {...ach} unlocked={unlockedAchievements.has(ach.name)} index={catIndex + i} />)}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </TabsContent>
            <TabsContent value="badges">
                 <Accordion type="multiple" defaultValue={Object.keys(allBadges)} className="w-full space-y-2">
                    {Object.entries(allBadges).map(([category, items], catIndex) => (
                        <AccordionItem key={category} value={category} className="border-none">
                           <AccordionTrigger className="p-2 hover:no-underline rounded-md hover:bg-muted/50">
                               <CardTitle className="text-base">{category}</CardTitle>
                            </AccordionTrigger>
                            <AccordionContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
                               {items.map((badge, i) => <BadgeItem key={i} {...badge} icon={badgeIcons[badge.name] || Star} unlocked={unlockedBadges.has(badge.name)} index={catIndex + i} />)}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </TabsContent>
            <TabsContent value="leaderboard">
              <LeaderboardTab journal={activeJournal} gamificationData={gamificationData} />
            </TabsContent>
          </div>
        </Tabs>
    </div>
  );
};

export default GamificationPage;

    
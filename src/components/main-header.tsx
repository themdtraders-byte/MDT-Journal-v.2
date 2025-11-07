

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Filter,
  Bell,
  Edit,
  Save,
  XCircle,
  RotateCw,
  Minus,
  PlusSquare,
  Wifi,
  WifiOff,
  Plus,
  Gamepad,
  Dice,
  BarChart2,
  ThumbsUp,
  AlertTriangle,
  PartyPopper,
  ShieldAlert,
  Ban,
  LogOut,
  CheckSquare,
  Trophy,
  User,
  Book,
  GitCommitVertical,
  Calculator,
  DollarSign,
  Landmark,
  Percent,
  Wallet,
  Activity,
  BarChart,
  History,
  Target,
  Coins,
  Settings,
  Brain,
  FileSpreadsheet,
  Notebook,
  Globe,
  Goal,
  Play,
  FileQuestion,
  CheckCircle,
  SwitchCamera
} from 'lucide-react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Badge } from './ui/badge';
import StatCard from './ui/stat-card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { pairsConfig } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import FormattedNumber from './ui/formatted-number';
import { Journal, JournalType, Trade } from '@/types';
import { Separator } from './ui/separator';
import RotatingContentDisplay from './rotating-content-display';
import AverageTiltmeter from './average-tiltmeter';
import { Info } from 'lucide-react';
import { Progress } from './ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription as AlertDialogDescriptionComponent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { format, subDays, subYears } from 'date-fns';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { calculateMdScore } from '@/lib/calculations';
import { useRouter } from 'next/navigation';
import { calculateGroupMetrics } from '@/lib/analytics';
import { processGamification } from '@/lib/gamification-engine';
import { initialFilterState } from '@/hooks/use-journal-store';


const getJournalTypeGradient = (type: JournalType) => {
    switch(type) {
        case 'Real': return 'bg-blue-500/20 text-blue-400';
        case 'Funded': return 'bg-purple-500/20 text-purple-400';
        case 'Demo': return 'bg-gray-500/20 text-gray-500';
        case 'Competition': return 'bg-amber-500/20 text-yellow-500';
        case 'Backtest': return 'bg-green-500/20 text-green-500';
        default: return 'bg-muted/50';
    }
}

const ConnectionStatus = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined' && 'onLine' in navigator) {
            setIsOnline(navigator.onLine);
        }

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isClient) {
        return (
             <div className="relative flex h-2 w-2 items-center justify-center">
                <div className="relative inline-flex rounded-full h-1 w-1 bg-muted-foreground"></div>
            </div>
        );
    }

    return (
        <Tooltip>
            <TooltipTrigger>
                {isOnline ? (
                    <div className="relative flex h-2 w-2 items-center justify-center">
                      <div className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping"></div>
                      <div className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></div>
                    </div>
                ) : (
                    <div className="relative flex h-2 w-2 items-center justify-center">
                      <div className="relative inline-flex rounded-full h-1 w-1 bg-muted-foreground"></div>
                    </div>
                )}
            </TooltipTrigger>
            <TooltipContent><p>Internet: {isOnline ? 'Connected' : 'Disconnected'}</p></TooltipContent>
        </Tooltip>
    );
};


const MdScoreTooltipContent = ({ journal }: { journal: Journal | null }) => {
    if (!journal) {
      return <div className="p-2 text-xs">Journal data not available.</div>;
    }
    const scoreData = calculateMdScore(journal);

    if (!scoreData) {
        return <div className="p-2 text-xs">Not enough data for score.</div>
    }

    const breakdown = [
        { label: 'Profitability', score: scoreData.profitabilityScore, max: 30, color: 'bg-green-500' },
        { label: 'Consistency', score: scoreData.consistencyScore, max: 30, color: 'bg-blue-500' },
        { label: 'Risk Mgmt', score: scoreData.riskManagementScore, max: 20, color: 'bg-yellow-500' },
        { label: 'Discipline', score: scoreData.disciplineScore, max: 20, color: 'bg-purple-500' },
    ];

    return (
        <div className="p-3 space-y-3 w-64">
            <h4 className="font-bold">MD Score: {scoreData.totalScore.toFixed(2)}</h4>
            <div className="space-y-2">
                {breakdown.map(item => (
                    <div key={item.label}>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold">{item.score.toFixed(0)} / {item.max}</span>
                        </div>
                        <Progress value={(item.score / item.max) * 100} className="h-1.5" colorClassName={item.color}/>
                    </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground text-center font-mono">
                (Profitability + Consistency + Risk + Discipline)
            </p>
        </div>
    );
};


const MainHeader = () => {
    const router = useRouter();
    const { 
        toggleCalculator, 
        setFilterOpen, setIsAuditOpen, setNotificationsOpen,
        setAccountOpen, setJournalActionsOpen,
        toggleChecklist,
        appSettings,
    } = useJournalStore();

    const { user } = useUser();
    const auth = useAuth();

    const { activeJournal, filteredTrades, isFilterActive } = useJournalStore(state => {
        const activeJournal = state.journals.find(j => j.id === state.activeJournalId);
        if (!activeJournal) return { activeJournal: null, filteredTrades: [], isFilterActive: false };

        const allTrades = activeJournal.trades || [];
        const { filters } = state;
        
        const isFilterReallyActive = (obj: any, initial: any): boolean => {
             if (!obj || !initial) return false;

            return Object.keys(obj).some(key => {
                if (key === 'invert' && obj[key] === true) return true;
                const val = obj[key as keyof typeof obj];
                const initialVal = initial[key as keyof typeof initial];
                if (Array.isArray(val) && val.length > 0) return true;
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                    if ('from' in val || 'to' in val) {
                         if ((val as any).from || (val as any).to) return true;
                    }
                    else if ('min' in val || 'max' in val) {
                         if ((val as any).min || (val as any).max) return true;
                    } else if (Object.keys(val).length > 0) return true;
                }
                return val !== initialVal && !Array.isArray(val) && typeof val !== 'object';
            });
        };

        const isFilterActive = isFilterReallyActive(filters, initialFilterState);

        const filtered = !isFilterActive
            ? allTrades
            : allTrades.filter(trade => {
                if (filters.pair && filters.pair.length > 0 && !filters.pair.includes(trade.pair)) return false;
                if (filters.direction && filters.direction.length > 0 && !filters.direction.includes(trade.direction)) return false;
                // Add other filter logic here as needed
                return true;
            });
            
        return { activeJournal, filteredTrades: filtered, isFilterActive };
    });

    const analytics = useMemo(() => {
        if (!activeJournal || !appSettings) return null;
        if (filteredTrades.length === 0) {
            // Return a default structure if there are no trades, so the component doesn't fail
            return calculateGroupMetrics([], appSettings, activeJournal.capital);
        }
        return calculateGroupMetrics(filteredTrades, appSettings, activeJournal.capital);
    }, [activeJournal, filteredTrades, appSettings]);

    const gamificationData = useMemo(() => {
      if (!activeJournal || !appSettings) return null;
      return processGamification(activeJournal, appSettings);
    }, [activeJournal, appSettings]);
    

    const [journeyDuration, setJourneyDuration] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!activeJournal || activeJournal.trades.length === 0 || !isClient) {
            setJourneyDuration('N/A');
            return;
        }

        const sortedTrades = [...activeJournal.trades].sort((a, b) => new Date(a.openDate + 'T' + a.openTime).getTime() - new Date(b.openDate + 'T' + b.openTime).getTime());
        if (sortedTrades.length === 0) return;
        const firstTradeDate = new Date(sortedTrades[0].openDate + 'T' + sortedTrades[0].openTime);

        const updateDuration = () => {
            const now = new Date();
            const diff = now.getTime() - firstTradeDate.getTime();
            
            const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
            const days = Math.floor((diff / (1000 * 60 * 60 * 24)) % 365);
            const hours = Math.floor((diff / 1000 / 60 / 60) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            
            let durationString = '';
            if(years > 0) durationString += `${String(years).padStart(2,'0')}y `;
            if(days > 0 || years > 0) durationString += `${String(days).padStart(2,'0')}d `;
            durationString += `${String(hours).padStart(2,'0')}h `;
            durationString += `${String(minutes).padStart(2,'0')}m`;

            setJourneyDuration(durationString.trim());
        };

        updateDuration();
        const intervalId = setInterval(updateDuration, 60000); // Update every minute

        return () => clearInterval(intervalId);
    }, [activeJournal, isClient]);

    const handleAddTradeClick = () => {
        router.push('/add-trade');
    }

    const handleSignOut = () => {
        if (auth) {
            signOut(auth);
            router.push('/login');
        }
    };


    if (!activeJournal || !appSettings) return null; // Ensure activeJournal and appSettings are loaded
    
    const { title, type, initialDeposit } = activeJournal;
    const unreadAlertsCount = activeJournal.alerts?.filter(a => !a.seen).length || 0;
    
    const { metrics, filteredCapital, filteredBalance } = {
        metrics: analytics,
        filteredCapital: activeJournal.capital,
        filteredBalance: activeJournal.balance
    };
    
    const mdScore = useMemo(() => {
        if (!activeJournal || !gamificationData) return 0;
        const scoreData = calculateMdScore(activeJournal);
        return scoreData ? scoreData.totalScore : 0;
    }, [activeJournal, gamificationData]);

    const currentStreak = useMemo(() => {
        if (!activeJournal || !activeJournal.trades || activeJournal.trades.length === 0) {
            return { type: 'N/A' as const, count: 0 };
        }
        const trades = activeJournal.trades;
        
        const sortedTrades = [...trades].sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        if (sortedTrades.length === 0) {
            return { type: 'N/A' as const, count: 0 };
        }
        const lastTradeOutcome = sortedTrades[sortedTrades.length - 1].auto.outcome;
        if(lastTradeOutcome === 'Neutral') return { type: 'Neutral' as const, count: 0 };

        let count = 0;
        for (let i = sortedTrades.length - 1; i >= 0; i--) {
            if (sortedTrades[i].auto.outcome === lastTradeOutcome) {
                count++;
            } else {
                break;
            }
        }
        return { type: lastTradeOutcome, count };
    }, [activeJournal]);


    return (
        <>
            <div className="border-b header-glassmorphic">
                <div className="flex flex-col">
                    {/* First Header Bar */}
                    <div className="flex items-center px-2 md:px-4 h-9">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <p className="font-bold text-sm">MD Journal</p>
                            <Separator orientation="vertical" className="h-4 w-[1.5px] ml-1 mr-2" />
                            <ConnectionStatus />
                        </div>
                        <div className="flex-1 min-w-0" />
                         <div className="flex items-center gap-0">
                            <Button onClick={handleAddTradeClick} size="sm" className="h-7 px-2 icon-glow-wrapper"><PlusSquare className="h-4 w-4 mr-1"/> Add Trade</Button>
                            <Button onClick={toggleCalculator} variant="ghost" size="icon" className="h-7 w-7 icon-glow-wrapper"><Calculator className="h-4 w-4"/></Button>
                            <Button onClick={toggleChecklist} variant="ghost" size="icon" className="h-7 w-7 icon-glow-wrapper"><CheckSquare className="h-4 w-4" /></Button>
                            <Button onClick={() => setNotificationsOpen(true)} variant="ghost" size="icon" className="h-7 w-7 relative icon-glow-wrapper">
                                <Bell className="h-4 w-4" />
                                {unreadAlertsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground">
                                        {unreadAlertsCount}
                                    </span>
                                )}
                            </Button>
                            <Button onClick={() => setIsAuditOpen(true)} variant="ghost" size="icon" className="h-7 w-7 icon-glow-wrapper"><CheckCircle className="h-4 w-4" /></Button>
                            <Button onClick={() => setFilterOpen(true)} variant="ghost" size="icon" className={cn("h-7 w-7 icon-glow-wrapper", isFilterActive && "animate-pulse ring-2 ring-purple-500/50")}><Filter className="h-4 w-4"/></Button>
                            <Button onClick={() => setJournalActionsOpen(true)} variant="ghost" size="icon" className="h-7 w-7 icon-glow-wrapper"><Book className="h-4 w-4" /></Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                         <Avatar className="h-7 w-7">
                                            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                                            <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setAccountOpen(true)}><User className="mr-2 h-4 w-4"/>Profile</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setJournalActionsOpen(true)}><SwitchCamera className="mr-2 h-4 w-4"/>Switch Journal</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive"><LogOut className="mr-2 h-4 w-4"/>Sign Out</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    
                    {/* Second Header Bar */}
                    <div className="flex items-center p-1 px-2 md:px-4 h-7 border-t">
                        <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="secondary" className="font-semibold text-xs rounded-md flex items-center gap-2 px-1 py-0 h-5">
                                <span>{title}</span>
                                <span className={cn("px-1.5 py-0.5 rounded-sm text-[10px]", getJournalTypeGradient(type))}>
                                    {type}
                                </span>
                            </Badge>
                        </div>
                        <div className="flex-1 text-center px-4 overflow-hidden min-w-0">
                            <RotatingContentDisplay contentTypes={['quote', 'advice']} location="header" />
                        </div>
                    </div>
                    
                    {/* Third Header Bar */}
                    {metrics && (
                        <div className="p-1 px-2 md:px-4 border-t overflow-x-auto w-full">
                            <div className="flex gap-1">
                                <StatCard layout="custom" icon={<Landmark className="h-4 w-4 text-white"/>} label="Capital" value={<FormattedNumber value={filteredCapital} />} gradientColor="blue" tooltip="Initial deposit plus/minus deposits and withdrawals."/>
                                <StatCard layout="custom" icon={<Wallet className="h-4 w-4 text-white"/>} label="Balance" value={<FormattedNumber value={filteredBalance} />} gradientColor="cyan" tooltip="Current account equity."/>
                                <StatCard layout="custom" icon={<DollarSign className="h-4 w-4 text-white"/>} label="P/L" value={<FormattedNumber value={metrics.totalPl} />} isMonetary showPercentage gradientColor="green" tooltip="Net profit or loss for the filtered trades."/>
                                <StatCard layout="custom" icon={<Trophy className="h-4 w-4 text-white"/>} label="Winrate" value={`${metrics.winRate.toFixed(1)}%`} gradientColor="gold" tooltip="Percentage of winning trades."/>
                                <StatCard layout="custom" icon={<Percent className="h-4 w-4 text-white"/>} label="Profit Factor" value={isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : "∞"} gradientColor="yellow" tooltip="Gross profit divided by gross loss."/>
                                <StatCard layout="custom" icon={<Activity className="h-4 w-4 text-white"/>} label="Avg P/L" value={<FormattedNumber value={metrics.avgPl} />} isMonetary gradientColor="purple" tooltip="Average profit or loss per trade."/>
                                <StatCard layout="custom" icon={<Target className="h-4 w-4 text-white"/>} label="Expectancy" value={<FormattedNumber value={metrics.expectancy} />} isMonetary gradientColor="orange" tooltip="Expected return per trade based on historical performance."/>
                                <StatCard layout="custom" icon={<BarChart className="h-4 w-4 text-white"/>} label="# TRADES" value={metrics.trades} gradientColor="blue" tooltip="Total number of trades in the current filter."/>
                                <StatCard layout="custom" icon={<Brain className="h-4 w-4 text-white"/>} label="Avg Score" value={metrics.avgScore.toFixed(0)} gradientColor="cyan" tooltip="Average discipline score across all trades."/>
                                <StatCard layout="custom" icon={<Trophy className="h-4 w-4 text-white"/>} label="MD Score" value={mdScore.toFixed(0)} gradientColor="green" tooltip={<MdScoreTooltipContent journal={activeJournal}/>}/>
                                <StatCard layout="custom" icon={<GitCommitVertical className="h-4 w-4 text-white"/>} label="STREAK" value={`${currentStreak.count} ${currentStreak.type === 'N/A' ? '' : currentStreak.type}`} gradientColor="purple" positive={currentStreak.type === 'Win'} tooltip="Your current consecutive win/loss streak."/>
                                <StatCard layout="custom" icon={<History className="h-4 w-4 text-white"/>} label="Journey" value={journeyDuration || '...'} gradientColor="orange" tooltip="Total time since your first trade in this journal."/>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MainHeader;

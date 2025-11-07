
'use client';

import type { AppSettings, Journal, Trade } from './types';
import { levels, achievements as allAchievements, badges as allBadges, quests as allQuests } from './gamification';
import type { LeaderboardEntry } from './gamification';
import { User, Crown, Medal, Trophy } from 'lucide-react';
import { differenceInCalendarMonths, startOfMonth, addMonths } from 'date-fns';
import { calculateGroupMetrics } from './analytics';

export interface GamificationData {
    currentLevel: typeof levels[0];
    nextLevel: typeof levels[0];
    unlockedAchievements: Set<string>;
    unlockedBadges: Set<string>;
    completedQuests: Set<string>;
    progress: {
        [key: string]: { value: number; target: number };
    };
    totalPl: number;
    avgDisciplineScore: number;
    leaderboardEntry: LeaderboardEntry;
}


// --- Processor Functions ---

const checkAchievements = (journal: Journal): Set<string> => {
    const unlocked = new Set<string>();
    const trades = journal.trades.filter(t => !t.isMissing);

    // Trade Count Milestones
    if (trades.length >= 1) unlocked.add("First Trade Logged");
    if (trades.length >= 10) unlocked.add("10 Trades Logged");
    if (trades.length >= 50) unlocked.add("50 Trades Logged");
    if (trades.length >= 100) unlocked.add("100 Trades Logged");
    if (trades.length >= 1000) unlocked.add("1000 Trades Logged");

    // Performance Milestones
    const winningTrades = trades.filter(t => t.auto.status === 'Win');
    if (winningTrades.length >= 1) unlocked.add("First Winning Trade");
    if (winningTrades.length >= 10) unlocked.add("10 Winning Trades");

    let consecutiveWins = 0;
    for (const trade of trades) {
        if (trade.auto.status === 'Win') consecutiveWins++;
        else consecutiveWins = 0;
        if (consecutiveWins >= 5) unlocked.add("5 Consecutive Winning Trades");
        if (consecutiveWins >= 10) unlocked.add("10 Consecutive Winning Trades");
    }

    if (trades.some(t => t.auto.rr >= 3)) unlocked.add("First Trade with an R:R of 3:1");
    if (trades.some(t => t.auto.rr >= 5)) unlocked.add("First Trade with an R:R of 5:1");
    if (trades.some(t => t.auto.rr >= 10)) unlocked.add("First Trade with an R:R of 10:1");

    // Discipline Milestones
    if (trades.some(t => t.auto.score.value === 100)) unlocked.add("First Perfect Trade");

    // This is a simplified check. A real one would need date tracking.
    const last10Trades = trades.slice(-10);
    if (last10Trades.length === 10 && last10Trades.every(t => t.auto.score.value > 85)) {
        unlocked.add("10 Consecutive Trades with No Plan Violations");
    }

    return unlocked;
};


const checkBadges = (journal: Journal): Set<string> => {
    const unlocked = new Set<string>();
    const trades = journal.trades.filter(t => !t.isMissing);
    const totalTrades = trades.length;

    // General
    if (journal.plan) unlocked.add("The Planner");
    if (totalTrades >= 100) unlocked.add("The Journaler");
    if (trades.some(t => Object.values(t).every(val => val !== undefined && val !== ''))) unlocked.add("The Analyzer");

    // Performance
    if (trades.some(t => t.auto.rr >= 10)) unlocked.add("Sniper");
    if (trades.some(t => t.auto.pl >= 1000)) unlocked.add("The Money Maker");

    // Risk
    const compliantRiskTrades = trades.filter(t => t.auto.riskPercent <= (journal.plan?.riskPerTrade || 1));
    if (compliantRiskTrades.length >= 50) unlocked.add("Risk Manager");
    if (trades.filter(t => t.hasPartial).length >= 10) unlocked.add("The Partial Close King");

    // Strategy
    const scalpTrades = trades.filter(t => t.auto.durationMinutes < 15);
    if (scalpTrades.length >= 50) unlocked.add("The Scalper");

    // Session
    const londonTrades = trades.filter(t => t.auto.session === 'London');
    if (londonTrades.filter(t => t.auto.status === 'Win').length >= 25) unlocked.add("London Session Specialist");

    return unlocked;
}


const checkQuests = (journal: Journal): Set<string> => {
    const completed = new Set<string>();
    const trades = journal.trades.filter(t => !t.isMissing);
    const last5Trades = trades.slice(-5);
    const last10Trades = trades.slice(-10);

    // Discipline & Risk
    if (last5Trades.length === 5 && last5Trades.every(t => t.auto.riskPercent <= (journal.plan?.riskPerTrade || 1))) {
        completed.add("The Safe Trader");
    }
    if (last10Trades.length === 10 && last10Trades.every(t => t.auto.score.value >= 90)) {
        completed.add("The Zero-Violation Challenge");
    }
    
    // Strategy & Technical
    if (trades.some(t => t.auto.rr >= 3)) completed.add("The 3:1 R:R Quest");

    return completed;
};

export const processGamification = (journal: Journal | null | undefined, appSettings?: AppSettings): GamificationData | null => {
    if (!journal || !appSettings) {
        return null;
    }
    const trades = journal.trades.filter(t => !t.isMissing);
    const totalTrades = trades.length;

    // --- Level Calculation ---
    const currentLevelIndex = levels.findIndex(l => totalTrades >= l.minTrades && (l.maxTrades === Infinity || totalTrades <= l.maxTrades));
    const currentLevel = levels[currentLevelIndex] || levels[0];
    const nextLevel = levels[currentLevelIndex + 1] || currentLevel;

    // --- Dynamic Account Growth Target ---
    const startDate = startOfMonth(new Date(journal.createdAt));
    const now = new Date();
    const monthsPassed = differenceInCalendarMonths(now, startDate);
    
    let dynamicProfitTarget = journal.initialDeposit;
    let balanceAtMonthStart = journal.initialDeposit;
    const monthlyBalances: Record<string, number> = {};

    // Group trades by month to calculate balance at the start of each month
    journal.trades.forEach(trade => {
        if (!trade.closeDate) return;
        const tradeDate = new Date(trade.closeDate);
        const monthKey = `${tradeDate.getFullYear()}-${tradeDate.getMonth()}`;
        if (!monthlyBalances[monthKey]) {
            // Find balance at end of previous month
            const prevMonth = addMonths(startOfMonth(tradeDate), -1);
            const prevMonthKey = `${prevMonth.getFullYear()}-${prevMonth.getMonth()}`;
            monthlyBalances[monthKey] = monthlyBalances[prevMonthKey] || balanceAtMonthStart;
        }
        monthlyBalances[monthKey] += trade.auto.pl;
    });

    for (let i = 1; i <= monthsPassed; i++) {
        const monthDate = addMonths(startDate, i);
        const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
        const prevMonthKey = `${addMonths(monthDate, -1).getFullYear()}-${addMonths(monthDate, -1).getMonth()}`;
        
        balanceAtMonthStart = monthlyBalances[prevMonthKey] || balanceAtMonthStart;
        dynamicProfitTarget += balanceAtMonthStart * 0.25;
    }
    
    // --- Progress Trackers ---
    const metrics = appSettings ? calculateGroupMetrics(trades, appSettings, journal.capital) : {
        avgScore: 0, winRate: 0, totalPl: 0, avgWin: 0, avgLoss: 0, avgR: 0, profitFactor: 0
    };

    const progress = {
        account_growth: { value: journal.balance, target: dynamicProfitTarget },
        discipline_score: { value: metrics.avgScore, target: nextLevel.avgScore },
        win_rate: { value: metrics.winRate, target: 70 }, // Increased win rate goal to 70%
        level_up: { value: totalTrades, target: nextLevel.minTrades }
    };
    
    // --- Leaderboard Entry ---
    const totalPoints = Math.round(
      (totalTrades / 50) + 
      (metrics.avgR * 20) + 
      (metrics.profitFactor * 10) +
      (metrics.winRate) +
      (metrics.avgScore)
    );

    const leaderboardEntry: LeaderboardEntry = {
        rank: 0, // Will be calculated later
        profilePhoto: '',
        name: 'You',
        totalTrades: totalTrades,
        xp: journal.xp,
        avgGain: metrics.avgWin,
        avgLoss: metrics.avgLoss,
        winRate: metrics.winRate,
        avgGrade: metrics.avgScore,
        totalPoints,
        country: { name: 'Pakistan', flag: 'https://flagcdn.com/w40/pk.png' },
        icon: User,
    };

    return {
        currentLevel,
        nextLevel,
        unlockedAchievements: checkAchievements(journal),
        unlockedBadges: checkBadges(journal),
        completedQuests: checkQuests(journal),
        progress,
        totalPl: metrics.totalPl,
        avgDisciplineScore: metrics.avgScore,
        leaderboardEntry
    };
};


'use client';

import { User, UserCircle, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const levels = [
    { level: 1, name: "Novice Trader", minTrades: 0, maxTrades: 10, totalPnl: 100, avgScore: 50, competitors: 20 },
    { level: 2, name: "Apprentice Trader", minTrades: 11, maxTrades: 25, totalPnl: 250, avgScore: 55, competitors: 30 },
    { level: 3, name: "Journeyman Trader", minTrades: 26, maxTrades: 50, totalPnl: 500, avgScore: 60, competitors: 50 },
    { level: 4, name: "Professional Trader", minTrades: 51, maxTrades: 100, totalPnl: 1200, avgScore: 65, competitors: 70 },
    { level: 5, name: "Master Trader", minTrades: 101, maxTrades: 150, totalPnl: 2000, avgScore: 70, competitors: 100 },
    { level: 6, name: "Elite Trader", minTrades: 151, maxTrades: 200, totalPnl: 2500, avgScore: 75, competitors: 150 },
    { level: 7, name: "Market Wizard", minTrades: 201, maxTrades: 250, totalPnl: 3500, avgScore: 80, competitors: 200 },
    { level: 8, name: "Trading Guru", minTrades: 251, maxTrades: 500, totalPnl: 5000, avgScore: 85, competitors: 300 },
    { level: 9, name: "Grandmaster Trader", minTrades: 501, maxTrades: 999, totalPnl: 9999, avgScore: 92, competitors: 500 },
    { level: 10, name: "The Legend", minTrades: 1000, maxTrades: Infinity, totalPnl: 10000, avgScore: 96.5, competitors: 1000 },
];

const getCountryFlagUrl = (countryCode: string) => `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;

const imaginaryTradersPool = [
    { name: 'Aarav Sharma', country: { name: 'India', code: 'in' }, icon: User },
    { name: 'Fatima Al-Fassi', country: { name: 'Saudi Arabia', code: 'sa' }, icon: UserCircle },
    { name: 'Chen Wei', country: { name: 'China', code: 'cn' }, icon: UserRound },
    { name: 'John Smith', country: { name: 'USA', code: 'us' }, icon: User },
    { name: 'Olivia Williams', country: { name: 'UK', code: 'gb' }, icon: UserCircle },
    { name: 'Liam Tremblay', country: { name: 'Canada', code: 'ca' }, icon: UserRound },
    { name: 'Chloe Wilson', country: { name: 'Australia', code: 'au' }, icon: UserCircle },
    { name: 'Kenji Tanaka', country: { name: 'Japan', code: 'jp' }, icon: User },
    { name: 'Zainab Khan', country: { name: 'Pakistan', code: 'pk' }, icon: UserCircle },
    { name: 'Ahmed Al-Mansoori', country: { name: 'UAE', code: 'ae' }, icon: UserRound },
    { name: 'Lia Taylor', country: { name: 'New Zealand', code: 'nz' }, icon: UserCircle },
    { name: 'Yara Zayyad', country: { name: 'Palestine', code: 'ps' }, icon: User },
    { name: 'Noam Cohen', country: { name: 'Israel', code: 'il' }, icon: UserRound },
    { name: 'Maria Garcia', country: { name: 'Spain', code: 'es' }, icon: UserCircle },
    { name: 'Sergei Ivanov', country: { name: 'Russia', code: 'ru' }, icon: User },
    { name: 'Ana Silva', country: { name: 'Brazil', code: 'br' }, icon: UserCircle },
    { name: 'Sophie Dubois', country: { name: 'France', code: 'fr' }, icon: UserRound },
    { name: 'Lukas Schmidt', country: { name: 'Germany', code: 'de' }, icon: User },
    { name: 'Santiago Rodriguez', country: { name: 'Mexico', code: 'mx' }, icon: UserRound },
    { name: 'Aisha Adebayo', country: { name: 'Nigeria', code: 'ng' }, icon: UserCircle },
];


const mulberry32 = (seed: number) => {
    return () => {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const getRandom = (min: number, max: number, rng: () => number) => rng() * (max - min) + min;

export interface LeaderboardEntry {
    rank: number;
    profilePhoto: string;
    name: string;
    totalTrades: number;
    xp: number;
    avgGain: number;
    avgLoss: number;
    winRate: number;
    avgGrade: number;
    totalPoints: number;
    country: { name: string; flag: string; };
    icon: LucideIcon;
}

export const generateLeaderboardData = (userLevel: typeof levels[0], userTradeCount: number): LeaderboardEntry[] => {
    const data: LeaderboardEntry[] = [];
    const numCompetitors = userLevel.competitors;
    
    // Use date as seed for daily consistency
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    const rng = mulberry32(seed);

    const shuffledTraders = [...imaginaryTradersPool].sort(() => rng() - 0.5);

    for (let i = 0; i < numCompetitors; i++) {
        const traderInfo = shuffledTraders[i % shuffledTraders.length];
        
        const winRate = getRandom(40, 75, rng);
        const avgGain = getRandom(50, 300, rng);
        const avgLoss = Math.abs(getRandom(30, 150, rng));
        const avgGrade = getRandom(60, 95, rng);
        const totalTrades = Math.max(1, userTradeCount + Math.floor(getRandom(-5, 10, rng)));
        const xp = Math.floor(getRandom(100, 5000, rng));
        
        const xpPoints = (xp / 5000) * 100;
        const rrRatio = avgLoss > 0 ? avgGain / avgLoss : 0;
        const avgGainPoints = rrRatio * 50;
        const avgLossPoints = (1 / (rrRatio || 1)) * 50;
        const winRatePoints = winRate;
        const avgGradePoints = avgGrade;

        const totalPoints = Math.round(xpPoints + avgGainPoints + avgLossPoints + winRatePoints + avgGradePoints);

        data.push({
            rank: 0, // temporary rank
            profilePhoto: 'https://placehold.co/100x100.png',
            name: traderInfo.name,
            totalTrades: totalTrades,
            xp,
            avgGain,
            avgLoss,
            winRate,
            avgGrade,
            totalPoints,
            country: {
                name: traderInfo.country.name,
                flag: getCountryFlagUrl(traderInfo.country.code),
            },
            icon: traderInfo.icon,
        });
    }

    return data;
};


export const achievements = {
    "Trade Count Milestones": [
        { name: "First Trade Logged", description: "Log your very first trade." },
        { name: "10 Trades Logged", description: "Log a total of 10 trades." },
        { name: "25 Trades Logged", description: "Log a total of 25 trades." },
        { name: "50 Trades Logged", description: "Log a total of 50 trades." },
        { name: "100 Trades Logged", description: "Log a total of 100 trades." },
        { name: "250 Trades Logged", description: "Log a total of 250 trades." },
        { name: "500 Trades Logged", description: "Log a total of 500 trades." },
        { name: "1000 Trades Logged", description: "Log a total of 1000 trades." },
        { name: "2500 Trades Logged", description: "Log a total of 2500 trades." },
        { name: "5000 Trades Logged", description: "Log a total of 5000 trades." },
    ],
    "Discipline & Plan Adherence": [
        { name: "First Perfect Trade", description: "Achieve a 100 Discipline Score on a trade." },
        { name: "10 Perfect Trades", description: "Achieve a 100 Discipline Score on 10 different trades." },
        { name: "First Week of Zero Plan Violations", description: "Complete a full week with no rule violations." },
        { name: "First Month of Zero Plan Violations", description: "Complete a full month with no rule violations." },
        { name: "10 Consecutive Trades with No Plan Violations", description: "Log 10 trades in a row without breaking any rules." },
        { name: "25 Consecutive Trades with No Plan Violations", description: "Log 25 trades in a row without breaking any rules." },
        { name: "First Trade with No Partial Closes", description: "Complete a trade without taking partial profits." },
        { name: "First Trade with No SL Management Adjustments", description: "Let a trade play out without moving your Stop Loss." },
        { name: "First Week of Trading Only Planned Pairs", description: "Trade only the pairs defined in your plan for a week." },
        { name: "First Trade with All Inputs Completed", description: "Fill out every single field for one trade log." },
    ],
    "Performance Milestones": [
        { name: "First Winning Trade", description: "Log your first profitable trade." },
        { name: "10 Winning Trades", description: "Achieve 10 profitable trades." },
        { name: "5 Consecutive Winning Trades", description: "Win 5 trades in a row." },
        { name: "10 Consecutive Winning Trades", description: "Win 10 trades in a row." },
        { name: "First Trade with an R:R of 3:1", description: "Win a trade with a risk-to-reward ratio of 3:1 or greater." },
        { name: "First Trade with an R:R of 5:1", description: "Win a trade with a risk-to-reward ratio of 5:1 or greater." },
        { name: "First Trade with an R:R of 10:1", description: "Win a trade with a risk-to-reward ratio of 10:1 or greater." },
        { name: "First Profitable Week", description: "End a trading week with a positive P/L." },
        { name: "First Profitable Month", description: "End a trading month with a positive P/L." },
        { name: "First Month with 10%+ Gain", description: "Achieve a 10% or greater gain in a single month." },
        { name: "First Time Account is up 5%", description: "Grow your account balance by 5%." },
        { name: "First Time Account is up 10%", description: "Grow your account balance by 10%." },
    ],
    "Strategic & Analytical Milestones": [
        { name: "First Trade with Liquidity Sweep Confirmed", description: "Log a trade that correctly identified a liquidity sweep." },
        { name: "10 Trades with Liquidity Sweep Confirmed", description: "Log 10 trades based on liquidity sweeps." },
        { name: "First Trade from a Discount Zone", description: "Enter a trade from a confirmed discount zone." },
        { name: "First Trade from a Premium Zone", description: "Enter a trade from a confirmed premium zone." },
        { name: "First Trade with All Confirmation Reasons Filled", description: "Detail all your entry reasons for a trade." },
        { name: "First Trade in the London Session", description: "Log your first trade during London market hours." },
        { name: "First Trade in the New York Session", description: "Log your first trade during New York market hours." },
        { name: "First Trade in the Asia Session", description: "Log your first trade during Asian market hours." },
        { name: "First Trade with a News Event Logged", description: "Log a trade taken during a major news event." },
        { name: "First Time Logging Sentiments", description: "Log your Before, During, and After sentiments for a trade." },
    ],
    "Duration & Frequency Milestones": [
        { name: "First Trade under 15 minutes (Scalper)", description: "Complete a trade in under 15 minutes." },
        { name: "First Trade over 24 hours (Swing Trader)", description: "Hold a trade for more than 24 hours." },
        { name: "First Day with 5 Trades Logged", description: "Log 5 trades in a single day." },
        { name: "First Full Month with Daily Trading", description: "Log at least one trade every day for a full month." },
        { name: "First Time Logging a Long Position", description: "Log your first 'Buy' trade." },
        { name: "First Time Logging a Short Position", description: "Log your first 'Sell' trade." },
        { name: "First Time Trading a New Pair", description: "Log a trade on a currency pair you've never traded before." },
    ],
};

export const badges = {
    "General Trading Expertise": [
        { name: "The Planner", description: "For completing a trading plan for the first time." },
        { name: "The Journaler", description: "For logging 100 total trades." },
        { name: "The Analyzer", description: "For completing every input field on a trade log for the first time." },
        { name: "The Strategist", description: "For having 5 profitable strategies logged." },
        { name: "The Disciplinarian", description: "For a month with a perfect average discipline score." },
    ],
    "Performance-Based Badges": [
        { name: "Sniper", description: "For a trade with an R:R > 10." },
        { name: "The Streak", description: "For 5 consecutive winning trades." },
        { name: "The Money Maker", description: "For a single trade with a profit of $1,000+." },
        { name: "The Consistent", description: "For 3 consecutive profitable months." },
        { name: "The Comeback Kid", description: "For turning a losing streak into a profitable month." },
    ],
    "Strategy & Technical Analysis Badges": [
        { name: "Liquidity Hunter", description: "For 25 successful trades based on liquidity sweeps." },
        { name: "Trend Follower", description: "For 10 consecutive winning trades where direction matched higher timeframe bias." },
        { name: "The Reversalist", description: "For successfully identifying and trading a market reversal." },
        { name: "The Scalper", description: "For logging 50 trades with duration < 15 minutes." },
        { name: "The Swing Trader", description: "For logging 10 trades with duration > 24 hours." },
        { name: "The Breakout King", description: "For 10 winning trades based on a breakout strategy." },
        { name: "The Pullback Pro", description: "For 10 winning trades based on a pullback strategy." },
        { name: "The Zone Trader", description: "For 10 winning trades from a Discount or Premium zone." },
        { name: "The News Caster", description: "For correctly trading around a major news event." },
        { name: "The Indicator Wizard", description: "For having 5 successful trades using a specific indicator as a confirmation." },
    ],
    "Risk Management Badges": [
        { name: "Risk Manager", description: "For 50 trades with risk % within the plan's limit." },
        { name: "The Break Even Master", description: "For 10 trades where SL management was used successfully to move SL to break-even." },
        { name: "The Protector", description: "For 100 trades where a stop loss was always used and respected." },
        { name: "The Partial Close King", description: "For successfully using partial closes to lock in profits 10 times." },
        { name: "The Safe Trader", description: "For 50 consecutive trades where the max risk per trade was below 1%." },
    ],
    "Market & Session Badges": [
        { name: "London Session Specialist", description: "For 25 profitable trades during the London Session." },
        { name: "New York Session Specialist", description: "For 25 profitable trades during the New York Session." },
        { name: "Asia Session Specialist", description: "For 25 profitable trades during the Asia Session." },
        { name: "The EUR/USD Expert", description: "For 50 profitable trades on the EUR/USD pair." },
        { name: "The Gold Miner", description: "For 25 profitable trades on XAU/USD." },
        { name: "The Crypto King", description: "For 10 profitable trades on BTC/USD." },
        { name: "The Session Hunter", description: "For taking trades in all 3 major sessions in a single week." },
    ],
    "Emotional & Psychological Badges": [
        { name: "The Cold-Blooded", description: "For logging a trade with sentiments of 'calm' or 'focused' before, during, and after." },
        { name: "The Emotional Master", description: "For identifying a negative emotion but still adhering to the plan." },
        { name: "The Revenger", description: "For taking a revenge trade and immediately logging it as a plan violation. (This is a negative badge to highlight a bad habit)." },
        { name: "The Comebacker", description: "For logging a profitable trade immediately after a losing streak of 3 or more." },
    ],
    "User Interaction Badges": [
        { name: "The Mentor", description: "For helping another trader in a community forum." },
        { name: "The Learner", description: "For viewing 10 educational articles linked from alerts." },
        { name: "The Sharer", description: "For sharing a winning trade anonymously on the platform." },
    ],
    "Miscellaneous Badges": [
        { name: "The Early Bird", description: "For logging a trade before 6 AM." },
        { name: "The Night Owl", description: "For logging a trade after 10 PM." },
        { name: "The Weekend Warrior", description: "For a profitable trade logged on a weekend." },
        { name: "The Multi-Tasker", description: "For a week with trades in all three major sessions." },
        { name: "The All-Rounder", description: "For successfully trading 5 different pairs in a single month." },
        { name: "The Long-Term Investor", description: "For a trade duration of over one month." },
        { name: "The Pips King", description: "For a single trade that earned over 200 pips." },
        { name: "The Percent Master", description: "For a single trade that earned over 10% gain." },
        { name: "The Daily Grind", description: "For logging a trade every day for 10 consecutive trading days." },
        { name: "The Profit Creator", description: "For a total profit of $10,000 across all trades." },
    ]
};

export const progressTrackers = [
    {
        category: "Account-Based Progress",
        trackers: [
            { id: "account_growth", title: "Total Account Growth", target: 1000, format: 'currency' },
        ]
    },
    {
        category: "Discipline & Consistency",
        trackers: [
            { id: "discipline_score", title: "Discipline Score Tracker", target: 95, format: 'percentage' },
        ]
    },
    {
        category: "Strategic & Analytic",
        trackers: [
             { id: "win_rate", title: "Win Rate Goal", target: 70, format: 'percentage' },
        ]
    },
    {
        category: "Gamified Levels",
        trackers: [
            { id: "level_up", title: "Next Level", target: 10, format: 'number' },
        ]
    }
];

export const quests = {
    "Discipline & Risk Management Quests": [
        { name: "The Safe Trader", description: "Complete 5 consecutive trades with a risk_percent below your planned maximum." },
        { name: "The Zero-Violation Challenge", description: "Log 10 trades without a single plan violation." },
        { name: "The SL Protector", description: "For your next 3 losing trades, ensure your stop-loss was used and not moved." },
        { name: "The Break-Even Challenge", description: "Successfully move your SL to break-even on 5 winning trades." },
        { name: "The Mindful Trader", description: "Log 5 trades with a discipline_score of 95+ and positive sentiments." },
    ],
    "Strategy & Technical Quests": [
        { name: "The Liquidity Hunt", description: "Log 3 winning trades where you've identified a liquidity_swept_condition." },
        { name: "The Discount Zone Challenge", description: "Find and log 3 winning trades originating from a discount_premium_zones." },
        { name: "The 3:1 R:R Quest", description: "Achieve a trade with an r:r of at least 3:1." },
        { name: "The New Strategy Builder", description: "Log 10 trades using a new strategy_name and analyze its performance." },
        { name: "The Timeframe Explorer", description: "Log 5 trades using a new confirmation_reasons_by_timeframe you haven't used before." },
        { name: "The News Catcher", description: "Log and analyze a trade taken during a major news_data event." },
        { name: "The Consolidation King", description: "Identify a consolidating market and log a winning breakout trade from it." },
        { name: "The Reversalist", description: "Log a winning trade that successfully caught a market reversal." },
        { name: "The Day Trader", description: "Complete 10 trades with a duration of less than 4 hours." },
        { name: "The Trend Follower", description: "Log 5 consecutive winning trades that follow the higher-timeframe bias." },
    ],
    "Learning & Analytical Quests": [
        { name: "The Self-Coach", description: "For your next 3 losing trades, complete all the journaling prompts and write a detailed analysis of what went wrong." },
        { name: "The Data Analyst", description: "Review your monthly report and create a plan to improve your weakest performing metric." },
        { name: "The Sentiment Tracker", description: "Log 10 trades and carefully fill out the sentiments field for each one." },
        { name: "The Paired-Off", description: "Trade and log a minimum of 5 trades on a pair you've never traded before." },
    ],
    "Frequency & Consistency Quests": [
        { name: "The Daily Grind", description: "Log at least one trade every trading day for a full week." },
        { name: "The 5-Trade Week", description: "Log exactly 5 trades in a single week." },
        { name: "The Perfect Week", description: "Log a full week's worth of trades with a discipline score of 95+." },
        { name: "The Full-Month Challenge", description: "Log at least 10 trades every week for a full month." },
    ],
    "Emotional & Psychological Quests": [
        { name: "The Revenge Stopper", description: "After a losing trade, take a one-hour break and successfully avoid a revenge trade." },
        { name: "The Over-Trading Stopper", description: "For one full week, do not exceed your max_trades_per_day limit." },
        { name: "The Fear Conqueror", description: "Take a trade you are hesitant about, but where all your plan rules are met." },
    ],
};

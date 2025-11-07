
'use client';
import type { Trade, AppSettings } from './types';
import { pairsConfig } from './data';

function formatDuration(minutes: number) {
    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${minutes.toFixed(0)}m`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
    return `${(minutes / 1440).toFixed(1)}d`;
}

export function calculateGroupMetrics(trades: Trade[], appSettings: AppSettings, capital: number) {
    if (trades.length === 0 || !appSettings) { // Added guard for appSettings
        return { 
            profit: 0, loss: 0, trades: 0, winRate: 0, totalR: 0, avgR: 0, profitFactor: 0, totalPl: 0, gainPercent: 0,
            expectancy: 0, avgPl: 0, avgWin: 0, avgLoss: 0, avgLotSize: 0, maxWinStreak: 0, maxLossStreak: 0, avgDuration: '0m', avgScore: 0,
            avgWinScore: 0, avgLossScore: 0,
        };
    }

    const wins = trades.filter(t => t.auto.outcome === 'Win');
    const losses = trades.filter(t => t.auto.outcome === 'Loss');
    const grossProfit = wins.reduce((sum, t) => sum + t.auto.pl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.auto.pl, 0));
    const totalPl = grossProfit - grossLoss;
    const gainPercent = capital > 0 ? (totalPl / capital) * 100 : 0;
    const winRate = (wins.length / trades.length);
    const lossRate = (losses.length / trades.length);

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    
    const avgWinScore = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.auto.score?.value || 0), 0) / wins.length : 0;
    const avgLossScore = losses.length > 0 ? losses.reduce((sum, t) => sum + (t.auto.score?.value || 0), 0) / losses.length : 0;

    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);

    let totalR = 0;
    trades.forEach(trade => {
        const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
        if (trade.stopLoss && trade.stopLoss > 0) {
            const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
            const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
            if (riskAmount > 0) {
                totalR += trade.auto.pl / riskAmount;
            }
        }
    });

    let maxWinStreak = 0, maxLossStreak = 0, currentWin = 0, currentLoss = 0;
    trades.forEach(t => {
        if (t.auto.outcome === 'Win') { currentWin++; currentLoss = 0; }
        else if (t.auto.outcome === 'Loss') { currentLoss++; currentWin = 0; }
        else { currentWin = 0; currentLoss = 0; }
        maxWinStreak = Math.max(maxWinStreak, currentWin);
        maxLossStreak = Math.max(maxLossStreak, currentLoss);
    });
    
    return {
        profit: grossProfit,
        loss: -grossLoss,
        trades: trades.length,
        winRate: winRate * 100,
        totalR,
        avgR: trades.length > 0 ? totalR / trades.length : 0,
        profitFactor: grossLoss !== 0 ? grossProfit / grossLoss : Infinity,
        totalPl: totalPl,
        gainPercent,
        expectancy,
        avgPl: trades.length > 0 ? totalPl / trades.length : 0,
        avgWin,
        avgLoss,
        avgLotSize: trades.reduce((sum, t) => sum + t.lotSize, 0) / trades.length,
        maxWinStreak,
        maxLossStreak,
        avgDuration: formatDuration(trades.reduce((sum, t) => sum + t.auto.durationMinutes, 0) / trades.length),
        avgScore: trades.reduce((sum, t) => sum + (t.auto.score?.value || 0), 0) / trades.length,
        winCount: wins.length,
        lossCount: losses.length,
        avgWinScore,
        avgLossScore,
    };
};

export function calculateOverallStats(trades: Trade[], capital: number) {
  if (trades.length === 0) {
    return null;
  }

  const sortedTrades = [...trades].sort((a, b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());

  const totalTrades = trades.length;
  const winCount = trades.filter(t => t.auto.status === 'Win').length;
  const lossCount = trades.filter(t => t.auto.status === 'Loss').length;

  const grossWinPL = trades.reduce((sum, t) => (t.auto.pl > 0 ? sum + t.auto.pl : sum), 0);
  const grossLossPL = trades.reduce((sum, t) => (t.auto.pl < 0 ? sum + t.auto.pl : sum), 0);
  const totalPL = grossWinPL + grossLossPL;
  
  const firstTradeDate = sortedTrades.length > 0 ? new Date(sortedTrades[0].openDate) : new Date();
  const lastTradeDate = sortedTrades.length > 0 ? new Date(sortedTrades[sortedTrades.length - 1].closeDate) : new Date();
  const dayCount = Math.ceil((lastTradeDate.getTime() - firstTradeDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;

  const avgPL = totalTrades > 0 ? totalPL / totalTrades : 0;
  const perDayPL = dayCount > 0 ? totalPL / dayCount : 0;
  
  const avgDurationMinutes = totalTrades > 0 ? trades.reduce((sum, t) => sum + t.auto.durationMinutes, 0) / totalTrades : 0;
  const avgDuration = formatDuration(avgDurationMinutes);
  
  let totalGapMinutes = 0;
  for (let i = 1; i < sortedTrades.length; i++) {
    const prevTradeClose = new Date(`${sortedTrades[i - 1].closeDate}T${sortedTrades[i - 1].closeTime}`);
    const currentTradeOpen = new Date(`${sortedTrades[i].openDate}T${sortedTrades[i].openTime}`);
    totalGapMinutes += (currentTradeOpen.getTime() - prevTradeClose.getTime()) / (1000 * 60);
  }
  const avgGapTimeMinutes = sortedTrades.length > 1 ? totalGapMinutes / (sortedTrades.length - 1) : 0;
  const avgTradeDistance = formatDuration(avgGapTimeMinutes);

  const tradesByHour = trades.reduce((acc, trade) => {
      const hour = new Date(`${trade.openDate}T${trade.openTime}`).getHours();
      acc[hour] = (acc[hour] || 0) + trade.auto.pl;
      return acc;
  }, {} as Record<number, number>);
  const bestHour = Object.entries(tradesByHour).sort((a, b) => b[1] - a[1])[0]?.[0];
  const bestTime = bestHour ? `${bestHour.padStart(2, '0')}:00` : 'N/A';

  const avgMark = totalTrades > 0 ? trades.reduce((sum, t) => sum + t.auto.score.value, 0) / totalTrades : 0;
  const highestMark = totalTrades > 0 ? Math.max(...trades.map(t => t.auto.score.value)) : 0;
  const lowestMark = totalTrades > 0 ? Math.min(...trades.map(t => t.auto.score.value)) : 0;

  // Streaks
  let currentStreak = { type: 'N/A' as 'Win' | 'Loss' | 'Neutral' | 'N/A', count: 0 };
  let maxWinStreak = 0;
  let maxLossStreak = 0;

  if (sortedTrades.length > 0) {
      let currentWin = 0;
      let currentLoss = 0;
      for (const trade of sortedTrades) {
          if (trade.auto.status === 'Win') {
              currentWin++;
              currentLoss = 0;
              maxWinStreak = Math.max(maxWinStreak, currentWin);
          } else if (trade.auto.status === 'Loss') {
              currentLoss++;
              currentWin = 0;
              maxLossStreak = Math.max(maxLossStreak, currentLoss);
          } else {
              currentWin = 0;
              currentLoss = 0;
          }
      }
      const lastTradeStatus = sortedTrades[sortedTrades.length - 1].auto.status;
      let count = 0;
      for (let i = sortedTrades.length - 1; i >= 0; i--) {
          if (sortedTrades[i].auto.status === lastTradeStatus) count++;
          else break;
      }
      currentStreak = { type: lastTradeStatus, count };
  }

  return {
    totalTrades,
    winCount,
    lossCount,
    grossWinPL,
    grossLossPL: Math.abs(grossLossPL),
    totalPL,
    dayCount,
    avgPL,
    perDayPL,
    avgDuration,
    avgTradeDistance,
    bestTime,
    avgMark,
    highestMark,
    lowestMark,
    streaks: {
        currentStreak,
        maxWinStreak,
        maxLossStreak
    }
  };
}

    

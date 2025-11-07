

'use client';
import type { Trade, Journal, AutoCalculated, StrategyRule, TradeNote, AppSettings, TradingPlanData, StrategyRuleSection, Strategy, CustomField, RuleCombination, TiltmeterScore } from './types';
import { newsDatabase } from './data';
import type { NewsImpact } from './data';

const getIpdaZone = (time: string): string => {
    if (!time) return 'N/A';
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // 17:00 (5 PM) to 00:00 (midnight)
    if (totalMinutes >= 1020) {
        return 'Asian Range';
    }
    // 00:00 to 03:00
    if (totalMinutes >= 0 && totalMinutes < 180) {
        return 'Judas swing';
    }
    // 03:00 to 05:00
    if (totalMinutes >= 180 && totalMinutes < 300) {
        return 'London open Killzone';
    }
    // 05:00 to 08:00
    if (totalMinutes >= 300 && totalMinutes < 480) {
        return 'Pre New York';
    }
    // 08:00 to 08:30
    if (totalMinutes >= 480 && totalMinutes < 510) {
        return 'NewYork open';
    }
    // 08:30 to 11:00
    if (totalMinutes >= 510 && totalMinutes < 660) {
        return 'New York Killzone';
    }
    // 11:00 to 12:00
    if (totalMinutes >= 660 && totalMinutes < 720) {
        return 'London Close Killzon';
    }
    // 12:00 to 17:00
    if (totalMinutes >= 720 && totalMinutes < 1020) {
        return 'Rest of day';
    }

    return 'N/A';
}

const timeIsInRange = (time: number, start: string, end: string): boolean => {
    const [startH, startM] = start.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const [endH, endM] = end.split(':').map(Number);
    let endTime = endH * 60 + endM;

    if (endTime < startTime) { // Overnight range (e.g., 17:00 - 02:00)
      return time >= startTime || time < endTime;
    }
    return time >= startTime && time < endTime;
};

/**
 * Calculates all automatic metrics for a given trade.
 */
export const calculateTradeMetrics = (trade: Omit<Trade, 'auto'>, journal: Journal, appSettings: AppSettings): Omit<AutoCalculated, 'xp'> => {
    
  // Guard clause to prevent crashes if appSettings are not yet loaded.
  if (!appSettings || !appSettings.pairsConfig) {
    const fallbackScore = { value: 0, remark: 'N/A', color: '#888' };
    const fallbackTiltmeter: TiltmeterScore = {
      finalTilt: 0, scoreComponent: 0, sentimentComponent: 0, rComponent: 0, resultComponent: 0, plComponent: 0, customFieldComponent: 0,
    };
    return {
      session: 'N/A', result: 'Stop', status: 'Closed', outcome: 'Neutral', pips: 0, pl: 0, rr: 0, riskPercent: 0,
      gainPercent: 0, holdingTime: '0m', durationMinutes: 0, score: fallbackScore,
      newsImpact: 'N/A', mfe: 0, mae: 0, spreadCost: 0, commissionCost: 0, swapCost: 0, matchedSetups: [], tiltmeter: fallbackTiltmeter, expectancy: 0, ipdaZone: 'N/A'
    };
  }
  const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
  const isFundedOrComp = journal.type === 'Funded' || journal.type === 'Competition';
  
  const status: 'Open' | 'Closed' = (!trade.closeDate || !trade.closeTime) ? 'Open' : 'Closed';

    const timeToMinutes = (time: string): number => {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const tradeTimeInMinutes = timeToMinutes(trade.openTime);
    
    // --- Session Calculation based on fixed NY times ---
    const nySessionTimes = {
        Sydney: { start: '16:00', end: '01:00' },
        Asian: { start: '20:00', end: '05:00' },
        London: { start: '03:00', end: '12:00' },
        "New York": { start: '08:00', end: '17:00' },
    };

    const activeSessions: string[] = [];
    for (const [sessionName, times] of Object.entries(nySessionTimes)) {
        if (timeIsInRange(tradeTimeInMinutes, times.start, times.end)) {
            activeSessions.push(sessionName);
        }
    }
    const session = activeSessions.length > 0 ? activeSessions.join(' / ') : 'N/A';
    // --- End Session Calculation ---


  // P/L & Pips
  let grossPl = 0;
  let remainingLotSize = trade.lotSize;
  const hasClosingPrice = trade.closingPrice !== undefined && trade.closingPrice > 0;

  if (hasClosingPrice) {
    if (trade.partials && trade.hasPartial) {
      trade.partials.forEach(p => {
        const pips = (trade.direction === 'Buy' ? p.price - trade.entryPrice : trade.entryPrice - p.price) / pairInfo.pipSize;
        grossPl += pips * p.lotSize * pairInfo.pipValue;
        remainingLotSize -= p.lotSize;
      });
    }

    if (remainingLotSize > 0) {
      const pips = (trade.direction === 'Buy' ? (trade.closingPrice || 0) - trade.entryPrice : trade.entryPrice - (trade.closingPrice || 0)) / pairInfo.pipSize;
      grossPl += pips * remainingLotSize * pairInfo.pipValue;
    }
  }
  
  const spreadCost = (pairInfo.spread || 0) * pairInfo.pipValue * trade.lotSize;
  const commissionCost = trade.commission || 0;
  const swapCost = isFundedOrComp ? (trade.swap || 0) : 0;
  const totalCosts = commissionCost + swapCost;

  const pl = grossPl - totalCosts;
  const pips = (grossPl / (trade.lotSize * pairInfo.pipValue)) || 0;

  // Risk Amount
  const riskPipsAbs = trade.stopLoss > 0 ? Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize : 0;
  const riskDollars = riskPipsAbs * trade.lotSize * pairInfo.pipValue;
  const realizedR = riskDollars > 0 ? pl / riskDollars : 0;

  // Result & Outcome
  let result: 'TP' | 'SL' | 'BE' | 'Stop' | 'Running' = 'Running';
  let outcome: 'Win' | 'Loss' | 'Neutral' = 'Neutral';
  
  if (hasClosingPrice) {
      const priceThreshold = pairInfo.pipSize * 2;
      result = 'Stop';
      if (trade.breakeven?.type === 'Break Even' && Math.abs((trade.closingPrice || 0) - trade.entryPrice) < priceThreshold) {
          result = 'BE';
      } else if (trade.takeProfit && trade.takeProfit > 0 && Math.abs((trade.closingPrice || 0) - trade.takeProfit) < priceThreshold) {
          result = 'TP';
      } else if (trade.stopLoss && trade.stopLoss > 0 && Math.abs((trade.closingPrice || 0) - trade.stopLoss) < priceThreshold) {
          const isSafeSl = (trade.direction === 'Buy' && trade.stopLoss >= trade.entryPrice) || (trade.direction === 'Sell' && trade.stopLoss <= trade.entryPrice);
          result = isSafeSl ? 'Stop' : 'SL';
      }
    
      if (pl > 0) {
        outcome = 'Win';
      } else if (pl < 0) {
        outcome = 'Loss';
      }
  }
  
  // Planned R:R
  const rewardPipsAbs = trade.takeProfit ? Math.abs(trade.takeProfit - trade.entryPrice) / pairInfo.pipSize : 0;
  const rr = riskPipsAbs > 0 ? rewardPipsAbs / riskPipsAbs : 0;

  // Risk % & Gain %
  const riskPercent = journal.capital > 0 ? (riskDollars / journal.capital) * 100 : 0;
  const gainPercent = journal.capital > 0 ? (pl / journal.capital) * 100 : 0;
  
  // Holding Time
  let durationMinutes = 0;
  let holdingTime = 'Open';
  if (status === 'Closed' && trade.closeDate && trade.closeTime) {
    const openDateTime = new Date(`${trade.openDate}T${trade.openTime}`);
    const closeDateTime = new Date(`${trade.closeDate}T${trade.closeTime}`);
    durationMinutes = (closeDateTime.getTime() - openDateTime.getTime()) / (1000 * 60);
    
    const days = Math.floor(durationMinutes / 1440);
    const hours = Math.floor((durationMinutes % 1440) / 60);
    const minutes = Math.floor(durationMinutes % 60);
    let timeStr = '';
    if (days > 0) timeStr += `${days}d `;
    if (hours > 0) timeStr += `${hours}h `;
    if (minutes > 0 || timeStr.trim() === '') timeStr += `${minutes}m`;
    if(timeStr.trim() === '') holdingTime = '0m';
    else holdingTime = timeStr.trim();
  }

  // --- Start of Detailed Score Calculation ---
  let scoreValue = 0;
  const remarks: string[] = [];
  const selectedStrategy = journal.strategies?.find(s => s.name === trade.strategy);
  const tradeSelectedRuleIds = new Set(trade.selectedRuleIds || []);
  const plan = journal.plan;

  // 1. Risk Management
  const maxRisk = plan.riskUnit === '%' ? (journal.capital * plan.riskPerTrade / 100) : plan.riskPerTrade;
  if (riskDollars <= maxRisk) scoreValue += 12; else { scoreValue -= 12; remarks.push("Exceeded max risk."); }
  
  // 2. TIME Compliance
  const isInNoTradeZone = (plan.noTradeZones || []).some(zone => timeIsInRange(tradeTimeInMinutes, zone.start, zone.end));
  if (isInNoTradeZone) {
      scoreValue -= 7;
      remarks.push("Traded in no-trade zone.");
  } else {
      const isInActiveHours = (plan.activeHours || []).some(zone => timeIsInRange(tradeTimeInMinutes, zone.start, zone.end));
      if (isInActiveHours) {
          scoreValue += 7;
      } else {
          scoreValue += 3; // Neutral zone
      }
  }

  // 3. Instrument Compliance
  if (plan.instruments.includes(trade.pair)) scoreValue += 6; else { scoreValue -= 6; remarks.push("Pair not in plan."); }

  // 4. Strategy Adherence
  if (selectedStrategy && selectedStrategy.rules) {
      const allStrategyRules = new Set(selectedStrategy.rules.flatMap(rc => Object.values(rc.selectedRules).flat().map(rule => typeof rule === 'string' ? rule : rule.value)));
      const allSelectedIdsInStrategy = Array.from(tradeSelectedRuleIds).filter(id => allStrategyRules.has(id));

      if (allSelectedIdsInStrategy.length >= allStrategyRules.size) {
          scoreValue += 8;
      } else {
          scoreValue -= 7;
          remarks.push("Missed one or more required strategy rules.");
      }
  }


  // 5. Analysis Checklist Items (Timeframe-based)
  const getTimeframePoints = (timeframe: string): number => {
      const minutes = timeToMinutes(timeframe);
      if (minutes <= 10) return 3;
      if (minutes <= 60) return 5;
      if (minutes <= 480) return 7; // up to 8hr
      return 9; // more than 8hr
  };
  
  if (trade.analysisSelections) {
      for (const timeframe in trade.analysisSelections) {
          const pointsPerRule = getTimeframePoints(timeframe);
          const selections = trade.analysisSelections[timeframe];
          for (const subCatId in selections) {
              const rules = selections[subCatId];
              const subCat = appSettings.analysisConfigurations.flatMap(c => c.subCategories).find(sc => sc.id === subCatId);
              if (!subCat) continue;

              rules.forEach((rule: any) => {
                  const ruleValue = typeof rule === 'string' ? rule : rule.value;
                  const option = subCat.options.find(o => o.id === ruleValue);
                  if (!option) return;

                  if (subCat.id === 'bias') {
                      const biasValue = option.value;
                      if ((trade.direction === 'Buy' && biasValue === 'Bullish') || (trade.direction === 'Sell' && biasValue === 'Bearish')) scoreValue += pointsPerRule;
                      else if ((trade.direction === 'Buy' && biasValue === 'Bearish') || (trade.direction === 'Sell' && biasValue === 'Bullish')) {
                          scoreValue -= pointsPerRule;
                          remarks.push(`Traded against ${timeframe} ${biasValue} bias.`);
                      }
                  } else if (subCat.id === 'volatility') {
                      if (option.value === 'Low') {
                          scoreValue -= pointsPerRule;
                          remarks.push(`Traded in low volatility on ${timeframe}.`);
                      } else {
                          scoreValue += pointsPerRule;
                      }
                  } else if (subCat.id === 'zone') {
                      const area = option.value;
                      if (area === 'Equilibrium') {
                          scoreValue += pointsPerRule / 2;
                      } else if ((trade.direction === 'Buy' && area === 'Discount') || (trade.direction === 'Sell' && area === 'Premium')) {
                          scoreValue += pointsPerRule;
                      } else {
                          scoreValue -= pointsPerRule;
                          remarks.push(`Traded from opposing ${area} zone on ${timeframe}.`);
                      }
                  } else {
                      scoreValue += pointsPerRule;
                  }
              });
          }
      }
  }

  // 6. Sentiments
  const allSentiments = [...(trade.sentiment?.Before || []), ...(trade.sentiment?.During || []), ...(trade.sentiment?.After || [])];
  allSentiments.forEach(s => {
    const scoreEffect = appSettings.keywordScores.find(ks => ks.keyword.toLowerCase() === s.toLowerCase() && ks.type === 'Sentiment');
    if (scoreEffect?.effect === 'Positive') scoreValue += 5;
    if (scoreEffect?.effect === 'Negative') { scoreValue -= 5; remarks.push(`Negative sentiment: ${s}.`); }
  });

  // 7. Custom Fields
  if (trade.customStats && appSettings.customFields) {
    for (const fieldId in trade.customStats) {
        const fieldDef = appSettings.customFields.find(f => f.id === fieldId);
        if (fieldDef?.type === 'List' || fieldDef?.type === 'Button') {
            const values = Array.isArray(trade.customStats[fieldId]) ? trade.customStats[fieldId] : [trade.customStats[fieldId]];
            values.forEach((value: string) => {
                const option = fieldDef.options.find(o => o.value === value);
                if(option?.impact.includes('Positive')) scoreValue += 3;
                if(option?.impact.includes('Negative')) scoreValue -= 3;
            });
        }
    }
  }
  
  // 8. Media
  const imageCount = (trade.images?.length || 0) + Object.values(trade.imagesByTimeframe || {}).reduce((sum, arr) => sum + arr.length, 0);
  scoreValue += imageCount * 2;

  // 9. MFE/MAE
  if (trade.mae && trade.mfe && trade.wasTpHit !== undefined) scoreValue += 2;

  // 10. Lessons Learned
  if (trade.lessonsLearned && trade.lessonsLearned.length > 10) scoreValue += 5; else scoreValue -= 3;

  // 11. Other Plan Rules
  if (plan.minRiskToReward > 0) {
      if (rr >= plan.minRiskToReward) scoreValue += 5; else { scoreValue -= 5; remarks.push("R:R below plan minimum."); }
  }
  
  const tradesOnOpenDate = journal.trades.filter(t => t.openDate === trade.openDate && t.id !== trade.id);
  const plOnOpenDate = tradesOnOpenDate.reduce((sum, t) => sum + t.auto.pl, 0);
  
  if (plan.dailyTarget > 0 && plOnOpenDate >= (plan.dailyTargetUnit === '%' ? (journal.capital * plan.dailyTarget / 100) : plan.dailyTarget)) {
      scoreValue -= 5; remarks.push("Traded after hitting daily target.");
  } else {
      scoreValue += 5;
  }
  if (plan.dailyLossLimit > 0 && -plOnOpenDate >= (plan.dailyLossLimit / 100 * journal.capital)) {
      scoreValue -= 5; remarks.push("Traded after hitting daily loss limit.");
  } else {
      scoreValue += 5;
  }
  if (plan.maxTradesPerDay > 0 && tradesOnOpenDate.length >= plan.maxTradesPerDay) {
      scoreValue -= 5; remarks.push("Exceeded daily trade limit.");
  } else {
      scoreValue += 5;
  }

  const finalRemark = remarks.length > 0 ? remarks.join(' ') : "Excellent discipline!";
  let scoreColor = "#16a34a"; // green-600
  if (scoreValue < 75) scoreColor = "#f59e0b"; // yellow-500
  if (scoreValue < 50) scoreColor = "#ef4444"; // red-500

  const score = { value: scoreValue, remark: finalRemark, color: scoreColor };
  // --- End of Score Calculation ---

  // --- Tiltmeter Score Calculation ---
    const avgScoreAtTime = trade.avgScoreAtTime || 50;
    const scoreComponent = score.value > avgScoreAtTime ? 1 : -1;
    const positiveSentimentsCount = allSentiments.filter(s => (appSettings.keywordScores.find(ks => ks.keyword.toLowerCase() === s.toLowerCase())?.effect || 'Negative') === 'Positive').length;
    const negativeSentimentsCount = allSentiments.length - positiveSentimentsCount;
    const totalSentiments = allSentiments.length;
    const sentimentComponent = totalSentiments > 0 ? (positiveSentimentsCount - negativeSentimentsCount) / totalSentiments : 0;
    
    let customFieldComponent = 0;
    if (trade.customStats && appSettings.customFields) {
        let totalImpact = 0;
        let numImpactFields = 0;
        for (const fieldId in trade.customStats) {
            const fieldDef = appSettings.customFields.find(f => f.id === fieldId);
            if (fieldDef?.type === 'List' || fieldDef?.type === 'Button') {
                const values = Array.isArray(trade.customStats[fieldId]) ? trade.customStats[fieldId] : [trade.customStats[fieldId]];
                values.forEach((value: string) => {
                    const option = fieldDef.options.find(o => o.value === value);
                    if(option) {
                        numImpactFields++;
                        if (option.impact.includes('Positive')) totalImpact += 1;
                        if (option.impact.includes('Negative')) totalImpact -= 1;
                    }
                });
            }
        }
        if (numImpactFields > 0) {
            customFieldComponent = totalImpact / numImpactFields;
        }
    }
    
    const cappedR = Math.max(-3, Math.min(5, realizedR));
    let rComponent = cappedR >= 1.5 ? (cappedR - 1.5) / 3.5 : (cappedR - 1.5) / 4.5;
    rComponent = Math.max(-1, Math.min(1, rComponent));
    let resultComponent = 0;
    if (outcome === 'Win') resultComponent = 1; else if (outcome === 'Loss') resultComponent = -1; else resultComponent = 0.1;
    const avgPlAtTime = trade.avgPlAtTime || 0;
    let plComponent = 0;
    if (avgPlAtTime !== 0) { plComponent = (pl - avgPlAtTime) / Math.abs(avgPlAtTime); }
    else { plComponent = pl > 0 ? 1 : (pl < 0 ? -1 : 0); }
    plComponent = Math.max(-1, Math.min(1, plComponent));
    
    const tiltScoreValue = 
      (scoreComponent * 0.30) + 
      (sentimentComponent * 0.20) +
      (customFieldComponent * 0.20) +
      (rComponent * 0.10) + 
      (resultComponent * 0.10) +
      (plComponent * 0.10);
    
    const tiltmeter: TiltmeterScore = {
        finalTilt: Math.max(-1, Math.min(1, tiltScoreValue)),
        scoreComponent, sentimentComponent, rComponent, resultComponent, plComponent, customFieldComponent
    };
  // --- End of Tiltmeter Score Calculation ---

  // News Impact
  const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1, 'Holiday': 0, 'N/A': -1 };
  let highestImpact: NewsImpact | 'N/A' = 'N/A';
  if (trade.newsEvents && trade.newsEvents.length > 0) {
    let maxImpactLevel = 0;
    trade.newsEvents.forEach(ne => {
      if (ne.impact) {
        const level = impactOrder[ne.impact];
        if (level > maxImpactLevel) {
          maxImpactLevel = level;
          highestImpact = ne.impact;
        }
      }
    });
  }
  
  const mfePips = trade.mfe && trade.mfe > 0 ? Math.abs(trade.mfe - trade.entryPrice) / pairInfo.pipSize : 0;
  const maePips = trade.mae && trade.mae > 0 ? Math.abs(trade.entryPrice - trade.mae) / pairInfo.pipSize : 0;

  const matchedSetups: string[] = [];
  if (selectedStrategy && trade.analysisSelections) {
      const currentTradeSelections = trade.analysisSelections;
      (selectedStrategy.setups || []).forEach(setup => {
          const isMatched = (setup.rules || []).every(ruleCombination => {
              const timeframe = ruleCombination.timeframe;
              const rulesForTimeframe = ruleCombination.selectedRules;

              if (!currentTradeSelections[timeframe]) {
                  return false;
              }
              const tradeSelectionsForTimeframe = currentTradeSelections[timeframe];
              
              return Object.entries(rulesForTimeframe).every(([subCatId, setupRules]) => {
                  if (!tradeSelectionsForTimeframe[subCatId]) return false;
                  const tradeRulesForSubCat = tradeSelectionsForTimeframe[subCatId];
                  return (setupRules as any[]).every(setupRule => {
                      const setupRuleValue = typeof setupRule === 'string' ? setupRule : setupRule.value;
                      return (tradeRulesForSubCat as any[]).some(tradeRule => {
                           const tradeRuleValue = typeof tradeRule === 'string' ? tradeRule : tradeRule.value;
                           return tradeRuleValue === setupRuleValue;
                      });
                  });
              });
          });

          if (isMatched) {
              matchedSetups.push(setup.name);
          }
      });
  }
    const wins = journal.trades.filter(t => t.auto.outcome === 'Win');
    const losses = journal.trades.filter(t => t.auto.outcome === 'Loss');
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + t.auto.pl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + t.auto.pl, 0) / losses.length) : 0;
    const winRate = journal.trades.length > 0 ? wins.length / journal.trades.length : 0;
    const lossRate = 1 - winRate;
    const expectancy = (winRate * avgWin) - (lossRate * avgLoss);


  return {
    session,
    ipdaZone: getIpdaZone(trade.openTime),
    result,
    status,
    outcome,
    pips: parseFloat(pips.toFixed(2)),
    pl: parseFloat(pl.toFixed(2)),
    rr: parseFloat(rr.toFixed(2)),
    riskPercent: parseFloat(riskPercent.toFixed(2)),
    gainPercent: parseFloat(gainPercent.toFixed(2)),
    holdingTime,
    durationMinutes,
    score,
    tiltmeter,
    newsImpact: highestImpact,
    mfe: mfePips,
    mae: maePips,
    spreadCost,
    commissionCost,
    swapCost,
    matchedSetups,
    expectancy
  };
};

export const calculateTradeXp = (trade: Trade): number => {
    let xp = 10;
    if (trade.auto.outcome === 'Win') xp += 50;
    if (trade.auto.outcome === 'Loss') xp += 10;
    if (trade.auto.score.value === 100) xp += 100;
    if (trade.auto.rr >= 3) xp += 50;
    if (trade.auto.rr >= 5) xp += 100;
    if (trade.entryReasons?.length > 0) xp += 20;
    return Math.round(xp);
};

export const calculateMdScore = (journal: Journal | null | undefined) => {
    if (!journal || !journal.trades || !journal.rules || journal.trades.length < 5) {
        return {
            totalScore: 0, profitabilityScore: 0, consistencyScore: 0, riskManagementScore: 0, disciplineScore: 0,
            feedback: "Need at least 5 trades to calculate a meaningful MD Score."
        };
    }
    const trades = journal.trades.filter(t => !t.isMissing);

    if (trades.length < 5) {
        return {
            totalScore: 0,
            profitabilityScore: 0,
            consistencyScore: 0,
            riskManagementScore: 0,
            disciplineScore: 0,
            feedback: "Need at least 5 trades to calculate a meaningful MD Score."
        };
    }
    const { rules, currentMaxDrawdown, capital } = journal;

    // 1. Profitability (30 points) - Based on Profit Factor
    const grossProfit = trades.reduce((sum, t) => t.auto.pl > 0 ? sum + t.auto.pl : sum, 0);
    const grossLoss = Math.abs(trades.reduce((sum, t) => t.auto.pl < 0 ? sum + t.auto.pl : sum, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 3 : 0);
    const profitabilityScore = Math.min(30, Math.max(0, (profitFactor / 3) * 30));

    // 2. Consistency (30 points) - Based on Win Rate, adjusted for volatility
    const winRate = trades.filter(t => t.auto.status === 'Win').length / trades.length;
    const returns = trades.map(t => t.auto.pl);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map(x => Math.pow(x - meanReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? meanReturn / stdDev : 0; 
    const consistencyScore = Math.min(30, Math.max(0, (winRate * 20) + (Math.max(0, sharpeRatio) * 10)));

    // 3. Risk Management (20 points) - Based on staying within drawdown limits
    const maxDrawdownLimit = rules.maxDrawdown.type === 'amount' ? rules.maxDrawdown.value : (capital * rules.maxDrawdown.value / 100);
    const drawdownUsage = maxDrawdownLimit > 0 ? (currentMaxDrawdown / maxDrawdownLimit) * 100 : 0;
    const riskManagementScore = Math.max(0, 20 - (drawdownUsage / 5)); 

    // 4. Discipline (20 points) - Based on average trade score
    const avgDisciplineScore = trades.reduce((sum, t) => sum + t.auto.score.value, 0) / trades.length;
    const disciplineScore = (avgDisciplineScore / 100) * 20;

    const totalScore = profitabilityScore + consistencyScore + riskManagementScore + disciplineScore;

    let feedback = "A solid, balanced performance. Keep refining your edge.";
    if (totalScore >= 85) feedback = "Exceptional performance! You are demonstrating mastery across all key areas.";
    else if (totalScore >= 70) feedback = "Very good performance. You have a profitable and consistent approach.";
    else if (totalScore < 50) feedback = "Area for improvement. Focus on strengthening your weakest component.";
    if(profitabilityScore < 10) feedback = "Profitability is low. Review your strategy for a better risk/reward profile.";
    if(consistencyScore < 10) feedback = "Consistency needs work. Analyze your win rate and the volatility of your returns.";
    if(riskManagementScore < 10) feedback = "Risk management is a concern. Re-evaluate your position sizing and stop loss strategy.";
    if(disciplineScore < 10) feedback = "Discipline is lacking. Adhere more closely to your trading plan and checklists.";


    return {
        totalScore,
        profitabilityScore,
        consistencyScore,
        riskManagementScore,
        disciplineScore,
        feedback
    };
}

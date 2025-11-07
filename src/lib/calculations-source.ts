

export const calculationsSource = `
import type { Trade, Journal, AutoCalculated, StrategyRule } from '@/types';
import { pairsConfig } from './data';
import { newsDatabase } from './news-database';
import type { NewsImpact } from './data';

export const calculateTradeMetrics = (trade: Omit<Trade, 'auto'>, journal: Journal, dynamicPairsConfig = pairsConfig): Omit<AutoCalculated, 'xp'> => {
  const pairInfo = dynamicPairsConfig[trade.pair as keyof typeof dynamicPairsConfig] || dynamicPairsConfig['Other'];

  // Session
  const openHour = parseInt(trade.openTime.split(':')[0], 10);
  const openMinute = parseInt(trade.openTime.split(':')[1], 10);
  const tradeTimeInMinutes = openHour * 60 + openMinute;
  
  const plan = journal.plan;
  let session = 'N/A';

  const timeIsInRange = (time: number, start: string, end: string): boolean => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    if (endTime < startTime) { // Overnight range (e.g., 17:00 - 02:00)
      return time >= startTime || time < endTime;
    }
    return time >= startTime && time < endTime;
  };
  
  // 1. Check Kill Zones first
  const activeKillZone = (plan.killZones || []).find(zone => timeIsInRange(tradeTimeInMinutes, zone.start, zone.end));

  if (activeKillZone) {
    session = activeKillZone.name;
  } else {
    // 2. Check for Overlaps and Single Sessions
    const activeSessions = (['Sydney', 'Asian', 'London', 'New York'] as const).filter(sessionName => {
        const timing = plan.sessionTimings[sessionName];
        return timing && timeIsInRange(tradeTimeInMinutes, timing.start, timing.end);
    });

    if (activeSessions.length > 0) {
      session = activeSessions.join(' / ');
    }
  }


  // P/L & Pips
  let totalPl = 0;
  let remainingLotSize = trade.lotSize;

  // Calculate P/L from partials
  if (trade.partials && trade.hasPartial) {
    trade.partials.forEach(p => {
      const pips = (trade.direction === 'Buy' ? p.price - trade.entryPrice : trade.entryPrice - p.price) / pairInfo.pipSize;
      totalPl += pips * p.lotSize * pairInfo.pipValue;
      remainingLotSize -= p.lotSize;
    });
  }

  // Calculate P/L for the remaining position
  if (remainingLotSize > 0) {
    const pips = (trade.direction === 'Buy' ? trade.closingPrice - trade.entryPrice : trade.entryPrice - trade.closingPrice) / pairInfo.pipSize;
    totalPl += pips * remainingLotSize * pairInfo.pipValue;
  }
  
  const pl = totalPl;
  const pips = (pl / (trade.lotSize * pairInfo.pipValue)) || 0;


  // Result & Status
  let result: 'TP' | 'SL' | 'BE' | 'Stop' = 'Stop';
  const priceThreshold = pairInfo.pipSize * 2; // Tolerance for price matching

  if (trade.breakeven?.type === 'Break Even' && Math.abs(trade.closingPrice - trade.entryPrice) < priceThreshold) {
      result = 'BE';
  } else if (Math.abs(trade.closingPrice - trade.takeProfit) < priceThreshold) {
      result = 'TP';
  } else if (Math.abs(trade.closingPrice - trade.stopLoss) < priceThreshold) {
      result = 'SL';
  }

  let status: 'Win' | 'Loss' | 'Neutral' = 'Neutral';
  if (pl > 0) {
      status = 'Win';
  } else if (pl < 0) {
      status = 'Loss';
  } else {
      status = 'Neutral';
  }
  
  // Risk Amount
  const riskPipsAbs = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
  const riskDollars = riskPipsAbs * trade.lotSize * pairInfo.pipValue;

  // Planned R:R
  const rewardPipsAbs = Math.abs(trade.takeProfit - trade.entryPrice) / pairInfo.pipSize;
  const rr = riskPipsAbs > 0 ? rewardPipsAbs / riskPipsAbs : 0;

  // Risk %
  const riskPercent = (riskDollars / journal.capital) * 100;

  // Gain %
  const gainPercent = (pl / journal.capital) * 100;
  
  // Holding Time
  const openDateTime = new Date(\`\${trade.openDate}T\${trade.openTime}\`);
  const closeDateTime = new Date(\`\${trade.closeDate}T\${trade.closeTime}\`);
  const durationMinutes = (closeDateTime.getTime() - openDateTime.getTime()) / (1000 * 60);
  
  let holdingTime = '';
  const days = Math.floor(durationMinutes / 1440);
  const hours = Math.floor((durationMinutes % 1440) / 60);
  const minutes = Math.floor(durationMinutes % 60);
  if (days > 0) holdingTime += \`\${days}d \`;
  if (hours > 0) holdingTime += \`\${hours}h \`;
  if (minutes > 0 || holdingTime.trim() === '') holdingTime += \`\${minutes}m\`;
  if(holdingTime.trim() === '') holdingTime = '0m';

  // --- Start of Detailed Score Calculation ---
  let scoreValue = 0;
  const remarks: string[] = [];
  const selectedStrategy = journal.strategies?.find(s => s.name === trade.strategy);
  const tradeSelectedRuleIds = new Set(trade.selectedRuleIds || []);

  // 1. Time Compliance
  let timeCompliant = true;
  if(plan.activeHours?.length > 0) {
      const isInActive = plan.activeHours.some(activeZone => {
          const [startHour, startMinute] = activeZone.start.split(':').map(Number);
          const startTimeInMinutes = startHour * 60 + startMinute;
          const [endHour, endMinute] = activeZone.end.split(':').map(Number);
          let endTimeInMinutes = endHour * 60 + endMinute;
          if (endTimeInMinutes < startTimeInMinutes) return tradeTimeInMinutes >= startTimeInMinutes || tradeTimeInMinutes <= endTimeInMinutes;
          return tradeTimeInMinutes >= startTimeInMinutes && tradeTimeInMinutes <= endTimeInMinutes;
      });
      if(!isInActive) timeCompliant = false;
  }
  if((plan.noTradeZones || []).some(zone => {
      const [zoneStartH, zoneStartM] = zone.start.split(':').map(Number);
      const zoneStartMins = zoneStartH * 60 + zoneStartM;
      const [zoneEndH, zoneEndM] = zone.end.split(':').map(Number);
      const zoneEndMins = zoneEndH * 60 + zoneEndM;
      if(zoneEndMins < zoneStartMins) return tradeTimeInMinutes >= zoneStartMins || tradeTimeInMinutes <= zoneEndMins;
      return tradeTimeInMinutes >= zoneStartMins && tradeTimeInMinutes <= zoneEndMins;
  })) {
      timeCompliant = false;
  }
  if (timeCompliant) scoreValue += 10; else { scoreValue -= 10; remarks.push("Time outside of plan."); }

  // 2. Pair Compliance
  if (plan.instruments.includes(trade.pair)) scoreValue += 5; else { scoreValue -= 5; remarks.push("Pair not in plan."); }

  // 3. Risk Compliance
  const maxRisk = plan.riskUnit === '%' ? (journal.capital * plan.riskPerTrade / 100) : plan.riskPerTrade;
  if (riskDollars <= maxRisk) scoreValue += 10; else { scoreValue -= 20; remarks.push("Exceeded max risk."); }

  // 4. Daily Trade Limit
  const tradesOnSameDay = journal.trades.filter(t => t.openDate === trade.openDate && t.id !== trade.id).length;
  if (plan.maxTradesPerDay === 0 || (tradesOnSameDay + 1) <= plan.maxTradesPerDay) {
    scoreValue += 5;
  } else {
    scoreValue -= 10;
    remarks.push("Exceeded daily trade limit.");
  }
  
  // 5. Strategy Adherence
  if (selectedStrategy && selectedStrategy.rules) {
      const allStrategyRules: (StrategyRule & { ruleType: StrategyRuleType })[] = selectedStrategy.rules.flatMap(section => 
          (section.rules || []).map(rule => ({ ...rule, ruleType: section.ruleType }))
      );

      tradeSelectedRuleIds.forEach(ruleId => {
          const rule = allStrategyRules.find(r => r.id === ruleId);
          if (!rule) {
              scoreValue += 3; // For custom rules not in definition
              return;
          }

          switch (rule.ruleType) {
              case 'bias':
                  if ((trade.direction === 'Buy' && rule.values.structure === 'Bearish') || (trade.direction === 'Sell' && rule.values.structure === 'Bullish')) {
                      scoreValue -= 10;
                      remarks.push(\`Traded against \${rule.values.timeframe} \${rule.values.structure} bias.\`);
                  } else {
                      scoreValue += 5;
                  }
                  break;
              case 'zone':
                  if ((trade.direction === 'Buy' && rule.values.area === 'Premium') || (trade.direction === 'Sell' && rule.values.area === 'Discount')) {
                      scoreValue -= 5;
                      remarks.push(\`Traded from opposing \${rule.values.area} zone.\`);
                  } else {
                      scoreValue += 5;
                  }
                  break;
              case 'custom':
                  scoreValue += 3;
                  break;
              default:
                  scoreValue += 2;
                  break;
          }
      });
  }


  // 6. Sentiment/Keyword Score
  const keywordScores = appSettings.keywordScores || [];
  const allSentiments = [...(trade.sentiment?.Before || []), ...(trade.sentiment?.During || []), ...(trade.sentiment?.After || [])];
  allSentiments.forEach(s => {
    const scoreEffect = keywordScores.find(ks => ks.keyword.toLowerCase() === s.toLowerCase() && ks.type === 'Sentiment');
    if (scoreEffect?.effect === 'Positive') scoreValue += 1;
    if (scoreEffect?.effect === 'Negative') { scoreValue -= 5; remarks.push(\`Negative sentiment: \${s}.\`); }
  });

  const tradeNoteContent = (Array.isArray(trade.note) ? trade.note.map(n => n.content).join(' ') : (trade.note || '')).toLowerCase();
  const noteKeywords = keywordScores.filter(ks => ks.type === 'Keyword');
  noteKeywords.forEach(kw => {
      if (tradeNoteContent.includes(kw.keyword.toLowerCase())) {
          if (kw.effect === 'Positive') scoreValue += 2;
          if (kw.effect === 'Negative') { scoreValue -= 5; remarks.push(\`Used keyword: "\${kw.keyword}".\`); }
      }
  });

  // Final score clamping and remark generation
  const finalScore = Math.max(0, Math.min(100, scoreValue));
  const finalRemark = remarks.length > 0 ? remarks.join(' ') : "Excellent discipline!";
  let scoreColor = "#16a34a"; // green-600
  if (finalScore < 75) scoreColor = "#f59e0b"; // yellow-500
  if (finalScore < 50) scoreColor = "#ef4444"; // red-500

  const score = {
    value: finalScore,
    remark: finalRemark,
    color: scoreColor
  };
  // --- End of Score Calculation ---

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
  
  return {
    session,
    result,
    status,
    pips: parseFloat(pips.toFixed(2)),
    pl: parseFloat(pl.toFixed(2)),
    rr: parseFloat(rr.toFixed(2)),
    riskPercent: parseFloat(riskPercent.toFixed(2)),
    gainPercent: parseFloat(gainPercent.toFixed(2)),
    holdingTime: holdingTime.trim(),
    durationMinutes,
    score,
    newsImpact: highestImpact,
  };
};
`;


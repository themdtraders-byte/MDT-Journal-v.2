
'use client';

import { useMemo } from 'react';
import type { Trade, ExecutionChecklist, AnalysisCategory } from '@/types';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import FormattedNumber from './ui/formatted-number';
import { calculateTradeMetrics } from '@/lib/calculations';
import { cn } from '@/lib/utils';
import { isEqual } from 'lodash';
import { icons } from 'lucide-react';
import { HelpCircle } from 'lucide-react';


const MetricItem = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
    <div className="grid grid-cols-2 items-center">
        <span className="text-muted-foreground text-xs">{label}</span>
        <div className={cn("text-xs font-semibold text-right", className)}>{value}</div>
    </div>
);


const AnalysisSidebar = ({ checklist, allTrades }: { checklist: ExecutionChecklist, allTrades: Trade[] }) => {
    const { appSettings, activeJournalId, journals } = useJournalStore(state => ({
        appSettings: state.appSettings,
        activeJournalId: state.activeJournalId,
        journals: state.journals,
    }));
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);


    const selectedStrategy = useMemo(() => {
        return activeJournal?.strategies?.find(s => s.id === checklist.selectedStrategyId);
    }, [checklist.selectedStrategyId, activeJournal?.strategies]);
    
    const combinedAnalysisConfigs = useMemo(() => {
        if (!appSettings || !activeJournal) return [];

        const globalConfigs: AnalysisCategory[] = JSON.parse(JSON.stringify(appSettings.analysisConfigurations || []));
        const strategyConfigs = selectedStrategy?.analysisConfigurations || [];

        if (strategyConfigs.length === 0) {
            return globalConfigs;
        }
        
        const mergedConfigs = globalConfigs.map(cat => ({ ...cat }));

        strategyConfigs.forEach(stratCat => {
            let globalCat = mergedConfigs.find(gc => gc.id === stratCat.id);
            if (!globalCat) {
                mergedConfigs.push(JSON.parse(JSON.stringify(stratCat)));
            } else {
                 stratCat.subCategories.forEach(stratSubCat => {
                    let globalSubCat = globalCat!.subCategories.find(gsc => gsc.id === stratSubCat.id);
                    if(!globalSubCat) {
                        globalCat!.subCategories.push(JSON.parse(JSON.stringify(stratSubCat)));
                    } else {
                        stratSubCat.options.forEach(stratOpt => {
                            if (!globalSubCat!.options.some((o: any) => o.value.toLowerCase() === stratOpt.value.toLowerCase())) {
                                globalSubCat!.options.push(JSON.parse(JSON.stringify(stratOpt)));
                            }
                        });
                    }
                 });
            }
        });

        return mergedConfigs;
    }, [appSettings, activeJournal, selectedStrategy]);


    const metrics = useMemo(() => {
        if (!activeJournal || !appSettings || !selectedStrategy) {
            return { pl: 'N/A', rr: 'N/A', riskPips: 'N/A', riskPercent: 'N/A', status: 'N/A', result: 'N/A', session: 'N/A', holdingTime: 'N/A', newsImpact: 'N/A', score: 'N/A' };
        }

        const tradeForCalc: Partial<Trade> = {
            ...checklist.optionalPrefills,
            openDate: checklist.selectedDate!,
            openTime: checklist.currentTime!,
            pair: checklist.selectedPair!,
            direction: checklist.optionalPrefills?.direction || 'Buy',
            lotSize: parseFloat(checklist.optionalPrefills?.lotSize || '1') || 1,
            entryPrice: parseFloat(checklist.optionalPrefills?.entryPrice || '0') || 0,
            closingPrice: parseFloat(checklist.optionalPrefills?.closingPrice || '0') || 0,
            stopLoss: parseFloat(checklist.optionalPrefills?.stopLoss || '0') || 0,
            takeProfit: parseFloat(checklist.optionalPrefills?.takeProfit || '0') || 0,
            mae: parseFloat(checklist.optionalPrefills?.mae || '0') || 0,
            mfe: parseFloat(checklist.optionalPrefills?.mfe || '0') || 0,
            newsEvents: checklist.optionalPrefills?.newsEvents,
            analysisSelections: checklist.analysisSelections,
        };
        
        const calculated = calculateTradeMetrics(tradeForCalc as Omit<Trade, 'auto'>, activeJournal, appSettings);
        const pairInfo = appSettings.pairsConfig[tradeForCalc.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
        const riskPips = tradeForCalc.stopLoss && tradeForCalc.stopLoss > 0 ? Math.abs(tradeForCalc.entryPrice! - tradeForCalc.stopLoss) / pairInfo.pipSize : 0;
        
        return {
            pl: calculated.pl.toFixed(2),
            rr: calculated.rr.toFixed(2),
            riskPips: riskPips.toFixed(1),
            riskPercent: calculated.riskPercent.toFixed(2),
            status: calculated.outcome,
            result: calculated.result,
            session: calculated.session,
            holdingTime: calculated.holdingTime,
            newsImpact: 'N/A',
            score: calculated.score.value.toFixed(0),
        };
    }, [checklist, activeJournal, appSettings, selectedStrategy]);

    const historicalPerformanceMap = useMemo(() => {
        const performanceMap = new Map<string, { wins: number; count: number }>();
        if (!allTrades || !combinedAnalysisConfigs) return performanceMap;
    
        allTrades.forEach(trade => {
            if (!trade.analysisSelections) return;
    
            Object.entries(trade.analysisSelections).forEach(([timeframe, selections]) => {
                Object.entries(selections).forEach(([subCatId, options]) => {
                    const subCatDef = combinedAnalysisConfigs.flatMap(c => c.subCategories).find(sc => sc.id === subCatId);
                    if (!subCatDef) return;
    
                    (options as any[]).forEach(item => {
                        const optionId = typeof item === 'string' ? item : item.value;
                        const optionDef = subCatDef.options.find(o => o.id === optionId);
                        if (!optionDef) return;
    
                        const modifiers = typeof item === 'object' && item !== null ? Object.entries(item).filter(([key]) => key !== 'value') : [];
                        modifiers.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
                        
                        const modifiersText = modifiers.map(([key, value]) => `${key}:${value}`).join(';');
                        
                        const uniqueKey = `${subCatId}|${timeframe}|${optionDef.id}|${modifiersText}`;
    
                        if (!performanceMap.has(uniqueKey)) {
                            performanceMap.set(uniqueKey, { wins: 0, count: 0 });
                        }
                        const stats = performanceMap.get(uniqueKey)!;
                        stats.count++;
                        if (trade.auto.outcome === 'Win') {
                            stats.wins++;
                        }
                    });
                });
            });
        });
    
        return performanceMap;
    }, [allTrades, combinedAnalysisConfigs]);

    const performanceData = useMemo(() => {
        if (!selectedStrategy || !checklist.analysisSelections || Object.keys(checklist.analysisSelections).length === 0 || !appSettings || !combinedAnalysisConfigs) {
            return [];
        }

        const selectedRules = Object.entries(checklist.analysisSelections).flatMap(([timeframe, subCatSelections]) =>
            Object.entries(subCatSelections).flatMap(([subCatId, options]) =>
                (options as any[]).map(option => ({
                    timeframe,
                    subCatId,
                    option // Keep the full option object (string or object with modifiers)
                }))
            )
        );

        if (selectedRules.length === 0) return [];

        return selectedRules.map(currentRule => {
            const ruleOptionId = typeof currentRule.option === 'string' ? currentRule.option : currentRule.option.value;
            const subCatDef = combinedAnalysisConfigs.flatMap(c => c.subCategories).find(sc => sc.id === currentRule.subCatId);
            const ruleDefinition = subCatDef?.options.find(opt => opt.id === ruleOptionId);
            if (!ruleDefinition) return null;
            
            const modifiers = typeof currentRule.option === 'object' && currentRule.option !== null ? Object.entries(currentRule.option).filter(([key]) => key !== 'value') : [];
            modifiers.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
            const modifiersText = modifiers.map(([key, value]) => `${key}:${value}`).join(';');
            const subtext = modifiers.map(([, val]) => val).join(', ');

            const uniqueKey = `${currentRule.subCatId}|${currentRule.timeframe}|${ruleOptionId}|${modifiersText}`;
            
            const stats = historicalPerformanceMap.get(uniqueKey) || { wins: 0, count: 0 };
            const winRate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0;
            
            return {
                id: uniqueKey,
                name: ruleDefinition.value,
                category: subCatDef?.title || 'Unknown',
                timeframe: currentRule.timeframe,
                subtext: subtext,
                winRate,
                tradesCount: stats.count
            };
        }).filter(Boolean);
    }, [checklist.analysisSelections, selectedStrategy, appSettings, combinedAnalysisConfigs, historicalPerformanceMap]);
    
     const matchedSetup = useMemo(() => {
        if (!selectedStrategy || !selectedStrategy.setups || !checklist.analysisSelections) return null;
        
        const setup = selectedStrategy.setups.find(s => {
          if (!s.rules || s.rules.length === 0) return false;
          return s.rules.every(ruleCombination => {
            const timeframe = ruleCombination.timeframe;
            if (!checklist.analysisSelections[timeframe]) return false;
            
            const checklistSelectionsForTimeframe = checklist.analysisSelections[timeframe];
            return Object.entries(ruleCombination.selectedRules).every(([subCatId, setupRules]) => {
              if (!checklistSelectionsForTimeframe[subCatId]) return false;
              
              const tradeRulesForSubCat = checklistSelectionsForTimeframe[subCatId];
              return (setupRules as any[]).every(setupRuleValue => 
                (tradeRulesForSubCat as any[]).some(tradeRule => 
                  isEqual(tradeRule, setupRuleValue)
                )
              );
            });
          });
        });

        if (!setup) return null;

        const setupTrades = allTrades.filter(trade => (trade.auto.matchedSetups || []).includes(setup.name));
        const winCount = setupTrades.filter(t => t.auto.status === 'Win').length;
        const winRate = setupTrades.length > 0 ? (winCount / setupTrades.length) * 100 : 0;

        return {
            name: setup.name,
            winRate
        };

    }, [checklist.analysisSelections, selectedStrategy, allTrades]);


    return (
        <div className="space-y-4">
            <Card className="glassmorphic">
                <CardHeader className="p-3"><CardTitle className="text-base">Real-time Metrics</CardTitle></CardHeader>
                <CardContent className="p-2 pt-0 grid grid-cols-2 gap-x-4 gap-y-1">
                    <MetricItem label="P/L ($)" value={<FormattedNumber value={parseFloat(metrics.pl)} />} className={parseFloat(metrics.pl) >= 0 ? 'text-green-500' : 'text-red-500'}/>
                    <MetricItem label="R:R" value={metrics.rr} />
                    <MetricItem label="Risk (Pips)" value={metrics.riskPips} />
                    <MetricItem label="Risk (%)" value={`${metrics.riskPercent}%`} />
                    <MetricItem label="Outcome" value={metrics.status} className={metrics.status === 'Win' ? 'text-green-500' : 'text-red-500'}/>
                    <MetricItem label="Result" value={metrics.result} />
                    <MetricItem label="Session" value={metrics.session} />
                    <MetricItem label="Holding Time" value={metrics.holdingTime} />
                    <MetricItem label="Score" value={metrics.score} />
                </CardContent>
            </Card>
            <Card className="glassmorphic">
                 <CardHeader className="p-3">
                    <CardTitle className="text-base">Setup Performance</CardTitle>
                    {matchedSetup && (
                        <div className="text-xs pt-1 flex justify-between items-center text-primary font-semibold">
                            <span>Matched: {matchedSetup.name}</span>
                            <span>{matchedSetup.winRate.toFixed(0)}% Win Rate</span>
                        </div>
                    )}
                 </CardHeader>
                 <CardContent className="p-3 pt-0 space-y-2">
                    {performanceData && performanceData.length > 0 ? performanceData.map(item => (
                        <div key={item!.id} className="flex justify-between items-start text-xs">
                             <div className="flex-1 overflow-hidden">
                                <p className="text-muted-foreground truncate pr-2">
                                     <span className="font-semibold text-foreground/80">{item!.category}:</span> {item!.name} on <span className="text-accent">{item!.timeframe}</span>
                                </p>
                                {item!.subtext && <p className="text-[10px] text-amber-400 truncate pr-2">({item!.subtext})</p>}
                            </div>
                             <div className={cn(
                                "text-xs font-bold text-right",
                                item!.winRate >= 60 ? 'text-green-500' :
                                item!.winRate >= 40 ? 'text-yellow-500' :
                                'text-red-500'
                            )}>
                                {item!.winRate.toFixed(0)}%
                            </div>
                        </div>
                    )) : (
                        <p className="text-xs text-muted-foreground text-center py-4">Select rules to see historical performance.</p>
                    )}
                 </CardContent>
            </Card>
        </div>
    )
}

export default AnalysisSidebar;

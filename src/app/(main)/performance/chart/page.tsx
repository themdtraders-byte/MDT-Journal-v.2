

'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useJournalStore } from '@/hooks/use-journal-store';
import EquityCurveChart from '@/components/charts/equity-curve';
import PerformancePieChart from '@/components/charts/performance-pie-chart';
import PerformanceBarChart from '@/components/charts/performance-bar-chart';
import RuleAdherenceChart from '@/components/charts/rule-adherence-chart';
import SentimentAnalysisChart from '@/components/charts/sentiment-analysis-chart';
import PerformanceByTimeframeChart, { DailyStatGrid } from '@/components/charts/performance-by-timeframe-chart';
import ExitAnalyzerChart from '@/components/charts/exit-analyzer-chart';
import TradeManagementChart from '@/components/charts/trade-management-chart';
import ExpectancyChart from '@/components/charts/expectancy-chart';
import PcpPcrChart from '@/components/charts/pcp-pcr-chart';
import CustomStatsChart from '@/components/charts/custom-stats-chart';
import EfficiencyChart from '@/components/charts/efficiency-chart';
import DrawdownChart from '@/components/charts/drawdown-chart';
import { LoadingLogo } from '@/components/LoadingLogo';
import TradeDetailDialog from '@/components/trade-detail-dialog';
import type { Trade, Journal, AppSettings, StrategyRuleSection, StrategyRule, StrategyRuleType, AnalysisCategory } from '@/types';
import { Beaker, GitCompare, Settings, BarChart as BarChartIcon, FileSpreadsheet, GitCommit, Target, Info, Copy } from 'lucide-react';
import { useHasHydrated } from '@/hooks/use-has-hydrated';
import MdScoreCard from '@/components/md-score-card';
import ConsecutiveWinsLossesChart from '@/components/charts/consecutive-wins-losses-chart';
import HoldingTimeChart from '@/components/charts/holding-time-chart';
import PerformanceRatioChart from '@/components/charts/performance-ratio-chart';
import RDistributionChart from '@/components/charts/r-distribution-chart';
import WinRateOverTimeChart from '@/components/charts/winrate-over-time-chart';
import FormattedNumber from '@/components/ui/formatted-number';
import { cn } from '@/lib/utils';
import PairStatGrid from '@/components/pair-stat-grid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import MultiSelect from '@/components/ui/multi-select';
import { calculateGroupMetrics } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { icons } from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { getCriterionValue } from '@/components/custom-report-builder';

const timeToMinutes = (timeframe: any): number => {
    if (!timeframe || typeof timeframe !== 'string') return 0;
    const value = parseInt(timeframe.replace(/[^0-9]/g, ''), 10);
    if (isNaN(value)) return Infinity;
    if (timeframe.includes('M')) return value * 30 * 24 * 60;
    if (timeframe.includes('W')) return value * 7 * 24 * 60;
    if (timeframe.includes('D')) return value * 24 * 60;
    if (timeframe.includes('h')) return value * 60;
    return value;
};

const ChartSelectorCard = ({
    title,
    categories,
    chartComponents,
    onChartSelect,
    selectedChart,
    onCategorySelect,
    selectedCategory,
}: {
    title: string;
    categories: Record<string, { id: string, label: string }[]>;
    chartComponents: Record<string, React.ReactNode>;
    onChartSelect: (chartId: string) => void;
    selectedChart: string;
    onCategorySelect: (categoryId: string) => void;
    selectedCategory: string;
}) => {
    return (
        <Card className="glassmorphic h-full flex flex-col">
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                <div className="flex gap-2">
                    <Select value={selectedCategory} onValueChange={onCategorySelect}>
                        <SelectTrigger><SelectValue placeholder="Category..." /></SelectTrigger>
                        <SelectContent>
                            {Object.keys(categories).filter(c => !['comparison'].includes(c)).map(cat => (
                                <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                     <Select value={selectedChart} onValueChange={onChartSelect}>
                        <SelectTrigger><SelectValue placeholder="Chart..." /></SelectTrigger>
                        <SelectContent>
                            <ScrollArea className="h-[200px]">
                                {(categories[selectedCategory] || []).map(chart => (
                                    <SelectItem key={chart.id} value={chart.id}>{chart.label}</SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                 <div className="h-[450px] overflow-y-auto">
                    {selectedChart ? chartComponents[selectedChart] : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">Select a chart to display.</div>
                    )}
                 </div>
            </CardContent>
        </Card>
    );
}

const ChartPageLayout = () => {
    const hasHydrated = useHasHydrated();
    const { journals, activeJournalId, appSettings, filters } = useJournalStore(state => state);
    
    const activeJournal = useMemo(() => {
        return journals.find(j => j.id === activeJournalId);
    }, [journals, activeJournalId]);
    
    const allTrades = useMemo(() => {
        return activeJournal?.trades || [];
    }, [activeJournal]);

    const filteredTrades = useMemo(() => {
        if (!activeJournal) return [];
        if (!filters || Object.values(filters).every(v => !v || (Array.isArray(v) && v.length === 0))) {
            return allTrades;
        }
        return allTrades.filter(trade => {
            if (filters.pair && filters.pair.length > 0 && !filters.pair.includes(trade.pair)) {
                return false;
            }
             if (filters.direction && filters.direction.length > 0 && !filters.direction.includes(trade.direction)) {
                return false;
            }
            return true;
        });
    }, [allTrades, filters, activeJournal]);
    
    const [viewingTrade, setViewingTrade] = useState<Trade | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('advanced');
    const [activeChart, setActiveChart] = useState<string>('equity');
    
    // State for comparison view
    const [leftCategory, setLeftCategory] = useState('basic');
    const [leftChart, setLeftChart] = useState('adherence');
    const [rightCategory, setRightCategory] = useState('advanced');
    const [rightChart, setRightChart] = useState('equity');

    // State for Double Chart view
    const [doubleChartCategory, setDoubleChartCategory] = useState('Bias');
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);

    const handleChartClick = (data: any) => {
        if (data?.activePayload?.[0]?.payload?.tradeObject) {
            setViewingTrade(data.activePayload[0].payload.tradeObject);
        }
    };
    
    const chartableCustomFields = useMemo(() => {
        if (!appSettings?.customFields) return [];
        return appSettings.customFields.filter(f => f.type === 'List' || f.type === 'Button');
    }, [appSettings?.customFields]);

    const combinedAnalysisConfigs = useMemo(() => {
        if (!activeJournal || !appSettings) return [];
        const globalConfigs: AnalysisCategory[] = JSON.parse(JSON.stringify(appSettings.analysisConfigurations || []));
        
        const allStrategyConfigs = activeJournal.strategies?.flatMap(s => s.analysisConfigurations || []) || [];
        if (allStrategyConfigs.length === 0) return globalConfigs;

        const mergedConfigs = globalConfigs.map(cat => ({ ...cat }));

        allStrategyConfigs.forEach(stratCat => {
            let globalCat = mergedConfigs.find(gc => gc.id === stratCat.id);
            if (!globalCat) {
                mergedConfigs.push(JSON.parse(JSON.stringify(stratCat)));
            } else {
                stratCat.subCategories.forEach(stratSubCat => {
                    let globalSubCat = globalCat!.subCategories.find(gsc => gsc.id === stratSubCat.id);
                    if (!globalSubCat) {
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
    }, [activeJournal, appSettings.analysisConfigurations]);

     const orderingCriteriaOptions = useMemo(() => {
        if (!appSettings) return []; // Guard clause
        const baseOptions = [
            { value: 'Outcome', label: 'Outcome' },
            { value: 'Result', label: 'Result' },
            { value: 'Direction', label: 'Direction' },
            { value: 'Pair', label: 'Pair' },
            { value: 'Strategy', label: 'Strategy' },
            { value: 'Setup', label: 'Setup' },
            { value: 'Session', label: 'Session' },
            { value: 'IPDA Zone', label: 'IPDA Zone' },
            { value: 'LotSize', label: 'Lot Size' },
            { value: 'RR', label: 'R-Multiple' },
            { value: 'Score', label: 'Discipline Score' },
            { value: 'Risk %', label: 'Risk %' },
            { value: 'Holding Time', label: 'Holding Time' },
            { value: 'Alignment', label: 'Bias Alignment' },
            { value: 'Sentiments', label: 'Sentiments' },
            { value: 'News', label: 'News Event' },
        ];

        const analysisCatOptions = (combinedAnalysisConfigs || []).map(cat => ({
            value: cat.title,
            label: `Analysis: ${cat.title}`
        }));

        const customFieldOptions = (appSettings.customFields || []).map(cf => ({
            value: `custom-${cf.id}`,
            label: `CF: ${cf.title}`
        }));

        return [...baseOptions, ...analysisCatOptions, ...customFieldOptions];
    }, [combinedAnalysisConfigs, appSettings]);

    const doubleChartSubSelectionOptions = useMemo(() => {
        return orderingCriteriaOptions.map(o => o.value);
    }, [orderingCriteriaOptions]);

    
    // --- Memoized Data Calculations ---
    const { 
        equityData, performanceByDirection, performanceBySession, performanceByPartial,
        performanceByLayers, performanceByPair, performanceByResult, performanceByTag,
        performanceByStrategy, performanceBySetup, performanceByIpdaZone,
        doubleChartData, dailyPerformanceData
    } = useMemo(() => {
        if (!activeJournal || !filteredTrades || filteredTrades.length === 0 || !appSettings) {
            return { 
                equityData: [], performanceByDirection: [], performanceBySession: [], performanceByPartial: [],
                performanceByLayers: [], performanceByPair: [], performanceByResult: [], performanceByTag: [],
                performanceByStrategy: [], performanceBySetup: [], performanceByIpdaZone: [],
                doubleChartData: [], dailyPerformanceData: []
            };
        }

        const { capital, initialDeposit } = activeJournal;
        
        const sortedTrades = [...filteredTrades].sort((a, b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        let cumulativePl = initialDeposit;
        let cumulativeR = 0;
        const equityDataResult = sortedTrades.map((trade, index) => {
            cumulativePl += trade.auto.pl;
            const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
            const riskPips = trade.stopLoss > 0 ? Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize : 0;
            const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
            const realizedR = riskAmount > 0 ? trade.auto.pl / riskAmount : 0;
            cumulativeR += realizedR;
            return { trade: index + 1, balance: cumulativePl, rBalance: cumulativeR, tradeObject: trade, realizedR };
        });
        equityDataResult.unshift({ trade: 0, balance: initialDeposit, rBalance: 0, tradeObject: null, realizedR: 0 });

        const createCategoricalData = (getCategory: (trade: Trade) => string | string[] | undefined) => {
             const byCategory: { [key: string]: Trade[] } = {};
             const unspecifiedKey = 'Unspecified';
             filteredTrades.forEach(trade => {
                const categories = getCategory(trade);
                const values = Array.isArray(categories) ? categories : (categories ? [categories] : [unspecifiedKey]);
                values.forEach(cat => {
                    const key = cat || unspecifiedKey;
                    if (!byCategory[key]) byCategory[key] = [];
                    byCategory[key].push(trade);
                });
             });
             return Object.entries(byCategory).map(([name, trades]) => ({ name, ...calculateGroupMetrics(trades, appSettings!, capital) }));
        };
        
        const tradesByDay = filteredTrades.reduce((acc, trade) => {
            if (trade.openDate) {
                if (!acc[trade.openDate]) acc[trade.openDate] = [];
                acc[trade.openDate].push(trade);
            }
            return acc;
        }, {} as Record<string, Trade[]>);

        const dailyPerformanceData = Object.entries(tradesByDay).map(([date, dailyTrades]) => ({
            name: date,
            ...calculateGroupMetrics(dailyTrades, appSettings, activeJournal.capital)
        }));

        // Double Chart Data Calculation
        const tradesByGroup: Record<string, Trade[]> = {};
        filteredTrades.forEach(trade => {
            if (!combinedAnalysisConfigs) return;
            const values = getCriterionValue(trade, doubleChartCategory, combinedAnalysisConfigs, appSettings);
            const valueArray = Array.isArray(values) ? values : (values && values !== 'N/A' ? [values] : ['N/A']);
            valueArray.forEach(value => {
                if (!value || value === 'N/A') return;
                if (!tradesByGroup[value]) tradesByGroup[value] = [];
                tradesByGroup[value].push(trade);
            });
        });

        let doubleChartDataResult = Object.entries(tradesByGroup).map(([name, groupTrades]) => {
            const metrics = calculateGroupMetrics(groupTrades, appSettings!, capital);
            return {
                name,
                ...metrics
            };
        });
        
        if (doubleChartDataResult.some(d => d.name.includes(':'))) {
             doubleChartDataResult.sort((a, b) => {
                const [tfA, valA] = a.name.split(':');
                const [tfB, valB] = b.name.split(':');
                if (tfA !== tfB) return timeToMinutes(tfB) - timeToMinutes(tfA);
                return valA.localeCompare(valB);
             });
        } else if (doubleChartCategory === 'Holding Time') {
            const order = ['< 5 min', '5-15 min', '15-30 min', '30-60 min', '1-4 hr', '4-24 hr', '> 1 day'];
            doubleChartDataResult.sort((a, b) => order.indexOf(a.name) - order.indexOf(b.name));
        } else if (doubleChartCategory === 'RR') {
            const rOrder = [
                '< -5R', '-5R', '-4R', '-3R', '-2R', '-1R', '0R', '1R', '2R', '3R', '4R', '5R', '6R', '7R', '8R', '9R', '10R', '> 10R'
            ];
            doubleChartDataResult.sort((a, b) => rOrder.indexOf(a.name) - rOrder.indexOf(b.name));
        }


        return {
            equityData: equityDataResult,
            performanceByDirection: createCategoricalData(t => t.direction),
            performanceBySession: createCategoricalData(t => t.auto.session),
            performanceByIpdaZone: createCategoricalData(t => t.auto.ipdaZone),
            performanceByPartial: createCategoricalData(t => t.hasPartial ? 'Partials Taken' : 'Standard Exit'),
            performanceByLayers: createCategoricalData(t => t.isLayered ? 'Layered Entry' : 'Standard Entry'),
            performanceByPair: createCategoricalData(t => t.pair),
            performanceByResult: createCategoricalData(t => t.auto.result),
            performanceByTag: createCategoricalData(t => t.tag || 'Untagged'),
            performanceByStrategy: createCategoricalData(t => t.strategy || 'Unspecified'),
            performanceBySetup: createCategoricalData(t => t.auto.matchedSetups),
            doubleChartData: doubleChartDataResult,
            dailyPerformanceData,
        }
    }, [activeJournal, filteredTrades, appSettings, doubleChartCategory, combinedAnalysisConfigs]);
    
    // Sub-equity curve data for double chart view
    const subEquityCurveData = useMemo(() => {
        if (!selectedSubCategory || !activeJournal || !appSettings || !combinedAnalysisConfigs) return [];
        
        const filtered = filteredTrades.filter(trade => {
            const values = getCriterionValue(trade, doubleChartCategory, combinedAnalysisConfigs, appSettings);
            return Array.isArray(values) ? values.includes(selectedSubCategory) : values === selectedSubCategory;
        });
        
        if (filtered.length === 0) return [];
        
        const sorted = filtered.sort((a,b) => new Date(`${a.openDate}T${a.openTime}`).getTime() - new Date(`${b.openDate}T${b.openTime}`).getTime());
        
        let cumulativePl = activeJournal.initialDeposit;
        let cumulativeR = 0;
        return sorted.map((trade, index) => {
            cumulativePl += trade.auto.pl;
            
            const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
            const riskPips = trade.stopLoss > 0 ? Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize : 0;
            const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
            const realizedR = riskAmount > 0 ? trade.auto.pl / riskAmount : 0;
            cumulativeR += realizedR;
            
            return {
                trade: index + 1,
                balance: cumulativePl,
                rBalance: cumulativeR,
                tradeObject: trade,
            };
        });

    }, [selectedSubCategory, doubleChartCategory, filteredTrades, activeJournal, appSettings, combinedAnalysisConfigs]);

    
    const allStrategySections = useMemo(() => {
        if (!activeJournal?.strategies) return [];
        const sectionsMap = new Map<string, StrategyRuleSection>();
        activeJournal.strategies.forEach(strategy => {
            (strategy.rules || []).forEach(section => {
                if (!sectionsMap.has(section.title)) {
                    sectionsMap.set(section.title, section);
                }
            });
        });
        return Array.from(sectionsMap.values());
    }, [activeJournal?.strategies]);

    const chartComponents: Record<string, React.ReactNode> = useMemo(() => {
        if (!activeJournal || !appSettings) return {};
        const components: Record<string, React.ReactNode> = {
            'equity': <EquityCurveChart trades={filteredTrades} initialDeposit={activeJournal?.initialDeposit || 0} onClick={handleChartClick} />,
            'drawdown': <DrawdownChart data={equityData} journal={activeJournal!} onClick={handleChartClick} showZoomSlider />,
            'winrate': <WinRateOverTimeChart trades={filteredTrades} onClick={handleChartClick} showZoomSlider />,
            'expectancy': <ExpectancyChart trades={filteredTrades} onClick={handleChartClick} showZoomSlider />,
            'adherence': activeJournal?.plan ? <RuleAdherenceChart trades={filteredTrades} plan={activeJournal.plan} capital={activeJournal.capital}/> : null,
            'direction': <PerformancePieChart title="Performance by Direction" data={performanceByDirection} />,
            'session': <PerformancePieChart title="Performance by Session" data={performanceBySession} />,
            'ipdaZone': <PerformancePieChart title="Performance by IPDA Zone" data={performanceByIpdaZone} />,
            'partials': <PerformancePieChart title="Partial Close Performance" data={performanceByPartial} />,
            'layers': <PerformancePieChart title="Layered Entry Performance" data={performanceByLayers} />,
            'pair': <PerformancePieChart title="Performance by Pair" data={performanceByPair} />,
            'result': <PerformancePieChart title="Performance by Result" data={performanceByResult} />,
            'tag': <PerformancePieChart title="Performance by Tag" data={performanceByTag} />,
            'strategy': <PerformancePieChart title="Performance by Strategy" data={performanceByStrategy} />,
            'setup': <PerformancePieChart title="Performance by Setup" data={performanceBySetup} />,
            'performance-ratios': <PerformanceRatioChart trades={filteredTrades} />,
            'efficiency': <EfficiencyChart trades={filteredTrades} onClick={handleChartClick} />,
            'pcp-pcr': <PcpPcrChart trades={filteredTrades} onClick={handleChartClick} />,
            'sentiment': <SentimentAnalysisChart data={equityData} onClick={handleChartClick} showZoomSlider />,
            'by-time-of-day': <PerformanceByTimeframeChart trades={filteredTrades}><DailyStatGrid data={dailyPerformanceData} /></PerformanceByTimeframeChart>,
        };

        chartableCustomFields.forEach(field => {
            components[field.id] = <CustomStatsChart trades={filteredTrades} activeFieldId={field.id} />;
        });
        
        doubleChartSubSelectionOptions.forEach(opt => {
            const label = orderingCriteriaOptions.find(o => o.value === opt)?.label || opt.replace('custom-', 'CF: ');
            components[`pl-by-${opt}`] = <PerformanceBarChart title={`P/L by ${label}`} data={doubleChartData.filter(d => d.name !== 'N/A')} yAxisLabel="P/L ($)" />;
            components[`trades-by-${opt}`] = <PerformanceBarChart title={`Trade Count by ${label}`} data={doubleChartData.filter(d => d.name !== 'N/A')} yAxisLabel="# of Trades" barColor="hsl(206 98% 52%)" />;
        });

        return components;
    }, [filteredTrades, activeJournal, equityData, performanceByDirection, performanceBySession, performanceByPartial, performanceByLayers, performanceByPair, performanceByResult, performanceByTag, performanceByStrategy, performanceBySetup, performanceByIpdaZone, dailyPerformanceData, doubleChartData, chartableCustomFields, doubleChartSubSelectionOptions, orderingCriteriaOptions, appSettings]);
    
    const categories: Record<string, { id: string, label: string }[]> = {
        basic: [
            { id: 'adherence', label: 'Plan Adherence' },
            { id: 'direction', label: 'Direction Pie' },
            { id: 'pair', label: 'Pair Pie' },
            { id: 'result', label: 'Result Pie' },
            { id: 'tag', label: 'Tag Pie' },
            { id: 'strategy', label: 'Strategy Pie' },
            { id: 'setup', label: 'Setup Pie' },
            { id: 'session', label: 'Session Pie' },
            { id: 'ipdaZone', label: 'IPDA Zone Pie' },
            { id: 'partials', label: 'Partials Pie' },
            { id: 'layers', label: 'Layers Pie' },
        ],
        advanced: [
            { id: 'equity', label: 'Equity Curve' },
            { id: 'drawdown', label: 'Drawdown Curve' },
            { id: 'winrate', label: 'Win Rate Over Time' },
            { id: 'expectancy', label: 'Expectancy Curve' },
            { id: 'performance-ratios', label: 'Performance Ratios' },
            { id: 'efficiency', label: 'Efficiency Analysis' },
            { id: 'pcp-pcr', label: 'PCP/PCR Analysis' },
            { id: 'sentiment', label: 'Sentiment Analysis' },
            { id: 'by-time-of-day', label: 'Performance By Time' },
        ],
        strategy: allStrategySections.map(section => ({
            id: section.title,
            label: section.title,
        })),
        custom: chartableCustomFields.map(field => ({ id: field.id, label: field.title })),
        'double-chart': doubleChartSubSelectionOptions.flatMap(opt => {
            const label = orderingCriteriaOptions.find(o => o.value === opt)?.label || opt.replace('custom-', 'CF: ');
            return [
                { id: `pl-by-${opt}`, label: `P/L by ${label}` },
                { id: `trades-by-${opt}`, label: `Trades by ${label}` }
            ]
        }),
    };
    
    if (!hasHydrated || !activeJournal || !appSettings) {
        return <div className="flex h-full items-center justify-center"><LoadingLogo /></div>;
    }
    
    if (filteredTrades.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-lg font-semibold">Chart Lab</h1>
                <Card><CardContent className="py-12 text-center text-muted-foreground">No trades match the current filters. Please adjust your filters or add more trades.</CardContent></Card>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-semibold">Chart Lab</h1>
                <div className="flex items-center gap-1">
                    <Button variant={activeCategory === 'basic' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveCategory('basic'); setActiveChart('adherence'); }}><BarChartIcon className="mr-2 h-4 w-4" /> Basic</Button>
                    <Button variant={activeCategory === 'advanced' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveCategory('advanced'); setActiveChart('equity'); }}><Settings className="mr-2 h-4 w-4" /> Advanced</Button>
                    {categories.custom.length > 0 && <Button variant={activeCategory === 'custom' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveCategory('custom'); setActiveChart(categories.custom[0]?.id || ''); }}><Beaker className="mr-2 h-4 w-4" /> Custom</Button>}
                    <Button variant={activeCategory === 'comparison' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveCategory('comparison'); setActiveChart('vs-mode'); }}><GitCompare className="mr-2 h-4 w-4" /> Comparison</Button>
                    <Button variant={activeCategory === 'double-chart' ? 'default' : 'outline'} size="sm" onClick={() => { setActiveCategory('double-chart'); setActiveChart('double-chart-view'); }}><Copy className="mr-2 h-4 w-4" /> Double Chart</Button>
                </div>
            </div>

            {activeCategory !== 'comparison' && activeCategory !== 'double-chart' && (
                <>
                     <Card className="glassmorphic">
                        <CardContent className="p-1">
                             <div className="flex flex-wrap gap-1 flex-grow">
                                {(categories[activeCategory] || []).map(chart => (
                                    <Button key={chart.id} variant={activeChart === chart.id ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveChart(chart.id)}>
                                        {chart.label}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <div className="animate-fade-in">
                        {activeChart ? chartComponents[activeChart] : <p>Select a chart to view.</p>}
                    </div>
                </>
            )}

            {activeCategory === 'comparison' && (
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <ChartSelectorCard 
                        title="Left Panel"
                        categories={categories}
                        chartComponents={chartComponents}
                        selectedCategory={leftCategory}
                        onCategorySelect={(cat) => {
                            setLeftCategory(cat);
                            setLeftChart(categories[cat]?.[0]?.id || '');
                        }}
                        selectedChart={leftChart}
                        onChartSelect={setLeftChart}
                    />
                     <ChartSelectorCard 
                        title="Right Panel"
                        categories={categories}
                        chartComponents={chartComponents}
                        selectedCategory={rightCategory}
                        onCategorySelect={(cat) => {
                            setRightCategory(cat);
                            setRightChart(categories[cat]?.[0]?.id || '');
                        }}
                        selectedChart={rightChart}
                        onChartSelect={setRightChart}
                    />
                </div>
            )}
            
            {activeCategory === 'double-chart' && (
                 <div className="space-y-4">
                    <Card className="glassmorphic">
                        <CardContent className="p-2">
                             <div className="flex flex-wrap gap-1">
                                {orderingCriteriaOptions.map(option => (
                                    <Button key={option.value} variant={doubleChartCategory === option.value ? 'secondary' : 'outline'} size="xs" onClick={() => { setDoubleChartCategory(option.value); setSelectedSubCategory(null); }}>{option.label}</Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <PerformanceBarChart
                            title={`P/L by ${orderingCriteriaOptions.find(o => o.value === doubleChartCategory)?.label}`}
                            data={doubleChartData.filter(d => d.name !== 'N/A')}
                            yAxisLabel="P/L ($)"
                        />
                        <PerformanceBarChart
                            title={`Trade Count by ${orderingCriteriaOptions.find(o => o.value === doubleChartCategory)?.label}`}
                            data={doubleChartData.filter(d => d.name !== 'N/A')}
                            yAxisLabel="# of Trades"
                            barColor="hsl(206 98% 52%)"
                        />
                    </div>
                     <Card className="glassmorphic">
                        <CardHeader>
                            <CardTitle>Segment Equity Curve</CardTitle>
                            <CardDescription>Click on a category below to see its specific equity curve.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                            <div className="h-[400px]">
                                <EquityCurveChart
                                    trades={filteredTrades} 
                                    initialDeposit={activeJournal?.initialDeposit || 0}
                                    onClick={handleChartClick}
                                    subCategoryData={subEquityCurveData}
                                />
                            </div>
                            <ScrollArea className="h-[400px] border rounded-lg p-2 bg-muted/50">
                                <div className="space-y-1">
                                    <Button
                                        variant={selectedSubCategory === null ? 'secondary' : 'ghost'}
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setSelectedSubCategory(null)}
                                    >
                                        All Filtered Trades
                                    </Button>
                                    {doubleChartData.map(d => (
                                        <Button
                                            key={d.name}
                                            variant={selectedSubCategory === d.name ? 'secondary' : 'ghost'}
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={() => setSelectedSubCategory(d.name)}
                                        >
                                            <span className="truncate">{d.name}</span>
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                 </div>
            )}


             <TradeDetailDialog
                trade={viewingTrade}
                isOpen={!!viewingTrade}
                onOpenChange={(open) => !open && setViewingTrade(null)}
            />
        </div>
    );
};

export default ChartPageLayout;



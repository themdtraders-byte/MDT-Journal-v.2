

'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useToast } from '@/hooks/use-toast';
import { Bot, Brain, Sparkles, Loader } from 'lucide-react';
import type { Trade, Suggestion, SuggestionDetailProps, AnalysisCategory } from '@/types';
import SuggestionComparisonCard from '@/components/suggestion-comparison-card';
import { getTradingAdvice } from '@/ai/flows/trade-analyst';
import { Progress } from '@/components/ui/progress';
import { getWeekOfMonth } from 'date-fns';

type SuggestionWithAdvice = Suggestion & {
    best: (SuggestionDetailProps & { advice?: string }) | null;
    worst: (SuggestionDetailProps & { advice?: string }) | null;
}

const getHoldingTimeRange = (minutes: number): string => {
    if (minutes < 5) return '< 5 min';
    if (minutes <= 15) return '5-15 min';
    if (minutes <= 60) return '15-60 min';
    if (minutes <= 300) return '1-5 hr';
    if (minutes <= 1440) return '5-24 hr';
    if (minutes <= 7200) return '1-5 days';
    if (minutes <= 20160) return '5-14 days';
    return '> 14 days';
}


const performLocalAnalysis = (trades: Trade[], appSettings: any): Suggestion[] => {
    if (trades.length === 0) return [];
    
    const realTrades = trades.filter(t => !t.isMissing);

    if (realTrades.length === 0) return [];
    
    const tradesWithR = realTrades.map(trade => {
        const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
        const riskPips = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize;
        const riskAmount = riskPips * trade.lotSize * pairInfo.pipValue;
        const realizedR = riskAmount > 0 ? trade.auto.pl / riskAmount : 0;
        return { ...trade, realizedR };
    });

    const getGroupedStats = (categoryName: Suggestion['category'], getCategory: (trade: typeof tradesWithR[0]) => string | string[] | undefined): SuggestionDetailProps[] => {
        const grouped = tradesWithR.reduce((acc, trade) => {
            const categories = getCategory(trade);
            if (!categories) return acc;

            (Array.isArray(categories) ? categories : [categories]).forEach(category => {
                if (!category) return;
                if (!acc[category]) acc[category] = [];
                acc[category].push(trade);
            });
            
            return acc;
        }, {} as Record<string, typeof tradesWithR>);

        return Object.entries(grouped).map(([name, groupTrades]) => {
            const wins = groupTrades.filter(t => t.auto.outcome === 'Win');
            const losses = groupTrades.filter(t => t.auto.outcome === 'Loss');
            const winRate = groupTrades.length > 0 ? (wins.length / groupTrades.length) * 100 : 0;
            const totalPl = groupTrades.reduce((sum, t) => sum + t.auto.pl, 0);
            const totalR = groupTrades.reduce((sum, t) => sum + t.realizedR, 0);
            const avgR = groupTrades.length > 0 ? totalR / groupTrades.length : 0;
            const avgScore = groupTrades.length > 0 ? groupTrades.reduce((sum, t) => sum + (t.auto.score?.value || 0), 0) / groupTrades.length : 0;
            const grossProfit = wins.reduce((sum, t) => sum + t.auto.pl, 0);
            const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.auto.pl, 0));
            const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 1000 : 1); // Avoid Infinity for valid JSON

            return { category: categoryName, name, totalTrades: groupTrades.length, winRate, avgR, totalPl, avgScore, profitFactor, type: 'best' };
        });
    }
    
    const findBestWorst = (stats: SuggestionDetailProps[]): { best: SuggestionDetailProps | null; worst: SuggestionDetailProps | null } => {
        if (stats.length === 0) return { best: null, worst: null };
        const sorted = stats.sort((a,b) => b.totalPl - a.totalPl);
        const best = { ...sorted[0], type: 'best' as const };
        const worst = sorted.length > 1 ? { ...sorted[sorted.length - 1], type: 'worst' as const } : null;
        return { best, worst: best.name === worst?.name ? null : worst };
    }

    const getLotSizeRange = (lotSize: number) => {
        if (lotSize <= 0.1) return 'Micro (<= 0.1)';
        if (lotSize <= 0.5) return 'Mini (0.11 - 0.5)';
        if (lotSize <= 1.0) return 'Standard (0.51 - 1.0)';
        return 'Heavy (> 1.0)';
    };

    const sessionStats = getGroupedStats('Session', t => t.auto.session);
    const dayStats = getGroupedStats('Day', t => new Date(t.openDate).toLocaleDateString('en-US', { weekday: 'long' }));
    const hourStats = getGroupedStats('Hour', t => `${new Date(`${t.openDate}T${t.openTime}`).getHours()}:00`);
    const pairStats = getGroupedStats('Pair', t => t.pair);
    const strategyStats = getGroupedStats('Strategy', t => t.strategy || 'Unspecified');
    const resultStats = getGroupedStats('Result', t => t.auto.result);
    const setupStats = getGroupedStats('Setup', t => t.auto.matchedSetups);
    const tagStats = getGroupedStats('Tag', t => t.tag || 'Untagged');
    const directionStats = getGroupedStats('Direction', t => t.direction);
    const lotSizeStats = getGroupedStats('Lot Size', t => getLotSizeRange(t.lotSize));
    const newsStats = getGroupedStats('News Event', t => t.newsEvents?.map(n => n.name));
    const holdingTimeStats = getGroupedStats('Holding Time', t => getHoldingTimeRange(t.auto.durationMinutes));

    const analysisStats = (appSettings.analysisConfigurations || []).flatMap((category: AnalysisCategory) => 
        category.subCategories.map(subCat => ({
            category: subCat.title as Suggestion['category'],
            ...findBestWorst(getGroupedStats(subCat.title as Suggestion['category'], t => {
                 if (!t.analysisSelections) return undefined;
                 const values = new Set<string>();
                 Object.values(t.analysisSelections).forEach(selections => {
                     if (selections[subCat.id]) {
                         (selections[subCat.id] as any[]).forEach(item => {
                             const option = subCat.options.find(o => o.id === (typeof item === 'string' ? item : item.value));
                             if (option) values.add(option.value);
                         });
                     }
                 });
                 return Array.from(values);
            }))
        }))
    );
    
    const sentimentStats = [
        { category: 'Sentiment (Before)', ...findBestWorst(getGroupedStats('Sentiment (Before)', t => t.sentiment?.Before)) },
        { category: 'Sentiment (During)', ...findBestWorst(getGroupedStats('Sentiment (During)', t => t.sentiment?.During)) },
        { category: 'Sentiment (After)', ...findBestWorst(getGroupedStats('Sentiment (After)', t => t.sentiment?.After)) },
    ];


    return [
        { category: 'Result', ...findBestWorst(resultStats) },
        { category: 'Setup', ...findBestWorst(setupStats) },
        { category: 'Session', ...findBestWorst(sessionStats) },
        { category: 'Day', ...findBestWorst(dayStats) },
        { category: 'Hour', ...findBestWorst(hourStats) },
        { category: 'Pair', ...findBestWorst(pairStats) },
        { category: 'Strategy', ...findBestWorst(strategyStats) },
        { category: 'Direction', ...findBestWorst(directionStats) },
        { category: 'Lot Size', ...findBestWorst(lotSizeStats) },
        { category: 'Tag', ...findBestWorst(tagStats) },
        { category: 'News Event', ...findBestWorst(newsStats) },
        { category: 'Holding Time', ...findBestWorst(holdingTimeStats) },
        ...analysisStats,
        ...sentimentStats,
    ].filter(s => s.best !== null);
};


export default function AnalyticsPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestionWithAdvice[] | null>(null);
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState('');
    
    const { journals, activeJournalId, filters, appSettings } = useJournalStore();

    const activeJournal = useMemo(() => {
        return journals.find(j => j.id === activeJournalId);
    }, [journals, activeJournalId]);
    
    const filteredTrades = useMemo(() => {
        if (!activeJournal) return [];
        const allTrades = activeJournal.trades || [];
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
    }, [activeJournal, filters]);

    const handleGetSuggestions = async () => {
        if (!filteredTrades || filteredTrades.length < 2) {
            toast({
                title: "Not Enough Data",
                description: "You need at least 2 trades in the current filter to generate insights.",
                variant: "destructive",
            });
            return;
        }
        setIsLoading(true);
        setSuggestions(null);
        setProgress(0);
        setProgressText('');
        
        const localSuggestions = performLocalAnalysis(filteredTrades, appSettings);

        try {
            const suggestionsWithAdvice: SuggestionWithAdvice[] = [];
            const totalSteps = localSuggestions.reduce((acc, s) => acc + (s.best ? 1 : 0) + (s.worst ? 1 : 0), 0);
            let currentStep = 0;

            for (const suggestion of localSuggestions) {
                const updatedSuggestion: SuggestionWithAdvice = { ...suggestion, best: null, worst: null };

                if (suggestion.best) {
                    currentStep++;
                    setProgress((currentStep / totalSteps) * 100);
                    setProgressText(`Analyzing ${suggestion.best.category}: ${suggestion.best.name}... (${currentStep} of ${totalSteps})`);
                    const bestAdvice = await getTradingAdvice(suggestion.best);
                    updatedSuggestion.best = { ...suggestion.best, advice: bestAdvice?.advice };
                }

                if (suggestion.worst) {
                    currentStep++;
                    setProgress((currentStep / totalSteps) * 100);
                    setProgressText(`Analyzing ${suggestion.worst.category}: ${suggestion.worst.name}... (${currentStep} of ${totalSteps})`);
                    const worstAdvice = await getTradingAdvice(suggestion.worst);
                    updatedSuggestion.worst = { ...suggestion.worst, advice: worstAdvice?.advice };
                }
                suggestionsWithAdvice.push(updatedSuggestion);
            }
            setSuggestions(suggestionsWithAdvice);
        } catch (error) {
            console.error("Failed to get AI trading insights, falling back to local analysis:", error);
            toast({
                title: "AI Analysis Failed",
                description: "Displaying statistics without AI-powered advice.",
                variant: "destructive",
            });
            // Fallback: Display suggestions without AI advice
            setSuggestions(localSuggestions.map(s => ({
                ...s,
                best: s.best ? { ...s.best, advice: undefined } : null,
                worst: s.worst ? { ...s.worst, advice: undefined } : null,
            })));
        } finally {
            setIsLoading(false);
            setProgress(0);
            setProgressText('');
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold">AI Analytics</h1>
            <div className="space-y-6">
                <Card className="glassmorphic">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Brain className="text-primary" />
                            Smart Suggestions
                        </CardTitle>
                        <CardDescription>
                            Analyze your trading history to uncover your best and worst performing strategies, pairs, sessions, and more.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground flex-1">
                            Get detailed head-to-head comparisons of your performance metrics, complete with AI-powered advice.
                        </p>
                        <div className="flex gap-4">
                            <Button onClick={handleGetSuggestions} disabled={isLoading}>
                                {isLoading ? <><Loader className="animate-spin mr-2"/> Analyzing...</> : <><Sparkles className="mr-2"/>Analyze My Trades</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                {isLoading && (
                     <div className="flex flex-col justify-center items-center h-64 gap-4">
                        <div className="w-full max-w-md">
                            <Progress value={progress} />
                            <p className="text-center text-sm text-muted-foreground mt-2">{progressText || 'Initializing analysis...'}</p>
                        </div>
                    </div>
                )}
                
                {suggestions && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                        {suggestions.map(suggestion => (
                            <SuggestionComparisonCard key={suggestion.category} suggestion={suggestion} />
                        ))}
                    </div>
                )}

                {!suggestions && !isLoading && (
                    <div className="text-center py-24 border-2 border-dashed rounded-lg glassmorphic">
                         <p className="text-muted-foreground">
                            {activeJournal?.trades.length === 0 ? "Log some trades to get your personalized insights." : "Click \"Analyze My Trades\" to get your personalized insights."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}



'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import type { Trade, TradeNote, AnalysisCategory } from '@/types';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import RichTextEditor from './rich-text-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart2, FileText, Image as ImageIcon, Sparkles, Brain, CheckCircle, Target, ShieldCheck, Newspaper, Copy, Tag, Link as LinkIcon, NotebookText, Loader, Pencil, Award, Layers, Trash2, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useState, useMemo, useEffect } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import Tiltmeter from './Tiltmeter';
import FormattedNumber from './ui/formatted-number';
import { pairsConfig } from '@/lib/data';
import { getResultBadgeVariant } from '@/lib/trade-helpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { icons } from 'lucide-react';
import { HelpCircle } from 'lucide-react';
import { calculateTradeMetrics } from '@/lib/calculations';
import { numberToString, partialsToString, layersToString } from './add-trade-dialog-helpers';
import NewsImpactCoach from './news-impact-coach';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

type LayerData = { id: string; lotSize: string; entryPrice: string; closingPrice: string; stopLoss: string; takeProfit: string };
type PartialCloseData = { id: string; lotSize: string; price: string };

const LayersAndPartialsViewer = ({
    isOpen,
    onClose,
    layers,
    partials,
}: {
    isOpen: boolean;
    onClose: () => void;
    layers: { lotSize: number; entryPrice: number; closingPrice: number; stopLoss: number; takeProfit: number; }[];
    partials: { lotSize: number; price: number }[];
}) => {
    const hasLayers = layers && layers.length > 0;
    const hasPartials = partials && partials.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Layers & Partials Details</DialogTitle>
                    <DialogDescription>A read-only view of the granular entries and exits for this trade.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {hasLayers && (
                        <Card>
                            <CardHeader><CardTitle className="text-base">Entry Layers</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Lot Size</TableHead>
                                            <TableHead>Entry</TableHead>
                                            <TableHead>Close</TableHead>
                                            <TableHead>SL</TableHead>
                                            <TableHead>TP</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {layers.map((layer, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{layer.lotSize.toFixed(2)}</TableCell>
                                                <TableCell><FormattedNumber value={layer.entryPrice} isPrice /></TableCell>
                                                <TableCell><FormattedNumber value={layer.closingPrice} isPrice /></TableCell>
                                                <TableCell><FormattedNumber value={layer.stopLoss} isPrice /></TableCell>
                                                <TableCell><FormattedNumber value={layer.takeProfit} isPrice /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                    {hasPartials && (
                         <Card>
                            <CardHeader><CardTitle className="text-base">Partial Closes</CardTitle></CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Lot Size Closed</TableHead>
                                            <TableHead>Close Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {partials.map((partial, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{partial.lotSize.toFixed(2)}</TableCell>
                                                <TableCell><FormattedNumber value={partial.price} isPrice /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                    {!hasLayers && !hasPartials && (
                        <p className="text-muted-foreground text-center">No detailed layer or partial data for this trade.</p>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


interface TradeDetailDialogProps {
  trade: Trade | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'overview' | 'notes' | 'visuals';
}

const getOutcomeIcon = (outcome: 'Win' | 'Loss' | 'Neutral') => {
    if (outcome === 'Win') return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (outcome === 'Loss') return <TrendingDown className="h-5 w-5 text-red-500" />;
    return <Minus className="h-5 w-5 text-gray-500" />;
};

const DetailSection = ({ title, icon: Icon, children, className, headerContent }: { title: string, icon: React.ElementType, children: React.ReactNode, className?: string, headerContent?: React.ReactNode }) => (
    <div className={cn("rounded-lg border p-4 bg-muted/20", className)}>
        <h3 className="text-base font-semibold mb-3 border-b pb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                {title}
            </div>
            {headerContent}
        </h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const DetailItem = ({ label, value, subValue, valueClassName }: { label: string, value: React.ReactNode, subValue?: React.ReactNode, valueClassName?: string }) => (
    <div className="flex justify-between items-start text-sm">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-1.5 text-right">
            {subValue && <span className="text-[10px] text-muted-foreground">({subValue})</span>}
            <span className={cn("font-medium", valueClassName)}>{value || 'N/A'}</span>
        </div>
    </div>
);

const timeToMinutes = (timeframe: string): number => {
    if (!timeframe) return 0;
    const value = parseInt(timeframe.replace(/[^0-9]/g, ''), 10);
    if (isNaN(value)) return Infinity;

    if (timeframe.includes('M')) return value * 30 * 24 * 60;
    if (timeframe.includes('W')) return value * 7 * 24 * 60;
    if (timeframe.includes('D')) return value * 24 * 60;
    if (timeframe.includes('h')) return value * 60;
    return value;
};


const OverviewTab = ({ trade, onOpenLayers }: { trade: Trade, onOpenLayers: () => void }) => {
    const { appSettings, journals, activeJournalId } = useJournalStore(state => state);
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    // Re-run calculations for the specific trade to ensure data is fresh.
    const auto = useMemo(() => {
        if (!activeJournal || !appSettings) return trade.auto;
        return calculateTradeMetrics(trade, activeJournal, appSettings);
    }, [trade, activeJournal, appSettings]);

    const sortedTimeframes = useMemo(() => {
        if (!trade.analysisSelections) return [];
        return Object.keys(trade.analysisSelections).sort((a, b) => timeToMinutes(b) - timeToMinutes(a));
    }, [trade.analysisSelections]);

    const renderSentiments = (sentiments: string[] | string | undefined) => {
        const sentimentArray = Array.isArray(sentiments) ? sentiments : (typeof sentiments === 'string' && sentiments ? [sentiments] : []);
        if (sentimentArray.length === 0) return 'N/A';
        return <div className="flex flex-wrap justify-end gap-1">{sentimentArray.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}</div>;
    }
    
    if (!appSettings || !activeJournal) return null;

    const pairInfo = appSettings.pairsConfig[trade.pair as keyof typeof appSettings.pairsConfig] || appSettings.pairsConfig['Other'];
    const riskDollars = Math.abs(trade.entryPrice - trade.stopLoss) / pairInfo.pipSize * trade.lotSize * pairInfo.pipValue;
    const realizedR = riskDollars > 0 ? auto.pl / riskDollars : 0;
    
    const riskAmount = activeJournal.capital > 0 ? (activeJournal.capital * (auto.riskPercent / 100)) : 0;
    const gainAmount = activeJournal.capital > 0 ? (activeJournal.capital * (auto.gainPercent / 100)) : 0;
    
    const hasLayersOrPartials = (trade.layers && trade.layers.length > 0) || (trade.partials && trade.partials.length > 0);

    return (
        <div className="space-y-6 pr-2">
             {/* Top Summary Section */}
            <Card className="glassmorphic">
                <CardContent className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground">Net P/L</p>
                        <div className={cn("text-xl font-bold", auto.pl >= 0 ? 'text-green-500' : 'text-red-500')}>
                           <FormattedNumber value={auto.pl} showPercentage />
                        </div>
                    </div>
                     <div className="text-center">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <div className="text-xl font-bold">
                            <Badge variant={auto.status === 'Open' ? 'outline' : 'secondary'} className={cn(auto.status === 'Open' && 'text-yellow-500 border-yellow-500/50')}>{auto.status}</Badge>
                        </div>
                    </div>
                     <div className="text-center">
                        <p className="text-xs text-muted-foreground">Outcome</p>
                        <div className="text-xl font-bold flex items-center justify-center gap-1">
                           {getOutcomeIcon(auto.outcome)}
                           <span>{auto.outcome}</span>
                        </div>
                    </div>
                     <div className="text-center">
                        <p className="text-xs text-muted-foreground">Result</p>
                        <div className="text-xl font-bold">
                            <Badge className={getResultBadgeVariant(auto.result)}>{auto.result}</Badge>
                        </div>
                    </div>
                     <div className="text-center">
                        <p className="text-xs text-muted-foreground">R:R</p>
                        <p className="text-xl font-bold">{auto.rr.toFixed(2)}:1</p>
                    </div>
                     <div className="text-center">
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="text-xl font-bold" style={{color: auto.score.color}}>{auto.score.value}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <DetailSection title="Core Info" icon={FileText}>
                        <DetailItem label="Direction" value={trade.direction} valueClassName={trade.direction === 'Buy' ? 'text-green-500' : 'text-red-500'} />
                        <DetailItem label="Pair" value={trade.pair} />
                        <DetailItem label="Strategy" value={trade.strategy} />
                        <DetailItem label="IPDA Zone" value={auto.ipdaZone} />
                        <DetailItem label="Matched Setups" value={(auto.matchedSetups || []).join(', ') || 'None'} />
                        <DetailItem label="Lot Size" value={trade.lotSize} />
                        <DetailItem label="Tag" value={trade.tag ? <Badge variant="outline">{trade.tag}</Badge> : 'N/A'} />
                    </DetailSection>

                     <DetailSection title="Pricing & Performance" icon={BarChart2} headerContent={
                        hasLayersOrPartials ? (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onOpenLayers}><Layers className="h-4 w-4 text-primary" /></Button>
                        ) : null
                     }>
                        <DetailItem label="Entry Price" value={<FormattedNumber value={trade.entryPrice} isPrice />} />
                        <DetailItem label="Closing Price" value={<FormattedNumber value={trade.closingPrice} isPrice />} />
                        <DetailItem label="Stop Loss" value={<FormattedNumber value={trade.stopLoss} isPrice />} />
                        <DetailItem label="Take Profit" value={<FormattedNumber value={trade.takeProfit || 0} isPrice />} />
                        <DetailItem label="Pips" value={`${auto.pips.toFixed(1)}`} valueClassName={auto.pips >= 0 ? 'text-green-500' : 'text-red-500'}/>
                        <DetailItem label="Risk %" value={`${auto.riskPercent.toFixed(2)}%`} subValue={<FormattedNumber value={riskAmount} />} valueClassName="text-red-500" />
                        <DetailItem label="Gain %" value={`${auto.gainPercent >= 0 ? '+' : ''}${auto.gainPercent.toFixed(2)}%`} subValue={<FormattedNumber value={gainAmount} />} valueClassName={auto.gainPercent >= 0 ? 'text-green-500' : 'text-red-500'} />
                    </DetailSection>
                    
                    <DetailSection title="Excursion" icon={BarChart2}>
                        <DetailItem label="Max Favorable Excursion (MFE)" value={`${auto.mfe.toFixed(1)} pips`} />
                        <DetailItem label="Max Adverse Excursion (MAE)" value={`${auto.mae.toFixed(1)} pips`} />
                    </DetailSection>

                    <DetailSection title="Costs" icon={BarChart2}>
                        <DetailItem label="Spread" value={<FormattedNumber value={auto.spreadCost || 0} />} />
                        <DetailItem label="Commission" value={<FormattedNumber value={auto.commissionCost || 0} />} />
                        <DetailItem label="Swap" value={<FormattedNumber value={auto.swapCost || 0} />} />
                    </DetailSection>

                    <DetailSection title="Timeline" icon={BarChart2}>
                        <DetailItem label="Open" value={`${trade.openDate} ${trade.openTime}`} />
                        <DetailItem label="Close" value={`${trade.closeDate} ${trade.closeTime}`} />
                        <DetailItem label="Holding Time" value={auto.holdingTime} />
                        <DetailItem label="NY Time Session" value={auto.session} />
                    </DetailSection>
                </div>
                {/* Right Column */}
                <div className="space-y-6">
                     <DetailSection title="Tiltmeter" icon={Brain}>
                         <div className="flex justify-center">
                            <Tiltmeter trade={trade} realizedR={realizedR} />
                         </div>
                         <p className="text-xs text-muted-foreground text-center">A visual representation of trade quality, combining discipline, R-multiple, and result.</p>
                     </DetailSection>
                     <DetailSection title="Sentiments" icon={Brain}>
                        <DetailItem label="Before" value={renderSentiments(trade.sentiment?.Before)} />
                        <DetailItem label="During" value={renderSentiments(trade.sentiment?.During)} />
                        <DetailItem label="After" value={renderSentiments(trade.sentiment?.After)} />
                     </DetailSection>
                     
                      <DetailSection title="Analysis Checklist" icon={CheckCircle}>
                        {trade.analysisSelections && Object.keys(trade.analysisSelections).length > 0 ? (
                            <div className="space-y-3">
                                {sortedTimeframes.map(timeframe => {
                                    const timeframeSelections = trade.analysisSelections[timeframe];
                                    if (!timeframeSelections || Object.keys(timeframeSelections).length === 0) return null;
                                    
                                    return (
                                        <Card key={timeframe} className="bg-muted/30">
                                            <CardHeader className="p-2"><CardTitle className="text-sm font-bold text-primary">{timeframe}</CardTitle></CardHeader>
                                            <CardContent className="p-2 pt-0">
                                                {(appSettings.analysisConfigurations || []).map(mainCategory => {
                                                    const relevantSubCats = mainCategory.subCategories.filter(subCat => timeframeSelections[subCat.id]?.length > 0);
                                                    if (relevantSubCats.length === 0) return null;
                                                    const Icon = (icons as any)[mainCategory.icon] || HelpCircle;
                                                    
                                                    return (
                                                        <div key={mainCategory.id} className="mb-2 last:mb-0">
                                                            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 border-b pb-1 mb-1">
                                                                <Icon className="h-3 w-3 text-primary" />
                                                                {mainCategory.title}
                                                            </h4>
                                                            <div className="flex flex-wrap gap-1">
                                                                {relevantSubCats.flatMap(subCat =>
                                                                    (timeframeSelections[subCat.id] || []).map((item: any, index: number) => {
                                                                        const optionId = typeof item === 'string' ? item : item.value;
                                                                        const option = subCat.options.find(o => o.id === optionId);
                                                                        const label = option ? option.value : 'Unknown';
                                                                        let modifiersText = '';
                                                                        if (typeof item === 'object' && item !== null) {
                                                                            modifiersText = Object.entries(item).filter(([key]) => key !== 'value').map(([, modValue]) => modValue).join(', ');
                                                                        }
                                                                        return (
                                                                            <Badge key={`${optionId}-${index}`} variant="secondary" className="bg-primary/20 text-primary-foreground h-auto flex items-center gap-1 text-[10px]">
                                                                                <span>{label}</span>
                                                                                {modifiersText && <span className="text-amber-400 font-semibold">({modifiersText})</span>}
                                                                            </Badge>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">No analysis checklist data for this trade.</p>
                        )}
                    </DetailSection>

                     
                      {trade.customStats && Object.keys(trade.customStats).length > 0 && (
                        <DetailSection title="Custom Stats" icon={FileText}>
                            {Object.entries(trade.customStats).map(([fieldId, value]) => {
                                // Skip strategy rules stored in customStats
                                if (fieldId.startsWith('strategy-')) return null;
                                
                                const field = appSettings.customFields?.find(f => f.id === fieldId);
                                const label = field ? field.title : fieldId;
                                const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
                                return <DetailItem key={fieldId} label={label} value={displayValue} />;
                            }).filter(Boolean)}
                        </DetailSection>
                      )}

                    <DetailSection title="News Events" icon={Newspaper}>
                        {trade.newsEvents && trade.newsEvents.length > 0 ? (
                            trade.newsEvents.map(event => (
                                <Card key={event.id} className="p-2 bg-muted/50">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <span className="font-semibold">{event.name}</span>
                                        <Badge variant={event.impact === 'High' ? 'destructive' : event.impact === 'Medium' ? 'secondary' : 'default'}>{event.impact}</Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1 text-xs text-center">
                                        <div className="p-1 bg-background/50 rounded-sm">
                                            <p className="text-muted-foreground">Actual</p>
                                            <p>{event.details.actual ?? 'N/A'}</p>
                                        </div>
                                        <div className="p-1 bg-background/50 rounded-sm">
                                            <p className="text-muted-foreground">Forecast</p>
                                            <p>{event.details.forecast ?? 'N/A'}</p>
                                        </div>
                                        <div className="p-1 bg-background/50 rounded-sm">
                                            <p className="text-muted-foreground">Previous</p>
                                            <p>{event.details.previous ?? 'N/A'}</p>
                                        </div>
                                    </div>
                                     <NewsImpactCoach newsEvents={[event]} pair={trade.pair} />
                                </Card>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">No news events logged.</p>
                        )}
                    </DetailSection>
                </div>
            </div>
        </div>
    );
};

const NotesMediaTab = ({ trade }: { trade: Trade }) => {
    const notesArray = Array.isArray(trade.note) ? trade.note : (trade.note ? [{ id: 'legacy-note', title: 'General Note', content: trade.note as string, isDefault: false }] : []);
    const notesByCategory = {
        'Before': notesArray.find(n => n.id === 'before' || n.title === 'Before Trade Note'),
        'During': notesArray.find(n => n.id === 'during' || n.title === 'During Trade Note'),
        'After': notesArray.find(n => n.id === 'after' || n.title === 'After Trade Note'),
        'Lessons Learned': trade.lessonsLearned ? { id: 'lessons', title: 'Lessons Learned', content: trade.lessonsLearned } : undefined
    };

    return (
        <Tabs defaultValue="before" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="before">Before</TabsTrigger>
                <TabsTrigger value="during">During</TabsTrigger>
                <TabsTrigger value="after">After</TabsTrigger>
                <TabsTrigger value="lessons">Lessons Learned</TabsTrigger>
            </TabsList>
            <TabsContent value="before">
                <div className="prose prose-sm dark:prose-invert max-w-none mt-4"><RichTextEditor value={notesByCategory['Before']?.content || ''} onChange={() => {}} isEditable={false} /></div>
            </TabsContent>
            <TabsContent value="during">
                <div className="prose prose-sm dark:prose-invert max-w-none mt-4"><RichTextEditor value={notesByCategory['During']?.content || ''} onChange={() => {}} isEditable={false} /></div>
            </TabsContent>
            <TabsContent value="after">
                <div className="prose prose-sm dark:prose-invert max-w-none mt-4"><RichTextEditor value={notesByCategory['After']?.content || ''} onChange={() => {}} isEditable={false} /></div>
            </TabsContent>
            <TabsContent value="lessons">
                <div className="prose prose-sm dark:prose-invert max-w-none mt-4"><RichTextEditor value={notesByCategory['Lessons Learned']?.content || ''} onChange={() => {}} isEditable={false} /></div>
            </TabsContent>
        </Tabs>
    );
};

const VisualsTab = ({ trade }: { trade: Trade }) => {
    const { images, imagesByTimeframe } = trade;
    const allImagesByTimeframe = { ...(imagesByTimeframe || {}) };
    if (images && images.length > 0) {
        allImagesByTimeframe['General'] = [...(allImagesByTimeframe['General'] || []), ...images];
    }
    const timeframes = Object.keys(allImagesByTimeframe).sort((a, b) => timeToMinutes(b) - timeToMinutes(a));

    if (timeframes.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-8">No images attached.</p>
    }

    return (
        <Tabs defaultValue={timeframes[0]} className="w-full">
            <TabsList>
                {timeframes.map(tf => <TabsTrigger key={tf} value={tf}>{tf}</TabsTrigger>)}
            </TabsList>
            {timeframes.map(tf => (
                <TabsContent key={tf} value={tf}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {(allImagesByTimeframe[tf] || []).map((src, i) => {
                             if (!src || typeof src !== 'string' || src.trim() === '') return null;
                             return (
                                <div key={i} className="relative group cursor-pointer aspect-video" onClick={() => window.open(src, '_blank')}>
                                    <Image src={src} alt={`${tf} image ${i+1}`} fill className="rounded-md object-cover" />
                                </div>
                             )
                        })}
                    </div>
                </TabsContent>
            ))}
        </Tabs>
    )
};


export default function TradeDetailDialog({ trade, isOpen, onOpenChange, defaultTab = 'overview' }: TradeDetailDialogProps) {
    const { toast } = useToast();
    const { openAddTradeDialog } = useJournalStore();
    const [isLayersViewerOpen, setIsLayersViewerOpen] = useState(false);

    if (!trade) return null;

    const handleCopyId = () => {
        navigator.clipboard.writeText(trade.id);
        toast({
            title: "Copied!",
            description: "Trade ID has been copied to your clipboard.",
        });
    };

    const handleEdit = () => {
        onOpenChange(false);
        setTimeout(() => {
            openAddTradeDialog(trade);
        }, 150);
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="glassmorphic sm:max-w-4xl h-[90vh] flex flex-col">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <DialogTitle>Trade Details: {trade.pair} - {trade.openDate}</DialogTitle>
                            <Button size="sm" variant="outline" onClick={handleEdit}>
                                <Pencil className="mr-2 h-4 w-4"/>
                                Edit Trade
                            </Button>
                        </div>
                        <DialogDescription className="flex items-center gap-2 pt-1">
                            <span className="text-xs font-mono text-muted-foreground">ID: {trade.id}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleCopyId}>
                                <Copy className="h-3 w-3" />
                            </Button>
                        </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue={defaultTab} className="w-full flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="overview"><BarChart2 className="mr-2 h-4 w-4"/>Overview</TabsTrigger>
                            <TabsTrigger value="notes"><NotebookText className="mr-2 h-4 w-4"/>Notes</TabsTrigger>
                            <TabsTrigger value="visuals"><ImageIcon className="mr-2 h-4 w-4"/>Visuals</TabsTrigger>
                        </TabsList>
                        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
                            <TabsContent value="overview">
                                <OverviewTab trade={trade} onOpenLayers={() => setIsLayersViewerOpen(true)} />
                            </TabsContent>
                            <TabsContent value="notes">
                                <NotesMediaTab trade={trade} />
                            </TabsContent>
                            <TabsContent value="visuals">
                                <VisualsTab trade={trade} />
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </DialogContent>
            </Dialog>
             <LayersAndPartialsViewer
                isOpen={isLayersViewerOpen}
                onClose={() => setIsLayersViewerOpen(false)}
                layers={trade.layers || []}
                partials={trade.partials || []}
            />
        </>
    );
}

    
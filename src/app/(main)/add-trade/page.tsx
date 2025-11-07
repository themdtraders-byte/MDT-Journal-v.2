
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter as DialogFooterComponent,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useToast } from '@/hooks/use-toast';
import type { NewsEventSelection, Trade, PartialTrade, TradeNote, KeywordScoreEffect, ScoreImpact, AppSettings, CustomField, AnalysisCategory, AnalysisSubCategory, AnalysisOption, POIRule, ZoneRule, RuleCombination, Journal, TradeDraft, Currency } from '@/types';
import { newsDatabase } from '@/lib/data';
import { PlusCircle, Trash2, Link as LinkIcon, Edit, NotebookText, AlertTriangle, PartyPopper, ShieldAlert, Ban, Clock, XCircle, Image as ImageIcon, Brain, Target, CheckCircle, ShieldCheck, AreaChart, Calendar as CalendarIcon, Layers, ChevronsRight, BarChart, TrendingUp, Zap, HelpCircle, Columns, Newspaper, MessageSquare, Award, Droplets, GitBranch, BookOpen, UploadCloud, MoreVertical, FilePlus, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimePicker } from '@/components/ui/time-picker';
import Image from 'next/image';
import RichTextEditor from '@/components/rich-text-editor';
import MultiSelect from '@/components/ui/multi-select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Combobox } from '@/components/ui/combobox';
import { icons } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import FormattedNumber from '@/components/ui/formatted-number';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, startOfWeek, startOfMonth } from 'date-fns';
import AddNewPairDialog from '@/components/add-new-pair-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { calculateTradeMetrics } from '@/lib/calculations';
import { isEqual } from 'lodash';


type LayerData = { id: string; lotSize: string; entryPrice: string; closingPrice: string; stopLoss: string; takeProfit: string };
type PartialCloseData = { id: string; lotSize: string; price: string };

const timeToMinutes = (timeframe: string): number => {
    if(!timeframe) return 0;
    const value = parseInt(timeframe.replace(/[^0-9]/g, ''), 10);
    if (isNaN(value)) return Infinity; // Put invalid/custom ones at the end
    
    if (timeframe.includes('M')) return value * 30 * 24 * 60; // Month
    if (timeframe.includes('W')) return value * 7 * 24 * 60;  // Week
    if (timeframe.includes('D')) return value * 24 * 60;      // Day
    if (timeframe.includes('h')) return value * 60;         // Hour
    return value; // Default for minutes
};

const compressImage = (file: File, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL(file.type, quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => {
        reject(error);
      }
    };
     reader.onerror = (error) => {
        reject(error);
    }
  });
};

const SelectionSummary = ({ analysisConfigs, selections, imagesByTimeframe }: { analysisConfigs: AnalysisCategory[], selections: Record<string, any>, imagesByTimeframe?: Record<string, string[]> }) => {
    const sortedTimeframes = useMemo(() => {
        if (!selections && !imagesByTimeframe) return [];
        const allTimeframes = new Set([...Object.keys(selections || {}), ...Object.keys(imagesByTimeframe || {})]);
        return Array.from(allTimeframes).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    }, [selections, imagesByTimeframe]);

    if (sortedTimeframes.length === 0) {
        return (
            <Card className="glassmorphic h-full flex flex-col">
                <CardHeader className="p-2"><CardTitle className="text-xs text-center uppercase">Selection Summary</CardTitle></CardHeader>
                <CardContent className="p-2 flex-1 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center">No selections made yet.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="glassmorphic h-full flex flex-col">
            <CardHeader className="p-2"><CardTitle className="text-xs text-center uppercase">Selection Summary</CardTitle></CardHeader>
            <CardContent className="p-2 flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="space-y-3">
                        {sortedTimeframes.map(timeframe => {
                            const timeframeSelections = selections[timeframe];
                            const timeframeImages = imagesByTimeframe?.[timeframe];
                            if (!timeframeSelections && !timeframeImages) return null;

                            return (
                                <Card key={timeframe} className="bg-muted/30">
                                    <CardHeader className="p-2"><CardTitle className="text-sm font-bold text-primary">{timeframe}</CardTitle></CardHeader>
                                    <CardContent className="p-2 pt-0">
                                        {timeframeSelections && analysisConfigs.flatMap(mainCategory => 
                                            mainCategory.subCategories
                                                .filter(subCat => timeframeSelections[subCat.id]?.length > 0)
                                                .map(subCat => {
                                                    const Icon = (icons as any)[mainCategory.icon] || HelpCircle;
                                                    return (
                                                        <div key={subCat.id} className="mb-2 last:mb-0">
                                                            <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 border-b pb-1 mb-1">
                                                                <Icon className="h-3 w-3 text-primary" />
                                                                {subCat.title}
                                                            </h4>
                                                            <div className="flex flex-wrap gap-1">
                                                                {(timeframeSelections[subCat.id] || []).map((item: any, index: number) => {
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
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                        )}
                                        {timeframeImages && timeframeImages.length > 0 && (
                                            <div className="mt-2 pt-2 border-t">
                                                 <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1">
                                                     <ImageIcon className="h-3 w-3 text-primary" />
                                                     Images
                                                 </h4>
                                                 <div className="flex flex-wrap gap-1">
                                                      {timeframeImages.map((src, i) => <div key={i} className="w-8 h-8 rounded-sm bg-cover bg-center" style={{backgroundImage: `url(${src})`}}/>)}
                                                 </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

const AddNewAnalysisOptionDialog = ({ isOpen, onClose, onSave, category }: { isOpen: boolean, onClose: () => void, onSave: (name: string, saveGlobally: boolean) => void, category: string }) => {
    const [name, setName] = useState('');
    const [saveGlobally, setSaveGlobally] = useState(true);

    useEffect(() => {
        if(isOpen) {
            setName('');
            setSaveGlobally(true);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim(), saveGlobally);
            onClose();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic">
                <DialogHeader>
                    <DialogTitle>Add New Item to "{category}"</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-1">
                        <Label>New Option Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()}/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="save-globally" checked={saveGlobally} onCheckedChange={setSaveGlobally} />
                        <Label htmlFor="save-globally">Save for future use</Label>
                    </div>
                </div>
                <DialogFooterComponent>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooterComponent>
            </DialogContent>
        </Dialog>
    )
}

const AddNewSentimentDialog = ({
    isOpen,
    onClose,
    onSave,
    sentimentName
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, impact: ScoreImpact) => void;
    sentimentName: string;
}) => {
    const [impact, setImpact] = useState<ScoreImpact>('Positive');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic">
                <DialogHeader>
                    <DialogTitle>Add New Emotion: "{sentimentName}"</DialogTitle>
                    <DialogDescription>Define the scoring impact for this new emotion.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Label>Impact on Discipline Score</Label>
                    <Select value={impact} onValueChange={(v) => setImpact(v as ScoreImpact)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Most Positive">Most Positive</SelectItem>
                            <SelectItem value="Positive">Positive</SelectItem>
                            <SelectItem value="Negative">Negative</SelectItem>
                            <SelectItem value="Most Negative">Most Negative</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooterComponent>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => { onSave(sentimentName, impact); onClose(); }}>Save Emotion</Button>
                </DialogFooterComponent>
            </DialogContent>
        </Dialog>
    )
}

const LayersAndPartialsDialog = ({
    isOpen,
    onClose,
    mainTradeData,
    initialLayers,
    initialPartials,
    onConfirm,
}: {
    isOpen: boolean;
    onClose: () => void;
    mainTradeData: Partial<FormDataType>;
    initialLayers: LayerData[];
    initialPartials: PartialCloseData[];
    onConfirm: (layers: LayerData[], partials: PartialCloseData[]) => void;
}) => {
    const [isLayerMode, setIsLayerMode] = useState(false);
    
    const [layers, setLayers] = useState<LayerData[]>([]);
    const [partials, setPartials] = useState<PartialCloseData[]>([]);

    useEffect(() => {
        if (isOpen) {
            const hasLayers = initialLayers && initialLayers.length > 0;
            setIsLayerMode(hasLayers);
            setLayers(hasLayers ? initialLayers : [{
                id: crypto.randomUUID(),
                lotSize: mainTradeData.lotSize || '',
                entryPrice: mainTradeData.entryPrice || '',
                closingPrice: mainTradeData.closingPrice || '',
                stopLoss: mainTradeData.stopLoss || '',
                takeProfit: mainTradeData.takeProfit || ''
            }]);
            setPartials(initialPartials && initialPartials.length > 0 ? initialPartials : []);
        }
    }, [isOpen, initialLayers, initialPartials, mainTradeData]);

    const handleAddLayer = () => setLayers(prev => [...prev, { id: crypto.randomUUID(), lotSize: '', entryPrice: '', closingPrice: '', stopLoss: '', takeProfit: '' }]);
    const handleRemoveLayer = (index: number) => setLayers(prev => prev.filter((_, i) => i !== index));
    const handleLayerChange = (index: number, field: keyof Omit<LayerData, 'id'>, value: string) => {
        setLayers(prev => prev.map((layer, i) => i === index ? { ...layer, [field]: value } : layer));
    };

    const handleAddPartial = () => setPartials(prev => [...prev, { id: crypto.randomUUID(), lotSize: '', price: '' }]);
    const handleRemovePartial = (index: number) => setPartials(prev => prev.filter((_, i) => i !== index));
    const handlePartialChange = (index: number, field: keyof Omit<PartialCloseData, 'id'>, value: string) => {
        setPartials(prev => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    };

    const handleConfirmClick = () => {
        if (isLayerMode) {
            onConfirm(layers, []);
        } else {
            onConfirm([], partials);
        }
        onClose();
    };

    const totalLotSize = parseFloat(mainTradeData.lotSize || '0');
    const totalLayerLots = layers.reduce((sum, l) => sum + (parseFloat(l.lotSize) || 0), 0);
    const totalPartialLots = partials.reduce((sum, p) => sum + (parseFloat(p.lotSize) || 0), 0);
    const remainingPartialLots = totalLotSize - totalPartialLots;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Entry Layers & Partial Closes</DialogTitle>
                    <div className="flex items-center space-x-2 pt-2">
                        <Label htmlFor="mode-switch">Partial Close Mode</Label>
                        <Switch id="mode-switch" checked={isLayerMode} onCheckedChange={setIsLayerMode} />
                        <Label htmlFor="mode-switch">Entry Layers Mode</Label>
                    </div>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                    {isLayerMode ? (
                        <>
                            {layers.map((layer, index) => (
                                <Card key={layer.id} className="p-3 bg-muted/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <Label>Layer {index + 1}</Label>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveLayer(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        <Input className="h-7 text-xs" placeholder="Lot Size" value={layer.lotSize} onChange={e => handleLayerChange(index, 'lotSize', e.target.value)} />
                                        <Input className="h-7 text-xs" placeholder="Entry" value={layer.entryPrice} onChange={e => handleLayerChange(index, 'entryPrice', e.target.value)} />
                                        <Input className="h-7 text-xs" placeholder="SL" value={layer.stopLoss} onChange={e => handleLayerChange(index, 'stopLoss', e.target.value)} />
                                        <Input className="h-7 text-xs" placeholder="TP" value={layer.takeProfit} onChange={e => handleLayerChange(index, 'takeProfit', e.target.value)} />
                                        <Input className="h-7 text-xs" placeholder="Close" value={layer.closingPrice} onChange={e => handleLayerChange(index, 'closingPrice', e.target.value)} />
                                    </div>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full" onClick={handleAddLayer}><PlusCircle className="mr-2 h-4 w-4" /> Add Layer</Button>
                            <div className="text-sm font-bold text-right">Total Lots: {totalLayerLots.toFixed(2)}</div>
                        </>
                    ) : (
                        <>
                             <div className="grid grid-cols-3 text-center font-semibold text-sm p-2 bg-muted/30 rounded-lg">
                                 <div>Total Lots: <span className="text-primary">{totalLotSize.toFixed(2)}</span></div>
                                 <div>Closed Lots: <span>{(totalLotSize - remainingPartialLots).toFixed(2)}</span></div>
                                 <div>Remaining: <span className={remainingPartialLots < 0 ? "text-destructive" : ""}>{remainingPartialLots.toFixed(2)}</span></div>
                             </div>
                            {partials.map((partial, index) => (
                                <Card key={partial.id} className="p-3 bg-muted/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <Label>Partial #{index + 1}</Label>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePartial(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input placeholder="Lot Size" value={partial.lotSize} onChange={e => handlePartialChange(index, 'lotSize', e.target.value)} />
                                        <Input placeholder="Close Price" value={partial.price} onChange={e => handlePartialChange(index, 'price', e.target.value)} />
                                    </div>
                                </Card>
                            ))}
                            <Button variant="outline" className="w-full" onClick={handleAddPartial}><PlusCircle className="mr-2 h-4 w-4" /> Add Partial</Button>
                        </>
                    )}
                </div>
                <DialogFooterComponent>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirmClick}>Confirm</Button>
                </DialogFooterComponent>
            </DialogContent>
        </Dialog>
    );
};


type FormDataType = Omit<Partial<Trade>, 'lotSize' | 'entryPrice' | 'closingPrice' | 'stopLoss' | 'takeProfit' | 'commission' | 'extraSpread' | 'mae' | 'mfe' | 'partials' | 'layers' | 'note'> & {
    id?: string;
    lotSize: string;
    entryPrice: string;
    closingPrice: string;
    stopLoss: string;
    takeProfit: string;
    commission: string;
    extraSpread: string;
    mae: string;
    mfe: string;
    partials: PartialCloseData[];
    layers: LayerData[];
    isLayered: boolean;
    customStats: Record<string, any>;
    tag: string;
    wasTpHit?: boolean;
    lessonsLearned: string;
    status: 'Open' | 'Closed' | 'Incomplete';
    analysisSelections: Record<string, any>;
    imagesByTimeframe?: Record<string, string[]>
    note: TradeNote[];
}

const defaultNotePrompts: TradeNote[] = [
  { id: 'before', title: "Before Trade Note", content: "", isDefault: true },
  { id: 'during', title: "During Trade Note", content: "", isDefault: true },
  { id: 'after', title: "After Trade Note", content: "", isDefault: true },
];

const getSafeInitialFormData = (defaultInputs: AppSettings['defaultInputs'] = {}): FormDataType => {
    const now = new Date();
    const openDate = now.toISOString().split('T')[0];
    const openTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    return {
        openDate, openTime, closeDate: '', closeTime: '', pair: defaultInputs.pair || 'XAUUSD',
        direction: (defaultInputs.direction as 'Buy' | 'Sell') || 'Buy', lotSize: '', entryPrice: '', closingPrice: '',
        stopLoss: '', takeProfit: '', commission: '', extraSpread: '', hasPartial: false,
        partials: [], breakeven: { type: 'No Break Even' }, sentiment: { Before: [], During: [], After: [] },
        images: [], note: defaultNotePrompts.map(p => ({...p, content: ''})), strategy: defaultInputs.strategy || '', tag: '',
        bias: [], discountPremiumZones: [], liquidity: [], entryReasons: [], indicators: [],
        newsEvents: [], mae: '', mfe: '', customStats: {}, wasTpHit: undefined, lessonsLearned: '',
        status: 'Incomplete', isLayered: false, layers: [], analysisSelections: {}, imagesByTimeframe: {},
    };
};

const MetricItem = ({ label, value, valueClassName }: { label: string, value: React.ReactNode, valueClassName?: string }) => (
    <div className="text-center">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <div className={cn("text-xs font-bold", valueClassName)}>{value}</div>
    </div>
);

type AlertState = {
    isOpen: boolean;
    title: string;
    description: React.ReactNode;
    icon: React.ElementType;
    onConfirm?: () => void;
};

const getResultBadgeVariant = (result: 'TP' | 'SL' | 'BE' | 'Stop') => {
    switch (result) {
        case 'TP': return 'bg-green-500/20 text-green-500';
        case 'SL': return 'bg-red-500/20 text-red-500';
        case 'BE': return 'bg-blue-500/20 text-blue-400';
        default: return 'bg-gray-500/20 text-gray-500';
    }
}

const AddTradePageContent = () => {
    const router = useRouter();
    const { 
        addTrade, 
        updateTrade, 
        addTradeDraft,
        updateTradeDraft,
        removeTradeDraft,
        renameTradeDraft,
        setActiveTradeDraftId,
        appSettings, 
        updateAppSettings, 
        journals, 
        activeJournalId,
    } = useJournalStore();

    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const tradeDrafts = useMemo(() => activeJournal?.tradeDrafts || [], [activeJournal]);
    const activeTradeDraftId = useMemo(() => activeJournal?.activeTradeDraftId, [activeJournal]);

    const activeDraft = useMemo(() => tradeDrafts.find(d => d.id === activeTradeDraftId), [tradeDrafts, activeTradeDraftId]);
  
    const [activeTab, setActiveTab] = useState('setup');
    const { toast } = useToast();
    const imageUploadRef = useRef<HTMLInputElement>(null);
    const [imageUrl, setImageUrl] = useState('');
    const [newSentimentDialog, setNewSentimentDialog] = useState<{isOpen: boolean; name: string, stage: 'Before' | 'During' | 'After'}>({isOpen: false, name: '', stage: 'Before'});
    const [newPairDialog, setNewPairDialog] = useState({ isOpen: false, name: '' });
    const [isLayersDialogOpen, setIsLayersDialogOpen] = useState(false);
    const [showExtraDetails, setShowExtraDetails] = useState(false);
    const [alertState, setAlertState] = useState<AlertState>({ isOpen: false, title: '', description: '', icon: AlertTriangle });
    const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
    const [currentSubCategoryForNewOption, setCurrentSubCategoryForNewOption] = useState<AnalysisSubCategory | null>(null);
    
    const [analysisTimeframe, setAnalysisTimeframe] = useState('1h');
    const [reviewStage, setReviewStage] = useState<'Before' | 'During' | 'After' | 'Lessons'>('Before');
  
    const [formData, setFormData] = useState<FormDataType>(getSafeInitialFormData(appSettings?.defaultInputs));
    const [editingDraftName, setEditingDraftName] = useState<{ id: string, name: string } | null>(null);
    const [isModified, setIsModified] = useState(false);
    
    const initialFormDataRef = useRef<FormDataType>(getSafeInitialFormData(appSettings?.defaultInputs));

    useEffect(() => {
        if (appSettings?.inputOptions?.timeframes?.length) {
            setAnalysisTimeframe(appSettings.inputOptions.timeframes[0]);
        }
    }, [appSettings?.inputOptions?.timeframes]);
    
    const isEditing = useMemo(() => !!formData.id, [formData.id]);
    
    const customFields = useMemo(() => appSettings?.customFields || [], [appSettings]);
    
      const getImpactColor = (impact: ScoreImpact) => {
          switch(impact) {
              case 'Most Positive': return 'text-green-400 font-bold';
              case 'Positive': return 'text-green-500';
              case 'Most Negative': return 'text-red-400 font-bold';
              case 'Negative': return 'text-red-500';
              default: return 'text-foreground';
          }
      }
  
    const sentimentOptions = useMemo(() => {
        if (!appSettings?.inputOptions?.sentiments || !appSettings?.keywordScores) return [];
        return (appSettings.inputOptions.sentiments || []).map(s => {
            const keywordScore = (appSettings.keywordScores || []).find(kw => kw.keyword.toLowerCase() === s.toLowerCase() && kw.type === 'Sentiment');
            const impact = keywordScore ? keywordScore.impact : 'Positive'; // Default to positive if not found
            return { value: s, label: s, className: getImpactColor(impact as ScoreImpact) };
        })
    }, [appSettings?.inputOptions?.sentiments, appSettings?.keywordScores]);
    
      const numberToString = (val: number | undefined | null) => (val === undefined || val === null ? '' : String(val));
      const partialsToString = (partials: { id?: string, lotSize: number; price: number }[] | undefined): PartialCloseData[] => 
          (partials || []).map(p => ({ id: p.id || crypto.randomUUID(), lotSize: numberToString(p.lotSize), price: numberToString(p.price) }));
      const layersToString = (layers: { id?: string, lotSize: number; entryPrice: number; closingPrice: number; stopLoss: number; takeProfit: number; }[] | undefined): LayerData[] =>
          (layers || []).map(l => ({ 
              id: l.id || crypto.randomUUID(),
              lotSize: numberToString(l.lotSize),
              entryPrice: numberToString(l.entryPrice),
              closingPrice: numberToString(l.closingPrice),
              stopLoss: numberToString(l.stopLoss),
              takeProfit: numberToString(l.takeProfit),
          }));
  
      const sortedTimeframes = useMemo(() => {
          if (!appSettings?.inputOptions?.timeframes) return [];
          return [...appSettings.inputOptions.timeframes].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
      }, [appSettings?.inputOptions?.timeframes]);
      
      const selectedStrategy = useMemo(() => {
        if (!activeJournal) return null;
        return activeJournal.strategies?.find(s => s.name === formData.strategy) || null;
      }, [formData.strategy, activeJournal]);
  
      const combinedAnalysisConfigs = useMemo(() => {
        if (!activeJournal || !appSettings?.analysisConfigurations) return [];
        const globalConfigs: AnalysisCategory[] = JSON.parse(JSON.stringify(appSettings.analysisConfigurations || []));
        const strategyConfigs = selectedStrategy?.analysisConfigurations || [];

        if (strategyConfigs.length === 0) {
            return globalConfigs;
        }
        
        const mergedConfigs = globalConfigs.map(cat => ({...cat}));


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
                            if (!globalSubCat!.options.some((o: AnalysisOption) => o.value.toLowerCase() === stratOpt.value.toLowerCase())) {
                                globalSubCat!.options.push(JSON.parse(JSON.stringify(stratOpt)));
                            }
                        });
                    }
                 });
            }
        });

        return mergedConfigs;
    }, [appSettings?.analysisConfigurations, selectedStrategy, activeJournal]);

      const [activeCategory, setActiveCategory] = useState<string>('');
      
      useEffect(() => {
          if (combinedAnalysisConfigs.length > 0 && !activeCategory) {
              setActiveCategory(combinedAnalysisConfigs[0].id);
          }
      }, [combinedAnalysisConfigs, activeCategory]);
  
    useEffect(() => {
        if (!activeJournal || !appSettings) return;
        const hasDrafts = activeJournal.tradeDrafts && activeJournal.tradeDrafts.length > 0;
        
        let draftToLoad = activeDraft;
        if (!draftToLoad) {
            if (hasDrafts && activeTradeDraftId) {
                // This handles the case where the active ID is stale
                setActiveTradeDraftId(activeJournal.tradeDrafts[0].id);
                return;
            }
        }
        
        if (draftToLoad) {
            const draftFormData = draftToLoad.formData as Partial<Trade> & { id?: string; };
            const baseFormData = {
                ...getSafeInitialFormData(appSettings?.defaultInputs),
                ...draftFormData,
                // Ensure complex objects are correctly initialized if they don't exist on the draft
                customStats: draftFormData.customStats || {},
                note: draftFormData.note || defaultNotePrompts.map(p => ({...p, content: ''})),
                sentiment: draftFormData.sentiment || { Before: [], During: [], After: [] },
                analysisSelections: draftFormData.analysisSelections || {},
                imagesByTimeframe: draftFormData.imagesByTimeframe || {},
                partials: draftFormData.partials || [],
                layers: draftFormData.layers || [],
            }
            
            // Further ensure nested properties are well-formed
            const ensuredNote: TradeNote[] = defaultNotePrompts.map(defaultNote => {
                const existingNote = Array.isArray(baseFormData.note) ? baseFormData.note.find(n => n.id === defaultNote.id || n.title === defaultNote.title) : null;
                return existingNote ? { ...defaultNote, ...existingNote } : { ...defaultNote, content: '' };
            });
            const customNotes = (Array.isArray(baseFormData.note) ? baseFormData.note : []).filter(n => n && !n.isDefault);
            ensuredNote.push(...customNotes);

            const stringifiedNumericFields = {
                lotSize: numberToString(baseFormData.lotSize),
                entryPrice: numberToString(baseFormData.entryPrice),
                closingPrice: numberToString(baseFormData.closingPrice),
                stopLoss: numberToString(baseFormData.stopLoss),
                takeProfit: numberToString(baseFormData.takeProfit),
                commission: numberToString(baseFormData.commission),
                extraSpread: numberToString(baseFormData.extraSpread),
                mae: numberToString(baseFormData.mae),
                mfe: numberToString(baseFormData.mfe),
            };

            const finalFormData = {
                ...baseFormData,
                note: ensuredNote,
                ...stringifiedNumericFields,
                partials: partialsToString(baseFormData.partials),
                layers: layersToString(baseFormData.layers),
                isLayered: (baseFormData.layers || []).length > 0,
                hasPartial: (baseFormData.partials || []).length > 0,
            } as FormDataType;
            
            setFormData(finalFormData);
            // On load, the form is not yet modified by the user
            setIsModified(false); 
            // Store the loaded state as the "pristine" state to compare against for modifications
            initialFormDataRef.current = finalFormData;

        } else {
            // No active draft, set to a fresh form
            const newForm = getSafeInitialFormData(appSettings?.defaultInputs);
            setFormData(newForm);
            setIsModified(false);
            initialFormDataRef.current = newForm;
        }

    }, [activeJournal, activeDraft, activeTradeDraftId, appSettings]);

    // Auto-save draft changes
    useEffect(() => {
        if (activeTradeDraftId && isModified) {
            const timeoutId = setTimeout(() => {
                updateTradeDraft(activeTradeDraftId, { formData });
            }, 500); // Debounce time
            return () => clearTimeout(timeoutId);
        }
    }, [formData, activeTradeDraftId, isModified, updateTradeDraft]);

    const handleFormChange = (field: keyof FormDataType, value: any) => {
        const newFormData = {...formData, [field]: value};
        
        // Exclude openDate and openTime from the modification check
        const { openDate: _a, openTime: _b, ...restNew } = newFormData;
        const { openDate: _c, openTime: _d, ...restInitial } = initialFormDataRef.current;
        
        if (!isEqual(restNew, restInitial)) {
            setIsModified(true);
        }
        
        setFormData(newFormData);
    };
    
      const handleNumericChange = (field: keyof FormDataType, value: string) => {
      let cleanValue = value.replace(/[^0-9.]/g, '');
      const parts = cleanValue.split('.');
      if (parts.length > 2) {
        cleanValue = parts[0] + '.' + parts.slice(1).join('');
      }
  
      if (field === 'lotSize' && parts[1] && parts[1].length > 2) {
          cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
      } else if (parts[1] && parts[1].length > 8) { 
          cleanValue = parts[0] + '.' + parts[1].substring(0, 8);
      }
      
      handleFormChange(field, cleanValue);
    }
  
    const handleChange = (field: keyof FormDataType, value: any) => {
      const numericFields = ['lotSize', 'entryPrice', 'closingPrice', 'stopLoss', 'takeProfit', 'commission', 'extraSpread', 'mae', 'mfe'];
      if (numericFields.includes(field as string)) {
          handleNumericChange(field, String(value));
      } else {
          handleFormChange(field, value);
      }
    };
  
    const handleAnalysisSelection = (subCategoryId: string, optionId: string, isSingleChoice: boolean) => {
        const newSelections = JSON.parse(JSON.stringify(formData.analysisSelections));
        
        if (!newSelections[analysisTimeframe]) {
            newSelections[analysisTimeframe] = {};
        }

        const currentSubCatSelection = newSelections[analysisTimeframe][subCategoryId] || [];
        const existingIndex = currentSubCatSelection.findIndex((item: any) => (typeof item === 'string' ? item : item.value) === optionId);

        if (isSingleChoice) {
            if (existingIndex !== -1) {
                newSelections[analysisTimeframe][subCategoryId] = [];
            } else {
                newSelections[analysisTimeframe][subCategoryId] = [optionId];
            }
        } else {
            if (existingIndex !== -1) {
                newSelections[analysisTimeframe][subCategoryId] = currentSubCatSelection.filter((_: any, index: number) => index !== existingIndex);
            } else {
                newSelections[analysisTimeframe][subCategoryId] = [...currentSubCatSelection, optionId];
            }
        }

        if (newSelections[analysisTimeframe][subCategoryId].length === 0) {
            delete newSelections[analysisTimeframe][subCategoryId];
        }
        if (Object.keys(newSelections[analysisTimeframe]).length === 0) {
            delete newSelections[analysisTimeframe];
        }

        handleChange('analysisSelections', newSelections);
    };
  
  const handleModifierSelection = (subCategoryId: string, optionId: string, modifierKey: string, modifierValue: string) => {
        const newSelections = JSON.parse(JSON.stringify(formData.analysisSelections));
        const timeframeSelection = newSelections[analysisTimeframe];
        if (!timeframeSelection || !timeframeSelection[subCategoryId]) return;

        const currentSubCatSelection = timeframeSelection[subCategoryId];
        const optionIndex = currentSubCatSelection.findIndex((item: any) => (typeof item === 'string' ? item : item.value) === optionId);
        
        if (optionIndex === -1) return;

        let option = currentSubCatSelection[optionIndex];
        if (typeof option === 'string') {
            option = { value: option };
        }
        
        const newOption = { ...option };
        if (modifierKey === 'freeText' && typeof modifierValue === 'string') {
            if (modifierValue.trim() === '') {
                delete newOption[modifierKey]; 
            } else {
                newOption[modifierKey] = modifierValue;
            }
        } else {
            if (newOption[modifierKey] === modifierValue) {
                delete newOption[modifierKey]; 
            } else {
                newOption[modifierKey] = modifierValue;
            }
        }

        const newSelection = [...currentSubCatSelection];
        newSelection[optionIndex] = newOption;
        
        newSelections[analysisTimeframe][subCategoryId] = newSelection;

        handleChange('analysisSelections', newSelections);
    };
    
    const getSelectedModifier = (subCategoryId: string, optionId: string, modifierKey: string): string | null => {
      const selectionForTimeframe = formData.analysisSelections[analysisTimeframe];
      if (!selectionForTimeframe) return null;
      
      const selection = selectionForTimeframe[subCategoryId] || [];
      const selectedItem = selection.find((item: any) => (typeof item === 'string' ? item : item.value) === optionId);
      if (typeof selectedItem === 'object' && selectedItem !== null) {
          return selectedItem[modifierKey] || null;
      }
      return null;
  };
  
  const isOptionSelected = (subCategoryId: string, optionId: string): boolean => {
      const selectionForTimeframe = formData.analysisSelections[analysisTimeframe];
      if (!selectionForTimeframe) return false;
      
      const selection = selectionForTimeframe[subCategoryId];
      if (!selection || !Array.isArray(selection)) return false;
  
      return selection.some(item => (typeof item === 'string' ? item : item.value) === optionId);
  };
    
      const handleSaveNewOption = (value: string, saveGlobally: boolean) => {
          if (!currentSubCategoryForNewOption) return;
          const subCatId = currentSubCategoryForNewOption.id;
          
          let optionId = `custom:${value.toLowerCase().replace(/\s+/g, '-')}`;
  
          if (saveGlobally) {
              const newOption: AnalysisOption = { id: crypto.randomUUID(), value };
              const newAnalysisConfigs: AnalysisCategory[] = JSON.parse(JSON.stringify(appSettings.analysisConfigurations));
              let subCategoryFound = false;
  
              for (const category of newAnalysisConfigs) {
                  const subCategory = category.subCategories.find((sc: any) => sc.id === subCatId);
                  if (subCategory && !subCategory.options.some((o: any) => o.value.toLowerCase() === value.toLowerCase())) {
                      subCategory.options.push(newOption);
                      subCategoryFound = true;
                      optionId = newOption.id;
                      break;
                  }
              }
              
              if (subCategoryFound) {
                  updateAppSettings({ analysisConfigurations: newAnalysisConfigs });
                  toast({ title: 'Option Saved', description: `"${value}" has been saved for future use.` });
              }
          }
          
          handleAnalysisSelection(subCatId, optionId, currentSubCategoryForNewOption.modifiers ? false : true);
          setIsAddOptionOpen(false);
      };
  
      const handleOpenNewOptionDialog = (subCategory: AnalysisSubCategory) => {
          setCurrentSubCategoryForNewOption(subCategory);
          setIsAddOptionOpen(true);
      };
  
  
    const metrics = useMemo(() => {
      if (!activeJournal || !appSettings || !appSettings.pairsConfig) {
        return { pl: 0, rr: 'N/A', score: { value: 0, color: 'text-foreground', remark: '' }, riskPercent: 'N/A', outcome: 'N/A', result: 'N/A', session: 'N/A', holdingTime: 'N/A', matchedSetups: [], newsImpact: 'N/A', status: 'N/A' };
      }
      
      const tradeForCalc = {
        ...formData,
        lotSize: parseFloat(formData.lotSize) || 0,
        entryPrice: parseFloat(formData.entryPrice) || 0,
        closingPrice: parseFloat(formData.closingPrice) || 0,
        stopLoss: parseFloat(formData.stopLoss) || 0, 
        takeProfit: parseFloat(formData.takeProfit) || 0,
        partials: (formData.partials || []).map(p => ({ lotSize: parseFloat(p.lotSize) || 0, price: parseFloat(p.price) || 0 })),
        layers: (formData.layers || []).map(l => ({ ...l, lotSize: parseFloat(l.lotSize) || 0, entryPrice: parseFloat(l.entryPrice) || 0, closingPrice: parseFloat(l.closingPrice) || 0, stopLoss: parseFloat(l.stopLoss) || 0, takeProfit: parseFloat(l.takeProfit) || 0 })),
      } as Omit<Trade, 'auto' | 'id'> & {id?: string};
      
      const calculated = calculateTradeMetrics(tradeForCalc, activeJournal, appSettings);
  
      return {
        pl: calculated.pl,
        rr: isNaN(calculated.rr) ? 'N/A' : calculated.rr.toFixed(2),
        score: calculated.score,
        riskPercent: isNaN(calculated.riskPercent) ? 'N/A' : calculated.riskPercent.toFixed(2),
        status: calculated.status,
        outcome: calculated.outcome,
        result: calculated.result,
        session: calculated.session,
        holdingTime: calculated.holdingTime,
        matchedSetups: calculated.matchedSetups || [],
        newsImpact: calculated.newsImpact || 'N/A',
      };
    }, [formData, activeJournal, appSettings]);
  
  
      const performFinalSubmit = () => {
          const { openDate, openTime, pair } = formData;
  
          const isIncomplete = !openDate || !openTime || !pair || !formData.lotSize || !formData.entryPrice || !formData.closingPrice;
          
          let tradeDataToSave: PartialTrade & { id?: string } = {
              ...formData,
              id: formData.id,
              status: isIncomplete ? 'Incomplete' : 'Closed',
              lotSize: parseFloat(formData.lotSize) || 0,
              entryPrice: parseFloat(formData.entryPrice) || 0,
              closingPrice: parseFloat(formData.closingPrice) || 0,
              stopLoss: parseFloat(formData.stopLoss) || 0,
              takeProfit: parseFloat(formData.takeProfit) || 0,
              commission: parseFloat(formData.commission) || 0,
              extraSpread: parseFloat(formData.extraSpread) || 0,
              mae: parseFloat(formData.mae) || 0,
              mfe: parseFloat(formData.mfe) || 0,
              partials: (formData.partials || []).map(p => ({ lotSize: parseFloat(p.lotSize) || 0, price: parseFloat(p.price) || 0 })),
              layers: (formData.layers || []).map(l => ({ ...l, lotSize: parseFloat(l.lotSize) || 0, entryPrice: parseFloat(l.entryPrice) || 0, closingPrice: parseFloat(l.closingPrice) || 0, stopLoss: parseFloat(l.stopLoss) || 0, takeProfit: parseFloat(l.takeProfit) || 0})),
              note: formData.note,
              customStats: formData.customStats,
              lessonsLearned: formData.lessonsLearned,
          };
          
          if (isEditing) {
              updateTrade(tradeDataToSave as Omit<Trade, 'auto'> & {id: string});
              toast({ title: "Success", description: "Trade updated successfully."});
          } else {
              addTrade(tradeDataToSave);
              toast({ title: "Success", description: "Trade added successfully."});
          }
          
          if (activeTradeDraftId) {
            removeTradeDraft(activeTradeDraftId);
          }
          router.push('/data/table');
      };
  
      const planViolations = useMemo(() => {
        if (!activeJournal || !activeJournal.plan) return [];
        const { plan, capital, trades } = activeJournal;
        const violations: { title: string; icon: React.ElementType; description: React.ReactNode }[] = [];
        const { openDate, openTime, pair, lotSize, entryPrice, stopLoss, takeProfit } = formData;
        if (!openDate || !openTime) return [];

        const openDateTime = new Date(`${openDate}T${openTime}`);
        const timeInMinutes = openDateTime.getHours() * 60 + openDateTime.getMinutes();
        
        if ((plan.activeHours || []).length > 0) {
            const isInActiveHours = (plan.activeHours || []).some(zone => {
                if (!zone || !zone.start || !zone.end) return false;
                const [startHour, startMinute] = zone.start.split(':').map(Number);
                const startMins = startHour * 60 + startMinute;
                const [endHour, endMinute] = zone.end.split(':').map(Number);
                let endMins = endHour * 60 + endMinute;
                if (endMins < startMins) return timeInMinutes >= startMins || timeInMinutes <= endMins;
                return timeInMinutes >= startMins && timeInMinutes <= endMins;
            });
            if (!isInActiveHours) {
                violations.push({ title: 'Trading Time Alert', icon: Clock, description: 'Outside planned active hours.' });
            }
        }
        
        if ((plan.noTradeZones || []).length > 0) {
            const isInNoTradeZone = (plan.noTradeZones || []).some(zone => {
                if (!zone || !zone.start || !zone.end) return false;
                const [startHour, startMinute] = zone.start.split(':').map(Number);
                const startMins = startHour * 60 + startMinute;
                const [endHour, endMinute] = zone.end.split(':').map(Number);
                let endMins = endHour * 60 + endMinute;
                if (endMins < startMins) return timeInMinutes >= startMins || timeInMinutes <= endMins;
                return timeInMinutes >= startMins && timeInMinutes <= endMins;
            });
            if (isInNoTradeZone) {
                violations.push({ title: 'No-Trade Zone Alert', icon: Ban, description: 'Trading inside a defined no-trade zone.' });
            }
        }

        if (plan.instruments.length > 0 && pair && !plan.instruments.includes(pair)) {
            violations.push({ title: 'Instrument Alert', icon: XCircle, description: <>The pair {pair} is not in your plan.</> });
        }

        const tradesToday = trades.filter(t => t.openDate === openDate);
        if (plan.dailyLossLimit > 0) {
            const dailyPl = tradesToday.reduce((sum, t) => sum + t.auto.pl, 0);
            const maxDailyLoss = capital * plan.dailyLossLimit / 100;
            if (dailyPl <= -maxDailyLoss) {
                violations.push({ title: 'Daily Loss Limit Reached', icon: Ban, description: <>Daily loss limit of <FormattedNumber value={maxDailyLoss} /> hit.</> });
            }
        }
        
        function isSameWeek(d1: Date, d2: Date) {
          return format(startOfWeek(d1, { weekStartsOn: 1 }), 'yyyy-MM-dd') === format(startOfWeek(d2, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        }
        
        function isSameMonth(d1: Date, d2: Date) {
          return format(startOfMonth(d1), 'yyyy-MM') === format(startOfMonth(d1), 'yyyy-MM');
        }

        const tradesThisWeek = trades.filter(t => isSameWeek(new Date(t.openDate), openDateTime));
        if (plan.weeklyLossLimit > 0) {
            const weeklyPl = tradesThisWeek.reduce((sum, t) => sum + t.auto.pl, 0);
            const maxWeeklyLoss = capital * plan.weeklyLossLimit / 100;
            if (weeklyPl <= -maxWeeklyLoss) {
                violations.push({ title: 'Weekly Loss Limit Reached', icon: Ban, description: 'Weekly loss limit hit.' });
            }
        }

        const tradesThisMonth = trades.filter(t => isSameMonth(new Date(t.openDate), openDateTime));
        if (plan.monthlyLossLimit > 0) {
            const monthlyPl = tradesThisMonth.reduce((sum, t) => sum + t.auto.pl, 0);
            const maxMonthlyLoss = capital * plan.monthlyLossLimit / 100;
            if (monthlyPl <= -maxMonthlyLoss) {
                violations.push({ title: 'Monthly Loss Limit Reached', icon: Ban, description: 'Monthly loss limit hit.' });
            }
        }
        
        if (plan.maxTradesPerDay > 0 && tradesToday.length >= plan.maxTradesPerDay) {
            violations.push({ title: 'Max Trades Per Day Reached', icon: Ban, description: <>Limit of {plan.maxTradesPerDay} trades.</> });
        } else if (plan.maxTradesPerDay > 0 && tradesToday.length === plan.maxTradesPerDay - 1) {
            violations.push({ title: 'Approaching Daily Trade Limit', icon: ShieldAlert, description: <>This next trade will be your last one for today according to your plan.</> });
        }
        
        const dailyTargetAmount = plan.dailyTargetUnit === '%' ? capital * plan.dailyTarget / 100 : plan.dailyTarget;
        if (plan.dailyTarget > 0 && tradesToday.reduce((sum,t) => sum+t.auto.pl, 0) >= dailyTargetAmount) {
             violations.push({ title: 'Daily Target Reached!', icon: PartyPopper, description: 'Daily profit target hit.' });
        }
        
        const weeklyProfitTargetAmount = plan.weeklyProfitLimitUnit === '%' ? capital * plan.weeklyProfitLimit / 100 : plan.weeklyProfitLimit;
        if (plan.weeklyProfitLimit > 0 && tradesThisWeek.reduce((sum,t) => sum+t.auto.pl, 0) >= weeklyProfitTargetAmount) {
             violations.push({ title: 'Weekly Target Reached!', icon: PartyPopper, description: 'Weekly profit target hit.' });
        }
        
        const monthlyProfitTargetAmount = plan.monthlyProfitLimitUnit === '%' ? capital * plan.monthlyProfitLimit / 100 : plan.monthlyProfitLimit;
        if (plan.monthlyProfitLimit > 0 && tradesThisMonth.reduce((sum,t) => sum+t.auto.pl, 0) >= monthlyProfitTargetAmount) {
             violations.push({ title: 'Monthly Target Reached!', icon: PartyPopper, description: 'Monthly profit target hit.' });
        }

        const numLotSize = parseFloat(lotSize);
        const numEntry = parseFloat(entryPrice);
        const numSL = parseFloat(stopLoss);
        const numTP = parseFloat(takeProfit);
        if (!appSettings?.pairsConfig) return violations; // Guard against undefined pairsConfig
        const pairInfo = appSettings.pairsConfig[pair as keyof typeof appSettings.pairsConfig];

        if (numEntry > 0 && numSL > 0 && numLotSize > 0 && pairInfo) {
            const riskPips = Math.abs(numEntry - numSL) / pairInfo.pipSize;
            const riskAmount = riskPips * numLotSize * pairInfo.pipValue;
            const maxRiskAmount = plan.riskUnit === '%' ? capital * (plan.riskPerTrade / 100) : plan.riskPerTrade;
            if (riskAmount > maxRiskAmount) {
                violations.push({ title: 'Risk Exceeds Plan', icon: AlertTriangle, description: <>Risk of <FormattedNumber value={riskAmount} /> exceeds limit.</> });
            }
        }
        
        if (numTP > 0 && numSL > 0 && plan.minRiskToReward > 0) {
            const risk = Math.abs(numEntry - numSL);
            const reward = Math.abs(numTP - numEntry);
            if(risk > 0 && (reward / risk) < plan.minRiskToReward) {
                violations.push({ title: 'Low R:R', icon: AlertTriangle, description: `R:R is below plan minimum of ${plan.minRiskToReward}:1.`});
            }
        }

        return violations;
    }, [formData, activeJournal, appSettings, isEditing]);
  
      const handleSubmit = () => {
          if (planViolations.length > 0 && !isEditing) {
              setAlertState({
                  isOpen: true,
                  title: "Trading Plan Violations Detected",
                  icon: AlertTriangle,
                  description: (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                          {planViolations.map((v, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <v.icon className={cn("h-4 w-4 mt-0.5", v.title.includes('Limit') || v.title.includes('Risk') ? 'text-destructive' : 'text-primary')} />
                                  <span>{v.description}</span>
                              </div>
                          ))}
                      </div>
                  ),
                  onConfirm: performFinalSubmit,
              });
          } else {
              performFinalSubmit();
          }
      };
  
  
      const handleNoteContentChange = (stage: 'Before' | 'During' | 'After', content: string) => {
        const stageId = stage.toLowerCase();
        const newNotes = [...(formData.note || defaultNotePrompts)];
        let noteIndex = newNotes.findIndex(n => n.id === stageId);
    
        if (noteIndex === -1) {
            noteIndex = newNotes.findIndex(n => n.title.toLowerCase() === `${stage.toLowerCase()} trade note`);
        }
    
        if (noteIndex > -1) {
            newNotes[noteIndex] = { ...newNotes[noteIndex], content };
        } else {
            newNotes.push({ id: stageId, title: `${stage} Trade Note`, content, isDefault: true });
        }
        handleChange('note', newNotes);
    };
      
    const getNoteContent = (stage: 'before' | 'during' | 'after'): string => {
        if (!formData.note || !Array.isArray(formData.note)) return "";
        const note = formData.note.find(n => n.id === stage);
        return note?.content || "";
    };
  
      const handleCustomStatChange = (controlId: string, value: any) => {
        handleChange('customStats', {
            ...(formData.customStats || {}),
            [controlId]: value
        });
      };
      
      const handleNewsChange = (index: number, field: keyof NewsEventSelection | 'details', value: any, detailField?: keyof NewsEventSelection['details']) => {
          const newNewsEvents = JSON.parse(JSON.stringify(formData.newsEvents || []));
          if(field === 'details' && detailField) {
              newNewsEvents[index].details[detailField] = value;
          } else {
              // @ts-ignore
              newNewsEvents[index][field] = value;
               if(field === 'name') {
                  const currency = newNewsEvents[index].currency as Currency;
                  const dbEvent = (newsDatabase[currency] || []).find((e: any) => e.name === value);
                  newNewsEvents[index].impact = dbEvent?.impact;
              } else if (field === 'currency') {
                  newNewsEvents[index].name = '';
                  newNewsEvents[index].impact = undefined;
              }
          }
          handleChange('newsEvents', newNewsEvents);
      };
      
      const handleAddNewSentiment = (name: string) => {
        if (!name.trim() || !appSettings) return;
        const normalizedName = name.trim();
        const existingSentiments = (appSettings.inputOptions?.sentiments || []);
        if (!existingSentiments.some(s => s.toLowerCase() === normalizedName.toLowerCase())) {
            setNewSentimentDialog({ isOpen: true, name: normalizedName, stage: reviewStage });
        } else {
             handleSentimentToggle(reviewStage, normalizedName);
        }
    };
      
      const handleAddNews = () => {
          const newEvent: NewsEventSelection = { id: crypto.randomUUID(), time: '', currency: 'USD', name: '', details: {} };
          handleChange('newsEvents', [...(formData.newsEvents || []), newEvent]);
      };
      const handleDeleteNews = (index: number) => {
          handleChange('newsEvents', (formData.newsEvents || []).filter((_, i) => i !== index));
      };
      
      const saveNewSentiment = (name: string, impact: ScoreImpact) => {
          if (!appSettings) return;
          const newKeyword: KeywordScoreEffect = { keyword: name, impact: impact, type: 'Sentiment' };
          
          const currentKeywordScores = appSettings.keywordScores || [];
          const currentSentiments = appSettings.inputOptions?.sentiments || [];
          updateAppSettings({ 
              keywordScores: [...currentKeywordScores, newKeyword],
              inputOptions: {
                  ...(appSettings.inputOptions || {}),
                  sentiments: [...currentSentiments, name]
              }
          });
  
          handleSentimentToggle(newSentimentDialog.stage, name);
      };
      
    const handleSentimentToggle = (stage: 'Before' | 'During' | 'After', sentiment: string) => {
        const currentSentimentState = formData.sentiment || { Before: [], During: [], After: [] };
        const stageSentiments = currentSentimentState[stage as keyof typeof currentSentimentState] || [];
        const newStageSentiments = stageSentiments.includes(sentiment)
            ? stageSentiments.filter(s => s !== sentiment)
            : [...stageSentiments, sentiment];
        
        handleChange('sentiment', {
            ...currentSentimentState,
            [stage]: newStageSentiments,
        })
    };
  
      const allSelectedEmotions = useMemo(() => {
        const { Before = [], During = [], After = [] } = formData.sentiment || {};
        return { Before, During, After };
      }, [formData.sentiment]);
      
      const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (file) {
              try {
                  const compressedSrc = await compressImage(file, 0.6);
                  const newImages = { ...(formData.imagesByTimeframe || {}) };
                  if (!newImages[analysisTimeframe]) {
                      newImages[analysisTimeframe] = [];
                  }
                  newImages[analysisTimeframe].push(compressedSrc);
                  handleChange('imagesByTimeframe', newImages);
                  toast({ title: 'Image Added', description: `Image added to ${analysisTimeframe} timeframe.` });
              } catch (error) {
                  toast({ title: 'Image Processing Error', description: 'Could not process the image.', variant: 'destructive' });
              }
          }
          if (event.target) {
              event.target.value = ''; // Reset file input
          }
      };
      
      const handleAddImageUrl = () => {
          if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
              const newImages = { ...(formData.imagesByTimeframe || {}) };
              if (!newImages[analysisTimeframe]) {
                  newImages[analysisTimeframe] = [];
              }
              newImages[analysisTimeframe].push(imageUrl);
              handleChange('imagesByTimeframe', newImages);
              setImageUrl('');
          } else {
              toast({ title: 'Invalid URL', description: 'Please enter a valid image URL.', variant: 'destructive' });
          }
      };
    
      const handleAddNewPair = (name: string) => {
          handleChange('pair', name.toUpperCase());
          setNewPairDialog({ isOpen: true, name: name.toUpperCase() });
      };
  
      const saveNewPair = (name: string, config: { pipSize: string; pipValue: string; spread: string }) => {
          if (!appSettings) return;
          const newPairsConfig = {
              ...appSettings.pairsConfig,
              [name]: {
                  pipSize: parseFloat(config.pipSize),
                  pipValue: parseFloat(config.pipValue),
                  spread: parseFloat(config.spread || '0'),
                  iconName: 'Component',
              },
          };
          updateAppSettings({ pairsConfig: newPairsConfig });
          toast({ title: 'Pair Saved', description: `${name} has been saved.` });
      };
      
      
      const handleConfirmLayers = (layers: LayerData[], partials: PartialCloseData[]) => {
          const isLayered = layers.length > 0;
          let newFormData = { ...formData, layers, partials, isLayered, hasPartial: partials.length > 0 };
  
          if (isLayered) {
              const totalLots = layers.reduce((sum, l) => sum + (parseFloat(l.lotSize) || 0), 0);
              if (totalLots > 0) {
                  const weightedAvg = (field: keyof Omit<LayerData, 'id' | 'lotSize'>) => 
                      layers.reduce((sum, l) => sum + ((parseFloat(l[field]) || 0) * (parseFloat(l.lotSize) || 0)), 0) / totalLots;
  
                  newFormData = {
                      ...newFormData,
                      lotSize: String(totalLots.toFixed(2)),
                      entryPrice: String(weightedAvg('entryPrice')),
                      closingPrice: String(weightedAvg('closingPrice')),
                      stopLoss: String(weightedAvg('stopLoss')),
                      takeProfit: String(weightedAvg('takeProfit')),
                  };
              }
          }
          handleFormChange('layers', layers);
          handleFormChange('partials', partials);
          handleFormChange('isLayered', isLayered);
          handleFormChange('hasPartial', partials.length > 0);
          if (isLayered) {
            handleFormChange('lotSize', newFormData.lotSize);
            handleFormChange('entryPrice', newFormData.entryPrice);
            handleFormChange('closingPrice', newFormData.closingPrice);
            handleFormChange('stopLoss', newFormData.stopLoss);
            handleFormChange('takeProfit', newFormData.takeProfit);
          }
          setIsLayersDialogOpen(false);
      };

    const handleNewDraft = () => {
        const newDraftId = addTradeDraft(null);
        setActiveTradeDraftId(newDraftId);
    }
  
    const handleRenameDraft = (id: string, currentName: string) => {
        const newName = prompt("Enter new draft name:", currentName);
        if (newName && newName.trim()) {
            renameTradeDraft(id, newName);
        }
    }
  
      if (!appSettings || !activeJournal) return null;
  
    return (
        <div className="h-full flex flex-col p-2">
            <div className="flex justify-between items-center mb-2 px-2">
                <h1 className="text-xl font-bold">{isEditing ? 'Edit Trade' : 'Add New Trade'}</h1>
            </div>
             <Card className="glassmorphic p-1 mb-2">
                  <div className="grid grid-cols-10 gap-x-1">
                        <MetricItem label="P/L" value={<FormattedNumber value={metrics.pl} showPercentage />} valueClassName={metrics.pl >= 0 ? 'text-green-500' : 'text-red-500'} />
                        <MetricItem label="R:R" value={metrics.rr} valueClassName={metrics.rr !== 'N/A' && parseFloat(metrics.rr) >= 2 ? 'text-green-500' : metrics.rr !== 'N/A' && parseFloat(metrics.rr) >= 1 ? 'text-yellow-500' : 'text-red-500'} />
                        <MetricItem label="Score" value={metrics.score.value.toFixed(0)} valueClassName={metrics.score.color} />
                        <MetricItem label="Outcome" value={metrics.outcome} valueClassName={cn(metrics.outcome === 'Win' ? 'text-green-500' : metrics.outcome === 'Loss' ? 'text-red-500' : 'text-muted-foreground')}/>
                        <MetricItem label="Result" value={metrics.result} valueClassName={getResultBadgeVariant(metrics.result)}/>
                        <MetricItem label="Status" value={metrics.status} valueClassName={cn(metrics.status === 'Open' ? 'text-yellow-500' : 'text-muted-foreground')} />
                        <MetricItem label="Risk" value={`${metrics.riskPercent}%`} valueClassName="text-red-500" />
                        <MetricItem label="Session" value={metrics.session} />
                        <MetricItem label="Holding Time" value={metrics.holdingTime} />
                        <MetricItem label="Setup" value={metrics.matchedSetups.join(', ') || 'N/A'}/>
                  </div>
              </Card>
  
          <div className="flex-1 min-h-0 flex flex-col">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
                <TabsList className="grid w-full grid-cols-6 h-auto">
                  <TabsTrigger value="setup" className="h-6 text-xs px-1">Setup</TabsTrigger>
                  <TabsTrigger value="observations" className="h-6 text-xs px-1">Observations</TabsTrigger>
                  <TabsTrigger value="review" className="h-6 text-xs px-1">Review</TabsTrigger>
                  <TabsTrigger value="custom" className="h-6 text-xs px-1">Custom</TabsTrigger>
                  <TabsTrigger value="media" className="h-6 text-xs px-1">Media</TabsTrigger>
                  <TabsTrigger value="advanced" className="h-6 text-xs px-1">Advanced</TabsTrigger>
                </TabsList>
                
                <div className="flex-1 min-h-0 mt-2">
                  <TabsContent value="setup" className="m-0 h-full">
                      <ScrollArea className="h-full pr-2">
                          <div className="space-y-2">
                              <Card className="glassmorphic">
                              <CardHeader className="p-2"><CardTitle className="text-sm">Timestamps</CardTitle></CardHeader>
                              <CardContent className="p-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                                  <div className="space-y-1"><Label className="text-xs">Open Date</Label>
                                      <Popover>
                                          <PopoverTrigger asChild>
                                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-7 text-xs", !formData.openDate && "text-muted-foreground")}>
                                                  <CalendarIcon className="mr-2 h-3 w-3 text-muted-foreground" />
                                                  {formData.openDate ? format(new Date(formData.openDate + 'T00:00:00'), 'dd/MM/yyyy') : <span>Pick a date</span>}
                                              </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(formData.openDate + 'T00:00:00')} onSelect={(date) => handleChange('openDate', date ? format(date, 'yyyy-MM-dd') : '')} initialFocus /></PopoverContent>
                                      </Popover>
                                  </div>
                                  <div className="space-y-1"><Label className="text-xs">Open Time</Label><TimePicker value={formData.openTime} onChange={(v) => handleChange('openTime', v)} /></div>
                                  <div className="space-y-1"><Label className="text-xs">Close Date</Label>
                                      <Popover>
                                          <PopoverTrigger asChild>
                                              <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-7 text-xs", !formData.closeDate && "text-muted-foreground")}>
                                                  <CalendarIcon className="mr-2 h-3 w-3 text-muted-foreground" />
                                                  {formData.closeDate ? format(new Date(formData.closeDate + 'T00:00:00'), 'dd/MM/yyyy') : <span>Pick a date</span>}
                                              </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.closeDate ? new Date(formData.closeDate + 'T00:00:00') : undefined} onSelect={(date) => handleChange('closeDate', date ? format(date, 'yyyy-MM-dd') : '')} /></PopoverContent>
                                      </Popover>
                                  </div>
                                  <div className="space-y-1"><Label className="text-xs">Close Time</Label><TimePicker value={formData.closeTime} onChange={(v) => handleChange('closeTime', v)} /></div>
                              </CardContent>
                          </Card>
                          <Card className="glassmorphic">
                              <CardHeader className="p-2"><CardTitle className="text-sm">Core Details</CardTitle></CardHeader>
                              <CardContent className="p-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                                  <div className="space-y-1"><Label className="text-xs">Pair</Label><Combobox options={Object.keys(appSettings.pairsConfig).map(p => ({ value: p, label: p }))} value={formData.pair || ''} onChange={(v) => handleChange('pair', v)} placeholder="Select..." onAddNew={handleAddNewPair} className="h-7 text-xs"/></div>
                                  <div className="space-y-1"><Label className="text-xs">Lot Size</Label><Input type="text" value={formData.lotSize} onChange={(e) => handleChange('lotSize', e.target.value)} className="h-7 text-xs" disabled={formData.isLayered} /></div>
                                  <div className="space-y-1"><Label className="text-xs">Direction</Label>
                                      <div className="flex gap-1">
                                          <Button variant={formData.direction === 'Buy' ? 'default' : 'outline'} className={cn("flex-1 text-xs h-7", formData.direction === 'Buy' && "bg-green-500 hover:bg-green-600 text-white")} onClick={() => handleChange('direction', 'Buy')}>Buy</Button>
                                          <Button variant={formData.direction === 'Sell' ? 'default' : 'outline'} className={cn("flex-1 text-xs h-7", formData.direction === 'Sell' && "bg-red-500 hover:bg-red-600 text-white")} onClick={() => handleChange('direction', 'Sell')}>Sell</Button>
                                      </div>
                                  </div>
                                  <div className="space-y-1"><Label className="text-xs">Strategy</Label>
                                      <Combobox
                                          options={activeJournal?.strategies?.map(s => ({ value: s.name, label: s.name })) || []}
                                          value={formData.strategy || ''}
                                          onChange={(v) => handleChange('strategy', v)}
                                          placeholder="Select a strategy..."
                                          className="h-7 text-xs"
                                      />
                                  </div>
                              </CardContent>
                          </Card>
                          <Card className="glassmorphic">
                              <CardHeader className="p-2"><CardTitle className="text-sm">Pricing</CardTitle></CardHeader>
                              <CardContent className="p-2 space-y-2">
                                  <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-2")}>
                                      <div><Label className="text-xs">Entry Price</Label><Input type="text" value={formData.entryPrice} onChange={(e) => handleChange('entryPrice', e.target.value)} className="h-7 text-xs" disabled={formData.isLayered} /></div>
                                      <div><Label className="text-xs">Close Price</Label><Input type="text" value={formData.closingPrice} onChange={(e) => handleChange('closingPrice', e.target.value)} className="h-7 text-xs" disabled={formData.isLayered} /></div>
                                      <div><Label className="text-xs">Stop Loss</Label><Input type="text" value={formData.stopLoss} onChange={(e) => handleChange('stopLoss', e.target.value)} className="h-7 text-xs" disabled={formData.isLayered} /></div>
                                      <div><Label className="text-xs">Take Profit</Label><Input type="text" value={formData.takeProfit} onChange={(e) => handleChange('takeProfit', e.target.value)} className="h-7 text-xs" disabled={formData.isLayered} /></div>
                                  </div>
                                  <div className="flex justify-end gap-2 pt-2 border-t">
                                      <Button size="xs" variant="outline" onClick={() => setShowExtraDetails(p => !p)}>Extra Details</Button>
                                      <Button size="xs" variant="outline" onClick={() => setIsLayersDialogOpen(true)}><Layers className="mr-2 h-3 w-3"/>Layers/Partials</Button>
                                  </div>
                                  {showExtraDetails && (
                                      <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                                          <div className="space-y-1"><Label className="text-xs">Commission ($)</Label><Input type="text" value={formData.commission} onChange={(e) => handleChange('commission', e.target.value)} className="h-7 text-xs"/></div>
                                          <div className="space-y-1"><Label className="text-xs">Extra Spread (pips)</Label><Input type="text" value={formData.extraSpread} onChange={(e) => handleChange('extraSpread', e.target.value)} className="h-7 text-xs"/></div>
                                      </div>
                                  )}
                              </CardContent>
                          </Card>
                          </div>
                      </ScrollArea>
                  </TabsContent>
                  <TabsContent value="observations" className="m-0 h-full">
                      <div className="grid grid-cols-[120px_1fr_220px] gap-2 h-full">
                          <div className="flex flex-col h-full min-h-0">
                             <Card className="glassmorphic h-full flex flex-col p-1">
                                  <CardHeader className="p-2"><CardTitle className="text-xs text-center uppercase">Timeframe</CardTitle></CardHeader>
                                  <CardContent className="p-0.5 flex-1 min-h-0">
                                      <ScrollArea className="h-full">
                                      <div className="flex flex-col gap-1 pr-1">
                                          {sortedTimeframes.map(tf => (
                                          <Button key={tf} variant={analysisTimeframe === tf ? 'secondary' : 'ghost'} size="sm" onClick={() => setAnalysisTimeframe(tf)} className="justify-start text-xs h-7">
                                              {tf}
                                          </Button>
                                          ))}
                                      </div>
                                      </ScrollArea>
                                  </CardContent>
                              </Card>
                          </div>
                          <div className="flex-1 flex flex-col min-h-0 h-full">
                              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full flex flex-col flex-1 min-h-0">
                                  <TabsList className="grid grid-cols-7 h-auto">
                                      {combinedAnalysisConfigs.map((category: AnalysisCategory) => {
                                          const Icon = (icons as any)[category.icon] || HelpCircle;
                                          return (
                                              <TabsTrigger key={category.id} value={category.id} className="text-xs px-1 h-10 flex-col gap-1">
                                                  <Icon className="h-4 w-4"/>
                                                  <span>{category.title}</span>
                                              </TabsTrigger>
                                          )
                                      })}
                                  </TabsList>
                                  <div className="flex-1 min-h-0 mt-2">
                                      <ScrollArea className="h-full pr-2">
                                          {combinedAnalysisConfigs.map(category => (
                                              <TabsContent key={category.id} value={category.id} className="m-0 h-full">
                                                      <div className="space-y-2">
                                                          {(category.subCategories || []).map(subCat => (
                                                              <Card key={subCat.id} className="glassmorphic">
                                                                  <CardHeader className="p-2"><CardTitle className="text-sm">{subCat.title}</CardTitle></CardHeader>
                                                                  <CardContent className="p-2">
                                                                      <div className="flex flex-wrap gap-1 justify-start">
                                                                          {(subCat.options || []).map(option => {
                                                                              const isSelected = isOptionSelected(subCat.id, option.id);
                                                                              return (
                                                                                  <div key={option.id} className={cn("p-1.5 rounded-md border transition-all", isSelected ? 'bg-primary/20 border-primary' : 'bg-muted/50')}>
                                                                                      <div className="flex items-center space-x-2">
                                                                                          <Checkbox id={`${analysisTimeframe}-${subCat.id}-${option.id}`} checked={isSelected} onCheckedChange={() => handleAnalysisSelection(subCat.id, option.id, category.isSingleChoice)}/>
                                                                                          <Label htmlFor={`${analysisTimeframe}-${subCat.id}-${option.id}`} className="text-sm font-normal">{option.value}</Label>
                                                                                      </div>
                                                                                      {isSelected && subCat.modifiers && (
                                                                                          <div className="pt-2 mt-2 border-t space-y-2">
                                                                                              {subCat.modifiers.map(mod => {
                                                                                                  if (mod.type === 'text') {
                                                                                                      return (
                                                                                                          <div key={mod.key} className="space-y-1">
                                                                                                              <Label className="text-xs text-muted-foreground">{mod.label}</Label>
                                                                                                              <Input
                                                                                                                  type="text"
                                                                                                                  placeholder={mod.label}
                                                                                                                  value={getSelectedModifier(subCat.id, option.id, mod.key) || ''}
                                                                                                                  onChange={e => handleModifierSelection(subCat.id, option.id, mod.key, e.target.value)}
                                                                                                                  className="h-7 text-xs"
                                                                                                              />
                                                                                                          </div>
                                                                                                      )
                                                                                                  }
                                                                                                  return (
                                                                                                      <div key={mod.key} className="space-y-1">
                                                                                                          <Label className="text-xs text-muted-foreground">{mod.label}</Label>
                                                                                                          <ToggleGroup type="single" variant="outline" size="xs" 
                                                                                                              value={getSelectedModifier(subCat.id, option.id, mod.key) || ''}
                                                                                                              onValueChange={v => handleModifierSelection(subCat.id, option.id, mod.key, v)}
                                                                                                          >
                                                                                                              {mod.options.map(modOpt => (
                                                                                                                  <ToggleGroupItem key={modOpt.value} value={modOpt.value}>{modOpt.label}</ToggleGroupItem>
                                                                                                              ))}
                                                                                                          </ToggleGroup>
                                                                                                      </div>
                                                                                                  )
                                                                                              })}
                                                                                          </div>
                                                                                      )}
                                                                                  </div>
                                                                              )
                                                                          })}
                                                                          <Button size="xs" variant="ghost" className="justify-start text-primary h-auto p-1.5" onClick={() => handleOpenNewOptionDialog(subCat)}>
                                                                              <PlusCircle className="h-3 w-3 mr-1" /> Add
                                                                          </Button>
                                                                      </div>
                                                                  </CardContent>
                                                              </Card>
                                                          ))}
                                                      </div>
                                              </TabsContent>
                                          ))}
                                      </ScrollArea>
                                  </div>
                              </Tabs>
                          </div>
                          <div className="w-[220px] flex-shrink-0 h-full min-h-0">
                              <SelectionSummary analysisConfigs={combinedAnalysisConfigs} selections={formData.analysisSelections} imagesByTimeframe={formData.imagesByTimeframe} />
                          </div>
                      </div>
                  </TabsContent>
                   <TabsContent value="review" className="m-0 h-full">
                       <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4 h-full">
                          <div className="flex flex-col h-full space-y-2">
                             <ToggleGroup type="single" size="sm" value={reviewStage} onValueChange={(v) => v && setReviewStage(v as any)} className="w-full grid grid-cols-4">
                                <ToggleGroupItem value="Before" className="h-8">Before</ToggleGroupItem>
                                <ToggleGroupItem value="During" className="h-8">During</ToggleGroupItem>
                                <ToggleGroupItem value="After" className="h-8">After</ToggleGroupItem>
                                <ToggleGroupItem value="Lessons" className="h-8">Lessons</ToggleGroupItem>
                            </ToggleGroup>
                            <div className="flex-1 flex flex-col p-2 border rounded-md glassmorphic">
                                <Label className="mb-2">Notes for "{reviewStage}" Stage</Label>
                                <div className="flex-1">
                                    <RichTextEditor
                                        value={reviewStage === 'Lessons' ? formData.lessonsLearned : getNoteContent(reviewStage.toLowerCase() as any)}
                                        onChange={(c) => {
                                            if (reviewStage === 'Lessons') {
                                                handleChange('lessonsLearned', c);
                                            } else {
                                                handleNoteContentChange(reviewStage, c);
                                            }
                                        }}
                                        isEditable
                                    />
                                </div>
                            </div>
                        </div>

                          <div className="h-full flex flex-col space-y-4">
                            <Card className="glassmorphic">
                                <CardHeader className="p-2"><CardTitle className="text-sm text-center">Emotions ({reviewStage})</CardTitle></CardHeader>
                                <CardContent className="p-2">
                                    <MultiSelect
                                        options={sentimentOptions}
                                        selectedValues={formData.sentiment?.[reviewStage === 'Lessons' ? 'After' : reviewStage] || []}
                                        onValueChange={(values) => {
                                            if (reviewStage !== 'Lessons') {
                                                handleChange('sentiment', {
                                                    ...(formData.sentiment || { Before: [], During: [], After: [] }),
                                                    [reviewStage]: values
                                                });
                                            }
                                        }}
                                        placeholder="Select emotions..."
                                        onAddNew={handleAddNewSentiment}
                                        disabled={reviewStage === 'Lessons'}
                                    />
                                </CardContent>
                            </Card>
                             <Card className="glassmorphic flex-1">
                                <CardHeader className="p-2"><CardTitle className="text-sm text-center">All Selected Emotions</CardTitle></CardHeader>
                                <CardContent className="p-2">
                                    {Object.entries(allSelectedEmotions).map(([stage, emotions]) => (
                                        (emotions && emotions.length > 0) && (
                                            <div key={stage} className="mb-2">
                                                <h4 className="text-xs font-semibold text-muted-foreground">{stage}</h4>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {emotions.map((emo: string) => <Badge key={emo} variant="secondary">{emo}</Badge>)}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </CardContent>
                            </Card>
                          </div>
                      </div>
                   </TabsContent>
                   <TabsContent value="custom" className="m-0 h-full">
                      <ScrollArea className="h-full pr-2">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {customFields.map(field => {
                                  const value = formData.customStats?.[field.id] || (field.allowMultiple ? [] : '');
                                  switch(field.type) {
                                      case 'List':
                                          return (
                                               <div key={field.id} className="space-y-1">
                                                  <Label>{field.title}</Label>
                                                  {field.allowMultiple ? (
                                                      <MultiSelect options={(field.options || []).map(opt => ({ value: opt.value, label: opt.value }))} selectedValues={value} onValueChange={v => handleCustomStatChange(field.id, v)} />
                                                  ) : (
                                                      <Combobox options={(field.options || []).map(opt => ({ value: opt.value, label: opt.value }))} value={value} onChange={v => handleCustomStatChange(field.id, v)} />
                                                  )}
                                              </div>
                                          );
                                      case 'Button':
                                           return (
                                                <div key={field.id} className="space-y-1">
                                                  <Label>{field.title}</Label>
                                                  <ToggleGroup
                                                    type={field.allowMultiple ? "multiple" : "single"}
                                                    value={value}
                                                    onValueChange={v => handleCustomStatChange(field.id, v)}
                                                    variant="outline"
                                                    className="flex-wrap justify-start"
                                                  >
                                                      {(field.options || []).map(opt => (
                                                          <ToggleGroupItem key={opt.value} value={opt.value} className="text-xs h-7">{opt.value}</ToggleGroupItem>
                                                      ))}
                                                  </ToggleGroup>
                                              </div>
                                           );
                                      case 'Plain Text':
                                           return <div key={field.id} className="space-y-1"><Label>{field.title}</Label><Input value={value} onChange={e => handleCustomStatChange(field.id, e.target.value)} /></div>
                                      case 'Numeric':
                                          return <div key={field.id} className="space-y-1"><Label>{field.title}</Label><Input type="number" value={value} onChange={e => handleCustomStatChange(field.id, e.target.value)} /></div>
                                      case 'Date':
                                          return (
                                               <div key={field.id} className="space-y-1">
                                                   <Label>{field.title}</Label>
                                                   <Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal h-7 text-xs"><CalendarIcon className="mr-2 h-3 w-3"/>{value ? format(new Date(value), 'PPP') : 'Pick a date'}</Button></PopoverTrigger><PopoverContent><Calendar mode="single" selected={value ? new Date(value) : undefined} onSelect={d => handleCustomStatChange(field.id, d?.toISOString().split('T')[0] || '')} /></PopoverContent></Popover>
                                               </div>
                                          )
                                      case 'Time':
                                           return <div key={field.id} className="space-y-1"><Label>{field.title}</Label><TimePicker value={value} onChange={v => handleCustomStatChange(field.id, v)} /></div>
                                      default: return null;
                                  }
                              })}
                          </div>
                      </ScrollArea>
                   </TabsContent>
                    <TabsContent value="media" className="m-0 h-full">
                        <div className="grid grid-cols-[1fr_300px] gap-4 h-full">
                           <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => imageUploadRef.current?.click()}><UploadCloud className="mr-2 h-4 w-4"/>Upload</Button>
                                  <Input type="file" ref={imageUploadRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                  <Input placeholder="Or paste image URL..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="h-8"/>
                                  <Button size="sm" onClick={handleAddImageUrl}><LinkIcon className="mr-2 h-4 w-4"/>Add URL</Button>
                              </div>
                              <ScrollArea className="h-[calc(100%-40px)]">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                 {Object.entries(formData.imagesByTimeframe || {}).flatMap(([tf, images]) => images.map((src, i) => (
                                     <div key={`${tf}-${i}`} className="relative group aspect-video rounded-md overflow-hidden">
                                         <Image src={src} alt={`Trade screenshot for ${tf}`} fill className="object-cover" />
                                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                             <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => {
                                                 const newImages = { ...formData.imagesByTimeframe };
                                                 newImages[tf] = newImages[tf].filter((_, imgIndex) => imgIndex !== i);
                                                 if (newImages[tf].length === 0) delete newImages[tf];
                                                 handleChange('imagesByTimeframe', newImages);
                                             }}>
                                                 <Trash2 className="h-4 w-4" />
                                             </Button>
                                         </div>
                                         <Badge className="absolute bottom-1 right-1 text-[9px]">{tf}</Badge>
                                     </div>
                                 )))}
                              </div>
                              </ScrollArea>
                            </div>
                             <div className="flex flex-col h-full min-h-0">
                                 <Card className="glassmorphic h-full flex flex-col p-1">
                                      <CardHeader className="p-2"><CardTitle className="text-xs text-center uppercase">Timeframe for Image</CardTitle></CardHeader>
                                      <CardContent className="p-0.5 flex-1 min-h-0">
                                          <ScrollArea className="h-full">
                                          <div className="flex flex-col gap-1 pr-1">
                                              {sortedTimeframes.map(tf => (
                                              <Button key={tf} variant={analysisTimeframe === tf ? 'secondary' : 'ghost'} size="sm" onClick={() => setAnalysisTimeframe(tf)} className="justify-start text-xs h-7">
                                                  {tf}
                                              </Button>
                                              ))}
                                          </div>
                                          </ScrollArea>
                                      </CardContent>
                                  </Card>
                              </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="advanced" className="m-0 h-full">
                      <div className="grid grid-cols-2 gap-4 h-full">
                         <div className="space-y-4">
                              <Card className="glassmorphic">
                                  <CardHeader className="p-2"><CardTitle className="text-sm">Excursion</CardTitle></CardHeader>
                                  <CardContent className="p-2 space-y-2">
                                      <div className="space-y-1"><Label className="text-xs">Max Adverse Excursion (MAE) Price</Label><Input type="text" value={formData.mae} onChange={(e) => handleChange('mae', e.target.value)} className="h-7 text-xs"/></div>
                                      <div className="space-y-1"><Label className="text-xs">Max Favorable Excursion (MFE) Price</Label><Input type="text" value={formData.mfe} onChange={(e) => handleChange('mfe', e.target.value)} className="h-7 text-xs"/></div>
                                      <div className="pt-2 space-y-2">
                                          <Label className="text-xs">Was original TP hit after you closed?</Label>
                                          <div className="flex gap-2">
                                              <Button variant={formData.wasTpHit === true ? 'default' : 'outline'} size="sm" onClick={() => handleChange('wasTpHit', true)}>Yes</Button>
                                              <Button variant={formData.wasTpHit === false ? 'destructive' : 'outline'} size="sm" onClick={() => handleChange('wasTpHit', false)}>No</Button>
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          </div>
                          <div className="space-y-2">
                              <h3 className="text-sm font-semibold">News Events</h3>
                              <ScrollArea className="h-[calc(100%-3rem)] pr-2">
                                  <div className="space-y-2">
                                    {(formData.newsEvents || []).map((event, index) => (
                                        <Card key={event.id} className="p-2 bg-muted/50">
                                            <div className="flex justify-between items-center mb-1">
                                                  <div className="flex items-center gap-1 w-full">
                                                      <Combobox options={['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF', 'CNY', 'Other'].map(c => ({label: c, value: c}))} value={event.currency} onChange={v => handleNewsChange(index, 'currency', v)} className="h-6 text-[10px]"/>
                                                      <Combobox options={(newsDatabase[event.currency as keyof typeof newsDatabase] || []).map(e => ({label: e.name, value: e.name}))} value={event.name} onChange={v => handleNewsChange(index, 'name', v)} className="h-6 text-[10px] w-full"/>
                                                  </div>
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDeleteNews(index)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                                            </div>
                                             <div className="grid grid-cols-3 gap-1">
                                                <Input className="h-6 text-[10px]" placeholder="Actual" value={event.details.actual || ''} onChange={e => handleNewsChange(index, 'details', e.target.value, 'actual')}/>
                                                <Input className="h-6 text-[10px]" placeholder="Forecast" value={event.details.forecast || ''} onChange={e => handleNewsChange(index, 'details', e.target.value, 'forecast')}/>
                                                <Input className="h-6 text-[10px]" placeholder="Previous" value={event.details.previous || ''} onChange={e => handleNewsChange(index, 'details', e.target.value, 'previous')}/>
                                            </div>
                                        </Card>
                                    ))}
                                  </div>
                              </ScrollArea>
                              <Button variant="outline" size="xs" onClick={handleAddNews}><PlusCircle className="mr-2 h-3 w-3"/>Add News</Button>
                           </div>
                      </div>
                    </TabsContent>
                </div>
              </Tabs>
          </div>
  
            <div className="p-2 mt-2 border-t flex items-center justify-between w-full">
              <div className="flex-1 flex gap-2 items-center overflow-x-auto">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" disabled={(tradeDrafts || []).length === 0}><Trash2 className="h-4 w-4"/></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Clear all drafts?</AlertDialogTitle>
                                    <AlertDialogDescriptionComponent>
                                        This will permanently delete all open trade drafts. This action cannot be undone.
                                    </AlertDialogDescriptionComponent>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                        (tradeDrafts || []).forEach(d => removeTradeDraft(d.id));
                                    }}>Delete All</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TooltipTrigger>
                        <TooltipContent><p>Clear All Drafts</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {(tradeDrafts || []).map(draft => {
                        const isActive = draft.id === activeTradeDraftId;
                        return (
                             <div key={draft.id} className="relative group">
                                <Button
                                    variant={isActive ? 'default' : 'secondary'}
                                    size="sm"
                                    className="h-8 pr-7"
                                    onClick={() => setActiveTradeDraftId(draft.id)}
                                >
                                    {draft.name}
                                </Button>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 absolute top-1/2 right-0.5 -translate-y-1/2 opacity-50 group-hover:opacity-100">
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleRenameDraft(draft.id, draft.name)}>
                                            <Edit className="mr-2 h-4 w-4" /> Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => removeTradeDraft(draft.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </div>
                        )
                    })}
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNewDraft}><FilePlus className="h-4 w-4"/></Button>
              </div>
              <div className="flex gap-2 items-center">
                   {planViolations.length > 0 && !isEditing && (
                      <div className='flex items-center gap-1.5'>
                          {planViolations.map((v, i) => (
                               <TooltipProvider key={i}><Tooltip><TooltipTrigger asChild>
                                    <v.icon className={cn("h-5 w-5", v.title.includes('Limit') || v.title.includes('Risk') ? 'text-destructive' : 'text-primary animate-pulse')} />
                               </TooltipTrigger><TooltipContent side="top" align="end" className="max-w-xs"><p>{v.description}</p></TooltipContent></Tooltip></TooltipProvider>
                          ))}
                      </div>
                  )}
                   <Button size="sm" onClick={handleSubmit} disabled={!isModified && !isEditing}><Save className="mr-2 h-4 w-4"/>{isEditing ? 'Save Changes' : 'Save Trade'}</Button>
              </div>
          </div>
  
          <AlertDialog open={alertState.isOpen} onOpenChange={(open) => !open && setAlertState({ ...alertState, isOpen: false })}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-6 w-6 text-destructive" />
                          {alertState.title}
                      </AlertDialogTitle>
                      <AlertDialogDescriptionComponent className="pt-2 text-left">
                          {alertState.description}
                      </AlertDialogDescriptionComponent>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setAlertState({ ...alertState, isOpen: false })}>Go Back & Adjust</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { setAlertState({ ...alertState, isOpen: false }); alertState.onConfirm?.(); }}>Proceed Anyway</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
  
          <AddNewAnalysisOptionDialog isOpen={isAddOptionOpen} onClose={() => setIsAddOptionOpen(false)} onSave={handleSaveNewOption} category={currentSubCategoryForNewOption?.title || ''} />
          <AddNewSentimentDialog isOpen={newSentimentDialog.isOpen} onClose={() => setNewSentimentDialog({ isOpen: false, name: '', stage: 'Before' })} onSave={saveNewSentiment} sentimentName={newSentimentDialog.name} />
          <AddNewPairDialog isOpen={newPairDialog.isOpen} onClose={() => setNewPairDialog({isOpen: false, name: ''})} onSave={saveNewPair} pairName={newPairDialog.name} />
          <LayersAndPartialsDialog
              isOpen={isLayersDialogOpen}
              onClose={() => setIsLayersDialogOpen(false)}
              mainTradeData={formData}
              initialLayers={formData.layers}
              initialPartials={formData.partials}
              onConfirm={handleConfirmLayers}
          />
        </div>
    );
  };
  
  export default AddTradePageContent;
    
    

    


    

    

    

    

    

    

    

    

    

    

    

    
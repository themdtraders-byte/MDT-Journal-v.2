

'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Save, X, Edit, RotateCw, ArrowLeft, ArrowRight, HelpCircle, PlusCircle, Trash2 } from 'lucide-react';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import MultiSelect from './ui/multi-select';
import type { AnalysisCategory, AnalysisSubCategory, AnalysisOption, Modifier, POIRule, ZoneRule, IndicatorRule } from '@/types';
import { icons } from 'lucide-react';
import { TimePicker } from './ui/time-picker';
import { useJournalStore } from '@/hooks/use-journal-store';
import { pairsConfig } from '@/lib/data';
import type { Strategy, RuleCombination, Setup, StrategyRule, StrategyRuleType } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import IconPicker from './icon-picker';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog"
import { Checkbox } from './ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Separator } from './ui/separator';
import AnalysisSettings from './analysis-settings';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';


interface AddNewOptionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (value: string) => void;
    categoryTitle: string;
}

const AddNewOptionDialog = ({ isOpen, onClose, onSave, categoryTitle }: AddNewOptionDialogProps) => {
    const [value, setValue] = useState('');
    
    useEffect(() => {
        if(isOpen) setValue('');
    }, [isOpen]);

    const handleSave = () => {
        if (value.trim()) {
            onSave(value.trim());
            onClose();
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic">
                <DialogHeader>
                    <DialogTitle>Add New Option to "{categoryTitle}"</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label>New Option Name</Label>
                    <Input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus />
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Add Option</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface StrategyEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialStrategy: Strategy | null;
  onSave: (strategy: Strategy | Omit<Strategy, 'id'>) => void;
}

const createNewStrategy = (): Omit<Strategy, 'id'> => ({
    name: '',
    description: '',
    rules: [],
    analysisConfigurations: [],
    setups: [],
    pairSelectionMode: 'any',
    allowedPairs: [],
    timeBasedRules: {
        enabled: false,
        session: 'Any',
        timeRange: { start: '00:00', end: '23:59' },
    },
});

const timeToMinutes = (time: string): number => {
    if(!time) return 0;
    const value = parseInt(time.replace(/[^0-9]/g, ''), 10);
    if (isNaN(value)) return Infinity; // Put invalid/custom ones at the end
    
    if (time.includes('M')) return value * 30 * 24 * 60; // Month
    if (time.includes('W')) return value * 7 * 24 * 60;  // Week
    if (time.includes('D')) return value * 24 * 60;      // Day
    if (time.includes('h')) return value * 60;         // Hour
    return value; // Default for minutes
};

const nySessionTimes = {
    'Sydney': { start: '16:00', end: '01:00' },
    'Asian': { start: '20:00', end: '05:00' },
    'London': { start: '03:00', end: '12:00' },
    'New York': { start: '08:00', end: '17:00' },
};


const StrategyAnalysisEditor = ({
    open,
    onOpenChange,
    globalConfigs,
    strategyConfigs,
    onSave,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    globalConfigs: AnalysisCategory[];
    strategyConfigs: AnalysisCategory[];
    onSave: (newConfigs: AnalysisCategory[]) => void;
}) => {
    const [localStrategyConfigs, setLocalStrategyConfigs] = useState(strategyConfigs);

    useEffect(() => {
        if (open) {
            setLocalStrategyConfigs(JSON.parse(JSON.stringify(strategyConfigs)));
        }
    }, [open, strategyConfigs]);

    const mergedConfigs = useMemo(() => {
        const globalCloned: AnalysisCategory[] = JSON.parse(JSON.stringify(globalConfigs));
        if (!localStrategyConfigs || localStrategyConfigs.length === 0) {
            return globalCloned;
        }
        
        const merged = globalCloned.map(cat => ({...cat}));

        localStrategyConfigs.forEach(stratCat => {
            let globalCat = merged.find(gc => gc.id === stratCat.id);
            if (!globalCat) {
                merged.push(JSON.parse(JSON.stringify(stratCat)));
            } else {
                stratCat.subCategories.forEach(stratSubCat => {
                    let globalSubCat = globalCat!.subCategories.find(gsc => gsc.id === stratSubCat.id);
                    if (!globalSubCat) {
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
        return merged;
    }, [globalConfigs, localStrategyConfigs]);


    const handleSave = () => {
        onSave(localStrategyConfigs);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glassmorphic sm:max-w-4xl h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Edit Strategy-Specific Analysis</DialogTitle>
                    <DialogDescription>
                        These categories and options will only appear when this specific strategy is selected.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 min-h-0 overflow-y-auto pr-4 -mr-6">
                    <AnalysisSettings 
                        isStrategySpecific={true}
                        initialConfigs={mergedConfigs}
                        onConfigsChange={setLocalStrategyConfigs}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const RuleSelectionSummary = ({
    rules,
    analysisConfigs,
    title = "Rule Summary",
}: {
    rules: RuleCombination[];
    analysisConfigs: AnalysisCategory[];
    title?: string;
}) => {
    
    const selectionsByTimeframe = useMemo(() => {
        return (rules || []).reduce((acc, rule) => {
            acc[rule.timeframe] = rule.selectedRules;
            return acc;
        }, {} as Record<string, Record<string, any[]>>);
    }, [rules]);

    const sortedTimeframes = Object.keys(selectionsByTimeframe).sort((a,b) => {
        if (a === 'Current Setup') return -1;
        if (b === 'Current Setup') return 1;
        return timeToMinutes(b) - timeToMinutes(a)
    });

    if (sortedTimeframes.length === 0) {
        return (
            <Card className="glassmorphic h-full flex flex-col">
                <CardHeader className="p-2"><CardTitle className="text-xs text-center uppercase">{title}</CardTitle></CardHeader>
                <CardContent className="p-2 flex-1 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center">No rules selected yet.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card className="glassmorphic h-full flex flex-col">
            <CardHeader className="p-2"><CardTitle className="text-xs text-center uppercase">{title}</CardTitle></CardHeader>
            <CardContent className="p-2 flex-1 min-h-0">
                <ScrollArea className="h-full">
                    <div className="space-y-3">
                        {sortedTimeframes.map(timeframe => {
                            const timeframeSelections = selectionsByTimeframe[timeframe];
                            if (!timeframeSelections || Object.keys(timeframeSelections).length === 0) return null;

                            return (
                                <Card key={timeframe} className="bg-muted/30">
                                    <CardHeader className="p-2"><CardTitle className="text-sm font-bold text-primary">{timeframe}</CardTitle></CardHeader>
                                    <CardContent className="p-2 pt-0">
                                        {analysisConfigs.flatMap(mainCategory => 
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
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default function StrategyEditorDialog({ isOpen, onClose, initialStrategy, onSave }: StrategyEditorDialogProps) {
    const [strategy, setStrategy] = useState<Omit<Strategy, 'id'> | Strategy>(initialStrategy || createNewStrategy());
    const [step, setStep] = useState(1);
    const { toast } = useToast();
    const { appSettings, updateAppSettings, journals, activeJournalId } = useJournalStore(state => ({
        appSettings: state.appSettings,
        activeJournalId: state.activeJournalId,
        journals: state.journals,
        updateAppSettings: state.updateAppSettings
    }));
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const timeframesFromStore = appSettings.inputOptions.timeframes;

    const [activeTimeframe, setActiveTimeframe] = useState(timeframesFromStore[0] || '1h');
    const [activeCategory, setActiveCategory] = useState(appSettings.analysisConfigurations[0].id);
    
    // State for Step 3: Setups
    const [newSetupName, setNewSetupName] = useState('');
    const [currentSetupRuleCombinations, setCurrentSetupRuleCombinations] = useState<RuleCombination[]>([]);
    const [editingSetup, setEditingSetup] = useState<Setup | null>(null);

    const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
    const [currentSubCategoryForNewOption, setCurrentSubCategoryForNewOption] = useState<AnalysisSubCategory | null>(null);
    const [isAnalysisEditorOpen, setIsAnalysisEditorOpen] = useState(false);
    
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('FileText');
    const [newCategoryIsSingleChoice, setNewCategoryIsSingleChoice] = useState(false);
    const [newCategorySubCategories, setNewCategorySubCategories] = useState<AnalysisSubCategory[]>([]);


    const sortedTimeframes = useMemo(() => {
        return [...timeframesFromStore].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    }, [timeframesFromStore]);
    
    const combinedAnalysisConfigs = useMemo(() => {
        const globalConfigs: AnalysisCategory[] = JSON.parse(JSON.stringify(appSettings.analysisConfigurations || []));
        const strategyConfigs = strategy.analysisConfigurations || [];
    
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
                    if (!globalSubCat) {
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
    }, [appSettings.analysisConfigurations, strategy.analysisConfigurations]);
    
    const allPossibleSessions = useMemo(() => {
        const mainSessions = Object.keys(nySessionTimes);
        
        const overlaps: string[] = [];
        for (let i = 0; i < mainSessions.length; i++) {
            for (let j = i + 1; j < mainSessions.length; j++) {
                overlaps.push(`${mainSessions[i]} / ${mainSessions[j]}`);
            }
        }
        
        return ['Any', ...mainSessions, ...overlaps];
    }, []);


    useEffect(() => {
        if (isOpen) {
            setStrategy(initialStrategy ? JSON.parse(JSON.stringify(initialStrategy)) : createNewStrategy());
            setStep(1);
            if (sortedTimeframes.length > 0) {
                setActiveTimeframe(sortedTimeframes[0]);
            }
            setNewCategoryTitle('');
            setNewCategoryIcon('FileText');
            setNewCategoryIsSingleChoice(false);
            setNewCategorySubCategories([]);
            setCurrentSetupRuleCombinations([]);
            setNewSetupName('');
            setEditingSetup(null);
        }
    }, [initialStrategy, isOpen, sortedTimeframes]);

    const handleStrategyChange = useCallback((key: keyof Strategy, value: any) => {
        setStrategy(prev => ({...prev, [key]: value}));
    }, []);

    const isEditingTime = useRef(false);

    useEffect(() => {
        const sessionName = strategy.timeBasedRules?.session;
        if (!sessionName || isEditingTime.current) return;
    
        const allTimings = { ...nySessionTimes };
    
        if (allTimings[sessionName as keyof typeof allTimings]) {
            const { start, end } = allTimings[sessionName as keyof typeof allTimings];
            if (start !== strategy.timeBasedRules?.timeRange.start || end !== strategy.timeBasedRules?.timeRange.end) {
                handleStrategyChange('timeBasedRules', { ...strategy.timeBasedRules, timeRange: { start, end } });
            }
        } else if (sessionName.includes(' / ')) {
            const [session1, session2] = sessionName.split(' / ').map(s => s.trim());
            const timing1 = allTimings[session1 as keyof typeof allTimings];
            const timing2 = allTimings[session2 as keyof typeof allTimings];

            if (timing1 && timing2) {
                const start1 = timeToMinutes(timing1.start);
                const end1 = timeToMinutes(timing1.end);
                const start2 = timeToMinutes(timing2.start);
                const end2 = timeToMinutes(timing2.end);
                
                const overlapStart = Math.max(start1, start2);
                const overlapEnd = Math.min(end1, end2);

                if (overlapStart < overlapEnd) {
                    const formatTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
                    handleStrategyChange('timeBasedRules', { ...strategy.timeBasedRules, timeRange: { start: formatTime(overlapStart), end: formatTime(overlapEnd) } });
                }
            }
        }
    }, [strategy.timeBasedRules?.session, handleStrategyChange]);
    
    useEffect(() => {
        if (!strategy.timeBasedRules?.enabled) return;
        
        isEditingTime.current = true;
        
        const { start, end } = strategy.timeBasedRules.timeRange;
        const allTimings = { ...nySessionTimes };

        let matchedSession = 'Any';
        for (const [name, timing] of Object.entries(allTimings)) {
            if (timing.start === start && timing.end === end) {
                matchedSession = name;
                break;
            }
        }

        if (matchedSession === 'Any') {
            const sessionNames = ['Asian', 'London', 'New York', 'Sydney'];
            for (let i = 0; i < sessionNames.length; i++) {
                for (let j = i + 1; j < sessionNames.length; j++) {
                     const timing1 = allTimings[sessionNames[i] as keyof typeof allTimings];
                     const timing2 = allTimings[sessionNames[j] as keyof typeof allTimings];
                     if(timing1 && timing2) {
                        const start1 = timeToMinutes(timing1.start);
                        const end1 = timeToMinutes(timing1.end);
                        const start2 = timeToMinutes(timing2.start);
                        const end2 = timeToMinutes(timing2.end);
                        const overlapStart = Math.max(start1, start2);
                        const overlapEnd = Math.min(end1, end2);
                        const formatTime = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
                        if(start === formatTime(overlapStart) && end === formatTime(overlapEnd)) {
                            matchedSession = `${sessionNames[i]} / ${sessionNames[j]}`;
                            break;
                        }
                     }
                }
                if (matchedSession !== 'Any') break;
            }
        }

        if (strategy.timeBasedRules.session !== matchedSession) {
            handleStrategyChange('timeBasedRules', { ...strategy.timeBasedRules, session: matchedSession });
        }
        
        setTimeout(() => { isEditingTime.current = false; }, 100);

    }, [strategy.timeBasedRules?.timeRange.start, strategy.timeBasedRules?.timeRange.end, handleStrategyChange]);
    
    const getActiveRuleCombination = (timeframe: string, ruleSet: RuleCombination[] = strategy.rules || []) => {
        return ruleSet.find(rc => rc.timeframe === timeframe);
    };

    const handleMainRuleSelection = (subCategoryId: string, optionId: string, isSingleChoice: boolean) => {
        handleRuleSelection(strategy.rules || [], (newRules) => handleStrategyChange('rules', newRules), subCategoryId, optionId, isSingleChoice);
    };
    
    const handleMainModifierSelection = (subCategoryId: string, optionId: string, modifierKey: string, modifierValue: string) => {
        handleModifierSelection(strategy.rules || [], (newRules) => handleStrategyChange('rules', newRules), subCategoryId, optionId, modifierKey, modifierValue);
    };

    const handleSetupRuleSelection = (subCategoryId: string, optionId: string, isSingleChoice: boolean) => {
        handleRuleSelection(currentSetupRuleCombinations, setCurrentSetupRuleCombinations, subCategoryId, optionId, isSingleChoice);
    };

    const handleSetupModifierSelection = (subCategoryId: string, optionId: string, modifierKey: string, modifierValue: string) => {
        handleModifierSelection(currentSetupRuleCombinations, setCurrentSetupRuleCombinations, subCategoryId, optionId, modifierKey, modifierValue);
    };

    const handleRuleSelection = (
        currentRules: RuleCombination[],
        setRules: (newRules: RuleCombination[]) => void,
        subCategoryId: string,
        optionId: string,
        isSingleChoice: boolean
    ) => {
        const newRules = JSON.parse(JSON.stringify(currentRules));
        let combo = newRules.find((rc: RuleCombination) => rc.timeframe === activeTimeframe);

        if (!combo) {
            combo = { timeframe: activeTimeframe, selectedRules: {} };
            newRules.push(combo);
        }

        if (!combo.selectedRules[subCategoryId]) {
            combo.selectedRules[subCategoryId] = [];
        }
        
        const currentSelection = (combo.selectedRules[subCategoryId] as any[]) || [];
        const existingIndex = currentSelection.findIndex(item => (typeof item === 'string' ? item : item.value) === optionId);
        
        if (isSingleChoice) {
            combo.selectedRules[subCategoryId] = existingIndex !== -1 ? [] : [optionId];
        } else {
            combo.selectedRules[subCategoryId] = existingIndex !== -1
                ? currentSelection.filter((_, index) => index !== existingIndex)
                : [...currentSelection, optionId];
        }
        
        const finalRules = newRules.filter((c: RuleCombination) => Object.values(c.selectedRules).some(v => Array.isArray(v) && v.length > 0));
        setRules(finalRules);
    };

    const handleModifierSelection = (
        currentRules: RuleCombination[],
        setRules: (newRules: RuleCombination[]) => void,
        subCategoryId: string,
        optionId: string,
        modifierKey: string,
        modifierValue: string
    ) => {
        const newRules = JSON.parse(JSON.stringify(currentRules));
        let combo = newRules.find((rc: RuleCombination) => rc.timeframe === activeTimeframe);

        if (!combo || !combo.selectedRules[subCategoryId]) return;

        let currentSelection = (combo.selectedRules[subCategoryId] as any[]) || [];
        const optionIndex = currentSelection.findIndex((item: any) => (typeof item === 'string' ? item : item.value) === optionId);
        
        if (optionIndex === -1) return;

        let option = currentSelection[optionIndex];
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

        const newSubCatSelection = [...currentSelection];
        newSubCatSelection[optionIndex] = newOption;
        combo.selectedRules[subCategoryId] = newSubCatSelection;

        setRules(newRules);
    };

    const isOptionSelected = (subCategoryId: string, optionId: string, ruleSet: Record<string, any[]> | undefined): boolean => {
        if (!ruleSet) return false;
        const selection = ruleSet[subCategoryId];
        if (!selection || !Array.isArray(selection)) return false;
        return selection.some(item => (typeof item === 'string' ? item : item.value) === optionId);
    };

    const getSelectedModifier = (subCategoryId: string, optionId: string, modifierKey: string, ruleSet: Record<string, any[]> | undefined): string | null => {
        if (!ruleSet || !ruleSet[subCategoryId]) return null;
        
        const selection = ruleSet[subCategoryId];
        const selectedItem = selection.find(item => (typeof item === 'string' ? item : item.value) === optionId);
        
        if (typeof selectedItem === 'object' && selectedItem !== null) {
            return selectedItem[modifierKey] || null;
        }
        return null;
    }

    const handleOpenNewOptionDialog = (subCategory: AnalysisSubCategory) => {
        setCurrentSubCategoryForNewOption(subCategory);
        setIsAddOptionOpen(true);
    };
    
    const handleSaveNewOption = (newValue: string) => {
        if (!currentSubCategoryForNewOption) return;
    
        const newOption: AnalysisOption = { id: crypto.randomUUID(), value: newValue };
    
        const newAnalysisConfigs = JSON.parse(JSON.stringify(strategy.analysisConfigurations || []));
        let category = newAnalysisConfigs.find((c: any) => c.subCategories.some((sc: any) => sc.id === currentSubCategoryForNewOption!.id));
        
        if (!category) {
            const globalCategory = appSettings.analysisConfigurations.find(c => c.subCategories.some(sc => sc.id === currentSubCategoryForNewOption!.id));
            if (globalCategory) {
                 category = { ...JSON.parse(JSON.stringify(globalCategory)), subCategories: [] };
                 newAnalysisConfigs.push(category);
            } else {
                 return;
            }
        }

        let subCategory = category.subCategories.find((sc: any) => sc.id === currentSubCategoryForNewOption!.id);
        if (!subCategory) {
            subCategory = { ...JSON.parse(JSON.stringify(currentSubCategoryForNewOption)), options: [] };
            category.subCategories.push(subCategory);
        }
        
        if (subCategory && !subCategory.options.some((o: any) => o.value.toLowerCase() === newValue.toLowerCase())) {
            subCategory.options.push(newOption);
            handleStrategyChange('analysisConfigurations', newAnalysisConfigs);
            toast({ title: 'Strategy Option Added', description: `"${newValue}" has been added to this strategy.`});
        } else {
             toast({ title: 'Option already exists', variant: 'destructive'});
        }
        setIsAddOptionOpen(false);
    };

    const handleSave = () => {
        if (!strategy.name.trim()) {
            toast({ title: 'Strategy name is required', variant: 'destructive' });
            return;
        }
        onSave(strategy);
        onClose();
    };

    const handleAddNewSetup = () => {
        if (!newSetupName.trim()) {
            toast({ title: "Setup name is required.", variant: 'destructive' });
            return;
        }
        if (currentSetupRuleCombinations.length === 0) {
            toast({ title: "No rules selected", description: "Please select at least one rule for this setup.", variant: 'destructive' });
            return;
        }

        const newSetup: Setup = {
            id: crypto.randomUUID(),
            name: newSetupName,
            rules: currentSetupRuleCombinations,
        };

        handleStrategyChange('setups', [...(strategy.setups || []), newSetup]);
        setNewSetupName('');
        setCurrentSetupRuleCombinations([]);
        toast({ title: 'Setup Added', description: `"${newSetupName}" has been saved.` });
    };

     const handleUpdateSetup = () => {
        if (!editingSetup || !newSetupName.trim()) return;

        const updatedSetup: Setup = {
            ...editingSetup,
            name: newSetupName,
            rules: currentSetupRuleCombinations,
        };
        
        const updatedSetups = (strategy.setups || []).map(s => 
            s.id === editingSetup.id ? updatedSetup : s
        );

        handleStrategyChange('setups', updatedSetups);
        setNewSetupName('');
        setCurrentSetupRuleCombinations([]);
        setEditingSetup(null);
        toast({ title: 'Setup Updated', description: `"${newSetupName}" has been updated.` });
    };

    const handleLoadSetupForEditing = (setupToEdit: Setup) => {
        setEditingSetup(setupToEdit);
        setNewSetupName(setupToEdit.name);
        setCurrentSetupRuleCombinations(JSON.parse(JSON.stringify(setupToEdit.rules)));
    };


    const handleDeleteSetup = (setupId: string) => {
        handleStrategyChange('setups', (strategy.setups || []).filter(s => s.id !== setupId));
    };

    const progress = (step / 3) * 100;
    
    const activeRuleForMain = getActiveRuleCombination(activeTimeframe, strategy.rules);
    const activeRuleForSetup = getActiveRuleCombination(activeTimeframe, currentSetupRuleCombinations);

    const renderStep1 = () => (
        <ScrollArea className="h-full pr-2">
            <div className="space-y-4">
                <div><Label htmlFor="name">Strategy Name</Label><Input id="name" value={strategy.name} onChange={(e) => handleStrategyChange('name', e.target.value)} placeholder="e.g., London Killzone Scalp" /></div>
                <div><Label htmlFor="description">Description</Label><Input id="description" value={strategy.description} onChange={(e) => handleStrategyChange('description', e.target.value)} placeholder="A brief summary of this strategy's edge." /></div>
                 <Card className="glassmorphic"><CardHeader className="flex flex-row items-center justify-between p-3"><div className="space-y-0.5"><CardTitle className="text-base">Tradable Instruments</CardTitle><p className="text-xs text-muted-foreground">Restrict this strategy to specific pairs.</p></div><Switch checked={strategy.pairSelectionMode === 'specific'} onCheckedChange={(c) => handleStrategyChange('pairSelectionMode', c ? 'specific' : 'any')} /></CardHeader>
                    {strategy.pairSelectionMode === 'specific' && (<CardContent className="p-3 pt-0"><MultiSelect options={Object.keys(pairsConfig).map(p => ({value: p, label: p}))} selectedValues={strategy.allowedPairs} onValueChange={(v) => handleStrategyChange('allowedPairs', v)} placeholder="Select allowed pairs..."/></CardContent>)}
                 </Card>
                 <Card className="glassmorphic">
                     <CardHeader className="flex flex-row items-center justify-between p-3">
                        <div className="space-y-0.5"><CardTitle className="text-base">Time-Based Rules</CardTitle><p className="text-xs text-muted-foreground">Restrict this strategy to specific times.</p></div>
                        <Switch checked={strategy.timeBasedRules?.enabled || false} onCheckedChange={(c) => handleStrategyChange('timeBasedRules', { ...strategy.timeBasedRules, enabled: c })} />
                     </CardHeader>
                      {strategy.timeBasedRules?.enabled && (<CardContent className="p-3 pt-0 grid grid-cols-2 gap-4">
                            <div className="space-y-1"><Label className="text-xs">Session</Label><Select value={strategy.timeBasedRules.session} onValueChange={v => handleStrategyChange('timeBasedRules', {...strategy.timeBasedRules, session: v})}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                     <SelectContent>
                                        {allPossibleSessions.map(sessionName => (
                                            <SelectItem key={sessionName} value={sessionName}>{sessionName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1"><Label className="text-xs">Time Range</Label><div className="flex items-center gap-1">
                                    <TimePicker value={strategy.timeBasedRules.timeRange.start} onChange={v => handleStrategyChange('timeBasedRules', {...strategy.timeBasedRules!, timeRange: { ...strategy.timeBasedRules!.timeRange, start: v }})}/>
                                    <TimePicker value={strategy.timeBasedRules.timeRange.end} onChange={v => handleStrategyChange('timeBasedRules', {...strategy.timeBasedRules!, timeRange: { ...strategy.timeBasedRules!.timeRange, end: v }})}/>
                            </div></div>
                        </CardContent>)}
                 </Card>
            </div>
        </ScrollArea>
    );
    
    const renderStep2 = () => (
        <div className="grid grid-cols-[120px_1fr_220px] gap-2 h-full">
             <div className="flex flex-col h-full min-h-0">
               <Card className="glassmorphic h-full flex flex-col p-1">
                    <CardHeader className="p-2"><CardTitle className="text-xs text-center uppercase">Timeframe</CardTitle></CardHeader>
                    <CardContent className="p-0.5 flex-1 min-h-0">
                        <ScrollArea className="h-full">
                        <div className="flex flex-col gap-1 pr-1">
                            {sortedTimeframes.map(tf => (
                            <Button key={tf} variant={activeTimeframe === tf ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTimeframe(tf)} className="justify-start text-xs h-7">
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
                    <div className="flex items-center gap-2">
                        <TabsList className="grid grid-cols-7 h-auto flex-1">
                            {combinedAnalysisConfigs.map((category: AnalysisCategory) => {
                                const Icon = (icons as any)[category.icon] || HelpCircle;
                                return (
                                    <TabsTrigger key={category.id} value={category.id} className="text-xs px-1 h-10 flex-col gap-1 relative">
                                        { (strategy.analysisConfigurations || []).some(sc => sc.id === category.id) && <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-primary" /> }
                                        <Icon className="h-4 w-4"/>
                                        <span>{category.title}</span>
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                        <Button variant="outline" size="sm" className="h-10" onClick={() => setIsAnalysisEditorOpen(true)}>
                            <Edit className="h-4 w-4"/>
                        </Button>
                    </div>
                    <div className="flex-1 min-h-0 mt-2">
                        <ScrollArea className="h-full pr-2">
                            {combinedAnalysisConfigs.map((category: AnalysisCategory) => (
                                <TabsContent key={category.id} value={category.id} className="m-0 h-full">
                                        <div className="space-y-2">
                                            {(category.subCategories || []).map(subCat => (
                                                <Card key={subCat.id} className="glassmorphic">
                                                    <CardHeader className="p-2"><CardTitle className="text-sm">{subCat.title}</CardTitle></CardHeader>
                                                    <CardContent className="p-2">
                                                        <div className="flex flex-wrap gap-1 justify-start">
                                                            {(subCat.options || []).map(option => {
                                                                const isSelected = isOptionSelected(subCat.id, option.id, activeRuleForMain?.selectedRules);
                                                                return (
                                                                    <div key={option.id} className={cn("p-1.5 rounded-md border transition-all", isSelected ? 'bg-primary/20 border-primary' : 'bg-muted/50')}>
                                                                        <div className="flex items-center space-x-2">
                                                                            <Checkbox id={`main-${subCat.id}-${option.id}`} checked={isSelected} onCheckedChange={() => handleMainRuleSelection(subCat.id, option.id, category.isSingleChoice)}/>
                                                                            <Label htmlFor={`main-${subCat.id}-${option.id}`} className="text-sm font-normal">{option.value}</Label>
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
                                                                                                    value={getSelectedModifier(subCat.id, option.id, mod.key, activeRuleForMain?.selectedRules) || ''}
                                                                                                    onChange={e => handleMainModifierSelection(subCat.id, option.id, mod.key, e.target.value)}
                                                                                                    className="h-7 text-xs"
                                                                                                />
                                                                                            </div>
                                                                                        )
                                                                                    }
                                                                                    return (
                                                                                        <div key={mod.key} className="space-y-1">
                                                                                            <Label className="text-xs text-muted-foreground">{mod.label}</Label>
                                                                                            <ToggleGroup type="single" variant="outline" size="xs" 
                                                                                                value={getSelectedModifier(subCat.id, option.id, mod.key, activeRuleForMain?.selectedRules) || ''}
                                                                                                onValueChange={v => handleMainModifierSelection(subCat.id, option.id, mod.key, v)}
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
                <RuleSelectionSummary rules={strategy.rules || []} analysisConfigs={combinedAnalysisConfigs} />
            </div>
        </div>
    );
    
    const renderStep3 = () => {
        const activeSetupRuleCombination = getActiveRuleCombination(activeTimeframe, currentSetupRuleCombinations);
        
        return (
            <div className="h-full flex flex-col gap-2">
                <Card className="glassmorphic flex-shrink-0">
                    <CardHeader className="p-2">
                        <CardTitle className="text-base">Saved Setups</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                        <ScrollArea className="w-full">
                            <div className="flex items-center gap-2 pb-2">
                                {(strategy.setups || []).length === 0 ? (
                                    <p className="text-xs text-center text-muted-foreground p-2 w-full">No setups created yet. Define one below.</p>
                                ) : (
                                    (strategy.setups || []).map(setup => (
                                        <div key={setup.id} className="relative group flex-shrink-0">
                                            <Button variant={editingSetup?.id === setup.id ? 'default' : 'secondary'} className="pr-7 py-1 h-auto" onClick={() => handleLoadSetupForEditing(setup)}>
                                                {setup.name}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-5 w-5 absolute top-1/2 right-0.5 -translate-y-1/2 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDeleteSetup(setup.id); }}>
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-[120px_1fr_220px] gap-2 h-full flex-1 min-h-0">
                    <div className="flex flex-col h-full min-h-0">
                        <Card className="glassmorphic h-full flex flex-col p-1">
                            <CardHeader className="p-2"><CardTitle className="text-xs text-center uppercase">Timeframe</CardTitle></CardHeader>
                            <CardContent className="p-0.5 flex-1 min-h-0">
                                <ScrollArea className="h-full">
                                    <div className="flex flex-col gap-1 pr-1">
                                        {sortedTimeframes.map(tf => (
                                            <Button key={tf} variant={activeTimeframe === tf ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTimeframe(tf)} className="justify-start text-xs h-7">{tf}</Button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 h-full">
                        <Card className="glassmorphic mb-2">
                            <CardContent className="p-2">
                                <div className="flex items-center gap-2">
                                    <Input placeholder="Setup Name (e.g., Bullish Continuation)" value={newSetupName} onChange={e => setNewSetupName(e.target.value)} className="h-8"/>
                                    <Button onClick={editingSetup ? handleUpdateSetup : handleAddNewSetup} className="h-8">
                                        {editingSetup ? <Save className="mr-2 h-4 w-4"/> : <PlusCircle className="mr-2 h-4 w-4"/>}
                                        {editingSetup ? 'Update' : 'Save'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
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
                                        <TabsContent key={category.id} value={category.id} className="m-0">
                                            <div className="space-y-2">
                                                {(category.subCategories || []).map(subCat => (
                                                    <Card key={subCat.id} className="glassmorphic">
                                                        <CardHeader className="p-2"><CardTitle className="text-sm">{subCat.title}</CardTitle></CardHeader>
                                                        <CardContent className="p-2">
                                                            <div className="flex flex-wrap gap-1 justify-start">
                                                                {(subCat.options || []).map(option => {
                                                                    const isSelected = isOptionSelected(subCat.id, option.id, activeSetupRuleCombination?.selectedRules);
                                                                    return (
                                                                        <div key={option.id} className={cn("p-1.5 rounded-md border transition-all", isSelected ? 'bg-primary/20 border-primary' : 'bg-muted/50')}>
                                                                            <div className="flex items-center space-x-2">
                                                                                <Checkbox id={`setup-${subCat.id}-${option.id}`} checked={isSelected} onCheckedChange={() => handleSetupRuleSelection(subCat.id, option.id, category.isSingleChoice)}/>
                                                                                <Label htmlFor={`setup-${subCat.id}-${option.id}`} className="text-sm font-normal">{option.value}</Label>
                                                                            </div>
                                                                            {isSelected && subCat.modifiers && (
                                                                                <div className="pt-2 mt-2 border-t space-y-2">
                                                                                    {subCat.modifiers.map(mod => {
                                                                                        if (mod.type === 'text') {
                                                                                            return (
                                                                                                <div key={mod.key} className="space-y-1">
                                                                                                    <Label className="text-xs text-muted-foreground">{mod.label}</Label>
                                                                                                    <Input
                                                                                                        type="text" placeholder={mod.label}
                                                                                                        value={getSelectedModifier(subCat.id, option.id, mod.key, activeSetupRuleCombination?.selectedRules) || ''}
                                                                                                        onChange={e => handleSetupModifierSelection(subCat.id, option.id, mod.key, e.target.value)}
                                                                                                        className="h-7 text-xs"
                                                                                                    />
                                                                                                </div>
                                                                                            )
                                                                                        }
                                                                                        return (
                                                                                            <div key={mod.key} className="space-y-1">
                                                                                                <Label className="text-xs text-muted-foreground">{mod.label}</Label>
                                                                                                <ToggleGroup type="single" variant="outline" size="xs" 
                                                                                                    value={getSelectedModifier(subCat.id, option.id, mod.key, activeSetupRuleCombination?.selectedRules) || ''}
                                                                                                    onValueChange={v => handleSetupModifierSelection(subCat.id, option.id, mod.key, v)}
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
                        <RuleSelectionSummary
                            rules={currentSetupRuleCombinations}
                            analysisConfigs={combinedAnalysisConfigs}
                            title="Current Setup Rules"
                        />
                    </div>
                </div>
            </div>
    );
};
    
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="glassmorphic sm:max-w-7xl h-[90vh] flex flex-col p-4">
                    <DialogHeader className="px-2">
                        <DialogTitle>{initialStrategy ? 'Edit Strategy' : 'Create New Strategy'}</DialogTitle>
                        <DialogDescription>A strategy is a collection of rules across different timeframes that define your trading edge.</DialogDescription>
                        <Progress value={progress} className="w-full mt-2" />
                    </DialogHeader>
                    <div className="py-2 flex-1 min-h-0">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>
                    <DialogFooter className="justify-between">
                         <Button variant="ghost" onClick={() => setStep(prev => Math.max(1, prev - 1))} disabled={step === 1}><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
                        <div className="flex gap-2">
                            <Button onClick={onClose} variant="outline"><X className="mr-2 h-4 w-4" /> Cancel</Button>
                            {step < 3 ? <Button onClick={() => setStep(prev => Math.min(3, prev + 1))}>Next <ArrowRight className="ml-2 h-4 w-4"/></Button> : <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Strategy</Button>}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AddNewOptionDialog 
                isOpen={isAddOptionOpen}
                onClose={() => setIsAddOptionOpen(false)}
                onSave={handleSaveNewOption}
                categoryTitle={currentSubCategoryForNewOption?.title || ''}
            />
             <StrategyAnalysisEditor 
                open={isAnalysisEditorOpen}
                onOpenChange={setIsAnalysisEditorOpen}
                globalConfigs={appSettings.analysisConfigurations || []}
                strategyConfigs={strategy.analysisConfigurations || []}
                onSave={(newConfigs) => handleStrategyChange('analysisConfigurations', newConfigs)}
            />
        </>
    );
}

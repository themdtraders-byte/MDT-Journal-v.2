
'use client';

import { useState, useMemo, useRef } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, FileUp } from 'lucide-react';
import type { Strategy, Trade } from '@/types';
import StrategyEditorDialog from '@/components/strategy-editor-dialog';
import StrategyCard from '@/components/strategy-card';
import { useToast } from '@/hooks/use-toast';
import { calculateGroupMetrics } from '@/lib/analytics';

export default function StrategyPage() {
    const { journals, activeJournalId, addStrategy, updateStrategy, deleteStrategy, appSettings } = useJournalStore(state => ({
        journals: state.journals,
        activeJournalId: state.activeJournalId,
        addStrategy: state.addStrategy,
        updateStrategy: state.updateStrategy,
        deleteStrategy: state.deleteStrategy,
        appSettings: state.appSettings,
    }));
    
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
    const { toast } = useToast();
    const importFileRef = useRef<HTMLInputElement>(null);

    const strategies = useMemo(() => activeJournal?.strategies || [], [activeJournal]);
    const allTrades = useMemo(() => activeJournal?.trades || [], [activeJournal]);

    const strategyStats = useMemo(() => {
        if (!strategies || !allTrades || !appSettings || !activeJournal) return new Map();

        const statsMap = new Map<string, ReturnType<typeof calculateGroupMetrics>>();
        
        strategies.forEach(strategy => {
            const relevantTrades = allTrades.filter(trade => trade.strategy === strategy.name);
            const metrics = calculateGroupMetrics(relevantTrades, appSettings, activeJournal.capital);
            statsMap.set(strategy.id, metrics);
        });

        return statsMap;
    }, [strategies, allTrades, appSettings, activeJournal]);

    const filteredStrategies = useMemo(() => {
        return strategies.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [strategies, searchTerm]);

    const handleCreateNew = () => {
        setEditingStrategy(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (strategy: Strategy) => {
        setEditingStrategy(strategy);
        setIsEditorOpen(true);
    };

    const handleDelete = (strategyId: string) => {
        deleteStrategy(strategyId);
        toast({ title: "Strategy Deleted" });
    };

    const handleSave = (strategyData: Strategy | Omit<Strategy, 'id'>) => {
        if ('id' in strategyData) {
            updateStrategy(strategyData);
            toast({ title: "Strategy Updated" });
        } else {
            addStrategy(strategyData);
            toast({ title: "Strategy Created" });
        }
    };
    
    const handleExport = (strategy: Strategy) => {
        try {
            // Exclude the ID for cleaner sharing
            const { id, ...exportableStrategy } = strategy;
            const dataStr = JSON.stringify(exportableStrategy, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            const exportFileDefaultName = `${strategy.name.replace(/[^a-z0-9]/gi, '_')}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            toast({ title: "Strategy Exported", description: `${strategy.name} has been saved.` });
        } catch (error) {
             toast({ title: "Export Failed", variant: "destructive" });
        }
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const strategyData = JSON.parse(e.target?.result as string);
                    // Basic validation to ensure it's a strategy object
                    if (strategyData.name && Array.isArray(strategyData.rules)) {
                        addStrategy(strategyData);
                        toast({ title: "Import Successful", description: `Strategy "${strategyData.name}" has been added.` });
                    } else {
                        throw new Error("Invalid strategy file format.");
                    }
                } catch (err: any) {
                    toast({ title: "Import Failed", description: err.message || "The selected file is not a valid strategy.", variant: "destructive" });
                }
            };
            reader.readAsText(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };


    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                 <div>
                    <h1 className="text-xl font-bold">Strategy Builder</h1>
                    <p className="text-muted-foreground">Define and manage your trading strategies.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search strategies..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <input
                        type="file"
                        ref={importFileRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileImport}
                    />
                    <Button variant="outline" onClick={() => importFileRef.current?.click()}>
                        <FileUp className="mr-2 h-4 w-4"/>
                        Import
                    </Button>
                    <Button onClick={handleCreateNew}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        New Strategy
                    </Button>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStrategies.map(strategy => (
                    <StrategyCard 
                        key={strategy.id} 
                        strategy={strategy}
                        stats={strategyStats.get(strategy.id)}
                        onEdit={handleEdit} 
                        onDelete={handleDelete}
                        onExport={handleExport}
                    />
                ))}
             </div>

            {isEditorOpen && (
                <StrategyEditorDialog
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSave}
                    initialStrategy={editingStrategy}
                />
            )}
        </div>
    );
}

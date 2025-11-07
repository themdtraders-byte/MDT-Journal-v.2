
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Trade } from '@/types';

// Duplicating type here to make component self-contained
export type LayerData = { id: string; lotSize: string; entryPrice: string; closingPrice: string; stopLoss: string; takeProfit: string };
export type PartialCloseData = { id: string; lotSize: string; price: string };

type FormDataType = Partial<Omit<Trade, 'lotSize' | 'entryPrice' | 'closingPrice' | 'stopLoss' | 'takeProfit'>> & {
    lotSize?: string;
    entryPrice?: string;
    closingPrice?: string;
    stopLoss?: string;
    takeProfit?: string;
};


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
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleConfirmClick}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LayersAndPartialsDialog;

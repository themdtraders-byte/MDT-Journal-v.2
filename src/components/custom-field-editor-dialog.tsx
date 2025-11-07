

'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PlusCircle, Trash2, List, ToggleLeft, Text, Pilcrow, Calendar, Clock } from 'lucide-react';
import type { CustomField, ControlType, ScoreImpact, ListCustomField, ButtonCustomField, BaseCustomField, NumericCustomField } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from './ui/switch';
import { Progress } from './ui/progress';

interface CustomFieldEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialField: CustomField | null;
  onSave: (field: CustomField) => void;
}

const createNewField = (): CustomField => ({
    id: crypto.randomUUID(),
    title: '',
    type: 'Button',
    allowMultiple: false,
    options: [],
} as ButtonCustomField);


const controlTypes: { type: ControlType, icon: React.ElementType }[] = [
    { type: 'Button', icon: ToggleLeft },
    { type: 'List', icon: List },
    { type: 'Numeric', icon: Pilcrow },
    { type: 'Plain Text', icon: Text },
    { type: 'Date', icon: Calendar },
    { type: 'Time', icon: Clock },
];

export default function CustomFieldEditorDialog({ isOpen, onClose, initialField, onSave }: CustomFieldEditorDialogProps) {
    const [step, setStep] = useState(1);
    const [field, setField] = useState<CustomField>(initialField || createNewField());

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setField(initialField ? JSON.parse(JSON.stringify(initialField)) : createNewField());
        }
    }, [initialField, isOpen]);

    const handleFieldChange = (key: keyof CustomField, value: any) => {
        setField(prev => ({ ...prev, [key]: value } as CustomField));
    };

    const handleTypeChange = (newType: ControlType) => {
        const base: Partial<CustomField> = { id: field.id, title: field.title, type: newType };
        switch(newType) {
            case 'List':
            case 'Button':
                setField({ ...base, type: newType, allowMultiple: false, options: [] } as ButtonCustomField | ListCustomField);
                break;
            case 'Numeric':
                setField({ ...base, type: newType, range: 'Any' } as NumericCustomField);
                break;
            default:
                setField(base as BaseCustomField);
        }
    }
    
    const handleOptionChange = (index: number, key: 'value' | 'impact', value: string) => {
        const listOrButton = field as ListCustomField | ButtonCustomField;
        if (listOrButton.options) {
            const newOptions = [...listOrButton.options];
            newOptions[index] = { ...newOptions[index], [key]: value };
            handleFieldChange('options', newOptions);
        }
    };


    const addOption = () => {
        const listOrButton = field as ListCustomField | ButtonCustomField;
        const newOptions = [...(listOrButton.options || []), { value: '', impact: 'Positive' as ScoreImpact }];
        handleFieldChange('options', newOptions);
    };

    const removeOption = (index: number) => {
        const listOrButton = field as ListCustomField | ButtonCustomField;
        const newOptions = (listOrButton.options || []).filter((_, i) => i !== index);
        handleFieldChange('options', newOptions);
    };

    const handleRangeTypeChange = (newRangeType: string) => {
        if (newRangeType === 'Between') {
            handleFieldChange('range', { min: 0, max: 100 });
        } else {
            handleFieldChange('range', newRangeType);
        }
    }
    
    const handleRangeValueChange = (minOrMax: 'min' | 'max', value: string) => {
        const currentRange = (field as NumericCustomField).range;
        if(typeof currentRange === 'object') {
            const newRange = { ...currentRange, [minOrMax]: parseFloat(value) || 0 };
            handleFieldChange('range', newRange);
        }
    }

    const handleSave = () => {
        onSave(field);
        onClose();
    }
    
    const progress = (step / 2) * 100;

    const renderStep1 = () => (
        <div className="space-y-4">
            <div>
                <Label>Field Title</Label>
                <Input value={field.title} onChange={e => handleFieldChange('title', e.target.value)} placeholder="e.g., Discipline Check, Market Condition"/>
            </div>
            <div>
                <Label>Field Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                    {controlTypes.map(ct => (
                         <Button key={ct.type} variant={field.type === ct.type ? 'default' : 'outline'} onClick={() => handleTypeChange(ct.type)} className="h-20 flex flex-col gap-1">
                            <ct.icon className="h-6 w-6"/>
                            <span className="text-xs">{ct.type}</span>
                         </Button>
                    ))}
                </div>
                 <p className="text-xs text-muted-foreground mt-2">This determines what kind of data you will log for this field.</p>
            </div>
        </div>
    );

    const renderStep2 = () => {
        switch (field.type) {
            case 'List':
            case 'Button':
                const listOrButton = field as ListCustomField | ButtonCustomField;
                return (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="allowMultiple" checked={listOrButton.allowMultiple} onCheckedChange={(checked) => handleFieldChange('allowMultiple', checked)} />
                            <Label htmlFor="allowMultiple">Allow Multiple Selections</Label>
                        </div>
                        <Label>Options</Label>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {(listOrButton.options || []).map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={option.value}
                                        onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                                        className="h-8"
                                    />
                                    <Select value={option.impact} onValueChange={(v) => handleOptionChange(index, 'impact', v)}>
                                        <SelectTrigger className="h-8 text-xs w-[180px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Most Positive">Most Positive</SelectItem>
                                            <SelectItem value="Positive">Positive</SelectItem>
                                            <SelectItem value="Negative">Negative</SelectItem>
                                            <SelectItem value="Most Negative">Most Negative</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeOption(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={addOption}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Option
                        </Button>
                    </div>
                );
            case 'Numeric':
                const numericField = field as NumericCustomField;
                const rangeType = typeof numericField.range === 'object' ? 'Between' : numericField.range;
                return (
                     <div className="space-y-2">
                        <Label>Valid Range</Label>
                        <Select value={rangeType} onValueChange={handleRangeTypeChange}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Any">Any Number</SelectItem>
                                <SelectItem value="Positive">Positive Only</SelectItem>
                                <SelectItem value="Negative">Negative Only</SelectItem>
                                <SelectItem value="Between">Between...</SelectItem>
                            </SelectContent>
                        </Select>
                        {rangeType === 'Between' && typeof numericField.range === 'object' && (
                            <div className="grid grid-cols-2 gap-2">
                                <Input type="number" placeholder="Min" value={numericField.range.min} onChange={e => handleRangeValueChange('min', e.target.value)} />
                                <Input type="number" placeholder="Max" value={numericField.range.max} onChange={e => handleRangeValueChange('max', e.target.value)} />
                            </div>
                        )}
                    </div>
                );
            default:
                return <p className="text-muted-foreground text-center py-8">This field type requires no extra configuration.</p>;
        }
    };
    
    const isStep2Required = field.type === 'List' || field.type === 'Button' || field.type === 'Numeric';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glassmorphic sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{initialField ? 'Edit Custom Field' : 'Create Custom Field'}</DialogTitle>
                     <Progress value={progress} className="w-full mt-2" />
                </DialogHeader>
                <div className="py-4">
                    {step === 1 ? renderStep1() : renderStep2()}
                </div>
                <DialogFooter className="justify-between">
                     {step > 1 && <Button variant="outline" onClick={() => setStep(1)}>Back</Button>}
                     <div className="flex-grow"></div>
                    {step === 1 && isStep2Required ? (
                         <Button onClick={() => setStep(2)}>Next</Button>
                    ) : (
                         <Button onClick={handleSave}>Save Field</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

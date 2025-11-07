
'use client';

import { useState, useEffect } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { PlusCircle, Trash2, Edit, Settings2, RotateCw, Check, GripVertical, icons } from 'lucide-react';
import type { AnalysisCategory, AnalysisSubCategory, AnalysisOption, Modifier } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogContent as DialogContentComponent } from './ui/dialog';
import { Label } from './ui/label';
import { allAnalysisCategories } from '@/lib/strategy-options';
import IconPicker from './icon-picker';
import { Switch } from './ui/switch';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const AddItemForm = ({ onAddItem }: { onAddItem: (value: string) => void }) => {
    const [value, setValue] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem(value);
        setValue('');
    };
    return (
        <form onSubmit={handleSubmit} className="flex gap-1 mt-2">
            <Input className="h-7 text-xs" placeholder="New option text..." value={value} onChange={e => setValue(e.target.value)} />
            <Button type="submit" size="sm" variant="secondary" className="h-7">Add</Button>
        </form>
    );
};

const AddCardForm = ({ onAddCard }: { onAddCard: (title: string) => void }) => {
    const [title, setTitle] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onAddCard(title.trim());
            setTitle('');
        }
    };
    return (
        <form onSubmit={handleSubmit} className="flex gap-1 mt-2 p-2 border-t">
            <Input className="h-7 text-xs" placeholder="New Card Title..." value={title} onChange={e => setTitle(e.target.value)} />
            <Button type="submit" size="sm" variant="outline" className="h-7">Add New Card</Button>
        </form>
    );
};

const ModifierEditor = ({ subCategory, onSave }: { subCategory: AnalysisSubCategory, onSave: (updatedSubCategory: AnalysisSubCategory) => void }) => {
    const [isModifierDialogOpen, setIsModifierDialogOpen] = useState(false);
    const [editingModifiers, setEditingModifiers] = useState<Modifier[]>(subCategory.modifiers || []);
    const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});
    const [newModifierGroupTitle, setNewModifierGroupTitle] = useState('');
    const [newModifierGroupName, setNewModifierGroupName] = useState('');

    useEffect(() => {
        if(isModifierDialogOpen) {
            setEditingModifiers(JSON.parse(JSON.stringify(subCategory.modifiers || [])));
            setNewModifierGroupTitle('');
            setNewModifierGroupName('');
            setNewOptionValues({});
        }
    }, [isModifierDialogOpen, subCategory.modifiers]);


    const handleAddModifierGroup = () => {
        if (newModifierGroupTitle.trim() && newModifierGroupName.trim()) {
            const newGroup: Modifier = {
                key: newModifierGroupName.trim().toLowerCase().replace(/\s+/g, '-'),
                label: newModifierGroupTitle.trim(),
                options: [],
                type: 'select'
            };
            setEditingModifiers(prev => [...prev, newGroup]);
            setNewModifierGroupTitle('');
            setNewModifierGroupName('');
        }
    };
    
    const handleDeleteModifierGroup = (groupKey: string) => {
        setEditingModifiers(prev => prev.filter(m => m.key !== groupKey));
    }

    const handleAddModifierOption = (groupKey: string) => {
        const newValue = newOptionValues[groupKey]?.trim();
        if (newValue) {
            setEditingModifiers(prev => prev.map(m => 
                m.key === groupKey && !m.options.some(opt => opt.value.toLowerCase() === newValue.toLowerCase())
                    ? { ...m, options: [...m.options, { value: newValue, label: newValue }] } 
                    : m
            ));
            setNewOptionValues(prev => ({...prev, [groupKey]: ''}));
        }
    };
    
    const handleRemoveModifierOption = (groupKey: string, optionValue: string) => {
        setEditingModifiers(prev => prev.map(m => 
            m.key === groupKey 
                ? { ...m, options: m.options.filter(o => o.value !== optionValue) } 
                : m
        ));
    };
    
    const saveModifiers = () => {
        const updatedSubCategory = { ...subCategory, modifiers: editingModifiers };
        onSave(updatedSubCategory);
        setIsModifierDialogOpen(false);
    }
    
    return (
        <>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsModifierDialogOpen(true)}>
                <Settings2 className="h-3 w-3" />
            </Button>
            <Dialog open={isModifierDialogOpen} onOpenChange={setIsModifierDialogOpen}>
                <DialogContentComponent className="glassmorphic">
                    <DialogHeader>
                        <DialogTitle>Edit Sub-Options for "{subCategory.title}"</DialogTitle>
                        <DialogDescription>These sub-options will appear for every item in this card.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                        {editingModifiers.map(modGroup => (
                            <Card key={modGroup.key} className="bg-muted/50">
                                <CardHeader className="p-2 flex-row items-center justify-between">
                                    <h4 className="text-sm font-semibold">{modGroup.label}</h4>
                                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteModifierGroup(modGroup.key)}>
                                        <Trash2 className="h-4 w-4 text-destructive"/>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-2 space-y-2">
                                    {modGroup.options.map(opt => (
                                        <div key={opt.value} className="flex items-center justify-between text-xs p-1 bg-background/50 rounded">
                                            <span>{opt.label}</span>
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveModifierOption(modGroup.key, opt.value)}><Trash2 className="h-3 w-3"/></Button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-2 border-t">
                                        <Input
                                            placeholder="New sub-option..."
                                            value={newOptionValues[modGroup.key] || ''}
                                            onChange={e => setNewOptionValues(prev => ({...prev, [modGroup.key]: e.target.value}))}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddModifierOption(modGroup.key)}
                                            className="h-7 text-xs"
                                        />
                                        <Button size="sm" variant="secondary" className="h-7" onClick={() => handleAddModifierOption(modGroup.key)}>Add</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                         <div className="mt-4 border-t pt-4">
                             <h4 className="font-semibold text-sm mb-2">Add New Modifier Group</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <Input 
                                    placeholder="Group Title (e.g., Confirmation)"
                                    value={newModifierGroupTitle}
                                    onChange={e => setNewModifierGroupTitle(e.target.value)}
                                    className="h-8"
                                />
                                <Input 
                                    placeholder="Group Key (e.g., confirmation)"
                                    value={newModifierGroupName}
                                    onChange={e => setNewModifierGroupName(e.target.value)}
                                    className="h-8"
                                />
                            </div>
                            <Button onClick={handleAddModifierGroup} className="mt-2">Add Group</Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsModifierDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveModifiers}>Save Sub-Options</Button>
                    </DialogFooter>
                </DialogContentComponent>
            </Dialog>
        </>
    );
}

const SortableOption = ({ option, onUpdate, onDelete }: { option: AnalysisOption, onUpdate: (id: string, value: string) => void, onDelete: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: option.id });
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(option.value);

    const handleSave = () => {
        onUpdate(option.id, editValue);
        setIsEditing(false);
    };

    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-2 p-1 bg-background/50 rounded-sm touch-none">
            <span {...listeners} {...attributes} className="cursor-grab p-1"><GripVertical className="h-4 w-4 text-muted-foreground" /></span>
            {isEditing ? (
                <Input value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} autoFocus className="h-6 text-xs" />
            ) : (
                <span className="text-xs flex-grow" onClick={() => setIsEditing(true)}>{option.value}</span>
            )}
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsEditing(true)}><Edit className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={onDelete}><Trash2 className="h-3 w-3" /></Button>
        </div>
    );
};

const EditableItemCard = ({ 
    item, 
    onSave, 
    onDelete 
}: { 
    item: AnalysisSubCategory; 
    onSave: (item: AnalysisSubCategory) => void; 
    onDelete: (id: string) => void;
}) => {
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editState, setEditState] = useState(item);
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    const handleSaveTitle = () => {
        onSave(editState);
        setIsEditingTitle(false);
    };

    const handleAddItemToCard = (text: string) => {
        const newOption: AnalysisOption = { id: crypto.randomUUID(), value: text };
        const updatedItems = { ...editState, options: [...editState.options, newOption] };
        setEditState(updatedItems);
        onSave(updatedItems);
    };

    const handleOptionChange = (optionId: string, newValue: string) => {
        const updatedOptions = editState.options.map(opt => (opt.id === optionId ? { ...opt, value: newValue } : opt));
        const updatedSubCat = { ...editState, options: updatedOptions };
        setEditState(updatedSubCat);
        onSave(updatedSubCat);
    };

    const handleDeleteItemFromCard = (optionId: string) => {
        const updatedItems = { ...editState, options: editState.options.filter(o => o.id !== optionId) };
        setEditState(updatedItems);
        onSave(updatedItems);
    };

    const onDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = editState.options.findIndex(o => o.id === active.id);
            const newIndex = editState.options.findIndex(o => o.id === over.id);
            const reorderedOptions = arrayMove(editState.options, oldIndex, newIndex);
            const updatedState = { ...editState, options: reorderedOptions };
            setEditState(updatedState);
            onSave(updatedState);
        }
    };
    
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="p-2 bg-background/50 rounded-md touch-none">
            <div className="flex justify-between items-center mb-2">
                <span {...attributes} {...listeners} className="cursor-grab p-1"><GripVertical className="h-4 w-4 text-muted-foreground" /></span>
                {isEditingTitle ? (
                    <Input value={editState.title} onChange={e => setEditState({...editState, title: e.target.value})} onBlur={handleSaveTitle} onKeyDown={e => e.key === 'Enter' && handleSaveTitle()} autoFocus className="text-sm font-semibold h-7" />
                ) : (
                    <span className="font-semibold text-sm flex-grow" onClick={() => setIsEditingTitle(true)}>{item.title}</span>
                )}
                <div className="flex gap-1">
                    <ModifierEditor subCategory={editState} onSave={onSave} />
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingTitle(!isEditingTitle)}><Edit className="h-3 w-3"/></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(item.id)}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                </div>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={editState.options.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {editState.options.map(option => (
                            <SortableOption key={option.id} option={option} onUpdate={handleOptionChange} onDelete={() => handleDeleteItemFromCard(option.id)} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
            <AddItemForm onAddItem={handleAddItemToCard} />
        </div>
    );
};

const defaultCategoryIds = new Set(allAnalysisCategories.map(c => c.id));

const AnalysisSettings = ({
    isStrategySpecific = false,
    initialConfigs,
    onConfigsChange
}: {
    isStrategySpecific?: boolean;
    initialConfigs?: AnalysisCategory[];
    onConfigsChange?: (configs: AnalysisCategory[]) => void;
}) => {
    const { appSettings, updateAppSettings } = useJournalStore(state => ({
        appSettings: state.appSettings,
        updateAppSettings: state.updateAppSettings,
    }));
    
    const [analysisConfigs, setAnalysisConfigs] = useState(isStrategySpecific ? initialConfigs || [] : appSettings.analysisConfigurations || []);
    
    useEffect(() => {
        if (isStrategySpecific) {
            setAnalysisConfigs(initialConfigs || []);
        } else {
            setAnalysisConfigs(appSettings.analysisConfigurations || []);
        }
    }, [initialConfigs, appSettings.analysisConfigurations, isStrategySpecific]);

    const { toast } = useToast();

    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [newCategoryIcon, setNewCategoryIcon] = useState('FileText');
    const [newCategoryIsSingleChoice, setIsNewCategoryIsSingleChoice] = useState(false);
    
    const updateConfigs = (newConfigs: AnalysisCategory[]) => {
        setAnalysisConfigs(newConfigs);
        if(isStrategySpecific && onConfigsChange) {
            onConfigsChange(newConfigs);
        } else {
            updateAppSettings({ analysisConfigurations: newConfigs });
        }
    };

    const handleSetAsDefault = () => {
        updateAppSettings({ userDefinedAnalysisDefaults: analysisConfigs });
        toast({ title: 'Default Saved', description: 'Your current analysis options have been set as the new default.' });
    };

    const handleResetToDefault = () => {
        const defaultConfigs = appSettings.userDefinedAnalysisDefaults || allAnalysisCategories;
        updateConfigs(defaultConfigs);
        toast({ title: 'Settings Reset', description: 'Analysis options have been reset to your saved default.' });
    };
    
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    
    const handleAddCategory = () => {
        if (!newCategoryTitle.trim()) {
            toast({ title: "Category title is required.", variant: 'destructive' });
            return;
        }
        const newCategory: AnalysisCategory = {
            id: newCategoryTitle.toLowerCase().replace(/\s+/g, '-'),
            title: newCategoryTitle,
            icon: newCategoryIcon,
            isSingleChoice: newCategoryIsSingleChoice,
            subCategories: [],
        };
        updateConfigs([...analysisConfigs, newCategory]);
        setNewCategoryTitle('');
        setNewCategoryIcon('FileText');
        setIsNewCategoryIsSingleChoice(false);
    };

    const handleAddSubCategory = (catId: string, title: string) => {
        const newSub: AnalysisSubCategory = { id: crypto.randomUUID(), title, options: [] };
        const newConfigs = analysisConfigs.map(c => 
            c.id === catId ? { ...c, subCategories: [...c.subCategories, newSub] } : c
        );
        updateConfigs(newConfigs);
    };

    const handleUpdateSubCategory = (catId: string, updatedSub: AnalysisSubCategory) => {
         const newConfigs = analysisConfigs.map(c => {
            if (c.id === catId) {
                return { ...c, subCategories: c.subCategories.map(sc => sc.id === updatedSub.id ? updatedSub : sc) };
            }
            return c;
        });
        updateConfigs(newConfigs);
    };

    const handleDeleteSubCategory = (catId: string, subId: string) => {
        const newConfigs = analysisConfigs.map(c => 
            c.id === catId ? { ...c, subCategories: c.subCategories.filter(s => s.id !== subId) } : c
        );
        updateConfigs(newConfigs);
    };
    
    const handleDeleteCategory = (catId: string) => {
        const newConfigs = analysisConfigs.filter(c => c.id !== catId);
        updateConfigs(newConfigs);
    };
    
    const handleCategoryDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = analysisConfigs.findIndex(c => c.id === active.id);
            const newIndex = analysisConfigs.findIndex(c => c.id === over.id);
            updateConfigs(arrayMove(analysisConfigs, oldIndex, newIndex));
        }
    };
    
    const handleSubCategoryDragEnd = (categoryId: string, event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const category = analysisConfigs.find(c => c.id === categoryId);
            if (!category) return;
            const oldIndex = category.subCategories.findIndex(sc => sc.id === active.id);
            const newIndex = category.subCategories.findIndex(sc => sc.id === over.id);
            const reorderedSubCategories = arrayMove(category.subCategories, oldIndex, newIndex);
            const newConfigs = analysisConfigs.map(c => 
                c.id === categoryId ? { ...c, subCategories: reorderedSubCategories } : c
            );
            updateConfigs(newConfigs);
        }
    };

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Trade Analysis Options</CardTitle>
                    <CardDescription>Customize the options available in the "Analysis" tab of the Add Trade dialog.</CardDescription>
                  </div>
                    {!isStrategySpecific && (
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleSetAsDefault}>
                            <Check className="mr-2 h-4 w-4"/> Set as Default
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="outline" size="sm"><RotateCw className="mr-2 h-4 w-4"/>Reset</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Reset Analysis Options?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will reset all analysis categories and options to your last saved default. If you haven't set a default, it will restore the system defaults.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleResetToDefault}>Reset</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                    <SortableContext items={analysisConfigs.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        <Accordion type="multiple" defaultValue={analysisConfigs.map(c => c.id)} className="w-full space-y-2">
                            {analysisConfigs.map(category => {
                                const isDefault = defaultCategoryIds.has(category.id);
                                return (
                                    <SortableAccordionItem 
                                        key={category.id} 
                                        category={category}
                                        isDefault={isDefault}
                                        onDeleteCategory={handleDeleteCategory}
                                        onAddSubCategory={handleAddSubCategory}
                                        onUpdateSubCategory={handleUpdateSubCategory}
                                        onDeleteSubCategory={handleDeleteSubCategory}
                                        onSubCategoryDragEnd={handleSubCategoryDragEnd}
                                    />
                                );
                            })}
                        </Accordion>
                    </SortableContext>
                </DndContext>

                <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold">Create New Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1">
                            <Label>Category Title</Label>
                            <Input value={newCategoryTitle} onChange={e => setNewCategoryTitle(e.target.value)} placeholder="e.g., Market Condition" />
                        </div>
                         <div className="space-y-1">
                            <Label>Category Icon</Label>
                            <IconPicker selectedIcon={newCategoryIcon} onIconChange={setNewCategoryIcon} />
                        </div>
                        <div className="flex items-center space-x-2 md:col-span-2">
                            <Switch id="is-single-choice-new" checked={newCategoryIsSingleChoice} onCheckedChange={setIsNewCategoryIsSingleChoice}/>
                            <Label htmlFor="is-single-choice-new">Allow only one selection in this category</Label>
                        </div>
                    </div>
                    <Button onClick={handleAddCategory} className="mt-4">
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Add New Category
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

const SortableAccordionItem = ({ category, isDefault, onDeleteCategory, onAddSubCategory, onUpdateSubCategory, onDeleteSubCategory, onSubCategoryDragEnd }: {
    category: AnalysisCategory;
    isDefault: boolean;
    onDeleteCategory: (id: string) => void;
    onAddSubCategory: (categoryId: string, title: string) => void;
    onUpdateSubCategory: (categoryId: string, subCategory: AnalysisSubCategory) => void;
    onDeleteSubCategory: (categoryId: string, subCategoryId: string) => void;
    onSubCategoryDragEnd: (categoryId: string, event: DragEndEvent) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: category.id });
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const Icon = icons[category.icon as keyof typeof icons] || Edit;
    
    return (
        <AccordionItem ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} value={category.id} className="border rounded-md px-3 bg-muted/30 touch-none">
            <AccordionTrigger className="hover:no-underline py-2">
                <div {...attributes} {...listeners} className="flex items-center gap-2 flex-1 cursor-grab">
                    <GripVertical className="h-4 w-4" />
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-left font-semibold">{category.title}</span>
                </div>
                {!isDefault && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 mr-2" onClick={e => e.stopPropagation()}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the "{category.title}" category and all its cards and options. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteCategory(category.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </AccordionTrigger>
            <AccordionContent className="pt-2 border-t space-y-4">
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => onSubCategoryDragEnd(category.id, e)}>
                    <SortableContext items={category.subCategories.map(sc => sc.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {category.subCategories.map(subCat => (
                                <EditableItemCard 
                                    key={subCat.id}
                                    item={subCat}
                                    onSave={(updatedSub) => onUpdateSubCategory(category.id, updatedSub as AnalysisSubCategory)}
                                    onDelete={(id) => onDeleteSubCategory(category.id, id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                <AddCardForm onAddCard={(title) => onAddSubCategory(category.id, title)} />
            </AccordionContent>
        </AccordionItem>
    );
};

export default AnalysisSettings;

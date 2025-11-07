
'use client';

import { useState } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import type { ValidationList, ValidationListItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const ValidationListSettings = () => {
    const { appSettings, updateAppSettings } = useJournalStore();
    const { toast } = useToast();
    const [newListName, setNewListName] = useState('');

    const validationLists = appSettings.validationLists || [];

    const handleAddList = () => {
        if (!newListName.trim()) {
            toast({ title: "List title cannot be empty", variant: "destructive" });
            return;
        }
        const newList: ValidationList = {
            id: crypto.randomUUID(),
            title: newListName.trim(),
            items: []
        };
        updateAppSettings({ validationLists: [...validationLists, newList] });
        setNewListName('');
    };

    const handleUpdateList = (listId: string, updates: Partial<ValidationList>) => {
        const updatedLists = validationLists.map(list => 
            list.id === listId ? { ...list, ...updates } : list
        );
        updateAppSettings({ validationLists: updatedLists });
    };

    const handleDeleteList = (listId: string) => {
        const updatedLists = validationLists.filter(list => list.id !== listId);
        updateAppSettings({ validationLists: updatedLists });
    };

    const handleAddItem = (listId: string, itemText: string) => {
        if (!itemText.trim()) return;
        const newItem: ValidationListItem = { id: crypto.randomUUID(), text: itemText.trim() };
        const list = validationLists.find(l => l.id === listId);
        if(list) {
            handleUpdateList(listId, { items: [...list.items, newItem] });
        }
    };
    
    const handleDeleteItem = (listId: string, itemId: string) => {
        const list = validationLists.find(l => l.id === listId);
        if (list) {
            const newItems = list.items.filter(item => item.id !== itemId);
            handleUpdateList(listId, { items: newItems });
        }
    };

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="text-lg">Manage Validation Lists</CardTitle>
                <CardDescription>Create reusable checklists for pre-trade validation.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="New list title..."
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddList()}
                        />
                        <Button onClick={handleAddList}><PlusCircle className="mr-2 h-4 w-4" /> Add List</Button>
                    </div>

                    <Accordion type="multiple" className="w-full space-y-2">
                        {validationLists.map(list => (
                            <AccordionItem key={list.id} value={list.id} className="border rounded-md px-3 bg-muted/30">
                                <AccordionTrigger className="hover:no-underline py-2">
                                    <div className="flex-1 text-left font-semibold">{list.title}</div>
                                </AccordionTrigger>
                                <AccordionContent className="pt-2 border-t">
                                    <div className="space-y-2">
                                        {list.items.map(item => (
                                            <div key={item.id} className="flex items-center gap-2">
                                                <Input value={item.text} disabled className="h-8 text-xs bg-background/50" />
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteItem(list.id, item.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                                </Button>
                                            </div>
                                        ))}
                                        <AddItemForm onAddItem={(text) => handleAddItem(list.id, text)} />
                                        <div className="text-right mt-2">
                                            <Button variant="destructive" size="sm" onClick={() => handleDeleteList(list.id)}>Delete Entire List</Button>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </CardContent>
        </Card>
    );
};

const AddItemForm = ({ onAddItem }: { onAddItem: (text: string) => void }) => {
    const [text, setText] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem(text);
        setText('');
    };
    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input 
                placeholder="New checklist item..."
                value={text}
                onChange={e => setText(e.target.value)}
                className="h-8 text-xs"
            />
            <Button type="submit" size="sm" variant="secondary">Add Item</Button>
        </form>
    )
}

export default ValidationListSettings;

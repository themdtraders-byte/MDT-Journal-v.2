
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Pencil, PlusCircle, Trash2, Check, X, Star, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EditableListProps {
  title: string;
  items: string[];
  defaultItems?: string[];
  onItemsChange: (items: string[]) => void;
  onSetDefault: (value: string) => void;
  defaultValue?: string;
}

const EditableList = ({ title, items, defaultItems = [], onItemsChange, onSetDefault, defaultValue }: EditableListProps) => {
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState<{ index: number; value: string } | null>(null);
  const { toast } = useToast();

  const handleAddItem = () => {
    if (newItem.trim()) {
        if (items.some(item => item.toLowerCase() === newItem.trim().toLowerCase())) {
            toast({ title: 'Duplicate Item', description: `This ${title.toLowerCase().slice(0, -1)} already exists.`, variant: 'destructive' });
            return;
        }
        onItemsChange([...items, newItem.trim()]);
        setNewItem('');
        toast({ title: 'Success', description: `New ${title.toLowerCase().slice(0, -1)} added.`});
    }
  };

  const handleDeleteItem = (index: number) => {
    const itemToDelete = items[index];
    if (defaultItems.includes(itemToDelete)) {
        toast({ title: 'Cannot Delete', description: 'This is a default item and cannot be deleted.', variant: 'destructive' });
        return;
    }
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
     toast({ title: 'Success', description: `${title.slice(0, -1)} removed.`});
  };
  
  const handleStartEditing = (index: number, value: string) => {
    setEditingItem({ index, value });
  };
  
  const handleCancelEditing = () => {
    setEditingItem(null);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    
    if (!editingItem.value.trim()) {
        toast({ title: 'Item cannot be empty', variant: 'destructive' });
        return;
    }
    
    // Check for duplicates, excluding the item being edited
    if (items.some((item, i) => i !== editingItem.index && item.toLowerCase() === editingItem.value.trim().toLowerCase())) {
        toast({ title: 'Duplicate Item', description: `This item already exists in the list.`, variant: 'destructive' });
        return;
    }

    const newItems = [...items];
    newItems[editingItem.index] = editingItem.value.trim();
    
    onItemsChange(newItems);
    setEditingItem(null);
    toast({ title: 'Success', description: `Item updated.`});
  };

  const safeItems = Array.isArray(items) ? items : [];

  return (
    <Card className="glassmorphic w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {safeItems.map((item, index) => {
                const isDefault = defaultItems.includes(item);
                return (
                <div key={`${item}-${index}`} className="flex items-center gap-2 p-2 rounded-md bg-muted">
                    {editingItem?.index === index ? (
                        <>
                            <Input
                                value={editingItem.value}
                                onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                                autoFocus
                                className="h-8"
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateItem()}
                            />
                            <Button variant="ghost" size="icon" className="text-green-500 h-8 w-8" onClick={handleUpdateItem}>
                                <Check className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEditing}>
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <span className="font-mono text-sm text-muted-foreground w-6 text-right">{index + 1}.</span>
                            <span className="flex-grow">{item}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7", defaultValue === item && "text-yellow-500")}
                                onClick={() => onSetDefault(item)}
                            >
                                <Star className={cn("h-4 w-4", defaultValue === item && "fill-current")} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEditing(index, item)} disabled={isDefault}>
                                {isDefault ? <Lock className="h-4 w-4 text-muted-foreground/50"/> : <Pencil className="h-4 w-4" />}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500 h-7 w-7" disabled={isDefault}>
                                    {isDefault ? <Lock className="h-4 w-4 text-muted-foreground/50"/> : <Trash2 className="h-4 w-4" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete "{item}".</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteItem(index)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            )})}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Input
              placeholder={`Add new ${title.toLowerCase().slice(0, -1)}`}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <Button onClick={handleAddItem}>
              <PlusCircle className="mr-2" /> Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditableList;

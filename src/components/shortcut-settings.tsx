

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Edit, Save, PlusCircle, Trash2, RotateCw } from 'lucide-react';
import { Kbd } from './ui/kbd';
import { useJournalStore } from '@/hooks/use-journal-store';
import { useToast } from '@/hooks/use-toast';
import { defaultShortcuts } from '@/lib/data';
import type { Shortcut } from '@/types';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';


const KeyPill = ({
  keyName,
  isListening,
  onStartListening,
  onRemove
}: {
  keyName: string;
  isListening: boolean;
  onStartListening: () => void;
  onRemove: () => void;
}) => {
  return (
    <div className="relative group">
      <Kbd onClick={onStartListening} className="cursor-pointer h-7 px-2 text-[12px]">
        {isListening ? "Press key..." : keyName}
      </Kbd>
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-2.5 w-2.5" />
      </button>
    </div>
  );
};


const ShortcutSettings = () => {
  const { appSettings, updateAppSettings, resetShortcuts } = useJournalStore();
  const [isEditing, setIsEditing] = useState(false);
  const [localShortcuts, setLocalShortcuts] = useState<Shortcut[]>([]);
  const [listeningKey, setListeningKey] = useState<{ action: string; keyIndex: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (appSettings?.shortcuts) {
      setLocalShortcuts(appSettings.shortcuts);
    }
  }, [appSettings?.shortcuts]);

  const handleKeybindChange = (action: string, keyIndex: number, newKey: string) => {
    setLocalShortcuts(prev => prev.map(s => {
      if (s.action === action) {
        const newKeys = [...s.keys];
        // Prevent duplicate modifiers
        if (['Ctrl', 'Shift', 'Alt', 'Meta'].includes(newKey) && newKeys.includes(newKey)) {
            return s;
        }
        newKeys[keyIndex] = newKey;
        return { ...s, keys: newKeys };
      }
      return s;
    }));
  };

  const addKeyToShortcut = (action: string) => {
    setLocalShortcuts(prev => prev.map(s => {
      if (s.action === action) {
        return { ...s, keys: [...s.keys, '...'] };
      }
      return s;
    }));
    setListeningKey({ action, keyIndex: localShortcuts.find(s => s.action === action)!.keys.length });
  };

  const removeKeyFromShortcut = (action: string, keyIndex: number) => {
     setLocalShortcuts(prev => prev.map(s => {
      if (s.action === action) {
        const newKeys = s.keys.filter((_, index) => index !== keyIndex);
        return { ...s, keys: newKeys };
      }
      return s;
    }));
  };
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!listeningKey) return;
    e.preventDefault();
    
    // For modifier keys, we just record them.
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        handleKeybindChange(listeningKey.action, listeningKey.keyIndex, e.key === 'Control' ? 'Ctrl' : e.key);
        // Don't stop listening, allow for combinations
        return;
    }

    // For regular keys
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    handleKeybindChange(listeningKey.action, listeningKey.keyIndex, key);
    
    setListeningKey(null); // Stop listening after a non-modifier key is pressed
  }, [listeningKey, handleKeybindChange]);

  useEffect(() => {
    if(listeningKey) {
        window.addEventListener('keydown', handleKeyDown, { capture: true });
        return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
    }
  }, [listeningKey, handleKeyDown]);
  
  const handleSave = () => {
    // Filter out any placeholder keys
    const cleanedShortcuts = localShortcuts.map(s => ({
        ...s,
        keys: s.keys.filter(k => k !== '...')
    }));
    updateAppSettings({ shortcuts: cleanedShortcuts });
    setIsEditing(false);
    toast({ title: "Success", description: "Shortcuts have been updated." });
  };
  
  const handleCancel = () => {
    if (appSettings?.shortcuts) {
      setLocalShortcuts(appSettings.shortcuts);
    }
    setIsEditing(false);
  }

  return (
    <div className="space-y-6">
      <Card className="glassmorphic">
        <CardHeader>
           <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
                <CardDescription>Customize keyboard shortcuts for quick actions.</CardDescription>
              </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="outline" size="sm"><RotateCw className="mr-2 h-4 w-4"/>Reset</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Reset Shortcuts?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset all keyboard shortcuts to their original default values.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetShortcuts}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
              {isEditing ? (
                <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
                    <Button size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </div>
              ) : (
                 <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Shortcuts
                 </Button>
              )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Shortcut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(localShortcuts || []).map((shortcut) => (
                  <TableRow key={shortcut.action}>
                    <TableCell className="font-medium">{shortcut.action}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {shortcut.keys.map((key, index) => (
                            <KeyPill
                                key={index}
                                keyName={key}
                                isListening={isEditing && listeningKey?.action === shortcut.action && listeningKey?.keyIndex === index}
                                onStartListening={() => isEditing && setListeningKey({ action: shortcut.action, keyIndex: index })}
                                onRemove={() => isEditing && removeKeyFromShortcut(shortcut.action, index)}
                            />
                        ))}
                         {isEditing && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addKeyToShortcut(shortcut.action)}>
                                <PlusCircle className="h-4 w-4"/>
                            </Button>
                         )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShortcutSettings;

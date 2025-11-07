
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { useJournalStore } from '@/hooks/use-journal-store';
import type { TrashedItem, TrashedItemType } from '@/types';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter as AlertDialogFooterComponent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Card, CardContent } from './ui/card';

interface TrashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TrashedItemCard = ({ item, onRestore, onPermanentlyDelete }: { item: TrashedItem, onRestore: (id: string) => void, onPermanentlyDelete: (id: string) => void }) => {
  const daysLeft = 3 - differenceInDays(new Date(), new Date(item.deletedAt));

  return (
    <Card className="p-3 bg-muted/50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-semibold text-sm capitalize">{item.type.replace(/([A-Z])/g, ' $1')}</p>
          <p className="text-xs text-muted-foreground truncate max-w-xs">
            {item.data.title || item.data.name || item.id}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Deleted {formatDistanceToNow(new Date(item.deletedAt), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="outline" onClick={() => onRestore(item.id)}>
            <RotateCcw className="mr-1 h-3 w-3" /> Restore
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="xs" variant="destructive">
                <Trash2 className="mr-1 h-3 w-3" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>This action will permanently delete this item. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooterComponent>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onPermanentlyDelete(item.id)}>Delete Permanently</AlertDialogAction>
              </AlertDialogFooterComponent>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
       {daysLeft > 0 ? (
            <div className="flex items-center gap-2 text-xs text-yellow-600 mt-2">
                <AlertTriangle className="h-4 w-4"/>
                <span>Auto-deletes in {daysLeft} day(s)</span>
            </div>
        ) : (
             <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                <AlertTriangle className="h-4 w-4"/>
                <span>Will be deleted on next visit.</span>
            </div>
        )}
    </Card>
  )
}

const TrashDialog = ({ open, onOpenChange }: TrashDialogProps) => {
  const { appSettings, activeJournalId, updateAppSettings, restoreFromTrash, permanentlyDeleteItem, emptyTrash } = useJournalStore(state => ({
    appSettings: state.appSettings,
    activeJournalId: state.activeJournalId,
    updateAppSettings: state.updateAppSettings,
    restoreFromTrash: state.restoreFromTrash,
    permanentlyDeleteItem: state.permanentlyDeleteItem,
    emptyTrash: state.emptyTrash,
  }));

  const trashForCurrentJournal = useMemo(() => {
    return (appSettings?.trash || []).filter(item => item.journalId === activeJournalId);
  }, [appSettings?.trash, activeJournalId]);


  useEffect(() => {
    if (open && appSettings?.trash?.length > 0) {
      const now = new Date();
      const freshTrash = appSettings.trash.filter(item => {
        const deletedAt = new Date(item.deletedAt);
        const daysOld = differenceInDays(now, deletedAt);
        return daysOld < 3;
      });

      if (freshTrash.length !== appSettings.trash.length) {
        updateAppSettings({ trash: freshTrash });
      }
    }
  }, [open, appSettings?.trash, updateAppSettings]);

  const groupedTrash = useMemo(() => {
    return trashForCurrentJournal.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {} as Record<TrashedItemType, TrashedItem[]>);
  }, [trashForCurrentJournal]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glassmorphic sm:max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trash2 /> Trash</DialogTitle>
          <DialogDescription>Items are permanently deleted after 3 days.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pr-4">
            {trashForCurrentJournal.length > 0 ? (
              Object.entries(groupedTrash).map(([type, items]) => (
                <div key={type}>
                  <h3 className="font-semibold text-base mb-2 capitalize">{type.replace(/([A-Z])/g, ' $1')}s</h3>
                  <div className="space-y-2">
                    {items.map(item => (
                      <TrashedItemCard 
                        key={item.id} 
                        item={item} 
                        onRestore={restoreFromTrash}
                        onPermanentlyDelete={permanentlyDeleteItem}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-24">
                <Trash2 className="mx-auto h-16 w-16 text-muted-foreground/30" />
                <p className="mt-4">The trash is empty.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        {trashForCurrentJournal.length > 0 && (
          <DialogFooter>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button variant="destructive">Empty Trash</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>This will permanently delete all items in the trash for this journal. This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooterComponent>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => emptyTrash(activeJournalId!)}>Empty Trash</AlertDialogAction>
                  </AlertDialogFooterComponent>
                </AlertDialogContent>
              </AlertDialog>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrashDialog;

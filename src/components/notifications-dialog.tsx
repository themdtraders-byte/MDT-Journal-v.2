
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Bell, Info, Sparkles, Trophy, Trash2, BrainCircuit, Star, Award } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { AlertDescription, AlertTitle } from './ui/alert';
import { useJournalStore } from '@/hooks/use-journal-store';
import type { Alert as AlertType } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

const getAlertConfig = (alert: AlertType) => {
    switch (alert.type) {
        case 'Warning': return { icon: AlertTriangle, color: 'text-yellow-500' };
        case 'Success': return { icon: Trophy, color: 'text-green-500' };
        case 'Rule Breached': return { icon: AlertTriangle, color: 'text-red-500' };
        case 'Target Reached': return { icon: Trophy, color: 'text-green-500' };
        case 'Actionable Insight': return { icon: BrainCircuit, color: 'text-purple-500' };
        case 'Level Up': return { icon: Trophy, color: 'text-yellow-400' };
        case 'Achievement Unlocked': return { icon: Star, color: 'text-orange-400' };
        case 'Badge Unlocked': return { icon: Award, color: 'text-blue-400' };
        case 'Informational':
        default: return { icon: Info, color: 'text-blue-500' };
    }
}

const FormattedAlertMessage = ({ message }: { message: string }) => {
    const parts = message.split(/(What:|Why:|Next:)/).filter(part => part.trim());

    if (parts.length < 3) {
        return <p>{message}</p>;
    }
    
    const structuredMessage: Record<string, string> = {};
    let currentPart: string | null = null;

    parts.forEach(part => {
        if (part.endsWith(':')) {
            currentPart = part.slice(0, -1);
        } else if (currentPart) {
            structuredMessage[currentPart] = part.trim();
            currentPart = null;
        }
    });

    return (
        <div className="space-y-1.5 mt-1">
            {structuredMessage['What'] && (
                <div>
                    <span className="font-semibold text-foreground/90">What: </span>
                    <span>{structuredMessage['What']}</span>
                </div>
            )}
             {structuredMessage['Why'] && (
                <div>
                    <span className="font-semibold text-foreground/90">Why: </span>
                    <span>{structuredMessage['Why']}</span>
                </div>
            )}
             {structuredMessage['Next'] && (
                <div>
                    <span className="font-semibold text-foreground/90">Next: </span>
                    <span>{structuredMessage['Next']}</span>
                </div>
            )}
        </div>
    );
};


const NotificationItem = ({ alert, onDismiss, onSelect, isSelected }: { alert: AlertType, onDismiss: (id: string) => void, onSelect: (id: string, checked: boolean) => void, isSelected: boolean }) => {
    const { icon: Icon, color } = getAlertConfig(alert);
    const isGamification = alert.category === 'Gamification';

    if (isGamification) {
        return (
             <div className={cn(
                "flex items-start gap-4 p-4 rounded-lg relative overflow-hidden",
                alert.seen ? 'bg-muted/30 opacity-70' : 'bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 border'
            )}>
                 <div className="absolute inset-0 z-0 opacity-10 pointer-events-none flex items-center justify-center">
                    <Icon className="w-2/3 h-2/3" />
                </div>
                 <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(alert.id, !!checked)} className="mt-1 flex-shrink-0 z-10" />
                <div className="flex-1 z-10">
                    <AlertTitle className={cn("text-sm font-semibold flex items-center gap-2", color)}>
                        <Icon className="h-5 w-5"/>
                        {alert.type}
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                         <FormattedAlertMessage message={alert.message} />
                    </AlertDescription>
                </div>
                <div className="flex flex-col items-end gap-1 z-10">
                     <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                     </p>
                     {!alert.seen && <Button size="xs" variant="ghost" onClick={() => onDismiss(alert.id)}>Dismiss</Button>}
                </div>
            </div>
        )
    }

    return (
        <div className={cn("flex items-start gap-3 p-3 border rounded-lg", alert.seen ? 'bg-muted/30 opacity-70' : 'bg-background/50')}>
            <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(alert.id, !!checked)} className="mt-1" />
            <Icon className={cn("h-5 w-5 mt-1 flex-shrink-0", color)} />
            <div className="flex-1">
                <AlertTitle className="text-sm font-semibold">{alert.category}</AlertTitle>
                <AlertDescription className="text-xs">
                    <FormattedAlertMessage message={alert.message} />
                </AlertDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
                 <p className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                 </p>
                 {!alert.seen && <Button size="xs" variant="ghost" onClick={() => onDismiss(alert.id)}>Dismiss</Button>}
            </div>
        </div>
    );
};


const NotificationsTab = ({ alerts, onDismiss, onSelect, selectedIds }: { alerts: AlertType[], onDismiss: (id: string) => void, onSelect: (id: string, checked: boolean) => void, selectedIds: Set<string>}) => {
    const generalAlerts = alerts.filter(a => a.type === 'Success' || a.type === 'Warning' || a.type === 'Rule Breached' || a.type === 'Target Reached');
    return (
         <div className="space-y-4">
            {generalAlerts.length > 0 ? (
                generalAlerts.map(alert => <NotificationItem key={alert.id} alert={alert} onDismiss={onDismiss} onSelect={onSelect} isSelected={selectedIds.has(alert.id)} />)
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                    <p className="mt-4">No new notifications.</p>
                </div>
            )}
        </div>
    )
}

const InsightsTab = ({ alerts, onDismiss, onSelect, selectedIds }: { alerts: AlertType[], onDismiss: (id: string) => void, onSelect: (id: string, checked: boolean) => void, selectedIds: Set<string>}) => {
    const insights = alerts.filter(a => a.type === 'Informational' || a.type === 'Actionable Insight');
    return (
        <div className="space-y-4">
            {insights.length > 0 ? (
                insights.map(alert => <NotificationItem key={alert.id} alert={alert} onDismiss={onDismiss} onSelect={onSelect} isSelected={selectedIds.has(alert.id)}/>)
            ) : (
                 <div className="text-center text-muted-foreground py-16">
                    <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                    <p className="mt-4">No insights generated yet.</p>
                    <p className="text-xs">Keep trading to receive personalized feedback from your coach.</p>
                </div>
            )}
        </div>
    )
}

const GamificationTab = ({ alerts, onDismiss, onSelect, selectedIds }: { alerts: AlertType[], onDismiss: (id: string) => void, onSelect: (id: string, checked: boolean) => void, selectedIds: Set<string>}) => {
    const gamificationAlerts = alerts.filter(a => a.category === 'Gamification');
    return (
         <div className="space-y-4">
            {gamificationAlerts.length > 0 ? (
                gamificationAlerts.map(alert => <NotificationItem key={alert.id} alert={alert} onDismiss={onDismiss} onSelect={onSelect} isSelected={selectedIds.has(alert.id)} />)
            ) : (
                <div className="text-center text-muted-foreground py-16">
                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50"/>
                    <p className="mt-4">No new awards yet.</p>
                     <p className="text-xs">Keep trading to level up and earn achievements!</p>
                </div>
            )}
        </div>
    )
}


interface NotificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


const NotificationsDialog = ({ open, onOpenChange }: NotificationsDialogProps) => {
  const { activeJournal, dismissAlert, clearAlerts } = useJournalStore(state => ({
    activeJournal: state.journals.find(j => j.id === state.activeJournalId),
    dismissAlert: state.dismissAlert,
    clearAlerts: state.clearAlerts
  }));
  const isNotificationsOpen = useJournalStore(state => state.isNotificationsOpen);
  
  const allAlerts = activeJournal?.alerts ? [...activeJournal.alerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('notifications');

  const visibleAlerts = useMemo(() => {
    if (activeTab === 'notifications') {
        return allAlerts.filter(a => ['Success', 'Warning', 'Rule Breached', 'Target Reached'].includes(a.type));
    }
    if(activeTab === 'insights') {
        return allAlerts.filter(a => ['Informational', 'Actionable Insight'].includes(a.type));
    }
     if(activeTab === 'gamification') {
        return allAlerts.filter(a => a.category === 'Gamification');
    }
    return [];
  }, [activeTab, allAlerts]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
        setSelectedIds(new Set(visibleAlerts.map(a => a.id)));
    } else {
        setSelectedIds(new Set());
    }
  }

  const handleSelect = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) newSelection.add(id);
    else newSelection.delete(id);
    setSelectedIds(newSelection);
  }

  const handleClearSelected = () => {
    clearAlerts(Array.from(selectedIds));
    setSelectedIds(new Set());
  };
  
  const unreadCounts = useMemo(() => ({
    notifications: allAlerts.filter(a => !a.seen && ['Success', 'Warning', 'Rule Breached', 'Target Reached'].includes(a.type)).length,
    insights: allAlerts.filter(a => !a.seen && ['Informational', 'Actionable Insight'].includes(a.type)).length,
    gamification: allAlerts.filter(a => !a.seen && a.category === 'Gamification').length,
  }), [allAlerts]);

  return (
    <Dialog open={open || isNotificationsOpen} onOpenChange={(isOpen) => { onOpenChange(isOpen); if (!isOpen) setSelectedIds(new Set()); }}>
      <DialogContent className="glassmorphic sm:max-w-[700px] h-[80vh] flex flex-col p-4">
        <DialogHeader className="p-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
              <Bell /> Notifications & Trading Coach
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="notifications" value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications">
                Notifications
                {unreadCounts.notifications > 0 && 
                    <span className="ml-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                       {unreadCounts.notifications}
                    </span>
                }
            </TabsTrigger>
            <TabsTrigger value="insights">
                Insights
                 {unreadCounts.insights > 0 && 
                    <span className="ml-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                       {unreadCounts.insights}
                    </span>
                }
            </TabsTrigger>
            <TabsTrigger value="gamification">
                Awards
                 {unreadCounts.gamification > 0 && 
                    <span className="ml-2 h-5 w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                       {unreadCounts.gamification}
                    </span>
                }
            </TabsTrigger>
          </TabsList>
          <ScrollArea className="py-2 flex-1 min-h-0 -mx-6 px-6">
            <TabsContent value="notifications">
                <NotificationsTab alerts={allAlerts} onDismiss={dismissAlert} onSelect={handleSelect} selectedIds={selectedIds} />
            </TabsContent>
            <TabsContent value="insights">
                <InsightsTab alerts={allAlerts} onDismiss={dismissAlert} onSelect={handleSelect} selectedIds={selectedIds} />
            </TabsContent>
            <TabsContent value="gamification">
                <GamificationTab alerts={allAlerts} onDismiss={dismissAlert} onSelect={handleSelect} selectedIds={selectedIds} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogFooter className="pt-2 border-t mt-auto flex justify-between items-center w-full">
             <div className="flex items-center space-x-2">
                 <Checkbox 
                    id="select-all-alerts" 
                    checked={visibleAlerts.length > 0 && selectedIds.size === visibleAlerts.length}
                    onCheckedChange={handleSelectAll}
                    disabled={visibleAlerts.length === 0}
                 />
                 <Label htmlFor="select-all-alerts" className="text-sm font-medium">Select All</Label>
             </div>
            {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" onClick={handleClearSelected}>
                    <Trash2 className="mr-2 h-4 w-4"/> Clear {selectedIds.size} Selected
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationsDialog;

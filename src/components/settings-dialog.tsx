
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ThemeSettings from './theme-settings';
import SoundSettings from './sound-settings';
import VisualSettings from './visual-settings';
import DatabaseSettings from './database-settings';
import { AppWindow, Brush, Database, FileText, SlidersHorizontal, Volume2, ShieldCheck, Palette, Goal, RotateCw, Smile, Edit } from 'lucide-react';
import ShortcutSettings from './shortcut-settings';
import CurrencySettings from './currency-settings';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import type { VisualSettings as VisualSettingsType } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComponent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { timezones } from '@/lib/timezones';
import { ScrollArea } from './ui/scroll-area';
import AnalysisSettings from './analysis-settings';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import KeywordEffectsSettings from './keyword-effects-settings';
import { Button } from './ui/button';
import { useMemo } from 'react';

const formatUtcToLocal = (utcTime: string, timeZone: string): string => {
    if (!utcTime || !timeZone) return "N/A";
    
    const [hours, minutes] = utcTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "Invalid Time";

    // Create a date object in UTC for today
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours, minutes));

    try {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZone: timeZone,
        }).format(date);
    } catch(e) {
        console.error(`Invalid timezone for formatting: ${timeZone}`);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} UTC`;
    }
};


const OtherSettingsPanel = () => {
    const { updateVisualSettings, appSettings, updateTradingPlan, activeJournal } = useJournalStore(state => ({
        updateVisualSettings: state.updateVisualSettings,
        appSettings: state.appSettings,
        updateTradingPlan: state.updateTradingPlan,
        activeJournal: state.journals.find(j => j.id === state.activeJournalId),
    }));

    const handleSettingChange = (key: keyof VisualSettingsType, value: any) => {
        updateVisualSettings({[key]: value});
    };
    
    if (!appSettings.visualSettings || !activeJournal?.plan) return null;

    return (
        <div className="space-y-4">
            <CurrencySettings />
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="text-lg">Chart Settings</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between">
                        <Label htmlFor="chart-zoom-toggle" className="flex items-center gap-2">Enable Chart Zoom Slider</Label>
                        <Switch id="chart-zoom-toggle" checked={appSettings.visualSettings.showChartZoomSlider} onCheckedChange={(v) => handleSettingChange('showChartZoomSlider', v)} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Show or hide the zoom slider at the bottom of charts.</p>
                </CardContent>
             </Card>
        </div>
    )
}


const SettingsDialog = ({ open, onOpenChange }: { open?: boolean, onOpenChange?: (open: boolean) => void }) => {
  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="glassmorphic sm:max-w-[700px] h-[90vh] flex flex-col p-4">
            <DialogHeader className="p-2">
              <DialogTitle className="text-lg">Settings</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="theme" className="w-full flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="theme" className="text-xs px-2 py-1 h-auto"><Palette className="mr-1 h-5 w-5"/>Theme</TabsTrigger>
                <TabsTrigger value="sound" className="text-xs px-2 py-1 h-auto"><Volume2 className="mr-1 h-5 w-5"/>Sound</TabsTrigger>
                <TabsTrigger value="visuals" className="text-xs px-2 py-1 h-auto"><AppWindow className="mr-1 h-5 w-5"/>Visuals</TabsTrigger>
                <TabsTrigger value="app-manager" className="text-xs px-2 py-1 h-auto"><SlidersHorizontal className="mr-1 h-5 w-5"/>App Manager</TabsTrigger>
              </TabsList>
              <div className="py-2 flex-1 min-h-0 overflow-y-auto pr-2">
                <TabsContent value="theme">
                    <ThemeSettings />
                </TabsContent>
                <TabsContent value="sound">
                     <SoundSettings />
                </TabsContent>
                <TabsContent value="visuals">
                     <VisualSettings />
                </TabsContent>
                <TabsContent value="app-manager" className="h-full">
                      <Tabs defaultValue="shortcuts" orientation="vertical" className="h-full grid grid-cols-[60px_1fr] gap-4">
                          <TooltipProvider>
                            <TabsList className="flex-col justify-start items-stretch sticky top-0 h-fit gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="shortcuts" className="h-12"><FileText /></TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Shortcuts</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="database" className="h-12"><Database /></TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Database</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="analysis" className="h-12"><Brush /></TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Analysis Options</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="emotions" className="h-12"><Smile /></TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Emotions & Keywords</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="other" className="h-12"><Goal /></TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="right"><p>Other Settings</p></TooltipContent>
                                </Tooltip>
                            </TabsList>
                          </TooltipProvider>
                          <div className="overflow-y-auto pr-2">
                            <TabsContent value="shortcuts" className="mt-0"><ShortcutSettings /></TabsContent>
                            <TabsContent value="database" className="mt-0"><DatabaseSettings /></TabsContent>
                            <TabsContent value="analysis" className="mt-0"><AnalysisSettings /></TabsContent>
                            <TabsContent value="emotions" className="mt-0"><KeywordEffectsSettings /></TabsContent>
                            <TabsContent value="other" className="mt-0">
                                <OtherSettingsPanel />
                            </TabsContent>
                          </div>
                      </Tabs>
                </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
      </Dialog>
  );
};

export default SettingsDialog;

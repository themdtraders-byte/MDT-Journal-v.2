
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Button } from './ui/button';
import { LayoutGrid, List, Columns, MousePointer2, Laptop, Smartphone, Monitor as Desktop, RotateCw } from 'lucide-react';
import type { VisualSettings as VisualSettingsType } from '@/types';
import { Combobox } from './ui/combobox';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import React from 'react';
import { useMemo } from 'react';


const fontFamilies = [
    { name: 'PT Sans', value: 'font-body' },
    { name: 'Inter', value: 'font-inter' },
    { name: 'Roboto', value: 'font-roboto' },
    { name: 'Lato', value: 'font-lato' },
    { name: 'Montserrat', value: 'font-montserrat' },
    { name: 'Source Code Pro', value: 'font-code' }
];

const LayoutCard = ({ title, icon: Icon, active, onClick }: { title: string, icon: React.ElementType, active: boolean, onClick: () => void }) => (
    <Card 
        className={cn(
            "p-3 text-center cursor-pointer transition-all", 
            active ? "ring-2 ring-primary bg-primary/10" : "bg-muted/50 hover:bg-muted"
        )}
        onClick={onClick}
    >
        <Icon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-semibold">{title}</p>
    </Card>
);

const VisualSettings = () => {
    const { updateVisualSettings, activeJournal, appSettings, resetVisualSettings } = useJournalStore(state => ({
        updateVisualSettings: state.updateVisualSettings,
        activeJournal: state.journals.find(j => j.id === state.activeJournalId),
        appSettings: state.appSettings,
        resetVisualSettings: state.resetVisualSettings,
    }));

  const visualSettings = useMemo(() => {
    // Corrected Logic: Prioritize journal-specific settings, but always fall back to global app settings.
    return activeJournal?.visualSettings || appSettings.visualSettings;
  }, [activeJournal?.visualSettings, appSettings.visualSettings]);

  const handleSettingChange = (key: keyof VisualSettingsType, value: any) => {
    updateVisualSettings({ [key]: value });
  };
  
  // This guard is now safe because visualSettings will always be populated by the fallback.
  if (!visualSettings) return null;

  return (
    <div className="space-y-6">
       <Card className="glassmorphic">
        <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Visual & Accessibility</CardTitle>
                <CardDescription>Adjust the look and feel of the application.</CardDescription>
              </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button variant="outline" size="sm"><RotateCw className="mr-2 h-4 w-4"/>Reset</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Reset Visual Settings?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will reset all visual settings (cursor, fonts, layout) to their original default values.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={resetVisualSettings}>Reset</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="accessibility-mode" className="flex items-center gap-2">Enable Accessibility Mode</Label>
              <Switch id="accessibility-mode" checked={visualSettings.accessibilityMode} onCheckedChange={(v) => handleSettingChange('accessibilityMode', v)} />
            </div>
            <p className="text-xs text-muted-foreground">Applies a high-contrast theme, increases UI scale, and disables animations for better readability.</p>
            
            <div className="flex items-center justify-between pt-4 border-t">
              <Label htmlFor="custom-cursor-toggle" className="flex items-center gap-2"><MousePointer2 className="h-4 w-4"/> Advanced Cursor</Label>
              <Switch id="custom-cursor-toggle" checked={visualSettings.useCustomCursor} onCheckedChange={(v) => handleSettingChange('useCustomCursor', v)} />
            </div>
             <p className="text-xs text-muted-foreground">Toggles the custom animated cursor for a more immersive experience. May impact performance on some systems.</p>
        </CardContent>
      </Card>

      <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="text-lg">Font Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label>Font Family</Label>
                <Combobox
                    options={fontFamilies.map(f => ({ value: f.value, label: f.name }))}
                    value={visualSettings.fontFamily}
                    onChange={(v) => handleSettingChange('fontFamily', v)}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div>
                    <Label>Font Size: {Math.round(16 * (visualSettings.uiScale / 100))}px</Label>
                    <Slider 
                        value={[visualSettings.uiScale]}
                        min={75}
                        max={150}
                        step={5}
                        onValueChange={(v) => handleSettingChange('uiScale', v[0])}
                    />
                </div>
                 <div>
                    <Label>Line Height: {visualSettings.lineHeight.toFixed(2)}</Label>
                    <Slider 
                        value={[visualSettings.lineHeight]}
                        min={1.2}
                        max={2.0}
                        step={0.05}
                        onValueChange={(v) => handleSettingChange('lineHeight', v[0])}
                    />
                </div>
                 <div>
                    <Label>Letter Spacing: {visualSettings.letterSpacing.toFixed(3)}em</Label>
                    <Slider 
                        value={[visualSettings.letterSpacing]}
                        min={-0.05}
                        max={0.1}
                        step={0.005}
                        onValueChange={(v) => handleSettingChange('letterSpacing', v[0])}
                    />
                </div>
             </div>
        </CardContent>
      </Card>
      
       <Card className="glassmorphic">
        <CardHeader>
          <CardTitle className="text-lg">Application Layout Style</CardTitle>
          <CardDescription>Select the overall layout style for the application interface.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
             <LayoutCard
                title="Desktop"
                icon={Desktop}
                active={visualSettings.dashboardLayout === 'desktop'}
                onClick={() => handleSettingChange('dashboardLayout', 'desktop')}
            />
            <LayoutCard
                title="Mobile"
                icon={Smartphone}
                active={visualSettings.dashboardLayout === 'mobile'}
                onClick={() => handleSettingChange('dashboardLayout', 'mobile')}
            />
            <LayoutCard
                title="Mac"
                icon={Laptop}
                active={visualSettings.dashboardLayout === 'mac'}
                onClick={() => handleSettingChange('dashboardLayout', 'mac')}
            />
        </CardContent>
      </Card>
    </div>
  );
};

export default VisualSettings;


'use client';

import { useJournalStore } from '@/hooks/use-journal-store';
import { playSound } from '@/hooks/use-sound-player';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Play, RotateCw } from 'lucide-react';
import type { SoundSettings as SoundSettingsType } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useMemo } from 'react';

const SoundSettings = () => {
    const { updateSoundSettings, activeJournal, resetSoundSettings, appSettings, updateAppSettings } = useJournalStore(state => ({
        updateSoundSettings: state.updateSoundSettings,
        activeJournal: state.journals.find(j => j.id === state.activeJournalId),
        appSettings: state.appSettings,
        resetSoundSettings: state.resetSoundSettings,
    }));
    
    const soundSettings = useMemo(() => {
        // Corrected Logic: Prioritize journal-specific settings, but always fall back to global app settings.
        return activeJournal?.soundSettings || appSettings.soundSettings;
    }, [activeJournal?.soundSettings, appSettings.soundSettings]);
    
    const isJournalSpecific = !!activeJournal?.soundSettings;

    const handleUpdate = (settings: Partial<SoundSettingsType>) => {
        // If editing journal-specific settings, update the journal. Otherwise, update global app settings.
        if(isJournalSpecific) {
            updateSoundSettings(settings);
        } else {
            updateAppSettings({ soundSettings: { ...(appSettings.soundSettings || {}), ...settings }});
        }
    }

    // This guard is now safe because soundSettings will always be populated by the fallback.
    if (!soundSettings) return null;

    const handleVolumeChange = (value: number[]) => {
        handleUpdate({ volume: value[0] });
    };

    const handleToggleEffect = (key: keyof SoundSettingsType['effects']) => {
        handleUpdate({
            effects: {
                ...(soundSettings.effects || {}),
                [key]: !soundSettings.effects[key],
            }
        });
    };

    const handleToggleMaster = (enabled: boolean) => {
        handleUpdate({ enabled });
    };

    const soundEffectOptions: { key: keyof SoundSettingsType['effects']; label: string; soundType: 'click' | 'notification' | 'error' | 'success' | 'undo' | 'redo' | 'delete' }[] = [
        { key: 'click', label: 'Button Clicks', soundType: 'click' },
        { key: 'notification', label: 'Notification Alerts', soundType: 'notification' },
        { key: 'error', label: 'Error Sounds', soundType: 'error' },
        { key: 'success', label: 'Success Sounds', soundType: 'success' },
        { key: 'undo', label: 'Undo Action', soundType: 'undo' },
        { key: 'redo', label: 'Redo Action', soundType: 'redo' },
        { key: 'delete', label: 'Delete Action', soundType: 'delete' },
    ];

    return (
        <div className="space-y-6">
            <Card className="glassmorphic">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg">Master Sound Control</CardTitle>
                            <CardDescription>Globally enable or disable all application sounds and set the master volume.</CardDescription>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="outline" size="sm"><RotateCw className="mr-2 h-4 w-4"/>Reset</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Reset Sound Settings?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will reset all sound settings to their original defaults.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={resetSoundSettings}>Reset</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="master-sound-toggle">Enable All Sounds</Label>
                        <Switch id="master-sound-toggle" checked={soundSettings.enabled} onCheckedChange={handleToggleMaster} />
                    </div>
                    <div className="flex items-center gap-4">
                        <Label className="w-24">Volume: {soundSettings.volume}%</Label>
                        <Slider
                            value={[soundSettings.volume]}
                            max={100}
                            step={1}
                            onValueChange={handleVolumeChange}
                            disabled={!soundSettings.enabled}
                            onValueCommit={() => playSound('click')}
                        />
                    </div>
                </CardContent>
            </Card>
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="text-lg">Sound Effects</CardTitle>
                    <CardDescription>Individually toggle specific sound effects throughout the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {soundEffectOptions.map(option => (
                         <div key={option.key} className="flex items-center justify-between">
                            <Label htmlFor={option.key}>{option.label}</Label>
                            <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => playSound(option.soundType)} disabled={!soundSettings.enabled}>
                                <Play className="h-4 w-4"/>
                            </Button>
                            <Switch id={option.key} checked={soundSettings.effects[option.key]} onCheckedChange={() => handleToggleEffect(option.key)} disabled={!soundSettings.enabled} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
};

export default SoundSettings;


'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import type { TradingPlanData } from '@/types';
import { Card, CardContent } from '../ui/card';
import { Label } from './label';
import { Trash2 } from 'lucide-react';

const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

const formatTo12Hour = (time24: string): string => {
    if (!time24) return "Invalid Time";
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const paddedMinutes = String(minutes).padStart(2, '0');
    return `${String(hours12).padStart(2, '0')}:${paddedMinutes} ${ampm}`;
};

const TOTAL_BLOCKS = 288; // 24 * 12 (5-minute intervals)

interface CircularTimeSelectorProps {
    sessions: TradingPlanData['sessions'];
    activeHours: { start: string; end: string }[];
    noTradeZones: { start: string; end: string }[];
    onActiveHoursChange: (hours: { start: string; end: string }[]) => void;
    onNoTradeZonesChange: (zones: { start: string; end: string }[]) => void;
    isMasterEditor?: boolean;
    activeMasterSession?: 'Asian' | 'London' | 'New York';
    masterSessionTimings?: TradingPlanData['sessionTimings'];
    onMasterTimeChange?: (newTime: { start: string, end: string }) => void;
}


const sessionConfig: { [key: string]: { color: string; colorHex: string; } } = {
    'Asian': { color: 'bg-orange-500', colorHex: '#f97316' },
    'London': { color: 'bg-blue-500', colorHex: '#3b82f6' },
    'New York': { color: 'bg-purple-500', colorHex: '#8b5cf6' },
};

export default function CircularTimeSelector({ 
    sessions, activeHours, noTradeZones, onActiveHoursChange, onNoTradeZonesChange, 
    isMasterEditor = false, activeMasterSession, masterSessionTimings, onMasterTimeChange 
}: CircularTimeSelectorProps) {
    const [activeSelectionMode, setActiveSelectionMode] = useState<'Active Hours' | 'No Trading' | null>('Active Hours');
    const [firstClickBlock, setFirstClickBlock] = useState<number | null>(null);
    const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);

    const timeBlocks = useMemo(() => {
        const blocks = [];
        for (let i = 0; i < TOTAL_BLOCKS; i++) {
            const minutes = i * 5;
            blocks.push({ 
                index: i, 
                time: `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
            });
        }
        return blocks;
    }, []);

    const handleBlockClick = (blockIndex: number) => {
        if (firstClickBlock === null) {
            setFirstClickBlock(blockIndex);
        } else {
            let start = firstClickBlock;
            let end = blockIndex;
            
            // This logic is now corrected. If a user clicks 5pm then 1am, start will be 17:00 and end will be 01:00.
            // We do NOT reorder them, as that would imply a daytime range. The order of clicks matters for overnight ranges.
            
            const newTimeRange = { 
                start: timeBlocks[start].time, 
                end: timeBlocks[end].time 
            };

            if (isMasterEditor && onMasterTimeChange) {
                onMasterTimeChange(newTimeRange);
            } else if (!isMasterEditor) {
                if (activeSelectionMode === 'Active Hours') {
                    onActiveHoursChange([...activeHours, newTimeRange]);
                } else if (activeSelectionMode === 'No Trading') {
                    onNoTradeZonesChange([...noTradeZones, newTimeRange]);
                }
            }

            setFirstClickBlock(null);
            setHoveredBlock(null);
        }
    };
    
    
    const getBlockInfo = (blockIndex: number): { style: React.CSSProperties, className: string } => {
        const style: React.CSSProperties = { position: 'relative' };
        let className = 'bg-muted/20'; // Neutral
        const blockTime = blockIndex * 5;

        // Determine base background color for Active/No-Trade zones
        const isInActive = activeHours.some(zone => {
            let startMins = timeToMinutes(zone.start);
            let endMins = timeToMinutes(zone.end);
            if (endMins < startMins) return blockTime >= startMins || blockTime <= endMins;
            return blockTime >= startMins && blockTime <= endMins;
        });

        const isNoTrade = noTradeZones.some(zone => {
            let startMins = timeToMinutes(zone.start);
            let endMins = timeToMinutes(zone.end);
            if (endMins < startMins) return blockTime >= startMins || blockTime <= endMins;
            return blockTime >= startMins && blockTime <= endMins;
        });

        if (isInActive) className = 'bg-green-500/80';
        if (isNoTrade) className = 'bg-red-500/80';
        
        // Session Borders (always apply)
        const activeUnderlyingSessions = (Object.keys(masterSessionTimings || {}) as Array<keyof typeof masterSessionTimings>)
            .filter(sessionName => {
                const timing = masterSessionTimings?.[sessionName];
                if (!timing) return false;
                let startTime = timeToMinutes(timing.start);
                let endTime = timeToMinutes(timing.end);
                if (endTime < startTime) {
                    return blockTime >= startTime || blockTime <= endTime;
                }
                return blockTime >= startTime && blockTime <= endTime;
            });

        if (activeUnderlyingSessions.length > 0) {
            const colors = activeUnderlyingSessions.map(s => sessionConfig[s]?.colorHex || '#888');
            if (colors.length === 1) {
                style.borderBottom = `3px solid ${colors[0]}`;
            } else {
                style.borderImage = `linear-gradient(to right, ${colors.join(', ')}) 1`;
                style.borderBottom = '3px solid';
                style.borderImageSlice = '1';
            }
        }
        
        // Preview selection
        if (firstClickBlock !== null && hoveredBlock !== null) {
            let start = firstClickBlock;
            let end = hoveredBlock;
            
            const previewColor = isMasterEditor ? sessionConfig[activeMasterSession!]?.colorHex : (activeSelectionMode === 'Active Hours' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))');
            
            let inPreview = false;
            // Corrected logic to handle preview for overnight ranges
            if (start > end) { // This signifies a wrap-around (e.g., 22:00 to 02:00)
                if (blockIndex >= start || blockIndex <= end) {
                    inPreview = true;
                }
            } else { // Normal same-day range
                if (blockIndex >= start && blockIndex <= end) {
                    inPreview = true;
                }
            }

            if(inPreview) {
                style.background = previewColor;
                style.opacity = 0.7;
            }
        }
        
        if (firstClickBlock === blockIndex) {
            style.outline = '2px solid white';
        }

        return { style, className };
    };
    
    const clearSelections = () => {
        onActiveHoursChange([]);
        onNoTradeZonesChange([]);
    }

    const removeZone = (list: 'active' | 'no-trade', indexToRemove: number) => {
        if (list === 'active') {
            onActiveHoursChange(activeHours.filter((_, index) => index !== indexToRemove));
        } else {
            onNoTradeZonesChange(noTradeZones.filter((_, index) => index !== indexToRemove));
        }
    }


    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex justify-between items-center w-full">
                 <div className="flex gap-2 flex-wrap">
                    {!isMasterEditor && (
                         <>
                            <Button
                                variant={activeSelectionMode === 'Active Hours' ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => setActiveSelectionMode('Active Hours')}
                                className={cn('shadow-sm')}
                            >
                                Select Active Hours
                            </Button>
                            <Button
                                variant={activeSelectionMode === 'No Trading' ? 'destructive' : 'outline'}
                                size="sm"
                                onClick={() => setActiveSelectionMode('No Trading')}
                            >
                                Select No-Trade Zone
                            </Button>
                        </>
                    )}
                </div>
                 <div className="flex items-center gap-4 text-xs">
                    {Object.entries(sessionConfig).map(([name, config]) => (
                        <div key={name} className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colorHex }} />
                            <span>{name}</span>
                        </div>
                    ))}
                 </div>
            </div>

            <div className="relative w-full aspect-[2/1] max-w-full rounded-lg p-2 bg-muted/50 border">
                 <div className="grid grid-cols-24 gap-px w-full h-full">
                     {timeBlocks.map(({ index, time }) => {
                        const isHour = index % 12 === 0;
                        const blockInfo = getBlockInfo(index);
                         return (
                         <TooltipProvider key={index} delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div 
                                        className={cn("relative flex items-center justify-center transition-opacity", blockInfo.className)}
                                        style={blockInfo.style}
                                        onClick={() => handleBlockClick(index)}
                                        onMouseEnter={() => setHoveredBlock(index)}
                                        onMouseLeave={() => setHoveredBlock(null)}
                                    >
                                         <span className={cn(
                                            "absolute text-foreground/70 pointer-events-none text-center leading-none",
                                            isHour ? "font-bold text-[10px]" : "font-normal text-[7px]"
                                        )}>
                                             {isHour ? time : time.split(':')[1]}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{formatTo12Hour(time)}</p></TooltipContent>
                            </Tooltip>
                         </TooltipProvider>
                     )})}
                 </div>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                     <div className="text-center bg-background/50 backdrop-blur-sm p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                            {isMasterEditor ? `Editing ${activeMasterSession} Session` : (activeSelectionMode ? `Editing ${activeSelectionMode}` : 'Select a mode above')}
                        </p>
                        {firstClickBlock !== null && (
                             <p className="text-xs font-bold animate-pulse">
                                {formatTo12Hour(timeBlocks[firstClickBlock].time)} - Click to set end time
                            </p>
                        )}
                    </div>
                </div>
            </div>
            
            {!isMasterEditor && (
                 <Card className="w-full glassmorphic">
                    <CardContent className="p-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/20">
                                <Label className="font-semibold">Active Trading Hours</Label>
                            </div>
                            <div className="space-y-1 mt-1">
                                {activeHours.map((zone, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm p-2 pl-4 rounded-md bg-green-500/20">
                                        <span className="font-mono text-xs">{formatTo12Hour(zone.start)} - {formatTo12Hour(zone.end)}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeZone('active', index)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <div className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/20">
                                <Label className="font-semibold">No-Trade Zones</Label>
                            </div>
                            <div className="space-y-1 mt-1">
                                {noTradeZones.map((zone, index) => (
                                    <div key={index} className="flex items-center justify-between text-sm p-2 pl-4 rounded-md bg-red-500/20">
                                        <span className="font-mono text-xs">{formatTo12Hour(zone.start)} - {formatTo12Hour(zone.end)}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeZone('no-trade', index)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end col-span-1 md:col-span-2">
                            <Button variant="ghost" size="sm" onClick={clearSelections}>
                                <Trash2 className="h-4 w-4 mr-2"/> Clear All Selections
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

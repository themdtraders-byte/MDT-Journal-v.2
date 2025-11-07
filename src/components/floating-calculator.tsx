
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronsUpDown, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJournalStore } from '@/hooks/use-journal-store';
import LotSizeCalculator from './calculators/lot-size-calculator';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import RiskRewardCalculator from './calculators/risk-reward-calculator';
import PositionSizeCalculator from './calculators/position-size-calculator';
import CompoundingCalculator from './calculators/compounding-calculator';
import { BarChart, DollarSign, TrendingUp, Wallet } from './icons';
import { useSidebar } from './ui/sidebar';

const MIN_WIDTH = 380;
const MIN_HEIGHT = 450;

const FloatingCalculator = () => {
    const { isCalculatorOpen, toggleCalculator } = useJournalStore(state => ({
        isCalculatorOpen: state.isCalculatorOpen,
        toggleCalculator: state.toggleCalculator,
    }));
    const { state: sidebarState } = useSidebar();
    
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 420, height: 550 });
    const [isMaximized, setIsMaximized] = useState(false);
    
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });

    const isResizing = useRef<string | null>(null);
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    // Effect to set initial position once on mount
    useEffect(() => {
        if(panelRef.current) {
            const initialX = window.innerWidth - size.width - 60; // 60px offset from right
            const initialY = 100;
            setPosition({ x: initialX, y: initialY });
        }
    }, []);
    
    const handleToggleMaximize = () => setIsMaximized(prev => !prev);
    
    // --- Drag Logic ---
    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isMaximized) return;
        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        initialPos.current = { x: position.x, y: position.y };
        e.preventDefault();
    };

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (!isDragging || isMaximized) return;
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        setPosition({
            x: initialPos.current.x + dx,
            y: initialPos.current.y + dy,
        });
    }, [isDragging, isMaximized]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // --- Resize Logic ---
    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current || isMaximized) return;
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        
        let newWidth = resizeStart.current.width;
        let newHeight = resizeStart.current.height;
        let newX = position.x;
        let newY = position.y;

        if (isResizing.current.includes('right')) newWidth = Math.max(MIN_WIDTH, resizeStart.current.width + dx);
        if (isResizing.current.includes('left')) {
            newWidth = Math.max(MIN_WIDTH, resizeStart.current.width - dx);
            newX = initialPos.current.x + dx;
        }
        if (isResizing.current.includes('bottom')) newHeight = Math.max(MIN_HEIGHT, resizeStart.current.height + dy);
        if (isResizing.current.includes('top')) {
            newHeight = Math.max(MIN_HEIGHT, resizeStart.current.height - dy);
            newY = initialPos.current.y + dy;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
        
    }, [isMaximized, position.x, position.y]);

    const handleResizeEnd = useCallback(() => {
        isResizing.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    }, [handleResizeMove]);
    
    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>, direction: string) => {
        if (isMaximized) return;
        e.preventDefault();
        e.stopPropagation();
        isResizing.current = direction;
        initialPos.current = { x: position.x, y: position.y };
        resizeStart.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    };

    // Global listeners for drag/resize
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);


    const finalStyle: React.CSSProperties = isMaximized
      ? {
          position: 'fixed',
          left: `var(--sidebar-width-icon)`,
          top: '0px',
          width: `calc(100% - var(--sidebar-width-icon))`,
          height: 'auto',
          maxHeight: '80vh',
          transform: 'none',
          transition: 'width 0.3s ease-in-out, left 0.3s ease-in-out',
        }
      : {
          position: 'fixed',
          width: `${size.width}px`,
          height: `${size.height}px`,
          left: `${position.x}px`,
          top: `${position.y}px`,
        };

    const resizeHandles = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top', 'bottom', 'left', 'right'];
    const cursorClasses: { [key: string]: string } = {
        'top-left': 'cursor-nwse-resize', 'bottom-right': 'cursor-nwse-resize',
        'top-right': 'cursor-nesw-resize', 'bottom-left': 'cursor-nesw-resize',
        'top': 'cursor-ns-resize', 'bottom': 'cursor-ns-resize',
        'left': 'cursor-ew-resize', 'right': 'cursor-ew-resize',
    };

    if (!isCalculatorOpen) {
        return null;
    }

    return (
        <div ref={panelRef} style={finalStyle} className="z-[60]">
            <Card className={cn("glassmorphic h-full w-full flex flex-col shadow-2xl relative transition-all duration-300", isMaximized && "rounded-b-lg rounded-t-none")}>
                <CardHeader
                    onMouseDown={handleDragStart}
                    className={cn(
                        "flex flex-row items-center justify-between p-2 rounded-t-lg bg-muted/30",
                        !isMaximized && "cursor-grab active:cursor-grabbing"
                    )}
                >
                    <div className="flex items-center gap-1 font-semibold text-sm">
                        <ChevronsUpDown className="h-4 w-4" />
                        Calculators
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleToggleMaximize} onMouseDown={e => e.stopPropagation()}>
                            {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleCalculator} onMouseDown={e => e.stopPropagation()}><X className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-2 flex-1 flex flex-col min-h-0">
                    <Tabs defaultValue="lot-size" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="lot-size"><DollarSign className="mr-2 h-4 w-4"/>Lot Size</TabsTrigger>
                            <TabsTrigger value="risk-reward"><TrendingUp className="mr-2 h-4 w-4"/>R:R</TabsTrigger>
                            <TabsTrigger value="position-sizing"><Wallet className="mr-2 h-4 w-4"/>Position</TabsTrigger>
                            <TabsTrigger value="compounding"><BarChart className="mr-2 h-4 w-4"/>Compound</TabsTrigger>
                        </TabsList>
                        <ScrollArea className="flex-1 mt-2">
                            <div className="p-1">
                            <TabsContent value="lot-size" className="mt-0">
                                <LotSizeCalculator />
                            </TabsContent>
                                <TabsContent value="risk-reward" className="mt-0">
                                <RiskRewardCalculator />
                            </TabsContent>
                            <TabsContent value="position-sizing" className="mt-0">
                                <PositionSizeCalculator />
                            </TabsContent>
                            <TabsContent value="compounding" className="mt-0">
                                <CompoundingCalculator />
                            </TabsContent>
                            </div>
                        </ScrollArea>
                    </Tabs>
                </CardContent>

                {!isMaximized && resizeHandles.map(dir => (
                    <div
                        key={dir}
                        onMouseDown={e => handleResizeStart(e, dir)}
                        className={cn(
                            "absolute bg-transparent z-10",
                            cursorClasses[dir],
                            (dir.includes('top') || dir.includes('bottom')) && 'h-2 left-1 right-1',
                            (dir.includes('left') || dir.includes('right')) && 'w-2 top-1 bottom-1',
                            dir.includes('top') && 'top-0',
                            dir.includes('bottom') && 'bottom-0',
                            dir.includes('left') && 'left-0',
                            dir.includes('right') && 'right-0',
                            (dir.length > 5) && 'w-3 h-3',
                        )}
                    />
                ))}
            </Card>
        </div>
    )
}

const FloatingCalculatorContainer = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => { setIsClient(true); }, []);
    
    if (!isClient) return null;
    
    return <FloatingCalculator />;
};

export default FloatingCalculatorContainer;

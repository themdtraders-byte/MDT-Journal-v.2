
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ChevronsUpDown, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Combobox } from './ui/combobox';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 400;

const FloatingChecklistDialog = () => {
    const { isChecklistOpen, toggleChecklist, appSettings } = useJournalStore(state => ({
        isChecklistOpen: state.isChecklistOpen,
        toggleChecklist: state.toggleChecklist,
        appSettings: state.appSettings,
    }));
    
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 380, height: 500 });
    const [isMaximized, setIsMaximized] = useState(false);
    
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });

    const isResizing = useRef<string | null>(null);
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });
    const panelRef = useRef<HTMLDivElement>(null);
    
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
    const [selectedListId, setSelectedListId] = useState<string | null>(null);

    const validationLists = appSettings.validationLists || [];

    useEffect(() => {
        if (validationLists.length > 0 && !selectedListId) {
            setSelectedListId(validationLists[0].id);
        }
    }, [validationLists, selectedListId]);


    useEffect(() => {
        if(panelRef.current) {
            const initialX = window.innerWidth - size.width - 300; 
            const initialY = 120;
            setPosition({ x: initialX, y: initialY });
        }
    }, []);
    
    const handleToggleMaximize = () => setIsMaximized(prev => !prev);
    
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

    const handleDragEnd = useCallback(() => setIsDragging(false), []);

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

    if (!isChecklistOpen) {
        return null;
    }

    const handleCheckItem = (itemId: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };
    
    const selectedList = validationLists.find(list => list.id === selectedListId);

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
                        Execution Checklists
                    </div>
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleToggleMaximize} onMouseDown={e => e.stopPropagation()}>
                            {isMaximized ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleChecklist} onMouseDown={e => e.stopPropagation()}><X className="h-4 w-4" /></Button>
                    </div>
                </CardHeader>
                <CardContent className="p-2 flex-1 flex flex-col min-h-0">
                   <div className="mb-2">
                     <Combobox
                        options={validationLists.map(l => ({ value: l.id, label: l.title }))}
                        value={selectedListId || ''}
                        onChange={(id) => setSelectedListId(id)}
                        placeholder="Select a checklist..."
                     />
                   </div>
                   <ScrollArea className="flex-1">
                        {selectedList ? (
                             <div className="space-y-2 p-1">
                                {selectedList.items.map(item => {
                                    const isChecked = !!checkedItems[item.id];
                                    return (
                                        <div key={item.id} className="relative flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                                            <Checkbox
                                                id={item.id}
                                                checked={isChecked}
                                                onCheckedChange={() => handleCheckItem(item.id)}
                                            />
                                            <Label htmlFor={item.id} className={cn("text-sm font-normal cursor-pointer transition-all", isChecked && "opacity-50 grayscale")}>
                                                {item.text}
                                            </Label>
                                            {isChecked && (
                                                <div className="absolute left-8 right-0 h-0.5 bg-red-500/80 transform -rotate-1" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                <p className="text-sm">No validation lists found.</p>
                                <p className="text-xs mt-1">You can create checklists in Settings -> App Manager -> Validation Lists.</p>
                            </div>
                        )}
                   </ScrollArea>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setCheckedItems({})}
                        className="mt-2"
                        disabled={Object.keys(checkedItems).length === 0}
                    >
                        Reset Checklist
                    </Button>
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

const FloatingChecklistDialogContainer = () => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    if (!isClient) return null;
    return <FloatingChecklistDialog />;
};

export default FloatingChecklistDialogContainer;

    
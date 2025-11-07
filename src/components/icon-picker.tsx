
'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { icons } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';

interface IconPickerProps {
    selectedIcon: string;
    onIconChange: (icon: string) => void;
}

const IconPicker = ({ selectedIcon, onIconChange }: IconPickerProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    
    const LucideIcon = (icons as any)[selectedIcon] || icons.FileText;
    
    const filteredIcons = Object.keys(icons).filter(key => 
        key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                    <LucideIcon className="mr-2 h-5 w-5" />
                    <span>{selectedIcon}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <div className="p-2 border-b">
                    <Input
                        placeholder="Search icons..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="h-8"
                    />
                </div>
                <ScrollArea className="h-64">
                    <div className="grid grid-cols-6 gap-1 p-2">
                        {filteredIcons.map(iconName => {
                            const IconComponent = (icons as any)[iconName];
                            return (
                                <Button
                                    key={iconName}
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        onIconChange(iconName);
                                        setIsOpen(false);
                                    }}
                                >
                                    <IconComponent className="h-5 w-5" />
                                </Button>
                            )
                        })}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}

export default IconPicker;

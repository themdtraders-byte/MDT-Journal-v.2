
'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { TimePickerAnalog } from './time-picker-analog';

interface TimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatTimeForDisplay = (time: string | undefined) => {
    if (!time) return 'Select time';
    const [hour, minute] = time.split(':').map(Number);
    if (isNaN(hour) || isNaN(minute)) return 'Invalid time';

    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(
      2,
      '0'
    )} ${period}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal h-7 text-xs',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-3 w-3" />
          {formatTimeForDisplay(value)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <TimePickerAnalog
          time={value}
          setTime={(newTime) => {
            onChange?.(newTime);
            setIsOpen(false);
          }}
          onCancel={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}

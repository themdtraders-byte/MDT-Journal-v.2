
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, startOfWeek, subDays, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, Check, ChevronsUpDown, PlusCircle } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Button } from './ui/button';

export const SegmentedProgressBar = ({
  values,
  colors,
  total,
}: {
  values: number[];
  colors: string[];
  total: number;
}) => {
  return (
    <div className="flex w-full h-2 rounded-full overflow-hidden bg-muted">
      {values.map((value, index) => {
        if (value === 0) return null;
        const percentage = (value / total) * 100;
        return (
          <div
            key={index}
            className={cn("h-full transition-all duration-500", colors[index % colors.length])}
            style={{ width: `${percentage}%` }}
          />
        );
      })}
    </div>
  );
};


export const compressImage = (file: File, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL(file.type, quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => {
        reject(error);
      }
    };
     reader.onerror = (error) => {
        reject(error);
    }
  });
};

export const numberToString = (val: number | undefined | null) => (val === undefined || val === null ? '' : String(val));
export const partialsToString = (partials: { id?: string, lotSize: number; price: number }[] | undefined) => 
    (partials || []).map(p => ({ id: p.id || crypto.randomUUID(), lotSize: numberToString(p.lotSize), price: numberToString(p.price) }));
export const layersToString = (layers: { id?: string, lotSize: number; entryPrice: number; closingPrice: number; stopLoss: number; takeProfit: number; }[] | undefined) =>
    (layers || []).map(l => ({ 
        id: l.id || crypto.randomUUID(),
        lotSize: numberToString(l.lotSize),
        entryPrice: numberToString(l.entryPrice),
        closingPrice: numberToString(l.closingPrice),
        stopLoss: numberToString(l.stopLoss),
        takeProfit: numberToString(l.takeProfit),
    }));

    

    

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Input } from './input';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

interface TimePickerAnalogProps {
  time?: string; // Expects "HH:mm" or "HH:mm:ss"
  setTime: (time: string) => void;
  onCancel: () => void;
}

const parseTime = (timeString?: string) => {
  if (!timeString) {
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
    };
  }
  const [h, m] = timeString.split(':').map(Number);
  return {
    hour: isNaN(h) ? 0 : h,
    minute: isNaN(m) ? 0 : m,
  };
};

export const TimePickerAnalog = ({
  time,
  setTime,
  onCancel,
}: TimePickerAnalogProps) => {
  const initialTime = useMemo(() => parseTime(time), [time]);
  const [hour, setHour] = useState(initialTime.hour);
  const [minute, setMinute] = useState(initialTime.minute);
  const [view, setView] = useState<'hours' | 'minutes'>('hours');
  const clockRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const newTime = parseTime(time);
    setHour(newTime.hour);
    setMinute(newTime.minute);
    // Don't reset view on external time change to allow for typing.
  }, [time]);

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newHour12 = parseInt(e.target.value, 10);
    if (isNaN(newHour12)) newHour12 = 0;
    if (newHour12 > 12) newHour12 = 12;
    if (newHour12 < 1) newHour12 = 1;
    
    let finalHour24 = newHour12;
    if (period === 'PM' && newHour12 !== 12) {
      finalHour24 += 12;
    } else if (period === 'AM' && newHour12 === 12) {
      finalHour24 = 0;
    }
    setHour(finalHour24);
  };
  
  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newMinute = parseInt(e.target.value, 10);
    if (isNaN(newMinute)) newMinute = 0;
    if (newMinute > 59) newMinute = 59;
    if (newMinute < 0) newMinute = 0;
    setMinute(newMinute);
  };


  const handleSetTime = () => {
    setTime(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  };

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    if (newPeriod === period) return;
    if (newPeriod === 'PM' && hour < 12) {
      setHour(hour + 12);
    } else if (newPeriod === 'AM' && hour >= 12) {
      setHour(hour - 12);
    }
  };

  const getAngle = (value: number, type: 'hours' | 'minutes') => {
    const factor = type === 'hours' ? 360 / 12 : 360 / 60;
    return value * factor;
  };

  const handleClockInteraction = (
    e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>
  ) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (view === 'hours') {
      let newHour = Math.round(angle / 30);
      if (newHour === 0) newHour = 12;
      
      let finalHour = newHour;
      if (period === 'PM' && newHour !== 12) {
        finalHour += 12;
      } else if (period === 'AM' && newHour === 12) {
        finalHour = 0;
      }
      setHour(finalHour);
      setTimeout(() => setView('minutes'), 200);

    } else {
      const newMinute = Math.round(angle / 6);
      setMinute(newMinute >= 60 ? 0 : newMinute);
    }
  };
  
  const hourAngle = getAngle(displayHour, 'hours');
  const minuteAngle = getAngle(minute, 'minutes');

  return (
    <div className="w-56 p-2 bg-background rounded-lg shadow-lg">
      <div className="text-xs text-muted-foreground mb-2">SELECT TIME</div>
       <div className="flex items-center justify-center gap-1 text-4xl font-mono mb-3">
         <Input
          value={String(displayHour).padStart(2, '0')}
          onChange={handleHourChange}
          onClick={() => setView('hours')}
          className={cn('w-16 text-center h-auto p-0 border-2 text-3xl font-mono', view === 'hours' ? 'border-primary' : 'border-transparent')}
        />
        <div className="text-primary">:</div>
        <Input
          value={String(minute).padStart(2, '0')}
          onChange={handleMinuteChange}
          onClick={() => setView('minutes')}
          className={cn('w-16 text-center h-auto p-0 border-2 text-3xl font-mono', view === 'minutes' ? 'border-primary' : 'border-transparent')}
        />
        <div className="flex flex-col gap-1 ml-1">
            <Button size="xs" variant={period === 'AM' ? 'secondary' : 'outline'} onClick={() => handlePeriodChange('AM')}>AM</Button>
            <Button size="xs" variant={period === 'PM' ? 'secondary' : 'outline'} onClick={() => handlePeriodChange('PM')}>PM</Button>
        </div>
      </div>

      <div className="relative w-40 h-40 mx-auto">
        <svg
          ref={clockRef}
          viewBox="0 0 200 200"
          className="w-full h-full cursor-pointer"
          onMouseDown={handleClockInteraction}
        >
          <circle cx="100" cy="100" r="98" fill="hsl(var(--muted))" />
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i + 1) * 30;
            const x = 100 + 80 * Math.sin((angle * Math.PI) / 180);
            const y = 100 - 80 * Math.cos((angle * Math.PI) / 180);
            return (
              <text
                key={i} x={x} y={y} dy="0.35em"
                textAnchor="middle" className="text-[10px] font-sans fill-muted-foreground"
              >
                {i + 1}
              </text>
            );
          })}
          
           {/* Hands */}
          {view === 'hours' && (
            <g>
                <line x1="100" y1="100" x2={100 + 50 * Math.sin(hourAngle * Math.PI/180)} y2={100 - 50 * Math.cos(hourAngle * Math.PI/180)} className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
                <circle cx={100 + 50 * Math.sin(hourAngle * Math.PI/180)} cy={100 - 50 * Math.cos(hourAngle * Math.PI/180)} r="12" className="fill-primary" />
                <text x={100 + 50 * Math.sin(hourAngle * Math.PI/180)} y={100 - 50 * Math.cos(hourAngle * Math.PI/180)} dy="0.35em" textAnchor="middle" className="fill-primary-foreground font-bold text-sm">{displayHour}</text>
            </g>
          )}

          {view === 'minutes' && (
             <g>
                <line x1="100" y1="100" x2={100 + 70 * Math.sin(minuteAngle * Math.PI/180)} y2={100 - 70 * Math.cos(minuteAngle * Math.PI/180)} className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
                <circle cx={100 + 70 * Math.sin(minuteAngle * Math.PI/180)} cy={100 - 70 * Math.cos(minuteAngle * Math.PI/180)} r="12" className="fill-primary" />
                 <text x={100 + 70 * Math.sin(minuteAngle * Math.PI/180)} y={100 - 70 * Math.cos(minuteAngle * Math.PI/180)} dy="0.35em" textAnchor="middle" className="fill-primary-foreground font-bold text-xs">{minute}</text>
            </g>
          )}
          
          <circle cx="100" cy="100" r="4" className="fill-primary" />
        </svg>
      </div>
      
      <div className="flex justify-end gap-2 mt-2">
        <Button variant="ghost" onClick={onCancel} size="sm">
          Cancel
        </Button>
        <Button onClick={handleSetTime} size="sm">OK</Button>
      </div>
    </div>
  );
};

    
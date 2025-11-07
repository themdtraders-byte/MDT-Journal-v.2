
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import FormattedNumber from '@/components/ui/formatted-number';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  isPositive?: boolean;
  className?: string;
  layout?: 'default' | 'bar-gauge' | 'winrate-gauge' | 'circle-gauge' | 'dual-bar-gauge' | 'custom';
  gaugeValue?: number;
  gaugeMax?: number;
  winCount?: number;
  lossCount?: number;
  neutralCount?: number;
  valueClassName?: string;
  minW?: boolean;
  tradeCount?: number;
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 180) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
    return d;
}

const ProfitLossBarGauge = ({ value, max }: { value: number; max: number }) => {
    const profitPercentage = max > 0 ? (value / max) * 100 : 0;
    
    return (
        <div className="w-full h-1.5 rounded-full bg-[hsl(var(--grad-destructive-end))] overflow-hidden">
            <div 
                className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-[hsl(var(--grad-green-start))] to-[hsl(var(--grad-green-end))]" 
                style={{ width: `${profitPercentage}%`}}
            />
        </div>
    );
};

const WinrateGauge = ({ win, loss, neutral }: { win: number, loss: number, neutral: number }) => {
    const total = win + loss + neutral;
    if (total === 0) {
        return (
             <div className="relative w-20 h-10">
                <svg className="w-full h-full" viewBox="0 0 100 50">
                    <path d={describeArc(50, 50, 40, 0, 180)} className="stroke-muted/30" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round"/>
                </svg>
             </div>
        );
    }
    
    const winPercent = (win / total) * 100;
    const neutralPercent = (neutral / total) * 100;

    const winAngle = (winPercent / 100) * 180;
    const neutralAngle = winAngle + ((neutralPercent / 100) * 180);

    return (
        <div className="relative w-20 h-10">
            <svg className="w-full h-full" viewBox="0 0 100 50">
                <defs>
                    <linearGradient id="winGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--grad-green-start))" />
                        <stop offset="100%" stopColor="hsl(var(--grad-green-end))" />
                    </linearGradient>
                     <linearGradient id="lossGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--grad-destructive-start))" />
                        <stop offset="100%" stopColor="hsl(var(--grad-destructive-end))" />
                    </linearGradient>
                </defs>
                {/* Background Red for Loss */}
                <path d={describeArc(50, 50, 40, 0, 180)} stroke="url(#lossGradient)" strokeWidth="6" fill="none" strokeLinecap="round"/>
                
                {/* Neutral segment */}
                <path d={describeArc(50, 50, 40, winAngle, neutralAngle)} className="stroke-sky-500" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round"/>

                {/* Win segment */}
                <path d={describeArc(50, 50, 40, 0, winAngle)} stroke="url(#winGradient)" strokeWidth="6" fill="none" strokeLinecap="round"/>
            </svg>
            <div className="absolute bottom-[-12px] w-full flex justify-between px-1 text-[7px] font-semibold">
                <span className="text-green-500">{win}</span>
                <span className="text-destructive">{loss}</span>
            </div>
             <div className="absolute bottom-0 w-full text-center text-[8px] font-bold text-muted-foreground">{total}</div>
        </div>
    )
}

const CircleGauge = ({ value, max }: { value: number; max: number }) => {
    const profitPercentage = max > 0 ? (value / max) * 100 : 0;
    const circumference = 2 * Math.PI * 16; // r=16
    const profitOffset = circumference - (profitPercentage / 100) * circumference;

    return (
        <div className="relative w-10 h-10">
             <svg className="w-full h-full" viewBox="0 0 40 40">
                <defs>
                    <linearGradient id="circleWinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--grad-green-start))" />
                        <stop offset="100%" stopColor="hsl(var(--grad-green-end))" />
                    </linearGradient>
                     <linearGradient id="circleLossGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--grad-destructive-start))" />
                        <stop offset="100%" stopColor="hsl(var(--grad-destructive-end))" />
                    </linearGradient>
                </defs>
                <circle stroke="url(#circleLossGradient)" strokeWidth="6" fill="transparent" r="16" cx="20" cy="20" />
                 <circle
                    className="transition-all duration-500"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={profitOffset}
                    strokeLinecap="round"
                    stroke="url(#circleWinGradient)"
                    fill="transparent"
                    r="16"
                    cx="20"
                    cy="20"
                    transform="rotate(-90 20 20)"
                />
            </svg>
        </div>
    )
}

const DualBarGauge = ({ profit, loss }: { profit: number; loss: number }) => {
    const maxHeightValue = Math.max(profit, loss, 1);
    const profitHeight = (profit / maxHeightValue) * 100;
    const lossHeight = (loss / maxHeightValue) * 100;
    
    return (
        <div className="flex items-end h-7 gap-1">
            <div className="w-3 bg-gradient-to-t from-[hsl(var(--grad-green-start))] to-[hsl(var(--grad-green-end))] rounded-t-sm transition-all duration-500" style={{height: `${profitHeight}%`}}/>
            <div className="w-3 bg-gradient-to-t from-[hsl(var(--grad-destructive-start))] to-[hsl(var(--grad-destructive-end))] rounded-t-sm transition-all duration-500" style={{height: `${lossHeight}%`}} />
        </div>
    )
}

const FormattedValue = ({ value, isMonetary = false, suffix = '' }: { value: string | number, isMonetary?: boolean, suffix?: string }) => {
    if (isMonetary) {
        return <FormattedNumber value={Number(value)} />;
    }
    
    if (typeof value === 'number') {
        if (Number.isInteger(value)) {
            return <span className="font-mono">{value}{suffix}</span>;
        }
        value = value.toFixed(2);
    }

    const parts = String(value).split('.');
    if (parts.length === 2 && !String(value).endsWith('%')) {
        return (
            <span className="font-mono">
                <span>{parts[0]}</span>
                <span className="opacity-50">.{parts[1]}</span>
                {suffix}
            </span>
        );
    }
    return <span className="font-mono">{value}{suffix}</span>;
}

const StatCard = ({ title, value, icon, isPositive, className, layout = 'default', gaugeValue = 0, gaugeMax = 1, winCount = 0, lossCount = 0, neutralCount = 0, valueClassName, minW, tradeCount }: StatCardProps) => {
  const valueColor = isPositive === undefined 
    ? 'text-foreground' 
    : isPositive 
    ? 'text-green-500' 
    : 'text-red-500';

  const isMonetary = typeof value === 'number' && (title.includes("P/L") || title.includes("Capital") || title.includes("Balance") || title.includes("Expectancy"));
  
  if (layout === 'circle-gauge') {
    return (
         <Card className={cn('p-2 glassmorphic flex items-center justify-between group', className)}>
            <div className="flex-1 text-center">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn('text-base font-bold', valueColor, valueClassName)}><FormattedValue value={value} /></div>
            </div>
            <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-125">
                 <CircleGauge value={gaugeValue} max={gaugeMax} />
            </div>
        </Card>
    )
  }

  if (layout === 'bar-gauge') {
    return (
         <Card className={cn('p-2 glassmorphic flex flex-col justify-center group', className)}>
            <div className="flex-1 text-center mb-1.5">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                 <div className={cn('text-base font-bold', valueColor, valueClassName)}><FormattedValue value={value} isMonetary={isMonetary} /></div>
            </div>
            <div className="w-full">
                <ProfitLossBarGauge value={gaugeValue} max={gaugeMax} />
            </div>
        </Card>
    )
  }
  
  if (layout === 'winrate-gauge') {
    return (
         <Card className={cn('p-2 glassmorphic flex items-center group', className)}>
            <div className="flex-1 text-center">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn('text-lg font-bold', valueColor, valueClassName)}><FormattedValue value={value} /></div>
            </div>
            <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-125">
                <WinrateGauge win={winCount} loss={lossCount} neutral={neutralCount} />
            </div>
        </Card>
    )
  }

  if (layout === 'dual-bar-gauge') {
      return (
        <Card className={cn('p-2 glassmorphic flex items-center justify-between group', className)}>
            <div className="flex-1 text-center">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn('text-lg font-bold', valueColor, valueClassName)}><FormattedValue value={value} isMonetary={isMonetary} /></div>
            </div>
            <div className="flex-shrink-0 transition-transform duration-300 group-hover:scale-125">
                 <DualBarGauge profit={gaugeValue} loss={gaugeMax} />
            </div>
        </Card>
      )
  }

  if (layout === 'custom') {
    return (
         <Card className={cn('text-center glassmorphic p-1 bg-background/50 flex flex-col items-center justify-center flex-shrink-0 min-w-[120px] group', minW && 'min-w-[140px]', className)}>
            <CardHeader className="p-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground flex flex-col items-center justify-center gap-0.5">
                    <div className="flex items-center justify-center h-5 w-5 transition-transform duration-300 group-hover:scale-125">{icon}</div>
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className={cn('text-base font-bold', valueColor, valueClassName)}>
                    <FormattedValue value={value} isMonetary={isMonetary} suffix={typeof value === 'string' && value.includes('%') ? '' : ''}/>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className={cn('text-center glassmorphic p-1 bg-background/50 flex flex-col items-center justify-center flex-shrink-0 group', minW ? 'min-w-[140px]' : 'min-w-[120px]', className)}>
      <CardHeader className="p-0">
        <CardTitle className="text-xs font-semibold text-muted-foreground flex flex-col items-center justify-center gap-0.5">
          <div className="flex items-center justify-center h-5 w-5 transition-transform duration-300 group-hover:scale-125">{icon}</div>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className={cn('text-base font-bold', valueColor, valueClassName)}>
            <FormattedValue value={value} isMonetary={isMonetary} suffix={typeof value === 'string' && value.includes('%') ? '' : ''}/>
        </div>
        {tradeCount !== undefined && <p className="text-[9px] text-muted-foreground leading-tight">({tradeCount})</p>}
      </CardContent>
    </Card>
  );
};

export default StatCard;

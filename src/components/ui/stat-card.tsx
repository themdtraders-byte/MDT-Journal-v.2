
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import FormattedNumber from '@/components/ui/formatted-number';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  icon?: React.ReactNode;
  positive?: boolean;
  className?: string;
  valueClassName?: string;
  tooltip?: React.ReactNode;
  gradientColor?: 'purple' | 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'cyan' | 'gold' | 'default';
  layout?: 'default' | 'custom';
  tradeCount?: number;
  minW?: boolean; // Added this prop back
  unit?: string;
  isMonetary?: boolean;
  showPercentage?: boolean;
}

const gradientStyles: Record<string, { radial: string; color: string; iconBg: string, glow: string }> = {
    purple: { radial: 'from-purple-500/20', color: 'text-purple-400', iconBg: 'bg-gradient-to-br from-purple-500/50 to-fuchsia-500/50', glow: 'custom-glow-purple' },
    blue: { radial: 'from-blue-500/20', color: 'text-blue-400', iconBg: 'bg-gradient-to-br from-blue-500/50 to-cyan-500/50', glow: 'custom-glow-blue' },
    green: { radial: 'from-green-500/20', color: 'text-green-400', iconBg: 'bg-gradient-to-br from-green-500/50 to-emerald-500/50', glow: 'custom-glow-green' },
    orange: { radial: 'from-orange-500/20', color: 'text-orange-400', iconBg: 'bg-gradient-to-br from-orange-500/50 to-amber-500/50', glow: 'custom-glow-orange' },
    red: { radial: 'from-red-500/20', color: 'text-red-400', iconBg: 'bg-gradient-to-br from-red-500/50 to-rose-500/50', glow: 'custom-glow-red' },
    yellow: { radial: 'from-yellow-400/20', color: 'text-yellow-400', iconBg: 'bg-gradient-to-br from-yellow-400/50 to-amber-400/50', glow: 'custom-glow-yellow' },
    cyan: { radial: 'from-cyan-400/20', color: 'text-cyan-400', iconBg: 'bg-gradient-to-br from-cyan-400/50 to-sky-400/50', glow: 'custom-glow-cyan' },
    gold: { radial: 'from-amber-400/20', color: 'text-amber-400', iconBg: 'bg-gradient-to-br from-amber-500/50 to-yellow-500/50', glow: 'custom-glow-gold' },
    default: { radial: 'from-gray-500/20', color: 'text-gray-400', iconBg: 'bg-gradient-to-br from-gray-500/50 to-gray-700/50', glow: 'custom-glow-default' },
};


const StatCard = ({ label, value, subValue, icon, positive, className, valueClassName, tooltip, gradientColor = 'default', layout = 'default', minW, unit, isMonetary, showPercentage }: StatCardProps) => {
  const styles = gradientStyles[gradientColor] || gradientStyles.default;

  if (layout === 'custom') {
    const valueColor = positive === undefined ? styles.color : (positive ? styles.color : 'text-red-400');
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
                'custom-stat-card relative rounded-lg group transition-all duration-300 flex items-center justify-start p-2 gap-2 text-left bg-background/50 overflow-hidden flex-shrink-0', 
                minW && 'min-w-[140px]',
                styles.glow, className
            )}>
              <div className={cn("relative z-10 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center", styles.iconBg)}>
                  {icon}
              </div>
              <div className="relative z-10 flex flex-col justify-center leading-none overflow-hidden">
                <p className="text-[9px] font-semibold text-muted-foreground truncate">{label}</p>
                <div className={cn('text-sm font-bold truncate', valueColor, valueClassName)}>
                    {typeof value === 'number' && isMonetary 
                        ? <FormattedNumber value={value} showPercentage={showPercentage} />
                        : <>{value}{unit}</>
                    }
                </div>
              </div>
            </div>
          </TooltipTrigger>
          {tooltip && (
            <TooltipContent>
              {typeof tooltip === 'string' ? <p>{tooltip}</p> : tooltip}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback for default stat card
  const valueColorDefault = positive === undefined 
    ? 'text-foreground' 
    : positive 
    ? 'text-green-500' 
    : 'text-red-500';

  return (
     <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className={cn('text-center glassmorphic p-1 bg-background/50 flex flex-col items-center justify-center flex-shrink-0 group', minW ? 'min-w-[140px]' : 'min-w-[120px]', className)}>
              <CardHeader className="p-0">
                <CardTitle className="text-xs font-semibold text-muted-foreground flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center justify-center h-5 w-5 transition-transform duration-300 group-hover:scale-125">{icon}</div>
                  <span>{label}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className={cn('text-sm font-bold', valueColorDefault, valueClassName)}>
                    {value}
                    {unit && <span className="text-xs font-normal ml-0.5">{unit}</span>}
                </div>
                {subValue && <p className="text-[10px] text-muted-foreground leading-tight">{subValue}</p>}
              </CardContent>
            </Card>
          </TooltipTrigger>
          {tooltip && (
            <TooltipContent>
              {typeof tooltip === 'string' ? <p>{tooltip}</p> : tooltip}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
  );
};

export default StatCard;

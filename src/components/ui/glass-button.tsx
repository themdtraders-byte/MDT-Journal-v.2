
'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { playSound } from '@/hooks/use-sound-player';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  gradient?: 'green' | 'blue' | 'purple' | 'yellow' | 'cyan' | 'gold' | 'destructive' | 'default';
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, gradient = 'default', onClick, ...props }, ref) => {

    const gradientClasses = {
        green: 'from-[hsl(var(--grad-green-start))] to-[hsl(var(--grad-green-end))]',
        blue: 'from-[hsl(var(--grad-blue-start))] to-[hsl(var(--grad-blue-end))]',
        purple: 'from-[hsl(var(--grad-purple-start))] to-[hsl(var(--grad-purple-end))]',
        yellow: 'from-[hsl(var(--grad-yellow-start))] to-[hsl(var(--grad-yellow-end))]',
        cyan: 'from-[hsl(var(--grad-cyan-start))] to-[hsl(var(--grad-cyan-end))]',
        gold: 'from-[hsl(var(--grad-gold-start))] to-[hsl(var(--grad-gold-end))]',
        destructive: 'from-[hsl(var(--grad-destructive-start))] to-[hsl(var(--grad-destructive-end))]',
        default: 'from-[hsl(var(--grad-default-start))] to-[hsl(var(--grad-default-end))]',
    };
    
    const glowClasses = {
       green: 'hover:shadow-[0_0_15px_3px_hsl(var(--grad-green-start)/0.6)]',
       blue: 'hover:shadow-[0_0_15px_3px_hsl(var(--grad-blue-start)/0.6)]',
       purple: 'hover:shadow-[0_0_15px_3px_hsl(var(--grad-purple-start)/0.6)]',
       yellow: 'hover:shadow-[0_0_15px_3px_hsl(var(--grad-yellow-start)/0.6)]',
       cyan: 'hover:shadow-[0_0_15px_3px_hsl(var(--grad-cyan-start)/0.6)]',
       gold: 'hover:shadow-[0_0_15px_3px_hsl(var(--grad-gold-start)/0.6)]',
       destructive: 'hover:shadow-[0_0_15px_3px_hsl(var(--grad-destructive-start)/0.6)]',
       default: 'hover:shadow-[0_0_15px_3px_hsl(var(--grad-default-start)/0.6)]',
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        playSound('click');
        if(onClick) {
            onClick(e);
        }
    };

    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center p-0.5 overflow-visible text-sm font-medium text-foreground rounded-lg group cursor-pointer transition-all duration-300",
          "bg-gradient-to-br",
          gradientClasses[gradient],
          "focus:ring-4 focus:outline-none focus:ring-primary/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          glowClasses[gradient],
          className
        )}
        onClick={handleClick}
        {...props}
      >
        <div className="absolute inset-0.5 bg-background/80 group-hover:bg-opacity-50 transition-all ease-in duration-75 rounded-md backdrop-blur-sm" />
        <span className={cn("icon-glow relative px-2 py-1.5 flex items-center justify-center gap-1 [&>svg]:transition-transform [&>svg]:duration-300 group-hover:[&>svg]:scale-125")}>
          {children}
        </span>
      </button>
    );
  }
);
GlassButton.displayName = 'GlassButton';

export default GlassButton;


import { cn } from '@/lib/utils';
import React from 'react';

const Timeline = ({ className, children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn('flex flex-col', className)} {...props}>
        {children}
    </ol>
);

const TimelineItem = ({ className, children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className={cn('relative flex w-full', className)} {...props}>
        {children}
    </li>
);

const TimelineConnector = ({ isComplete, isActive }: { isComplete?: boolean, isActive?: boolean }) => (
    <div className="h-auto w-12 flex-shrink-0 flex justify-center">
        <div className="w-0.5 bg-border transition-all duration-500 relative overflow-hidden">
            <div className={cn(
                'absolute top-0 left-0 h-full w-full bg-primary transition-transform duration-500 ease-in-out',
                (isComplete || isActive) ? 'translate-y-0' : '-translate-y-full',
                isActive && 'animate-glow-line'
            )} />
        </div>
    </div>
);

const TimelineDot = ({ className, children, isComplete, isActive, ...props }: React.HTMLAttributes<HTMLDivElement> & { isComplete?: boolean, isActive?: boolean }) => (
    <div className={cn(
        'h-12 w-12 rounded-full border-2 bg-background flex items-center justify-center transition-all duration-300 relative',
        isComplete && 'bg-primary border-primary text-primary-foreground',
        isActive && 'border-primary ring-4 ring-primary/20',
        className
    )} {...props}>
        {children}
    </div>
);

const TimelineContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('py-4 pl-4 flex-grow', className)} {...props}>
        {children}
    </div>
);

const TimelineHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex items-center gap-4', className)} {...props}>
        {children}
    </div>
);

const TimelineTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('font-semibold text-lg', className)} {...props}>
        {children}
    </h3>
);

export { Timeline, TimelineItem, TimelineConnector, TimelineDot, TimelineContent, TimelineHeader, TimelineTitle };

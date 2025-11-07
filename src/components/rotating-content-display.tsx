
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import './ui/rotating-text.css';

type ContentItem = {
    type: 'quote' | 'tip' | 'note' | 'advice';
    text: string;
    author?: string;
    title?: string;
};

type RotatingContentDisplayProps = {
    location?: 'header' | 'footer';
    contentTypes: Array<'quote' | 'tip' | 'note' | 'advice'>;
};

const RotatingContentDisplay = ({ location = 'header', contentTypes }: RotatingContentDisplayProps) => {
    const { appSettings } = useJournalStore();
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [animationClass, setAnimationClass] = useState('fade-in');

    const allContent = useMemo(() => {
        if (!appSettings) return []; // Guard clause to prevent crash

        const content: ContentItem[] = [];

        if (contentTypes.includes('quote') && appSettings.quotes) {
            content.push(...appSettings.quotes.map(q => ({ type: 'quote' as const, text: q.quote, author: q.author })));
        }
        if (contentTypes.includes('tip') && appSettings.tips) {
            content.push(...appSettings.tips.map(t => ({ type: 'tip' as const, text: t.text })));
        }
        if (contentTypes.includes('note') && appSettings.notes) {
            content.push(...appSettings.notes.map(n => ({ type: 'note' as const, text: n.content.replace(/<[^>]+>/g, ''), title: n.title })));
        }
        if (contentTypes.includes('advice') && appSettings.advice) {
            content.push(...appSettings.advice.map(a => ({ type: 'advice' as const, text: a.text })));
        }
        return content;
    }, [appSettings, contentTypes]);
    
    const currentItem = allContent[currentItemIndex];

    useEffect(() => {
        if (allContent.length > 0) {
            setCurrentItemIndex(Math.floor(Math.random() * allContent.length));
        }
    }, [allContent.length]);

    useEffect(() => {
        if (allContent.length < 2) return;

        const intervalId = setInterval(() => {
            setAnimationClass('fade-out');
            setTimeout(() => {
                setCurrentItemIndex(prevIndex => {
                    let newIndex;
                    do {
                        newIndex = Math.floor(Math.random() * allContent.length);
                    } while (newIndex === prevIndex && allContent.length > 1);
                    return newIndex;
                });
                setAnimationClass('fade-in');
            }, 1000); 
        }, 180000); // 3 minutes

        return () => clearInterval(intervalId);
    }, [allContent.length]);


    if (!currentItem) return null;

    const isNote = currentItem.type === 'note';
    const prefix = isNote ? `${currentItem.title || 'Note'}: ` : `${currentItem.type.charAt(0).toUpperCase() + currentItem.type.slice(1)}: `;
    const mainText = `"${currentItem.text}"`;
    const authorText = currentItem.author ? ` - ${currentItem.author}` : '';

    const typeClass = `highlight-${currentItem.type}`;
    
    return (
        <div className={cn("w-full h-full flex items-center justify-center overflow-hidden", animationClass)}>
            <div
                className={cn(
                    "p-1 rounded-md text-xs",
                    typeClass
                )}
            >
                <span className="content-type-prefix font-semibold">{prefix}</span>
                <span className="font-normal">{mainText}</span>
                {authorText && <span className="opacity-50">{authorText}</span>}
            </div>
        </div>
    );
};

export default RotatingContentDisplay;

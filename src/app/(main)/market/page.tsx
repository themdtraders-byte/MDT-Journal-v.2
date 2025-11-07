
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, MoreVertical, PlusCircle, Trash2, Edit } from 'lucide-react';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import MarketLinkEditorDialog from '@/components/market-link-editor-dialog';
import { useJournalStore } from '@/hooks/use-journal-store';
import type { MarketLink } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { BullIcon } from '@/components/icons/flat/BullIcon';
import TickerTapeWidget from '@/components/ticker-tape-widget';
import { Combobox } from '@/components/ui/combobox';
import { tradingViewSymbolMap } from '@/lib/data';

const TechnicalAnalysisWidget = ({ symbol }: { symbol: string }) => {
    const { theme } = useTheme();
    const widgetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!widgetRef.current || !symbol) return;

        widgetRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "colorTheme": theme === 'dark' ? 'dark' : 'light',
            "displayMode": "single",
            "isTransparent": false,
            "locale": "en",
            "interval": "15m",
            "width": "100%",
            "height": 450,
            "symbol": symbol,
            "showIntervalTabs": true
        });

        widgetRef.current.appendChild(script);

    }, [theme, symbol]);

    if (!symbol) return <div className="h-[450px] w-full flex items-center justify-center bg-muted/50 rounded-lg"><p>Select an instrument to view analysis.</p></div>;

    return (
        <div className="tradingview-widget-container" style={{ height: '450px', width: '100%' }}>
            <div ref={widgetRef} className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
        </div>
    );
};

const EconomicCalendarWidget = () => {
    const { theme } = useTheme();
    const widgetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!widgetRef.current) return;
        widgetRef.current.innerHTML = ''; 

        const script = document.createElement('script');
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
        script.async = true;
        script.innerHTML = JSON.stringify({
            "colorTheme": theme === 'dark' ? 'dark' : 'light',
            "isTransparent": false,
            "locale": "en",
            "countryFilter": "ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu",
            "importanceFilter": "-1,0,1",
            "width": "100%",
            "height": "450"
        });
        widgetRef.current.appendChild(script);
    }, [theme]);

    return (
         <div className="tradingview-widget-container" style={{ height: '450px', width: '100%' }}>
            <div ref={widgetRef} className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
        </div>
    );
};


const defaultMarketLinks: Omit<MarketLink, 'id'>[] = [
    { name: 'TradingView', url: 'https://www.tradingview.com/', description: 'Advanced charting tools and social network for traders.' },
    { name: 'FastBull', url: 'https://www.fastbull.com/', description: 'Real-time financial news and market analysis.' },
    { name: 'Forex Factory', url: 'https://www.forexfactory.com/', description: 'Economic calendar, news, and forums for forex traders.' },
    { name: 'FX Street', url: 'https://www.fxstreet.com/', description: 'Forex news, rates, charts, and analysis.' },
    { name: 'FX Replay', url: 'https://www.fxreplay.com/', description: 'Practice trading with historical data and replay functionality.' },
    { name: 'Traders Casa', url: 'https://app.traderscasa.com/', description: 'Community and resources for traders.' },
];

const Favicon = ({ url }: { url: string }) => {
    try {
        const domain = new URL(url).hostname;
        if (domain.includes('traderscasa.com')) {
            return <BullIcon className="h-8 w-8" />;
        }
        const iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        
        return (
            <div className="w-8 h-8 flex items-center justify-center">
                 <Image src={iconUrl} alt={`${domain} favicon`} width={32} height={32} className="object-contain" />
            </div>
        );
    } catch (e) {
        return <ExternalLink className="h-6 w-6 text-muted-foreground"/>;
    }
}

export default function MarketPage() {
    const { appSettings, addMarketLink, updateMarketLink, deleteMarketLink, journals, activeJournalId } = useJournalStore(state => ({
        appSettings: state.appSettings,
        addMarketLink: state.addMarketLink,
        updateMarketLink: state.updateMarketLink,
        deleteMarketLink: state.deleteMarketLink,
        journals: state.journals,
        activeJournalId: state.activeJournalId,
    }));
    const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingLink, setEditingLink] = useState<MarketLink | null>(null);
    const [selectedSymbol, setSelectedSymbol] = useState<string>('OANDA:XAUUSD');

    const instrumentOptions = useMemo(() => {
        if (!appSettings) return [];
        return Object.keys(appSettings.pairsConfig)
            .filter(pair => tradingViewSymbolMap[pair]) // Only show pairs we can map
            .map(pair => ({
                value: tradingViewSymbolMap[pair].proName,
                label: pair
            }));
    }, [appSettings]);

    const handleCreateNew = () => {
        setEditingLink(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (link: MarketLink) => {
        setEditingLink(link);
        setIsEditorOpen(true);
    };

    const handleDelete = (linkId: string) => {
        if (activeJournal?.id) {
        deleteMarketLink(linkId);
        }
    };
    
    const handleSave = (linkData: Omit<MarketLink, 'id'> | MarketLink) => {
        if ('id' in linkData) {
        updateMarketLink(linkData);
        } else {
        addMarketLink(linkData);
        }
    };

    const customLinks = activeJournal?.marketLinks || [];
    
    const allLinks = useMemo(() => [
        ...defaultMarketLinks.map((link, index) => ({ ...link, id: `default-${index}`, isDefault: true })),
        ...customLinks
    ], [customLinks]);

  return (
    <div className="space-y-6">
        <TickerTapeWidget />
       <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold">Web tools</h1>
       </div>
       
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glassmorphic">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Technical Analysis</CardTitle>
                    <div className="w-48">
                         <Combobox
                            options={instrumentOptions}
                            value={selectedSymbol}
                            onChange={setSelectedSymbol}
                            placeholder="Select Instrument..."
                            className="h-8 text-xs"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <TechnicalAnalysisWidget symbol={selectedSymbol} />
                </CardContent>
            </Card>
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="text-base">Economic Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                    <EconomicCalendarWidget />
                </CardContent>
            </Card>
        </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {allLinks.map((link, index) => (
            <Card key={link.id} className="interactive-card h-full flex flex-col group">
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-grow flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center text-base">
                            <div className="flex items-center gap-3">
                                <Favicon url={link.url} />
                                <span className="flex-1">{link.name}</span>
                            </div>
                            <ExternalLink className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:scale-125 opacity-50 group-hover:opacity-100"/>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground text-xs">{link.description}</p>
                    </CardContent>
                </a>
                 {!(link as any).isDefault && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEdit(link as MarketLink)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action will permanently delete the "{link.name}" link.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(link.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                 )}
            </Card>
        ))}
        <Card className="interactive-card h-full flex flex-col items-center justify-center cursor-pointer border-dashed group" onClick={handleCreateNew}>
             <CardHeader>
                <CardTitle className="flex flex-col items-center gap-2">
                    <PlusCircle className="h-8 w-8 text-muted-foreground transition-transform duration-300 group-hover:scale-125"/>
                    <span className="text-base">Add New</span>
                </CardTitle>
            </CardHeader>
        </Card>
       </div>
       <MarketLinkEditorDialog 
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        link={editingLink}
        onSave={handleSave}
       />
    </div>
  );
}



'use client';

import { useState } from 'react';
import { useJournalStore } from '@/hooks/use-journal-store';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import type { KeywordScoreEffect, KeywordScoreEffectType } from '@/types';
import { Combobox } from './ui/combobox';
import { Input } from './ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

const KeywordEffectsSettings = () => {
    const { appSettings, updateAppSettings } = useJournalStore();
    const { toast } = useToast();
    
    const keywordScores = appSettings.keywordScores || [];

    const [newKeyword, setNewKeyword] = useState('');
    const [newKeywordType, setNewKeywordType] = useState<'Sentiment' | 'Keyword'>('Keyword');
    const [newKeywordEffect, setNewKeywordEffect] = useState<KeywordScoreEffectType>('Positive');


    const handleEffectChange = (keyword: string, newEffect: KeywordScoreEffectType) => {
        const updatedScores = keywordScores.map(item => 
            item.keyword === keyword ? { ...item, impact: newEffect } : item
        );
        updateAppSettings({ keywordScores: updatedScores });
    };

    const handleAddKeyword = () => {
        if (!newKeyword.trim()) {
            toast({ title: "Keyword is required", variant: "destructive" });
            return;
        }
        if (keywordScores.some(k => k.keyword.toLowerCase() === newKeyword.trim().toLowerCase())) {
            toast({ title: "Keyword already exists", variant: "destructive" });
            return;
        }

        const newKeywordItem: KeywordScoreEffect = {
            keyword: newKeyword.trim(),
            type: newKeywordType,
            impact: newKeywordEffect
        };

        updateAppSettings({ keywordScores: [...keywordScores, newKeywordItem] });
        setNewKeyword('');
        toast({ title: "Keyword added successfully" });
    };

    const handleDeleteKeyword = (keyword: string) => {
        const updatedScores = keywordScores.filter(item => item.keyword !== keyword);
        updateAppSettings({ keywordScores: updatedScores });
        toast({ title: "Keyword removed" });
    }

    const sentimentKeywords = keywordScores.filter(k => k.type === 'Sentiment');
    const noteKeywords = keywordScores.filter(k => k.type === 'Keyword');

    const KeywordTable = ({ items }: { items: KeywordScoreEffect[] }) => (
        <div className="space-y-2">
            {items.map(item => (
                <div key={item.keyword} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span className="font-medium text-sm">{item.keyword}</span>
                    <div className="flex items-center gap-2">
                        <Combobox
                            options={[
                                { value: 'Positive', label: 'Positive (+)' },
                                { value: 'Negative', label: 'Negative (-)' },
                            ]}
                            value={item.impact}
                            onChange={(v) => handleEffectChange(item.keyword, v as KeywordScoreEffectType)}
                            className="w-[140px] h-8 text-xs"
                        />
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteKeyword(item.keyword)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="text-lg">Keyword & Sentiment Scoring</CardTitle>
                <CardDescription>Configure how specific words found in your sentiments and trade notes affect the discipline score.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="sentiments">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="sentiments">Sentiments</TabsTrigger>
                        <TabsTrigger value="keywords">Note Keywords</TabsTrigger>
                    </TabsList>
                    <ScrollArea className="h-64 mt-4 pr-2">
                        <TabsContent value="sentiments">
                            <KeywordTable items={sentimentKeywords} />
                        </TabsContent>
                        <TabsContent value="keywords">
                            <KeywordTable items={noteKeywords} />
                        </TabsContent>
                    </ScrollArea>
                     <div className="mt-4 pt-4 border-t space-y-2">
                        <h4 className="font-semibold text-sm">Add New Keyword/Sentiment</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input 
                                placeholder="New keyword..."
                                value={newKeyword}
                                onChange={e => setNewKeyword(e.target.value)}
                            />
                            <Combobox
                                options={[
                                    { value: 'Keyword', label: 'Note Keyword' },
                                    { value: 'Sentiment', label: 'Sentiment' }
                                ]}
                                value={newKeywordType}
                                onChange={(v) => setNewKeywordType(v as 'Keyword' | 'Sentiment')}
                            />
                             <Combobox
                                options={[
                                    { value: 'Positive', label: 'Positive' },
                                    { value: 'Negative', label: 'Negative' },
                                ]}
                                value={newKeywordEffect}
                                onChange={(v) => setNewKeywordEffect(v as KeywordScoreEffectType)}
                            />
                        </div>
                        <Button size="sm" onClick={handleAddKeyword}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default KeywordEffectsSettings;

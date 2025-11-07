
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Calendar, Clock, DollarSign, ClipboardList, Target, CheckCircle, ShieldCheck, TrendingUp, Newspaper, HandCoins } from '@/components/icons';
import type { Suggestion, SuggestionDetailProps } from '@/types';
import SuggestionDetail from './suggestion-detail';
import { useJournalStore } from '@/hooks/use-journal-store';

interface SuggestionComparisonCardProps {
    suggestion: Suggestion & {
        best: SuggestionDetailProps | null;
        worst: SuggestionDetailProps | null;
    };
}

const categoryIcons: Record<string, React.ElementType> = {
    'Session': Clock,
    'Day': Calendar,
    'Hour': Clock,
    'Pair': DollarSign,
    'Strategy': ClipboardList,
    'Indicator': TrendingUp,
    'Liquidity': Target,
    'Entry Reason': CheckCircle,
    'Zone': ShieldCheck,
    'Day of Month': Calendar,
    'Week of Month': Calendar,
    'Direction': TrendingUp,
    'Lot Size': HandCoins,
    'News Event': Newspaper,
    'Sentiment (Before)': Brain,
    'Sentiment (During)': Brain,
    'Sentiment (After)': Brain,
};

const SuggestionComparisonCard = ({ suggestion }: SuggestionComparisonCardProps) => {
    const { category, best, worst } = suggestion;
    const Icon = categoryIcons[category] || Brain;

    return (
        <Card className="glassmorphic interactive-card group">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Icon className="text-primary h-5 w-5 transition-transform duration-300 group-hover:scale-125"/> 
                    {category} Performance
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center justify-around gap-4">
                {best ? (
                     <SuggestionDetail {...best} />
                ) : (
                    <p className="text-muted-foreground text-sm">Not enough data.</p>
                )}

                {worst && (
                     <>
                        <p className="font-bold text-muted-foreground">VS</p>
                        <SuggestionDetail {...worst} />
                    </>
                )}
               
            </CardContent>
        </Card>
    );
};

export default SuggestionComparisonCard;

  
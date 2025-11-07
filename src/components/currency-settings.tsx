
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useJournalStore } from '@/hooks/use-journal-store';
import { ScrollArea } from './ui/scroll-area';

const CurrencySettings = () => {
    const { appSettings, updateAppSettings } = useJournalStore();

    const handleCurrencyChange = (newCurrency: string) => {
        updateAppSettings({ displayCurrency: newCurrency });
    };

    if (!appSettings || !appSettings.currencyRates) {
        return (
            <Card className="glassmorphic">
                <CardHeader>
                    <CardTitle className="text-lg">Display Currency</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Loading currency settings...</p>
                </CardContent>
            </Card>
        );
    }
    
    const { displayCurrency, currencyRates } = appSettings;

    return (
        <Card className="glassmorphic">
            <CardHeader>
                <CardTitle className="text-lg">Display Currency</CardTitle>
                <CardDescription>
                    Select the currency to display all monetary values in. The app will convert all data from the base USD.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-xs">
                    <Label htmlFor="currency-select">Currency</Label>
                    <Select value={displayCurrency} onValueChange={handleCurrencyChange}>
                        <SelectTrigger id="currency-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                             <ScrollArea className="h-60">
                                {Object.keys(currencyRates).map(currency => (
                                    <SelectItem key={currency} value={currency}>
                                        {currency}
                                    </SelectItem>
                                ))}
                            </ScrollArea>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
};

export default CurrencySettings;

    
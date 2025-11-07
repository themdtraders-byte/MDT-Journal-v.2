import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useJournalStore } from "@/hooks/use-journal-store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
    const appSettings = useJournalStore.getState().appSettings;
    const currency = appSettings?.displayCurrency || 'USD';
    const rate = appSettings?.currencyRates?.[currency] || 1;
    const convertedNum = num * rate;

    // Use Intl.NumberFormat for number formatting without currency symbol
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    
    return formatter.format(convertedNum);
}

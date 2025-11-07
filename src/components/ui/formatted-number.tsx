
'use client';

import { useJournalStore } from "@/hooks/use-journal-store";
import { cn } from "@/lib/utils";
import React, { useMemo } from "react";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./tooltip";

interface FormattedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  isPrice?: boolean;
  showPercentage?: boolean; 
}

const FormattedNumber: React.FC<FormattedNumberProps> = ({ value, isPrice = false, showPercentage = false, className, ...props }) => {
  const { appSettings, journals, activeJournalId } = useJournalStore(state => ({
      appSettings: state.appSettings,
      journals: state.journals,
      activeJournalId: state.activeJournalId
  }));
  
  const currency = appSettings?.displayCurrency || 'USD';
  const rate = appSettings?.currencyRates?.[currency] || 1;
  const convertedNum = value * rate;
  
  const activeJournal = useMemo(() => journals.find(j => j.id === activeJournalId), [journals, activeJournalId]);
  const capital = activeJournal?.capital;

  const currencySymbols: Record<string, string> = {
    USD: '$',
    PKR: '₨',
    INR: '₹',
    EUR: '€',
  };
  const currencySymbol = currencySymbols[currency] || currency;

  const fullFormattedString = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 5,
  }).format(Math.abs(convertedNum));

  const absValue = Math.abs(convertedNum);
  let displayValue: React.ReactNode;
  
  const formatWithSuffix = (num: number, divisor: number, suffix: string, precision: number) => {
    const formatted = (num / divisor).toFixed(precision);
    const [integerPart, decimalPart] = formatted.split('.');
    return (
        <>
            <span className="font-code">{integerPart}</span>
            {decimalPart && <span className="font-code opacity-50 text-[0.8em]">.{decimalPart}</span>}
            <span className="font-code">{suffix}</span>
        </>
    );
  };

  if (isPrice) {
    const [integerPart, decimalPart] = fullFormattedString.split('.');
    displayValue = (
        <>
            <span className="font-code">{integerPart}</span>
            <span className="font-code opacity-50 text-[0.8em]">.{decimalPart}</span>
        </>
    );
  } else if (absValue >= 1_000_000) {
    displayValue = formatWithSuffix(convertedNum, 1_000_000, 'M', 2);
  } else if (absValue >= 10_000) {
    displayValue = formatWithSuffix(convertedNum, 1_000, 'K', 1);
  } else {
    const [integerPart, decimalPart] = new Intl.NumberFormat('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(Math.abs(convertedNum)).split('.');
    displayValue = (
        <>
            <span className="font-code">{integerPart}</span>
            <span className="font-code opacity-50 text-[0.8em]">.{decimalPart}</span>
        </>
    );
  }

  const percentageString = showPercentage && capital && capital > 0 ? `(${(value / capital * 100).toFixed(1)}%)` : null;

  return (
     <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn("inline-flex items-baseline gap-1.5", className)} {...props}>
                    <span className="flex-shrink-0">
                      {convertedNum < 0 && '-'}{!isPrice && <span className="font-code solid">{currencySymbol}</span>}{displayValue}
                    </span>
                    {percentageString && (
                        <span className="text-[0.7em] font-sans opacity-70">
                            {percentageString}
                        </span>
                    )}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p className="font-code">{isPrice ? '' : currencySymbol}{fullFormattedString}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
  );
};

export default FormattedNumber;

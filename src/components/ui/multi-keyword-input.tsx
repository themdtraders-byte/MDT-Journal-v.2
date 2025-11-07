
'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiKeywordInputProps {
  placeholder: string;
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}

export const MultiKeywordInput: React.FC<MultiKeywordInputProps> = ({
  placeholder,
  value,
  onChange,
  className,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, value.length - 1));
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    onChange(value.filter(keyword => keyword !== keywordToRemove));
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className
      )}
    >
      {value.map(keyword => (
        <Badge key={keyword} variant="secondary" className="pl-2 pr-1">
          {keyword}
          <button
            onClick={() => removeKeyword(keyword)}
            className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        type="text"
        placeholder={value.length === 0 ? placeholder : ''}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow h-auto p-0 bg-transparent border-0 shadow-none focus-visible:ring-0"
      />
    </div>
  );
};

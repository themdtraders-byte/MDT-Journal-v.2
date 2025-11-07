"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type Option = {
  value: string;
  label: string;
};

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAddNew?: (value: string) => void;
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  ({ options, value, onChange, placeholder = "Select...", className, onAddNew }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    const handleSelect = (currentValue: string) => {
      onChange(currentValue);
      setOpen(false);
      setSearchTerm("");
    };

    const handleAddNew = () => {
        if (onAddNew && searchTerm) {
            onAddNew(searchTerm);
            onChange(searchTerm);
        }
        setOpen(false);
        setSearchTerm('');
    };
    
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const showAddNew = onAddNew && searchTerm && !options.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());

    const displayValue = options.find(option => option.value === value)?.label || value || placeholder;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-7", className)}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput
              placeholder="Search or create..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
                {(filteredOptions.length === 0 && !showAddNew) && <CommandEmpty>No option found.</CommandEmpty>}
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {showAddNew && (
                  <CommandItem onSelect={handleAddNew} className="text-primary cursor-pointer">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add "{searchTerm}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
Combobox.displayName = "Combobox";

export { Combobox };

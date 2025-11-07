
"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, PlusCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "./badge";

type Option = {
  value: string;
  label: string;
  className?: string; // Optional className for custom styling
};

interface MultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onValueChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onAddNew?: (value: string) => void;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ options, selectedValues = [], onValueChange, placeholder = "Select...", className, disabled = false, onAddNew, ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    const handleSelect = (value: string) => {
      const newSelected = selectedValues.includes(value)
        ? selectedValues.filter((item) => item !== value)
        : [...selectedValues, value];
      onValueChange(newSelected);
    };

    const handleAddNew = () => {
        if (onAddNew && searchTerm) {
            onAddNew(searchTerm);
        }
        setOpen(false);
        setSearchTerm('');
    };

    const handleRemove = (e: React.MouseEvent, value: string) => {
        e.stopPropagation();
        onValueChange(selectedValues.filter(item => item !== value));
    }

    const selectedOptions = options.filter(option => selectedValues.includes(option.value));
    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const showAddNew = onAddNew && searchTerm && !options.some(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());


    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between h-auto min-h-9", className)}
            disabled={disabled}
            {...props}
          >
            <div className="flex flex-wrap gap-1">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className={cn("mr-1 mb-1 pl-2 pr-1 flex-shrink-0", option.className)}
                  >
                    {option.label}
                     <button
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={(e) => handleRemove(e, option.value)}
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput
              placeholder="Search..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className="max-h-60">
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                    className={cn("flex items-center justify-between", option.className)}
                  >
                    <div className="flex items-center">
                        <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                selectedValues.includes(option.value) ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {option.label}
                    </div>
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

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;

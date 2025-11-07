
"use client"

import * as React from "react"
import { DayPicker, useDayPicker, useNavigation } from "react-day-picker"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select"
import { ScrollArea } from "./scroll-area"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center flex-col gap-2",
        caption_label: "text-sm font-medium",
        caption_dropdowns: "flex justify-center gap-2",
        nav: "space-x-1 flex items-center absolute w-full justify-between top-[4.25rem]",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "left-1",
        nav_button_next: "right-1",
        table: "w-full border-collapse space-y-1 mt-4",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: ({ ...props }) => {
            const { goToMonth, nextMonth, previousMonth } = useNavigation();
            const { fromYear, toYear } = useDayPicker();

            const years = Array.from({ length: (toYear || new Date().getFullYear()) - (fromYear || 1900) + 1 }, (_, i) => (fromYear || 1900) + i);
            const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: format(new Date(2000, i), 'MMMM') }));

            return (
              <div className="flex flex-col gap-2">
                <div className="flex justify-center gap-2">
                    <Select
                      onValueChange={(value) => {
                        const newDate = new Date(props.displayMonth);
                        newDate.setMonth(parseInt(value));
                        goToMonth(newDate);
                      }}
                      value={String(props.displayMonth.getMonth())}
                    >
                      <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-48">
                          {months.map((month) => (
                            <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                    <Select
                      onValueChange={(value) => {
                        const newDate = new Date(props.displayMonth);
                        newDate.setFullYear(parseInt(value));
                        goToMonth(newDate);
                      }}
                      value={String(props.displayMonth.getFullYear())}
                    >
                      <SelectTrigger className="h-7 text-xs w-[90px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         <ScrollArea className="h-48">
                            {years.map((year) => (
                              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                </div>
                <div className="flex justify-between items-center px-1">
                    <button onClick={() => previousMonth && goToMonth(previousMonth)} disabled={!previousMonth} className={cn(buttonVariants({ variant: 'outline' }), 'h-6 w-6 p-0')}>
                        <ChevronLeft className="h-3 w-3" />
                    </button>
                    <div className="text-sm font-medium">
                        {format(props.displayMonth, 'MMMM yyyy')}
                    </div>
                    <button onClick={() => nextMonth && goToMonth(nextMonth)} disabled={!nextMonth} className={cn(buttonVariants({ variant: 'outline' }), 'h-6 w-6 p-0')}>
                        <ChevronRight className="h-3 w-3" />
                    </button>
                </div>
              </div>
            )
        },
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }

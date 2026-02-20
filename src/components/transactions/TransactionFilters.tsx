'use client';

import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { useState } from 'react';

import type { TransactionSource } from '@/lib/enums';
import type { Category } from '@/types/category';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';


interface TransactionFiltersProps {
  categories: Category[];
  onFilterChange: (filters: {
    categoryId?: string;
    source?: TransactionSource;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function TransactionFilters({
  categories,
  onFilterChange,
}: TransactionFiltersProps) {
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  function handleCategoryChange(value: string) {
    const newCat = value === 'all' ? undefined : value;
    setCategoryId(newCat);
    onFilterChange({
      categoryId: newCat,
      source: source as TransactionSource | undefined,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  }

  function handleSourceChange(value: string) {
    const newSource = value === 'all' ? undefined : value;
    setSource(newSource);
    onFilterChange({
      categoryId,
      source: newSource as TransactionSource | undefined,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  }

  function handleStartDateChange(date: Date | undefined) {
    setStartDate(date);
    onFilterChange({
      categoryId,
      source: source as TransactionSource | undefined,
      startDate: date?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  }

  function handleEndDateChange(date: Date | undefined) {
    setEndDate(date);
    onFilterChange({
      categoryId,
      source: source as TransactionSource | undefined,
      startDate: startDate?.toISOString(),
      endDate: date?.toISOString(),
    });
  }

  function handleClear() {
    setCategoryId(undefined);
    setSource(undefined);
    setStartDate(undefined);
    setEndDate(undefined);
    onFilterChange({});
  }

  const hasFilters = categoryId || source || startDate || endDate;

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="transaction-filters">
      {/* Category filter */}
      <Select value={categoryId ?? 'all'} onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-45" aria-label="Filter by category">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              <span className="flex items-center gap-1.5">
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source filter */}
      <Select value={source ?? 'all'} onValueChange={handleSourceChange}>
        <SelectTrigger className="w-35" aria-label="Filter by source">
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="email">📧 Email</SelectItem>
          <SelectItem value="manual">✏️ Manual</SelectItem>
        </SelectContent>
      </Select>

      {/* Start date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-35 justify-start text-left font-normal',
              !startDate && 'text-muted-foreground',
            )}
            aria-label="Filter start date"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? format(startDate, 'dd MMM yyyy') : 'From'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={handleStartDateChange}
            disabled={(date) => (endDate ? date > endDate : false)}
          />
        </PopoverContent>
      </Popover>

      {/* End date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-35 justify-start text-left font-normal',
              !endDate && 'text-muted-foreground',
            )}
            aria-label="Filter end date"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {endDate ? format(endDate, 'dd MMM yyyy') : 'To'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={handleEndDateChange}
            disabled={(date) => (startDate ? date < startDate : false)}
          />
        </PopoverContent>
      </Popover>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="gap-1 text-muted-foreground hover:text-foreground"
          aria-label="Clear filters"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}

'use client';

import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { Category } from '@/types/category';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AddTransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  vendorSuggestions: Array<{ vendorName: string; categoryId: string }>;
  onSubmit: (data: {
    amount: number;
    vendor: string;
    categoryId: string;
    transactionDate: string;
    description?: string;
  }) => Promise<void>;
}

export function AddTransactionSheet({
  open,
  onOpenChange,
  categories,
  vendorSuggestions,
  onSubmit,
}: AddTransactionSheetProps) {
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = useMemo(() => {
    if (!vendor.trim()) {return vendorSuggestions.slice(0, 8);}
    const lower = vendor.toLowerCase();
    return vendorSuggestions
      .filter((s) => s.vendorName.toLowerCase().includes(lower))
      .slice(0, 8);
  }, [vendor, vendorSuggestions]);

  const resetForm = useCallback(() => {
    setVendor('');
    setAmount('');
    setCategoryId('');
    setDate(new Date());
    setDescription('');
    setShowSuggestions(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor.trim() || !amount || !categoryId) {return;}

    setIsSubmitting(true);
    try {
      await onSubmit({
        vendor: vendor.trim(),
        amount: parseFloat(amount),
        categoryId,
        transactionDate: date.toISOString(),
        description: description.trim() || undefined,
      });
      resetForm();
      onOpenChange(false);
    } catch {
      // Error handling done by parent
    } finally {
      setIsSubmitting(false);
    }
  }

  function selectSuggestion(suggestion: { vendorName: string; categoryId: string }) {
    setVendor(suggestion.vendorName);
    if (!categoryId) {setCategoryId(suggestion.categoryId);}
    setShowSuggestions(false);
  }

  const isValid = vendor.trim() && parseFloat(amount) > 0 && categoryId;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-lg">Add Transaction</SheetTitle>
          <SheetDescription>Add a manual expense entry.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-4" data-testid="add-transaction-form">
          {/* Vendor with autocomplete */}
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <div className="relative">
              <Input
                id="vendor"
                value={vendor}
                onChange={(e) => {
                  setVendor(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => {
                  // Delay to allow suggestion click
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="e.g. GRAB *GRABFOOD"
                required
                autoComplete="off"
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md"
                  data-testid="vendor-suggestions"
                >
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s.vendorName}
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectSuggestion(s);
                      }}
                    >
                      {s.vendorName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SGD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="font-mono tabular-nums"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger aria-label="Select category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
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
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'dd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Lunch with team"
              maxLength={1000}
            />
          </div>

          <SheetFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Transaction
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

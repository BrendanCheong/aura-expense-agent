'use client';

import { format } from 'date-fns';
import { CalendarIcon, Loader2, Trash2, MessageSquare } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import type { Category } from '@/types/category';
import type { Transaction, TransactionUpdate } from '@/types/transaction';

import { CategoryBadge } from '@/components/shared/CategoryBadge';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TransactionSource, type Confidence } from '@/lib/enums';

interface TransactionSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onUpdate: (id: string, data: TransactionUpdate) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCategoryChange: (id: string, categoryId: string) => Promise<void>;
}

export function TransactionSheet({
  transaction,
  open,
  onOpenChange,
  categories,
  onUpdate,
  onDelete,
  onCategoryChange,
}: TransactionSheetProps) {
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync form state with selected transaction
  useEffect(() => {
    if (transaction) {
      setVendor(transaction.vendor);
      setAmount(String(transaction.amount));
      setDate(new Date(transaction.transactionDate));
      setDescription(transaction.description || '');
      setShowDeleteConfirm(false);
    }
  }, [transaction]);

  const category = categories.find((c) => c.id === transaction?.categoryId);
  const isDirty =
    transaction &&
    (vendor !== transaction.vendor ||
      parseFloat(amount) !== transaction.amount ||
      date.toISOString() !== new Date(transaction.transactionDate).toISOString() ||
      description !== (transaction.description || ''));

  const handleSave = useCallback(async () => {
    if (!transaction || !isDirty) {return;}
    setIsSaving(true);
    try {
      const update: TransactionUpdate = {};
      if (vendor !== transaction.vendor) {update.vendor = vendor.trim();}
      if (parseFloat(amount) !== transaction.amount) {update.amount = parseFloat(amount);}
      if (date.toISOString() !== new Date(transaction.transactionDate).toISOString()) {
        update.transactionDate = date.toISOString();
      }
      if (description !== (transaction.description || '')) {update.description = description.trim();}
      await onUpdate(transaction.id, update);
    } finally {
      setIsSaving(false);
    }
  }, [transaction, vendor, amount, date, description, isDirty, onUpdate]);

  const handleDelete = useCallback(async () => {
    if (!transaction) {return;}
    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  }, [transaction, onDelete, onOpenChange]);

  async function handleCategoryChange(newCategoryId: string) {
    if (!transaction || newCategoryId === transaction.categoryId) {return;}
    await onCategoryChange(transaction.id, newCategoryId);
  }

  if (!transaction) {return null;}

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-lg">Transaction Details</SheetTitle>
          <SheetDescription>
            View and edit transaction details.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 p-4" data-testid="transaction-detail-form">
          {/* Read-only metadata */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="gap-1">
              {transaction.source === TransactionSource.EMAIL ? '📧 Email' : '✏️ Manual'}
            </Badge>
            <ConfidenceIndicator confidence={transaction.confidence as Confidence} />
            {transaction.rawEmailSubject && (
              <span className="text-xs text-muted-foreground truncate max-w-50" title={transaction.rawEmailSubject}>
                {transaction.rawEmailSubject}
              </span>
            )}
          </div>

          <Separator />

          {/* Vendor (editable) */}
          <div className="space-y-2">
            <Label htmlFor="detail-vendor">Vendor</Label>
            <Input
              id="detail-vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
            />
          </div>

          {/* Amount (editable) */}
          <div className="space-y-2">
            <Label htmlFor="detail-amount">Amount (SGD)</Label>
            <Input
              id="detail-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>

          {/* Category (quick re-categorize — saves immediately) */}
          <div className="space-y-2">
            <Label>Category</Label>
            <div className="flex items-center gap-2">
              {category && (
                <CategoryBadge
                  name={category.name}
                  icon={category.icon}
                  color={category.color}
                />
              )}
              <Select
                value={transaction.categoryId}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-50" aria-label="Change category">
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
            <p className="text-xs text-muted-foreground">
              Changing category saves immediately and updates vendor cache.
            </p>
          </div>

          {/* Date (editable) */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'dd MMM yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description (editable) */}
          <div className="space-y-2">
            <Label htmlFor="detail-description">Description</Label>
            <Input
              id="detail-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              maxLength={1000}
            />
          </div>

          {/* Current amount display (read-only for reference) */}
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">Current Amount</span>
            <CurrencyDisplay amount={transaction.amount} className="text-lg font-bold" />
          </div>

          <Separator />

          {/* AI Feedback button (stubbed for FEAT-013) */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" disabled className="gap-2 w-full" data-testid="feedback-btn">
                  <MessageSquare className="h-4 w-4" />
                  Give AI Feedback
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming soon — FEAT-013</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <SheetFooter className="flex-row gap-2 mt-2">
            {/* Delete */}
            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-1"
                data-testid="delete-btn"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2" data-testid="delete-confirm">
                <span className="text-sm text-destructive">Are you sure?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <div className="flex-1" />

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              data-testid="save-btn"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

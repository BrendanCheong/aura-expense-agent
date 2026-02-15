'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Curated palette matching the Aurora Noir design system.
 * Each row is a visual "family" so users can pick coherent colors.
 */
const PALETTE = [
  // Default category colors from DESIGN.md
  { hex: '#FF6B6B', label: 'Warm Coral' },
  { hex: '#2DD4BF', label: 'Ocean Teal' },
  { hex: '#38BDF8', label: 'Sky Blue' },
  { hex: '#A3E635', label: 'Lime' },
  { hex: '#FBBF24', label: 'Amber' },
  { hex: '#FB7185', label: 'Rose' },
  { hex: '#A78BFA', label: 'Violet' },
  { hex: '#94A3B8', label: 'Slate' },
  // Extended palette
  { hex: '#F97316', label: 'Orange' },
  { hex: '#EC4899', label: 'Pink' },
  { hex: '#06B6D4', label: 'Cyan' },
  { hex: '#10B981', label: 'Emerald' },
  { hex: '#8B5CF6', label: 'Purple' },
  { hex: '#EF4444', label: 'Red' },
  { hex: '#84CC16', label: 'Green' },
  { hex: '#F59E0B', label: 'Gold' },
];

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-10 w-14 p-2" type="button">
          <span
            className="block h-full w-full rounded-sm"
            style={{ backgroundColor: value || '#94A3B8' }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <div className="grid grid-cols-4 gap-2">
          {PALETTE.map(({ hex, label }) => (
            <button
              key={hex}
              type="button"
              title={label}
              className={cn(
                'h-8 w-8 rounded-md border-2 transition-all',
                value === hex
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:border-muted-foreground/50 hover:scale-105'
              )}
              style={{ backgroundColor: hex }}
              onClick={() => {
                onChange(hex);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

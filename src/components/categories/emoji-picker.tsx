'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const EMOJI_GROUPS = [
  {
    label: 'Finance',
    emojis: ['💰', '💳', '🏦', '💵', '💸', '📈', '📉', '🧾', '🪙', '💎'],
  },
  {
    label: 'Food & Drink',
    emojis: ['🍔', '🍕', '☕', '🍜', '🍱', '🥗', '🍩', '🥤', '🍺', '🧁'],
  },
  {
    label: 'Transport',
    emojis: ['🚗', '🚃', '✈️', '🚌', '🚕', '🏍️', '⛽', '🚢', '🚲', '🛴'],
  },
  {
    label: 'Shopping',
    emojis: ['🛍️', '🛒', '👗', '👟', '📱', '💻', '🎮', '📦', '🎁', '🏷️'],
  },
  {
    label: 'Home & Bills',
    emojis: ['🏠', '💡', '📶', '💧', '🔌', '🛡️', '🏗️', '🧹', '🪴', '🔧'],
  },
  {
    label: 'Entertainment',
    emojis: ['🎬', '🎵', '📚', '🎮', '🎭', '🎨', '🏋️', '⚽', '🎯', '🎤'],
  },
  {
    label: 'Health',
    emojis: ['💊', '🏥', '🧘', '🦷', '👓', '🩺', '💉', '🧴', '🌿', '❤️'],
  },
  {
    label: 'General',
    emojis: ['📦', '⭐', '🔥', '🌀', '🎯', '🏆', '✨', '🌈', '🔔', '⚡'],
  },
];

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 w-14 text-xl"
          type="button"
        >
          {value || '📦'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <ScrollArea className="h-64 p-3">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              <div className="grid grid-cols-5 gap-1">
                {group.emojis.map((emoji) => (
                  <button
                    key={`${group.label}-${emoji}`}
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent"
                    onClick={() => {
                      onChange(emoji);
                      setOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

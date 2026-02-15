'use client';

import { useState, useEffect } from 'react';

import { ColorPicker } from './color-picker';
import { EmojiPicker } from './emoji-picker';

import type { Category, CategoryUpdate } from '@/types/category';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';



interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSubmit: (data: {
    name: string;
    description: string;
    icon: string;
    color: string;
  }) => Promise<void>;
}

export function CategoryForm({ open, onOpenChange, category, onSubmit }: CategoryFormProps) {
  const isEditing = Boolean(category);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#94A3B8');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description);
      setIcon(category.icon);
      setColor(category.color);
    } else {
      setName('');
      setDescription('');
      setIcon('📦');
      setColor('#94A3B8');
    }
    setError(null);
  }, [category, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError('Name and description are required');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), icon, color });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl tracking-tight">
            {isEditing ? 'Edit Category' : 'New Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category details below.'
              : 'Create a new expense category for smarter tracking.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Emoji + Color row */}
          <div className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Icon</Label>
              <EmojiPicker value={icon} onChange={setIcon} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Color
              </Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label
                htmlFor="cat-name"
                className="text-xs uppercase tracking-wider text-muted-foreground"
              >
                Name
              </Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Subscriptions"
                maxLength={100}
                autoFocus
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="cat-desc"
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              Description
            </Label>
            <textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly recurring services like Netflix, Spotify, cloud hosting"
              maxLength={2000}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Helps the AI agent categorize transactions correctly.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

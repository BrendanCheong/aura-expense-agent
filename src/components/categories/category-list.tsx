'use client';

import { useState } from 'react';
import { Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CategoryForm } from './category-form';
import { DeleteCategoryDialog } from './delete-category-dialog';
import type { Category, CategoryUpdate } from '@/types/category';

interface CategoryListProps {
  categories: Category[];
  onUpdate: (id: string, data: CategoryUpdate) => Promise<Category>;
  onDelete: (id: string) => Promise<void>;
}

export function CategoryList({
  categories,
  onUpdate,
  onDelete,
}: CategoryListProps) {
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const isOther = (cat: Category) => cat.name === 'Other';

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group flex items-center gap-4 rounded-lg border border-border/50 bg-card p-4 transition-colors hover:border-border hover:bg-accent/5"
          >
            {/* Color swatch + emoji */}
            <div className="flex items-center gap-3">
              <span
                className="block h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xl" role="img" aria-label={cat.name}>
                {cat.icon}
              </span>
            </div>

            {/* Name + description */}
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-sm font-semibold leading-tight tracking-tight">
                {cat.name}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {cat.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditCategory(cat)}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="sr-only">Edit {cat.name}</span>
              </Button>

              {isOther(cat) ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex h-8 w-8 items-center justify-center">
                      <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>&quot;Other&quot; is a system category and cannot be deleted.</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteCategory(cat)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Delete {cat.name}</span>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <CategoryForm
        open={editCategory !== null}
        onOpenChange={(open) => {
          if (!open) setEditCategory(null);
        }}
        category={editCategory}
        onSubmit={async (data) => {
          if (!editCategory) return;
          await onUpdate(editCategory.id, data);
          setEditCategory(null);
        }}
      />

      {/* Delete confirmation */}
      <DeleteCategoryDialog
        open={deleteCategory !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteCategory(null);
        }}
        categoryName={deleteCategory?.name ?? ''}
        onConfirm={async () => {
          if (!deleteCategory) return;
          await onDelete(deleteCategory.id);
          setDeleteCategory(null);
        }}
      />
    </TooltipProvider>
  );
}

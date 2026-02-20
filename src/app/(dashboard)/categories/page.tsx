'use client';

import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CategoryForm } from '@/components/categories/CategoryForm';
import { CategoryList } from '@/components/categories/CategoryList';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCategories } from '@/hooks/use-categories';


export default function CategoriesPage() {
  const { categories, isLoading, error, createCategory, updateCategory, deleteCategory } =
    useCategories();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your expense categories. Descriptions help the AI agent categorize transactions
            more accurately.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Category</span>
        </Button>
      </div>

      <Separator />

      {/* Category list */}
      {categories.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <span className="text-4xl">🏷️</span>
          <p className="font-heading text-lg font-semibold">No categories yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first category to start organizing expenses.
          </p>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-2">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Category
          </Button>
        </div>
      ) : (
        <CategoryList
          categories={categories}
          onUpdate={async (id, data) => {
            await updateCategory(id, data);
            toast.success('Category updated');
            const updated = categories.find((c) => c.id === id);
            if (!updated) { throw new Error(`Category ${id} not found`); }
            return updated;
          }}
          onDelete={async (id) => {
            await deleteCategory(id);
            toast.success('Category deleted. Transactions moved to "Other".');
          }}
        />
      )}

      {/* Hint */}
      {categories.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Deleting a category moves its transactions to &quot;Other&quot;.
        </p>
      )}

      {/* Create dialog */}
      <CategoryForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={async (data) => {
          await createCategory(data);
          toast.success(`Category "${data.name}" created`);
        }}
      />
    </div>
  );
}

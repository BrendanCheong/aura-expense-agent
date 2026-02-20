'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon = '📋', title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8 text-center',
        className,
      )}
      data-testid="empty-state"
    >
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <p className="font-heading text-lg font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline" className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

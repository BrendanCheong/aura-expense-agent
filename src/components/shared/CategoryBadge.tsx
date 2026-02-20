'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  name: string;
  icon: string;
  color: string;
  className?: string;
}

export function CategoryBadge({ name, icon, color, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 border-transparent font-medium',
        className,
      )}
      style={{
        backgroundColor: `${color}18`,
        color,
        borderColor: `${color}30`,
      }}
      data-testid="category-badge"
    >
      <span aria-hidden="true">{icon}</span>
      <span>{name}</span>
    </Badge>
  );
}

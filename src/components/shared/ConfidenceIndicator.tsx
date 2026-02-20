'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Confidence } from '@/lib/enums';
import { cn } from '@/lib/utils';

interface ConfidenceIndicatorProps {
  confidence: Confidence;
  className?: string;
}

const CONFIDENCE_CONFIG = {
  [Confidence.HIGH]: {
    label: 'High confidence',
    dotClass: 'bg-green-500',
    glowClass: 'group-hover:shadow-[0_0_6px_2px_rgba(34,197,94,0.4)]',
  },
  [Confidence.MEDIUM]: {
    label: 'Medium confidence',
    dotClass: 'bg-amber-500',
    glowClass: 'group-hover:shadow-[0_0_6px_2px_rgba(245,158,11,0.4)]',
  },
  [Confidence.LOW]: {
    label: 'Low confidence',
    dotClass: 'bg-red-500',
    glowClass: 'group-hover:shadow-[0_0_6px_2px_rgba(239,68,68,0.4)]',
  },
} as const;

export function ConfidenceIndicator({ confidence, className }: ConfidenceIndicatorProps) {
  const config = CONFIDENCE_CONFIG[confidence];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn('group inline-flex items-center justify-center', className)}
            role="img"
            aria-label={config.label}
          >
            <span
              className={cn(
                'inline-block h-2.5 w-2.5 rounded-full transition-shadow duration-200',
                config.dotClass,
                config.glowClass,
              )}
              data-testid="confidence-dot"
            />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

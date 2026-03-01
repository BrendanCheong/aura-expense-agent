'use client';

import { useState } from 'react';

import type { DashboardAlert } from '@/types/dashboard';

interface AlertBannerProps {
  alerts: DashboardAlert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (alerts.length === 0 || dismissed) {
    return null;
  }

  // Sort: over_budget first, then warning
  const sorted = [...alerts].sort((a, b) => {
    if (a.type === b.type) {
      return 0;
    }
    return a.type === 'over_budget' ? -1 : 1;
  });

  return (
    <div className="space-y-2">
      {sorted.map((alert) => (
        <div
          key={alert.categoryId}
          data-testid={`alert-${alert.type === 'over_budget' ? 'over-budget' : 'warning'}`}
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            alert.type === 'over_budget'
              ? 'border-red-500/30 bg-red-500/10 text-red-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}
        >
          <span className="mt-0.5 text-base">{alert.icon}</span>
          <p className="flex-1">{alert.message}</p>
        </div>
      ))}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setDismissed(true); }}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

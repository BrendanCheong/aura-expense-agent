'use client';

interface AllocationBarProps {
  allocatedPercent: number;
}

export function AllocationBar({ allocatedPercent }: AllocationBarProps) {
  const savingsPercent = Math.max(0, 100 - allocatedPercent);
  const clampedAllocated = Math.min(allocatedPercent, 100);

  return (
    <div className="space-y-1" data-testid="allocation-bar">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-800">
        {clampedAllocated > 0 && (
          <div
            className="flex items-center justify-center bg-indigo-500 text-[10px] font-medium text-white transition-all"
            style={{ width: `${clampedAllocated}%` }}
          >
            {clampedAllocated >= 15 ? `${allocatedPercent}%` : ''}
          </div>
        )}
        {savingsPercent > 0 && (
          <div
            className="flex items-center justify-center bg-emerald-500/30 text-[10px] font-medium text-emerald-300 transition-all"
            style={{ width: `${savingsPercent}%` }}
          >
            {savingsPercent >= 15 ? `${savingsPercent}%` : ''}
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{allocatedPercent}% allocated</span>
        <span>{savingsPercent}% savings</span>
      </div>
    </div>
  );
}

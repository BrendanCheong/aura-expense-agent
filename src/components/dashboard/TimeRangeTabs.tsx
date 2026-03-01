'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DashboardPeriod } from '@/types/dashboard';

interface TimeRangeTabsProps {
  value: DashboardPeriod;
  onChange: (value: DashboardPeriod) => void;
}

export function TimeRangeTabs({ value, onChange }: TimeRangeTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as DashboardPeriod)}
    >
      <TabsList>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
        <TabsTrigger value="year">Year</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

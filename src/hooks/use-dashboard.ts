'use client';

import { isAxiosError } from 'axios';
import { useState, useEffect, useCallback, useMemo } from 'react';

import type {
  DashboardAlertsResponse,
  DashboardPeriod,
  DashboardSummaryResponse,
  RecentTransaction,
} from '@/types/dashboard';

import { apiClient } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

interface UseDashboardReturn {
  summary: DashboardSummaryResponse | null;
  alerts: DashboardAlertsResponse | null;
  isLoading: boolean;
  error: string | null;
  period: DashboardPeriod;
  setPeriod: (period: DashboardPeriod) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  filteredTransactions: RecentTransaction[];
}

export function useDashboard(): UseDashboardReturn {
  const now = new Date();
  const [period, setPeriodState] = useState<DashboardPeriod>('month');
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [alerts, setAlerts] = useState<DashboardAlertsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchData = useCallback(async (currentPeriod: DashboardPeriod) => {
    setIsLoading(true);
    setError(null);

    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    try {
      const summaryParams = new URLSearchParams({
        period: currentPeriod,
        year: String(year),
        month: String(month),
      });

      const alertsParams = new URLSearchParams({
        year: String(year),
        month: String(month),
      });

      const [summaryRes, alertsRes] = await Promise.all([
        apiClient.get<DashboardSummaryResponse>(`${API_ROUTES.DASHBOARD_SUMMARY}?${summaryParams.toString()}`),
        apiClient.get<DashboardAlertsResponse>(`${API_ROUTES.DASHBOARD_ALERTS}?${alertsParams.toString()}`).catch(() => null),
      ]);

      setSummary(summaryRes.data);

      if (alertsRes) {
        setAlerts(alertsRes.data);
      }
    } catch (err) {
      const message =
        isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error ?? err.message : 'Unknown error';
      setError(message);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetchData(period);
  }, [fetchData, period]);

  const setPeriod = useCallback((newPeriod: DashboardPeriod) => {
    setPeriodState(newPeriod);
  }, []);

  const filteredTransactions = useMemo(() => {
    if (!summary) {
      return [];
    }
    if (!selectedCategory) {
      return summary.recentTransactions;
    }
    return summary.recentTransactions.filter(
      (tx) => tx.categoryName === selectedCategory,
    );
  }, [summary, selectedCategory]);

  return {
    summary,
    alerts,
    isLoading,
    error,
    period,
    setPeriod,
    selectedCategory,
    setSelectedCategory,
    filteredTransactions,
  };
}

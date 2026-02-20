'use client';

import { useState, useEffect, useCallback } from 'react';

interface VendorSuggestion {
  id: string;
  vendorName: string;
  categoryId: string;
  hitCount: number;
}

interface UseVendorCacheReturn {
  vendors: VendorSuggestion[];
  isLoading: boolean;
  /** Filter vendors by prefix (case-insensitive). */
  getSuggestions: (query: string) => VendorSuggestion[];
}

export function useVendorCache(): UseVendorCacheReturn {
  const [vendors, setVendors] = useState<VendorSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchVendors() {
      try {
        const res = await fetch('/api/vendor-cache');
        if (res.ok) {
          const data: VendorSuggestion[] = await res.json();
          if (!cancelled) {
            // Sort by hit count descending (most used vendors first)
            setVendors(data.sort((a, b) => b.hitCount - a.hitCount));
          }
        }
      } catch {
        // Non-critical — autocomplete fails gracefully
      } finally {
        if (!cancelled) {setIsLoading(false);}
      }
    }

    void fetchVendors();
    return () => { cancelled = true; };
  }, []);

  const getSuggestions = useCallback(
    (query: string): VendorSuggestion[] => {
      if (!query.trim()) {return vendors.slice(0, 10);}
      const lower = query.toLowerCase();
      return vendors
        .filter((v) => v.vendorName.toLowerCase().includes(lower))
        .slice(0, 10);
    },
    [vendors],
  );

  return { vendors, isLoading, getSuggestions };
}

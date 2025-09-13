import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Property, Transaction, Account } from '@/types';

const supabase = createClient();

type FetchOptions = {
  enabled?: boolean;
};

// --- 汎用的なデータ取得フック ---
function useSupabaseQuery<T>(
  tableName: string,
  options: FetchOptions = { enabled: true }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDataAndCache = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: queryError } = await supabase.from(tableName).select('*');
      if (queryError) {
        throw queryError;
      }
      if (result) {
        setData(result as T[]);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`supabase_cache_${tableName}`, JSON.stringify(result));
        }
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    if (!options.enabled || typeof window === 'undefined') {
      setData([]);
      return;
    }
    const cacheKey = `supabase_cache_${tableName}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setData(JSON.parse(cachedData));
    } else {
      fetchDataAndCache();
    }
  }, [tableName, options.enabled, fetchDataAndCache]);

  const refetch = useCallback(() => {
    const cacheKey = `supabase_cache_${tableName}`;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey);
    }
    return fetchDataAndCache();
  }, [tableName, fetchDataAndCache]);


  return { data, loading, error, refetch, setData };
}

// --- 特定のテーブルに対するカスタムフック ---
export const useFetchProperties = (options?: FetchOptions) => {
  return useSupabaseQuery<Property>('properties', options);
};

export const useFetchTransactions = (options?: FetchOptions) => {
  return useSupabaseQuery<Transaction>('transactions', options);
};

export const useFetchAccounts = (options?: FetchOptions) => {
  return useSupabaseQuery<Account>('accounts', options);
}; 
import { useState, useEffect, useCallback } from 'react';
import type { ProjectMetrics } from '@/types';

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

export function useProjectMetrics(projectId: string | undefined, autoRefresh = false, intervalMs = 30000) {
    const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = useCallback(async () => {
        if (!projectId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${BASE_URL}/deployment/${projectId}/metrics`,
                { credentials: 'include' }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch metrics: ${response.statusText}`);
            }

            const data = await response.json();
            setMetrics(data.metrics || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;

        fetchMetrics();

        if (autoRefresh) {
            const interval = setInterval(fetchMetrics, intervalMs);
            return () => clearInterval(interval);
        }
    }, [projectId, autoRefresh, intervalMs, fetchMetrics]);

    return { metrics, loading, error, refetch: fetchMetrics };
}
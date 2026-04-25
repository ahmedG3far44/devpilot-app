import { useEffect, useState, useRef, useCallback } from 'react';

interface LogMessage {
    message?: string;
    timestamp?: string;
    error?: string;
}

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

export function useDeploymentLogs(projectId: string | undefined) {
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const connect = useCallback(() => {
        if (!projectId || eventSourceRef.current) return;

        setError(null);
        
        const eventSource = new EventSource(
            `${BASE_URL}/deployment/${projectId}/logs/stream`,
            { withCredentials: true }
        );
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
            setIsConnected(true);
            setLogs(prev => [...prev, { message: 'Connected to log stream' }]);
        };

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.error) {
                    setError(data.error);
                } else {
                    setLogs(prev => [...prev, data]);
                }
            } catch {
                setLogs(prev => [...prev, { message: event.data }]);
            }
        };

        eventSource.addEventListener('connected', () => {
            setLogs(prev => [...prev, { message: 'Stream connected' }]);
        });

        eventSource.addEventListener('complete', () => {
            setLogs(prev => [...prev, { message: 'Log stream complete' }]);
        });

        eventSource.onerror = (err) => {
            console.error('SSE Error:', err);
            setError('Connection lost');
            setIsConnected(false);
            eventSource.close();
            eventSourceRef.current = null;
            
            // Try to reconnect after 3 seconds
            setTimeout(() => {
                if (!eventSourceRef.current) {
                    connect();
                }
            }, 3000);
        };
    }, [projectId]);

    const disconnect = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
            setIsConnected(false);
        }
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { logs, isConnected, error, connect, disconnect, clearLogs };
}
/**
 * WebSocket hook for real-time updates.
 * 
 * Provides real-time updates for:
 * - New resume uploads
 * - Candidate scoring
 * - Interview analysis
 * - Job creation/deletion
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Event types matching backend
export type RealtimeEventType = 
  | 'resume_uploaded'
  | 'resume_parsed'
  | 'candidate_scored'
  | 'pipeline_status_changed'
  | 'interview_analyzed'
  | 'report_generated'
  | 'job_created'
  | 'job_deleted'
  | 'connection_established';

export interface RealtimeEvent {
  type: RealtimeEventType;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface UseRealtimeUpdatesOptions {
  /** User ID for filtered updates */
  userId?: string;
  /** JWT token for authentication (optional, recommended for production) */
  token?: string;
  /** Callback when any event is received */
  onEvent?: (event: RealtimeEvent) => void;
  /** Callback when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean;
  /** Reconnect delay in ms */
  reconnectDelay?: number;
  /** Enable the connection */
  enabled?: boolean;
}

// Build WebSocket URL based on environment
function getWebSocketUrl(): string {
  // Use explicit env var if provided
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  // For server-side rendering
  if (typeof window === 'undefined') {
    return 'ws://localhost:8000/api/realtime/ws';
  }
  
  // Auto-detect from current page URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host; // includes port if present
  
  // In development (localhost with port 3000), connect to backend on 8000
  if (window.location.hostname === 'localhost' && window.location.port === '3000') {
    return `ws://localhost:8000/api/realtime/ws`;
  }
  
  // In production, WebSocket is on same host (behind reverse proxy)
  // Or use NEXT_PUBLIC_API_URL to derive it
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (apiUrl) {
    const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '/api/realtime/ws');
    return wsUrl;
  }
  
  // Default: same host, standard ports
  return `${protocol}//${host}/api/realtime/ws`;
}

const WS_BASE_URL = getWebSocketUrl();

export function useRealtimeUpdates(options: UseRealtimeUpdatesOptions = {}) {
  const {
    userId = 'anonymous',
    token,
    onEvent,
    onConnectionChange,
    autoReconnect = true,
    reconnectDelay = 3000,
    enabled = true
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptsRef = useRef(0);
  const enabledRef = useRef(enabled);
  const userIdRef = useRef(userId);
  const tokenRef = useRef(token);
  
  // Use refs for callbacks to avoid recreating connect function
  const onEventRef = useRef(onEvent);
  const onConnectionChangeRef = useRef(onConnectionChange);
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Keep refs in sync
  useEffect(() => {
    onEventRef.current = onEvent;
    onConnectionChangeRef.current = onConnectionChange;
    enabledRef.current = enabled;
    userIdRef.current = userId;
    tokenRef.current = token;
  });

  const connect = useCallback(() => {
    if (!enabledRef.current || typeof window === 'undefined') return;
    
    // Clean up existing connection
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close();
    }
    
    // Build WebSocket URL with auth params
    const params = new URLSearchParams();
    params.set('user_id', userIdRef.current);
    if (tokenRef.current) {
      params.set('token', tokenRef.current);
    }
    
    const wsUrl = `${WS_BASE_URL}?${params.toString()}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🟢 WebSocket connected');
        setIsConnected(true);
        connectionAttemptsRef.current = 0;
        setConnectionAttempts(0);
        onConnectionChangeRef.current?.(true);
        
        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
      };

      ws.onclose = (event) => {
        console.log('🔴 WebSocket disconnected', event.code, event.reason);
        setIsConnected(false);
        onConnectionChangeRef.current?.(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        // Auto-reconnect (only if enabled and not manually closed)
        if (autoReconnect && enabledRef.current && event.code !== 1000) {
          connectionAttemptsRef.current += 1;
          setConnectionAttempts(connectionAttemptsRef.current);
          const delay = Math.min(reconnectDelay * Math.pow(1.5, connectionAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('🔴 WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        // Handle pong response
        if (event.data === 'pong') return;
        
        try {
          const message = JSON.parse(event.data) as RealtimeEvent;
          setLastEvent(message);
          onEventRef.current?.(message);
          
          // Handle specific event types
          handleEvent(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [autoReconnect, reconnectDelay]); // Only stable dependencies

  const handleEvent = useCallback((event: RealtimeEvent) => {
    switch (event.type) {
      case 'resume_uploaded':
        // Refresh resumes or add to local state
        console.log('📄 New resume uploaded:', event.data);
        break;
        
      case 'candidate_scored':
        // Update candidate score in local state
        console.log('🎯 Candidate scored:', event.data);
        break;
        
      case 'interview_analyzed':
        // Update interview analysis
        console.log('🎤 Interview analyzed:', event.data);
        break;
        
      case 'job_created':
        // Add new job to local state
        console.log('💼 Job created:', event.data);
        break;
        
      case 'job_deleted':
        // Remove job from local state
        console.log('🗑️ Job deleted:', event.data);
        break;
        
      case 'pipeline_status_changed':
        // Update pipeline status
        console.log('📊 Pipeline status changed:', event.data);
        break;
        
      case 'connection_established':
        console.log('✅ Connection established:', event.data);
        break;
        
      default:
        console.log('📬 Event received:', event);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect'); // Normal closure
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reconnect when userId changes
  const prevUserIdRef = useRef(userId);
  useEffect(() => {
    if (prevUserIdRef.current !== userId && wsRef.current) {
      disconnect();
      if (enabled) {
        // Small delay before reconnecting with new userId
        setTimeout(connect, 100);
      }
    }
    prevUserIdRef.current = userId;
  }, [userId, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isConnected,
    lastEvent,
    connectionAttempts,
    connect,
    disconnect
  };
}

/**
 * Hook for displaying real-time notifications
 */
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: RealtimeEventType;
    message: string;
    timestamp: Date;
  }>>([]);

  const addNotification = useCallback((event: RealtimeEvent) => {
    const getMessage = (event: RealtimeEvent): string => {
      switch (event.type) {
        case 'resume_uploaded':
          return `New resume uploaded: ${event.data.candidate_name || event.data.file_name}`;
        case 'candidate_scored':
          return `${event.data.candidate_name} scored ${event.data.score}% for ${event.data.job_title}`;
        case 'interview_analyzed':
          return `Interview analysis completed`;
        case 'job_created':
          return `New job created: ${event.data.title}`;
        case 'job_deleted':
          return `Job deleted: ${event.data.title}`;
        default:
          return `Update received`;
      }
    };

    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: event.type,
      message: getMessage(event),
      timestamp: new Date()
    };

    setNotifications(prev => [notification, ...prev].slice(0, 10));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return {
    notifications,
    addNotification,
    clearNotifications,
    dismissNotification
  };
}

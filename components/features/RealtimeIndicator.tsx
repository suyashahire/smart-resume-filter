'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Target, Briefcase, MessageSquare, Trash2, Wifi } from 'lucide-react';
import { useRealtimeUpdates, RealtimeEvent, RealtimeEventType } from '@/hooks/useRealtimeUpdates';

interface RealtimeIndicatorProps {
  /** Show notification panel */
  showNotifications?: boolean;
  /** Callback when new event is received */
  onEvent?: (event: RealtimeEvent) => void;
  /** Position of the indicator */
  position?: 'top-right' | 'bottom-right';
}

const eventIcons: Record<RealtimeEventType, React.ReactNode> = {
  resume_uploaded: <FileText className="h-4 w-4" />,
  resume_parsed: <FileText className="h-4 w-4" />,
  candidate_scored: <Target className="h-4 w-4" />,
  pipeline_status_changed: <Target className="h-4 w-4" />,
  interview_analyzed: <MessageSquare className="h-4 w-4" />,
  report_generated: <FileText className="h-4 w-4" />,
  job_created: <Briefcase className="h-4 w-4" />,
  job_deleted: <Trash2 className="h-4 w-4" />,
  connection_established: <Wifi className="h-4 w-4" />,
};

const eventColors: Record<RealtimeEventType, string> = {
  resume_uploaded: 'bg-blue-500',
  resume_parsed: 'bg-blue-500',
  candidate_scored: 'bg-emerald-500',
  pipeline_status_changed: 'bg-purple-500',
  interview_analyzed: 'bg-amber-500',
  report_generated: 'bg-indigo-500',
  job_created: 'bg-teal-500',
  job_deleted: 'bg-red-500',
  connection_established: 'bg-gray-500',
};

export function RealtimeIndicator({ 
  showNotifications = true, 
  onEvent,
  position = 'top-right'
}: RealtimeIndicatorProps) {
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  
  // Get auth token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      setAuthToken(token || undefined);
    }
  }, []);
  
  // Use ref for external callback to avoid recreating
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  });
  
  // Memoize the event handler
  const handleEvent = useCallback((event: RealtimeEvent) => {
    onEventRef.current?.(event);
  }, []);
  
  const { isConnected, lastEvent } = useRealtimeUpdates({
    onEvent: handleEvent,
    token: authToken,
    enabled: true
  });

  return (
    <>
      {/* Toast for new events */}
      <AnimatePresence>
        {lastEvent && lastEvent.type !== 'connection_established' && (
          <motion.div
            key={lastEvent.timestamp}
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 right-4 z-50"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
              eventColors[lastEvent.type].replace('bg-', 'border-').replace('-500', '-200')
            } bg-white dark:bg-gray-900`}>
              <div className={`p-2 rounded-xl ${eventColors[lastEvent.type]} text-white`}>
                {eventIcons[lastEvent.type]}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                New update received
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default RealtimeIndicator;

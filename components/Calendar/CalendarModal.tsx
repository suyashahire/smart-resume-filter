'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Bell,
  Trash2,
  Edit2,
  FileText,
  Briefcase,
  Users,
  Star,
  Sparkles,
  Sun,
  Moon,
  CalendarDays,
  MapPin,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: 'interview' | 'reminder' | 'note' | 'task';
  description?: string;
  color: string;
}

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'candidate' | 'hr';
}

const STORAGE_KEY_PREFIX = 'hireq_calendar_events';

const eventTypes = [
  { id: 'interview', label: 'Interview', icon: Users, color: 'bg-violet-500', gradient: 'from-violet-500 to-purple-600', textColor: 'text-violet-500', bgLight: 'bg-violet-50 dark:bg-violet-500/10' },
  { id: 'reminder', label: 'Reminder', icon: Bell, color: 'bg-amber-500', gradient: 'from-amber-500 to-orange-600', textColor: 'text-amber-500', bgLight: 'bg-amber-50 dark:bg-amber-500/10' },
  { id: 'note', label: 'Note', icon: FileText, color: 'bg-sky-500', gradient: 'from-sky-500 to-blue-600', textColor: 'text-sky-500', bgLight: 'bg-sky-50 dark:bg-sky-500/10' },
  { id: 'task', label: 'Task', icon: Briefcase, color: 'bg-emerald-500', gradient: 'from-emerald-500 to-green-600', textColor: 'text-emerald-500', bgLight: 'bg-emerald-50 dark:bg-emerald-500/10' },
];

const eventColorMap: Record<string, string> = {
  'bg-purple-500': 'bg-violet-500',
  'bg-orange-500': 'bg-amber-500',
  'bg-blue-500': 'bg-sky-500',
  'bg-green-500': 'bg-emerald-500',
};

export default function CalendarModal({ isOpen, onClose, variant = 'candidate' }: CalendarModalProps) {
  const { user } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    type: 'reminder' as CalendarEvent['type'],
    description: '',
  });
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Build a user-specific storage key so each user's events are isolated
  const storageKey = useMemo(() => {
    if (user?.id) {
      return `${STORAGE_KEY_PREFIX}_${user.id}`;
    }
    // Fallback for unauthenticated users (shouldn't normally happen)
    return `${STORAGE_KEY_PREFIX}_guest`;
  }, [user?.id]);

  // Load events from localStorage (per-user)
  useEffect(() => {
    setHasLoaded(false);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setEvents(JSON.parse(stored));
      } catch {
        setEvents([]);
      }
    } else {
      setEvents([]);
    }
    setHasLoaded(true);
  }, [storageKey]);

  // Save events to localStorage (per-user) — only after initial load
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(events));
    }
  }, [events, storageKey, hasLoaded]);

  const isHR = variant === 'hr';

  const accentGradient = isHR
    ? 'from-blue-600 via-indigo-600 to-purple-600'
    : 'from-teal-500 via-cyan-500 to-emerald-500';

  const accentSolid = isHR ? 'bg-indigo-600' : 'bg-teal-500';
  const accentHover = isHR ? 'hover:bg-indigo-700' : 'hover:bg-teal-600';
  const accentText = isHR ? 'text-indigo-500' : 'text-teal-500';
  const accentRing = isHR ? 'ring-indigo-500/40' : 'ring-teal-500/40';
  const accentBgLight = isHR ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-teal-50 dark:bg-teal-500/10';
  const accentTextDark = isHR ? 'text-indigo-600 dark:text-indigo-400' : 'text-teal-600 dark:text-teal-400';

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  // Previous month trailing days
  const prevMonthDays = useMemo(() => {
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const prevDays = prevMonth.getDate();
    return Array.from({ length: startingDay }, (_, i) => prevDays - startingDay + 1 + i);
  }, [currentDate, startingDay]);

  // Next month leading days
  const nextMonthDays = useMemo(() => {
    const totalCells = startingDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    return Array.from({ length: remaining }, (_, i) => i + 1);
  }, [startingDay, daysInMonth]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const getEventsForDate = (day: number) => {
    const dateKey = formatDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    return events.filter(event => event.date === dateKey);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isWeekend = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    setShowAddEvent(false);
    setEditingEvent(null);
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEvent.title.trim()) return;

    const eventType = eventTypes.find(t => t.id === newEvent.type);
    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      date: formatDateKey(selectedDate),
      time: newEvent.time || undefined,
      type: newEvent.type,
      description: newEvent.description || undefined,
      color: eventType?.color || 'bg-gray-500',
    };

    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? { ...event, id: editingEvent.id } : e));
      setEditingEvent(null);
    } else {
      setEvents([...events, event]);
    }

    setNewEvent({ title: '', time: '', type: 'reminder', description: '' });
    setShowAddEvent(false);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      time: event.time || '',
      type: event.type,
      description: event.description || '',
    });
    setShowAddEvent(true);
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate.getDate()) : [];

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events.filter(event => {
      const eventDate = new Date(event.date + 'T00:00:00');
      return eventDate >= today && eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const upcomingEvents = getUpcomingEvents();

  // Total events in current month
  const monthEventCount = useMemo(() => {
    return events.filter(event => {
      const d = new Date(event.date + 'T00:00:00');
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).length;
  }, [events, currentDate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', icon: Sun };
    if (hour < 18) return { text: 'Good Afternoon', icon: Sun };
    return { text: 'Good Evening', icon: Moon };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 30 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="bg-white dark:bg-[#0f1629] rounded-2xl shadow-2xl w-full max-w-[920px] max-h-[88vh] overflow-hidden border border-gray-200/50 dark:border-white/[0.06]"
          onClick={e => e.stopPropagation()}
        >
          {/* ─── Header ─── */}
          <div className={`relative overflow-hidden`}>
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${accentGradient}`} />
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
            <div className="relative px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                  <CalendarDays className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white tracking-tight">Calendar</h2>
                  <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1.5">
                    <GreetingIcon className="h-3 w-3" />
                    {greeting.text} · {monthEventCount} event{monthEventCount !== 1 ? 's' : ''} this month
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all duration-200 border border-white/10"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row" style={{ height: 'calc(88vh - 82px)' }}>
            {/* ─── Calendar Grid ─── */}
            <div className="flex-1 p-5 overflow-y-auto">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                    {monthNames[currentDate.getMonth()]}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-2">{currentDate.getFullYear()}</span>
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevMonth}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200 border border-transparent dark:border-white/[0.04]"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setCurrentDate(new Date());
                      setSelectedDate(new Date());
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${isToday(new Date().getDate()) && currentDate.getMonth() === new Date().getMonth()
                        ? `${accentSolid} text-white border-transparent shadow-sm`
                        : `bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-300 border-transparent dark:border-white/[0.04] hover:bg-gray-200 dark:hover:bg-white/[0.1]`
                      }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200 border border-transparent dark:border-white/[0.04]"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 mb-1">
                {dayNames.map((day, i) => (
                  <div
                    key={day}
                    className={`text-center text-[11px] font-semibold uppercase tracking-wider py-2 ${i === 0 || i === 6
                        ? 'text-gray-400 dark:text-gray-600'
                        : 'text-gray-500 dark:text-gray-400'
                      }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-[3px]">
                {/* Previous month trailing days */}
                {prevMonthDays.map(day => (
                  <div
                    key={`prev-${day}`}
                    className="aspect-square rounded-lg flex flex-col items-center justify-start pt-1.5"
                  >
                    <span className="text-[13px] text-gray-300 dark:text-gray-700 font-medium">
                      {day}
                    </span>
                  </div>
                ))}

                {/* Current month days */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const today = isToday(day);
                  const selected = isSelected(day);
                  const weekend = isWeekend(day);
                  const hovered = hoveredDay === day;

                  return (
                    <motion.button
                      key={day}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-start pt-1.5 transition-all duration-200 relative group ${selected
                          ? `bg-gradient-to-br ${accentGradient} shadow-lg shadow-${isHR ? 'indigo' : 'teal'}-500/20`
                          : today
                            ? `ring-2 ${accentRing} bg-gray-50 dark:bg-white/[0.04]`
                            : weekend
                              ? 'bg-gray-50/50 dark:bg-white/[0.015] hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                              : 'hover:bg-gray-100 dark:hover:bg-white/[0.06]'
                        }`}
                    >
                      <span
                        className={`text-[13px] font-semibold leading-none transition-colors duration-200 ${selected
                            ? 'text-white'
                            : today
                              ? accentText
                              : weekend
                                ? 'text-gray-400 dark:text-gray-500'
                                : 'text-gray-700 dark:text-gray-200'
                          }`}
                      >
                        {day}
                      </span>

                      {/* Event dots */}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-[3px] mt-1">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className={`w-[5px] h-[5px] rounded-full transition-transform duration-200 ${selected ? 'bg-white/80' : eventColorMap[event.color] || event.color
                                } ${hovered ? 'scale-125' : ''}`}
                            />
                          ))}
                          {dayEvents.length > 3 && (
                            <span className={`text-[8px] font-bold leading-none ${selected ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Today indicator dot */}
                      {today && !selected && (
                        <div className={`absolute bottom-1 w-1 h-1 rounded-full ${accentSolid}`} />
                      )}
                    </motion.button>
                  );
                })}

                {/* Next month trailing days */}
                {nextMonthDays.map(day => (
                  <div
                    key={`next-${day}`}
                    className="aspect-square rounded-lg flex flex-col items-center justify-start pt-1.5"
                  >
                    <span className="text-[13px] text-gray-300 dark:text-gray-700 font-medium">
                      {day}
                    </span>
                  </div>
                ))}
              </div>

              {/* ─── Upcoming Events Strip ─── */}
              {upcomingEvents.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100 dark:border-white/[0.06]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5" />
                    Upcoming · Next 7 days
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {upcomingEvents.slice(0, 5).map(event => {
                      const eventType = eventTypes.find(t => t.id === event.type);
                      const Icon = eventType?.icon || Star;
                      return (
                        <div
                          key={event.id}
                          className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-200 hover:shadow-sm cursor-default ${eventType?.bgLight || 'bg-gray-50 dark:bg-white/[0.04]'
                            } border-gray-200/60 dark:border-white/[0.06]`}
                        >
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${eventType?.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{event.title}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500">
                              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {event.time && ` · ${event.time}`}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ─── Side Panel ─── */}
            <div className="w-full lg:w-[300px] border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-white/[0.02] flex flex-col overflow-hidden">
              {selectedDate ? (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Date Header */}
                  <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${accentTextDark}`}>
                          {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                          {selectedDate.getDate()}
                          <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1.5">
                            {selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddEvent(true);
                          setEditingEvent(null);
                          setNewEvent({ title: '', time: '', type: 'reminder', description: '' });
                        }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${accentSolid} ${accentHover} text-white shadow-sm hover:shadow-md`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    {selectedDateEvents.length > 0 && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                        {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''} scheduled
                      </p>
                    )}
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-5 py-4">
                    {/* Add/Edit Event Form */}
                    <AnimatePresence>
                      {showAddEvent && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mb-4"
                        >
                          <div className="p-4 bg-white dark:bg-white/[0.04] rounded-xl border border-gray-200/80 dark:border-white/[0.08] shadow-sm">
                            <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
                              {editingEvent ? (
                                <><Edit2 className="h-3 w-3" /> Edit Event</>
                              ) : (
                                <><Plus className="h-3 w-3" /> New Event</>
                              )}
                            </h5>
                            <div className="space-y-2.5">
                              <input
                                type="text"
                                placeholder="Event title"
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                                style={{ ['--tw-ring-color' as string]: isHR ? 'rgb(99 102 241 / 0.5)' : 'rgb(20 184 166 / 0.5)' }}
                                autoFocus
                              />
                              <input
                                type="time"
                                value={newEvent.time}
                                onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-all duration-200"
                                style={{ ['--tw-ring-color' as string]: isHR ? 'rgb(99 102 241 / 0.5)' : 'rgb(20 184 166 / 0.5)' }}
                              />
                              <div className="grid grid-cols-2 gap-1.5">
                                {eventTypes.map(type => {
                                  const Icon = type.icon;
                                  const isActive = newEvent.type === type.id;
                                  return (
                                    <button
                                      key={type.id}
                                      onClick={() => setNewEvent({ ...newEvent, type: type.id as CalendarEvent['type'] })}
                                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${isActive
                                          ? `bg-gradient-to-r ${type.gradient} text-white border-transparent shadow-sm`
                                          : 'bg-gray-50 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/[0.06] hover:bg-gray-100 dark:hover:bg-white/[0.08]'
                                        }`}
                                    >
                                      <Icon className="h-3 w-3" />
                                      {type.label}
                                    </button>
                                  );
                                })}
                              </div>
                              <textarea
                                placeholder="Add a note (optional)"
                                value={newEvent.description}
                                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/[0.08] text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent resize-none transition-all duration-200"
                                style={{ ['--tw-ring-color' as string]: isHR ? 'rgb(99 102 241 / 0.5)' : 'rgb(20 184 166 / 0.5)' }}
                              />
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={handleAddEvent}
                                  disabled={!newEvent.title.trim()}
                                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${accentSolid} ${accentHover} text-white shadow-sm`}
                                >
                                  {editingEvent ? 'Update Event' : 'Add Event'}
                                </button>
                                <button
                                  onClick={() => {
                                    setShowAddEvent(false);
                                    setEditingEvent(null);
                                  }}
                                  className="px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-all duration-200 border border-gray-200 dark:border-white/[0.06]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Events List */}
                    {selectedDateEvents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedDateEvents.map((event, idx) => {
                          const eventType = eventTypes.find(t => t.id === event.type);
                          const Icon = eventType?.icon || Star;
                          return (
                            <motion.div
                              key={event.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="group p-3.5 bg-white dark:bg-white/[0.04] rounded-xl border border-gray-200/80 dark:border-white/[0.06] hover:shadow-md hover:border-gray-300 dark:hover:border-white/[0.1] transition-all duration-200"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${eventType?.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                  <Icon className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{event.title}</h5>
                                  {event.time && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {event.time}
                                    </p>
                                  )}
                                  {event.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{event.description}</p>
                                  )}
                                </div>
                              </div>
                              {/* Action buttons - shown on hover */}
                              <div className="flex gap-1.5 mt-3 pt-2.5 border-t border-gray-100 dark:border-white/[0.04] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/[0.06] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-xs font-medium text-gray-500 dark:text-gray-400 transition-all duration-200"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-xs font-medium text-red-500 dark:text-red-400 transition-all duration-200"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : !showAddEvent ? (
                      <div className="text-center py-10">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-gray-200/50 dark:border-white/[0.06]">
                          <CalendarIcon className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No events scheduled</p>
                        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Click + to add an event</p>
                        <button
                          onClick={() => setShowAddEvent(true)}
                          className={`mt-4 inline-flex items-center gap-1.5 text-xs font-semibold ${accentTextDark} hover:underline transition-all duration-200`}
                        >
                          <Plus className="h-3 w-3" />
                          Add an event
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 px-6">
                  <div className="w-14 h-14 bg-gray-100 dark:bg-white/[0.04] rounded-2xl flex items-center justify-center mb-3 border border-gray-200/50 dark:border-white/[0.06]">
                    <CalendarIcon className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center">
                    Select a day to view events
                  </p>
                  <p className="text-xs text-gray-300 dark:text-gray-600 text-center mt-1">
                    Click on any date in the calendar
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

'use client';

import { useState, useEffect } from 'react';
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
  Check,
  FileText,
  Briefcase,
  Users,
  Star,
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

const STORAGE_KEY = 'hireq_calendar_events';

const eventTypes = [
  { id: 'interview', label: 'Interview', icon: Users, color: 'bg-purple-500' },
  { id: 'reminder', label: 'Reminder', icon: Bell, color: 'bg-orange-500' },
  { id: 'note', label: 'Note', icon: FileText, color: 'bg-blue-500' },
  { id: 'task', label: 'Task', icon: Briefcase, color: 'bg-green-500' },
];

export default function CalendarModal({ isOpen, onClose, variant = 'candidate' }: CalendarModalProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    time: '',
    type: 'reminder' as CalendarEvent['type'],
    description: '',
  });

  // Load events from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setEvents(JSON.parse(stored));
    }
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const primaryColor = variant === 'candidate' ? 'candidate' : 'primary';

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
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= nextWeek;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const upcomingEvents = getUpcomingEvents();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r ${variant === 'candidate' ? 'from-candidate-500 to-cyan-500' : 'from-primary-500 to-purple-500'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Calendar</h2>
                  <p className="text-white/80 text-sm">Schedule and manage your events</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
            {/* Calendar Grid */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevMonth}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${variant === 'candidate' ? 'bg-candidate-100 dark:bg-candidate-900/30 text-candidate-600 dark:text-candidate-400 hover:bg-candidate-200' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDate(day);
                  const today = isToday(day);
                  const selected = isSelected(day);

                  return (
                    <motion.button
                      key={day}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-start transition-all relative ${
                        selected
                          ? variant === 'candidate'
                            ? 'bg-candidate-500 text-white'
                            : 'bg-primary-500 text-white'
                          : today
                          ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-offset-2 dark:ring-offset-gray-900 ' + (variant === 'candidate' ? 'ring-candidate-500' : 'ring-primary-500')
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <span className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <div
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${selected ? 'bg-white' : event.color}`}
                            />
                          ))}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Upcoming (Next 7 days)
                  </h4>
                  <div className="space-y-2">
                    {upcomingEvents.slice(0, 3).map(event => (
                      <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className={`w-2 h-2 rounded-full ${event.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Selected Day Panel */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-6 overflow-y-auto">
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddEvent(true);
                        setEditingEvent(null);
                        setNewEvent({ title: '', time: '', type: 'reminder', description: '' });
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${variant === 'candidate' ? 'bg-candidate-500 hover:bg-candidate-600' : 'bg-primary-500 hover:bg-primary-600'} text-white`}
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Add/Edit Event Form */}
                  <AnimatePresence>
                    {showAddEvent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700"
                      >
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3">
                          {editingEvent ? 'Edit Event' : 'Add Event'}
                        </h5>
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Event title"
                            value={newEvent.title}
                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-candidate-500"
                          />
                          <input
                            type="time"
                            value={newEvent.time}
                            onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                            className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-white focus:ring-2 focus:ring-candidate-500"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {eventTypes.map(type => (
                              <button
                                key={type.id}
                                onClick={() => setNewEvent({ ...newEvent, type: type.id as CalendarEvent['type'] })}
                                className={`flex items-center gap-2 p-2 rounded-xl text-sm transition-colors ${
                                  newEvent.type === type.id
                                    ? `${type.color} text-white`
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            placeholder="Description (optional)"
                            value={newEvent.description}
                            onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-candidate-500 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddEvent}
                              disabled={!newEvent.title.trim()}
                              className={`flex-1 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 ${variant === 'candidate' ? 'bg-candidate-500 hover:bg-candidate-600' : 'bg-primary-500 hover:bg-primary-600'} text-white`}
                            >
                              {editingEvent ? 'Update' : 'Add'}
                            </button>
                            <button
                              onClick={() => {
                                setShowAddEvent(false);
                                setEditingEvent(null);
                              }}
                              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Events List */}
                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateEvents.map(event => {
                        const eventType = eventTypes.find(t => t.id === event.type);
                        const Icon = eventType?.icon || Star;
                        return (
                          <motion.div
                            key={event.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-xl ${event.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-gray-900 dark:text-white">{event.title}</h5>
                                {event.time && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {event.time}
                                  </p>
                                )}
                                {event.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
                                >
                                  <Edit2 className="h-4 w-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <CalendarIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No events for this day</p>
                      <button
                        onClick={() => setShowAddEvent(true)}
                        className={`mt-3 text-sm font-medium ${variant === 'candidate' ? 'text-candidate-600 dark:text-candidate-400' : 'text-primary-600 dark:text-primary-400'}`}
                      >
                        + Add an event
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">Select a day to view or add events</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

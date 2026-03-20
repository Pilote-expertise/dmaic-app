import React, { useState, useEffect, useMemo } from 'react';
import { ToolDefinition } from '../../types';

interface CalendarEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  time?: string;
  type: 'milestone' | 'meeting' | 'deliverable' | 'review' | 'training' | 'other';
  description: string;
  participants: string[];
  location: string;
  status: 'planned' | 'completed' | 'postponed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  reminder: boolean;
  phase: 'DEFINE' | 'MEASURE' | 'ANALYZE' | 'IMPROVE' | 'CONTROL' | '';
  notes: string;
}

interface ProjectCalendarData {
  events: CalendarEvent[];
  currentView: 'month' | 'week' | 'agenda';
  selectedMonth: string; // YYYY-MM
  projectPhases: {
    phase: string;
    startDate: string;
    endDate: string;
    color: string;
  }[];
  notes: string;
}

interface ProjectCalendarTemplateProps {
  data: ProjectCalendarData | null;
  onChange: (data: ProjectCalendarData) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const EVENT_TYPES = [
  { value: 'milestone', label: 'Jalon', icon: '🎯', color: 'bg-purple-500' },
  { value: 'meeting', label: 'Réunion', icon: '👥', color: 'bg-blue-500' },
  { value: 'deliverable', label: 'Livrable', icon: '📦', color: 'bg-green-500' },
  { value: 'review', label: 'Revue', icon: '📋', color: 'bg-orange-500' },
  { value: 'training', label: 'Formation', icon: '📚', color: 'bg-teal-500' },
  { value: 'other', label: 'Autre', icon: '📌', color: 'bg-gray-500' },
];

const getDefaultData = (): ProjectCalendarData => {
  const now = new Date();
  return {
    events: [],
    currentView: 'month',
    selectedMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    projectPhases: [],
    notes: '',
  };
};

const ProjectCalendarTemplate: React.FC<ProjectCalendarTemplateProps> = ({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}) => {
  const [localData, setLocalData] = useState<ProjectCalendarData>(() => {
    return (data && Object.keys(data).length > 0) ? { ...getDefaultData(), ...data } : getDefaultData();
  });

  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLocalData({ ...getDefaultData(), ...data });
    }
  }, [data]);

  const updateData = (updates: Partial<ProjectCalendarData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onChange(newData);
  };

  const addEvent = (date?: string) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      name: '',
      date: date || new Date().toISOString().split('T')[0],
      type: 'meeting',
      description: '',
      participants: [],
      location: '',
      status: 'planned',
      priority: 'medium',
      reminder: true,
      phase: '',
      notes: '',
    };
    setEditingEvent(newEvent);
    setShowEventModal(true);
  };

  const saveEvent = () => {
    if (!editingEvent || !editingEvent.name.trim()) return;

    const existingIndex = localData.events.findIndex(e => e.id === editingEvent.id);
    let newEvents: CalendarEvent[];

    if (existingIndex >= 0) {
      newEvents = localData.events.map(e => e.id === editingEvent.id ? editingEvent : e);
    } else {
      newEvents = [...localData.events, editingEvent];
    }

    updateData({ events: newEvents });
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const deleteEvent = (id: string) => {
    const newEvents = localData.events.filter(e => e.id !== id);
    updateData({ events: newEvents });
    setShowEventModal(false);
    setEditingEvent(null);
  };

  // Calendar calculations
  const calendarData = useMemo(() => {
    const [year, month] = localData.selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Get days from previous month to fill first week
    const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
    const daysFromPrevMonth = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = daysFromPrevMonth; i > 0; i--) {
      days.push({
        date: new Date(year, month - 2, prevMonthLastDay - i + 1),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month - 1, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to fill last week
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: false,
      });
    }

    return { days, year, month };
  }, [localData.selectedMonth]);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return localData.events.filter(event => {
      if (event.endDate) {
        return dateStr >= event.date && dateStr <= event.endDate;
      }
      return event.date === dateStr;
    });
  };

  const navigateMonth = (delta: number) => {
    const [year, month] = localData.selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + delta, 1);
    updateData({
      selectedMonth: `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`
    });
  };

  const getEventTypeConfig = (type: CalendarEvent['type']) => {
    return EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[5];
  };

  const getStatusLabel = (status: CalendarEvent['status']) => {
    switch (status) {
      case 'completed': return { label: 'Réalisé', color: 'bg-green-100 text-green-800' };
      case 'postponed': return { label: 'Reporté', color: 'bg-yellow-100 text-yellow-800' };
      case 'cancelled': return { label: 'Annulé', color: 'bg-red-100 text-red-800' };
      default: return { label: 'Planifié', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Stats
  const stats = useMemo(() => {
    const total = localData.events.length;
    const upcoming = localData.events.filter(e => e.status === 'planned' && new Date(e.date) >= new Date()).length;
    const completed = localData.events.filter(e => e.status === 'completed').length;
    const thisMonth = localData.events.filter(e => {
      const eventMonth = e.date.substring(0, 7);
      return eventMonth === localData.selectedMonth;
    }).length;

    return { total, upcoming, completed, thisMonth };
  }, [localData.events, localData.selectedMonth]);

  // Agenda view events
  const agendaEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...localData.events]
      .filter(e => new Date(e.date) >= today && e.status !== 'cancelled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20);
  }, [localData.events]);

  const monthName = new Date(calendarData.year, calendarData.month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {toolDefinition?.nameFr || 'Calendrier de Projet'}
        </h2>
        <p className="text-cyan-100">
          Suivez les jalons, réunions et échéances importantes du projet DMAIC.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Événements</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.upcoming}</div>
          <div className="text-sm text-gray-600">À venir</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Réalisés</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.thisMonth}</div>
          <div className="text-sm text-gray-600">Ce mois</div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ◀
            </button>
            <h3 className="text-xl font-semibold capitalize">{monthName}</h3>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ▶
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border">
              {['month', 'agenda'].map((view) => (
                <button
                  key={view}
                  onClick={() => updateData({ currentView: view as ProjectCalendarData['currentView'] })}
                  className={`px-4 py-2 text-sm ${
                    localData.currentView === view
                      ? 'bg-teal-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {view === 'month' ? 'Mois' : 'Agenda'}
                </button>
              ))}
            </div>
            {!readOnly && (
              <button
                onClick={() => addEvent()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                + Événement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {localData.currentView === 'month' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-gray-50">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {calendarData.days.map((day, index) => {
              const events = getEventsForDate(day.date);
              const dateStr = day.date.toISOString().split('T')[0];

              return (
                <div
                  key={index}
                  className={`min-h-[100px] border-t border-l p-1 ${
                    !day.isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isToday(day.date) ? 'bg-teal-50' : ''}`}
                  onClick={() => !readOnly && addEvent(dateStr)}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    !day.isCurrentMonth ? 'text-gray-400' :
                    isToday(day.date) ? 'text-teal-600' : 'text-gray-700'
                  }`}>
                    {day.date.getDate()}
                    {isToday(day.date) && (
                      <span className="ml-1 text-xs bg-teal-600 text-white px-1 rounded">Aujourd'hui</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 3).map(event => {
                      const typeConfig = getEventTypeConfig(event.type);
                      return (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate cursor-pointer ${typeConfig.color} text-white`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(event);
                            setShowEventModal(true);
                          }}
                        >
                          {typeConfig.icon} {event.name}
                        </div>
                      );
                    })}
                    {events.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{events.length - 3} autres
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Agenda View */}
      {localData.currentView === 'agenda' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Événements à venir</h3>

          {agendaEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-gray-500">Aucun événement à venir</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agendaEvents.map(event => {
                const typeConfig = getEventTypeConfig(event.type);
                const statusConfig = getStatusLabel(event.status);
                const eventDate = new Date(event.date);
                const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setEditingEvent(event);
                      setShowEventModal(true);
                    }}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeConfig.color}`}>
                      <span className="text-2xl">{typeConfig.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{event.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description || 'Pas de description'}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>📅 {eventDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        {event.time && <span>🕐 {event.time}</span>}
                        {event.location && <span>📍 {event.location}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium ${
                        daysUntil === 0 ? 'text-red-600' :
                        daysUntil <= 3 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {daysUntil === 0 ? "Aujourd'hui" :
                         daysUntil === 1 ? 'Demain' :
                         `Dans ${daysUntil} jours`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h4 className="font-semibold mb-3">Légende</h4>
        <div className="flex flex-wrap gap-4">
          {EVENT_TYPES.map(type => (
            <div key={type.value} className="flex items-center gap-2">
              <span className={`w-4 h-4 rounded ${type.color}`} />
              <span className="text-sm">{type.icon} {type.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {localData.events.find(e => e.id === editingEvent.id) ? 'Modifier' : 'Nouvel'} Événement
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={editingEvent.name}
                    onChange={(e) => setEditingEvent({ ...editingEvent, name: e.target.value })}
                    disabled={readOnly}
                    placeholder="Nom de l'événement"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={editingEvent.type}
                      onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value as CalendarEvent['type'] })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      {EVENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phase DMAIC</label>
                    <select
                      value={editingEvent.phase}
                      onChange={(e) => setEditingEvent({ ...editingEvent, phase: e.target.value as CalendarEvent['phase'] })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">-</option>
                      <option value="DEFINE">Define</option>
                      <option value="MEASURE">Measure</option>
                      <option value="ANALYZE">Analyze</option>
                      <option value="IMPROVE">Improve</option>
                      <option value="CONTROL">Control</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                    <input
                      type="time"
                      value={editingEvent.time || ''}
                      onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lieu</label>
                  <input
                    type="text"
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    disabled={readOnly}
                    placeholder="Salle / Lieu / Lien visio"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                    disabled={readOnly}
                    rows={3}
                    placeholder="Description de l'événement..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={editingEvent.status}
                      onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value as CalendarEvent['status'] })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="planned">Planifié</option>
                      <option value="completed">Réalisé</option>
                      <option value="postponed">Reporté</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                    <select
                      value={editingEvent.priority}
                      onChange={(e) => setEditingEvent({ ...editingEvent, priority: e.target.value as CalendarEvent['priority'] })}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <div>
                  {localData.events.find(e => e.id === editingEvent.id) && !readOnly && (
                    <button
                      onClick={() => deleteEvent(editingEvent.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setEditingEvent(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Annuler
                  </button>
                  {!readOnly && (
                    <button
                      onClick={saveEvent}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Enregistrer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📝</span>
          Notes
        </h3>
        <textarea
          value={localData.notes}
          onChange={(e) => updateData({ notes: e.target.value })}
          disabled={readOnly}
          rows={4}
          placeholder="Notes sur le calendrier, contraintes de planning..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default ProjectCalendarTemplate;

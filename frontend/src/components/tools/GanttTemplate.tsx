import React, { useState, useEffect, useMemo } from 'react';
import { ToolDefinition } from '../../types';

interface GanttTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  responsible: string;
  dependencies: string[];
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  notes: string;
  milestoneOnly: boolean;
}

interface GanttData {
  projectName: string;
  projectStart: string;
  projectEnd: string;
  tasks: GanttTask[];
  categories: string[];
  viewMode: 'day' | 'week' | 'month';
  showCompleted: boolean;
  notes: string;
}

interface GanttTemplateProps {
  data: GanttData | null;
  onChange: (data: GanttData) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const getDefaultData = (): GanttData => {
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 3);

  return {
    projectName: '',
    projectStart: today,
    projectEnd: endDate.toISOString().split('T')[0],
    tasks: [],
    categories: ['Préparation', 'Développement', 'Test', 'Déploiement'],
    viewMode: 'week',
    showCompleted: true,
    notes: '',
  };
};

const GanttTemplate: React.FC<GanttTemplateProps> = ({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}) => {
  const [localData, setLocalData] = useState<GanttData>(() => {
    return (data && Object.keys(data).length > 0) ? { ...getDefaultData(), ...data } : getDefaultData();
  });

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLocalData({ ...getDefaultData(), ...data });
    }
  }, [data]);

  const updateData = (updates: Partial<GanttData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onChange(newData);
  };

  const addTask = () => {
    const newTask: GanttTask = {
      id: Date.now().toString(),
      name: 'Nouvelle tâche',
      startDate: localData.projectStart,
      endDate: new Date(new Date(localData.projectStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      responsible: '',
      dependencies: [],
      status: 'not-started',
      priority: 'medium',
      category: localData.categories[0] || '',
      notes: '',
      milestoneOnly: false,
    };
    updateData({ tasks: [...localData.tasks, newTask] });
    setEditingTaskId(newTask.id);
  };

  const updateTask = (id: string, updates: Partial<GanttTask>) => {
    const newTasks = localData.tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    );
    updateData({ tasks: newTasks });
  };

  const deleteTask = (id: string) => {
    const newTasks = localData.tasks
      .filter(task => task.id !== id)
      .map(task => ({
        ...task,
        dependencies: task.dependencies.filter(depId => depId !== id)
      }));
    updateData({ tasks: newTasks });
  };

  // Calculate project timeline
  const timeline = useMemo(() => {
    if (localData.tasks.length === 0) {
      return { start: new Date(localData.projectStart), end: new Date(localData.projectEnd), days: [] };
    }

    const allDates = localData.tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
    const minDate = new Date(Math.min(new Date(localData.projectStart).getTime(), ...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(new Date(localData.projectEnd).getTime(), ...allDates.map(d => d.getTime())));

    const days: Date[] = [];
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { start: minDate, end: maxDate, days };
  }, [localData.tasks, localData.projectStart, localData.projectEnd]);

  // Calculate task position and width
  const getTaskPosition = (task: GanttTask) => {
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    const timelineStart = timeline.start;
    const totalDays = timeline.days.length;

    const startOffset = Math.floor((taskStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  const getStatusColor = (status: GanttTask['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-blue-500';
      case 'delayed': return 'bg-red-500';
      case 'blocked': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: GanttTask['status']) => {
    switch (status) {
      case 'completed': return '✅ Terminé';
      case 'in-progress': return '🔄 En cours';
      case 'delayed': return '⚠️ En retard';
      case 'blocked': return '🚫 Bloqué';
      default: return '⏳ Non démarré';
    }
  };

  const getPriorityColor = (priority: GanttTask['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  // Generate week headers
  const weekHeaders = useMemo(() => {
    const weeks: { label: string; width: number }[] = [];
    let currentWeekStart = new Date(timeline.start);
    let daysInWeek = 0;

    timeline.days.forEach((_, index) => {
      daysInWeek++;
      const isLastDay = index === timeline.days.length - 1;
      const nextDay = timeline.days[index + 1];
      const isEndOfWeek = nextDay && nextDay.getDay() === 1;

      if (isEndOfWeek || isLastDay) {
        const weekLabel = `S${Math.ceil((currentWeekStart.getTime() - new Date(currentWeekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`;
        weeks.push({
          label: weekLabel,
          width: (daysInWeek / timeline.days.length) * 100,
        });
        daysInWeek = 0;
        if (nextDay) {
          currentWeekStart = nextDay;
        }
      }
    });

    return weeks;
  }, [timeline]);

  // Summary stats
  const stats = useMemo(() => {
    const total = localData.tasks.length;
    const completed = localData.tasks.filter(t => t.status === 'completed').length;
    const inProgress = localData.tasks.filter(t => t.status === 'in-progress').length;
    const delayed = localData.tasks.filter(t => t.status === 'delayed').length;
    const avgProgress = total > 0 ? localData.tasks.reduce((sum, t) => sum + t.progress, 0) / total : 0;

    return { total, completed, inProgress, delayed, avgProgress };
  }, [localData.tasks]);

  const filteredTasks = localData.showCompleted
    ? localData.tasks
    : localData.tasks.filter(t => t.status !== 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {toolDefinition?.nameFr || 'Diagramme de Gantt - Implémentation'}
        </h2>
        <p className="text-indigo-100">
          Planifiez et suivez le déploiement des solutions avec un calendrier détaillé.
        </p>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Informations du Projet
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du projet
            </label>
            <input
              type="text"
              value={localData.projectName}
              onChange={(e) => updateData({ projectName: e.target.value })}
              disabled={readOnly}
              placeholder="Plan d'implémentation DMAIC"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={localData.projectStart}
              onChange={(e) => updateData({ projectStart: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={localData.projectEnd}
              onChange={(e) => updateData({ projectEnd: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Tâches totales</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Terminées</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-600">En cours</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.delayed}</div>
          <div className="text-sm text-gray-600">En retard</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.avgProgress.toFixed(0)}%</div>
          <div className="text-sm text-gray-600">Avancement moyen</div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">📊</span>
            Diagramme de Gantt
          </h3>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={localData.showCompleted}
                onChange={(e) => updateData({ showCompleted: e.target.checked })}
                className="rounded text-indigo-600"
              />
              Afficher terminées
            </label>
            {!readOnly && (
              <button
                onClick={addTask}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <span>+</span>
                Ajouter Tâche
              </button>
            )}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-gray-500">Aucune tâche. Ajoutez des tâches pour créer le planning.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Timeline Header */}
            <div className="min-w-[800px]">
              <div className="flex border-b">
                <div className="w-64 shrink-0 p-2 font-semibold text-sm bg-gray-50">Tâche</div>
                <div className="flex-1 flex bg-gray-50">
                  {weekHeaders.map((week, index) => (
                    <div
                      key={index}
                      className="text-center text-xs text-gray-600 border-l py-2"
                      style={{ width: `${week.width}%` }}
                    >
                      {week.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks */}
              {filteredTasks.map((task) => {
                const position = getTaskPosition(task);
                const isEditing = editingTaskId === task.id;

                return (
                  <div key={task.id} className="border-b hover:bg-gray-50">
                    {isEditing && !readOnly ? (
                      /* Edit Mode */
                      <div className="p-4 bg-indigo-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Nom de la tâche</label>
                            <input
                              type="text"
                              value={task.name}
                              onChange={(e) => updateTask(task.id, { name: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
                            <input
                              type="text"
                              value={task.responsible}
                              onChange={(e) => updateTask(task.id, { responsible: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Début</label>
                            <input
                              type="date"
                              value={task.startDate}
                              onChange={(e) => updateTask(task.id, { startDate: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fin</label>
                            <input
                              type="date"
                              value={task.endDate}
                              onChange={(e) => updateTask(task.id, { endDate: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Avancement (%)</label>
                            <input
                              type="number"
                              value={task.progress}
                              onChange={(e) => updateTask(task.id, { progress: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
                              min={0}
                              max={100}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(task.id, { status: e.target.value as GanttTask['status'] })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              <option value="not-started">Non démarré</option>
                              <option value="in-progress">En cours</option>
                              <option value="completed">Terminé</option>
                              <option value="delayed">En retard</option>
                              <option value="blocked">Bloqué</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Priorité</label>
                            <select
                              value={task.priority}
                              onChange={(e) => updateTask(task.id, { priority: e.target.value as GanttTask['priority'] })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              <option value="low">Basse</option>
                              <option value="medium">Moyenne</option>
                              <option value="high">Haute</option>
                              <option value="critical">Critique</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex">
                        <div
                          className="w-64 shrink-0 p-2 cursor-pointer"
                          onClick={() => !readOnly && setEditingTaskId(task.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                            <span className="text-sm font-medium truncate">{task.name}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {task.responsible || 'Non assigné'} • {calculateDuration(task.startDate, task.endDate)}j
                          </div>
                        </div>
                        <div className="flex-1 relative h-16">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex">
                            {weekHeaders.map((week, idx) => (
                              <div
                                key={idx}
                                className="border-l border-gray-100 h-full"
                                style={{ width: `${week.width}%` }}
                              />
                            ))}
                          </div>
                          {/* Task bar */}
                          <div
                            className={`absolute top-4 h-8 ${getStatusColor(task.status)} rounded shadow-sm cursor-pointer`}
                            style={{
                              left: position.left,
                              width: position.width,
                              minWidth: '20px',
                            }}
                            onClick={() => !readOnly && setEditingTaskId(task.id)}
                          >
                            {/* Progress bar */}
                            <div
                              className="absolute inset-0 bg-white opacity-30 rounded"
                              style={{ width: `${100 - task.progress}%`, right: 0, left: 'auto' }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium truncate px-1">
                              {task.progress > 0 && `${task.progress}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-gray-300" />
            <span>Non démarré</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span>En cours</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>Terminé</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>En retard</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full bg-gray-500" />
            <span>Bloqué</span>
          </div>
        </div>
      </div>

      {/* Task List (alternative view) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Liste des Tâches
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3">Tâche</th>
                <th className="text-left p-3">Responsable</th>
                <th className="text-center p-3">Début</th>
                <th className="text-center p-3">Fin</th>
                <th className="text-center p-3">Durée</th>
                <th className="text-center p-3">Avancement</th>
                <th className="text-center p-3">Statut</th>
                <th className="text-center p-3">Priorité</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(task => (
                <tr
                  key={task.id}
                  className="border-b hover:bg-gray-50 cursor-pointer"
                  onClick={() => !readOnly && setEditingTaskId(task.id)}
                >
                  <td className="p-3 font-medium">{task.name}</td>
                  <td className="p-3">{task.responsible || '-'}</td>
                  <td className="p-3 text-center">{new Date(task.startDate).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3 text-center">{new Date(task.endDate).toLocaleDateString('fr-FR')}</td>
                  <td className="p-3 text-center">{calculateDuration(task.startDate, task.endDate)}j</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status)} text-white`}>
                      {getStatusLabel(task.status).split(' ')[0]}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'critical' ? 'Critique' : task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📝</span>
          Notes et Remarques
        </h3>
        <textarea
          value={localData.notes}
          onChange={(e) => updateData({ notes: e.target.value })}
          disabled={readOnly}
          rows={4}
          placeholder="Ajoutez des notes sur le planning, les contraintes, les risques identifiés..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default GanttTemplate;

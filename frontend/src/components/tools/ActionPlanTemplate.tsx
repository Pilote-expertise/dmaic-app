import { useState, useEffect } from 'react';
import { Plus, Trash2, ListTodo, Calendar, User, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolDefinition } from '@/types';

interface Action {
  id: string;
  description: string;
  responsible: string;
  startDate: string;
  dueDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  notes: string;
}

interface ActionPlanData {
  planTitle: string;
  objective: string;
  actions: Action[];
}

interface ActionPlanTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyAction = (): Action => ({
  id: crypto.randomUUID(),
  description: '',
  responsible: '',
  startDate: '',
  dueDate: '',
  status: 'not_started',
  priority: 'medium',
  progress: 0,
  notes: '',
});

const statusConfig = {
  not_started: { label: 'Non démarré', color: 'bg-gray-100 text-gray-600', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-analyze-light text-analyze', icon: Clock },
  completed: { label: 'Terminé', color: 'bg-improve-light text-improve', icon: CheckCircle2 },
  delayed: { label: 'En retard', color: 'bg-control-light text-control', icon: AlertCircle },
  cancelled: { label: 'Annulé', color: 'bg-gray-200 text-gray-500', icon: AlertCircle },
};

const priorityConfig = {
  high: { label: 'Haute', color: 'bg-control text-white' },
  medium: { label: 'Moyenne', color: 'bg-analyze text-white' },
  low: { label: 'Basse', color: 'bg-gray-400 text-white' },
};

export default function ActionPlanTemplate({
  data,
  onChange,
  readOnly = false,
}: ActionPlanTemplateProps) {
  const [planData, setPlanData] = useState<ActionPlanData>({
    planTitle: data.planTitle || '',
    objective: data.objective || '',
    actions: data.actions?.length ? data.actions : [createEmptyAction()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setPlanData({
        planTitle: data.planTitle || '',
        objective: data.objective || '',
        actions: data.actions?.length ? data.actions : [createEmptyAction()],
      });
    }
  }, [data]);

  const updateData = (newData: ActionPlanData) => {
    setPlanData(newData);
    onChange(newData);
  };

  const addAction = () => {
    updateData({
      ...planData,
      actions: [...planData.actions, createEmptyAction()],
    });
  };

  const removeAction = (id: string) => {
    if (planData.actions.length > 1) {
      updateData({
        ...planData,
        actions: planData.actions.filter((a) => a.id !== id),
      });
    }
  };

  const updateAction = (id: string, field: keyof Action, value: string | number) => {
    updateData({
      ...planData,
      actions: planData.actions.map((a) =>
        a.id === id ? { ...a, [field]: value } : a
      ),
    });
  };

  // Stats
  const stats = {
    total: planData.actions.length,
    completed: planData.actions.filter((a) => a.status === 'completed').length,
    inProgress: planData.actions.filter((a) => a.status === 'in_progress').length,
    delayed: planData.actions.filter((a) => a.status === 'delayed').length,
    high: planData.actions.filter((a) => a.priority === 'high').length,
  };

  const overallProgress = stats.total > 0
    ? Math.round(planData.actions.reduce((sum, a) => sum + a.progress, 0) / stats.total)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-improve flex items-center justify-center">
            <ListTodo className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Plan d'Actions</h2>
            <p className="text-sm text-gray-500">
              Suivre et piloter les actions d'amélioration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Titre du plan
            </label>
            <input
              type="text"
              value={planData.planTitle}
              onChange={(e) => updateData({ ...planData, planTitle: e.target.value })}
              placeholder="Ex: Actions phase Improve"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Objectif
            </label>
            <input
              type="text"
              value={planData.objective}
              onChange={(e) => updateData({ ...planData, objective: e.target.value })}
              placeholder="Objectif visé par ces actions"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Progression globale</h3>
          <span className="text-2xl font-bold text-improve">{overallProgress}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-improve rounded-full transition-all"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <div className="grid grid-cols-5 gap-4 text-center text-sm">
          <div>
            <div className="text-xl font-bold">{stats.total}</div>
            <div className="text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-xl font-bold text-improve">{stats.completed}</div>
            <div className="text-gray-500">Terminées</div>
          </div>
          <div>
            <div className="text-xl font-bold text-analyze">{stats.inProgress}</div>
            <div className="text-gray-500">En cours</div>
          </div>
          <div>
            <div className="text-xl font-bold text-control">{stats.delayed}</div>
            <div className="text-gray-500">En retard</div>
          </div>
          <div>
            <div className="text-xl font-bold text-control">{stats.high}</div>
            <div className="text-gray-500">Priorité haute</div>
          </div>
        </div>
      </div>

      {/* Actions Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-improve text-white">
                <th className="px-3 py-3 text-left font-medium">#</th>
                <th className="px-3 py-3 text-left font-medium">Action</th>
                <th className="px-3 py-3 text-left font-medium">Responsable</th>
                <th className="px-3 py-3 text-left font-medium">Début</th>
                <th className="px-3 py-3 text-left font-medium">Échéance</th>
                <th className="px-3 py-3 text-left font-medium">Priorité</th>
                <th className="px-3 py-3 text-left font-medium">Statut</th>
                <th className="px-3 py-3 text-left font-medium">Avancement</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {planData.actions.map((action, index) => {
                const statusCfg = statusConfig[action.status];

                return (
                  <tr
                    key={action.id}
                    className={cn(
                      'border-b border-gray-100 hover:bg-gray-50',
                      action.status === 'delayed' && 'bg-control-light/20'
                    )}
                  >
                    <td className="px-3 py-3 text-gray-400">{index + 1}</td>
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={action.description}
                        onChange={(e) => updateAction(action.id, 'description', e.target.value)}
                        placeholder="Description de l'action"
                        className="w-full p-2 border border-gray-200 rounded text-sm min-w-[200px]"
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={action.responsible}
                          onChange={(e) => updateAction(action.id, 'responsible', e.target.value)}
                          placeholder="Nom"
                          className="w-24 p-2 border border-gray-200 rounded text-sm"
                          disabled={readOnly}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={action.startDate}
                        onChange={(e) => updateAction(action.id, 'startDate', e.target.value)}
                        className="w-32 p-2 border border-gray-200 rounded text-sm"
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={action.dueDate}
                        onChange={(e) => updateAction(action.id, 'dueDate', e.target.value)}
                        className="w-32 p-2 border border-gray-200 rounded text-sm"
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={action.priority}
                        onChange={(e) => updateAction(action.id, 'priority', e.target.value)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium border-0',
                          priorityConfig[action.priority].color
                        )}
                        disabled={readOnly}
                      >
                        {Object.entries(priorityConfig).map(([key, cfg]) => (
                          <option key={key} value={key}>
                            {cfg.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={action.status}
                        onChange={(e) => updateAction(action.id, 'status', e.target.value)}
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium border-0',
                          statusCfg.color
                        )}
                        disabled={readOnly}
                      >
                        {Object.entries(statusConfig).map(([key, cfg]) => (
                          <option key={key} value={key}>
                            {cfg.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="10"
                          value={action.progress}
                          onChange={(e) => updateAction(action.id, 'progress', parseInt(e.target.value))}
                          className="w-16"
                          disabled={readOnly}
                        />
                        <span className="text-xs w-8">{action.progress}%</span>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {!readOnly && planData.actions.length > 1 && (
                        <button
                          onClick={() => removeAction(action.id)}
                          className="p-1 text-gray-400 hover:text-control hover:bg-control-light rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!readOnly && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={addAction}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une action
            </button>
          </div>
        )}
      </div>

      {/* Delayed Actions Warning */}
      {stats.delayed > 0 && (
        <div className="card p-6 border-control/30 bg-control-light/10">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-control">
            <AlertCircle className="w-5 h-5" />
            Actions en retard ({stats.delayed})
          </h3>
          <ul className="space-y-2">
            {planData.actions
              .filter((a) => a.status === 'delayed')
              .map((action) => (
                <li key={action.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-3">
                  <div>
                    <span className="font-medium">{action.description || 'Sans description'}</span>
                    <span className="text-gray-500 ml-2">({action.responsible || 'Non assigné'})</span>
                  </div>
                  <div className="flex items-center gap-2 text-control">
                    <Calendar className="w-4 h-4" />
                    <span>{action.dueDate || 'Pas de date'}</span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

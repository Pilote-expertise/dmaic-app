import { useState, useEffect } from 'react';
import { Plus, Trash2, User, Calendar, Target, AlertTriangle } from 'lucide-react';
import type { ToolDefinition } from '@/types';

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Milestone {
  id: string;
  name: string;
  date: string;
  status: 'pending' | 'completed';
}

interface CharteData {
  projectTitle: string;
  sponsor: string;
  champion: string;
  startDate: string;
  targetDate: string;
  problemStatement: string;
  businessCase: string;
  projectScope: string;
  outOfScope: string;
  objectives: string;
  metrics: string;
  team: TeamMember[];
  milestones: Milestone[];
  risks: string;
  constraints: string;
}

interface CharteProjetTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyTeamMember = (): TeamMember => ({
  id: crypto.randomUUID(),
  name: '',
  role: '',
});

const createEmptyMilestone = (): Milestone => ({
  id: crypto.randomUUID(),
  name: '',
  date: '',
  status: 'pending',
});

const defaultCharteData: CharteData = {
  projectTitle: '',
  sponsor: '',
  champion: '',
  startDate: '',
  targetDate: '',
  problemStatement: '',
  businessCase: '',
  projectScope: '',
  outOfScope: '',
  objectives: '',
  metrics: '',
  team: [createEmptyTeamMember()],
  milestones: [createEmptyMilestone()],
  risks: '',
  constraints: '',
};

export default function CharteProjetTemplate({
  data,
  onChange,
  readOnly = false,
}: CharteProjetTemplateProps) {
  const [charteData, setCharteData] = useState<CharteData>({
    ...defaultCharteData,
    ...data,
    team: data.team?.length ? data.team : [createEmptyTeamMember()],
    milestones: data.milestones?.length ? data.milestones : [createEmptyMilestone()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setCharteData({
        ...defaultCharteData,
        ...data,
        team: data.team?.length ? data.team : [createEmptyTeamMember()],
        milestones: data.milestones?.length ? data.milestones : [createEmptyMilestone()],
      });
    }
  }, [data]);

  const updateData = (newData: CharteData) => {
    setCharteData(newData);
    onChange(newData);
  };

  const updateField = (field: keyof CharteData, value: string) => {
    updateData({ ...charteData, [field]: value });
  };

  // Team management
  const addTeamMember = () => {
    updateData({
      ...charteData,
      team: [...charteData.team, createEmptyTeamMember()],
    });
  };

  const removeTeamMember = (id: string) => {
    if (charteData.team.length > 1) {
      updateData({
        ...charteData,
        team: charteData.team.filter((m) => m.id !== id),
      });
    }
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string) => {
    updateData({
      ...charteData,
      team: charteData.team.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    });
  };

  // Milestones management
  const addMilestone = () => {
    updateData({
      ...charteData,
      milestones: [...charteData.milestones, createEmptyMilestone()],
    });
  };

  const removeMilestone = (id: string) => {
    if (charteData.milestones.length > 1) {
      updateData({
        ...charteData,
        milestones: charteData.milestones.filter((m) => m.id !== id),
      });
    }
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    updateData({
      ...charteData,
      milestones: charteData.milestones.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-define flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Charte de Projet</h2>
            <p className="text-sm text-gray-500">
              Document fondateur du projet DMAIC
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">
              Titre du projet
            </label>
            <input
              type="text"
              value={charteData.projectTitle}
              onChange={(e) => updateField('projectTitle', e.target.value)}
              placeholder="Ex: Réduction des délais de livraison"
              className="input text-lg font-medium"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sponsor</label>
            <input
              type="text"
              value={charteData.sponsor}
              onChange={(e) => updateField('sponsor', e.target.value)}
              placeholder="Nom du sponsor"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Champion</label>
            <input
              type="text"
              value={charteData.champion}
              onChange={(e) => updateField('champion', e.target.value)}
              placeholder="Nom du champion"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date de début</label>
            <input
              type="date"
              value={charteData.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date cible</label>
            <input
              type="date"
              value={charteData.targetDate}
              onChange={(e) => updateField('targetDate', e.target.value)}
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Problem & Business Case */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-analyze" />
          Problème et Justification
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Énoncé du problème
            </label>
            <textarea
              value={charteData.problemStatement}
              onChange={(e) => updateField('problemStatement', e.target.value)}
              placeholder="Décrivez le problème de manière claire et factuelle..."
              className="input min-h-[100px] resize-none"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Justification business (Business Case)
            </label>
            <textarea
              value={charteData.businessCase}
              onChange={(e) => updateField('businessCase', e.target.value)}
              placeholder="Pourquoi ce projet est-il important ? Quel est l'impact financier ?"
              className="input min-h-[100px] resize-none"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Scope */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Périmètre</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-improve">
              Dans le périmètre (In Scope)
            </label>
            <textarea
              value={charteData.projectScope}
              onChange={(e) => updateField('projectScope', e.target.value)}
              placeholder="Ce qui est inclus dans le projet..."
              className="input min-h-[120px] resize-none border-improve/30 focus:ring-improve"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-control">
              Hors périmètre (Out of Scope)
            </label>
            <textarea
              value={charteData.outOfScope}
              onChange={(e) => updateField('outOfScope', e.target.value)}
              placeholder="Ce qui est exclu du projet..."
              className="input min-h-[120px] resize-none border-control/30 focus:ring-control"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Objectives & Metrics */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-define" />
          Objectifs et Métriques
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Objectifs</label>
            <textarea
              value={charteData.objectives}
              onChange={(e) => updateField('objectives', e.target.value)}
              placeholder="Objectifs SMART du projet..."
              className="input min-h-[120px] resize-none"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Métriques de succès (KPIs)
            </label>
            <textarea
              value={charteData.metrics}
              onChange={(e) => updateField('metrics', e.target.value)}
              placeholder="Comment mesurer le succès..."
              className="input min-h-[120px] resize-none"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-measure" />
            Équipe projet
          </h3>
          {!readOnly && (
            <button
              onClick={addTeamMember}
              className="btn btn-secondary text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>
        <div className="space-y-3">
          {charteData.team.map((member) => (
            <div key={member.id} className="flex items-center gap-3">
              <input
                type="text"
                value={member.name}
                onChange={(e) =>
                  updateTeamMember(member.id, 'name', e.target.value)
                }
                placeholder="Nom du membre"
                className="input flex-1"
                disabled={readOnly}
              />
              <input
                type="text"
                value={member.role}
                onChange={(e) =>
                  updateTeamMember(member.id, 'role', e.target.value)
                }
                placeholder="Rôle"
                className="input w-48"
                disabled={readOnly}
              />
              {!readOnly && charteData.team.length > 1 && (
                <button
                  onClick={() => removeTeamMember(member.id)}
                  className="p-2 text-gray-400 hover:text-control hover:bg-control-light rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-analyze" />
            Jalons principaux
          </h3>
          {!readOnly && (
            <button
              onClick={addMilestone}
              className="btn btn-secondary text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          )}
        </div>
        <div className="space-y-3">
          {charteData.milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-center gap-3">
              <input
                type="text"
                value={milestone.name}
                onChange={(e) =>
                  updateMilestone(milestone.id, 'name', e.target.value)
                }
                placeholder="Description du jalon"
                className="input flex-1"
                disabled={readOnly}
              />
              <input
                type="date"
                value={milestone.date}
                onChange={(e) =>
                  updateMilestone(milestone.id, 'date', e.target.value)
                }
                className="input w-40"
                disabled={readOnly}
              />
              {!readOnly && charteData.milestones.length > 1 && (
                <button
                  onClick={() => removeMilestone(milestone.id)}
                  className="p-2 text-gray-400 hover:text-control hover:bg-control-light rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Risks & Constraints */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Risques et Contraintes</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-control">
              Risques identifiés
            </label>
            <textarea
              value={charteData.risks}
              onChange={(e) => updateField('risks', e.target.value)}
              placeholder="Risques potentiels et mitigations..."
              className="input min-h-[100px] resize-none"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-analyze">
              Contraintes
            </label>
            <textarea
              value={charteData.constraints}
              onChange={(e) => updateField('constraints', e.target.value)}
              placeholder="Budget, ressources, délais..."
              className="input min-h-[100px] resize-none"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types';

interface ProjectClosureData {
  projectInfo: {
    projectName: string;
    projectCode: string;
    startDate: string;
    endDate: string;
    plannedEndDate: string;
    projectLeader: string;
    sponsor: string;
    team: string[];
  };
  objectives: {
    id: string;
    description: string;
    targetValue: string;
    achievedValue: string;
    status: 'achieved' | 'partially' | 'not-achieved';
    comments: string;
  }[];
  finalStatus: 'objectives-achieved' | 'partially-achieved' | 'not-achieved' | 'cancelled';
  financialSummary: {
    totalInvestment: number;
    totalGains: number;
    roi: number;
    paybackMonths: number;
    gainsValidatedBy: string;
    gainsValidationDate: string;
  };
  sustainability: {
    controlPlanInPlace: boolean;
    controlPlanNotes: string;
    trainingCompleted: boolean;
    trainingNotes: string;
    proceduresUpdated: boolean;
    proceduresNotes: string;
    ownershipTransferred: boolean;
    processOwner: string;
    monitoringPlan: string;
  };
  lessonsLearned: {
    whatWorkedWell: string;
    whatCouldBeImproved: string;
    recommendations: string;
    toolsMethodsUsed: string;
  };
  replication: {
    replicationOpportunities: string;
    estimatedAdditionalGains: number;
    nextSteps: string;
  };
  signatures: {
    projectLeaderSignature: boolean;
    projectLeaderDate: string;
    sponsorSignature: boolean;
    sponsorDate: string;
    financeSignature: boolean;
    financeDate: string;
  };
  celebration: {
    celebrationPlanned: boolean;
    celebrationDate: string;
    celebrationDetails: string;
  };
  closureDate: string;
  finalRemarks: string;
}

interface ProjectClosureTemplateProps {
  data: ProjectClosureData | null;
  onChange: (data: ProjectClosureData) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const getDefaultData = (): ProjectClosureData => ({
  projectInfo: {
    projectName: '',
    projectCode: '',
    startDate: '',
    endDate: new Date().toISOString().split('T')[0],
    plannedEndDate: '',
    projectLeader: '',
    sponsor: '',
    team: [],
  },
  objectives: [],
  finalStatus: 'objectives-achieved',
  financialSummary: {
    totalInvestment: 0,
    totalGains: 0,
    roi: 0,
    paybackMonths: 0,
    gainsValidatedBy: '',
    gainsValidationDate: '',
  },
  sustainability: {
    controlPlanInPlace: false,
    controlPlanNotes: '',
    trainingCompleted: false,
    trainingNotes: '',
    proceduresUpdated: false,
    proceduresNotes: '',
    ownershipTransferred: false,
    processOwner: '',
    monitoringPlan: '',
  },
  lessonsLearned: {
    whatWorkedWell: '',
    whatCouldBeImproved: '',
    recommendations: '',
    toolsMethodsUsed: '',
  },
  replication: {
    replicationOpportunities: '',
    estimatedAdditionalGains: 0,
    nextSteps: '',
  },
  signatures: {
    projectLeaderSignature: false,
    projectLeaderDate: '',
    sponsorSignature: false,
    sponsorDate: '',
    financeSignature: false,
    financeDate: '',
  },
  celebration: {
    celebrationPlanned: false,
    celebrationDate: '',
    celebrationDetails: '',
  },
  closureDate: '',
  finalRemarks: '',
});

const ProjectClosureTemplate: React.FC<ProjectClosureTemplateProps> = ({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}) => {
  const [localData, setLocalData] = useState<ProjectClosureData>(() => {
    return (data && Object.keys(data).length > 0) ? { ...getDefaultData(), ...data } : getDefaultData();
  });

  const [newTeamMember, setNewTeamMember] = useState('');

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLocalData({ ...getDefaultData(), ...data });
    }
  }, [data]);

  const updateData = (updates: Partial<ProjectClosureData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onChange(newData);
  };

  const updateProjectInfo = (updates: Partial<ProjectClosureData['projectInfo']>) => {
    updateData({ projectInfo: { ...localData.projectInfo, ...updates } });
  };

  const updateFinancialSummary = (updates: Partial<ProjectClosureData['financialSummary']>) => {
    updateData({ financialSummary: { ...localData.financialSummary, ...updates } });
  };

  const updateSustainability = (updates: Partial<ProjectClosureData['sustainability']>) => {
    updateData({ sustainability: { ...localData.sustainability, ...updates } });
  };

  const updateLessonsLearned = (updates: Partial<ProjectClosureData['lessonsLearned']>) => {
    updateData({ lessonsLearned: { ...localData.lessonsLearned, ...updates } });
  };

  const updateReplication = (updates: Partial<ProjectClosureData['replication']>) => {
    updateData({ replication: { ...localData.replication, ...updates } });
  };

  const updateSignatures = (updates: Partial<ProjectClosureData['signatures']>) => {
    updateData({ signatures: { ...localData.signatures, ...updates } });
  };

  const updateCelebration = (updates: Partial<ProjectClosureData['celebration']>) => {
    updateData({ celebration: { ...localData.celebration, ...updates } });
  };

  const addTeamMember = () => {
    if (newTeamMember.trim()) {
      updateProjectInfo({ team: [...localData.projectInfo.team, newTeamMember.trim()] });
      setNewTeamMember('');
    }
  };

  const removeTeamMember = (index: number) => {
    const newTeam = localData.projectInfo.team.filter((_, i) => i !== index);
    updateProjectInfo({ team: newTeam });
  };

  const addObjective = () => {
    const newObjective = {
      id: Date.now().toString(),
      description: '',
      targetValue: '',
      achievedValue: '',
      status: 'achieved' as const,
      comments: '',
    };
    updateData({ objectives: [...localData.objectives, newObjective] });
  };

  const updateObjective = (id: string, updates: Partial<ProjectClosureData['objectives'][0]>) => {
    const newObjectives = localData.objectives.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    );
    updateData({ objectives: newObjectives });
  };

  const deleteObjective = (id: string) => {
    const newObjectives = localData.objectives.filter(obj => obj.id !== id);
    updateData({ objectives: newObjectives });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const calculateDuration = () => {
    if (!localData.projectInfo.startDate || !localData.projectInfo.endDate) return '-';
    const start = new Date(localData.projectInfo.startDate);
    const end = new Date(localData.projectInfo.endDate);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return `${months} mois`;
  };

  const getStatusConfig = (status: ProjectClosureData['finalStatus']) => {
    switch (status) {
      case 'objectives-achieved':
        return { label: 'Objectifs Atteints', color: 'bg-green-500', icon: '🎉' };
      case 'partially-achieved':
        return { label: 'Partiellement Atteints', color: 'bg-yellow-500', icon: '⚠️' };
      case 'not-achieved':
        return { label: 'Non Atteints', color: 'bg-red-500', icon: '❌' };
      case 'cancelled':
        return { label: 'Projet Annulé', color: 'bg-gray-500', icon: '🚫' };
      default:
        return { label: '-', color: 'bg-gray-300', icon: '❓' };
    }
  };

  const getObjectiveStatusConfig = (status: string) => {
    switch (status) {
      case 'achieved': return { label: 'Atteint', color: 'bg-green-100 text-green-800' };
      case 'partially': return { label: 'Partiel', color: 'bg-yellow-100 text-yellow-800' };
      default: return { label: 'Non atteint', color: 'bg-red-100 text-red-800' };
    }
  };

  const allSignaturesComplete = localData.signatures.projectLeaderSignature &&
    localData.signatures.sponsorSignature &&
    localData.signatures.financeSignature;

  const statusConfig = getStatusConfig(localData.finalStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {toolDefinition?.nameFr || 'Clôture du Projet'}
        </h2>
        <p className="text-indigo-100">
          Formalisez la fin du projet DMAIC et célébrez les succès avec l'équipe.
        </p>
      </div>

      {/* Status Banner */}
      <div className={`${statusConfig.color} rounded-lg p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl">{statusConfig.icon}</span>
            <div>
              <h3 className="text-2xl font-bold">{statusConfig.label}</h3>
              <p className="text-white text-opacity-90">Statut final du projet</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{formatCurrency(localData.financialSummary.totalGains)}</div>
            <p className="text-white text-opacity-90">Gains totaux validés</p>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Informations du Projet
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom du projet</label>
            <input
              type="text"
              value={localData.projectInfo.projectName}
              onChange={(e) => updateProjectInfo({ projectName: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code projet</label>
            <input
              type="text"
              value={localData.projectInfo.projectCode}
              onChange={(e) => updateProjectInfo({ projectCode: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chef de projet</label>
            <input
              type="text"
              value={localData.projectInfo.projectLeader}
              onChange={(e) => updateProjectInfo({ projectLeader: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor</label>
            <input
              type="text"
              value={localData.projectInfo.sponsor}
              onChange={(e) => updateProjectInfo({ sponsor: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
            <input
              type="date"
              value={localData.projectInfo.startDate}
              onChange={(e) => updateProjectInfo({ startDate: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
            <input
              type="date"
              value={localData.projectInfo.endDate}
              onChange={(e) => updateProjectInfo({ endDate: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Team */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Équipe projet</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {localData.projectInfo.team.map((member, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                {member}
                {!readOnly && (
                  <button onClick={() => removeTeamMember(index)} className="ml-2 text-indigo-600 hover:text-indigo-800">
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newTeamMember}
                onChange={(e) => setNewTeamMember(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTeamMember()}
                placeholder="Ajouter un membre"
                className="flex-1 px-3 py-2 border rounded-lg"
              />
              <button onClick={addTeamMember} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Ajouter
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
          <div className="text-sm text-gray-600">Durée totale du projet</div>
          <div className="text-2xl font-bold text-indigo-600">{calculateDuration()}</div>
        </div>
      </div>

      {/* Objectives */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Atteinte des Objectifs
          </h3>
          {!readOnly && (
            <button onClick={addObjective} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              + Ajouter Objectif
            </button>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut final</label>
          <select
            value={localData.finalStatus}
            onChange={(e) => updateData({ finalStatus: e.target.value as ProjectClosureData['finalStatus'] })}
            disabled={readOnly}
            className="w-full md:w-64 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="objectives-achieved">✅ Objectifs atteints</option>
            <option value="partially-achieved">⚠️ Partiellement atteints</option>
            <option value="not-achieved">❌ Non atteints</option>
            <option value="cancelled">🚫 Projet annulé</option>
          </select>
        </div>

        {localData.objectives.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Ajoutez les objectifs du projet et leur statut final.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {localData.objectives.map((obj, index) => {
              const statusConfig = getObjectiveStatusConfig(obj.status);
              return (
                <div key={obj.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <span className="bg-indigo-600 text-white text-sm px-2 py-1 rounded">#{index + 1}</span>
                    {!readOnly && (
                      <button onClick={() => deleteObjective(obj.id)} className="text-red-500">🗑️</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={obj.description}
                        onChange={(e) => updateObjective(obj.id, { description: e.target.value })}
                        disabled={readOnly}
                        placeholder="Objectif"
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Statut</label>
                      <select
                        value={obj.status}
                        onChange={(e) => updateObjective(obj.id, { status: e.target.value as 'achieved' | 'partially' | 'not-achieved' })}
                        disabled={readOnly}
                        className={`w-full px-2 py-1 border rounded ${statusConfig.color}`}
                      >
                        <option value="achieved">✅ Atteint</option>
                        <option value="partially">⚠️ Partiel</option>
                        <option value="not-achieved">❌ Non atteint</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Valeur cible</label>
                      <input
                        type="text"
                        value={obj.targetValue}
                        onChange={(e) => updateObjective(obj.id, { targetValue: e.target.value })}
                        disabled={readOnly}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Valeur atteinte</label>
                      <input
                        type="text"
                        value={obj.achievedValue}
                        onChange={(e) => updateObjective(obj.id, { achievedValue: e.target.value })}
                        disabled={readOnly}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">💰</span>
          Synthèse Financière
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600 mb-1">Investissement</div>
            <input
              type="number"
              value={localData.financialSummary.totalInvestment}
              onChange={(e) => updateFinancialSummary({ totalInvestment: parseFloat(e.target.value) || 0 })}
              disabled={readOnly}
              className="w-full text-center text-xl font-bold text-red-600 bg-transparent border-b border-red-200"
            />
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600 mb-1">Gains totaux</div>
            <input
              type="number"
              value={localData.financialSummary.totalGains}
              onChange={(e) => updateFinancialSummary({ totalGains: parseFloat(e.target.value) || 0 })}
              disabled={readOnly}
              className="w-full text-center text-xl font-bold text-green-600 bg-transparent border-b border-green-200"
            />
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600 mb-1">ROI</div>
            <div className="text-xl font-bold text-blue-600">
              {localData.financialSummary.totalInvestment > 0
                ? `${(((localData.financialSummary.totalGains - localData.financialSummary.totalInvestment) / localData.financialSummary.totalInvestment) * 100).toFixed(0)}%`
                : '-'}
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-sm text-gray-600 mb-1">Payback</div>
            <input
              type="number"
              value={localData.financialSummary.paybackMonths}
              onChange={(e) => updateFinancialSummary({ paybackMonths: parseFloat(e.target.value) || 0 })}
              disabled={readOnly}
              className="w-full text-center text-xl font-bold text-purple-600 bg-transparent border-b border-purple-200"
              step={0.1}
            />
            <span className="text-xs text-gray-500">mois</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gains validés par</label>
            <input
              type="text"
              value={localData.financialSummary.gainsValidatedBy}
              onChange={(e) => updateFinancialSummary({ gainsValidatedBy: e.target.value })}
              disabled={readOnly}
              placeholder="Contrôleur financier"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de validation</label>
            <input
              type="date"
              value={localData.financialSummary.gainsValidationDate}
              onChange={(e) => updateFinancialSummary({ gainsValidationDate: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Sustainability */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">🔄</span>
          Pérennité des Résultats
        </h3>

        <div className="space-y-4">
          {[
            { key: 'controlPlanInPlace', label: 'Plan de contrôle en place', notesKey: 'controlPlanNotes' },
            { key: 'trainingCompleted', label: 'Formations réalisées', notesKey: 'trainingNotes' },
            { key: 'proceduresUpdated', label: 'Procédures mises à jour', notesKey: 'proceduresNotes' },
            { key: 'ownershipTransferred', label: 'Transfert au propriétaire processus', notesKey: 'processOwner' },
          ].map((item) => (
            <div key={item.key} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={localData.sustainability[item.key as keyof typeof localData.sustainability] as boolean}
                onChange={(e) => updateSustainability({ [item.key]: e.target.checked })}
                disabled={readOnly}
                className="mt-1 w-5 h-5 rounded text-green-600"
              />
              <div className="flex-1">
                <label className="font-medium">{item.label}</label>
                <input
                  type="text"
                  value={localData.sustainability[item.notesKey as keyof typeof localData.sustainability] as string}
                  onChange={(e) => updateSustainability({ [item.notesKey]: e.target.value })}
                  disabled={readOnly}
                  placeholder="Notes..."
                  className="w-full mt-1 px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan de suivi</label>
            <textarea
              value={localData.sustainability.monitoringPlan}
              onChange={(e) => updateSustainability({ monitoringPlan: e.target.value })}
              disabled={readOnly}
              rows={3}
              placeholder="Comment les gains seront-ils suivis après la clôture?"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Lessons Learned */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📚</span>
          Retour d'Expérience
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ce qui a bien fonctionné</label>
            <textarea
              value={localData.lessonsLearned.whatWorkedWell}
              onChange={(e) => updateLessonsLearned({ whatWorkedWell: e.target.value })}
              disabled={readOnly}
              rows={3}
              placeholder="Points positifs, bonnes pratiques..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ce qui pourrait être amélioré</label>
            <textarea
              value={localData.lessonsLearned.whatCouldBeImproved}
              onChange={(e) => updateLessonsLearned({ whatCouldBeImproved: e.target.value })}
              disabled={readOnly}
              rows={3}
              placeholder="Difficultés rencontrées, axes d'amélioration..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommandations pour les futurs projets</label>
            <textarea
              value={localData.lessonsLearned.recommendations}
              onChange={(e) => updateLessonsLearned({ recommendations: e.target.value })}
              disabled={readOnly}
              rows={3}
              placeholder="Conseils, points d'attention..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Replication */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">🔁</span>
          Opportunités de Réplication
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sites/processus où répliquer</label>
            <textarea
              value={localData.replication.replicationOpportunities}
              onChange={(e) => updateReplication({ replicationOpportunities: e.target.value })}
              disabled={readOnly}
              rows={3}
              placeholder="Autres sites, lignes, processus pouvant bénéficier des mêmes améliorations..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gains additionnels estimés (€)</label>
              <input
                type="number"
                value={localData.replication.estimatedAdditionalGains}
                onChange={(e) => updateReplication({ estimatedAdditionalGains: parseFloat(e.target.value) || 0 })}
                disabled={readOnly}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prochaines étapes</label>
              <input
                type="text"
                value={localData.replication.nextSteps}
                onChange={(e) => updateReplication({ nextSteps: e.target.value })}
                disabled={readOnly}
                placeholder="Actions pour déployer..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">✍️</span>
          Signatures de Clôture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { key: 'projectLeader', label: 'Chef de projet', signKey: 'projectLeaderSignature', dateKey: 'projectLeaderDate' },
            { key: 'sponsor', label: 'Sponsor', signKey: 'sponsorSignature', dateKey: 'sponsorDate' },
            { key: 'finance', label: 'Finance', signKey: 'financeSignature', dateKey: 'financeDate' },
          ].map((signer) => (
            <div
              key={signer.key}
              className={`p-4 rounded-lg border-2 ${
                localData.signatures[signer.signKey as keyof typeof localData.signatures]
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{signer.label}</span>
                <input
                  type="checkbox"
                  checked={localData.signatures[signer.signKey as keyof typeof localData.signatures] as boolean}
                  onChange={(e) => updateSignatures({ [signer.signKey]: e.target.checked })}
                  disabled={readOnly}
                  className="w-5 h-5 rounded text-green-600"
                />
              </div>
              <input
                type="date"
                value={localData.signatures[signer.dateKey as keyof typeof localData.signatures] as string}
                onChange={(e) => updateSignatures({ [signer.dateKey]: e.target.value })}
                disabled={readOnly}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          ))}
        </div>

        {allSignaturesComplete && (
          <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-center">
            <span className="text-green-700 font-semibold">✅ Toutes les signatures sont complètes</span>
          </div>
        )}
      </div>

      {/* Celebration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">🎉</span>
          Célébration
        </h3>

        <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
          <input
            type="checkbox"
            checked={localData.celebration.celebrationPlanned}
            onChange={(e) => updateCelebration({ celebrationPlanned: e.target.checked })}
            disabled={readOnly}
            className="mt-1 w-5 h-5 rounded text-yellow-600"
          />
          <div className="flex-1">
            <label className="font-medium">Célébration prévue pour l'équipe</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-xs text-gray-500">Date</label>
                <input
                  type="date"
                  value={localData.celebration.celebrationDate}
                  onChange={(e) => updateCelebration({ celebrationDate: e.target.value })}
                  disabled={readOnly}
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Détails</label>
                <input
                  type="text"
                  value={localData.celebration.celebrationDetails}
                  onChange={(e) => updateCelebration({ celebrationDetails: e.target.value })}
                  disabled={readOnly}
                  placeholder="Déjeuner d'équipe, reconnaissance..."
                  className="w-full px-2 py-1 border rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Closure */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📅</span>
          Clôture Officielle
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date de clôture officielle</label>
            <input
              type="date"
              value={localData.closureDate}
              onChange={(e) => updateData({ closureDate: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarques finales</label>
          <textarea
            value={localData.finalRemarks}
            onChange={(e) => updateData({ finalRemarks: e.target.value })}
            disabled={readOnly}
            rows={4}
            placeholder="Mots de conclusion, remerciements à l'équipe..."
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectClosureTemplate;

import React, { useState, useEffect, useMemo } from 'react';
import { ToolDefinition } from '../../types';

interface TrainingSession {
  id: string;
  topic: string;
  description: string;
  targetAudience: string;
  trainer: string;
  plannedDate: string;
  actualDate: string;
  duration: number;
  location: string;
  materials: string[];
  attendees: {
    name: string;
    attended: boolean;
    score?: number;
  }[];
  expectedAttendees: number;
  status: 'planned' | 'completed' | 'postponed' | 'cancelled';
  effectiveness: 'to-evaluate' | 'effective' | 'needs-improvement' | 'to-redo';
  feedbackScore: number | null;
  notes: string;
}

interface TrainingData {
  sessions: TrainingSession[];
  globalObjective: string;
  trainingPlan: string;
  evaluationMethod: string;
  followUpActions: string;
  overallNotes: string;
}

interface TrainingTemplateProps {
  data: TrainingData | null;
  onChange: (data: TrainingData) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const TrainingTemplate: React.FC<TrainingTemplateProps> = ({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}) => {
  const [localData, setLocalData] = useState<TrainingData>(() => {
    return data || {
      sessions: [],
      globalObjective: '',
      trainingPlan: '',
      evaluationMethod: '',
      followUpActions: '',
      overallNotes: '',
    };
  });

  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [newMaterial, setNewMaterial] = useState('');
  const [newAttendeeName, setNewAttendeeName] = useState('');

  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const updateData = (updates: Partial<TrainingData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onChange(newData);
  };

  const addSession = () => {
    const newSession: TrainingSession = {
      id: Date.now().toString(),
      topic: '',
      description: '',
      targetAudience: '',
      trainer: '',
      plannedDate: new Date().toISOString().split('T')[0],
      actualDate: '',
      duration: 60,
      location: '',
      materials: [],
      attendees: [],
      expectedAttendees: 0,
      status: 'planned',
      effectiveness: 'to-evaluate',
      feedbackScore: null,
      notes: '',
    };
    updateData({ sessions: [...localData.sessions, newSession] });
    setEditingSession(newSession.id);
  };

  const updateSession = (id: string, updates: Partial<TrainingSession>) => {
    const newSessions = localData.sessions.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    updateData({ sessions: newSessions });
  };

  const deleteSession = (id: string) => {
    const newSessions = localData.sessions.filter(s => s.id !== id);
    updateData({ sessions: newSessions });
    setEditingSession(null);
  };

  const addMaterial = (sessionId: string) => {
    if (!newMaterial.trim()) return;
    const session = localData.sessions.find(s => s.id === sessionId);
    if (session) {
      updateSession(sessionId, { materials: [...session.materials, newMaterial.trim()] });
      setNewMaterial('');
    }
  };

  const removeMaterial = (sessionId: string, index: number) => {
    const session = localData.sessions.find(s => s.id === sessionId);
    if (session) {
      const newMaterials = session.materials.filter((_, i) => i !== index);
      updateSession(sessionId, { materials: newMaterials });
    }
  };

  const addAttendee = (sessionId: string) => {
    if (!newAttendeeName.trim()) return;
    const session = localData.sessions.find(s => s.id === sessionId);
    if (session) {
      updateSession(sessionId, {
        attendees: [...session.attendees, { name: newAttendeeName.trim(), attended: false }]
      });
      setNewAttendeeName('');
    }
  };

  const updateAttendee = (sessionId: string, attendeeIndex: number, updates: Partial<TrainingSession['attendees'][0]>) => {
    const session = localData.sessions.find(s => s.id === sessionId);
    if (session) {
      const newAttendees = session.attendees.map((a, i) =>
        i === attendeeIndex ? { ...a, ...updates } : a
      );
      updateSession(sessionId, { attendees: newAttendees });
    }
  };

  const removeAttendee = (sessionId: string, index: number) => {
    const session = localData.sessions.find(s => s.id === sessionId);
    if (session) {
      const newAttendees = session.attendees.filter((_, i) => i !== index);
      updateSession(sessionId, { attendees: newAttendees });
    }
  };

  const getStatusColor = (status: TrainingSession['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'postponed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEffectivenessConfig = (effectiveness: TrainingSession['effectiveness']) => {
    switch (effectiveness) {
      case 'effective': return { label: 'Efficace', color: 'text-green-600', icon: '✅' };
      case 'needs-improvement': return { label: 'À améliorer', color: 'text-yellow-600', icon: '⚠️' };
      case 'to-redo': return { label: 'À refaire', color: 'text-red-600', icon: '🔄' };
      default: return { label: 'À évaluer', color: 'text-gray-600', icon: '⏳' };
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const total = localData.sessions.length;
    const completed = localData.sessions.filter(s => s.status === 'completed').length;
    const effective = localData.sessions.filter(s => s.effectiveness === 'effective').length;
    const totalAttendees = localData.sessions.reduce((sum, s) => sum + s.attendees.filter(a => a.attended).length, 0);
    const totalExpected = localData.sessions.reduce((sum, s) => sum + (s.expectedAttendees || s.attendees.length), 0);
    const avgFeedback = localData.sessions.filter(s => s.feedbackScore !== null).reduce((sum, s) => sum + (s.feedbackScore || 0), 0) / (localData.sessions.filter(s => s.feedbackScore !== null).length || 1);

    return {
      total,
      completed,
      effective,
      totalAttendees,
      totalExpected,
      attendanceRate: totalExpected > 0 ? (totalAttendees / totalExpected) * 100 : 0,
      avgFeedback,
    };
  }, [localData.sessions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {toolDefinition?.nameFr || 'Plan de Formation'}
        </h2>
        <p className="text-emerald-100">
          Planifiez, suivez et évaluez les formations pour assurer la pérennité des améliorations.
        </p>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Formations</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-600">Réalisées</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.effective}</div>
          <div className="text-sm text-gray-600">Efficaces</div>
        </div>
        <div className="bg-purple-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.totalAttendees}</div>
          <div className="text-sm text-gray-600">Formés</div>
        </div>
        <div className="bg-orange-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">{stats.attendanceRate.toFixed(0)}%</div>
          <div className="text-sm text-gray-600">Participation</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats.avgFeedback.toFixed(1)}/5</div>
          <div className="text-sm text-gray-600">Satisfaction</div>
        </div>
      </div>

      {/* Training Plan Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Vue d'Ensemble du Plan de Formation
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objectif global de la formation
            </label>
            <textarea
              value={localData.globalObjective}
              onChange={(e) => updateData({ globalObjective: e.target.value })}
              disabled={readOnly}
              rows={2}
              placeholder="Ex: Assurer que 100% du personnel concerné maîtrise le nouveau processus d'ici fin du mois"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Méthode d'évaluation de l'efficacité
            </label>
            <textarea
              value={localData.evaluationMethod}
              onChange={(e) => updateData({ evaluationMethod: e.target.value })}
              disabled={readOnly}
              rows={2}
              placeholder="Comment allez-vous mesurer que les formations sont efficaces? (tests, observations, indicateurs...)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Training Sessions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">📚</span>
            Sessions de Formation
          </h3>
          {!readOnly && (
            <button
              onClick={addSession}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Ajouter Formation
            </button>
          )}
        </div>

        {localData.sessions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-500">Aucune formation planifiée. Ajoutez des sessions de formation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {localData.sessions.map((session, index) => {
              const isEditing = editingSession === session.id;
              const effectivenessConfig = getEffectivenessConfig(session.effectiveness);
              const attendedCount = session.attendees.filter(a => a.attended).length;

              return (
                <div
                  key={session.id}
                  className={`border-2 rounded-lg ${getStatusColor(session.status)}`}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-emerald-600 text-white text-sm px-3 py-1 rounded-full">
                          #{index + 1}
                        </span>
                        <h4 className="text-lg font-semibold">
                          {session.topic || 'Formation sans titre'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(session.status)}`}>
                          {session.status === 'completed' ? '✅ Réalisée' :
                           session.status === 'postponed' ? '📅 Reportée' :
                           session.status === 'cancelled' ? '❌ Annulée' : '📋 Planifiée'}
                        </span>
                        {!readOnly && (
                          <button
                            onClick={() => setEditingSession(isEditing ? null : session.id)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {isEditing ? 'Réduire' : 'Modifier'}
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      /* Edit Mode */
                      <div className="space-y-4 bg-white p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Sujet de formation *</label>
                            <input
                              type="text"
                              value={session.topic}
                              onChange={(e) => updateSession(session.id, { topic: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Ex: Nouveau processus de validation"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Public cible</label>
                            <input
                              type="text"
                              value={session.targetAudience}
                              onChange={(e) => updateSession(session.id, { targetAudience: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Ex: Opérateurs ligne A"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                          <textarea
                            value={session.description}
                            onChange={(e) => updateSession(session.id, { description: e.target.value })}
                            rows={2}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Contenu et objectifs de la formation..."
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Formateur</label>
                            <input
                              type="text"
                              value={session.trainer}
                              onChange={(e) => updateSession(session.id, { trainer: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date prévue</label>
                            <input
                              type="date"
                              value={session.plannedDate}
                              onChange={(e) => updateSession(session.id, { plannedDate: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date réelle</label>
                            <input
                              type="date"
                              value={session.actualDate}
                              onChange={(e) => updateSession(session.id, { actualDate: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Durée (min)</label>
                            <input
                              type="number"
                              value={session.duration}
                              onChange={(e) => updateSession(session.id, { duration: parseInt(e.target.value) || 60 })}
                              min={15}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Lieu</label>
                            <input
                              type="text"
                              value={session.location}
                              onChange={(e) => updateSession(session.id, { location: e.target.value })}
                              className="w-full px-2 py-1 border rounded text-sm"
                              placeholder="Salle, atelier..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
                            <select
                              value={session.status}
                              onChange={(e) => updateSession(session.id, { status: e.target.value as TrainingSession['status'] })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              <option value="planned">Planifié</option>
                              <option value="completed">Réalisé</option>
                              <option value="postponed">Reporté</option>
                              <option value="cancelled">Annulé</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Efficacité</label>
                            <select
                              value={session.effectiveness}
                              onChange={(e) => updateSession(session.id, { effectiveness: e.target.value as TrainingSession['effectiveness'] })}
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              <option value="to-evaluate">À évaluer</option>
                              <option value="effective">Efficace</option>
                              <option value="needs-improvement">À améliorer</option>
                              <option value="to-redo">À refaire</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Note satisfaction (1-5)</label>
                            <input
                              type="number"
                              value={session.feedbackScore ?? ''}
                              onChange={(e) => updateSession(session.id, { feedbackScore: e.target.value ? parseFloat(e.target.value) : null })}
                              min={1}
                              max={5}
                              step={0.1}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          </div>
                        </div>

                        {/* Materials */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Supports de formation</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {session.materials.map((material, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-sm">
                                {material}
                                <button
                                  onClick={() => removeMaterial(session.id, idx)}
                                  className="ml-1 text-red-500"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMaterial}
                              onChange={(e) => setNewMaterial(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addMaterial(session.id)}
                              placeholder="Ajouter un support..."
                              className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                            <button
                              onClick={() => addMaterial(session.id)}
                              className="px-3 py-1 bg-gray-200 rounded text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Attendees */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Participants ({attendedCount}/{session.attendees.length} présents)
                          </label>
                          <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
                            {session.attendees.map((attendee, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                                <input
                                  type="checkbox"
                                  checked={attendee.attended}
                                  onChange={(e) => updateAttendee(session.id, idx, { attended: e.target.checked })}
                                  className="rounded"
                                />
                                <span className={`flex-1 text-sm ${attendee.attended ? '' : 'text-gray-400'}`}>
                                  {attendee.name}
                                </span>
                                {attendee.attended && (
                                  <input
                                    type="number"
                                    value={attendee.score ?? ''}
                                    onChange={(e) => updateAttendee(session.id, idx, { score: e.target.value ? parseInt(e.target.value) : undefined })}
                                    placeholder="Score"
                                    min={0}
                                    max={100}
                                    className="w-16 px-1 py-0.5 border rounded text-xs"
                                  />
                                )}
                                <button
                                  onClick={() => removeAttendee(session.id, idx)}
                                  className="text-red-500 text-sm"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newAttendeeName}
                              onChange={(e) => setNewAttendeeName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addAttendee(session.id)}
                              placeholder="Nom du participant..."
                              className="flex-1 px-2 py-1 border rounded text-sm"
                            />
                            <button
                              onClick={() => addAttendee(session.id)}
                              className="px-3 py-1 bg-gray-200 rounded text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t">
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            Supprimer
                          </button>
                          <button
                            onClick={() => setEditingSession(null)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded"
                          >
                            Valider
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Public cible</div>
                          <div className="font-medium">{session.targetAudience || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Formateur</div>
                          <div className="font-medium">{session.trainer || '-'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Date</div>
                          <div className="font-medium">
                            {session.actualDate || session.plannedDate
                              ? new Date(session.actualDate || session.plannedDate).toLocaleDateString('fr-FR')
                              : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Participants</div>
                          <div className="font-medium">{attendedCount}/{session.attendees.length}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Durée</div>
                          <div className="font-medium">{session.duration} min</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Efficacité</div>
                          <div className={`font-medium ${effectivenessConfig.color}`}>
                            {effectivenessConfig.icon} {effectivenessConfig.label}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Satisfaction</div>
                          <div className="font-medium">
                            {session.feedbackScore !== null ? `${session.feedbackScore}/5 ⭐` : '-'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Supports</div>
                          <div className="font-medium">{session.materials.length} document(s)</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow-up Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Actions de Suivi
        </h3>
        <textarea
          value={localData.followUpActions}
          onChange={(e) => updateData({ followUpActions: e.target.value })}
          disabled={readOnly}
          rows={4}
          placeholder="Actions à mener après les formations:
- Évaluation sur le terrain après 2 semaines
- Session de rappel si nécessaire
- Mise à jour des procédures..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📝</span>
          Notes
        </h3>
        <textarea
          value={localData.overallNotes}
          onChange={(e) => updateData({ overallNotes: e.target.value })}
          disabled={readOnly}
          rows={4}
          placeholder="Notes générales sur le plan de formation..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default TrainingTemplate;

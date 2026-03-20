import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types';

interface Idea {
  id: string;
  content: string;
  author: string;
  category: string;
  votes: number;
  selected: boolean;
  feasibility: 'high' | 'medium' | 'low' | null;
  impact: 'high' | 'medium' | 'low' | null;
  effort: 'high' | 'medium' | 'low' | null;
  notes: string;
}

interface IdeaGroup {
  id: string;
  name: string;
  color: string;
  ideaIds: string[];
}

interface BrainstormingData {
  sessionInfo: {
    objective: string;
    date: string;
    facilitator: string;
    participants: string[];
    duration: number;
    method: 'classic' | 'reverse' | 'starbursting' | 'scamper' | 'six-hats';
  };
  ideas: Idea[];
  groups: IdeaGroup[];
  selectedIdeas: string[];
  actionPlan: string;
  nextSteps: string;
}

interface BrainstormingTemplateProps {
  data: BrainstormingData | null;
  onChange: (data: BrainstormingData) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

const getDefaultData = (): BrainstormingData => ({
  sessionInfo: {
    objective: '',
    date: new Date().toISOString().split('T')[0],
    facilitator: '',
    participants: [],
    duration: 60,
    method: 'classic',
  },
  ideas: [],
  groups: [],
  selectedIdeas: [],
  actionPlan: '',
  nextSteps: '',
});

const BrainstormingTemplate: React.FC<BrainstormingTemplateProps> = ({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}) => {
  const [localData, setLocalData] = useState<BrainstormingData>(() => {
    return (data && Object.keys(data).length > 0) ? { ...getDefaultData(), ...data } : getDefaultData();
  });

  const [newIdea, setNewIdea] = useState('');
  const [newParticipant, setNewParticipant] = useState('');
  const [activeTab, setActiveTab] = useState<'generate' | 'group' | 'evaluate' | 'action'>('generate');
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLocalData({ ...getDefaultData(), ...data });
    }
  }, [data]);

  const updateData = (updates: Partial<BrainstormingData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onChange(newData);
  };

  const updateSessionInfo = (updates: Partial<BrainstormingData['sessionInfo']>) => {
    updateData({ sessionInfo: { ...localData.sessionInfo, ...updates } });
  };

  const addParticipant = () => {
    if (newParticipant.trim()) {
      updateSessionInfo({ participants: [...localData.sessionInfo.participants, newParticipant.trim()] });
      setNewParticipant('');
    }
  };

  const removeParticipant = (index: number) => {
    const newParticipants = localData.sessionInfo.participants.filter((_, i) => i !== index);
    updateSessionInfo({ participants: newParticipants });
  };

  const addIdea = () => {
    if (newIdea.trim()) {
      const idea: Idea = {
        id: Date.now().toString(),
        content: newIdea.trim(),
        author: '',
        category: '',
        votes: 0,
        selected: false,
        feasibility: null,
        impact: null,
        effort: null,
        notes: '',
      };
      updateData({ ideas: [...localData.ideas, idea] });
      setNewIdea('');
    }
  };

  const updateIdea = (id: string, updates: Partial<Idea>) => {
    const newIdeas = localData.ideas.map(idea =>
      idea.id === id ? { ...idea, ...updates } : idea
    );
    updateData({ ideas: newIdeas });
  };

  const deleteIdea = (id: string) => {
    const newIdeas = localData.ideas.filter(idea => idea.id !== id);
    const newGroups = localData.groups.map(group => ({
      ...group,
      ideaIds: group.ideaIds.filter(ideaId => ideaId !== id)
    }));
    updateData({ ideas: newIdeas, groups: newGroups });
  };

  const addGroup = () => {
    if (newGroupName.trim()) {
      const group: IdeaGroup = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        color: COLORS[localData.groups.length % COLORS.length],
        ideaIds: [],
      };
      updateData({ groups: [...localData.groups, group] });
      setNewGroupName('');
    }
  };

  const deleteGroup = (groupId: string) => {
    const newGroups = localData.groups.filter(g => g.id !== groupId);
    updateData({ groups: newGroups });
  };

  const toggleIdeaInGroup = (ideaId: string, groupId: string) => {
    const newGroups = localData.groups.map(group => {
      if (group.id === groupId) {
        const ideaIds = group.ideaIds.includes(ideaId)
          ? group.ideaIds.filter(id => id !== ideaId)
          : [...group.ideaIds, ideaId];
        return { ...group, ideaIds };
      }
      return group;
    });
    updateData({ groups: newGroups });
  };

  const toggleIdeaSelection = (ideaId: string) => {
    const idea = localData.ideas.find(i => i.id === ideaId);
    if (idea) {
      updateIdea(ideaId, { selected: !idea.selected });
    }
  };

  const voteIdea = (ideaId: string, delta: number) => {
    const idea = localData.ideas.find(i => i.id === ideaId);
    if (idea) {
      updateIdea(ideaId, { votes: Math.max(0, idea.votes + delta) });
    }
  };

  const getMethodDescription = (method: string) => {
    switch (method) {
      case 'classic': return 'Génération libre d\'idées sans critique';
      case 'reverse': return 'Comment empirer le problème? Puis inverser';
      case 'starbursting': return 'Questions Qui, Quoi, Où, Quand, Pourquoi, Comment';
      case 'scamper': return 'Substituer, Combiner, Adapter, Modifier, Autre usage, Éliminer, Réorganiser';
      case 'six-hats': return '6 chapeaux de Bono: faits, émotions, critique, optimisme, créativité, processus';
      default: return '';
    }
  };

  const sortedIdeas = [...localData.ideas].sort((a, b) => b.votes - a.votes);
  const selectedCount = localData.ideas.filter(i => i.selected).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {toolDefinition?.nameFr || 'Brainstorming et Outils de Créativité'}
        </h2>
        <p className="text-yellow-100">
          Générez des idées créatives pour résoudre les problèmes identifiés et améliorer le processus.
        </p>
      </div>

      {/* Session Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          Configuration de la Session
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objectif de la session *
            </label>
            <input
              type="text"
              value={localData.sessionInfo.objective}
              onChange={(e) => updateSessionInfo({ objective: e.target.value })}
              disabled={readOnly}
              placeholder="Ex: Comment réduire les temps d'attente de 50%?"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={localData.sessionInfo.date}
              onChange={(e) => updateSessionInfo({ date: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animateur
            </label>
            <input
              type="text"
              value={localData.sessionInfo.facilitator}
              onChange={(e) => updateSessionInfo({ facilitator: e.target.value })}
              disabled={readOnly}
              placeholder="Nom de l'animateur"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Durée (minutes)
            </label>
            <input
              type="number"
              value={localData.sessionInfo.duration}
              onChange={(e) => updateSessionInfo({ duration: parseInt(e.target.value) || 60 })}
              disabled={readOnly}
              min={15}
              max={240}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Méthode
            </label>
            <select
              value={localData.sessionInfo.method}
              onChange={(e) => updateSessionInfo({ method: e.target.value as BrainstormingData['sessionInfo']['method'] })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="classic">Brainstorming classique</option>
              <option value="reverse">Brainstorming inversé</option>
              <option value="starbursting">Starbursting (Questions)</option>
              <option value="scamper">SCAMPER</option>
              <option value="six-hats">6 Chapeaux de Bono</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">{getMethodDescription(localData.sessionInfo.method)}</p>
          </div>
        </div>

        {/* Participants */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Participants
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {localData.sessionInfo.participants.map((participant, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
              >
                {participant}
                {!readOnly && (
                  <button
                    onClick={() => removeParticipant(index)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
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
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addParticipant()}
                placeholder="Ajouter un participant"
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <button
                onClick={addParticipant}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                Ajouter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          {[
            { key: 'generate', label: '1. Générer', icon: '💡' },
            { key: 'group', label: '2. Regrouper', icon: '📁' },
            { key: 'evaluate', label: '3. Évaluer', icon: '⚖️' },
            { key: 'action', label: '4. Action', icon: '🎯' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">📋 Règles du Brainstorming</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>✓ Pas de critique pendant la génération</li>
                  <li>✓ Quantité avant qualité</li>
                  <li>✓ Idées folles bienvenues</li>
                  <li>✓ Rebondir sur les idées des autres</li>
                </ul>
              </div>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addIdea()}
                    placeholder="Tapez votre idée et appuyez sur Entrée..."
                    className="flex-1 px-4 py-3 border-2 border-yellow-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-lg"
                  />
                  <button
                    onClick={addIdea}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold"
                  >
                    💡 Ajouter
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-800">Idées générées: {localData.ideas.length}</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {localData.ideas.map((idea, index) => (
                  <div
                    key={idea.id}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 relative group"
                  >
                    <span className="absolute -top-2 -left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                      #{index + 1}
                    </span>
                    <p className="text-gray-800 mt-2">{idea.content}</p>
                    {!readOnly && (
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {localData.ideas.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-4">💡</div>
                  <p className="text-gray-500">Aucune idée encore. Commencez à générer!</p>
                </div>
              )}
            </div>
          )}

          {/* Group Tab */}
          {activeTab === 'group' && (
            <div className="space-y-4">
              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGroup()}
                    placeholder="Nom du groupe thématique..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <button
                    onClick={addGroup}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                  >
                    📁 Créer Groupe
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Groups */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Groupes thématiques</h4>
                  {localData.groups.map(group => (
                    <div
                      key={group.id}
                      className="border-2 rounded-lg p-3"
                      style={{ borderColor: group.color }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold" style={{ color: group.color }}>
                          {group.name} ({group.ideaIds.length})
                        </h5>
                        {!readOnly && (
                          <button
                            onClick={() => deleteGroup(group.id)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                      <div className="space-y-1">
                        {group.ideaIds.map(ideaId => {
                          const idea = localData.ideas.find(i => i.id === ideaId);
                          return idea ? (
                            <div
                              key={ideaId}
                              className="text-sm bg-white p-2 rounded flex items-center justify-between"
                            >
                              <span>{idea.content}</span>
                              {!readOnly && (
                                <button
                                  onClick={() => toggleIdeaInGroup(ideaId, group.id)}
                                  className="text-red-400 hover:text-red-600"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                  {localData.groups.length === 0 && (
                    <p className="text-gray-500 text-sm">Créez des groupes pour organiser les idées</p>
                  )}
                </div>

                {/* Ungrouped ideas */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800">Idées à regrouper</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {localData.ideas.map(idea => {
                      const inGroups = localData.groups.filter(g => g.ideaIds.includes(idea.id));
                      return (
                        <div
                          key={idea.id}
                          className="bg-gray-50 p-3 rounded-lg flex items-center justify-between"
                        >
                          <span className="text-sm">{idea.content}</span>
                          {!readOnly && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  toggleIdeaInGroup(idea.id, e.target.value);
                                }
                              }}
                              className="text-xs border rounded px-2 py-1"
                              value=""
                            >
                              <option value="">+ Groupe</option>
                              {localData.groups.map(g => (
                                <option key={g.id} value={g.id}>
                                  {inGroups.some(ig => ig.id === g.id) ? '✓ ' : ''}{g.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Evaluate Tab */}
          {activeTab === 'evaluate' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">⚖️ Évaluation des Idées</h4>
                <p className="text-sm text-blue-700">
                  Votez pour les meilleures idées et évaluez leur faisabilité, impact et effort.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3">Idée</th>
                      <th className="text-center p-3 w-24">Votes</th>
                      <th className="text-center p-3 w-28">Faisabilité</th>
                      <th className="text-center p-3 w-28">Impact</th>
                      <th className="text-center p-3 w-28">Effort</th>
                      <th className="text-center p-3 w-24">Retenir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedIdeas.map(idea => (
                      <tr key={idea.id} className={`border-b ${idea.selected ? 'bg-green-50' : ''}`}>
                        <td className="p-3">{idea.content}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            {!readOnly && (
                              <button
                                onClick={() => voteIdea(idea.id, -1)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                -
                              </button>
                            )}
                            <span className="font-bold text-lg w-8 text-center">{idea.votes}</span>
                            {!readOnly && (
                              <button
                                onClick={() => voteIdea(idea.id, 1)}
                                className="text-yellow-500 hover:text-yellow-600"
                              >
                                +
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <select
                            value={idea.feasibility || ''}
                            onChange={(e) => updateIdea(idea.id, { feasibility: e.target.value as Idea['feasibility'] || null })}
                            disabled={readOnly}
                            className="w-full text-xs border rounded p-1"
                          >
                            <option value="">-</option>
                            <option value="high">🟢 Haute</option>
                            <option value="medium">🟡 Moyenne</option>
                            <option value="low">🔴 Faible</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={idea.impact || ''}
                            onChange={(e) => updateIdea(idea.id, { impact: e.target.value as Idea['impact'] || null })}
                            disabled={readOnly}
                            className="w-full text-xs border rounded p-1"
                          >
                            <option value="">-</option>
                            <option value="high">🟢 Fort</option>
                            <option value="medium">🟡 Moyen</option>
                            <option value="low">🔴 Faible</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={idea.effort || ''}
                            onChange={(e) => updateIdea(idea.id, { effort: e.target.value as Idea['effort'] || null })}
                            disabled={readOnly}
                            className="w-full text-xs border rounded p-1"
                          >
                            <option value="">-</option>
                            <option value="low">🟢 Faible</option>
                            <option value="medium">🟡 Moyen</option>
                            <option value="high">🔴 Élevé</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={idea.selected}
                            onChange={() => toggleIdeaSelection(idea.id)}
                            disabled={readOnly}
                            className="w-5 h-5 text-green-600 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <span className="text-gray-600">
                  Total des idées: {localData.ideas.length}
                </span>
                <span className="text-green-600 font-semibold">
                  Idées retenues: {selectedCount}
                </span>
              </div>
            </div>
          )}

          {/* Action Tab */}
          {activeTab === 'action' && (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Idées Retenues ({selectedCount})</h4>
                <div className="space-y-2">
                  {localData.ideas.filter(i => i.selected).map((idea, index) => (
                    <div key={idea.id} className="flex items-center gap-3 bg-white p-3 rounded">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                      <span className="flex-1">{idea.content}</span>
                      <div className="flex gap-2 text-xs">
                        {idea.feasibility && (
                          <span className={`px-2 py-1 rounded ${
                            idea.feasibility === 'high' ? 'bg-green-100 text-green-700' :
                            idea.feasibility === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Fais: {idea.feasibility === 'high' ? 'Haute' : idea.feasibility === 'medium' ? 'Moy' : 'Faible'}
                          </span>
                        )}
                        {idea.impact && (
                          <span className={`px-2 py-1 rounded ${
                            idea.impact === 'high' ? 'bg-green-100 text-green-700' :
                            idea.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Impact: {idea.impact === 'high' ? 'Fort' : idea.impact === 'medium' ? 'Moy' : 'Faible'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedCount === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Aucune idée retenue. Retournez à l'onglet "Évaluer" pour sélectionner des idées.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan d'Action
                </label>
                <textarea
                  value={localData.actionPlan}
                  onChange={(e) => updateData({ actionPlan: e.target.value })}
                  disabled={readOnly}
                  rows={6}
                  placeholder="Décrivez le plan d'action pour mettre en œuvre les idées retenues...

Exemple:
1. Solution A - Responsable: Jean - Échéance: 15/03
2. Solution B - Responsable: Marie - Échéance: 30/03
..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prochaines Étapes
                </label>
                <textarea
                  value={localData.nextSteps}
                  onChange={(e) => updateData({ nextSteps: e.target.value })}
                  disabled={readOnly}
                  rows={4}
                  placeholder="Quelles sont les prochaines actions immédiates?
- Pilote à mettre en place
- Ressources à mobiliser
- Validations à obtenir..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          Résumé de la Session
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-yellow-600">{localData.ideas.length}</div>
            <div className="text-sm text-gray-600">Idées générées</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{localData.groups.length}</div>
            <div className="text-sm text-gray-600">Groupes créés</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-purple-600">
              {localData.ideas.reduce((sum, i) => sum + i.votes, 0)}
            </div>
            <div className="text-sm text-gray-600">Votes totaux</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">{selectedCount}</div>
            <div className="text-sm text-gray-600">Idées retenues</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainstormingTemplate;

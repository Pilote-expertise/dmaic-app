import { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle2, AlertCircle, Calendar, User, MessageSquare } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  comment: string;
  evidence: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface ProjectReviewData {
  phase: string;
  reviewDate: string;
  reviewers: string[];
  checklist: ChecklistSection[];
  decision: 'approved' | 'conditional' | 'rejected' | 'pending';
  conditions: string;
  strengths: string;
  improvements: string;
  actionItems: { id: string; action: string; owner: string; dueDate: string; status: string }[];
  nextPhaseReadiness: number;
  signatures: { name: string; role: string; date: string; approved: boolean }[];
  comments: string;
}

interface ProjectReviewTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const getDefaultChecklist = (phase: string): ChecklistSection[] => {
  const phaseChecklists: Record<string, ChecklistSection[]> = {
    DEFINE: [
      {
        id: 'deliverables',
        title: 'Livrables de la phase Define',
        items: [
          { id: '1', label: 'Charte de projet complète et validée', checked: false, comment: '', evidence: '' },
          { id: '2', label: 'Problème clairement défini et quantifié', checked: false, comment: '', evidence: '' },
          { id: '3', label: 'CTQ identifiés et documentés', checked: false, comment: '', evidence: '' },
          { id: '4', label: 'Périmètre du projet délimité', checked: false, comment: '', evidence: '' },
          { id: '5', label: 'Équipe projet constituée', checked: false, comment: '', evidence: '' },
          { id: '6', label: 'Planning prévisionnel établi', checked: false, comment: '', evidence: '' },
          { id: '7', label: 'ROI préliminaire calculé', checked: false, comment: '', evidence: '' },
        ],
      },
      {
        id: 'quality',
        title: 'Critères de qualité',
        items: [
          { id: '8', label: 'Objectifs SMART définis', checked: false, comment: '', evidence: '' },
          { id: '9', label: 'Parties prenantes identifiées', checked: false, comment: '', evidence: '' },
          { id: '10', label: 'Risques projet initiaux évalués', checked: false, comment: '', evidence: '' },
          { id: '11', label: 'Sponsor engagé et impliqué', checked: false, comment: '', evidence: '' },
        ],
      },
    ],
    MEASURE: [
      {
        id: 'deliverables',
        title: 'Livrables de la phase Measure',
        items: [
          { id: '1', label: 'Plan de collecte de données établi', checked: false, comment: '', evidence: '' },
          { id: '2', label: 'Système de mesure validé (MSA)', checked: false, comment: '', evidence: '' },
          { id: '3', label: 'Données collectées selon le plan', checked: false, comment: '', evidence: '' },
          { id: '4', label: 'Baseline de performance établie', checked: false, comment: '', evidence: '' },
          { id: '5', label: 'Capabilité processus calculée (Cp/Cpk)', checked: false, comment: '', evidence: '' },
          { id: '6', label: 'Cartographie du processus à jour', checked: false, comment: '', evidence: '' },
        ],
      },
      {
        id: 'quality',
        title: 'Critères de qualité',
        items: [
          { id: '7', label: 'Données fiables et représentatives', checked: false, comment: '', evidence: '' },
          { id: '8', label: 'Échantillon de taille suffisante', checked: false, comment: '', evidence: '' },
          { id: '9', label: 'Définitions opérationnelles claires', checked: false, comment: '', evidence: '' },
        ],
      },
    ],
    ANALYZE: [
      {
        id: 'deliverables',
        title: 'Livrables de la phase Analyze',
        items: [
          { id: '1', label: 'Causes racines identifiées', checked: false, comment: '', evidence: '' },
          { id: '2', label: 'Analyses statistiques réalisées', checked: false, comment: '', evidence: '' },
          { id: '3', label: 'Hypothèses testées et validées', checked: false, comment: '', evidence: '' },
          { id: '4', label: 'Causes vitales (vital few) priorisées', checked: false, comment: '', evidence: '' },
          { id: '5', label: 'Relations cause-effet documentées', checked: false, comment: '', evidence: '' },
        ],
      },
      {
        id: 'quality',
        title: 'Critères de qualité',
        items: [
          { id: '6', label: 'Données analysées rigoureusement', checked: false, comment: '', evidence: '' },
          { id: '7', label: 'Conclusions supportées par les données', checked: false, comment: '', evidence: '' },
          { id: '8', label: 'Équipe alignée sur les causes racines', checked: false, comment: '', evidence: '' },
        ],
      },
    ],
    IMPROVE: [
      {
        id: 'deliverables',
        title: 'Livrables de la phase Improve',
        items: [
          { id: '1', label: 'Solutions identifiées et évaluées', checked: false, comment: '', evidence: '' },
          { id: '2', label: 'Solution optimale sélectionnée', checked: false, comment: '', evidence: '' },
          { id: '3', label: 'Pilote réalisé avec succès', checked: false, comment: '', evidence: '' },
          { id: '4', label: 'Résultats du pilote validés', checked: false, comment: '', evidence: '' },
          { id: '5', label: 'Plan de déploiement préparé', checked: false, comment: '', evidence: '' },
          { id: '6', label: 'AMDEC mis à jour', checked: false, comment: '', evidence: '' },
        ],
      },
      {
        id: 'quality',
        title: 'Critères de qualité',
        items: [
          { id: '7', label: 'Amélioration mesurable et significative', checked: false, comment: '', evidence: '' },
          { id: '8', label: 'Risques de mise en œuvre maîtrisés', checked: false, comment: '', evidence: '' },
          { id: '9', label: 'Parties prenantes prêtes pour le déploiement', checked: false, comment: '', evidence: '' },
        ],
      },
    ],
    CONTROL: [
      {
        id: 'deliverables',
        title: 'Livrables de la phase Control',
        items: [
          { id: '1', label: 'Plan de contrôle en place', checked: false, comment: '', evidence: '' },
          { id: '2', label: 'Procédures documentées et à jour', checked: false, comment: '', evidence: '' },
          { id: '3', label: 'Formations réalisées', checked: false, comment: '', evidence: '' },
          { id: '4', label: 'Gains calculés et validés', checked: false, comment: '', evidence: '' },
          { id: '5', label: 'Transfert au propriétaire processus effectué', checked: false, comment: '', evidence: '' },
          { id: '6', label: 'Documentation projet archivée', checked: false, comment: '', evidence: '' },
        ],
      },
      {
        id: 'sustainability',
        title: 'Pérennité',
        items: [
          { id: '7', label: 'Indicateurs de suivi définis', checked: false, comment: '', evidence: '' },
          { id: '8', label: 'Plan de réaction documenté', checked: false, comment: '', evidence: '' },
          { id: '9', label: 'Système de surveillance opérationnel', checked: false, comment: '', evidence: '' },
          { id: '10', label: 'Leçons apprises capitalisées', checked: false, comment: '', evidence: '' },
        ],
      },
    ],
  };
  return phaseChecklists[phase] || phaseChecklists['DEFINE'];
};

const decisionColors: Record<string, { bg: string; text: string; label: string }> = {
  approved: { bg: 'bg-measure-light', text: 'text-measure', label: '✓ Approuvé' },
  conditional: { bg: 'bg-analyze-light', text: 'text-analyze', label: '⚠ Approuvé avec réserves' },
  rejected: { bg: 'bg-control-light', text: 'text-control', label: '✗ Refusé' },
  pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: '⏳ En attente' },
};

export default function ProjectReviewTemplate({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}: ProjectReviewTemplateProps) {
  // Detect phase from tool definition
  const phase = toolDefinition?.phase || 'DEFINE';

  const [reviewData, setReviewData] = useState<ProjectReviewData>({
    phase: data.phase || phase,
    reviewDate: data.reviewDate || new Date().toISOString().split('T')[0],
    reviewers: data.reviewers?.length ? data.reviewers : [''],
    checklist: data.checklist?.length ? data.checklist : getDefaultChecklist(phase),
    decision: data.decision || 'pending',
    conditions: data.conditions || '',
    strengths: data.strengths || '',
    improvements: data.improvements || '',
    actionItems: data.actionItems?.length ? data.actionItems : [],
    nextPhaseReadiness: data.nextPhaseReadiness || 0,
    signatures: data.signatures?.length ? data.signatures : [],
    comments: data.comments || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setReviewData({
        phase: data.phase || phase,
        reviewDate: data.reviewDate || new Date().toISOString().split('T')[0],
        reviewers: data.reviewers?.length ? data.reviewers : [''],
        checklist: data.checklist?.length ? data.checklist : getDefaultChecklist(phase),
        decision: data.decision || 'pending',
        conditions: data.conditions || '',
        strengths: data.strengths || '',
        improvements: data.improvements || '',
        actionItems: data.actionItems?.length ? data.actionItems : [],
        nextPhaseReadiness: data.nextPhaseReadiness || 0,
        signatures: data.signatures?.length ? data.signatures : [],
        comments: data.comments || '',
      });
    }
  }, [data, phase]);

  const updateData = (newData: ProjectReviewData) => {
    setReviewData(newData);
    onChange(newData);
  };

  const toggleChecklistItem = (sectionId: string, itemId: string) => {
    const checklist = reviewData.checklist.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
        };
      }
      return section;
    });
    const completedCount = checklist.reduce((sum, s) => sum + s.items.filter((i) => i.checked).length, 0);
    const totalCount = checklist.reduce((sum, s) => sum + s.items.length, 0);
    const readiness = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    updateData({ ...reviewData, checklist, nextPhaseReadiness: readiness });
  };

  const updateChecklistItemField = (sectionId: string, itemId: string, field: 'comment' | 'evidence', value: string) => {
    const checklist = reviewData.checklist.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item
          ),
        };
      }
      return section;
    });
    updateData({ ...reviewData, checklist });
  };

  const addActionItem = () => {
    const newItem = { id: crypto.randomUUID(), action: '', owner: '', dueDate: '', status: 'open' };
    updateData({ ...reviewData, actionItems: [...reviewData.actionItems, newItem] });
  };

  const updateActionItem = (id: string, field: string, value: string) => {
    const actionItems = reviewData.actionItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateData({ ...reviewData, actionItems });
  };

  const removeActionItem = (id: string) => {
    updateData({ ...reviewData, actionItems: reviewData.actionItems.filter((i) => i.id !== id) });
  };

  const addSignature = () => {
    const newSig = { name: '', role: '', date: new Date().toISOString().split('T')[0], approved: false };
    updateData({ ...reviewData, signatures: [...reviewData.signatures, newSig] });
  };

  // Calculate stats
  const totalItems = reviewData.checklist.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = reviewData.checklist.reduce((sum, s) => sum + s.items.filter((i) => i.checked).length, 0);
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const phaseLabels: Record<string, string> = {
    DEFINE: 'Définir',
    MEASURE: 'Mesurer',
    ANALYZE: 'Analyser',
    IMPROVE: 'Innover',
    CONTROL: 'Contrôler',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-define flex items-center justify-center">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Revue de Phase - {phaseLabels[phase]}</h2>
            <p className="text-sm text-gray-500">
              Validation des livrables et passage à la phase suivante
            </p>
          </div>
          <div className={cn(
            'px-4 py-2 rounded-full font-medium',
            decisionColors[reviewData.decision].bg,
            decisionColors[reviewData.decision].text
          )}>
            {decisionColors[reviewData.decision].label}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date de la revue</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={reviewData.reviewDate}
                onChange={(e) => updateData({ ...reviewData, reviewDate: e.target.value })}
                className="input"
                disabled={readOnly}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Réviseur(s)</label>
            <input
              type="text"
              value={reviewData.reviewers.join(', ')}
              onChange={(e) => updateData({ ...reviewData, reviewers: e.target.value.split(',').map((s) => s.trim()) })}
              placeholder="Noms des réviseurs"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Décision</label>
            <select
              value={reviewData.decision}
              onChange={(e) => updateData({ ...reviewData, decision: e.target.value as any })}
              className={cn('input', decisionColors[reviewData.decision].text)}
              disabled={readOnly}
            >
              <option value="pending">En attente</option>
              <option value="approved">Approuvé</option>
              <option value="conditional">Approuvé avec réserves</option>
              <option value="rejected">Refusé</option>
            </select>
          </div>
        </div>

        {reviewData.decision === 'conditional' && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Conditions / Réserves</label>
            <textarea
              value={reviewData.conditions}
              onChange={(e) => updateData({ ...reviewData, conditions: e.target.value })}
              placeholder="Listez les conditions à remplir avant validation complète..."
              className="input min-h-[80px] resize-none"
              disabled={readOnly}
            />
          </div>
        )}
      </div>

      {/* Progress Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Progression de la revue</h3>
          <span className={cn(
            'text-2xl font-bold',
            completionRate >= 80 ? 'text-measure' : completionRate >= 50 ? 'text-analyze' : 'text-control'
          )}>
            {completionRate}%
          </span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              completionRate >= 80 ? 'bg-measure' : completionRate >= 50 ? 'bg-analyze' : 'bg-control'
            )}
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>{completedItems} critères validés sur {totalItems}</span>
          <span>{totalItems - completedItems} restants</span>
        </div>
      </div>

      {/* Checklist Sections */}
      {reviewData.checklist.map((section) => (
        <div key={section.id} className="card overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
            <h3 className="font-semibold">{section.title}</h3>
            <span className="text-sm text-gray-500">
              {section.items.filter((i) => i.checked).length} / {section.items.length}
            </span>
          </div>
          <div className="divide-y">
            {section.items.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => !readOnly && toggleChecklistItem(section.id, item.id)}
                    className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                      item.checked
                        ? 'bg-measure border-measure text-white'
                        : 'border-gray-300 hover:border-measure'
                    )}
                    disabled={readOnly}
                  >
                    {item.checked && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div className="flex-1">
                    <div className={cn(
                      'font-medium',
                      item.checked ? 'text-gray-500 line-through' : ''
                    )}>
                      {item.label}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="text-xs text-gray-500">Commentaire</label>
                        <input
                          type="text"
                          value={item.comment}
                          onChange={(e) => updateChecklistItemField(section.id, item.id, 'comment', e.target.value)}
                          placeholder="Observations..."
                          className="input mt-1 text-sm"
                          disabled={readOnly}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Preuves / Références</label>
                        <input
                          type="text"
                          value={item.evidence}
                          onChange={(e) => updateChecklistItemField(section.id, item.id, 'evidence', e.target.value)}
                          placeholder="Documents, liens..."
                          className="input mt-1 text-sm"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-measure" />
            Points forts
          </label>
          <textarea
            value={reviewData.strengths}
            onChange={(e) => updateData({ ...reviewData, strengths: e.target.value })}
            placeholder="Ce qui a bien fonctionné..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-analyze" />
            Axes d'amélioration
          </label>
          <textarea
            value={reviewData.improvements}
            onChange={(e) => updateData({ ...reviewData, improvements: e.target.value })}
            placeholder="Points à améliorer..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Action Items */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-semibold">Actions de suivi</h3>
          {!readOnly && (
            <button onClick={addActionItem} className="btn btn-secondary text-sm">
              + Ajouter une action
            </button>
          )}
        </div>
        {reviewData.actionItems.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-2 text-left">Action</th>
                <th className="px-4 py-2 text-left w-32">Responsable</th>
                <th className="px-4 py-2 text-left w-32">Échéance</th>
                <th className="px-4 py-2 text-left w-28">Statut</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {reviewData.actionItems.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.action}
                      onChange={(e) => updateActionItem(item.id, 'action', e.target.value)}
                      placeholder="Description de l'action..."
                      className="w-full p-2 border rounded"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.owner}
                      onChange={(e) => updateActionItem(item.id, 'owner', e.target.value)}
                      placeholder="Nom"
                      className="w-full p-2 border rounded"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => updateActionItem(item.id, 'dueDate', e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={item.status}
                      onChange={(e) => updateActionItem(item.id, 'status', e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={readOnly}
                    >
                      <option value="open">Ouvert</option>
                      <option value="in_progress">En cours</option>
                      <option value="done">Terminé</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && (
                      <button
                        onClick={() => removeActionItem(item.id)}
                        className="p-1 text-gray-400 hover:text-control"
                      >
                        ×
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            Aucune action de suivi
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            Signatures
          </h3>
          {!readOnly && (
            <button onClick={addSignature} className="btn btn-secondary text-sm">
              + Ajouter une signature
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviewData.signatures.map((sig, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <input
                type="text"
                value={sig.name}
                onChange={(e) => {
                  const signatures = [...reviewData.signatures];
                  signatures[index] = { ...sig, name: e.target.value };
                  updateData({ ...reviewData, signatures });
                }}
                placeholder="Nom"
                className="input mb-2"
                disabled={readOnly}
              />
              <input
                type="text"
                value={sig.role}
                onChange={(e) => {
                  const signatures = [...reviewData.signatures];
                  signatures[index] = { ...sig, role: e.target.value };
                  updateData({ ...reviewData, signatures });
                }}
                placeholder="Rôle (Ex: Sponsor, Chef de projet)"
                className="input mb-2"
                disabled={readOnly}
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={sig.date}
                  onChange={(e) => {
                    const signatures = [...reviewData.signatures];
                    signatures[index] = { ...sig, date: e.target.value };
                    updateData({ ...reviewData, signatures });
                  }}
                  className="input flex-1"
                  disabled={readOnly}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sig.approved}
                    onChange={(e) => {
                      const signatures = [...reviewData.signatures];
                      signatures[index] = { ...sig, approved: e.target.checked };
                      updateData({ ...reviewData, signatures });
                    }}
                    className="w-4 h-4"
                    disabled={readOnly}
                  />
                  <span className="text-sm">Approuvé</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comments */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          Commentaires additionnels
        </label>
        <textarea
          value={reviewData.comments}
          onChange={(e) => updateData({ ...reviewData, comments: e.target.value })}
          placeholder="Observations générales, recommandations..."
          className="input min-h-[100px] resize-none"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

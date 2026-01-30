import { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Shield, TrendingDown, User } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface RiskItem {
  id: string;
  description: string;
  category: 'technical' | 'resources' | 'planning' | 'budget' | 'organizational' | 'external';
  probability: number; // 1-5
  impact: number; // 1-5
  detection: number; // 1-5 (ability to detect before occurrence)
  mitigationPlan: string;
  contingencyPlan: string;
  owner: string;
  status: 'open' | 'in_progress' | 'mitigated' | 'accepted' | 'closed';
  dueDate: string;
  notes: string;
}

interface RiskAnalysisData {
  projectName: string;
  analysisDate: string;
  analysisScope: string;
  risks: RiskItem[];
  riskTolerance: 'low' | 'medium' | 'high';
  overallAssessment: string;
}

interface ProjectRiskAnalysisTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyRisk = (): RiskItem => ({
  id: crypto.randomUUID(),
  description: '',
  category: 'technical',
  probability: 3,
  impact: 3,
  detection: 3,
  mitigationPlan: '',
  contingencyPlan: '',
  owner: '',
  status: 'open',
  dueDate: '',
  notes: '',
});

const categoryLabels: Record<string, string> = {
  technical: 'Technique',
  resources: 'Ressources',
  planning: 'Planning',
  budget: 'Budget',
  organizational: 'Organisationnel',
  external: 'Externe',
};

const categoryColors: Record<string, string> = {
  technical: 'bg-define text-white',
  resources: 'bg-measure text-white',
  planning: 'bg-analyze text-white',
  budget: 'bg-control text-white',
  organizational: 'bg-improve text-white',
  external: 'bg-gray-500 text-white',
};

const statusLabels: Record<string, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  mitigated: 'Atténué',
  accepted: 'Accepté',
  closed: 'Fermé',
};

const statusColors: Record<string, string> = {
  open: 'bg-control-light text-control',
  in_progress: 'bg-analyze-light text-analyze',
  mitigated: 'bg-improve-light text-improve',
  accepted: 'bg-gray-100 text-gray-600',
  closed: 'bg-measure-light text-measure',
};

const getRiskLevel = (score: number): { label: string; color: string; bgColor: string } => {
  if (score >= 60) return { label: 'Critique', color: 'text-red-700', bgColor: 'bg-red-100' };
  if (score >= 40) return { label: 'Élevé', color: 'text-control', bgColor: 'bg-control-light' };
  if (score >= 20) return { label: 'Moyen', color: 'text-analyze', bgColor: 'bg-analyze-light' };
  return { label: 'Faible', color: 'text-measure', bgColor: 'bg-measure-light' };
};

const getRPNColor = (rpn: number): string => {
  if (rpn >= 80) return 'bg-red-600';
  if (rpn >= 50) return 'bg-control';
  if (rpn >= 25) return 'bg-analyze';
  return 'bg-measure';
};

export default function ProjectRiskAnalysisTemplate({
  data,
  onChange,
  readOnly = false,
}: ProjectRiskAnalysisTemplateProps) {
  const [riskData, setRiskData] = useState<RiskAnalysisData>({
    projectName: data.projectName || '',
    analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
    analysisScope: data.analysisScope || '',
    risks: data.risks?.length ? data.risks : [createEmptyRisk()],
    riskTolerance: data.riskTolerance || 'medium',
    overallAssessment: data.overallAssessment || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setRiskData({
        projectName: data.projectName || '',
        analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
        analysisScope: data.analysisScope || '',
        risks: data.risks?.length ? data.risks : [createEmptyRisk()],
        riskTolerance: data.riskTolerance || 'medium',
        overallAssessment: data.overallAssessment || '',
      });
    }
  }, [data]);

  const updateData = (newData: RiskAnalysisData) => {
    setRiskData(newData);
    onChange(newData);
  };

  const updateRisk = (id: string, field: keyof RiskItem, value: any) => {
    const risks = riskData.risks.map((risk) =>
      risk.id === id ? { ...risk, [field]: value } : risk
    );
    updateData({ ...riskData, risks });
  };

  const addRisk = () => {
    updateData({ ...riskData, risks: [...riskData.risks, createEmptyRisk()] });
  };

  const removeRisk = (id: string) => {
    if (riskData.risks.length > 1) {
      updateData({ ...riskData, risks: riskData.risks.filter((r) => r.id !== id) });
    }
  };

  const calculateRPN = (risk: RiskItem): number => {
    return risk.probability * risk.impact * (6 - risk.detection);
  };

  const calculateRiskScore = (risk: RiskItem): number => {
    return risk.probability * risk.impact;
  };

  // Statistics
  const activeRisks = riskData.risks.filter((r) => r.status !== 'closed' && r.status !== 'mitigated');
  const criticalRisks = riskData.risks.filter((r) => calculateRiskScore(r) >= 16);
  const highRisks = riskData.risks.filter((r) => calculateRiskScore(r) >= 9 && calculateRiskScore(r) < 16);
  const avgRPN = riskData.risks.length > 0
    ? Math.round(riskData.risks.reduce((sum, r) => sum + calculateRPN(r), 0) / riskData.risks.length)
    : 0;

  // Risk matrix data
  const riskMatrix = Array(5).fill(null).map(() => Array(5).fill(0));
  riskData.risks.forEach((risk) => {
    if (risk.probability > 0 && risk.impact > 0) {
      riskMatrix[5 - risk.probability][risk.impact - 1]++;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-define flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Analyse des Risques du Projet</h2>
            <p className="text-sm text-gray-500">
              Identification, évaluation et plan de mitigation des risques
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du projet</label>
            <input
              type="text"
              value={riskData.projectName}
              onChange={(e) => updateData({ ...riskData, projectName: e.target.value })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date d'analyse</label>
            <input
              type="date"
              value={riskData.analysisDate}
              onChange={(e) => updateData({ ...riskData, analysisDate: e.target.value })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tolérance au risque</label>
            <select
              value={riskData.riskTolerance}
              onChange={(e) => updateData({ ...riskData, riskTolerance: e.target.value as any })}
              className="input"
              disabled={readOnly}
            >
              <option value="low">Faible (conservateur)</option>
              <option value="medium">Moyenne</option>
              <option value="high">Élevée (accepte plus de risques)</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Périmètre de l'analyse</label>
          <textarea
            value={riskData.analysisScope}
            onChange={(e) => updateData({ ...riskData, analysisScope: e.target.value })}
            placeholder="Décrivez le périmètre couvert par cette analyse de risques..."
            className="input min-h-[80px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Risk Summary Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-define">{riskData.risks.length}</div>
          <div className="text-sm text-gray-500">Risques identifiés</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-control">{criticalRisks.length}</div>
          <div className="text-sm text-gray-500">Risques critiques</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-analyze">{highRisks.length}</div>
          <div className="text-sm text-gray-500">Risques élevés</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-measure">{activeRisks.length}</div>
          <div className="text-sm text-gray-500">Risques actifs</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold">{avgRPN}</div>
          <div className="text-sm text-gray-500">RPN moyen</div>
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-400" />
          Matrice de Risques (Probabilité × Impact)
        </h3>
        <div className="flex gap-6">
          <div className="flex-1">
            <div className="flex">
              <div className="w-24 flex flex-col justify-center pr-2">
                <div className="text-xs text-gray-500 transform -rotate-90 whitespace-nowrap origin-center">
                  PROBABILITÉ
                </div>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-5 gap-1">
                  {riskMatrix.map((row, rowIdx) => (
                    row.map((count, colIdx) => {
                      const score = (5 - rowIdx) * (colIdx + 1);
                      return (
                        <div
                          key={`${rowIdx}-${colIdx}`}
                          className={cn(
                            'aspect-square flex items-center justify-center text-sm font-medium rounded',
                            score >= 20 ? 'bg-red-200 text-red-800' :
                            score >= 12 ? 'bg-control-light text-control' :
                            score >= 6 ? 'bg-analyze-light text-analyze' :
                            'bg-measure-light text-measure'
                          )}
                        >
                          {count > 0 && (
                            <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
                              {count}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 px-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                <div className="text-center text-xs text-gray-500 mt-1">IMPACT</div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span>5</span>
              <span>4</span>
              <span>3</span>
              <span>2</span>
              <span>1</span>
            </div>
          </div>

          {/* Legend */}
          <div className="w-48">
            <h4 className="text-sm font-medium mb-3">Légende</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-200" />
                <span>Critique (≥20)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-control-light" />
                <span>Élevé (12-19)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-analyze-light" />
                <span>Moyen (6-11)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-measure-light" />
                <span>Faible (1-5)</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <strong>Score</strong> = Probabilité × Impact
              <br />
              <strong>RPN</strong> = Prob × Impact × (6-Détection)
            </div>
          </div>
        </div>
      </div>

      {/* Risk Register */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h3 className="font-semibold">Registre des Risques</h3>
          <div className="flex gap-2 text-xs">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <span key={key} className={cn('px-2 py-1 rounded', categoryColors[key])}>
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {riskData.risks.map((risk, index) => {
            const rpn = calculateRPN(risk);
            const score = calculateRiskScore(risk);
            const level = getRiskLevel(score * 4);

            return (
              <div key={risk.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>

                  <div className="flex-1 space-y-4">
                    {/* Row 1: Description, Category, Status */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6">
                        <label className="text-xs text-gray-500">Description du risque</label>
                        <textarea
                          value={risk.description}
                          onChange={(e) => updateRisk(risk.id, 'description', e.target.value)}
                          placeholder="Décrivez le risque identifié..."
                          className="input mt-1 min-h-[60px] resize-none text-sm"
                          disabled={readOnly}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-xs text-gray-500">Catégorie</label>
                        <select
                          value={risk.category}
                          onChange={(e) => updateRisk(risk.id, 'category', e.target.value)}
                          className={cn('input mt-1 text-sm', categoryColors[risk.category])}
                          disabled={readOnly}
                        >
                          {Object.entries(categoryLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <label className="text-xs text-gray-500">Statut</label>
                        <select
                          value={risk.status}
                          onChange={(e) => updateRisk(risk.id, 'status', e.target.value)}
                          className={cn('input mt-1 text-sm', statusColors[risk.status])}
                          disabled={readOnly}
                        >
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Ratings */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-3">
                        <label className="text-xs text-gray-500">Probabilité (1-5)</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={risk.probability}
                            onChange={(e) => updateRisk(risk.id, 'probability', parseInt(e.target.value))}
                            className="flex-1"
                            disabled={readOnly}
                          />
                          <span className="w-6 text-center font-medium">{risk.probability}</span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <label className="text-xs text-gray-500">Impact (1-5)</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={risk.impact}
                            onChange={(e) => updateRisk(risk.id, 'impact', parseInt(e.target.value))}
                            className="flex-1"
                            disabled={readOnly}
                          />
                          <span className="w-6 text-center font-medium">{risk.impact}</span>
                        </div>
                      </div>
                      <div className="col-span-3">
                        <label className="text-xs text-gray-500">Détection (1-5)</label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={risk.detection}
                            onChange={(e) => updateRisk(risk.id, 'detection', parseInt(e.target.value))}
                            className="flex-1"
                            disabled={readOnly}
                          />
                          <span className="w-6 text-center font-medium">{risk.detection}</span>
                        </div>
                      </div>
                      <div className="col-span-3 flex items-end gap-2">
                        <div className={cn('flex-1 p-2 rounded text-center', level.bgColor)}>
                          <div className="text-xs text-gray-500">Score</div>
                          <div className={cn('text-lg font-bold', level.color)}>{score}</div>
                          <div className={cn('text-xs font-medium', level.color)}>{level.label}</div>
                        </div>
                        <div className={cn('flex-1 p-2 rounded text-center text-white', getRPNColor(rpn))}>
                          <div className="text-xs opacity-80">RPN</div>
                          <div className="text-lg font-bold">{rpn}</div>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Mitigation & Owner */}
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-4">
                        <label className="text-xs text-gray-500">Plan de mitigation</label>
                        <textarea
                          value={risk.mitigationPlan}
                          onChange={(e) => updateRisk(risk.id, 'mitigationPlan', e.target.value)}
                          placeholder="Actions préventives..."
                          className="input mt-1 min-h-[50px] resize-none text-sm"
                          disabled={readOnly}
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="text-xs text-gray-500">Plan de contingence</label>
                        <textarea
                          value={risk.contingencyPlan}
                          onChange={(e) => updateRisk(risk.id, 'contingencyPlan', e.target.value)}
                          placeholder="Si le risque se produit..."
                          className="input mt-1 min-h-[50px] resize-none text-sm"
                          disabled={readOnly}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Responsable</label>
                        <div className="flex items-center gap-1 mt-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={risk.owner}
                            onChange={(e) => updateRisk(risk.id, 'owner', e.target.value)}
                            placeholder="Nom"
                            className="input text-sm"
                            disabled={readOnly}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-gray-500">Échéance</label>
                        <input
                          type="date"
                          value={risk.dueDate}
                          onChange={(e) => updateRisk(risk.id, 'dueDate', e.target.value)}
                          className="input mt-1 text-sm"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  </div>

                  {!readOnly && riskData.risks.length > 1 && (
                    <button
                      onClick={() => removeRisk(risk.id)}
                      className="p-2 text-gray-400 hover:text-control"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!readOnly && (
          <div className="p-4 bg-gray-50 border-t">
            <button onClick={addRisk} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un risque
            </button>
          </div>
        )}
      </div>

      {/* Category Distribution */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-gray-400" />
          Répartition par catégorie
        </h3>
        <div className="space-y-3">
          {Object.entries(categoryLabels).map(([key, label]) => {
            const count = riskData.risks.filter((r) => r.category === key).length;
            const percentage = riskData.risks.length > 0 ? (count / riskData.risks.length) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-4">
                <div className={cn('px-2 py-1 rounded text-xs w-28', categoryColors[key])}>
                  {label}
                </div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', categoryColors[key].replace('text-white', ''))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm">
                  {count} ({percentage.toFixed(0)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Évaluation globale des risques</label>
        <textarea
          value={riskData.overallAssessment}
          onChange={(e) => updateData({ ...riskData, overallAssessment: e.target.value })}
          placeholder="Synthèse de l'analyse des risques, recommandations, niveau de risque global du projet..."
          className="input min-h-[120px] resize-none"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

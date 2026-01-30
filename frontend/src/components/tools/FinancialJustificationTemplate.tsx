import { useState, useEffect } from 'react';
import { Plus, Trash2, DollarSign, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface WorkingTimeConfig {
  daysPerYear: number;
  hoursPerDay: number;
  weeksPerYear: number;
}

interface CostCategory {
  id: string;
  name: string;
  currentCost: number;
  targetCost: number;
  unit: 'per_unit' | 'per_hour' | 'per_day' | 'per_week' | 'per_month' | 'per_year';
  volume: number;
  frequency: number;
  justification: string;
}

interface BenefitItem {
  id: string;
  description: string;
  type: 'cost_reduction' | 'cost_avoidance' | 'revenue_increase' | 'productivity' | 'quality';
  quantifiable: boolean;
  annualValue: number;
  confidence: 'high' | 'medium' | 'low';
}

interface RiskItem {
  id: string;
  description: string;
  financialImpact: number;
  probability: 'high' | 'medium' | 'low';
  mitigation: string;
}

interface FinancialData {
  projectName: string;
  businessContext: string;
  workingTime: WorkingTimeConfig;
  costCategories: CostCategory[];
  tangibleBenefits: BenefitItem[];
  intangibleBenefits: string[];
  financialRisks: RiskItem[];
  timeline: number;
  approvalStatus: 'draft' | 'submitted' | 'approved' | 'rejected';
  approverComments: string;
}

interface FinancialJustificationTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyCostCategory = (): CostCategory => ({
  id: crypto.randomUUID(),
  name: '',
  currentCost: 0,
  targetCost: 0,
  unit: 'per_month',
  volume: 1,
  frequency: 12,
  justification: '',
});

const createEmptyBenefitItem = (): BenefitItem => ({
  id: crypto.randomUUID(),
  description: '',
  type: 'cost_reduction',
  quantifiable: true,
  annualValue: 0,
  confidence: 'medium',
});

const createEmptyRiskItem = (): RiskItem => ({
  id: crypto.randomUUID(),
  description: '',
  financialImpact: 0,
  probability: 'medium',
  mitigation: '',
});

const unitLabels: Record<string, string> = {
  per_unit: 'Par unité',
  per_hour: 'Par heure',
  per_day: 'Par jour',
  per_week: 'Par semaine',
  per_month: 'Par mois',
  per_year: 'Par an',
};

const benefitTypeLabels: Record<string, string> = {
  cost_reduction: 'Réduction de coûts',
  cost_avoidance: 'Coûts évités',
  revenue_increase: 'Augmentation revenus',
  productivity: 'Productivité',
  quality: 'Qualité',
};

const confidenceColors: Record<string, string> = {
  high: 'text-measure bg-measure-light',
  medium: 'text-analyze bg-analyze-light',
  low: 'text-control bg-control-light',
};

const probabilityLabels: Record<string, string> = {
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
};

const defaultWorkingTime: WorkingTimeConfig = {
  daysPerYear: 220,
  hoursPerDay: 8,
  weeksPerYear: 47,
};

const getUnitMultiplier = (unit: string, workingTime: WorkingTimeConfig, frequency: number): number => {
  switch (unit) {
    case 'per_year': return 1;
    case 'per_month': return 12;
    case 'per_week': return workingTime.weeksPerYear;
    case 'per_day': return workingTime.daysPerYear;
    case 'per_hour': return workingTime.daysPerYear * workingTime.hoursPerDay;
    default: return frequency;
  }
};

export default function FinancialJustificationTemplate({
  data,
  onChange,
  readOnly = false,
}: FinancialJustificationTemplateProps) {
  const [finData, setFinData] = useState<FinancialData>({
    projectName: data.projectName || '',
    businessContext: data.businessContext || '',
    workingTime: data.workingTime || defaultWorkingTime,
    costCategories: data.costCategories?.length ? data.costCategories : [createEmptyCostCategory()],
    tangibleBenefits: data.tangibleBenefits?.length ? data.tangibleBenefits : [createEmptyBenefitItem()],
    intangibleBenefits: data.intangibleBenefits?.length ? data.intangibleBenefits : [''],
    financialRisks: data.financialRisks?.length ? data.financialRisks : [createEmptyRiskItem()],
    timeline: data.timeline || 12,
    approvalStatus: data.approvalStatus || 'draft',
    approverComments: data.approverComments || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setFinData({
        projectName: data.projectName || '',
        businessContext: data.businessContext || '',
        workingTime: data.workingTime || defaultWorkingTime,
        costCategories: data.costCategories?.length ? data.costCategories : [createEmptyCostCategory()],
        tangibleBenefits: data.tangibleBenefits?.length ? data.tangibleBenefits : [createEmptyBenefitItem()],
        intangibleBenefits: data.intangibleBenefits?.length ? data.intangibleBenefits : [''],
        financialRisks: data.financialRisks?.length ? data.financialRisks : [createEmptyRiskItem()],
        timeline: data.timeline || 12,
        approvalStatus: data.approvalStatus || 'draft',
        approverComments: data.approverComments || '',
      });
    }
  }, [data]);

  const updateData = (newData: FinancialData) => {
    setFinData(newData);
    onChange(newData);
  };

  // Calculate annual savings for a cost category
  const calculateAnnualSavings = (cat: CostCategory): number => {
    const saving = (cat.currentCost - cat.targetCost) * cat.volume;
    const multiplier = getUnitMultiplier(cat.unit, finData.workingTime, cat.frequency);
    return saving * multiplier;
  };

  // Update functions
  const updateCostCategory = (id: string, field: keyof CostCategory, value: any) => {
    const items = finData.costCategories.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateData({ ...finData, costCategories: items });
  };

  const updateBenefitItem = (id: string, field: keyof BenefitItem, value: any) => {
    const items = finData.tangibleBenefits.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateData({ ...finData, tangibleBenefits: items });
  };

  const updateRiskItem = (id: string, field: keyof RiskItem, value: any) => {
    const items = finData.financialRisks.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateData({ ...finData, financialRisks: items });
  };

  const updateIntangibleBenefit = (index: number, value: string) => {
    const items = [...finData.intangibleBenefits];
    items[index] = value;
    updateData({ ...finData, intangibleBenefits: items });
  };

  // Add/Remove functions
  const addCostCategory = () => {
    updateData({ ...finData, costCategories: [...finData.costCategories, createEmptyCostCategory()] });
  };

  const removeCostCategory = (id: string) => {
    if (finData.costCategories.length > 1) {
      updateData({ ...finData, costCategories: finData.costCategories.filter((i) => i.id !== id) });
    }
  };

  const addBenefitItem = () => {
    updateData({ ...finData, tangibleBenefits: [...finData.tangibleBenefits, createEmptyBenefitItem()] });
  };

  const removeBenefitItem = (id: string) => {
    if (finData.tangibleBenefits.length > 1) {
      updateData({ ...finData, tangibleBenefits: finData.tangibleBenefits.filter((i) => i.id !== id) });
    }
  };

  const addIntangibleBenefit = () => {
    updateData({ ...finData, intangibleBenefits: [...finData.intangibleBenefits, ''] });
  };

  const removeIntangibleBenefit = (index: number) => {
    if (finData.intangibleBenefits.length > 1) {
      const items = finData.intangibleBenefits.filter((_, i) => i !== index);
      updateData({ ...finData, intangibleBenefits: items });
    }
  };

  const addRiskItem = () => {
    updateData({ ...finData, financialRisks: [...finData.financialRisks, createEmptyRiskItem()] });
  };

  const removeRiskItem = (id: string) => {
    if (finData.financialRisks.length > 1) {
      updateData({ ...finData, financialRisks: finData.financialRisks.filter((i) => i.id !== id) });
    }
  };

  // Calculations
  const totalCurrentCosts = finData.costCategories.reduce((sum, cat) => {
    const multiplier = getUnitMultiplier(cat.unit, finData.workingTime, cat.frequency);
    return sum + (cat.currentCost * cat.volume * multiplier);
  }, 0);

  const totalTargetCosts = finData.costCategories.reduce((sum, cat) => {
    const multiplier = getUnitMultiplier(cat.unit, finData.workingTime, cat.frequency);
    return sum + (cat.targetCost * cat.volume * multiplier);
  }, 0);

  const totalCostSavings = finData.costCategories.reduce((sum, cat) => sum + calculateAnnualSavings(cat), 0);

  const totalTangibleBenefits = finData.tangibleBenefits
    .filter((b) => b.quantifiable)
    .reduce((sum, b) => sum + b.annualValue, 0);

  const highConfidenceBenefits = finData.tangibleBenefits
    .filter((b) => b.quantifiable && b.confidence === 'high')
    .reduce((sum, b) => sum + b.annualValue, 0);

  const totalRiskExposure = finData.financialRisks.reduce((sum, r) => {
    const probabilityFactor = r.probability === 'high' ? 0.75 : r.probability === 'medium' ? 0.5 : 0.25;
    return sum + (r.financialImpact * probabilityFactor);
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-define flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Justification Financière</h2>
            <p className="text-sm text-gray-500">
              Documentation du cas financier pour approbation du projet
            </p>
          </div>
          <div className={cn(
            'px-4 py-2 rounded-full text-sm font-medium',
            finData.approvalStatus === 'approved' ? 'bg-measure-light text-measure' :
            finData.approvalStatus === 'rejected' ? 'bg-control-light text-control' :
            finData.approvalStatus === 'submitted' ? 'bg-analyze-light text-analyze' :
            'bg-gray-100 text-gray-600'
          )}>
            {finData.approvalStatus === 'approved' ? '✓ Approuvé' :
             finData.approvalStatus === 'rejected' ? '✗ Refusé' :
             finData.approvalStatus === 'submitted' ? '⏳ En attente' : 'Brouillon'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du projet</label>
            <input
              type="text"
              value={finData.projectName}
              onChange={(e) => updateData({ ...finData, projectName: e.target.value })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Horizon d'analyse (mois)</label>
            <select
              value={finData.timeline}
              onChange={(e) => updateData({ ...finData, timeline: parseInt(e.target.value) })}
              className="input"
              disabled={readOnly}
            >
              <option value={6}>6 mois</option>
              <option value={12}>12 mois</option>
              <option value={24}>24 mois</option>
              <option value={36}>36 mois</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Contexte métier</label>
          <textarea
            value={finData.businessContext}
            onChange={(e) => updateData({ ...finData, businessContext: e.target.value })}
            placeholder="Décrivez le contexte business et la problématique financière à résoudre..."
            className="input min-h-[100px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Working Time Configuration */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Configuration du temps de travail</h3>
        <p className="text-sm text-gray-500 mb-4">
          Ces paramètres sont utilisés pour convertir les coûts horaires et journaliers en valeurs annuelles.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Jours travaillés / an</label>
            <input
              type="number"
              value={finData.workingTime.daysPerYear}
              onChange={(e) => updateData({
                ...finData,
                workingTime: { ...finData.workingTime, daysPerYear: parseInt(e.target.value) || 220 }
              })}
              min={1}
              max={366}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Heures travaillées / jour</label>
            <input
              type="number"
              value={finData.workingTime.hoursPerDay}
              onChange={(e) => updateData({
                ...finData,
                workingTime: { ...finData.workingTime, hoursPerDay: parseFloat(e.target.value) || 8 }
              })}
              min={1}
              max={24}
              step={0.5}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Semaines travaillées / an</label>
            <input
              type="number"
              value={finData.workingTime.weeksPerYear}
              onChange={(e) => updateData({
                ...finData,
                workingTime: { ...finData.workingTime, weeksPerYear: parseInt(e.target.value) || 47 }
              })}
              min={1}
              max={52}
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <strong>Multiplicateurs calculés :</strong>{' '}
          Par heure = {finData.workingTime.daysPerYear * finData.workingTime.hoursPerDay} h/an |
          Par jour = {finData.workingTime.daysPerYear} j/an |
          Par semaine = {finData.workingTime.weeksPerYear} sem/an
        </div>
      </div>

      {/* Cost Categories Analysis */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-control-light border-b border-gray-100 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-control" />
          <h3 className="font-semibold text-control">Analyse des coûts actuels vs. cibles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Catégorie de coût</th>
                <th className="px-4 py-3 text-center font-medium w-28">Coût actuel (€)</th>
                <th className="px-4 py-3 text-center font-medium w-28">Coût cible (€)</th>
                <th className="px-4 py-3 text-center font-medium w-28">Unité</th>
                <th className="px-4 py-3 text-center font-medium w-20">Volume</th>
                <th className="px-4 py-3 text-right font-medium w-32">Économie annuelle</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {finData.costCategories.map((cat) => (
                <tr key={cat.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => updateCostCategory(cat.id, 'name', e.target.value)}
                      placeholder="Ex: Main d'œuvre directe"
                      className="w-full p-2 border rounded-lg text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={cat.currentCost || ''}
                      onChange={(e) => updateCostCategory(cat.id, 'currentCost', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={cat.targetCost || ''}
                      onChange={(e) => updateCostCategory(cat.id, 'targetCost', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={cat.unit}
                      onChange={(e) => updateCostCategory(cat.id, 'unit', e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                      disabled={readOnly}
                    >
                      {Object.entries(unitLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={cat.volume || ''}
                      onChange={(e) => updateCostCategory(cat.id, 'volume', parseFloat(e.target.value) || 1)}
                      className="w-full p-2 border rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    <span className={calculateAnnualSavings(cat) >= 0 ? 'text-measure' : 'text-control'}>
                      {formatCurrency(calculateAnnualSavings(cat))}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && finData.costCategories.length > 1 && (
                      <button onClick={() => removeCostCategory(cat.id)} className="p-2 text-gray-400 hover:text-control">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td className="px-4 py-3">Total annuel</td>
                <td className="px-4 py-3 text-center text-control">{formatCurrency(totalCurrentCosts)}</td>
                <td className="px-4 py-3 text-center text-measure">{formatCurrency(totalTargetCosts)}</td>
                <td colSpan={2}></td>
                <td className="px-4 py-3 text-right text-measure">{formatCurrency(totalCostSavings)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && (
          <div className="p-4 border-t bg-gray-50">
            <button onClick={addCostCategory} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter une catégorie de coût
            </button>
          </div>
        )}
      </div>

      {/* Tangible Benefits */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-measure-light border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-measure" />
          <h3 className="font-semibold text-measure">Bénéfices tangibles quantifiables</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Description du bénéfice</th>
                <th className="px-4 py-3 text-center font-medium w-36">Type</th>
                <th className="px-4 py-3 text-center font-medium w-32">Valeur annuelle (€)</th>
                <th className="px-4 py-3 text-center font-medium w-28">Confiance</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {finData.tangibleBenefits.map((benefit) => (
                <tr key={benefit.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={benefit.description}
                      onChange={(e) => updateBenefitItem(benefit.id, 'description', e.target.value)}
                      placeholder="Ex: Réduction du temps de cycle"
                      className="w-full p-2 border rounded-lg text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={benefit.type}
                      onChange={(e) => updateBenefitItem(benefit.id, 'type', e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                      disabled={readOnly}
                    >
                      {Object.entries(benefitTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={benefit.annualValue || ''}
                      onChange={(e) => updateBenefitItem(benefit.id, 'annualValue', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg text-right text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={benefit.confidence}
                      onChange={(e) => updateBenefitItem(benefit.id, 'confidence', e.target.value)}
                      className={cn('w-full p-2 border rounded-lg text-sm text-center font-medium', confidenceColors[benefit.confidence])}
                      disabled={readOnly}
                    >
                      <option value="high">Élevée</option>
                      <option value="medium">Moyenne</option>
                      <option value="low">Faible</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && finData.tangibleBenefits.length > 1 && (
                      <button onClick={() => removeBenefitItem(benefit.id)} className="p-2 text-gray-400 hover:text-control">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-measure-light font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">Total bénéfices tangibles</td>
                <td className="px-4 py-3 text-right text-measure">{formatCurrency(totalTangibleBenefits)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && (
          <div className="p-4 border-t bg-gray-50">
            <button onClick={addBenefitItem} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un bénéfice tangible
            </button>
          </div>
        )}
      </div>

      {/* Intangible Benefits */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-improve" />
          <h3 className="font-semibold">Bénéfices intangibles</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Bénéfices difficiles à quantifier mais importants pour la décision
        </p>
        <div className="space-y-3">
          {finData.intangibleBenefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={benefit}
                onChange={(e) => updateIntangibleBenefit(index, e.target.value)}
                placeholder="Ex: Amélioration de la satisfaction client, Image de marque..."
                className="input flex-1"
                disabled={readOnly}
              />
              {!readOnly && finData.intangibleBenefits.length > 1 && (
                <button onClick={() => removeIntangibleBenefit(index)} className="p-2 text-gray-400 hover:text-control">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {!readOnly && (
          <button onClick={addIntangibleBenefit} className="btn btn-secondary w-full mt-4 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Ajouter un bénéfice intangible
          </button>
        )}
      </div>

      {/* Financial Risks */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-control-light border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-control" />
          <h3 className="font-semibold text-control">Risques financiers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Description du risque</th>
                <th className="px-4 py-3 text-center font-medium w-32">Impact (€)</th>
                <th className="px-4 py-3 text-center font-medium w-28">Probabilité</th>
                <th className="px-4 py-3 text-left font-medium w-48">Plan de mitigation</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {finData.financialRisks.map((risk) => (
                <tr key={risk.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={risk.description}
                      onChange={(e) => updateRiskItem(risk.id, 'description', e.target.value)}
                      placeholder="Ex: Dépassement budget"
                      className="w-full p-2 border rounded-lg text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={risk.financialImpact || ''}
                      onChange={(e) => updateRiskItem(risk.id, 'financialImpact', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border rounded-lg text-right text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={risk.probability}
                      onChange={(e) => updateRiskItem(risk.id, 'probability', e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                      disabled={readOnly}
                    >
                      {Object.entries(probabilityLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={risk.mitigation}
                      onChange={(e) => updateRiskItem(risk.id, 'mitigation', e.target.value)}
                      placeholder="Actions de mitigation"
                      className="w-full p-2 border rounded-lg text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && finData.financialRisks.length > 1 && (
                      <button onClick={() => removeRiskItem(risk.id)} className="p-2 text-gray-400 hover:text-control">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-control-light font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">Exposition au risque pondérée</td>
                <td colSpan={2} className="px-4 py-3 text-control">{formatCurrency(totalRiskExposure)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && (
          <div className="p-4 border-t bg-gray-50">
            <button onClick={addRiskItem} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un risque financier
            </button>
          </div>
        )}
      </div>

      {/* Summary Dashboard */}
      <div className="card p-6">
        <h3 className="font-semibold mb-6">Synthèse financière</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-control-light rounded-xl p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Coûts actuels (an)</div>
            <div className="text-2xl font-bold text-control">{formatCurrency(totalCurrentCosts)}</div>
          </div>
          <div className="bg-measure-light rounded-xl p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Coûts cibles (an)</div>
            <div className="text-2xl font-bold text-measure">{formatCurrency(totalTargetCosts)}</div>
          </div>
          <div className="bg-improve-light rounded-xl p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Économies annuelles</div>
            <div className="text-2xl font-bold text-improve">{formatCurrency(totalCostSavings)}</div>
          </div>
          <div className="bg-define-light rounded-xl p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Bénéfices (confiance haute)</div>
            <div className="text-2xl font-bold text-define">{formatCurrency(highConfidenceBenefits)}</div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500 mb-1">Total bénéfices sur {finData.timeline} mois</div>
              <div className="text-xl font-bold text-measure">
                {formatCurrency((totalCostSavings + totalTangibleBenefits) * (finData.timeline / 12))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Réduction de coûts</div>
              <div className="text-xl font-bold text-improve">
                {totalCurrentCosts > 0 ? ((totalCostSavings / totalCurrentCosts) * 100).toFixed(1) : 0}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Bénéfice net (après risques)</div>
              <div className={cn(
                'text-xl font-bold',
                (totalCostSavings + totalTangibleBenefits - totalRiskExposure) >= 0 ? 'text-measure' : 'text-control'
              )}>
                {formatCurrency(totalCostSavings + totalTangibleBenefits - totalRiskExposure)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Section */}
      {!readOnly && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Statut d'approbation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Statut</label>
              <select
                value={finData.approvalStatus}
                onChange={(e) => updateData({ ...finData, approvalStatus: e.target.value as any })}
                className="input"
              >
                <option value="draft">Brouillon</option>
                <option value="submitted">Soumis pour approbation</option>
                <option value="approved">Approuvé</option>
                <option value="rejected">Refusé</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Commentaires approbateur</label>
              <textarea
                value={finData.approverComments}
                onChange={(e) => updateData({ ...finData, approverComments: e.target.value })}
                placeholder="Commentaires du décideur..."
                className="input min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

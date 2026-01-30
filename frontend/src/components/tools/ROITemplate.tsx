import { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator, TrendingUp, DollarSign, Clock, PiggyBank, Info } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface CostItem {
  id: string;
  description: string;
  hours: number;
  hourlyRate: number;
  quantity: number;
  totalCost: number;
}

interface GainItem {
  id: string;
  description: string;
  gainType: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'oneTime';
  amount: number;
  frequency: number; // Pour calculer sur une période
  annualGain: number;
}

interface InvestmentItem {
  id: string;
  description: string;
  category: 'equipment' | 'software' | 'training' | 'consulting' | 'infrastructure' | 'other';
  amount: number;
}

interface WorkingTimeConfig {
  daysPerYear: number;
  hoursPerDay: number;
  weeksPerYear: number;
}

interface ROIData {
  projectName: string;
  projectDescription: string;
  workingTime: WorkingTimeConfig;
  studyCosts: CostItem[];
  implementationCosts: CostItem[];
  investments: InvestmentItem[];
  gains: GainItem[];
  assumptions: string;
  risks: string;
  analysisHorizonMonths: number; // en mois
}

interface ROITemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyCostItem = (): CostItem => ({
  id: crypto.randomUUID(),
  description: '',
  hours: 0,
  hourlyRate: 50,
  quantity: 1,
  totalCost: 0,
});

const createEmptyGainItem = (): GainItem => ({
  id: crypto.randomUUID(),
  description: '',
  gainType: 'monthly',
  amount: 0,
  frequency: 12,
  annualGain: 0,
});

const createEmptyInvestmentItem = (): InvestmentItem => ({
  id: crypto.randomUUID(),
  description: '',
  category: 'equipment',
  amount: 0,
});

const gainTypeLabels: Record<string, string> = {
  hourly: 'Par heure',
  daily: 'Par jour',
  weekly: 'Par semaine',
  monthly: 'Par mois',
  yearly: 'Par an',
  oneTime: 'Ponctuel',
};

const defaultWorkingTime: WorkingTimeConfig = {
  daysPerYear: 220,
  hoursPerDay: 8,
  weeksPerYear: 47,
};

// Calculate multipliers based on working time configuration
const getGainTypeMultipliers = (workingTime: WorkingTimeConfig): Record<string, number> => ({
  hourly: workingTime.daysPerYear * workingTime.hoursPerDay,
  daily: workingTime.daysPerYear,
  weekly: workingTime.weeksPerYear,
  monthly: 12,
  yearly: 1,
  oneTime: 1,
});

const categoryLabels: Record<string, string> = {
  equipment: 'Équipement',
  software: 'Logiciel',
  training: 'Formation',
  consulting: 'Conseil',
  infrastructure: 'Infrastructure',
  other: 'Autre',
};

export default function ROITemplate({
  data,
  onChange,
  readOnly = false,
}: ROITemplateProps) {
  // Helper to get horizon in months (backward compatible with old data in years)
  const getHorizonMonths = (d: Record<string, any>) => {
    if (d.analysisHorizonMonths) return d.analysisHorizonMonths;
    if (d.analysisHorizon) return d.analysisHorizon * 12; // Convert old years to months
    return 36; // Default 3 years = 36 months
  };

  const [roiData, setRoiData] = useState<ROIData>({
    projectName: data.projectName || '',
    projectDescription: data.projectDescription || '',
    workingTime: data.workingTime || { ...defaultWorkingTime },
    studyCosts: data.studyCosts?.length ? data.studyCosts : [createEmptyCostItem()],
    implementationCosts: data.implementationCosts?.length ? data.implementationCosts : [createEmptyCostItem()],
    investments: data.investments?.length ? data.investments : [createEmptyInvestmentItem()],
    gains: data.gains?.length ? data.gains : [createEmptyGainItem()],
    assumptions: data.assumptions || '',
    risks: data.risks || '',
    analysisHorizonMonths: getHorizonMonths(data),
  });

  const [showRoiInfo, setShowRoiInfo] = useState(false);

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setRoiData({
        projectName: data.projectName || '',
        projectDescription: data.projectDescription || '',
        workingTime: data.workingTime || { ...defaultWorkingTime },
        studyCosts: data.studyCosts?.length ? data.studyCosts : [createEmptyCostItem()],
        implementationCosts: data.implementationCosts?.length ? data.implementationCosts : [createEmptyCostItem()],
        investments: data.investments?.length ? data.investments : [createEmptyInvestmentItem()],
        gains: data.gains?.length ? data.gains : [createEmptyGainItem()],
        assumptions: data.assumptions || '',
        risks: data.risks || '',
        analysisHorizonMonths: getHorizonMonths(data),
      });
    }
  }, [data]);

  const updateData = (newData: ROIData) => {
    setRoiData(newData);
    onChange(newData);
  };

  // Calculate cost item total
  const calculateCostTotal = (item: CostItem): number => {
    return item.hours * item.hourlyRate * item.quantity;
  };

  // Get multipliers based on current working time configuration
  const gainTypeMultipliers = getGainTypeMultipliers(roiData.workingTime);

  // Calculate annual gain
  const calculateAnnualGain = (item: GainItem): number => {
    if (item.gainType === 'oneTime') {
      return item.amount;
    }
    return item.amount * gainTypeMultipliers[item.gainType];
  };

  // Update cost item
  const updateCostItem = (
    listKey: 'studyCosts' | 'implementationCosts',
    id: string,
    field: keyof CostItem,
    value: any
  ) => {
    const items = roiData[listKey].map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.totalCost = calculateCostTotal(updatedItem);
        return updatedItem;
      }
      return item;
    });
    updateData({ ...roiData, [listKey]: items });
  };

  // Update investment item
  const updateInvestmentItem = (id: string, field: keyof InvestmentItem, value: any) => {
    const items = roiData.investments.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateData({ ...roiData, investments: items });
  };

  // Update gain item
  const updateGainItem = (id: string, field: keyof GainItem, value: any) => {
    const items = roiData.gains.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.annualGain = calculateAnnualGain(updatedItem);
        return updatedItem;
      }
      return item;
    });
    updateData({ ...roiData, gains: items });
  };

  // Add/Remove functions
  const addCostItem = (listKey: 'studyCosts' | 'implementationCosts') => {
    updateData({
      ...roiData,
      [listKey]: [...roiData[listKey], createEmptyCostItem()],
    });
  };

  const removeCostItem = (listKey: 'studyCosts' | 'implementationCosts', id: string) => {
    if (roiData[listKey].length > 1) {
      updateData({
        ...roiData,
        [listKey]: roiData[listKey].filter((item) => item.id !== id),
      });
    }
  };

  const addInvestmentItem = () => {
    updateData({
      ...roiData,
      investments: [...roiData.investments, createEmptyInvestmentItem()],
    });
  };

  const removeInvestmentItem = (id: string) => {
    if (roiData.investments.length > 1) {
      updateData({
        ...roiData,
        investments: roiData.investments.filter((item) => item.id !== id),
      });
    }
  };

  const addGainItem = () => {
    updateData({
      ...roiData,
      gains: [...roiData.gains, createEmptyGainItem()],
    });
  };

  const removeGainItem = (id: string) => {
    if (roiData.gains.length > 1) {
      updateData({
        ...roiData,
        gains: roiData.gains.filter((item) => item.id !== id),
      });
    }
  };

  // Calculations
  const totalStudyCosts = roiData.studyCosts.reduce((sum, item) => sum + calculateCostTotal(item), 0);
  const totalImplementationCosts = roiData.implementationCosts.reduce((sum, item) => sum + calculateCostTotal(item), 0);
  const totalInvestments = roiData.investments.reduce((sum, item) => sum + item.amount, 0);
  const totalCosts = totalStudyCosts + totalImplementationCosts + totalInvestments;

  const annualGains = roiData.gains.reduce((sum, item) => sum + calculateAnnualGain(item), 0);
  const oneTimeGains = roiData.gains
    .filter((item) => item.gainType === 'oneTime')
    .reduce((sum, item) => sum + item.amount, 0);
  const recurringAnnualGains = annualGains - oneTimeGains;

  // Calculate gains over the horizon (in months)
  const horizonYears = roiData.analysisHorizonMonths / 12;
  const totalGainsOverHorizon = oneTimeGains + recurringAnnualGains * horizonYears;
  const netBenefit = totalGainsOverHorizon - totalCosts;
  const roiPercentage = totalCosts > 0 ? ((totalGainsOverHorizon - totalCosts) / totalCosts) * 100 : 0;
  const paybackMonths = recurringAnnualGains > 0 ? (totalCosts / (recurringAnnualGains / 12)) : Infinity;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-define flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Calculateur ROI</h2>
            <p className="text-sm text-gray-500">
              Retour sur Investissement - Analyse financière du projet
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du projet</label>
            <input
              type="text"
              value={roiData.projectName}
              onChange={(e) => updateData({ ...roiData, projectName: e.target.value })}
              placeholder="Ex: Amélioration processus de production"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Horizon d'analyse pour le ROI</label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={roiData.analysisHorizonMonths}
                onChange={(e) => updateData({ ...roiData, analysisHorizonMonths: Math.max(1, parseInt(e.target.value) || 1) })}
                min={1}
                max={120}
                className="input w-24"
                disabled={readOnly}
              />
              <span className="text-sm text-gray-600">mois</span>
              <span className="text-xs text-gray-400">
                ({roiData.analysisHorizonMonths >= 12
                  ? `${(roiData.analysisHorizonMonths / 12).toFixed(1)} an${roiData.analysisHorizonMonths >= 24 ? 's' : ''}`
                  : `${roiData.analysisHorizonMonths} mois`})
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              {[6, 12, 24, 36, 60].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => !readOnly && updateData({ ...roiData, analysisHorizonMonths: months })}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition-colors',
                    roiData.analysisHorizonMonths === months
                      ? 'bg-define text-white border-define'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-define'
                  )}
                  disabled={readOnly}
                >
                  {months < 12 ? `${months}m` : `${months / 12}an${months > 12 ? 's' : ''}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Working Time Configuration */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Paramètres de temps de travail (pour le calcul des gains)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                Jours travaillés / an
              </label>
              <input
                type="number"
                value={roiData.workingTime.daysPerYear}
                onChange={(e) => updateData({
                  ...roiData,
                  workingTime: { ...roiData.workingTime, daysPerYear: parseInt(e.target.value) || 220 }
                })}
                min={1}
                max={365}
                className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                disabled={readOnly}
              />
              <span className="text-xs text-blue-600">Défaut: 220 jours</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                Heures travaillées / jour
              </label>
              <input
                type="number"
                value={roiData.workingTime.hoursPerDay}
                onChange={(e) => updateData({
                  ...roiData,
                  workingTime: { ...roiData.workingTime, hoursPerDay: parseFloat(e.target.value) || 8 }
                })}
                min={1}
                max={24}
                step={0.5}
                className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                disabled={readOnly}
              />
              <span className="text-xs text-blue-600">Défaut: 8 heures</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">
                Semaines travaillées / an
              </label>
              <input
                type="number"
                value={roiData.workingTime.weeksPerYear}
                onChange={(e) => updateData({
                  ...roiData,
                  workingTime: { ...roiData.workingTime, weeksPerYear: parseInt(e.target.value) || 47 }
                })}
                min={1}
                max={52}
                className="w-full p-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                disabled={readOnly}
              />
              <span className="text-xs text-blue-600">Défaut: 47 semaines</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
            <strong>Calculs automatiques:</strong> Gain horaire × {roiData.workingTime.daysPerYear * roiData.workingTime.hoursPerDay} h/an |
            Gain journalier × {roiData.workingTime.daysPerYear} j/an |
            Gain hebdo × {roiData.workingTime.weeksPerYear} sem/an
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Description du projet</label>
          <textarea
            value={roiData.projectDescription}
            onChange={(e) => updateData({ ...roiData, projectDescription: e.target.value })}
            placeholder="Décrivez brièvement l'objectif du projet..."
            className="input min-h-[80px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Study Costs */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-define-light border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-define" />
          <h3 className="font-semibold text-define">Coûts d'étude (phase projet)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-center font-medium w-24">Heures</th>
                <th className="px-4 py-3 text-center font-medium w-28">Taux horaire (€)</th>
                <th className="px-4 py-3 text-center font-medium w-20">Quantité</th>
                <th className="px-4 py-3 text-right font-medium w-32">Total</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {roiData.studyCosts.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateCostItem('studyCosts', item.id, 'description', e.target.value)}
                      placeholder="Ex: Analyse des données"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-define text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.hours || ''}
                      onChange={(e) => updateCostItem('studyCosts', item.id, 'hours', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.hourlyRate || ''}
                      onChange={(e) => updateCostItem('studyCosts', item.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => updateCostItem('studyCosts', item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(calculateCostTotal(item))}
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && roiData.studyCosts.length > 1 && (
                      <button
                        onClick={() => removeCostItem('studyCosts', item.id)}
                        className="p-2 text-gray-400 hover:text-control rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-define-light font-semibold">
                <td colSpan={4} className="px-4 py-3 text-right">Total coûts d'étude</td>
                <td className="px-4 py-3 text-right text-define">{formatCurrency(totalStudyCosts)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button onClick={() => addCostItem('studyCosts')} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un coût d'étude
            </button>
          </div>
        )}
      </div>

      {/* Implementation Costs */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-measure-light border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-measure" />
          <h3 className="font-semibold text-measure">Coûts de mise en œuvre</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-center font-medium w-24">Heures</th>
                <th className="px-4 py-3 text-center font-medium w-28">Taux horaire (€)</th>
                <th className="px-4 py-3 text-center font-medium w-20">Quantité</th>
                <th className="px-4 py-3 text-right font-medium w-32">Total</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {roiData.implementationCosts.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateCostItem('implementationCosts', item.id, 'description', e.target.value)}
                      placeholder="Ex: Formation des équipes"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-measure text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.hours || ''}
                      onChange={(e) => updateCostItem('implementationCosts', item.id, 'hours', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.hourlyRate || ''}
                      onChange={(e) => updateCostItem('implementationCosts', item.id, 'hourlyRate', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => updateCostItem('implementationCosts', item.id, 'quantity', parseFloat(e.target.value) || 1)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-center text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(calculateCostTotal(item))}
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && roiData.implementationCosts.length > 1 && (
                      <button
                        onClick={() => removeCostItem('implementationCosts', item.id)}
                        className="p-2 text-gray-400 hover:text-control rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-measure-light font-semibold">
                <td colSpan={4} className="px-4 py-3 text-right">Total coûts de mise en œuvre</td>
                <td className="px-4 py-3 text-right text-measure">{formatCurrency(totalImplementationCosts)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button onClick={() => addCostItem('implementationCosts')} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un coût de mise en œuvre
            </button>
          </div>
        )}
      </div>

      {/* Investments */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-analyze-light border-b border-gray-100 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-analyze" />
          <h3 className="font-semibold text-analyze">Investissements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Description</th>
                <th className="px-4 py-3 text-left font-medium w-40">Catégorie</th>
                <th className="px-4 py-3 text-right font-medium w-36">Montant (€)</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {roiData.investments.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateInvestmentItem(item.id, 'description', e.target.value)}
                      placeholder="Ex: Nouveau logiciel"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-analyze text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={item.category}
                      onChange={(e) => updateInvestmentItem(item.id, 'category', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      disabled={readOnly}
                    >
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => updateInvestmentItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-right text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && roiData.investments.length > 1 && (
                      <button
                        onClick={() => removeInvestmentItem(item.id)}
                        className="p-2 text-gray-400 hover:text-control rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-analyze-light font-semibold">
                <td colSpan={2} className="px-4 py-3 text-right">Total investissements</td>
                <td className="px-4 py-3 text-right text-analyze">{formatCurrency(totalInvestments)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button onClick={addInvestmentItem} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un investissement
            </button>
          </div>
        )}
      </div>

      {/* Gains */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-improve-light border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-improve" />
          <h3 className="font-semibold text-improve">Gains attendus</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Description du gain</th>
                <th className="px-4 py-3 text-left font-medium w-32">Fréquence</th>
                <th className="px-4 py-3 text-right font-medium w-32">Montant (€)</th>
                <th className="px-4 py-3 text-right font-medium w-36">Gain annuel</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {roiData.gains.map((item) => (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateGainItem(item.id, 'description', e.target.value)}
                      placeholder="Ex: Réduction rebuts"
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-improve text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={item.gainType}
                      onChange={(e) => updateGainItem(item.id, 'gainType', e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                      disabled={readOnly}
                    >
                      {Object.entries(gainTypeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={(e) => updateGainItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-right text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-improve">
                    {formatCurrency(calculateAnnualGain(item))}
                    {item.gainType !== 'oneTime' && <span className="text-xs text-gray-400">/an</span>}
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && roiData.gains.length > 1 && (
                      <button
                        onClick={() => removeGainItem(item.id)}
                        className="p-2 text-gray-400 hover:text-control rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-improve-light font-semibold">
                <td colSpan={3} className="px-4 py-3 text-right">Total gains annuels récurrents</td>
                <td className="px-4 py-3 text-right text-improve">{formatCurrency(recurringAnnualGains)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button onClick={addGainItem} className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Ajouter un gain
            </button>
          </div>
        )}
      </div>

      {/* ROI Summary Dashboard */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <PiggyBank className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold">Synthèse ROI</h3>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-control-light rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-1">Investissement total</div>
            <div className="text-2xl font-bold text-control">{formatCurrency(totalCosts)}</div>
          </div>
          <div className="bg-improve-light rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-1">
              Gains sur {roiData.analysisHorizonMonths >= 12
                ? `${(roiData.analysisHorizonMonths / 12).toFixed(roiData.analysisHorizonMonths % 12 === 0 ? 0 : 1)} an${roiData.analysisHorizonMonths >= 24 ? 's' : ''}`
                : `${roiData.analysisHorizonMonths} mois`}
            </div>
            <div className="text-2xl font-bold text-improve">{formatCurrency(totalGainsOverHorizon)}</div>
          </div>
          <div className={cn(
            'rounded-xl p-4',
            netBenefit >= 0 ? 'bg-measure-light' : 'bg-control-light'
          )}>
            <div className="text-sm text-gray-500 mb-1">Bénéfice net</div>
            <div className={cn(
              'text-2xl font-bold',
              netBenefit >= 0 ? 'text-measure' : 'text-control'
            )}>
              {formatCurrency(netBenefit)}
            </div>
          </div>
          <div className={cn(
            'rounded-xl p-4 relative',
            roiPercentage >= 100 ? 'bg-measure-light' : roiPercentage >= 0 ? 'bg-analyze-light' : 'bg-control-light'
          )}>
            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
              <span>ROI</span>
              <button
                type="button"
                onClick={() => setShowRoiInfo(!showRoiInfo)}
                className="w-4 h-4 rounded-full bg-gray-400 text-white flex items-center justify-center hover:bg-gray-500 transition-colors"
                title="Comment est calculé le ROI ?"
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
            <div className={cn(
              'text-2xl font-bold',
              roiPercentage >= 100 ? 'text-measure' : roiPercentage >= 0 ? 'text-analyze' : 'text-control'
            )}>
              {roiPercentage.toFixed(1)}%
            </div>

            {/* ROI Info Tooltip */}
            {showRoiInfo && (
              <div className="absolute z-10 top-full right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-800">Comment est calculé le ROI ?</div>
                  <button
                    type="button"
                    onClick={() => setShowRoiInfo(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-gray-600 space-y-2">
                  <p><strong>Formule :</strong></p>
                  <p className="bg-gray-100 p-2 rounded font-mono text-center">
                    ROI = ((Gains - Coûts) / Coûts) × 100
                  </p>
                  <div className="border-t pt-2 mt-2">
                    <p><strong>Votre calcul :</strong></p>
                    <p className="text-gray-500">
                      (({formatCurrency(totalGainsOverHorizon)} - {formatCurrency(totalCosts)}) / {formatCurrency(totalCosts)}) × 100
                    </p>
                    <p className="font-semibold text-gray-800">= {roiPercentage.toFixed(1)}%</p>
                  </div>
                  <div className="border-t pt-2 mt-2 text-gray-500">
                    <p>• <strong>Gains</strong> = {formatCurrency(oneTimeGains)} (ponctuels) + {formatCurrency(recurringAnnualGains)}/an × {horizonYears.toFixed(1)} ans</p>
                    <p>• <strong>Coûts</strong> = {formatCurrency(totalStudyCosts)} + {formatCurrency(totalImplementationCosts)} + {formatCurrency(totalInvestments)}</p>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <p className={cn(
                      'font-medium',
                      roiPercentage >= 100 ? 'text-measure' : roiPercentage >= 50 ? 'text-analyze' : roiPercentage >= 0 ? 'text-gray-600' : 'text-control'
                    )}>
                      Pour 1€ investi → {(1 + roiPercentage / 100).toFixed(2)}€ récupérés
                      {roiPercentage >= 100 ? ' (excellent)' : roiPercentage >= 50 ? ' (bon)' : roiPercentage >= 0 ? ' (acceptable)' : ' (non rentable)'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payback Period */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Délai de récupération (Payback)</div>
              <div className="text-xl font-bold">
                {paybackMonths === Infinity ? (
                  <span className="text-control">Non calculable</span>
                ) : paybackMonths <= 12 ? (
                  <span className="text-measure">{paybackMonths.toFixed(1)} mois</span>
                ) : paybackMonths <= 24 ? (
                  <span className="text-analyze">{(paybackMonths / 12).toFixed(1)} ans</span>
                ) : (
                  <span className="text-control">{(paybackMonths / 12).toFixed(1)} ans</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Gain mensuel récurrent</div>
              <div className="text-xl font-bold text-improve">{formatCurrency(recurringAnnualGains / 12)}</div>
            </div>
          </div>

          {/* Payback visualization */}
          {paybackMonths !== Infinity && paybackMonths <= roiData.analysisHorizonMonths && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>0</span>
                <span>{Math.ceil(paybackMonths)} mois</span>
                <span>{roiData.analysisHorizonMonths} mois</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-control via-analyze to-measure rounded-full"
                  style={{ width: `${Math.min((paybackMonths / roiData.analysisHorizonMonths) * 100, 100)}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Point mort atteint à {((paybackMonths / roiData.analysisHorizonMonths) * 100).toFixed(0)}% de l'horizon d'analyse
              </div>
            </div>
          )}
        </div>

        {/* Cost breakdown */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="border rounded-lg p-3">
            <div className="text-gray-500 mb-1">Coûts d'étude</div>
            <div className="font-semibold">{formatCurrency(totalStudyCosts)}</div>
            <div className="text-xs text-gray-400">
              {totalCosts > 0 ? ((totalStudyCosts / totalCosts) * 100).toFixed(0) : 0}% du total
            </div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-gray-500 mb-1">Coûts mise en œuvre</div>
            <div className="font-semibold">{formatCurrency(totalImplementationCosts)}</div>
            <div className="text-xs text-gray-400">
              {totalCosts > 0 ? ((totalImplementationCosts / totalCosts) * 100).toFixed(0) : 0}% du total
            </div>
          </div>
          <div className="border rounded-lg p-3">
            <div className="text-gray-500 mb-1">Investissements</div>
            <div className="font-semibold">{formatCurrency(totalInvestments)}</div>
            <div className="text-xs text-gray-400">
              {totalCosts > 0 ? ((totalInvestments / totalCosts) * 100).toFixed(0) : 0}% du total
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Hypothèses</label>
          <textarea
            value={roiData.assumptions}
            onChange={(e) => updateData({ ...roiData, assumptions: e.target.value })}
            placeholder="Listez les hypothèses prises pour ce calcul de ROI..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Risques financiers</label>
          <textarea
            value={roiData.risks}
            onChange={(e) => updateData({ ...roiData, risks: e.target.value })}
            placeholder="Identifiez les risques pouvant impacter ce ROI..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

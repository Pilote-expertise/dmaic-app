import React, { useState, useEffect, useMemo } from 'react';
import { ToolDefinition } from '../../types';

interface GainItem {
  id: string;
  category: string;
  metricName: string;
  unit: string;
  baselineValue: number | null;
  targetValue: number | null;
  achievedValue: number | null;
  financialValuePerUnit: number | null;
  gainType: 'hard-savings' | 'soft-savings' | 'cost-avoidance' | 'revenue-increase';
  validatedBy: string;
  validationDate: string;
  evidenceSource: string;
  sustainabilityPeriod: number;
  notes: string;
}

interface GainsCalculationData {
  projectName: string;
  calculationDate: string;
  financialController: string;
  gains: GainItem[];
  additionalCosts: {
    id: string;
    description: string;
    amount: number;
    type: 'one-time' | 'recurring';
    recurringPeriod?: 'monthly' | 'yearly';
  }[];
  summary: {
    totalHardSavings: number;
    totalSoftSavings: number;
    totalCostAvoidance: number;
    totalRevenueIncrease: number;
    totalGross: number;
    totalCosts: number;
    totalNet: number;
    roi: number;
    paybackMonths: number;
  };
  validationStatus: 'draft' | 'pending-validation' | 'validated' | 'rejected';
  validationComments: string;
  overallConclusion: string;
}

interface GainsCalculationTemplateProps {
  data: GainsCalculationData | null;
  onChange: (data: GainsCalculationData) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const GAIN_TYPES = [
  { value: 'hard-savings', label: 'Hard Savings', description: 'Économies réelles, mesurables', color: 'bg-green-500' },
  { value: 'soft-savings', label: 'Soft Savings', description: 'Économies indirectes (qualité, temps)', color: 'bg-blue-500' },
  { value: 'cost-avoidance', label: 'Coûts Évités', description: 'Dépenses futures évitées', color: 'bg-purple-500' },
  { value: 'revenue-increase', label: 'Revenus Supplémentaires', description: 'Augmentation du CA', color: 'bg-orange-500' },
];

const CATEGORIES = [
  'Productivité',
  'Qualité',
  'Délais',
  'Stocks',
  'Énergie',
  'Main d\'œuvre',
  'Matières premières',
  'Maintenance',
  'Satisfaction client',
  'Autre',
];

const getDefaultData = (): GainsCalculationData => ({
  projectName: '',
  calculationDate: new Date().toISOString().split('T')[0],
  financialController: '',
  gains: [],
  additionalCosts: [],
  summary: {
    totalHardSavings: 0,
    totalSoftSavings: 0,
    totalCostAvoidance: 0,
    totalRevenueIncrease: 0,
    totalGross: 0,
    totalCosts: 0,
    totalNet: 0,
    roi: 0,
    paybackMonths: 0,
  },
  validationStatus: 'draft',
  validationComments: '',
  overallConclusion: '',
});

const GainsCalculationTemplate: React.FC<GainsCalculationTemplateProps> = ({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}) => {
  const [localData, setLocalData] = useState<GainsCalculationData>(() => {
    return (data && Object.keys(data).length > 0) ? { ...getDefaultData(), ...data } : getDefaultData();
  });

  const [editingGain, setEditingGain] = useState<string | null>(null);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLocalData({ ...getDefaultData(), ...data });
    }
  }, [data]);

  // Calculate summary whenever gains or costs change
  const calculatedSummary = useMemo(() => {
    const totalHardSavings = localData.gains
      .filter(g => g.gainType === 'hard-savings')
      .reduce((sum, g) => {
        const improvement = (g.achievedValue ?? 0) - (g.baselineValue ?? 0);
        const financialGain = Math.abs(improvement) * (g.financialValuePerUnit ?? 0) * (g.sustainabilityPeriod || 1);
        return sum + financialGain;
      }, 0);

    const totalSoftSavings = localData.gains
      .filter(g => g.gainType === 'soft-savings')
      .reduce((sum, g) => {
        const improvement = (g.achievedValue ?? 0) - (g.baselineValue ?? 0);
        const financialGain = Math.abs(improvement) * (g.financialValuePerUnit ?? 0) * (g.sustainabilityPeriod || 1);
        return sum + financialGain;
      }, 0);

    const totalCostAvoidance = localData.gains
      .filter(g => g.gainType === 'cost-avoidance')
      .reduce((sum, g) => {
        const improvement = (g.achievedValue ?? 0) - (g.baselineValue ?? 0);
        const financialGain = Math.abs(improvement) * (g.financialValuePerUnit ?? 0) * (g.sustainabilityPeriod || 1);
        return sum + financialGain;
      }, 0);

    const totalRevenueIncrease = localData.gains
      .filter(g => g.gainType === 'revenue-increase')
      .reduce((sum, g) => {
        const improvement = (g.achievedValue ?? 0) - (g.baselineValue ?? 0);
        const financialGain = Math.abs(improvement) * (g.financialValuePerUnit ?? 0) * (g.sustainabilityPeriod || 1);
        return sum + financialGain;
      }, 0);

    const totalGross = totalHardSavings + totalSoftSavings + totalCostAvoidance + totalRevenueIncrease;

    const totalCosts = localData.additionalCosts.reduce((sum, c) => {
      if (c.type === 'recurring') {
        const months = c.recurringPeriod === 'yearly' ? 12 : 1;
        return sum + (c.amount * months);
      }
      return sum + c.amount;
    }, 0);

    const totalNet = totalGross - totalCosts;
    const roi = totalCosts > 0 ? ((totalNet / totalCosts) * 100) : 0;
    const monthlyGain = totalGross / 12;
    const paybackMonths = monthlyGain > 0 ? totalCosts / monthlyGain : 0;

    return {
      totalHardSavings,
      totalSoftSavings,
      totalCostAvoidance,
      totalRevenueIncrease,
      totalGross,
      totalCosts,
      totalNet,
      roi,
      paybackMonths,
    };
  }, [localData.gains, localData.additionalCosts]);

  const updateData = (updates: Partial<GainsCalculationData>) => {
    const newData = { ...localData, ...updates, summary: calculatedSummary };
    setLocalData(newData);
    onChange(newData);
  };

  const addGain = () => {
    const newGain: GainItem = {
      id: Date.now().toString(),
      category: CATEGORIES[0],
      metricName: '',
      unit: '',
      baselineValue: null,
      targetValue: null,
      achievedValue: null,
      financialValuePerUnit: null,
      gainType: 'hard-savings',
      validatedBy: '',
      validationDate: '',
      evidenceSource: '',
      sustainabilityPeriod: 12,
      notes: '',
    };
    updateData({ gains: [...localData.gains, newGain] });
    setEditingGain(newGain.id);
  };

  const updateGain = (id: string, updates: Partial<GainItem>) => {
    const newGains = localData.gains.map(g =>
      g.id === id ? { ...g, ...updates } : g
    );
    updateData({ gains: newGains });
  };

  const deleteGain = (id: string) => {
    const newGains = localData.gains.filter(g => g.id !== id);
    updateData({ gains: newGains });
    setEditingGain(null);
  };

  const addCost = () => {
    const newCost = {
      id: Date.now().toString(),
      description: '',
      amount: 0,
      type: 'one-time' as const,
    };
    updateData({ additionalCosts: [...localData.additionalCosts, newCost] });
  };

  const updateCost = (id: string, updates: Partial<GainsCalculationData['additionalCosts'][0]>) => {
    const newCosts = localData.additionalCosts.map(c =>
      c.id === id ? { ...c, ...updates } : c
    );
    updateData({ additionalCosts: newCosts });
  };

  const deleteCost = (id: string) => {
    const newCosts = localData.additionalCosts.filter(c => c.id !== id);
    updateData({ additionalCosts: newCosts });
  };

  const getGainTypeConfig = (type: GainItem['gainType']) => {
    return GAIN_TYPES.find(t => t.value === type) || GAIN_TYPES[0];
  };

  const calculateGainAmount = (gain: GainItem) => {
    const improvement = (gain.achievedValue ?? 0) - (gain.baselineValue ?? 0);
    return Math.abs(improvement) * (gain.financialValuePerUnit ?? 0) * (gain.sustainabilityPeriod || 1);
  };

  const getTargetAchievement = (gain: GainItem) => {
    if (gain.baselineValue === null || gain.targetValue === null || gain.achievedValue === null) return null;
    const targetImprovement = Math.abs(gain.targetValue - gain.baselineValue);
    const achievedImprovement = Math.abs(gain.achievedValue - gain.baselineValue);
    if (targetImprovement === 0) return 100;
    return (achievedImprovement / targetImprovement) * 100;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getStatusColor = (status: GainsCalculationData['validationStatus']) => {
    switch (status) {
      case 'validated': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending-validation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {toolDefinition?.nameFr || 'Calcul des Gains Obtenus'}
        </h2>
        <p className="text-green-100">
          Documentez et validez les gains financiers réalisés grâce au projet DMAIC.
        </p>
      </div>

      {/* Summary Dashboard */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">💰</span>
          Synthèse des Gains
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(calculatedSummary.totalHardSavings)}</div>
            <div className="text-sm text-gray-600">Hard Savings</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(calculatedSummary.totalSoftSavings)}</div>
            <div className="text-sm text-gray-600">Soft Savings</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(calculatedSummary.totalCostAvoidance)}</div>
            <div className="text-sm text-gray-600">Coûts Évités</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(calculatedSummary.totalRevenueIncrease)}</div>
            <div className="text-sm text-gray-600">Revenus</div>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg text-center border-2 border-emerald-200">
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(calculatedSummary.totalGross)}</div>
            <div className="text-sm text-gray-600">Total Brut</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">-{formatCurrency(calculatedSummary.totalCosts)}</div>
            <div className="text-sm text-gray-600">Coûts Projet</div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg text-center border-2 border-green-300">
            <div className="text-2xl font-bold text-green-700">{formatCurrency(calculatedSummary.totalNet)}</div>
            <div className="text-sm text-gray-600">Gain Net</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{calculatedSummary.roi.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">ROI</div>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-indigo-600">{calculatedSummary.paybackMonths.toFixed(1)} mois</div>
            <div className="text-sm text-gray-600">Payback</div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du projet
            </label>
            <input
              type="text"
              value={localData.projectName}
              onChange={(e) => updateData({ projectName: e.target.value })}
              disabled={readOnly}
              placeholder="Projet DMAIC"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de calcul
            </label>
            <input
              type="date"
              value={localData.calculationDate}
              onChange={(e) => updateData({ calculationDate: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contrôleur financier
            </label>
            <input
              type="text"
              value={localData.financialController}
              onChange={(e) => updateData({ financialController: e.target.value })}
              disabled={readOnly}
              placeholder="Nom du validateur Finance"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Gains Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">📊</span>
            Détail des Gains
          </h3>
          {!readOnly && (
            <button
              onClick={addGain}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Ajouter Gain
            </button>
          )}
        </div>

        {localData.gains.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">💰</div>
            <p className="text-gray-500">Aucun gain documenté. Ajoutez les indicateurs améliorés.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {localData.gains.map((gain, index) => {
              const isEditing = editingGain === gain.id;
              const gainAmount = calculateGainAmount(gain);
              const achievement = getTargetAchievement(gain);
              const typeConfig = getGainTypeConfig(gain.gainType);

              return (
                <div
                  key={gain.id}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className={`flex items-center justify-between p-4 ${typeConfig.color} bg-opacity-10`}>
                    <div className="flex items-center gap-3">
                      <span className={`${typeConfig.color} text-white px-3 py-1 rounded-full text-sm`}>
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-semibold">{gain.metricName || 'Indicateur non défini'}</h4>
                        <span className="text-sm text-gray-600">{gain.category} • {typeConfig.label}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">{formatCurrency(gainAmount)}</div>
                        {achievement !== null && (
                          <div className={`text-sm ${achievement >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                            {achievement.toFixed(0)}% de l'objectif
                          </div>
                        )}
                      </div>
                      {!readOnly && (
                        <button
                          onClick={() => setEditingGain(isEditing ? null : gain.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {isEditing ? 'Réduire' : 'Modifier'}
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="p-4 bg-gray-50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Catégorie</label>
                          <select
                            value={gain.category}
                            onChange={(e) => updateGain(gain.id, { category: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nom de l'indicateur</label>
                          <input
                            type="text"
                            value={gain.metricName}
                            onChange={(e) => updateGain(gain.id, { metricName: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Ex: Temps de cycle"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Unité de mesure</label>
                          <input
                            type="text"
                            value={gain.unit}
                            onChange={(e) => updateGain(gain.id, { unit: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                            placeholder="Ex: heures, pièces, %"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Valeur Baseline</label>
                          <input
                            type="number"
                            value={gain.baselineValue ?? ''}
                            onChange={(e) => updateGain(gain.id, { baselineValue: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Valeur Cible</label>
                          <input
                            type="number"
                            value={gain.targetValue ?? ''}
                            onChange={(e) => updateGain(gain.id, { targetValue: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Valeur Atteinte</label>
                          <input
                            type="number"
                            value={gain.achievedValue ?? ''}
                            onChange={(e) => updateGain(gain.id, { achievedValue: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Valeur €/unité</label>
                          <input
                            type="number"
                            value={gain.financialValuePerUnit ?? ''}
                            onChange={(e) => updateGain(gain.id, { financialValuePerUnit: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Type de gain</label>
                          <select
                            value={gain.gainType}
                            onChange={(e) => updateGain(gain.id, { gainType: e.target.value as GainItem['gainType'] })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            {GAIN_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Période (mois)</label>
                          <input
                            type="number"
                            value={gain.sustainabilityPeriod}
                            onChange={(e) => updateGain(gain.id, { sustainabilityPeriod: parseInt(e.target.value) || 12 })}
                            min={1}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Validé par</label>
                          <input
                            type="text"
                            value={gain.validatedBy}
                            onChange={(e) => updateGain(gain.id, { validatedBy: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Date validation</label>
                          <input
                            type="date"
                            value={gain.validationDate}
                            onChange={(e) => updateGain(gain.id, { validationDate: e.target.value })}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Source de preuve</label>
                        <input
                          type="text"
                          value={gain.evidenceSource}
                          onChange={(e) => updateGain(gain.id, { evidenceSource: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                          placeholder="Système source, rapport, données..."
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <button
                          onClick={() => deleteGain(gain.id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          Supprimer
                        </button>
                        <button
                          onClick={() => setEditingGain(null)}
                          className="px-3 py-1 bg-green-600 text-white rounded"
                        >
                          Valider
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Additional Costs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">💸</span>
            Coûts du Projet
          </h3>
          {!readOnly && (
            <button
              onClick={addCost}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Ajouter Coût
            </button>
          )}
        </div>

        {localData.additionalCosts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucun coût enregistré.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {localData.additionalCosts.map(cost => (
              <div key={cost.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={cost.description}
                  onChange={(e) => updateCost(cost.id, { description: e.target.value })}
                  disabled={readOnly}
                  placeholder="Description du coût"
                  className="flex-1 px-2 py-1 border rounded text-sm"
                />
                <input
                  type="number"
                  value={cost.amount}
                  onChange={(e) => updateCost(cost.id, { amount: parseFloat(e.target.value) || 0 })}
                  disabled={readOnly}
                  className="w-32 px-2 py-1 border rounded text-sm text-right"
                />
                <select
                  value={cost.type}
                  onChange={(e) => updateCost(cost.id, { type: e.target.value as 'one-time' | 'recurring' })}
                  disabled={readOnly}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="one-time">Unique</option>
                  <option value="recurring">Récurrent</option>
                </select>
                {!readOnly && (
                  <button
                    onClick={() => deleteCost(cost.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Validation Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">✅</span>
          Validation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut de validation</label>
            <select
              value={localData.validationStatus}
              onChange={(e) => updateData({ validationStatus: e.target.value as GainsCalculationData['validationStatus'] })}
              disabled={readOnly}
              className={`w-full px-3 py-2 border rounded-lg ${getStatusColor(localData.validationStatus)}`}
            >
              <option value="draft">Brouillon</option>
              <option value="pending-validation">En attente de validation</option>
              <option value="validated">Validé par Finance</option>
              <option value="rejected">Rejeté</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Commentaires de validation</label>
          <textarea
            value={localData.validationComments}
            onChange={(e) => updateData({ validationComments: e.target.value })}
            disabled={readOnly}
            rows={3}
            placeholder="Commentaires du contrôleur financier..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Conclusion */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Conclusion
        </h3>
        <textarea
          value={localData.overallConclusion}
          onChange={(e) => updateData({ overallConclusion: e.target.value })}
          disabled={readOnly}
          rows={4}
          placeholder="Résumé des gains obtenus, comparaison avec les objectifs initiaux, recommandations..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* Help */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span>
          Types de Gains
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GAIN_TYPES.map(type => (
            <div key={type.value} className="flex items-start gap-3">
              <span className={`w-4 h-4 rounded mt-1 ${type.color}`} />
              <div>
                <div className="font-semibold">{type.label}</div>
                <div className="text-sm text-gray-600">{type.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GainsCalculationTemplate;

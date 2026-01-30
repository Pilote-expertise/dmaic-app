import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Info } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface SigmaMetrics {
  totalUnits: number;
  defectiveUnits: number;
  opportunitiesPerUnit: number;
  defects: number;
}

interface SixSigmaData {
  metricName: string;
  metricDescription: string;
  baseline: SigmaMetrics;
  target: SigmaMetrics;
  current: SigmaMetrics;
  defectDefinition: string;
  measurementMethod: string;
  dataSource: string;
  notes: string;
}

interface SixSigmaIndicatorsTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

// Sigma level lookup table
const sigmaTable: [number, number][] = [
  [0.00, 0.00], [1.00, 691462], [1.10, 655422], [1.20, 617911], [1.30, 579260],
  [1.40, 539828], [1.50, 500000], [1.60, 460172], [1.70, 420740], [1.80, 382089],
  [1.90, 344578], [2.00, 308538], [2.10, 274253], [2.20, 241964], [2.30, 211855],
  [2.40, 184060], [2.50, 158655], [2.60, 135666], [2.70, 115070], [2.80, 96801],
  [2.90, 80757], [3.00, 66807], [3.10, 54799], [3.20, 44565], [3.30, 35930],
  [3.40, 28716], [3.50, 22750], [3.60, 17864], [3.70, 13903], [3.80, 10724],
  [3.90, 8198], [4.00, 6210], [4.10, 4661], [4.20, 3467], [4.30, 2555],
  [4.40, 1866], [4.50, 1350], [4.60, 968], [4.70, 687], [4.80, 483],
  [4.90, 337], [5.00, 233], [5.10, 159], [5.20, 108], [5.30, 72],
  [5.40, 48], [5.50, 32], [5.60, 21], [5.70, 13], [5.80, 9],
  [5.90, 5], [6.00, 3.4],
];

const dpmoToSigma = (dpmo: number): number => {
  if (dpmo <= 0) return 6.0;
  if (dpmo >= 691462) return 1.0;

  for (let i = sigmaTable.length - 1; i >= 0; i--) {
    if (dpmo <= sigmaTable[i][1]) {
      return sigmaTable[i][0];
    }
  }
  return 1.0;
};

const calculateMetrics = (data: SigmaMetrics) => {
  const totalOpportunities = data.totalUnits * data.opportunitiesPerUnit;
  const defects = data.defects || data.defectiveUnits;
  const dpmo = totalOpportunities > 0 ? (defects / totalOpportunities) * 1000000 : 0;
  const sigmaLevel = dpmoToSigma(dpmo);
  const yieldRate = 100 - (dpmo / 10000);
  const defectRate = totalOpportunities > 0 ? (defects / totalOpportunities) * 100 : 0;
  const dpu = data.totalUnits > 0 ? defects / data.totalUnits : 0;

  return {
    totalOpportunities,
    dpmo: Math.round(dpmo),
    sigmaLevel: Math.round(sigmaLevel * 100) / 100,
    yieldRate: Math.round(yieldRate * 100) / 100,
    defectRate: Math.round(defectRate * 1000) / 1000,
    dpu: Math.round(dpu * 1000) / 1000,
  };
};

const getSigmaColor = (sigma: number): string => {
  if (sigma >= 4.5) return 'text-measure';
  if (sigma >= 3.5) return 'text-improve';
  if (sigma >= 2.5) return 'text-analyze';
  return 'text-control';
};

const getSigmaBgColor = (sigma: number): string => {
  if (sigma >= 4.5) return 'bg-measure-light';
  if (sigma >= 3.5) return 'bg-improve-light';
  if (sigma >= 2.5) return 'bg-analyze-light';
  return 'bg-control-light';
};

export default function SixSigmaIndicatorsTemplate({
  data,
  onChange,
  readOnly = false,
}: SixSigmaIndicatorsTemplateProps) {
  const emptyMetrics: SigmaMetrics = {
    totalUnits: 0,
    defectiveUnits: 0,
    opportunitiesPerUnit: 1,
    defects: 0,
  };

  const [sigmaData, setSigmaData] = useState<SixSigmaData>({
    metricName: data.metricName || '',
    metricDescription: data.metricDescription || '',
    baseline: data.baseline || { ...emptyMetrics },
    target: data.target || { ...emptyMetrics, totalUnits: 1000, opportunitiesPerUnit: 1 },
    current: data.current || { ...emptyMetrics },
    defectDefinition: data.defectDefinition || '',
    measurementMethod: data.measurementMethod || '',
    dataSource: data.dataSource || '',
    notes: data.notes || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setSigmaData({
        metricName: data.metricName || '',
        metricDescription: data.metricDescription || '',
        baseline: data.baseline || { ...emptyMetrics },
        target: data.target || { ...emptyMetrics },
        current: data.current || { ...emptyMetrics },
        defectDefinition: data.defectDefinition || '',
        measurementMethod: data.measurementMethod || '',
        dataSource: data.dataSource || '',
        notes: data.notes || '',
      });
    }
  }, [data]);

  const updateData = (newData: SixSigmaData) => {
    setSigmaData(newData);
    onChange(newData);
  };

  const updateMetrics = (type: 'baseline' | 'target' | 'current', field: keyof SigmaMetrics, value: number) => {
    updateData({
      ...sigmaData,
      [type]: { ...sigmaData[type], [field]: value },
    });
  };

  const baselineMetrics = calculateMetrics(sigmaData.baseline);
  const targetMetrics = calculateMetrics(sigmaData.target);
  const currentMetrics = calculateMetrics(sigmaData.current);

  const improvement = baselineMetrics.sigmaLevel > 0
    ? ((currentMetrics.sigmaLevel - baselineMetrics.sigmaLevel) / baselineMetrics.sigmaLevel) * 100
    : 0;

  const targetGap = targetMetrics.sigmaLevel - currentMetrics.sigmaLevel;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-define flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Indicateurs Six Sigma</h2>
            <p className="text-sm text-gray-500">
              Mesure de la performance processus en niveau Sigma
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de l'indicateur</label>
            <input
              type="text"
              value={sigmaData.metricName}
              onChange={(e) => updateData({ ...sigmaData, metricName: e.target.value })}
              placeholder="Ex: Taux de défauts ligne de production"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Définition d'un défaut</label>
            <input
              type="text"
              value={sigmaData.defectDefinition}
              onChange={(e) => updateData({ ...sigmaData, defectDefinition: e.target.value })}
              placeholder="Ex: Pièce hors spécification"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Description de l'indicateur</label>
          <textarea
            value={sigmaData.metricDescription}
            onChange={(e) => updateData({ ...sigmaData, metricDescription: e.target.value })}
            placeholder="Décrivez ce que mesure cet indicateur..."
            className="input min-h-[80px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Formules Six Sigma</p>
            <ul className="space-y-1 text-blue-700">
              <li><strong>DPMO</strong> = (Défauts / Opportunités totales) × 1 000 000</li>
              <li><strong>Opportunités totales</strong> = Unités × Opportunités par unité</li>
              <li><strong>Rendement (Yield)</strong> = 100 - (DPMO / 10 000)</li>
              <li><strong>DPU</strong> = Défauts / Unités (Défauts par Unité)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Sigma Dashboard */}
      <div className="grid grid-cols-3 gap-4">
        {/* Baseline */}
        <div className="card overflow-hidden">
          <div className="p-4 bg-gray-100 border-b">
            <h3 className="font-semibold text-gray-700 text-center">Baseline (État initial)</h3>
          </div>
          <div className="p-4">
            <div className={cn(
              'text-center p-6 rounded-xl mb-4',
              getSigmaBgColor(baselineMetrics.sigmaLevel)
            )}>
              <div className={cn('text-4xl font-bold', getSigmaColor(baselineMetrics.sigmaLevel))}>
                {baselineMetrics.sigmaLevel}σ
              </div>
              <div className="text-sm text-gray-500 mt-1">Niveau Sigma</div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500">Unités analysées</label>
                <input
                  type="number"
                  value={sigmaData.baseline.totalUnits || ''}
                  onChange={(e) => updateMetrics('baseline', 'totalUnits', parseFloat(e.target.value) || 0)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="text-gray-500">Opportunités par unité</label>
                <input
                  type="number"
                  value={sigmaData.baseline.opportunitiesPerUnit || ''}
                  onChange={(e) => updateMetrics('baseline', 'opportunitiesPerUnit', parseFloat(e.target.value) || 1)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="text-gray-500">Nombre de défauts</label>
                <input
                  type="number"
                  value={sigmaData.baseline.defects || ''}
                  onChange={(e) => updateMetrics('baseline', 'defects', parseFloat(e.target.value) || 0)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">DPMO</span>
                <span className="font-medium">{baselineMetrics.dpmo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rendement</span>
                <span className="font-medium">{baselineMetrics.yieldRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taux de défaut</span>
                <span className="font-medium">{baselineMetrics.defectRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DPU</span>
                <span className="font-medium">{baselineMetrics.dpu}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Current */}
        <div className="card overflow-hidden ring-2 ring-define">
          <div className="p-4 bg-define text-white border-b">
            <h3 className="font-semibold text-center">Actuel</h3>
          </div>
          <div className="p-4">
            <div className={cn(
              'text-center p-6 rounded-xl mb-4',
              getSigmaBgColor(currentMetrics.sigmaLevel)
            )}>
              <div className={cn('text-4xl font-bold', getSigmaColor(currentMetrics.sigmaLevel))}>
                {currentMetrics.sigmaLevel}σ
              </div>
              <div className="text-sm text-gray-500 mt-1">Niveau Sigma</div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500">Unités analysées</label>
                <input
                  type="number"
                  value={sigmaData.current.totalUnits || ''}
                  onChange={(e) => updateMetrics('current', 'totalUnits', parseFloat(e.target.value) || 0)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="text-gray-500">Opportunités par unité</label>
                <input
                  type="number"
                  value={sigmaData.current.opportunitiesPerUnit || ''}
                  onChange={(e) => updateMetrics('current', 'opportunitiesPerUnit', parseFloat(e.target.value) || 1)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="text-gray-500">Nombre de défauts</label>
                <input
                  type="number"
                  value={sigmaData.current.defects || ''}
                  onChange={(e) => updateMetrics('current', 'defects', parseFloat(e.target.value) || 0)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">DPMO</span>
                <span className="font-medium">{currentMetrics.dpmo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rendement</span>
                <span className="font-medium">{currentMetrics.yieldRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taux de défaut</span>
                <span className="font-medium">{currentMetrics.defectRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DPU</span>
                <span className="font-medium">{currentMetrics.dpu}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Target */}
        <div className="card overflow-hidden">
          <div className="p-4 bg-measure text-white border-b">
            <h3 className="font-semibold text-center">Cible</h3>
          </div>
          <div className="p-4">
            <div className={cn(
              'text-center p-6 rounded-xl mb-4',
              getSigmaBgColor(targetMetrics.sigmaLevel)
            )}>
              <div className={cn('text-4xl font-bold', getSigmaColor(targetMetrics.sigmaLevel))}>
                {targetMetrics.sigmaLevel}σ
              </div>
              <div className="text-sm text-gray-500 mt-1">Niveau Sigma</div>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-gray-500">Unités prévues</label>
                <input
                  type="number"
                  value={sigmaData.target.totalUnits || ''}
                  onChange={(e) => updateMetrics('target', 'totalUnits', parseFloat(e.target.value) || 0)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="text-gray-500">Opportunités par unité</label>
                <input
                  type="number"
                  value={sigmaData.target.opportunitiesPerUnit || ''}
                  onChange={(e) => updateMetrics('target', 'opportunitiesPerUnit', parseFloat(e.target.value) || 1)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
              <div>
                <label className="text-gray-500">Défauts max acceptés</label>
                <input
                  type="number"
                  value={sigmaData.target.defects || ''}
                  onChange={(e) => updateMetrics('target', 'defects', parseFloat(e.target.value) || 0)}
                  className="input mt-1"
                  disabled={readOnly}
                />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">DPMO cible</span>
                <span className="font-medium">{targetMetrics.dpmo.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Rendement cible</span>
                <span className="font-medium">{targetMetrics.yieldRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Taux de défaut cible</span>
                <span className="font-medium">{targetMetrics.defectRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DPU cible</span>
                <span className="font-medium">{targetMetrics.dpu}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Gap Analysis */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          Analyse de progression
        </h3>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Amélioration vs Baseline</div>
            <div className={cn(
              'text-3xl font-bold',
              improvement >= 0 ? 'text-measure' : 'text-control'
            )}>
              {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-400">
              {(currentMetrics.sigmaLevel - baselineMetrics.sigmaLevel).toFixed(2)}σ
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Écart vs Cible</div>
            <div className={cn(
              'text-3xl font-bold',
              targetGap <= 0 ? 'text-measure' : 'text-analyze'
            )}>
              {targetGap <= 0 ? '✓' : `-${targetGap.toFixed(2)}σ`}
            </div>
            <div className="text-sm text-gray-400">
              {targetGap <= 0 ? 'Objectif atteint !' : 'À atteindre'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">Réduction DPMO</div>
            <div className={cn(
              'text-3xl font-bold',
              baselineMetrics.dpmo - currentMetrics.dpmo >= 0 ? 'text-measure' : 'text-control'
            )}>
              {(baselineMetrics.dpmo - currentMetrics.dpmo).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">
              défauts/million en moins
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Baseline ({baselineMetrics.sigmaLevel}σ)</span>
            <span>Actuel ({currentMetrics.sigmaLevel}σ)</span>
            <span>Cible ({targetMetrics.sigmaLevel}σ)</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden relative">
            {/* Target marker */}
            <div
              className="absolute h-full w-1 bg-measure z-10"
              style={{ left: `${Math.min((targetMetrics.sigmaLevel / 6) * 100, 100)}%` }}
            />
            {/* Current progress */}
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                currentMetrics.sigmaLevel >= targetMetrics.sigmaLevel ? 'bg-measure' :
                currentMetrics.sigmaLevel >= baselineMetrics.sigmaLevel ? 'bg-improve' : 'bg-control'
              )}
              style={{ width: `${Math.min((currentMetrics.sigmaLevel / 6) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1σ</span>
            <span>2σ</span>
            <span>3σ</span>
            <span>4σ</span>
            <span>5σ</span>
            <span>6σ</span>
          </div>
        </div>
      </div>

      {/* Sigma Level Reference */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Référentiel Niveau Sigma</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Niveau Sigma</th>
                <th className="px-4 py-2 text-right">DPMO</th>
                <th className="px-4 py-2 text-right">Rendement</th>
                <th className="px-4 py-2 text-left">Qualité</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sigma: 2, dpmo: 308538, yield: 69.1, quality: 'Non compétitif' },
                { sigma: 3, dpmo: 66807, yield: 93.3, quality: 'Moyenne industrie' },
                { sigma: 4, dpmo: 6210, yield: 99.38, quality: 'Bon' },
                { sigma: 5, dpmo: 233, yield: 99.977, quality: 'Excellent' },
                { sigma: 6, dpmo: 3.4, yield: 99.99966, quality: 'World Class' },
              ].map((row) => (
                <tr key={row.sigma} className={cn(
                  'border-t',
                  Math.floor(currentMetrics.sigmaLevel) === row.sigma && 'bg-define-light'
                )}>
                  <td className="px-4 py-2 font-medium">{row.sigma}σ</td>
                  <td className="px-4 py-2 text-right">{row.dpmo.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{row.yield}%</td>
                  <td className="px-4 py-2">{row.quality}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Measurement Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Méthode de mesure</label>
          <textarea
            value={sigmaData.measurementMethod}
            onChange={(e) => updateData({ ...sigmaData, measurementMethod: e.target.value })}
            placeholder="Décrivez comment les données sont collectées et mesurées..."
            className="input min-h-[100px] resize-none"
            disabled={readOnly}
          />
        </div>
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Source des données</label>
          <textarea
            value={sigmaData.dataSource}
            onChange={(e) => updateData({ ...sigmaData, dataSource: e.target.value })}
            placeholder="Système de collecte, période, fréquence..."
            className="input min-h-[100px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Notes et observations</label>
        <textarea
          value={sigmaData.notes}
          onChange={(e) => updateData({ ...sigmaData, notes: e.target.value })}
          placeholder="Observations, hypothèses, points d'attention..."
          className="input min-h-[100px] resize-none"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

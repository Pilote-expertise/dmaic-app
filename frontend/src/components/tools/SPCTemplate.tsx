import { useState, useEffect, useMemo } from 'react';
import { LineChart, Info, Plus, Trash2, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface Measurement {
  id: string;
  timestamp: string;
  subgroup: number;
  values: number[];
}

interface SPCData {
  processName: string;
  characteristic: string;
  unit: string;
  chartType: 'xbar_r' | 'xbar_s' | 'imr' | 'p' | 'np' | 'c' | 'u';
  subgroupSize: number;
  measurements: Measurement[];
  customLimits: {
    enabled: boolean;
    ucl: number | null;
    centerLine: number | null;
    lcl: number | null;
  };
  specLimits: {
    usl: number | null;
    target: number | null;
    lsl: number | null;
  };
  controlRules: {
    rule1: boolean; // Point beyond 3 sigma
    rule2: boolean; // 9 points on same side
    rule3: boolean; // 6 points increasing/decreasing
    rule4: boolean; // 14 points alternating
    rule5: boolean; // 2 of 3 beyond 2 sigma
    rule6: boolean; // 4 of 5 beyond 1 sigma
    rule7: boolean; // 15 points within 1 sigma
    rule8: boolean; // 8 points beyond 1 sigma
  };
  notes: string;
}

interface SPCTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const chartTypeOptions = [
  { value: 'xbar_r', label: 'X-bar / R', description: 'Moyenne et étendue (sous-groupes 2-10)' },
  { value: 'xbar_s', label: 'X-bar / S', description: 'Moyenne et écart-type (sous-groupes > 10)' },
  { value: 'imr', label: 'I-MR', description: 'Individuel - Étendue mobile (n=1)' },
  { value: 'p', label: 'Carte p', description: 'Proportion de non-conformes' },
  { value: 'np', label: 'Carte np', description: 'Nombre de non-conformes' },
  { value: 'c', label: 'Carte c', description: 'Nombre de défauts' },
  { value: 'u', label: 'Carte u', description: 'Défauts par unité' },
];

// d2 constants for R chart
const d2Table: Record<number, number> = {
  2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534,
  7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078
};

// D3 and D4 constants for R chart control limits
const d3Table: Record<number, number> = {
  2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223
};

const d4Table: Record<number, number> = {
  2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004,
  7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777
};

// A2 constant for X-bar chart control limits
const a2Table: Record<number, number> = {
  2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483,
  7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308
};

const createEmptyMeasurement = (subgroup: number, subgroupSize: number): Measurement => ({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString().split('T')[0],
  subgroup,
  values: Array(subgroupSize).fill(0),
});

// Calculate statistics
const calculateStats = (measurements: Measurement[], _chartType: string, subgroupSize: number) => {
  if (measurements.length < 2) return null;

  const allValues = measurements.flatMap(m => m.values.filter(v => v !== null && v !== undefined));
  if (allValues.length === 0) return null;

  // X-bar and R calculations
  const subgroupMeans = measurements.map(m => {
    const validValues = m.values.filter(v => v !== null && v !== undefined);
    return validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
  });

  const subgroupRanges = measurements.map(m => {
    const validValues = m.values.filter(v => v !== null && v !== undefined);
    return validValues.length > 0 ? Math.max(...validValues) - Math.min(...validValues) : 0;
  });

  const xBar = subgroupMeans.reduce((a, b) => a + b, 0) / subgroupMeans.length;
  const rBar = subgroupRanges.reduce((a, b) => a + b, 0) / subgroupRanges.length;

  const d2 = d2Table[subgroupSize] || 2.326;
  const d3 = d3Table[subgroupSize] || 0;
  const d4 = d4Table[subgroupSize] || 2.114;
  const a2 = a2Table[subgroupSize] || 0.577;

  const sigma = rBar / d2;

  // X-bar chart limits
  const xBarUCL = xBar + a2 * rBar;
  const xBarLCL = xBar - a2 * rBar;

  // R chart limits
  const rUCL = d4 * rBar;
  const rLCL = d3 * rBar;

  // Detect out of control points
  const outOfControlX = subgroupMeans.map((mean, idx) => ({
    index: idx,
    value: mean,
    outOfControl: mean > xBarUCL || mean < xBarLCL,
    type: mean > xBarUCL ? 'above' : mean < xBarLCL ? 'below' : 'ok'
  }));

  const outOfControlR = subgroupRanges.map((range, idx) => ({
    index: idx,
    value: range,
    outOfControl: range > rUCL || range < rLCL,
    type: range > rUCL ? 'above' : range < rLCL ? 'below' : 'ok'
  }));

  return {
    xBar: Math.round(xBar * 10000) / 10000,
    rBar: Math.round(rBar * 10000) / 10000,
    sigma: Math.round(sigma * 10000) / 10000,
    xBarUCL: Math.round(xBarUCL * 10000) / 10000,
    xBarLCL: Math.round(xBarLCL * 10000) / 10000,
    rUCL: Math.round(rUCL * 10000) / 10000,
    rLCL: Math.round(rLCL * 10000) / 10000,
    subgroupMeans,
    subgroupRanges,
    outOfControlX,
    outOfControlR,
    totalPoints: measurements.length,
    outOfControlCount: outOfControlX.filter(p => p.outOfControl).length + outOfControlR.filter(p => p.outOfControl).length,
  };
};

export default function SPCTemplate({
  data,
  onChange,
  readOnly = false,
}: SPCTemplateProps) {
  const [spcData, setSpcData] = useState<SPCData>({
    processName: data.processName || '',
    characteristic: data.characteristic || '',
    unit: data.unit || '',
    chartType: data.chartType || 'xbar_r',
    subgroupSize: data.subgroupSize || 5,
    measurements: data.measurements || [],
    customLimits: data.customLimits || {
      enabled: false,
      ucl: null,
      centerLine: null,
      lcl: null,
    },
    specLimits: data.specLimits || {
      usl: null,
      target: null,
      lsl: null,
    },
    controlRules: data.controlRules || {
      rule1: true, rule2: true, rule3: true, rule4: true,
      rule5: true, rule6: true, rule7: false, rule8: false,
    },
    notes: data.notes || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setSpcData({
        processName: data.processName || '',
        characteristic: data.characteristic || '',
        unit: data.unit || '',
        chartType: data.chartType || 'xbar_r',
        subgroupSize: data.subgroupSize || 5,
        measurements: data.measurements || [],
        customLimits: data.customLimits || {
          enabled: false, ucl: null, centerLine: null, lcl: null,
        },
        specLimits: data.specLimits || {
          usl: null, target: null, lsl: null,
        },
        controlRules: data.controlRules || {
          rule1: true, rule2: true, rule3: true, rule4: true,
          rule5: true, rule6: true, rule7: false, rule8: false,
        },
        notes: data.notes || '',
      });
    }
  }, [data]);

  const updateData = (newData: SPCData) => {
    setSpcData(newData);
    onChange(newData);
  };

  const addMeasurement = () => {
    const nextSubgroup = spcData.measurements.length + 1;
    updateData({
      ...spcData,
      measurements: [...spcData.measurements, createEmptyMeasurement(nextSubgroup, spcData.subgroupSize)],
    });
  };

  const removeMeasurement = (id: string) => {
    updateData({
      ...spcData,
      measurements: spcData.measurements
        .filter(m => m.id !== id)
        .map((m, idx) => ({ ...m, subgroup: idx + 1 })),
    });
  };

  const updateMeasurementValue = (id: string, valueIndex: number, value: number) => {
    updateData({
      ...spcData,
      measurements: spcData.measurements.map(m =>
        m.id === id
          ? { ...m, values: m.values.map((v, i) => i === valueIndex ? value : v) }
          : m
      ),
    });
  };

  const updateMeasurementDate = (id: string, timestamp: string) => {
    updateData({
      ...spcData,
      measurements: spcData.measurements.map(m =>
        m.id === id ? { ...m, timestamp } : m
      ),
    });
  };

  // Calculate control chart statistics
  const stats = useMemo(() => {
    return calculateStats(spcData.measurements, spcData.chartType, spcData.subgroupSize);
  }, [spcData.measurements, spcData.chartType, spcData.subgroupSize]);

  const isInControl = stats ? stats.outOfControlCount === 0 : true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-control flex items-center justify-center">
            <LineChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Maîtrise Statistique des Procédés (SPC)</h2>
            <p className="text-sm text-gray-500">
              Cartes de contrôle pour le suivi processus
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du processus</label>
            <input
              type="text"
              value={spcData.processName}
              onChange={(e) => updateData({ ...spcData, processName: e.target.value })}
              placeholder="Ex: Ligne d'assemblage A"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Caractéristique mesurée</label>
            <input
              type="text"
              value={spcData.characteristic}
              onChange={(e) => updateData({ ...spcData, characteristic: e.target.value })}
              placeholder="Ex: Couple de serrage"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type de carte</label>
            <select
              value={spcData.chartType}
              onChange={(e) => updateData({ ...spcData, chartType: e.target.value as any })}
              className="input"
              disabled={readOnly}
            >
              {chartTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Taille sous-groupe</label>
            <select
              value={spcData.subgroupSize}
              onChange={(e) => updateData({ ...spcData, subgroupSize: parseInt(e.target.value), measurements: [] })}
              className="input"
              disabled={readOnly || spcData.measurements.length > 0}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unité</label>
            <input
              type="text"
              value={spcData.unit}
              onChange={(e) => updateData({ ...spcData, unit: e.target.value })}
              placeholder="Ex: Nm"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">
              {chartTypeOptions.find(c => c.value === spcData.chartType)?.label}
            </p>
            <p className="text-blue-700">
              {chartTypeOptions.find(c => c.value === spcData.chartType)?.description}
            </p>
            <ul className="mt-2 space-y-1 text-blue-700">
              <li><strong>UCL</strong> = Limite de contrôle supérieure (X̄ + A₂R̄)</li>
              <li><strong>LCL</strong> = Limite de contrôle inférieure (X̄ - A₂R̄)</li>
              <li><strong>CL</strong> = Ligne centrale (X̄)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Process Status */}
      {stats && (
        <div className={cn(
          'card p-6 border-2',
          isInControl
            ? 'border-improve/30 bg-improve-light/20'
            : 'border-control/30 bg-control-light/20'
        )}>
          <div className="flex items-center gap-4">
            {isInControl ? (
              <CheckCircle2 className="w-12 h-12 text-improve" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-control" />
            )}
            <div>
              <h3 className="text-xl font-bold">
                {isInControl ? 'Processus sous contrôle' : 'Processus hors contrôle'}
              </h3>
              <p className="text-gray-600">
                {isInControl
                  ? 'Aucun point hors limites détecté. Le processus est stable.'
                  : `${stats.outOfControlCount} point(s) hors limites de contrôle détecté(s).`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Control Limits Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="text-sm text-gray-500">X̄ (Moyenne)</div>
            <div className="text-2xl font-bold text-define">{stats.xBar}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-sm text-gray-500">R̄ (Étendue)</div>
            <div className="text-2xl font-bold">{stats.rBar}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-sm text-gray-500">σ estimé</div>
            <div className="text-2xl font-bold">{stats.sigma}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-sm text-gray-500">Points analysés</div>
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
          </div>
        </div>
      )}

      {/* X-bar Chart Visual */}
      {stats && stats.subgroupMeans.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-define" />
            Carte X̄ (Moyenne)
          </h3>

          {/* Control limits info */}
          <div className="grid grid-cols-3 gap-4 mb-4 text-center text-sm">
            <div className="bg-control-light rounded-lg p-2">
              <span className="text-gray-500">UCL:</span>
              <span className="font-bold ml-2">{stats.xBarUCL}</span>
            </div>
            <div className="bg-define-light rounded-lg p-2">
              <span className="text-gray-500">CL (X̄):</span>
              <span className="font-bold ml-2">{stats.xBar}</span>
            </div>
            <div className="bg-control-light rounded-lg p-2">
              <span className="text-gray-500">LCL:</span>
              <span className="font-bold ml-2">{stats.xBarLCL}</span>
            </div>
          </div>

          {/* Simple chart visualization */}
          <div className="relative h-48 bg-gray-50 rounded-lg overflow-hidden p-4">
            {/* UCL line */}
            <div className="absolute left-4 right-4 h-0.5 bg-control border-dashed" style={{ top: '15%' }}>
              <span className="absolute right-0 -top-4 text-xs text-control">UCL</span>
            </div>
            {/* Center line */}
            <div className="absolute left-4 right-4 h-0.5 bg-define" style={{ top: '50%' }}>
              <span className="absolute right-0 -top-4 text-xs text-define">CL</span>
            </div>
            {/* LCL line */}
            <div className="absolute left-4 right-4 h-0.5 bg-control border-dashed" style={{ top: '85%' }}>
              <span className="absolute right-0 -top-4 text-xs text-control">LCL</span>
            </div>

            {/* Data points */}
            <div className="absolute inset-4 flex items-center">
              <div className="flex-1 flex justify-between items-end">
                {stats.outOfControlX.map((point, idx) => {
                  const range = stats.xBarUCL - stats.xBarLCL;
                  const normalizedY = range > 0
                    ? ((point.value - stats.xBarLCL) / range) * 70 + 15
                    : 50;
                  const clampedY = Math.max(5, Math.min(95, normalizedY));

                  return (
                    <div
                      key={idx}
                      className="relative"
                      style={{ height: '100%' }}
                    >
                      <div
                        className={cn(
                          'absolute w-3 h-3 rounded-full border-2 border-white shadow transform -translate-x-1/2',
                          point.outOfControl ? 'bg-control' : 'bg-define'
                        )}
                        style={{ bottom: `${clampedY}%`, left: '50%' }}
                        title={`Sous-groupe ${idx + 1}: ${point.value.toFixed(3)}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Out of control points list */}
          {stats.outOfControlX.filter(p => p.outOfControl).length > 0 && (
            <div className="mt-4 p-3 bg-control-light/20 rounded-lg border border-control/20">
              <h4 className="text-sm font-medium text-control mb-2">Points hors contrôle (X̄)</h4>
              <div className="flex flex-wrap gap-2">
                {stats.outOfControlX.filter(p => p.outOfControl).map(p => (
                  <span
                    key={p.index}
                    className="px-2 py-1 bg-white rounded text-xs border border-control"
                  >
                    #{p.index + 1}: {p.value.toFixed(3)} ({p.type === 'above' ? '↑' : '↓'})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* R Chart Visual */}
      {stats && stats.subgroupRanges.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Carte R (Étendue)</h3>

          <div className="grid grid-cols-3 gap-4 mb-4 text-center text-sm">
            <div className="bg-control-light rounded-lg p-2">
              <span className="text-gray-500">UCL:</span>
              <span className="font-bold ml-2">{stats.rUCL}</span>
            </div>
            <div className="bg-define-light rounded-lg p-2">
              <span className="text-gray-500">CL (R̄):</span>
              <span className="font-bold ml-2">{stats.rBar}</span>
            </div>
            <div className="bg-control-light rounded-lg p-2">
              <span className="text-gray-500">LCL:</span>
              <span className="font-bold ml-2">{stats.rLCL}</span>
            </div>
          </div>

          {/* Simple R chart visualization */}
          <div className="relative h-32 bg-gray-50 rounded-lg overflow-hidden p-4">
            <div className="absolute left-4 right-4 h-0.5 bg-control border-dashed" style={{ top: '10%' }} />
            <div className="absolute left-4 right-4 h-0.5 bg-define" style={{ top: '50%' }} />
            <div className="absolute left-4 right-4 h-0.5 bg-control border-dashed" style={{ top: '90%' }} />

            <div className="absolute inset-4 flex items-center">
              <div className="flex-1 flex justify-between items-end">
                {stats.outOfControlR.map((point, idx) => {
                  const range = stats.rUCL - stats.rLCL;
                  const normalizedY = range > 0
                    ? ((point.value - stats.rLCL) / range) * 80 + 10
                    : 50;
                  const clampedY = Math.max(5, Math.min(95, normalizedY));

                  return (
                    <div
                      key={idx}
                      className="relative"
                      style={{ height: '100%' }}
                    >
                      <div
                        className={cn(
                          'absolute w-2 h-2 rounded-full border border-white shadow transform -translate-x-1/2',
                          point.outOfControl ? 'bg-control' : 'bg-analyze'
                        )}
                        style={{ bottom: `${clampedY}%`, left: '50%' }}
                        title={`Sous-groupe ${idx + 1}: ${point.value.toFixed(3)}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Entry */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-control text-white flex items-center justify-between">
          <h3 className="font-semibold">Données de mesure</h3>
          <span className="text-sm">{spcData.measurements.length} sous-groupes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-center">#</th>
                <th className="px-3 py-2 text-center">Date</th>
                {Array.from({ length: spcData.subgroupSize }, (_, i) => (
                  <th key={i} className="px-3 py-2 text-center">X{i + 1}</th>
                ))}
                {stats && (
                  <>
                    <th className="px-3 py-2 text-center bg-define-light">X̄</th>
                    <th className="px-3 py-2 text-center bg-analyze-light">R</th>
                  </>
                )}
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {spcData.measurements.map((measurement, mIdx) => {
                const mean = stats?.subgroupMeans[mIdx];
                const range = stats?.subgroupRanges[mIdx];
                const isOutX = stats?.outOfControlX[mIdx]?.outOfControl;
                const isOutR = stats?.outOfControlR[mIdx]?.outOfControl;

                return (
                  <tr key={measurement.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center font-medium">{measurement.subgroup}</td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={measurement.timestamp}
                        onChange={(e) => updateMeasurementDate(measurement.id, e.target.value)}
                        className="input text-sm w-32"
                        disabled={readOnly}
                      />
                    </td>
                    {measurement.values.map((value, vIdx) => (
                      <td key={vIdx} className="px-3 py-2">
                        <input
                          type="number"
                          step="any"
                          value={value || ''}
                          onChange={(e) => updateMeasurementValue(
                            measurement.id,
                            vIdx,
                            parseFloat(e.target.value) || 0
                          )}
                          className="input text-sm text-center w-16"
                          disabled={readOnly}
                        />
                      </td>
                    ))}
                    {stats && (
                      <>
                        <td className={cn(
                          'px-3 py-2 text-center font-mono text-sm',
                          isOutX ? 'bg-control-light text-control font-bold' : 'bg-define-light'
                        )}>
                          {mean?.toFixed(3)}
                        </td>
                        <td className={cn(
                          'px-3 py-2 text-center font-mono text-sm',
                          isOutR ? 'bg-control-light text-control font-bold' : 'bg-analyze-light'
                        )}>
                          {range?.toFixed(3)}
                        </td>
                      </>
                    )}
                    <td className="px-3 py-2">
                      {!readOnly && (
                        <button
                          onClick={() => removeMeasurement(measurement.id)}
                          className="p-1 text-gray-400 hover:text-control"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!readOnly && (
          <div className="p-4 border-t bg-gray-50">
            <button onClick={addMeasurement} className="btn btn-secondary w-full">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un sous-groupe
            </button>
          </div>
        )}
      </div>

      {/* Western Electric Rules */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Règles de détection (Western Electric)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { key: 'rule1', label: 'Règle 1', desc: '1 point au-delà de 3σ' },
            { key: 'rule2', label: 'Règle 2', desc: '9 points consécutifs du même côté' },
            { key: 'rule3', label: 'Règle 3', desc: '6 points croissants ou décroissants' },
            { key: 'rule4', label: 'Règle 4', desc: '14 points alternant haut/bas' },
            { key: 'rule5', label: 'Règle 5', desc: '2 sur 3 au-delà de 2σ' },
            { key: 'rule6', label: 'Règle 6', desc: '4 sur 5 au-delà de 1σ' },
            { key: 'rule7', label: 'Règle 7', desc: '15 points dans ±1σ (stratification)' },
            { key: 'rule8', label: 'Règle 8', desc: '8 points au-delà de 1σ (mélange)' },
          ].map(rule => (
            <label
              key={rule.key}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer',
                spcData.controlRules[rule.key as keyof typeof spcData.controlRules]
                  ? 'border-define bg-define-light/30'
                  : 'border-gray-200'
              )}
            >
              <input
                type="checkbox"
                checked={spcData.controlRules[rule.key as keyof typeof spcData.controlRules]}
                onChange={(e) => updateData({
                  ...spcData,
                  controlRules: { ...spcData.controlRules, [rule.key]: e.target.checked }
                })}
                className="rounded"
                disabled={readOnly}
              />
              <div>
                <div className="font-medium text-sm">{rule.label}</div>
                <div className="text-xs text-gray-500">{rule.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Notes et observations</label>
        <textarea
          value={spcData.notes}
          onChange={(e) => updateData({ ...spcData, notes: e.target.value })}
          placeholder="Observations, causes spéciales identifiées, actions correctives..."
          className="input min-h-[100px] resize-none"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

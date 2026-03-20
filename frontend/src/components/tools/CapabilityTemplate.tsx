import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Info, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface CapabilityData {
  processName: string;
  characteristic: string;
  unit: string;
  lsl: number | null; // Lower Specification Limit
  usl: number | null; // Upper Specification Limit
  target: number | null;
  measurements: number[];
  subgroupSize: number;
  measurementMethod: string;
  dataSource: string;
  notes: string;
}

interface CapabilityTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

// Statistical helper functions
const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

const calculateStdDev = (values: number[], isSample = true): number => {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (isSample ? values.length - 1 : values.length);
  return Math.sqrt(variance);
};

const calculateWithinStdDev = (measurements: number[], subgroupSize: number): number => {
  if (measurements.length < subgroupSize || subgroupSize < 2) return calculateStdDev(measurements);

  // Calculate R-bar method for within subgroup variation
  const subgroups: number[][] = [];
  for (let i = 0; i < measurements.length; i += subgroupSize) {
    const subgroup = measurements.slice(i, i + subgroupSize);
    if (subgroup.length === subgroupSize) {
      subgroups.push(subgroup);
    }
  }

  if (subgroups.length === 0) return calculateStdDev(measurements);

  // d2 constants for subgroup sizes 2-10
  const d2Values: Record<number, number> = {
    2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326,
    6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078
  };

  const d2 = d2Values[subgroupSize] || 2.326;

  // Calculate average range
  const ranges = subgroups.map(sg => Math.max(...sg) - Math.min(...sg));
  const rBar = calculateMean(ranges);

  return rBar / d2;
};

const getCapabilityColor = (value: number): string => {
  if (value >= 1.67) return 'text-measure';
  if (value >= 1.33) return 'text-improve';
  if (value >= 1.0) return 'text-analyze';
  return 'text-control';
};

const getCapabilityBgColor = (value: number): string => {
  if (value >= 1.67) return 'bg-measure-light';
  if (value >= 1.33) return 'bg-improve-light';
  if (value >= 1.0) return 'bg-analyze-light';
  return 'bg-control-light';
};

const getCapabilityRating = (cpk: number): { label: string; description: string; icon: typeof CheckCircle2 } => {
  if (cpk >= 1.67) return {
    label: 'Excellent',
    description: 'Processus très capable - Qualité Six Sigma',
    icon: CheckCircle2
  };
  if (cpk >= 1.33) return {
    label: 'Bon',
    description: 'Processus capable - Amélioration recommandée',
    icon: CheckCircle2
  };
  if (cpk >= 1.0) return {
    label: 'Acceptable',
    description: 'Processus limite - Actions requises',
    icon: AlertTriangle
  };
  return {
    label: 'Non capable',
    description: 'Processus non capable - Intervention urgente',
    icon: AlertTriangle
  };
};

export default function CapabilityTemplate({
  data,
  onChange,
  readOnly = false,
}: CapabilityTemplateProps) {
  const [capabilityData, setCapabilityData] = useState<CapabilityData>({
    processName: data.processName || '',
    characteristic: data.characteristic || '',
    unit: data.unit || '',
    lsl: data.lsl ?? null,
    usl: data.usl ?? null,
    target: data.target ?? null,
    measurements: data.measurements || [],
    subgroupSize: data.subgroupSize || 5,
    measurementMethod: data.measurementMethod || '',
    dataSource: data.dataSource || '',
    notes: data.notes || '',
  });

  const [measurementInput, setMeasurementInput] = useState('');

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setCapabilityData({
        processName: data.processName || '',
        characteristic: data.characteristic || '',
        unit: data.unit || '',
        lsl: data.lsl ?? null,
        usl: data.usl ?? null,
        target: data.target ?? null,
        measurements: data.measurements || [],
        subgroupSize: data.subgroupSize || 5,
        measurementMethod: data.measurementMethod || '',
        dataSource: data.dataSource || '',
        notes: data.notes || '',
      });
    }
  }, [data]);

  const updateData = (newData: CapabilityData) => {
    setCapabilityData(newData);
    onChange(newData);
  };

  // Calculate capability indices
  const stats = useMemo(() => {
    const measurements = capabilityData.measurements;
    if (measurements.length < 2) {
      return null;
    }

    const mean = calculateMean(measurements);
    const stdDevOverall = calculateStdDev(measurements);
    const stdDevWithin = calculateWithinStdDev(measurements, capabilityData.subgroupSize);
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const range = max - min;
    const n = measurements.length;

    const lsl = capabilityData.lsl;
    const usl = capabilityData.usl;
    const target = capabilityData.target ?? (lsl !== null && usl !== null ? (lsl + usl) / 2 : null);

    // Process Capability (short-term, within subgroup variation)
    let cp: number | null = null;
    let cpk: number | null = null;
    let cpl: number | null = null;
    let cpu: number | null = null;

    // Process Performance (long-term, overall variation)
    let pp: number | null = null;
    let ppk: number | null = null;
    let ppl: number | null = null;
    let ppu: number | null = null;

    if (lsl !== null && usl !== null && stdDevWithin > 0) {
      cp = (usl - lsl) / (6 * stdDevWithin);
      cpl = (mean - lsl) / (3 * stdDevWithin);
      cpu = (usl - mean) / (3 * stdDevWithin);
      cpk = Math.min(cpl, cpu);
    } else if (lsl !== null && stdDevWithin > 0) {
      cpl = (mean - lsl) / (3 * stdDevWithin);
      cpk = cpl;
    } else if (usl !== null && stdDevWithin > 0) {
      cpu = (usl - mean) / (3 * stdDevWithin);
      cpk = cpu;
    }

    if (lsl !== null && usl !== null && stdDevOverall > 0) {
      pp = (usl - lsl) / (6 * stdDevOverall);
      ppl = (mean - lsl) / (3 * stdDevOverall);
      ppu = (usl - mean) / (3 * stdDevOverall);
      ppk = Math.min(ppl, ppu);
    } else if (lsl !== null && stdDevOverall > 0) {
      ppl = (mean - lsl) / (3 * stdDevOverall);
      ppk = ppl;
    } else if (usl !== null && stdDevOverall > 0) {
      ppu = (usl - mean) / (3 * stdDevOverall);
      ppk = ppu;
    }

    // Calculate PPM (Parts Per Million) defects
    let ppmTotal = 0;
    if (cpk !== null && cpk > 0) {
      // Approximation using normal distribution
      const zScore = cpk * 3;
      // Simplified PPM calculation
      ppmTotal = Math.round(2 * 1000000 * (1 - normalCDF(zScore)));
    }

    return {
      n,
      mean: Math.round(mean * 10000) / 10000,
      stdDevOverall: Math.round(stdDevOverall * 10000) / 10000,
      stdDevWithin: Math.round(stdDevWithin * 10000) / 10000,
      min: Math.round(min * 10000) / 10000,
      max: Math.round(max * 10000) / 10000,
      range: Math.round(range * 10000) / 10000,
      target,
      cp: cp !== null ? Math.round(cp * 100) / 100 : null,
      cpk: cpk !== null ? Math.round(cpk * 100) / 100 : null,
      cpl: cpl !== null ? Math.round(cpl * 100) / 100 : null,
      cpu: cpu !== null ? Math.round(cpu * 100) / 100 : null,
      pp: pp !== null ? Math.round(pp * 100) / 100 : null,
      ppk: ppk !== null ? Math.round(ppk * 100) / 100 : null,
      ppl: ppl !== null ? Math.round(ppl * 100) / 100 : null,
      ppu: ppu !== null ? Math.round(ppu * 100) / 100 : null,
      ppmTotal,
    };
  }, [capabilityData.measurements, capabilityData.lsl, capabilityData.usl, capabilityData.target, capabilityData.subgroupSize]);

  // Normal CDF approximation
  function normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  const addMeasurements = () => {
    const newValues = measurementInput
      .split(/[\s,;]+/)
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));

    if (newValues.length > 0) {
      updateData({
        ...capabilityData,
        measurements: [...capabilityData.measurements, ...newValues],
      });
      setMeasurementInput('');
    }
  };

  const clearMeasurements = () => {
    updateData({
      ...capabilityData,
      measurements: [],
    });
  };

  const rating = stats?.cpk !== null ? getCapabilityRating(stats.cpk) : null;
  const RatingIcon = rating?.icon || AlertTriangle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-analyze flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Analyse de Capabilité Processus</h2>
            <p className="text-sm text-gray-500">
              Calcul des indices Cp, Cpk, Pp et Ppk
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du processus</label>
            <input
              type="text"
              value={capabilityData.processName}
              onChange={(e) => updateData({ ...capabilityData, processName: e.target.value })}
              placeholder="Ex: Usinage pièce A"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Caractéristique mesurée</label>
            <input
              type="text"
              value={capabilityData.characteristic}
              onChange={(e) => updateData({ ...capabilityData, characteristic: e.target.value })}
              placeholder="Ex: Diamètre externe"
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
            <p className="font-medium mb-1">Indices de Capabilité</p>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Cp</strong> = (USL - LSL) / (6σ) - Capabilité potentielle (variation court terme)</li>
              <li><strong>Cpk</strong> = min(CPU, CPL) - Capabilité réelle avec centrage</li>
              <li><strong>Pp</strong> = (USL - LSL) / (6σ) - Performance globale (variation long terme)</li>
              <li><strong>Ppk</strong> = min(PPU, PPL) - Performance réelle avec centrage</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Specification Limits */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Limites de spécification</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">LSL (Limite inférieure)</label>
            <input
              type="number"
              step="any"
              value={capabilityData.lsl ?? ''}
              onChange={(e) => updateData({
                ...capabilityData,
                lsl: e.target.value ? parseFloat(e.target.value) : null
              })}
              placeholder="Ex: 9.95"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cible (Target)</label>
            <input
              type="number"
              step="any"
              value={capabilityData.target ?? ''}
              onChange={(e) => updateData({
                ...capabilityData,
                target: e.target.value ? parseFloat(e.target.value) : null
              })}
              placeholder="Ex: 10.00"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">USL (Limite supérieure)</label>
            <input
              type="number"
              step="any"
              value={capabilityData.usl ?? ''}
              onChange={(e) => updateData({
                ...capabilityData,
                usl: e.target.value ? parseFloat(e.target.value) : null
              })}
              placeholder="Ex: 10.05"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unité</label>
            <input
              type="text"
              value={capabilityData.unit}
              onChange={(e) => updateData({ ...capabilityData, unit: e.target.value })}
              placeholder="Ex: mm"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Data Entry */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Données de mesure</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Taille sous-groupe:</label>
            <select
              value={capabilityData.subgroupSize}
              onChange={(e) => updateData({ ...capabilityData, subgroupSize: parseInt(e.target.value) })}
              className="input w-20"
              disabled={readOnly}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {!readOnly && (
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={measurementInput}
              onChange={(e) => setMeasurementInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addMeasurements()}
              placeholder="Entrez les valeurs séparées par des virgules ou espaces"
              className="input flex-1"
            />
            <button onClick={addMeasurements} className="btn btn-primary">
              Ajouter
            </button>
            <button
              onClick={clearMeasurements}
              className="btn btn-secondary text-control"
              disabled={capabilityData.measurements.length === 0}
            >
              Effacer tout
            </button>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-auto">
          {capabilityData.measurements.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {capabilityData.measurements.map((val, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-white border border-gray-200 rounded text-sm font-mono"
                >
                  {val}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center">Aucune donnée saisie</p>
          )}
        </div>

        <div className="mt-2 text-sm text-gray-500">
          {capabilityData.measurements.length} mesures
        </div>
      </div>

      {/* Results Dashboard */}
      {stats && (
        <>
          {/* Main Capability Indices */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cp */}
            <div className="card p-4">
              <div className="text-sm text-gray-500 mb-1">Cp (Potentiel)</div>
              <div className={cn(
                'text-3xl font-bold',
                stats.cp !== null ? getCapabilityColor(stats.cp) : 'text-gray-400'
              )}>
                {stats.cp !== null ? stats.cp.toFixed(2) : 'N/A'}
              </div>
              <div className="text-xs text-gray-400 mt-1">Capabilité court terme</div>
            </div>

            {/* Cpk */}
            <div className={cn(
              'card p-4 ring-2 ring-analyze',
              stats.cpk !== null && getCapabilityBgColor(stats.cpk)
            )}>
              <div className="text-sm text-gray-500 mb-1">Cpk (Réel)</div>
              <div className={cn(
                'text-3xl font-bold',
                stats.cpk !== null ? getCapabilityColor(stats.cpk) : 'text-gray-400'
              )}>
                {stats.cpk !== null ? stats.cpk.toFixed(2) : 'N/A'}
              </div>
              <div className="text-xs text-gray-400 mt-1">Capabilité avec centrage</div>
            </div>

            {/* Pp */}
            <div className="card p-4">
              <div className="text-sm text-gray-500 mb-1">Pp (Potentiel)</div>
              <div className={cn(
                'text-3xl font-bold',
                stats.pp !== null ? getCapabilityColor(stats.pp) : 'text-gray-400'
              )}>
                {stats.pp !== null ? stats.pp.toFixed(2) : 'N/A'}
              </div>
              <div className="text-xs text-gray-400 mt-1">Performance long terme</div>
            </div>

            {/* Ppk */}
            <div className="card p-4">
              <div className="text-sm text-gray-500 mb-1">Ppk (Réel)</div>
              <div className={cn(
                'text-3xl font-bold',
                stats.ppk !== null ? getCapabilityColor(stats.ppk) : 'text-gray-400'
              )}>
                {stats.ppk !== null ? stats.ppk.toFixed(2) : 'N/A'}
              </div>
              <div className="text-xs text-gray-400 mt-1">Performance avec centrage</div>
            </div>
          </div>

          {/* Rating Card */}
          {rating && stats.cpk !== null && (
            <div className={cn(
              'card p-6 border-2',
              stats.cpk >= 1.33 ? 'border-measure/30 bg-measure-light/20' :
              stats.cpk >= 1.0 ? 'border-analyze/30 bg-analyze-light/20' :
              'border-control/30 bg-control-light/20'
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center',
                  stats.cpk >= 1.33 ? 'bg-measure text-white' :
                  stats.cpk >= 1.0 ? 'bg-analyze text-white' :
                  'bg-control text-white'
                )}>
                  <RatingIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{rating.label}</h3>
                  <p className="text-gray-600">{rating.description}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    PPM estimé: <span className="font-medium">{stats.ppmTotal.toLocaleString()}</span> défauts par million
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Statistics */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              Statistiques descriptives
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500">Nombre (n)</div>
                <div className="text-2xl font-bold">{stats.n}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500">Moyenne (X̄)</div>
                <div className="text-2xl font-bold">{stats.mean}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500">Écart-type (σ global)</div>
                <div className="text-2xl font-bold">{stats.stdDevOverall}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500">Écart-type (σ intra)</div>
                <div className="text-2xl font-bold">{stats.stdDevWithin}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500">Minimum</div>
                <div className="text-2xl font-bold">{stats.min}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500">Maximum</div>
                <div className="text-2xl font-bold">{stats.max}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500">Étendue</div>
                <div className="text-2xl font-bold">{stats.range}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm text-gray-500">Cible</div>
                <div className="text-2xl font-bold">{stats.target ?? 'N/A'}</div>
              </div>
            </div>

            {/* CPL/CPU details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 border rounded-lg">
                <div className="text-xs text-gray-500">CPL</div>
                <div className="font-bold">{stats.cpl?.toFixed(2) ?? 'N/A'}</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-xs text-gray-500">CPU</div>
                <div className="font-bold">{stats.cpu?.toFixed(2) ?? 'N/A'}</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-xs text-gray-500">PPL</div>
                <div className="font-bold">{stats.ppl?.toFixed(2) ?? 'N/A'}</div>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <div className="text-xs text-gray-500">PPU</div>
                <div className="font-bold">{stats.ppu?.toFixed(2) ?? 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Visual representation - Process bell curve vs specs */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Visualisation processus vs spécifications</h3>
            <div className="relative h-32 bg-gray-50 rounded-lg overflow-hidden">
              {/* Spec limits visualization */}
              {capabilityData.lsl !== null && capabilityData.usl !== null && (
                <>
                  {/* LSL line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-control"
                    style={{ left: '10%' }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-medium text-control whitespace-nowrap">
                      LSL: {capabilityData.lsl}
                    </div>
                  </div>

                  {/* USL line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-control"
                    style={{ right: '10%' }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-xs font-medium text-control whitespace-nowrap">
                      USL: {capabilityData.usl}
                    </div>
                  </div>

                  {/* Target line */}
                  {stats.target !== null && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-measure border-dashed"
                      style={{ left: '50%' }}
                    >
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-medium text-measure whitespace-nowrap">
                        Cible: {stats.target}
                      </div>
                    </div>
                  )}

                  {/* Mean indicator */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-define rounded-full border-2 border-white shadow"
                    style={{
                      left: `calc(10% + ${((stats.mean - capabilityData.lsl) / (capabilityData.usl - capabilityData.lsl)) * 80}%)`
                    }}
                  >
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-define whitespace-nowrap">
                      X̄: {stats.mean}
                    </div>
                  </div>

                  {/* Spec zone */}
                  <div
                    className="absolute top-1/4 bottom-1/4 bg-improve/20"
                    style={{ left: '10%', right: '10%' }}
                  />
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Capability Reference Table */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Référentiel Indices de Capabilité</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Cpk / Ppk</th>
                <th className="px-4 py-2 text-left">Niveau</th>
                <th className="px-4 py-2 text-right">Sigma</th>
                <th className="px-4 py-2 text-right">PPM</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cpk: '≥ 2.00', level: 'World Class', sigma: '6σ', ppm: '3.4', action: 'Maintenir', bg: 'bg-measure-light' },
                { cpk: '≥ 1.67', level: 'Excellent', sigma: '5σ', ppm: '233', action: 'Standardiser', bg: 'bg-measure-light' },
                { cpk: '≥ 1.33', level: 'Bon', sigma: '4σ', ppm: '6 210', action: 'Améliorer', bg: 'bg-improve-light' },
                { cpk: '≥ 1.00', level: 'Acceptable', sigma: '3σ', ppm: '66 807', action: 'Surveiller', bg: 'bg-analyze-light' },
                { cpk: '< 1.00', level: 'Non capable', sigma: '< 3σ', ppm: '> 66 807', action: 'Intervention urgente', bg: 'bg-control-light' },
              ].map((row, idx) => (
                <tr key={idx} className={cn('border-t', row.bg)}>
                  <td className="px-4 py-2 font-medium">{row.cpk}</td>
                  <td className="px-4 py-2">{row.level}</td>
                  <td className="px-4 py-2 text-right">{row.sigma}</td>
                  <td className="px-4 py-2 text-right">{row.ppm}</td>
                  <td className="px-4 py-2">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Méthode de mesure</label>
          <textarea
            value={capabilityData.measurementMethod}
            onChange={(e) => updateData({ ...capabilityData, measurementMethod: e.target.value })}
            placeholder="Instrument, procédure de mesure..."
            className="input min-h-[100px] resize-none"
            disabled={readOnly}
          />
        </div>
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Source des données</label>
          <textarea
            value={capabilityData.dataSource}
            onChange={(e) => updateData({ ...capabilityData, dataSource: e.target.value })}
            placeholder="Système, période de collecte..."
            className="input min-h-[100px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Notes et observations</label>
        <textarea
          value={capabilityData.notes}
          onChange={(e) => updateData({ ...capabilityData, notes: e.target.value })}
          placeholder="Observations, recommandations, actions à entreprendre..."
          className="input min-h-[100px] resize-none"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Activity, Info, Plus, Trash2, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface DataPoint {
  id: string;
  date: string;
  value: number | null;
  annotation: string;
}

interface ControlChartData {
  chartName: string;
  processName: string;
  metric: string;
  unit: string;
  chartType: 'imr' | 'run' | 'cusum' | 'ewma';
  dataPoints: DataPoint[];
  controlLimits: {
    ucl: number | null;
    centerLine: number | null;
    lcl: number | null;
    autoCalculate: boolean;
  };
  targetValue: number | null;
  movingRangeSize: number;
  signalDetected: boolean;
  analysisNotes: string;
  actionsTaken: string;
}

interface ControlChartTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const chartTypeOptions = [
  { value: 'imr', label: 'I-MR (Individuel - Étendue Mobile)', description: 'Pour données individuelles' },
  { value: 'run', label: 'Run Chart (Carte de tendance)', description: 'Séquence chronologique simple' },
  { value: 'cusum', label: 'CUSUM', description: 'Somme cumulée des écarts' },
  { value: 'ewma', label: 'EWMA', description: 'Moyenne mobile pondérée exponentiellement' },
];

const createEmptyDataPoint = (): DataPoint => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().split('T')[0],
  value: null,
  annotation: '',
});

// Statistical calculations
const calculateIMRStats = (values: number[], mrSize: number = 2) => {
  if (values.length < 2) return null;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;

  // Calculate moving ranges
  const movingRanges: number[] = [];
  for (let i = mrSize - 1; i < values.length; i++) {
    const subset = values.slice(i - mrSize + 1, i + 1);
    movingRanges.push(Math.max(...subset) - Math.min(...subset));
  }

  const mrBar = movingRanges.length > 0
    ? movingRanges.reduce((a, b) => a + b, 0) / movingRanges.length
    : 0;

  // d2 for MR with size 2
  const d2 = mrSize === 2 ? 1.128 : 1.693;
  const sigma = mrBar / d2;

  const ucl = mean + 3 * sigma;
  const lcl = mean - 3 * sigma;

  // Detect out of control points
  const outOfControl = values.map((val, idx) => ({
    index: idx,
    value: val,
    isOut: val > ucl || val < lcl,
    type: val > ucl ? 'above' : val < lcl ? 'below' : 'ok' as const,
  }));

  // Detect trends (7+ points increasing or decreasing)
  const trends: Array<{ start: number; end: number; direction: 'up' | 'down' }> = [];
  let trendStart = 0;
  let trendCount = 1;
  let trendDirection: 'up' | 'down' | null = null;

  for (let i = 1; i < values.length; i++) {
    const currentDir = values[i] > values[i - 1] ? 'up' : values[i] < values[i - 1] ? 'down' : null;

    if (currentDir === trendDirection) {
      trendCount++;
    } else {
      if (trendCount >= 7 && trendDirection) {
        trends.push({ start: trendStart, end: i - 1, direction: trendDirection });
      }
      trendStart = i - 1;
      trendCount = 2;
      trendDirection = currentDir;
    }
  }
  if (trendCount >= 7 && trendDirection) {
    trends.push({ start: trendStart, end: values.length - 1, direction: trendDirection });
  }

  // Detect runs (8+ points on same side of centerline)
  const runs: Array<{ start: number; end: number; side: 'above' | 'below' }> = [];
  let runStart = 0;
  let runCount = 1;
  let runSide: 'above' | 'below' | null = values[0] > mean ? 'above' : values[0] < mean ? 'below' : null;

  for (let i = 1; i < values.length; i++) {
    const currentSide = values[i] > mean ? 'above' : values[i] < mean ? 'below' : null;

    if (currentSide === runSide) {
      runCount++;
    } else {
      if (runCount >= 8 && runSide) {
        runs.push({ start: runStart, end: i - 1, side: runSide });
      }
      runStart = i;
      runCount = 1;
      runSide = currentSide;
    }
  }
  if (runCount >= 8 && runSide) {
    runs.push({ start: runStart, end: values.length - 1, side: runSide });
  }

  return {
    mean: Math.round(mean * 10000) / 10000,
    sigma: Math.round(sigma * 10000) / 10000,
    mrBar: Math.round(mrBar * 10000) / 10000,
    ucl: Math.round(ucl * 10000) / 10000,
    lcl: Math.round(lcl * 10000) / 10000,
    movingRanges,
    outOfControl,
    trends,
    runs,
    min: Math.min(...values),
    max: Math.max(...values),
    n: values.length,
    hasSignal: outOfControl.some(p => p.isOut) || trends.length > 0 || runs.length > 0,
  };
};

export default function ControlChartTemplate({
  data,
  onChange,
  readOnly = false,
}: ControlChartTemplateProps) {
  const [chartData, setChartData] = useState<ControlChartData>({
    chartName: data.chartName || '',
    processName: data.processName || '',
    metric: data.metric || '',
    unit: data.unit || '',
    chartType: data.chartType || 'imr',
    dataPoints: data.dataPoints || [],
    controlLimits: data.controlLimits || {
      ucl: null,
      centerLine: null,
      lcl: null,
      autoCalculate: true,
    },
    targetValue: data.targetValue ?? null,
    movingRangeSize: data.movingRangeSize || 2,
    signalDetected: data.signalDetected || false,
    analysisNotes: data.analysisNotes || '',
    actionsTaken: data.actionsTaken || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setChartData({
        chartName: data.chartName || '',
        processName: data.processName || '',
        metric: data.metric || '',
        unit: data.unit || '',
        chartType: data.chartType || 'imr',
        dataPoints: data.dataPoints || [],
        controlLimits: data.controlLimits || {
          ucl: null, centerLine: null, lcl: null, autoCalculate: true,
        },
        targetValue: data.targetValue ?? null,
        movingRangeSize: data.movingRangeSize || 2,
        signalDetected: data.signalDetected || false,
        analysisNotes: data.analysisNotes || '',
        actionsTaken: data.actionsTaken || '',
      });
    }
  }, [data]);

  const updateData = (newData: ControlChartData) => {
    setChartData(newData);
    onChange(newData);
  };

  const addDataPoint = () => {
    updateData({
      ...chartData,
      dataPoints: [...chartData.dataPoints, createEmptyDataPoint()],
    });
  };

  const addMultipleDataPoints = (count: number) => {
    const newPoints = Array.from({ length: count }, () => createEmptyDataPoint());
    updateData({
      ...chartData,
      dataPoints: [...chartData.dataPoints, ...newPoints],
    });
  };

  const removeDataPoint = (id: string) => {
    updateData({
      ...chartData,
      dataPoints: chartData.dataPoints.filter(p => p.id !== id),
    });
  };

  const updateDataPoint = (id: string, field: keyof DataPoint, value: any) => {
    updateData({
      ...chartData,
      dataPoints: chartData.dataPoints.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const validValues = chartData.dataPoints
      .map(p => p.value)
      .filter((v): v is number => v !== null && !isNaN(v));

    if (validValues.length < 2) return null;

    return calculateIMRStats(validValues, chartData.movingRangeSize);
  }, [chartData.dataPoints, chartData.movingRangeSize]);

  // Use auto-calculated or custom limits
  const limits = useMemo(() => {
    if (chartData.controlLimits.autoCalculate && stats) {
      return {
        ucl: stats.ucl,
        centerLine: stats.mean,
        lcl: stats.lcl,
      };
    }
    return {
      ucl: chartData.controlLimits.ucl,
      centerLine: chartData.controlLimits.centerLine,
      lcl: chartData.controlLimits.lcl,
    };
  }, [chartData.controlLimits, stats]);

  const isInControl = stats ? !stats.hasSignal : true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-control flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Carte de Contrôle</h2>
            <p className="text-sm text-gray-500">
              Suivi et surveillance de la stabilité processus
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de la carte</label>
            <input
              type="text"
              value={chartData.chartName}
              onChange={(e) => updateData({ ...chartData, chartName: e.target.value })}
              placeholder="Ex: Suivi température four"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Processus</label>
            <input
              type="text"
              value={chartData.processName}
              onChange={(e) => updateData({ ...chartData, processName: e.target.value })}
              placeholder="Ex: Four de cuisson ligne 1"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Indicateur mesuré</label>
            <input
              type="text"
              value={chartData.metric}
              onChange={(e) => updateData({ ...chartData, metric: e.target.value })}
              placeholder="Ex: Température"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unité</label>
            <input
              type="text"
              value={chartData.unit}
              onChange={(e) => updateData({ ...chartData, unit: e.target.value })}
              placeholder="Ex: °C"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type de carte</label>
            <select
              value={chartData.chartType}
              onChange={(e) => updateData({ ...chartData, chartType: e.target.value as any })}
              className="input"
              disabled={readOnly}
            >
              {chartTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Status Card */}
      {stats && (
        <div className={cn(
          'card p-6 border-2',
          isInControl
            ? 'border-improve/30 bg-improve-light/20'
            : 'border-control/30 bg-control-light/20'
        )}>
          <div className="flex items-center gap-4 mb-4">
            {isInControl ? (
              <CheckCircle2 className="w-12 h-12 text-improve" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-control" />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {isInControl ? 'Processus stable' : 'Signal détecté'}
              </h3>
              <p className="text-gray-600">
                {isInControl
                  ? 'Aucune cause spéciale de variation détectée.'
                  : 'Une ou plusieurs causes spéciales ont été identifiées.'}
              </p>
            </div>
          </div>

          {/* Detected signals */}
          {!isInControl && (
            <div className="space-y-2">
              {stats.outOfControl.filter(p => p.isOut).length > 0 && (
                <div className="flex items-center gap-2 text-sm text-control">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{stats.outOfControl.filter(p => p.isOut).length} point(s) hors limites</span>
                </div>
              )}
              {stats.trends.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-control">
                  {stats.trends[0].direction === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{stats.trends.length} tendance(s) détectée(s) (7+ points)</span>
                </div>
              )}
              {stats.runs.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-control">
                  <Activity className="w-4 h-4" />
                  <span>{stats.runs.length} série(s) détectée(s) (8+ points même côté)</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Statistics Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4 text-center">
            <div className="text-sm text-gray-500">Moyenne</div>
            <div className="text-2xl font-bold text-define">{stats.mean}</div>
          </div>
          <div className="card p-4 text-center bg-control-light/30">
            <div className="text-sm text-gray-500">UCL</div>
            <div className="text-xl font-bold text-control">{limits.ucl?.toFixed(4)}</div>
          </div>
          <div className="card p-4 text-center bg-define-light/30">
            <div className="text-sm text-gray-500">CL</div>
            <div className="text-xl font-bold text-define">{limits.centerLine?.toFixed(4)}</div>
          </div>
          <div className="card p-4 text-center bg-control-light/30">
            <div className="text-sm text-gray-500">LCL</div>
            <div className="text-xl font-bold text-control">{limits.lcl?.toFixed(4)}</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-sm text-gray-500">σ estimé</div>
            <div className="text-2xl font-bold">{stats.sigma}</div>
          </div>
        </div>
      )}

      {/* Control Chart Visualization */}
      {stats && chartData.dataPoints.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Carte de Contrôle</h3>

          <div className="relative h-64 bg-gray-50 rounded-lg overflow-hidden">
            {/* Control limit lines */}
            {limits.ucl !== null && (
              <div
                className="absolute left-0 right-0 h-px border-t-2 border-dashed border-control"
                style={{ top: '15%' }}
              >
                <span className="absolute right-2 -top-4 text-xs text-control font-medium">
                  UCL = {limits.ucl.toFixed(2)}
                </span>
              </div>
            )}

            {limits.centerLine !== null && (
              <div
                className="absolute left-0 right-0 h-px border-t-2 border-define"
                style={{ top: '50%' }}
              >
                <span className="absolute right-2 -top-4 text-xs text-define font-medium">
                  CL = {limits.centerLine.toFixed(2)}
                </span>
              </div>
            )}

            {limits.lcl !== null && (
              <div
                className="absolute left-0 right-0 h-px border-t-2 border-dashed border-control"
                style={{ top: '85%' }}
              >
                <span className="absolute right-2 -top-4 text-xs text-control font-medium">
                  LCL = {limits.lcl.toFixed(2)}
                </span>
              </div>
            )}

            {/* 1-sigma and 2-sigma zones (faded) */}
            <div className="absolute left-0 right-0 bg-improve/10" style={{ top: '38%', height: '24%' }} />
            <div className="absolute left-0 right-0 bg-analyze/5" style={{ top: '27%', height: '11%' }} />
            <div className="absolute left-0 right-0 bg-analyze/5" style={{ top: '62%', height: '11%' }} />

            {/* Data points */}
            <div className="absolute inset-0 p-4">
              <svg className="w-full h-full" preserveAspectRatio="none">
                {/* Connecting lines */}
                {stats.outOfControl.map((point, idx) => {
                  if (idx === 0) return null;
                  const prevPoint = stats.outOfControl[idx - 1];

                  const range = (limits.ucl || stats.ucl) - (limits.lcl || stats.lcl);
                  const x1 = ((idx - 1) / (stats.outOfControl.length - 1)) * 100;
                  const x2 = (idx / (stats.outOfControl.length - 1)) * 100;

                  const y1 = 100 - ((prevPoint.value - (limits.lcl || stats.lcl)) / range) * 70 - 15;
                  const y2 = 100 - ((point.value - (limits.lcl || stats.lcl)) / range) * 70 - 15;

                  return (
                    <line
                      key={`line-${idx}`}
                      x1={`${x1}%`}
                      y1={`${Math.max(5, Math.min(95, y1))}%`}
                      x2={`${x2}%`}
                      y2={`${Math.max(5, Math.min(95, y2))}%`}
                      stroke="#6366F1"
                      strokeWidth="2"
                      strokeOpacity="0.5"
                    />
                  );
                })}

                {/* Data points */}
                {stats.outOfControl.map((point, idx) => {
                  const range = (limits.ucl || stats.ucl) - (limits.lcl || stats.lcl);
                  const x = (idx / (stats.outOfControl.length - 1 || 1)) * 100;
                  const y = 100 - ((point.value - (limits.lcl || stats.lcl)) / range) * 70 - 15;
                  const clampedY = Math.max(5, Math.min(95, y));

                  return (
                    <circle
                      key={`point-${idx}`}
                      cx={`${x}%`}
                      cy={`${clampedY}%`}
                      r="6"
                      fill={point.isOut ? '#EF4444' : '#6366F1'}
                      stroke="white"
                      strokeWidth="2"
                      className="cursor-pointer"
                    >
                      <title>Point {idx + 1}: {point.value.toFixed(3)}</title>
                    </circle>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
            <span>1</span>
            <span>{Math.ceil(stats.n / 2)}</span>
            <span>{stats.n}</span>
          </div>
        </div>
      )}

      {/* Control Limits Configuration */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Limites de contrôle</h3>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={chartData.controlLimits.autoCalculate}
              onChange={(e) => updateData({
                ...chartData,
                controlLimits: { ...chartData.controlLimits, autoCalculate: e.target.checked }
              })}
              className="rounded"
              disabled={readOnly}
            />
            <span className="text-sm">Calculer automatiquement à partir des données</span>
          </label>
        </div>

        {!chartData.controlLimits.autoCalculate && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">UCL</label>
              <input
                type="number"
                step="any"
                value={chartData.controlLimits.ucl ?? ''}
                onChange={(e) => updateData({
                  ...chartData,
                  controlLimits: {
                    ...chartData.controlLimits,
                    ucl: e.target.value ? parseFloat(e.target.value) : null
                  }
                })}
                className="input"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ligne centrale</label>
              <input
                type="number"
                step="any"
                value={chartData.controlLimits.centerLine ?? ''}
                onChange={(e) => updateData({
                  ...chartData,
                  controlLimits: {
                    ...chartData.controlLimits,
                    centerLine: e.target.value ? parseFloat(e.target.value) : null
                  }
                })}
                className="input"
                disabled={readOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">LCL</label>
              <input
                type="number"
                step="any"
                value={chartData.controlLimits.lcl ?? ''}
                onChange={(e) => updateData({
                  ...chartData,
                  controlLimits: {
                    ...chartData.controlLimits,
                    lcl: e.target.value ? parseFloat(e.target.value) : null
                  }
                })}
                className="input"
                disabled={readOnly}
              />
            </div>
          </div>
        )}
      </div>

      {/* Data Entry */}
      <div className="card overflow-hidden">
        <div className="p-4 bg-control text-white flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Données ({chartData.dataPoints.length} points)
          </h3>
          {!readOnly && (
            <div className="flex gap-2">
              <button
                onClick={() => addMultipleDataPoints(5)}
                className="btn btn-sm bg-white/20 hover:bg-white/30 text-white"
              >
                +5 points
              </button>
              <button
                onClick={() => addMultipleDataPoints(10)}
                className="btn btn-sm bg-white/20 hover:bg-white/30 text-white"
              >
                +10 points
              </button>
            </div>
          )}
        </div>

        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-center w-12">#</th>
                <th className="px-3 py-2 text-center">Date</th>
                <th className="px-3 py-2 text-center">Valeur</th>
                <th className="px-3 py-2 text-center">Statut</th>
                <th className="px-3 py-2 text-left">Annotation</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {chartData.dataPoints.map((point, idx) => {
                const outPoint = stats?.outOfControl[idx];
                const isOut = outPoint?.isOut;

                return (
                  <tr key={point.id} className={cn(
                    'border-b hover:bg-gray-50',
                    isOut && 'bg-control-light/20'
                  )}>
                    <td className="px-3 py-2 text-center font-medium text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="date"
                        value={point.date}
                        onChange={(e) => updateDataPoint(point.id, 'date', e.target.value)}
                        className="input text-sm w-36"
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="any"
                        value={point.value ?? ''}
                        onChange={(e) => updateDataPoint(
                          point.id,
                          'value',
                          e.target.value ? parseFloat(e.target.value) : null
                        )}
                        className={cn(
                          'input text-sm text-center w-24',
                          isOut && 'border-control'
                        )}
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {point.value !== null && (
                        isOut ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-control text-white text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            Hors contrôle
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-improve text-white text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            OK
                          </span>
                        )
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={point.annotation}
                        onChange={(e) => updateDataPoint(point.id, 'annotation', e.target.value)}
                        placeholder="Note..."
                        className="input text-sm"
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {!readOnly && (
                        <button
                          onClick={() => removeDataPoint(point.id)}
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
            <button onClick={addDataPoint} className="btn btn-secondary w-full">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un point
            </button>
          </div>
        )}
      </div>

      {/* Analysis & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Notes d'analyse</label>
          <textarea
            value={chartData.analysisNotes}
            onChange={(e) => updateData({ ...chartData, analysisNotes: e.target.value })}
            placeholder="Interprétation des signaux détectés, causes possibles..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Actions entreprises</label>
          <textarea
            value={chartData.actionsTaken}
            onChange={(e) => updateData({ ...chartData, actionsTaken: e.target.value })}
            placeholder="Actions correctives mises en place, responsables, dates..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Règles de détection des signaux</p>
            <ul className="space-y-1 text-blue-700">
              <li><strong>Point hors limites:</strong> Une valeur au-delà de UCL ou LCL (±3σ)</li>
              <li><strong>Tendance:</strong> 7 points consécutifs croissants ou décroissants</li>
              <li><strong>Série:</strong> 8 points consécutifs du même côté de la moyenne</li>
              <li><strong>Stratification:</strong> 15 points consécutifs dans la zone ±1σ</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

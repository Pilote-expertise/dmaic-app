import { useState, useEffect } from 'react';
import { Ruler, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface MeasurementData {
  operator: string;
  part: string;
  trial: number;
  value: number;
}

interface MSAData {
  measurementName: string;
  measurementDescription: string;
  studyType: 'gage_rr' | 'bias' | 'linearity' | 'stability';
  operators: string[];
  parts: string[];
  numTrials: number;
  tolerance: number;
  measurements: MeasurementData[];
  conclusions: string;
  recommendations: string;
}

interface MSATemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

export default function MSATemplate({
  data,
  onChange,
  readOnly = false,
}: MSATemplateProps) {
  const [msaData, setMsaData] = useState<MSAData>({
    measurementName: data.measurementName || '',
    measurementDescription: data.measurementDescription || '',
    studyType: data.studyType || 'gage_rr',
    operators: data.operators?.length ? data.operators : ['Opérateur 1', 'Opérateur 2'],
    parts: data.parts?.length ? data.parts : ['Pièce 1', 'Pièce 2', 'Pièce 3', 'Pièce 4', 'Pièce 5'],
    numTrials: data.numTrials || 3,
    tolerance: data.tolerance || 10,
    measurements: data.measurements?.length ? data.measurements : [],
    conclusions: data.conclusions || '',
    recommendations: data.recommendations || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setMsaData({
        measurementName: data.measurementName || '',
        measurementDescription: data.measurementDescription || '',
        studyType: data.studyType || 'gage_rr',
        operators: data.operators?.length ? data.operators : ['Opérateur 1', 'Opérateur 2'],
        parts: data.parts?.length ? data.parts : ['Pièce 1', 'Pièce 2', 'Pièce 3', 'Pièce 4', 'Pièce 5'],
        numTrials: data.numTrials || 3,
        tolerance: data.tolerance || 10,
        measurements: data.measurements?.length ? data.measurements : [],
        conclusions: data.conclusions || '',
        recommendations: data.recommendations || '',
      });
    }
  }, [data]);

  const updateData = (newData: MSAData) => {
    setMsaData(newData);
    onChange(newData);
  };

  // Initialize measurement matrix if empty
  const initializeMeasurements = () => {
    const newMeasurements: MeasurementData[] = [];
    msaData.operators.forEach((operator) => {
      msaData.parts.forEach((part) => {
        for (let trial = 1; trial <= msaData.numTrials; trial++) {
          newMeasurements.push({
            operator,
            part,
            trial,
            value: 0,
          });
        }
      });
    });
    updateData({ ...msaData, measurements: newMeasurements });
  };

  const updateMeasurement = (operator: string, part: string, trial: number, value: number) => {
    const measurements = msaData.measurements.map((m) =>
      m.operator === operator && m.part === part && m.trial === trial
        ? { ...m, value }
        : m
    );
    updateData({ ...msaData, measurements });
  };

  const getMeasurement = (operator: string, part: string, trial: number): number => {
    const m = msaData.measurements.find(
      (m) => m.operator === operator && m.part === part && m.trial === trial
    );
    return m?.value || 0;
  };

  // Calculate statistics
  const calculateStats = () => {
    if (msaData.measurements.length === 0) {
      return {
        repeatability: 0,
        reproducibility: 0,
        gageRR: 0,
        partVariation: 0,
        totalVariation: 0,
        percentGageRR: 0,
        ndc: 0,
        isAcceptable: false,
        isMarginal: false,
      };
    }

    const values = msaData.measurements.map((m) => m.value).filter((v) => v !== 0);
    if (values.length === 0) {
      return {
        repeatability: 0,
        reproducibility: 0,
        gageRR: 0,
        partVariation: 0,
        totalVariation: 0,
        percentGageRR: 0,
        ndc: 0,
        isAcceptable: false,
        isMarginal: false,
      };
    }

    // Calculate averages per operator
    const operatorAvgs = msaData.operators.map((op) => {
      const opMeasurements = msaData.measurements.filter((m) => m.operator === op && m.value !== 0);
      return opMeasurements.length > 0
        ? opMeasurements.reduce((sum, m) => sum + m.value, 0) / opMeasurements.length
        : 0;
    });

    // Calculate averages per part
    const partAvgs = msaData.parts.map((part) => {
      const partMeasurements = msaData.measurements.filter((m) => m.part === part && m.value !== 0);
      return partMeasurements.length > 0
        ? partMeasurements.reduce((sum, m) => sum + m.value, 0) / partMeasurements.length
        : 0;
    });

    // Calculate overall average
    const overallAvg = values.reduce((sum, v) => sum + v, 0) / values.length;

    // Repeatability (within operator variation)
    let repeatabilitySum = 0;
    msaData.operators.forEach((op) => {
      msaData.parts.forEach((part) => {
        const trialsValues = [];
        for (let t = 1; t <= msaData.numTrials; t++) {
          const v = getMeasurement(op, part, t);
          if (v !== 0) trialsValues.push(v);
        }
        if (trialsValues.length > 1) {
          const avg = trialsValues.reduce((s, v) => s + v, 0) / trialsValues.length;
          trialsValues.forEach((v) => {
            repeatabilitySum += Math.pow(v - avg, 2);
          });
        }
      });
    });

    // k1 = 5.15 is the constant for 99% coverage in full Gage R&R calculations
    const repeatability = Math.sqrt(repeatabilitySum / Math.max(values.length - msaData.operators.length * msaData.parts.length, 1));

    // Reproducibility (between operator variation)
    const reproducibilitySum = operatorAvgs.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0);
    const reproducibility = Math.sqrt(reproducibilitySum / Math.max(msaData.operators.length - 1, 1));

    // Gage R&R
    const gageRR = Math.sqrt(Math.pow(repeatability, 2) + Math.pow(reproducibility, 2));

    // Part variation
    const partVariationSum = partAvgs.reduce((sum, avg) => sum + Math.pow(avg - overallAvg, 2), 0);
    const partVariation = Math.sqrt(partVariationSum / Math.max(msaData.parts.length - 1, 1));

    // Total variation
    const totalVariation = Math.sqrt(Math.pow(gageRR, 2) + Math.pow(partVariation, 2));

    // Percent Gage R&R (compared to tolerance)
    const percentGageRR = msaData.tolerance > 0 ? (gageRR * 6 / msaData.tolerance) * 100 : 0;

    // Number of Distinct Categories (NDC)
    const ndc = partVariation > 0 ? Math.floor(1.41 * (partVariation / gageRR)) : 0;

    return {
      repeatability: Math.round(repeatability * 1000) / 1000,
      reproducibility: Math.round(reproducibility * 1000) / 1000,
      gageRR: Math.round(gageRR * 1000) / 1000,
      partVariation: Math.round(partVariation * 1000) / 1000,
      totalVariation: Math.round(totalVariation * 1000) / 1000,
      percentGageRR: Math.round(percentGageRR * 10) / 10,
      ndc,
      isAcceptable: percentGageRR <= 10,
      isMarginal: percentGageRR > 10 && percentGageRR <= 30,
    };
  };

  const stats = calculateStats();

  const studyTypeLabels: Record<string, string> = {
    gage_rr: 'Gage R&R',
    bias: 'Biais',
    linearity: 'Linéarité',
    stability: 'Stabilité',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-measure flex items-center justify-center">
            <Ruler className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">MSA - Analyse du Système de Mesure</h2>
            <p className="text-sm text-gray-500">
              Évaluation de la fiabilité du système de mesure
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de la mesure</label>
            <input
              type="text"
              value={msaData.measurementName}
              onChange={(e) => updateData({ ...msaData, measurementName: e.target.value })}
              placeholder="Ex: Diamètre de perçage"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type d'étude</label>
            <select
              value={msaData.studyType}
              onChange={(e) => updateData({ ...msaData, studyType: e.target.value as any })}
              className="input"
              disabled={readOnly}
            >
              {Object.entries(studyTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Description de la mesure</label>
          <textarea
            value={msaData.measurementDescription}
            onChange={(e) => updateData({ ...msaData, measurementDescription: e.target.value })}
            placeholder="Décrivez le système de mesure, l'instrument utilisé..."
            className="input min-h-[80px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Study Setup */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Configuration de l'étude</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Opérateurs</label>
            <input
              type="text"
              value={msaData.operators.join(', ')}
              onChange={(e) => updateData({ ...msaData, operators: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="Op1, Op2, Op3"
              className="input"
              disabled={readOnly}
            />
            <span className="text-xs text-gray-500">Séparer par virgules</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Pièces</label>
            <input
              type="text"
              value={msaData.parts.join(', ')}
              onChange={(e) => updateData({ ...msaData, parts: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              placeholder="P1, P2, P3..."
              className="input"
              disabled={readOnly}
            />
            <span className="text-xs text-gray-500">Séparer par virgules</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Répétitions (trials)</label>
            <input
              type="number"
              min="2"
              max="5"
              value={msaData.numTrials}
              onChange={(e) => updateData({ ...msaData, numTrials: parseInt(e.target.value) || 3 })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tolérance</label>
            <input
              type="number"
              step="0.001"
              value={msaData.tolerance}
              onChange={(e) => updateData({ ...msaData, tolerance: parseFloat(e.target.value) || 10 })}
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>

        {!readOnly && msaData.measurements.length === 0 && (
          <button onClick={initializeMeasurements} className="btn btn-primary">
            Initialiser la matrice de mesures
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Critères d'acceptation Gage R&R</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>&lt; 10%</strong> : Acceptable - Système de mesure fiable</li>
              <li>• <strong>10-30%</strong> : Marginal - Peut être acceptable selon contexte</li>
              <li>• <strong>&gt; 30%</strong> : Inacceptable - Système à améliorer</li>
              <li>• <strong>NDC ≥ 5</strong> : Nombre de catégories distinctes recommandé</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Measurement Matrix */}
      {msaData.measurements.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-semibold">Matrice de mesures</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-left">Opérateur</th>
                  <th className="px-3 py-2 text-left">Pièce</th>
                  {Array.from({ length: msaData.numTrials }, (_, i) => (
                    <th key={i} className="px-3 py-2 text-center">Essai {i + 1}</th>
                  ))}
                  <th className="px-3 py-2 text-center">Moyenne</th>
                  <th className="px-3 py-2 text-center">Étendue</th>
                </tr>
              </thead>
              <tbody>
                {msaData.operators.map((operator) =>
                  msaData.parts.map((part, partIdx) => {
                    const trials = Array.from({ length: msaData.numTrials }, (_, t) =>
                      getMeasurement(operator, part, t + 1)
                    );
                    const avg = trials.reduce((s, v) => s + v, 0) / trials.length;
                    const range = Math.max(...trials) - Math.min(...trials);
                    const isFirstPart = partIdx === 0;

                    return (
                      <tr key={`${operator}-${part}`} className="border-t hover:bg-gray-50">
                        {isFirstPart && (
                          <td
                            className="px-3 py-2 font-medium bg-measure-light"
                            rowSpan={msaData.parts.length}
                          >
                            {operator}
                          </td>
                        )}
                        <td className="px-3 py-2">{part}</td>
                        {Array.from({ length: msaData.numTrials }, (_, t) => (
                          <td key={t} className="px-3 py-2">
                            <input
                              type="number"
                              step="0.001"
                              value={getMeasurement(operator, part, t + 1) || ''}
                              onChange={(e) =>
                                updateMeasurement(operator, part, t + 1, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 p-1 border rounded text-center"
                              disabled={readOnly}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center font-medium">
                          {avg.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {range.toFixed(3)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Dashboard */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Résultats de l'analyse</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-1">Répétabilité</div>
            <div className="text-2xl font-bold">{stats.repeatability}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-1">Reproductibilité</div>
            <div className="text-2xl font-bold">{stats.reproducibility}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-1">Gage R&R</div>
            <div className="text-2xl font-bold">{stats.gageRR}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-1">Variation pièces</div>
            <div className="text-2xl font-bold">{stats.partVariation}</div>
          </div>
        </div>

        {/* Gage R&R % */}
        <div className={cn(
          'rounded-xl p-6 mb-6',
          stats.isAcceptable ? 'bg-measure-light' :
          stats.isMarginal ? 'bg-analyze-light' : 'bg-control-light'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Gage R&R % (vs Tolérance)</div>
              <div className={cn(
                'text-4xl font-bold',
                stats.isAcceptable ? 'text-measure' :
                stats.isMarginal ? 'text-analyze' : 'text-control'
              )}>
                {stats.percentGageRR}%
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-lg font-semibold">
                {stats.isAcceptable ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-measure" />
                    <span className="text-measure">Acceptable</span>
                  </>
                ) : stats.isMarginal ? (
                  <>
                    <AlertCircle className="w-6 h-6 text-analyze" />
                    <span className="text-analyze">Marginal</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-6 h-6 text-control" />
                    <span className="text-control">Inacceptable</span>
                  </>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                NDC = {stats.ndc} {stats.ndc >= 5 ? '✓' : '(min. 5)'}
              </div>
            </div>
          </div>

          {/* Visual bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0%</span>
              <span>10%</span>
              <span>30%</span>
              <span>100%</span>
            </div>
            <div className="h-4 bg-white rounded-full overflow-hidden relative">
              <div className="absolute inset-0 flex">
                <div className="w-[10%] bg-measure/30" />
                <div className="w-[20%] bg-analyze/30" />
                <div className="flex-1 bg-control/30" />
              </div>
              <div
                className={cn(
                  'absolute h-full rounded-full',
                  stats.isAcceptable ? 'bg-measure' :
                  stats.isMarginal ? 'bg-analyze' : 'bg-control'
                )}
                style={{ width: `${Math.min(stats.percentGageRR, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Variation breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm">Gage R&R</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-control"
                style={{ width: `${stats.totalVariation > 0 ? (Math.pow(stats.gageRR, 2) / Math.pow(stats.totalVariation, 2)) * 100 : 0}%` }}
              />
            </div>
            <span className="w-16 text-right text-sm">
              {stats.totalVariation > 0 ? ((Math.pow(stats.gageRR, 2) / Math.pow(stats.totalVariation, 2)) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-32 text-sm">Variation pièces</span>
            <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-measure"
                style={{ width: `${stats.totalVariation > 0 ? (Math.pow(stats.partVariation, 2) / Math.pow(stats.totalVariation, 2)) * 100 : 0}%` }}
              />
            </div>
            <span className="w-16 text-right text-sm">
              {stats.totalVariation > 0 ? ((Math.pow(stats.partVariation, 2) / Math.pow(stats.totalVariation, 2)) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Conclusions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Conclusions</label>
          <textarea
            value={msaData.conclusions}
            onChange={(e) => updateData({ ...msaData, conclusions: e.target.value })}
            placeholder="Interprétation des résultats..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Recommandations</label>
          <textarea
            value={msaData.recommendations}
            onChange={(e) => updateData({ ...msaData, recommendations: e.target.value })}
            placeholder="Actions à mener si le système n'est pas acceptable..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types';

interface CTQMeasurement {
  id: string;
  customerNeed: string;
  ctqCharacteristic: string;
  specification: string;
  lowerLimit: number | null;
  target: number | null;
  upperLimit: number | null;
  unit: string;
  measureMethod: string;
  // Measurement data
  measuredValues: number[];
  sampleSize: number;
  mean: number | null;
  stdDev: number | null;
  min: number | null;
  max: number | null;
  // Capability
  cp: number | null;
  cpk: number | null;
  ppm: number | null;
  sigmaLevel: number | null;
  // Status
  status: 'not-measured' | 'in-spec' | 'out-of-spec' | 'marginal';
  notes: string;
}

interface CTQMeasureData {
  measurements: CTQMeasurement[];
  summary: {
    totalCTQs: number;
    measured: number;
    inSpec: number;
    outOfSpec: number;
    marginal: number;
    avgCpk: number | null;
  };
  measurementDate: string;
  measuredBy: string;
  overallConclusion: string;
}

interface CTQMeasureTemplateProps {
  data: CTQMeasureData | null;
  onChange: (data: CTQMeasureData) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const CTQMeasureTemplate: React.FC<CTQMeasureTemplateProps> = ({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}) => {
  const [localData, setLocalData] = useState<CTQMeasureData>(() => {
    return data || {
      measurements: [],
      summary: {
        totalCTQs: 0,
        measured: 0,
        inSpec: 0,
        outOfSpec: 0,
        marginal: 0,
        avgCpk: null,
      },
      measurementDate: new Date().toISOString().split('T')[0],
      measuredBy: '',
      overallConclusion: '',
    };
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [rawDataInput, setRawDataInput] = useState<string>('');

  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const updateData = (updates: Partial<CTQMeasureData>) => {
    const newData = { ...localData, ...updates };
    // Recalculate summary
    newData.summary = calculateSummary(newData.measurements);
    setLocalData(newData);
    onChange(newData);
  };

  const calculateSummary = (measurements: CTQMeasurement[]) => {
    const measured = measurements.filter(m => m.status !== 'not-measured').length;
    const inSpec = measurements.filter(m => m.status === 'in-spec').length;
    const outOfSpec = measurements.filter(m => m.status === 'out-of-spec').length;
    const marginal = measurements.filter(m => m.status === 'marginal').length;

    const cpkValues = measurements
      .filter(m => m.cpk !== null)
      .map(m => m.cpk as number);
    const avgCpk = cpkValues.length > 0
      ? cpkValues.reduce((a, b) => a + b, 0) / cpkValues.length
      : null;

    return {
      totalCTQs: measurements.length,
      measured,
      inSpec,
      outOfSpec,
      marginal,
      avgCpk,
    };
  };

  const addMeasurement = () => {
    const newMeasurement: CTQMeasurement = {
      id: Date.now().toString(),
      customerNeed: '',
      ctqCharacteristic: '',
      specification: '',
      lowerLimit: null,
      target: null,
      upperLimit: null,
      unit: '',
      measureMethod: '',
      measuredValues: [],
      sampleSize: 0,
      mean: null,
      stdDev: null,
      min: null,
      max: null,
      cp: null,
      cpk: null,
      ppm: null,
      sigmaLevel: null,
      status: 'not-measured',
      notes: '',
    };
    updateData({ measurements: [...localData.measurements, newMeasurement] });
    setEditingId(newMeasurement.id);
  };

  const updateMeasurement = (id: string, updates: Partial<CTQMeasurement>) => {
    const newMeasurements = localData.measurements.map(m =>
      m.id === id ? { ...m, ...updates } : m
    );
    updateData({ measurements: newMeasurements });
  };

  const deleteMeasurement = (id: string) => {
    const newMeasurements = localData.measurements.filter(m => m.id !== id);
    updateData({ measurements: newMeasurements });
  };

  // Calculate statistics and capability for a measurement
  const calculateMeasurementStats = (measurement: CTQMeasurement, values: number[]) => {
    if (values.length === 0) return measurement;

    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);

    let cp: number | null = null;
    let cpk: number | null = null;
    let ppm: number | null = null;
    let sigmaLevel: number | null = null;
    let status: CTQMeasurement['status'] = 'not-measured';

    if (measurement.upperLimit !== null && measurement.lowerLimit !== null && stdDev > 0) {
      const USL = measurement.upperLimit;
      const LSL = measurement.lowerLimit;

      // Cp = (USL - LSL) / (6 * sigma)
      cp = (USL - LSL) / (6 * stdDev);

      // Cpk = min((USL - mean) / (3 * sigma), (mean - LSL) / (3 * sigma))
      const cpkUpper = (USL - mean) / (3 * stdDev);
      const cpkLower = (mean - LSL) / (3 * stdDev);
      cpk = Math.min(cpkUpper, cpkLower);

      // PPM approximation based on Cpk
      // Using Z = 3 * Cpk
      const z = 3 * cpk;
      const defectRate = 2 * (1 - normalCDF(z));
      ppm = defectRate * 1000000;

      // Sigma level
      sigmaLevel = cpk * 3;

      // Determine status
      if (cpk >= 1.33) {
        status = 'in-spec';
      } else if (cpk >= 1.0) {
        status = 'marginal';
      } else {
        status = 'out-of-spec';
      }
    } else if (measurement.target !== null) {
      // If only target is specified, check if mean is close
      const deviation = Math.abs(mean - measurement.target);
      const tolerance = stdDev * 3;
      status = deviation <= tolerance ? 'in-spec' : 'out-of-spec';
    }

    return {
      ...measurement,
      measuredValues: values,
      sampleSize: n,
      mean,
      stdDev,
      min,
      max,
      cp,
      cpk,
      ppm,
      sigmaLevel,
      status,
    };
  };

  // Normal CDF approximation
  const normalCDF = (x: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  };

  const processRawData = (measurementId: string) => {
    const values = rawDataInput
      .split(/[\s,;\n]+/)
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      alert('Aucune valeur valide détectée');
      return;
    }

    const measurement = localData.measurements.find(m => m.id === measurementId);
    if (!measurement) return;

    const updatedMeasurement = calculateMeasurementStats(measurement, values);
    updateMeasurement(measurementId, updatedMeasurement);
    setRawDataInput('');
  };

  const getStatusColor = (status: CTQMeasurement['status']) => {
    switch (status) {
      case 'in-spec': return 'bg-green-100 text-green-800 border-green-200';
      case 'out-of-spec': return 'bg-red-100 text-red-800 border-red-200';
      case 'marginal': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: CTQMeasurement['status']) => {
    switch (status) {
      case 'in-spec': return '✅ Conforme';
      case 'out-of-spec': return '❌ Non conforme';
      case 'marginal': return '⚠️ Marginal';
      default: return '⏳ Non mesuré';
    }
  };

  const getCpkColor = (cpk: number | null) => {
    if (cpk === null) return 'text-gray-500';
    if (cpk >= 1.33) return 'text-green-600';
    if (cpk >= 1.0) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {toolDefinition?.nameFr || 'Mesure des CTQ'}
        </h2>
        <p className="text-teal-100">
          Mesurez les caractéristiques Critical To Quality définies en phase Define et calculez la capabilité du processus.
        </p>
      </div>

      {/* Summary Dashboard */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          Tableau de Bord
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-gray-800">{localData.summary.totalCTQs}</div>
            <div className="text-sm text-gray-600">CTQ Total</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-blue-600">{localData.summary.measured}</div>
            <div className="text-sm text-gray-600">Mesurés</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-green-600">{localData.summary.inSpec}</div>
            <div className="text-sm text-gray-600">Conformes</div>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-amber-600">{localData.summary.marginal}</div>
            <div className="text-sm text-gray-600">Marginaux</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold text-red-600">{localData.summary.outOfSpec}</div>
            <div className="text-sm text-gray-600">Non conformes</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className={`text-3xl font-bold ${getCpkColor(localData.summary.avgCpk)}`}>
              {localData.summary.avgCpk?.toFixed(2) || '-'}
            </div>
            <div className="text-sm text-gray-600">Cpk Moyen</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progression des mesures</span>
            <span>{localData.summary.measured}/{localData.summary.totalCTQs}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${localData.summary.totalCTQs > 0 ? (localData.summary.measured / localData.summary.totalCTQs) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Measurement Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de mesure
            </label>
            <input
              type="date"
              value={localData.measurementDate}
              onChange={(e) => updateData({ measurementDate: e.target.value })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mesuré par
            </label>
            <input
              type="text"
              value={localData.measuredBy}
              onChange={(e) => updateData({ measuredBy: e.target.value })}
              disabled={readOnly}
              placeholder="Nom du responsable de mesure"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Measurements List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-xl">📐</span>
            Caractéristiques CTQ
          </h3>
          {!readOnly && (
            <button
              onClick={addMeasurement}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Ajouter CTQ
            </button>
          )}
        </div>

        {localData.measurements.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-500">Aucun CTQ défini. Ajoutez les CTQ à mesurer.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {localData.measurements.map((measurement, index) => (
              <div
                key={measurement.id}
                className={`border-2 rounded-lg p-4 ${getStatusColor(measurement.status)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">
                    CTQ #{index + 1}: {measurement.ctqCharacteristic || 'Non défini'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(measurement.status)}`}>
                      {getStatusLabel(measurement.status)}
                    </span>
                    {!readOnly && (
                      <button
                        onClick={() => deleteMeasurement(measurement.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                {/* CTQ Definition */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Besoin client</label>
                    <input
                      type="text"
                      value={measurement.customerNeed}
                      onChange={(e) => updateMeasurement(measurement.id, { customerNeed: e.target.value })}
                      disabled={readOnly}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Besoin client"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Caractéristique CTQ</label>
                    <input
                      type="text"
                      value={measurement.ctqCharacteristic}
                      onChange={(e) => updateMeasurement(measurement.id, { ctqCharacteristic: e.target.value })}
                      disabled={readOnly}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Caractéristique"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Méthode de mesure</label>
                    <input
                      type="text"
                      value={measurement.measureMethod}
                      onChange={(e) => updateMeasurement(measurement.id, { measureMethod: e.target.value })}
                      disabled={readOnly}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Méthode"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unité</label>
                    <input
                      type="text"
                      value={measurement.unit}
                      onChange={(e) => updateMeasurement(measurement.id, { unit: e.target.value })}
                      disabled={readOnly}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Unité"
                    />
                  </div>
                </div>

                {/* Specifications */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Limite Inférieure (LSL)</label>
                    <input
                      type="number"
                      value={measurement.lowerLimit ?? ''}
                      onChange={(e) => updateMeasurement(measurement.id, { lowerLimit: e.target.value ? parseFloat(e.target.value) : null })}
                      disabled={readOnly}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="LSL"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cible</label>
                    <input
                      type="number"
                      value={measurement.target ?? ''}
                      onChange={(e) => updateMeasurement(measurement.id, { target: e.target.value ? parseFloat(e.target.value) : null })}
                      disabled={readOnly}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Target"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Limite Supérieure (USL)</label>
                    <input
                      type="number"
                      value={measurement.upperLimit ?? ''}
                      onChange={(e) => updateMeasurement(measurement.id, { upperLimit: e.target.value ? parseFloat(e.target.value) : null })}
                      disabled={readOnly}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="USL"
                    />
                  </div>
                </div>

                {/* Data Input */}
                {editingId === measurement.id && !readOnly && (
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entrez les données de mesure (séparées par virgules ou espaces)
                    </label>
                    <textarea
                      value={rawDataInput}
                      onChange={(e) => setRawDataInput(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                      placeholder="Ex: 10.2, 10.5, 10.3, 10.4, 10.1..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => processRawData(measurement.id)}
                        className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700 text-sm"
                      >
                        Calculer
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Results */}
                {measurement.sampleSize > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-lg font-bold text-gray-800">{measurement.sampleSize}</div>
                      <div className="text-xs text-gray-500">n</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-lg font-bold text-gray-800">{measurement.mean?.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">Moyenne</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-lg font-bold text-gray-800">{measurement.stdDev?.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">Écart-type</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-lg font-bold text-gray-800">{measurement.min?.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">Min</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-lg font-bold text-gray-800">{measurement.max?.toFixed(3)}</div>
                      <div className="text-xs text-gray-500">Max</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className={`text-lg font-bold ${getCpkColor(measurement.cp)}`}>{measurement.cp?.toFixed(2) ?? '-'}</div>
                      <div className="text-xs text-gray-500">Cp</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className={`text-lg font-bold ${getCpkColor(measurement.cpk)}`}>{measurement.cpk?.toFixed(2) ?? '-'}</div>
                      <div className="text-xs text-gray-500">Cpk</div>
                    </div>
                    <div className="bg-white p-2 rounded text-center">
                      <div className="text-lg font-bold text-gray-800">{measurement.ppm?.toFixed(0) ?? '-'}</div>
                      <div className="text-xs text-gray-500">PPM</div>
                    </div>
                  </div>
                )}

                {/* Add data button */}
                {!readOnly && editingId !== measurement.id && (
                  <button
                    onClick={() => {
                      setEditingId(measurement.id);
                      setRawDataInput(measurement.measuredValues.join(', '));
                    }}
                    className="mt-4 px-4 py-2 bg-white border border-teal-300 text-teal-700 rounded-lg hover:bg-teal-50 transition-colors text-sm"
                  >
                    {measurement.sampleSize > 0 ? '📝 Modifier les données' : '📊 Saisir les données'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conclusion */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Conclusion Générale
        </h3>

        <textarea
          value={localData.overallConclusion}
          onChange={(e) => updateData({ overallConclusion: e.target.value })}
          disabled={readOnly}
          rows={4}
          placeholder="Documentez la conclusion des mesures CTQ, les problèmes identifiés et les actions recommandées..."
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Guide */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span>
          Guide d'Interprétation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Indicateurs de Capabilité</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><strong>Cp:</strong> Capabilité potentielle (si processus centré)</li>
              <li><strong>Cpk:</strong> Capabilité réelle (tient compte du centrage)</li>
              <li>Cpk ≥ 1.33 : Processus capable ✅</li>
              <li>1.0 ≤ Cpk &lt; 1.33 : Processus marginal ⚠️</li>
              <li>Cpk &lt; 1.0 : Processus non capable ❌</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Correspondance Sigma</h4>
            <table className="text-sm w-full">
              <thead>
                <tr className="text-left">
                  <th className="py-1">Cpk</th>
                  <th className="py-1">Sigma</th>
                  <th className="py-1">PPM</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr><td>0.33</td><td>1σ</td><td>697,672</td></tr>
                <tr><td>0.67</td><td>2σ</td><td>308,770</td></tr>
                <tr><td>1.00</td><td>3σ</td><td>66,807</td></tr>
                <tr><td>1.33</td><td>4σ</td><td>6,210</td></tr>
                <tr><td>1.67</td><td>5σ</td><td>233</td></tr>
                <tr><td>2.00</td><td>6σ</td><td>3.4</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTQMeasureTemplate;

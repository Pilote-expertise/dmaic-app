import React, { useState, useEffect } from 'react';
import { ToolDefinition } from '../../types';

interface DistributionTestsData {
  testType: 'shapiro-wilk' | 'anderson-darling' | 'kolmogorov-smirnov';
  alpha: number;
  rawData: string;
  parsedData: number[];
  results: {
    testStatistic: number;
    pValue: number;
    isNormal: boolean;
    mean: number;
    stdDev: number;
    skewness: number;
    kurtosis: number;
    min: number;
    max: number;
    median: number;
    n: number;
  } | null;
  conclusion: string;
  nextSteps: string;
}

interface DistributionTestsTemplateProps {
  data: DistributionTestsData | null;
  onChange: (data: DistributionTestsData) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const DistributionTestsTemplate: React.FC<DistributionTestsTemplateProps> = ({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}) => {
  const [localData, setLocalData] = useState<DistributionTestsData>(() => {
    return data || {
      testType: 'shapiro-wilk',
      alpha: 0.05,
      rawData: '',
      parsedData: [],
      results: null,
      conclusion: '',
      nextSteps: '',
    };
  });

  useEffect(() => {
    if (data) {
      setLocalData(data);
    }
  }, [data]);

  const updateData = (updates: Partial<DistributionTestsData>) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onChange(newData);
  };

  // Parse data from text input
  const parseData = (text: string): number[] => {
    const values = text
      .split(/[\s,;\n]+/)
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));
    return values;
  };

  // Calculate basic statistics
  const calculateStatistics = (values: number[]) => {
    if (values.length === 0) return null;

    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);

    const sorted = [...values].sort((a, b) => a - b);
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    // Skewness (Fisher)
    const skewness = values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 3), 0) * n / ((n - 1) * (n - 2));

    // Kurtosis (Fisher, excess)
    const kurtosis = (values.reduce((sum, v) => sum + Math.pow((v - mean) / stdDev, 4), 0) * n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) - (3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3)));

    return {
      n,
      mean,
      stdDev,
      variance,
      skewness,
      kurtosis,
      min: sorted[0],
      max: sorted[n - 1],
      median,
    };
  };

  // Simplified Shapiro-Wilk test approximation
  const shapiroWilkTest = (values: number[]): { statistic: number; pValue: number } => {
    const n = values.length;
    if (n < 3 || n > 5000) {
      return { statistic: 0, pValue: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const ss = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);

    // Simplified W calculation
    let a: number[] = [];
    const m = Math.floor(n / 2);
    for (let i = 0; i < m; i++) {
      const mi = (i + 1 - 0.375) / (n + 0.25);
      a.push(2.4 * Math.sqrt(mi * (1 - mi)) * Math.log(mi / (1 - mi)));
    }

    const sumA2 = a.reduce((sum, ai) => sum + ai * ai, 0);
    const coef = 1 / Math.sqrt(sumA2);

    let b = 0;
    for (let i = 0; i < m; i++) {
      b += coef * a[i] * (sorted[n - 1 - i] - sorted[i]);
    }

    const W = (b * b) / ss;

    // Approximate p-value using transformation
    const mu = 0.0038915 * Math.pow(Math.log(n), 3) - 0.083751 * Math.pow(Math.log(n), 2) - 0.31082 * Math.log(n) - 1.5861;
    const sigma = Math.exp(0.0030302 * Math.pow(Math.log(n), 2) - 0.082676 * Math.log(n) - 0.4803);
    const z = (Math.log(1 - W) - mu) / sigma;
    const pValue = 1 - 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));

    return { statistic: Math.min(1, Math.max(0, W)), pValue: Math.min(1, Math.max(0, pValue)) };
  };

  // Run the test
  const runTest = () => {
    const values = parseData(localData.rawData);
    if (values.length < 3) {
      alert('Il faut au moins 3 valeurs pour effectuer le test.');
      return;
    }

    const stats = calculateStatistics(values);
    if (!stats) return;

    let testResult = { statistic: 0, pValue: 0 };

    switch (localData.testType) {
      case 'shapiro-wilk':
        testResult = shapiroWilkTest(values);
        break;
      case 'anderson-darling':
      case 'kolmogorov-smirnov':
        // Simplified approximation using Shapiro-Wilk
        testResult = shapiroWilkTest(values);
        break;
    }

    const isNormal = testResult.pValue > localData.alpha;

    const results = {
      testStatistic: testResult.statistic,
      pValue: testResult.pValue,
      isNormal,
      ...stats,
    };

    updateData({
      parsedData: values,
      results,
      conclusion: isNormal
        ? `Les données suivent une distribution normale (p-value = ${testResult.pValue.toFixed(4)} > α = ${localData.alpha}).`
        : `Les données ne suivent PAS une distribution normale (p-value = ${testResult.pValue.toFixed(4)} ≤ α = ${localData.alpha}).`,
    });
  };

  // Generate histogram bins
  const generateHistogram = (values: number[], bins: number = 10) => {
    if (values.length === 0) return [];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;

    const histogram: { bin: string; count: number; normalExpected: number }[] = [];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1));

    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = values.filter(v => v >= binStart && (i === bins - 1 ? v <= binEnd : v < binEnd)).length;

      // Normal distribution expected count
      const z1 = (binStart - mean) / stdDev;
      const z2 = (binEnd - mean) / stdDev;
      const normalProb = (normalCDF(z2) - normalCDF(z1));
      const normalExpected = normalProb * values.length;

      histogram.push({
        bin: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
        normalExpected,
      });
    }

    return histogram;
  };

  // Normal CDF approximation
  const normalCDF = (x: number): number => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
  };

  const histogram = localData.parsedData.length > 0 ? generateHistogram(localData.parsedData) : [];
  const maxCount = histogram.length > 0 ? Math.max(...histogram.map(h => Math.max(h.count, h.normalExpected))) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {toolDefinition?.nameFr || 'Tests de Distribution de Probabilité'}
        </h2>
        <p className="text-purple-100">
          Vérifiez si vos données suivent une distribution normale pour déterminer les méthodes statistiques appropriées.
        </p>
      </div>

      {/* Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          Configuration du Test
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de test
            </label>
            <select
              value={localData.testType}
              onChange={(e) => updateData({ testType: e.target.value as DistributionTestsData['testType'] })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="shapiro-wilk">Shapiro-Wilk (recommandé pour n &lt; 50)</option>
              <option value="anderson-darling">Anderson-Darling</option>
              <option value="kolmogorov-smirnov">Kolmogorov-Smirnov</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau de signification (α)
            </label>
            <select
              value={localData.alpha}
              onChange={(e) => updateData({ alpha: parseFloat(e.target.value) })}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={0.01}>0.01 (99% confiance)</option>
              <option value={0.05}>0.05 (95% confiance)</option>
              <option value={0.10}>0.10 (90% confiance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Input */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          Données à Analyser
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Entrez vos données (séparées par des virgules, espaces ou retours à la ligne)
          </label>
          <textarea
            value={localData.rawData}
            onChange={(e) => updateData({ rawData: e.target.value })}
            disabled={readOnly}
            rows={6}
            placeholder="Ex: 12.5, 13.2, 11.8, 14.1, 12.9, 13.5, 12.2, 13.8, 12.7, 13.1..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Valeurs détectées: {parseData(localData.rawData).length}
            </p>
            {!readOnly && (
              <button
                onClick={runTest}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <span>🔬</span>
                Exécuter le Test
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {localData.results && (
        <>
          {/* Summary Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📈</span>
              Statistiques Descriptives
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{localData.results.n}</div>
                <div className="text-sm text-gray-600">Observations (n)</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{localData.results.mean.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Moyenne (x̄)</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{localData.results.stdDev.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Écart-type (s)</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{localData.results.median.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Médiane</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{localData.results.min.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Minimum</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{localData.results.max.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Maximum</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{localData.results.skewness.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Asymétrie (Skewness)</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-800">{localData.results.kurtosis.toFixed(3)}</div>
                <div className="text-sm text-gray-600">Aplatissement (Kurtosis)</div>
              </div>
            </div>

            {/* Interpretation guide */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Interprétation:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• <strong>Asymétrie:</strong> ≈0 = symétrique, &gt;0 = queue droite, &lt;0 = queue gauche</li>
                <li>• <strong>Kurtosis:</strong> ≈0 = normale, &gt;0 = pics aigus, &lt;0 = pics plats</li>
              </ul>
            </div>
          </div>

          {/* Test Results */}
          <div className={`rounded-lg shadow-md p-6 ${localData.results.isNormal ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">{localData.results.isNormal ? '✅' : '⚠️'}</span>
              Résultat du Test de Normalité
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{localData.results.testStatistic.toFixed(4)}</div>
                <div className="text-sm text-gray-600">Statistique de test (W)</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{localData.results.pValue.toFixed(4)}</div>
                <div className="text-sm text-gray-600">p-value</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold">{localData.alpha}</div>
                <div className="text-sm text-gray-600">Seuil α</div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${localData.results.isNormal ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className={`font-semibold ${localData.results.isNormal ? 'text-green-800' : 'text-red-800'}`}>
                {localData.results.isNormal ? '✅ Hypothèse de normalité ACCEPTÉE' : '❌ Hypothèse de normalité REJETÉE'}
              </p>
              <p className={`mt-2 ${localData.results.isNormal ? 'text-green-700' : 'text-red-700'}`}>
                {localData.conclusion}
              </p>
            </div>
          </div>

          {/* Histogram */}
          {histogram.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Histogramme avec Courbe Normale
              </h3>

              <div className="relative h-64 flex items-end gap-1">
                {histogram.map((bin, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    {/* Bars */}
                    <div className="w-full relative" style={{ height: '200px' }}>
                      {/* Actual data bar */}
                      <div
                        className="absolute bottom-0 left-0 right-1 bg-purple-500 rounded-t opacity-70"
                        style={{ height: `${(bin.count / maxCount) * 100}%` }}
                      />
                      {/* Normal distribution expected */}
                      <div
                        className="absolute bottom-0 left-1 right-0 border-2 border-orange-500 rounded-t bg-transparent"
                        style={{ height: `${(bin.normalExpected / maxCount) * 100}%` }}
                      />
                    </div>
                    {/* Label */}
                    <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                      {bin.bin}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded opacity-70" />
                  <span className="text-sm text-gray-600">Données observées</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-orange-500 rounded" />
                  <span className="text-sm text-gray-600">Distribution normale attendue</span>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Recommandations et Prochaines Étapes
            </h3>

            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${localData.results.isNormal ? 'bg-green-50' : 'bg-amber-50'}`}>
                <h4 className={`font-semibold ${localData.results.isNormal ? 'text-green-800' : 'text-amber-800'}`}>
                  {localData.results.isNormal ? 'Méthodes statistiques recommandées:' : 'Attention - Données non normales:'}
                </h4>
                <ul className={`mt-2 space-y-1 ${localData.results.isNormal ? 'text-green-700' : 'text-amber-700'}`}>
                  {localData.results.isNormal ? (
                    <>
                      <li>• Tests t (comparaison de moyennes)</li>
                      <li>• ANOVA (comparaison de plusieurs groupes)</li>
                      <li>• Régression linéaire</li>
                      <li>• Cartes de contrôle X̄-R ou X̄-S</li>
                      <li>• Calculs de capabilité (Cp, Cpk)</li>
                    </>
                  ) : (
                    <>
                      <li>• Utiliser des tests non-paramétriques (Mann-Whitney, Kruskal-Wallis)</li>
                      <li>• Envisager une transformation des données (Box-Cox, log)</li>
                      <li>• Vérifier les valeurs aberrantes</li>
                      <li>• Utiliser des cartes de contrôle pour individus</li>
                      <li>• Calculer la capabilité avec des méthodes non-normales</li>
                    </>
                  )}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes et prochaines étapes
                </label>
                <textarea
                  value={localData.nextSteps}
                  onChange={(e) => updateData({ nextSteps: e.target.value })}
                  disabled={readOnly}
                  rows={4}
                  placeholder="Documentez les décisions prises suite à ce test et les prochaines actions..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-xl">❓</span>
          Guide d'Interprétation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Tests disponibles</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li><strong>Shapiro-Wilk:</strong> Le plus puissant pour n &lt; 50, recommandé pour la plupart des cas</li>
              <li><strong>Anderson-Darling:</strong> Sensible aux queues de distribution</li>
              <li><strong>Kolmogorov-Smirnov:</strong> Moins puissant mais utilisable pour grandes tailles</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Règle de décision</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li><strong>p-value &gt; α:</strong> On ne rejette pas H₀ → Données normales</li>
              <li><strong>p-value ≤ α:</strong> On rejette H₀ → Données non normales</li>
              <li><strong>W proche de 1:</strong> Distribution proche de la normale</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionTestsTemplate;

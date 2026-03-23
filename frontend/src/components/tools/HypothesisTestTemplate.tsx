import { useState, useEffect, useMemo } from 'react';
import { FlaskConical, Info, CheckCircle2, XCircle, Plus, Trash2 } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

type TestType = 't_test_one' | 't_test_two' | 't_test_paired' | 'proportion_one' | 'proportion_two' | 'variance' | 'anova';

interface HypothesisTestData {
  testName: string;
  testType: TestType;
  hypothesis: string;
  nullHypothesis: string;
  alternativeHypothesis: string;
  significanceLevel: number;
  testDirection: 'two_tailed' | 'left_tailed' | 'right_tailed';
  sample1: {
    name: string;
    data: number[];
    mean?: number;
    stdDev?: number;
    n?: number;
  };
  sample2: {
    name: string;
    data: number[];
    mean?: number;
    stdDev?: number;
    n?: number;
  };
  hypothesizedValue: number | null;
  context: string;
  conclusion: string;
  notes: string;
}

interface HypothesisTestTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const testTypeOptions: { value: TestType; label: string; description: string }[] = [
  { value: 't_test_one', label: 'Test t - Un échantillon', description: 'Comparer une moyenne à une valeur de référence' },
  { value: 't_test_two', label: 'Test t - Deux échantillons', description: 'Comparer les moyennes de deux groupes indépendants' },
  { value: 't_test_paired', label: 'Test t - Appariés', description: 'Comparer avant/après sur les mêmes individus' },
  { value: 'proportion_one', label: 'Test de proportion - Un échantillon', description: 'Comparer une proportion à une valeur de référence' },
  { value: 'proportion_two', label: 'Test de proportion - Deux échantillons', description: 'Comparer les proportions de deux groupes' },
  { value: 'variance', label: 'Test de variance (Chi-carré)', description: 'Tester si la variance est égale à une valeur' },
  { value: 'anova', label: 'ANOVA', description: 'Comparer les moyennes de plus de deux groupes' },
];

// Statistical helper functions
const calculateMean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
};

const calculateStdDev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const calculateVariance = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / (values.length - 1);
};

// T-distribution critical values (approximate)
const tCritical = (alpha: number, df: number, twoTailed: boolean): number => {
  const a = twoTailed ? alpha / 2 : alpha;
  // Approximation using normal distribution for large df
  if (df >= 30) {
    const zValues: Record<number, number> = {
      0.10: 1.282, 0.05: 1.645, 0.025: 1.96, 0.01: 2.326, 0.005: 2.576
    };
    return zValues[a] || 1.96;
  }
  // Simplified critical values for small samples
  const tTable: Record<number, Record<number, number>> = {
    1: { 0.10: 3.078, 0.05: 6.314, 0.025: 12.706, 0.01: 31.821, 0.005: 63.657 },
    5: { 0.10: 1.476, 0.05: 2.015, 0.025: 2.571, 0.01: 3.365, 0.005: 4.032 },
    10: { 0.10: 1.372, 0.05: 1.812, 0.025: 2.228, 0.01: 2.764, 0.005: 3.169 },
    20: { 0.10: 1.325, 0.05: 1.725, 0.025: 2.086, 0.01: 2.528, 0.005: 2.845 },
    30: { 0.10: 1.310, 0.05: 1.697, 0.025: 2.042, 0.01: 2.457, 0.005: 2.750 },
  };
  const closestDf = Object.keys(tTable).map(Number).reduce((prev, curr) =>
    Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
  );
  return tTable[closestDf]?.[a] || 1.96;
};

// Standard normal CDF (for p-value approximation)
const normalCDF = (x: number): number => {
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
};

// Approximate p-value from t-statistic
const tDistPValue = (t: number, _df: number, twoTailed: boolean): number => {
  // Approximation using normal distribution
  const pOneTailed = 1 - normalCDF(Math.abs(t));
  return twoTailed ? 2 * pOneTailed : pOneTailed;
};

export default function HypothesisTestTemplate({
  data,
  onChange,
  readOnly = false,
}: HypothesisTestTemplateProps) {
  const [testData, setTestData] = useState<HypothesisTestData>({
    testName: data.testName || '',
    testType: data.testType || 't_test_two',
    hypothesis: data.hypothesis || '',
    nullHypothesis: data.nullHypothesis || '',
    alternativeHypothesis: data.alternativeHypothesis || '',
    significanceLevel: data.significanceLevel || 0.05,
    testDirection: data.testDirection || 'two_tailed',
    sample1: data.sample1 || { name: 'Échantillon 1', data: [] },
    sample2: data.sample2 || { name: 'Échantillon 2', data: [] },
    hypothesizedValue: data.hypothesizedValue ?? null,
    context: data.context || '',
    conclusion: data.conclusion || '',
    notes: data.notes || '',
  });

  const [sample1Input, setSample1Input] = useState('');
  const [sample2Input, setSample2Input] = useState('');

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setTestData({
        testName: data.testName || '',
        testType: data.testType || 't_test_two',
        hypothesis: data.hypothesis || '',
        nullHypothesis: data.nullHypothesis || '',
        alternativeHypothesis: data.alternativeHypothesis || '',
        significanceLevel: data.significanceLevel || 0.05,
        testDirection: data.testDirection || 'two_tailed',
        sample1: data.sample1 || { name: 'Échantillon 1', data: [] },
        sample2: data.sample2 || { name: 'Échantillon 2', data: [] },
        hypothesizedValue: data.hypothesizedValue ?? null,
        context: data.context || '',
        conclusion: data.conclusion || '',
        notes: data.notes || '',
      });
    }
  }, [data]);

  const updateData = (newData: HypothesisTestData) => {
    setTestData(newData);
    onChange(newData);
  };

  const addSample1Data = () => {
    const values = sample1Input
      .split(/[\s,;]+/)
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));
    if (values.length > 0) {
      updateData({
        ...testData,
        sample1: { ...testData.sample1, data: [...testData.sample1.data, ...values] }
      });
      setSample1Input('');
    }
  };

  const addSample2Data = () => {
    const values = sample2Input
      .split(/[\s,;]+/)
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));
    if (values.length > 0) {
      updateData({
        ...testData,
        sample2: { ...testData.sample2, data: [...testData.sample2.data, ...values] }
      });
      setSample2Input('');
    }
  };

  const clearSample = (sample: 'sample1' | 'sample2') => {
    updateData({
      ...testData,
      [sample]: { ...testData[sample], data: [] }
    });
  };

  // Calculate test results
  const results = useMemo(() => {
    const s1 = testData.sample1.data;
    const s2 = testData.sample2.data;
    const mu0 = testData.hypothesizedValue ?? 0;
    const alpha = testData.significanceLevel;
    const twoTailed = testData.testDirection === 'two_tailed';

    if (testData.testType === 't_test_one') {
      if (s1.length < 2) return null;
      const n = s1.length;
      const mean = calculateMean(s1);
      const stdDev = calculateStdDev(s1);
      const se = stdDev / Math.sqrt(n);
      const tStat = (mean - mu0) / se;
      const df = n - 1;
      const tCrit = tCritical(alpha, df, twoTailed);
      const pValue = tDistPValue(tStat, df, twoTailed);
      const reject = Math.abs(tStat) > tCrit;

      return {
        testType: 'Test t - Un échantillon',
        n1: n, mean1: mean, stdDev1: stdDev, se,
        tStatistic: tStat, df, tCritical: tCrit, pValue,
        rejectNull: reject,
        confidenceInterval: [
          mean - tCrit * se,
          mean + tCrit * se
        ]
      };
    }

    if (testData.testType === 't_test_two') {
      if (s1.length < 2 || s2.length < 2) return null;
      const n1 = s1.length;
      const n2 = s2.length;
      const mean1 = calculateMean(s1);
      const mean2 = calculateMean(s2);
      const var1 = calculateVariance(s1);
      const var2 = calculateVariance(s2);

      // Pooled variance
      const sp2 = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
      const se = Math.sqrt(sp2 * (1/n1 + 1/n2));
      const tStat = (mean1 - mean2 - mu0) / se;
      const df = n1 + n2 - 2;
      const tCrit = tCritical(alpha, df, twoTailed);
      const pValue = tDistPValue(tStat, df, twoTailed);
      const reject = Math.abs(tStat) > tCrit;

      return {
        testType: 'Test t - Deux échantillons',
        n1, mean1, stdDev1: Math.sqrt(var1),
        n2, mean2, stdDev2: Math.sqrt(var2),
        pooledStdDev: Math.sqrt(sp2), se,
        tStatistic: tStat, df, tCritical: tCrit, pValue,
        rejectNull: reject,
        difference: mean1 - mean2,
        confidenceInterval: [
          (mean1 - mean2) - tCrit * se,
          (mean1 - mean2) + tCrit * se
        ]
      };
    }

    if (testData.testType === 't_test_paired') {
      if (s1.length < 2 || s1.length !== s2.length) return null;
      const differences = s1.map((val, i) => val - s2[i]);
      const n = differences.length;
      const meanDiff = calculateMean(differences);
      const stdDevDiff = calculateStdDev(differences);
      const se = stdDevDiff / Math.sqrt(n);
      const tStat = (meanDiff - mu0) / se;
      const df = n - 1;
      const tCrit = tCritical(alpha, df, twoTailed);
      const pValue = tDistPValue(tStat, df, twoTailed);
      const reject = Math.abs(tStat) > tCrit;

      return {
        testType: 'Test t - Appariés',
        n1: n, meanDiff, stdDevDiff, se,
        tStatistic: tStat, df, tCritical: tCrit, pValue,
        rejectNull: reject,
        confidenceInterval: [
          meanDiff - tCrit * se,
          meanDiff + tCrit * se
        ]
      };
    }

    return null;
  }, [testData]);

  const needsTwoSamples = ['t_test_two', 't_test_paired', 'proportion_two', 'anova'].includes(testData.testType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-analyze flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Test d'Hypothèse</h2>
            <p className="text-sm text-gray-500">
              Analyse statistique pour valider ou rejeter une hypothèse
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom du test</label>
            <input
              type="text"
              value={testData.testName}
              onChange={(e) => updateData({ ...testData, testName: e.target.value })}
              placeholder="Ex: Comparaison rendement avant/après"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type de test</label>
            <select
              value={testData.testType}
              onChange={(e) => updateData({ ...testData, testType: e.target.value as TestType })}
              className="input"
              disabled={readOnly}
            >
              {testTypeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Contexte / Problématique</label>
          <textarea
            value={testData.context}
            onChange={(e) => updateData({ ...testData, context: e.target.value })}
            placeholder="Décrivez le contexte de votre test statistique..."
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
            <p className="font-medium mb-1">
              {testTypeOptions.find(t => t.value === testData.testType)?.label}
            </p>
            <p className="text-blue-700">
              {testTypeOptions.find(t => t.value === testData.testType)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Hypotheses */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Formulation des hypothèses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              H₀ (Hypothèse nulle)
            </label>
            <input
              type="text"
              value={testData.nullHypothesis}
              onChange={(e) => updateData({ ...testData, nullHypothesis: e.target.value })}
              placeholder="Ex: μ₁ = μ₂ (les moyennes sont égales)"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              H₁ (Hypothèse alternative)
            </label>
            <input
              type="text"
              value={testData.alternativeHypothesis}
              onChange={(e) => updateData({ ...testData, alternativeHypothesis: e.target.value })}
              placeholder="Ex: μ₁ ≠ μ₂ (les moyennes sont différentes)"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">Niveau de signification (α)</label>
            <select
              value={testData.significanceLevel}
              onChange={(e) => updateData({ ...testData, significanceLevel: parseFloat(e.target.value) })}
              className="input"
              disabled={readOnly}
            >
              <option value={0.10}>0.10 (90% confiance)</option>
              <option value={0.05}>0.05 (95% confiance)</option>
              <option value={0.01}>0.01 (99% confiance)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Direction du test</label>
            <select
              value={testData.testDirection}
              onChange={(e) => updateData({ ...testData, testDirection: e.target.value as any })}
              className="input"
              disabled={readOnly}
            >
              <option value="two_tailed">Bilatéral (≠)</option>
              <option value="left_tailed">Unilatéral gauche (&lt;)</option>
              <option value="right_tailed">Unilatéral droit (&gt;)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Valeur de référence (μ₀)</label>
            <input
              type="number"
              step="any"
              value={testData.hypothesizedValue ?? ''}
              onChange={(e) => updateData({
                ...testData,
                hypothesizedValue: e.target.value ? parseFloat(e.target.value) : null
              })}
              placeholder="Ex: 0 pour comparer"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Sample Data Entry */}
      <div className={cn('grid gap-6', needsTwoSamples ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
        {/* Sample 1 */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="block text-sm font-medium">
                {testData.testType === 't_test_paired' ? 'Mesures "Avant"' : 'Échantillon 1'}
              </label>
              <input
                type="text"
                value={testData.sample1.name}
                onChange={(e) => updateData({
                  ...testData,
                  sample1: { ...testData.sample1, name: e.target.value }
                })}
                placeholder="Nom du groupe"
                className="input mt-1 text-sm"
                disabled={readOnly}
              />
            </div>
            <span className="text-sm text-gray-500">
              n = {testData.sample1.data.length}
            </span>
          </div>

          {!readOnly && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={sample1Input}
                onChange={(e) => setSample1Input(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSample1Data()}
                placeholder="Entrez les valeurs (séparées par virgules)"
                className="input flex-1 text-sm"
              />
              <button onClick={addSample1Data} className="btn btn-primary btn-sm">
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => clearSample('sample1')}
                className="btn btn-secondary btn-sm text-control"
                disabled={testData.sample1.data.length === 0}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 min-h-[80px] max-h-[120px] overflow-auto">
            {testData.sample1.data.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {testData.sample1.data.map((val, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white border rounded text-xs font-mono">
                    {val}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center text-sm">Aucune donnée</p>
            )}
          </div>

          {testData.sample1.data.length >= 2 && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-gray-100 rounded p-2">
                <div className="text-gray-500">Moyenne</div>
                <div className="font-bold">{calculateMean(testData.sample1.data).toFixed(3)}</div>
              </div>
              <div className="bg-gray-100 rounded p-2">
                <div className="text-gray-500">Écart-type</div>
                <div className="font-bold">{calculateStdDev(testData.sample1.data).toFixed(3)}</div>
              </div>
              <div className="bg-gray-100 rounded p-2">
                <div className="text-gray-500">n</div>
                <div className="font-bold">{testData.sample1.data.length}</div>
              </div>
            </div>
          )}
        </div>

        {/* Sample 2 - only for two-sample tests */}
        {needsTwoSamples && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium">
                  {testData.testType === 't_test_paired' ? 'Mesures "Après"' : 'Échantillon 2'}
                </label>
                <input
                  type="text"
                  value={testData.sample2.name}
                  onChange={(e) => updateData({
                    ...testData,
                    sample2: { ...testData.sample2, name: e.target.value }
                  })}
                  placeholder="Nom du groupe"
                  className="input mt-1 text-sm"
                  disabled={readOnly}
                />
              </div>
              <span className="text-sm text-gray-500">
                n = {testData.sample2.data.length}
              </span>
            </div>

            {!readOnly && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={sample2Input}
                  onChange={(e) => setSample2Input(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSample2Data()}
                  placeholder="Entrez les valeurs (séparées par virgules)"
                  className="input flex-1 text-sm"
                />
                <button onClick={addSample2Data} className="btn btn-primary btn-sm">
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => clearSample('sample2')}
                  className="btn btn-secondary btn-sm text-control"
                  disabled={testData.sample2.data.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3 min-h-[80px] max-h-[120px] overflow-auto">
              {testData.sample2.data.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {testData.sample2.data.map((val, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-white border rounded text-xs font-mono">
                      {val}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center text-sm">Aucune donnée</p>
              )}
            </div>

            {testData.sample2.data.length >= 2 && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-gray-100 rounded p-2">
                  <div className="text-gray-500">Moyenne</div>
                  <div className="font-bold">{calculateMean(testData.sample2.data).toFixed(3)}</div>
                </div>
                <div className="bg-gray-100 rounded p-2">
                  <div className="text-gray-500">Écart-type</div>
                  <div className="font-bold">{calculateStdDev(testData.sample2.data).toFixed(3)}</div>
                </div>
                <div className="bg-gray-100 rounded p-2">
                  <div className="text-gray-500">n</div>
                  <div className="font-bold">{testData.sample2.data.length}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Résultats du test</h3>

          {/* Decision */}
          <div className={cn(
            'p-6 rounded-xl mb-6 flex items-center gap-4',
            results.rejectNull ? 'bg-improve-light' : 'bg-analyze-light'
          )}>
            {results.rejectNull ? (
              <CheckCircle2 className="w-12 h-12 text-improve" />
            ) : (
              <XCircle className="w-12 h-12 text-analyze" />
            )}
            <div>
              <h4 className="text-xl font-bold">
                {results.rejectNull ? 'H₀ Rejetée' : 'H₀ Non Rejetée'}
              </h4>
              <p className="text-gray-600">
                {results.rejectNull
                  ? `La différence est statistiquement significative (p = ${results.pValue.toFixed(4)} < α = ${testData.significanceLevel})`
                  : `La différence n'est pas statistiquement significative (p = ${results.pValue.toFixed(4)} ≥ α = ${testData.significanceLevel})`
                }
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500">Statistique t</div>
              <div className="text-2xl font-bold">{results.tStatistic.toFixed(3)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500">t critique</div>
              <div className="text-2xl font-bold">±{results.tCritical.toFixed(3)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500">Degrés de liberté</div>
              <div className="text-2xl font-bold">{results.df}</div>
            </div>
            <div className={cn(
              'rounded-lg p-4 text-center',
              results.pValue < testData.significanceLevel ? 'bg-improve-light' : 'bg-gray-50'
            )}>
              <div className="text-sm text-gray-500">p-value</div>
              <div className="text-2xl font-bold">{results.pValue.toFixed(4)}</div>
            </div>
          </div>

          {/* Confidence Interval */}
          {results.confidenceInterval && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">
                Intervalle de confiance ({(1 - testData.significanceLevel) * 100}%)
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-4">
                  <span className="font-mono">[{results.confidenceInterval[0].toFixed(4)}</span>
                  <span className="text-gray-400">;</span>
                  <span className="font-mono">{results.confidenceInterval[1].toFixed(4)}]</span>
                </div>
              </div>
            </div>
          )}

          {/* Visual representation */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Visualisation</h4>
            <div className="relative h-24 bg-gray-50 rounded-lg overflow-hidden">
              {/* Normal distribution curve (simplified) */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Critical regions */}
                <div className="absolute left-0 top-0 bottom-0 w-[15%] bg-control/20" />
                <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-control/20" />

                {/* Center line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300" />

                {/* Critical values */}
                <div className="absolute top-1/2 -translate-y-1/2 left-[15%] w-0.5 h-8 bg-control">
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-control whitespace-nowrap">
                    -{results.tCritical.toFixed(2)}
                  </span>
                </div>
                <div className="absolute top-1/2 -translate-y-1/2 right-[15%] w-0.5 h-8 bg-control">
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-control whitespace-nowrap">
                    +{results.tCritical.toFixed(2)}
                  </span>
                </div>

                {/* Test statistic */}
                <div
                  className={cn(
                    'absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg',
                    results.rejectNull ? 'bg-improve' : 'bg-analyze'
                  )}
                  style={{
                    left: `${50 + Math.max(-40, Math.min(40, results.tStatistic * 10))}%`
                  }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold whitespace-nowrap">
                    t = {results.tStatistic.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Zone de rejet</span>
              <span>Zone d'acceptation</span>
              <span>Zone de rejet</span>
            </div>
          </div>
        </div>
      )}

      {/* Conclusion */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Conclusion et interprétation</label>
        <textarea
          value={testData.conclusion}
          onChange={(e) => updateData({ ...testData, conclusion: e.target.value })}
          placeholder="Rédigez votre conclusion basée sur les résultats du test..."
          className="input min-h-[100px] resize-none"
          disabled={readOnly}
        />
      </div>

      {/* Reference Table */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Table de décision</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">p-value</th>
                <th className="px-4 py-2 text-left">Décision</th>
                <th className="px-4 py-2 text-left">Signification</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2 font-mono">p &lt; 0.001</td>
                <td className="px-4 py-2 text-improve font-medium">Rejeter H₀</td>
                <td className="px-4 py-2">Très hautement significatif (***)</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2 font-mono">p &lt; 0.01</td>
                <td className="px-4 py-2 text-improve font-medium">Rejeter H₀</td>
                <td className="px-4 py-2">Hautement significatif (**)</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2 font-mono">p &lt; 0.05</td>
                <td className="px-4 py-2 text-improve font-medium">Rejeter H₀</td>
                <td className="px-4 py-2">Significatif (*)</td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-2 font-mono">p ≥ 0.05</td>
                <td className="px-4 py-2 text-analyze font-medium">Ne pas rejeter H₀</td>
                <td className="px-4 py-2">Non significatif</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Notes et observations</label>
        <textarea
          value={testData.notes}
          onChange={(e) => updateData({ ...testData, notes: e.target.value })}
          placeholder="Hypothèses du test, limites, points d'attention..."
          className="input min-h-[100px] resize-none"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

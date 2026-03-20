import { useState, useEffect, useMemo } from 'react';
import { Beaker, Info, Plus, Trash2, Play, BarChart3 } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface Factor {
  id: string;
  name: string;
  lowLevel: string;
  highLevel: string;
  unit: string;
}

interface Experiment {
  id: string;
  runOrder: number;
  standardOrder: number;
  factorLevels: Record<string, '-1' | '+1'>;
  response: number | null;
  replicate: number;
}

interface DOEData {
  experimentName: string;
  objective: string;
  responseVariable: string;
  responseUnit: string;
  factors: Factor[];
  experiments: Experiment[];
  designType: 'full_factorial' | 'fractional' | 'screening';
  replicates: number;
  centerPoints: number;
  notes: string;
  conclusions: string;
}

interface DOETemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyFactor = (): Factor => ({
  id: crypto.randomUUID(),
  name: '',
  lowLevel: '',
  highLevel: '',
  unit: '',
});

// Generate full factorial design matrix
const generateDesignMatrix = (numFactors: number, replicates: number): Array<Record<string, '-1' | '+1'>> => {
  const runs = Math.pow(2, numFactors);
  const matrix: Array<Record<string, '-1' | '+1'>> = [];

  for (let rep = 0; rep < replicates; rep++) {
    for (let i = 0; i < runs; i++) {
      const levels: Record<string, '-1' | '+1'> = {};
      for (let j = 0; j < numFactors; j++) {
        const level = (Math.floor(i / Math.pow(2, j)) % 2) === 0 ? '-1' : '+1';
        levels[`factor_${j}`] = level as '-1' | '+1';
      }
      matrix.push(levels);
    }
  }

  return matrix;
};

// Randomize array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Calculate effects
const calculateEffects = (factors: Factor[], experiments: Experiment[]) => {
  const validExperiments = experiments.filter(e => e.response !== null);
  if (validExperiments.length === 0) return null;

  const effects: { factor: string; effect: number; significance: 'high' | 'medium' | 'low' }[] = [];

  // Calculate main effects
  factors.forEach((factor, idx) => {
    const factorKey = `factor_${idx}`;
    const lowResponses = validExperiments
      .filter(e => e.factorLevels[factorKey] === '-1')
      .map(e => e.response as number);
    const highResponses = validExperiments
      .filter(e => e.factorLevels[factorKey] === '+1')
      .map(e => e.response as number);

    if (lowResponses.length > 0 && highResponses.length > 0) {
      const lowMean = lowResponses.reduce((a, b) => a + b, 0) / lowResponses.length;
      const highMean = highResponses.reduce((a, b) => a + b, 0) / highResponses.length;
      const effect = highMean - lowMean;

      effects.push({
        factor: factor.name || `Facteur ${idx + 1}`,
        effect: Math.round(effect * 1000) / 1000,
        significance: Math.abs(effect) > 10 ? 'high' : Math.abs(effect) > 5 ? 'medium' : 'low'
      });
    }
  });

  // Calculate interactions (2-factor)
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      const factorKeyI = `factor_${i}`;
      const factorKeyJ = `factor_${j}`;

      const groups = {
        '--': validExperiments.filter(e => e.factorLevels[factorKeyI] === '-1' && e.factorLevels[factorKeyJ] === '-1'),
        '-+': validExperiments.filter(e => e.factorLevels[factorKeyI] === '-1' && e.factorLevels[factorKeyJ] === '+1'),
        '+-': validExperiments.filter(e => e.factorLevels[factorKeyI] === '+1' && e.factorLevels[factorKeyJ] === '-1'),
        '++': validExperiments.filter(e => e.factorLevels[factorKeyI] === '+1' && e.factorLevels[factorKeyJ] === '+1'),
      };

      const means = {
        '--': groups['--'].length > 0 ? groups['--'].reduce((a, e) => a + (e.response || 0), 0) / groups['--'].length : 0,
        '-+': groups['-+'].length > 0 ? groups['-+'].reduce((a, e) => a + (e.response || 0), 0) / groups['-+'].length : 0,
        '+-': groups['+-'].length > 0 ? groups['+-'].reduce((a, e) => a + (e.response || 0), 0) / groups['+-'].length : 0,
        '++': groups['++'].length > 0 ? groups['++'].reduce((a, e) => a + (e.response || 0), 0) / groups['++'].length : 0,
      };

      const interaction = ((means['++'] - means['+-']) - (means['-+'] - means['--'])) / 2;

      effects.push({
        factor: `${factors[i].name || `F${i + 1}`} × ${factors[j].name || `F${j + 1}`}`,
        effect: Math.round(interaction * 1000) / 1000,
        significance: Math.abs(interaction) > 5 ? 'high' : Math.abs(interaction) > 2 ? 'medium' : 'low'
      });
    }
  }

  // Calculate overall statistics
  const allResponses = validExperiments.map(e => e.response as number);
  const mean = allResponses.reduce((a, b) => a + b, 0) / allResponses.length;
  const variance = allResponses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (allResponses.length - 1);

  return {
    effects: effects.sort((a, b) => Math.abs(b.effect) - Math.abs(a.effect)),
    mean: Math.round(mean * 1000) / 1000,
    stdDev: Math.round(Math.sqrt(variance) * 1000) / 1000,
    n: validExperiments.length,
  };
};

export default function DOETemplate({
  data,
  onChange,
  readOnly = false,
}: DOETemplateProps) {
  const [doeData, setDoeData] = useState<DOEData>({
    experimentName: data.experimentName || '',
    objective: data.objective || '',
    responseVariable: data.responseVariable || '',
    responseUnit: data.responseUnit || '',
    factors: data.factors?.length ? data.factors : [createEmptyFactor(), createEmptyFactor()],
    experiments: data.experiments || [],
    designType: data.designType || 'full_factorial',
    replicates: data.replicates || 1,
    centerPoints: data.centerPoints || 0,
    notes: data.notes || '',
    conclusions: data.conclusions || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setDoeData({
        experimentName: data.experimentName || '',
        objective: data.objective || '',
        responseVariable: data.responseVariable || '',
        responseUnit: data.responseUnit || '',
        factors: data.factors?.length ? data.factors : [createEmptyFactor(), createEmptyFactor()],
        experiments: data.experiments || [],
        designType: data.designType || 'full_factorial',
        replicates: data.replicates || 1,
        centerPoints: data.centerPoints || 0,
        notes: data.notes || '',
        conclusions: data.conclusions || '',
      });
    }
  }, [data]);

  const updateData = (newData: DOEData) => {
    setDoeData(newData);
    onChange(newData);
  };

  const addFactor = () => {
    if (doeData.factors.length < 5) {
      updateData({
        ...doeData,
        factors: [...doeData.factors, createEmptyFactor()],
        experiments: [], // Reset experiments when factors change
      });
    }
  };

  const removeFactor = (id: string) => {
    if (doeData.factors.length > 2) {
      updateData({
        ...doeData,
        factors: doeData.factors.filter(f => f.id !== id),
        experiments: [], // Reset experiments when factors change
      });
    }
  };

  const updateFactor = (id: string, field: keyof Factor, value: string) => {
    updateData({
      ...doeData,
      factors: doeData.factors.map(f =>
        f.id === id ? { ...f, [field]: value } : f
      ),
    });
  };

  const generateExperiments = () => {
    const validFactors = doeData.factors.filter(f => f.name.trim());
    if (validFactors.length < 2) {
      alert('Veuillez définir au moins 2 facteurs avec des noms');
      return;
    }

    const matrix = generateDesignMatrix(validFactors.length, doeData.replicates);
    const randomizedMatrix = shuffleArray(matrix);

    const experiments: Experiment[] = randomizedMatrix.map((levels, idx) => {
      // Map generic factor keys to actual factor positions
      const factorLevels: Record<string, '-1' | '+1'> = {};
      Object.keys(levels).forEach((key, i) => {
        factorLevels[`factor_${i}`] = levels[key];
      });

      return {
        id: crypto.randomUUID(),
        runOrder: idx + 1,
        standardOrder: idx + 1,
        factorLevels,
        response: null,
        replicate: Math.floor(idx / Math.pow(2, validFactors.length)) + 1,
      };
    });

    updateData({
      ...doeData,
      experiments,
    });
  };

  const updateExperimentResponse = (id: string, response: number | null) => {
    updateData({
      ...doeData,
      experiments: doeData.experiments.map(e =>
        e.id === id ? { ...e, response } : e
      ),
    });
  };

  // Calculate results
  const results = useMemo(() => {
    return calculateEffects(doeData.factors, doeData.experiments);
  }, [doeData.factors, doeData.experiments]);

  const totalRuns = Math.pow(2, doeData.factors.filter(f => f.name.trim()).length) * doeData.replicates;
  const completedRuns = doeData.experiments.filter(e => e.response !== null).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-analyze flex items-center justify-center">
            <Beaker className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Plan d'Expériences (DOE)</h2>
            <p className="text-sm text-gray-500">
              Design of Experiments - Analyse factorielle
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de l'expérience</label>
            <input
              type="text"
              value={doeData.experimentName}
              onChange={(e) => updateData({ ...doeData, experimentName: e.target.value })}
              placeholder="Ex: Optimisation procédé de soudage"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type de plan</label>
            <select
              value={doeData.designType}
              onChange={(e) => updateData({ ...doeData, designType: e.target.value as any })}
              className="input"
              disabled={readOnly || doeData.experiments.length > 0}
            >
              <option value="full_factorial">Factoriel complet 2^k</option>
              <option value="fractional">Factoriel fractionnaire</option>
              <option value="screening">Plan de criblage</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Objectif de l'expérience</label>
          <textarea
            value={doeData.objective}
            onChange={(e) => updateData({ ...doeData, objective: e.target.value })}
            placeholder="Quel est l'objectif de ce plan d'expériences ?"
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
            <p className="font-medium mb-1">Plan factoriel complet 2^k</p>
            <ul className="space-y-1 text-blue-700">
              <li>Chaque facteur a 2 niveaux: bas (-1) et haut (+1)</li>
              <li>Permet d'estimer tous les effets principaux et interactions</li>
              <li>Nombre d'essais = 2^k × réplicats (k = nombre de facteurs)</li>
              <li>Les essais sont randomisés pour éviter les biais</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Response Variable */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Variable de réponse (Y)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de la réponse</label>
            <input
              type="text"
              value={doeData.responseVariable}
              onChange={(e) => updateData({ ...doeData, responseVariable: e.target.value })}
              placeholder="Ex: Résistance à la traction"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Unité</label>
            <input
              type="text"
              value={doeData.responseUnit}
              onChange={(e) => updateData({ ...doeData, responseUnit: e.target.value })}
              placeholder="Ex: MPa"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Factors */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Facteurs (X)</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{doeData.factors.length} facteurs</span>
            {!readOnly && doeData.factors.length < 5 && doeData.experiments.length === 0 && (
              <button onClick={addFactor} className="btn btn-secondary btn-sm">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-analyze text-white">
                <th className="px-3 py-2 text-left">Facteur</th>
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-center">Niveau bas (-1)</th>
                <th className="px-3 py-2 text-center">Niveau haut (+1)</th>
                <th className="px-3 py-2 text-center">Unité</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {doeData.factors.map((factor, idx) => (
                <tr key={factor.id} className="border-b">
                  <td className="px-3 py-2 font-medium text-analyze">
                    X{idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={factor.name}
                      onChange={(e) => updateFactor(factor.id, 'name', e.target.value)}
                      placeholder={`Facteur ${idx + 1}`}
                      className="input text-sm"
                      disabled={readOnly || doeData.experiments.length > 0}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={factor.lowLevel}
                      onChange={(e) => updateFactor(factor.id, 'lowLevel', e.target.value)}
                      placeholder="Ex: 100"
                      className="input text-sm text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={factor.highLevel}
                      onChange={(e) => updateFactor(factor.id, 'highLevel', e.target.value)}
                      placeholder="Ex: 150"
                      className="input text-sm text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={factor.unit}
                      onChange={(e) => updateFactor(factor.id, 'unit', e.target.value)}
                      placeholder="Ex: °C"
                      className="input text-sm text-center w-20"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-3 py-2">
                    {!readOnly && doeData.factors.length > 2 && doeData.experiments.length === 0 && (
                      <button
                        onClick={() => removeFactor(factor.id)}
                        className="p-1 text-gray-400 hover:text-control"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Design Settings & Generate */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Configuration du plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre de réplicats</label>
            <select
              value={doeData.replicates}
              onChange={(e) => updateData({ ...doeData, replicates: parseInt(e.target.value), experiments: [] })}
              className="input"
              disabled={readOnly || doeData.experiments.length > 0}
            >
              <option value={1}>1 (sans réplicat)</option>
              <option value={2}>2 réplicats</option>
              <option value={3}>3 réplicats</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Nombre d'essais</label>
            <div className="input bg-gray-50 flex items-center">
              <span className="font-bold text-analyze">{totalRuns}</span>
              <span className="text-gray-500 ml-2">
                (2^{doeData.factors.filter(f => f.name.trim()).length} × {doeData.replicates})
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Progression</label>
            <div className="input bg-gray-50 flex items-center gap-2">
              <span className="font-bold">{completedRuns}/{doeData.experiments.length}</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-improve rounded-full transition-all"
                  style={{ width: `${doeData.experiments.length > 0 ? (completedRuns / doeData.experiments.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {!readOnly && doeData.experiments.length === 0 && (
          <button
            onClick={generateExperiments}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Générer la matrice d'expériences
          </button>
        )}
      </div>

      {/* Experiment Matrix */}
      {doeData.experiments.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-4 bg-analyze text-white">
            <h3 className="font-semibold">Matrice d'expériences</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2 text-center">Run</th>
                  {doeData.factors.filter(f => f.name.trim()).map((factor, idx) => (
                    <th key={factor.id} className="px-3 py-2 text-center">
                      <div>{factor.name || `X${idx + 1}`}</div>
                      <div className="text-xs text-gray-400 font-normal">
                        ({factor.lowLevel} / {factor.highLevel})
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center">
                    <div>{doeData.responseVariable || 'Réponse (Y)'}</div>
                    {doeData.responseUnit && (
                      <div className="text-xs text-gray-400 font-normal">({doeData.responseUnit})</div>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {doeData.experiments.map((exp) => (
                  <tr key={exp.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center font-medium">{exp.runOrder}</td>
                    {doeData.factors.filter(f => f.name.trim()).map((factor, idx) => {
                      const level = exp.factorLevels[`factor_${idx}`];
                      return (
                        <td key={factor.id} className="px-3 py-2 text-center">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-bold',
                            level === '-1' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                          )}>
                            {level === '-1' ? factor.lowLevel || '-1' : factor.highLevel || '+1'}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="any"
                        value={exp.response ?? ''}
                        onChange={(e) => updateExperimentResponse(
                          exp.id,
                          e.target.value ? parseFloat(e.target.value) : null
                        )}
                        placeholder="Résultat"
                        className={cn(
                          'input text-sm text-center w-24 mx-auto',
                          exp.response !== null && 'border-improve'
                        )}
                        disabled={readOnly}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results Analysis */}
      {results && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-analyze" />
            Analyse des effets
          </h3>

          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500">Réponse moyenne</div>
              <div className="text-2xl font-bold">{results.mean}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500">Écart-type</div>
              <div className="text-2xl font-bold">{results.stdDev}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-500">Essais analysés</div>
              <div className="text-2xl font-bold">{results.n}</div>
            </div>
          </div>

          {/* Effects Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">Diagramme de Pareto des effets</h4>
            <div className="space-y-2">
              {results.effects.map((effect, idx) => {
                const maxEffect = Math.max(...results.effects.map(e => Math.abs(e.effect)));
                const barWidth = maxEffect > 0 ? (Math.abs(effect.effect) / maxEffect) * 100 : 0;

                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-right truncate" title={effect.factor}>
                      {effect.factor}
                    </div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                      <div
                        className={cn(
                          'h-full rounded-lg transition-all flex items-center justify-end pr-2',
                          effect.effect > 0 ? 'bg-improve' : 'bg-control',
                          effect.significance === 'high' ? 'opacity-100' :
                          effect.significance === 'medium' ? 'opacity-70' : 'opacity-40'
                        )}
                        style={{ width: `${barWidth}%` }}
                      >
                        <span className="text-xs font-bold text-white">
                          {effect.effect > 0 ? '+' : ''}{effect.effect}
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      'w-16 text-xs font-medium text-center px-2 py-1 rounded',
                      effect.significance === 'high' ? 'bg-control-light text-control' :
                      effect.significance === 'medium' ? 'bg-analyze-light text-analyze' :
                      'bg-gray-100 text-gray-500'
                    )}>
                      {effect.significance === 'high' ? 'Fort' :
                       effect.significance === 'medium' ? 'Moyen' : 'Faible'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Effects Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Effet</th>
                  <th className="px-4 py-2 text-right">Valeur</th>
                  <th className="px-4 py-2 text-center">Impact</th>
                  <th className="px-4 py-2 text-left">Interprétation</th>
                </tr>
              </thead>
              <tbody>
                {results.effects.map((effect, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2 font-medium">{effect.factor}</td>
                    <td className={cn(
                      'px-4 py-2 text-right font-mono',
                      effect.effect > 0 ? 'text-improve' : 'text-control'
                    )}>
                      {effect.effect > 0 ? '+' : ''}{effect.effect}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        effect.significance === 'high' ? 'bg-control text-white' :
                        effect.significance === 'medium' ? 'bg-analyze text-white' :
                        'bg-gray-200 text-gray-600'
                      )}>
                        {effect.significance === 'high' ? 'Significatif' :
                         effect.significance === 'medium' ? 'Modéré' : 'Négligeable'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {effect.effect > 0
                        ? `Augmenter ${effect.factor} augmente la réponse`
                        : `Augmenter ${effect.factor} diminue la réponse`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conclusions */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Conclusions et recommandations</label>
        <textarea
          value={doeData.conclusions}
          onChange={(e) => updateData({ ...doeData, conclusions: e.target.value })}
          placeholder="Quels sont les facteurs les plus influents ? Quelles sont les conditions optimales ?"
          className="input min-h-[120px] resize-none"
          disabled={readOnly}
        />
      </div>

      {/* Notes */}
      <div className="card p-6">
        <label className="block text-sm font-medium mb-2">Notes et observations</label>
        <textarea
          value={doeData.notes}
          onChange={(e) => updateData({ ...doeData, notes: e.target.value })}
          placeholder="Conditions expérimentales, anomalies observées, points d'attention..."
          className="input min-h-[100px] resize-none"
          disabled={readOnly}
        />
      </div>
    </div>
  );
}

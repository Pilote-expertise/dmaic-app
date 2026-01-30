import { useState, useEffect } from 'react';
import { Calculator, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ToolDefinition } from '@/types';
import { cn } from '@/utils/cn';

interface SampleSizeData {
  calculationType: 'mean_estimation' | 'proportion_estimation' | 'mean_comparison' | 'proportion_comparison';
  confidenceLevel: number;
  power: number;
  marginOfError: number;
  estimatedStdDev: number;
  estimatedProportion: number;
  minimumDetectableDifference: number;
  populationSize: number;
  useFiniteCorrection: boolean;
  calculatedSampleSize: number;
  actualSampleSize: number;
  justification: string;
  dataCollectionNotes: string;
}

interface SampleSizeTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

export default function SampleSizeTemplate({
  data,
  onChange,
  readOnly = false,
}: SampleSizeTemplateProps) {
  const [sampleData, setSampleData] = useState<SampleSizeData>({
    calculationType: data.calculationType || 'mean_estimation',
    confidenceLevel: data.confidenceLevel || 95,
    power: data.power || 80,
    marginOfError: data.marginOfError || 5,
    estimatedStdDev: data.estimatedStdDev || 10,
    estimatedProportion: data.estimatedProportion || 50,
    minimumDetectableDifference: data.minimumDetectableDifference || 5,
    populationSize: data.populationSize || 0,
    useFiniteCorrection: data.useFiniteCorrection || false,
    calculatedSampleSize: data.calculatedSampleSize || 0,
    actualSampleSize: data.actualSampleSize || 0,
    justification: data.justification || '',
    dataCollectionNotes: data.dataCollectionNotes || '',
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setSampleData({
        calculationType: data.calculationType || 'mean_estimation',
        confidenceLevel: data.confidenceLevel || 95,
        power: data.power || 80,
        marginOfError: data.marginOfError || 5,
        estimatedStdDev: data.estimatedStdDev || 10,
        estimatedProportion: data.estimatedProportion || 50,
        minimumDetectableDifference: data.minimumDetectableDifference || 5,
        populationSize: data.populationSize || 0,
        useFiniteCorrection: data.useFiniteCorrection || false,
        calculatedSampleSize: data.calculatedSampleSize || 0,
        actualSampleSize: data.actualSampleSize || 0,
        justification: data.justification || '',
        dataCollectionNotes: data.dataCollectionNotes || '',
      });
    }
  }, [data]);

  // Z-values for confidence levels
  const zValues: Record<number, number> = {
    90: 1.645,
    95: 1.96,
    99: 2.576,
  };

  // Z-values for power (one-sided)
  const powerZValues: Record<number, number> = {
    80: 0.84,
    85: 1.04,
    90: 1.28,
    95: 1.645,
  };

  const calculateSampleSize = (newData: SampleSizeData): number => {
    const z = zValues[newData.confidenceLevel] || 1.96;
    const zBeta = powerZValues[newData.power] || 0.84;
    let n = 0;

    switch (newData.calculationType) {
      case 'mean_estimation': {
        // n = (z * σ / E)²
        if (newData.marginOfError > 0 && newData.estimatedStdDev > 0) {
          n = Math.pow((z * newData.estimatedStdDev) / newData.marginOfError, 2);
        }
        break;
      }
      case 'proportion_estimation': {
        // n = z² * p * (1-p) / E²
        const p = newData.estimatedProportion / 100;
        if (newData.marginOfError > 0) {
          n = (Math.pow(z, 2) * p * (1 - p)) / Math.pow(newData.marginOfError / 100, 2);
        }
        break;
      }
      case 'mean_comparison': {
        // n = 2 * (z_α + z_β)² * σ² / Δ²
        if (newData.minimumDetectableDifference > 0 && newData.estimatedStdDev > 0) {
          n = (2 * Math.pow(z + zBeta, 2) * Math.pow(newData.estimatedStdDev, 2)) /
              Math.pow(newData.minimumDetectableDifference, 2);
        }
        break;
      }
      case 'proportion_comparison': {
        // Simplified formula for proportion comparison
        const p = newData.estimatedProportion / 100;
        const delta = newData.minimumDetectableDifference / 100;
        if (delta > 0) {
          n = (Math.pow(z + zBeta, 2) * 2 * p * (1 - p)) / Math.pow(delta, 2);
        }
        break;
      }
    }

    // Apply finite population correction if needed
    if (newData.useFiniteCorrection && newData.populationSize > 0 && n > 0) {
      n = n / (1 + (n - 1) / newData.populationSize);
    }

    return Math.ceil(n);
  };

  const updateData = (newData: SampleSizeData) => {
    const calculatedSize = calculateSampleSize(newData);
    const updatedData = { ...newData, calculatedSampleSize: calculatedSize };
    setSampleData(updatedData);
    onChange(updatedData);
  };

  const calculationTypeLabels: Record<string, { label: string; description: string }> = {
    mean_estimation: {
      label: 'Estimation de moyenne',
      description: 'Estimer la moyenne d\'une population',
    },
    proportion_estimation: {
      label: 'Estimation de proportion',
      description: 'Estimer un pourcentage ou taux',
    },
    mean_comparison: {
      label: 'Comparaison de moyennes',
      description: 'Comparer deux groupes (t-test)',
    },
    proportion_comparison: {
      label: 'Comparaison de proportions',
      description: 'Comparer deux taux ou pourcentages',
    },
  };

  const isAdequate = sampleData.actualSampleSize >= sampleData.calculatedSampleSize;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-measure flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Calcul de la Taille d'Échantillon</h2>
            <p className="text-sm text-gray-500">
              Déterminer le nombre d'observations nécessaires
            </p>
          </div>
        </div>

        {/* Calculation Type */}
        <div>
          <label className="block text-sm font-medium mb-3">Type de calcul</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(calculationTypeLabels).map(([key, { label, description }]) => (
              <button
                key={key}
                onClick={() => !readOnly && updateData({ ...sampleData, calculationType: key as any })}
                className={cn(
                  'p-4 border rounded-xl text-left transition-all',
                  sampleData.calculationType === key
                    ? 'border-measure bg-measure-light ring-2 ring-measure'
                    : 'border-gray-200 hover:border-measure'
                )}
                disabled={readOnly}
              >
                <div className="font-medium">{label}</div>
                <div className="text-sm text-gray-500">{description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="card p-4 bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Paramètres clés</p>
            <ul className="space-y-1 text-blue-700">
              <li>• <strong>Niveau de confiance</strong>: Probabilité que l'intervalle contienne la vraie valeur (95% standard)</li>
              <li>• <strong>Puissance</strong>: Probabilité de détecter un effet s'il existe (80% minimum recommandé)</li>
              <li>• <strong>Marge d'erreur</strong>: Précision souhaitée de l'estimation</li>
              <li>• <strong>Écart-type estimé</strong>: Variabilité attendue des données</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Parameters */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Paramètres du calcul</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Niveau de confiance (%)</label>
            <select
              value={sampleData.confidenceLevel}
              onChange={(e) => updateData({ ...sampleData, confidenceLevel: parseInt(e.target.value) })}
              className="input"
              disabled={readOnly}
            >
              <option value={90}>90%</option>
              <option value={95}>95%</option>
              <option value={99}>99%</option>
            </select>
            <span className="text-xs text-gray-500">Z = {zValues[sampleData.confidenceLevel]}</span>
          </div>

          {(sampleData.calculationType === 'mean_comparison' || sampleData.calculationType === 'proportion_comparison') && (
            <div>
              <label className="block text-sm font-medium mb-2">Puissance (%)</label>
              <select
                value={sampleData.power}
                onChange={(e) => updateData({ ...sampleData, power: parseInt(e.target.value) })}
                className="input"
                disabled={readOnly}
              >
                <option value={80}>80%</option>
                <option value={85}>85%</option>
                <option value={90}>90%</option>
                <option value={95}>95%</option>
              </select>
              <span className="text-xs text-gray-500">Zβ = {powerZValues[sampleData.power]}</span>
            </div>
          )}

          {(sampleData.calculationType === 'mean_estimation' || sampleData.calculationType === 'proportion_estimation') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Marge d'erreur {sampleData.calculationType === 'proportion_estimation' ? '(%)' : ''}
              </label>
              <input
                type="number"
                step="0.1"
                value={sampleData.marginOfError}
                onChange={(e) => updateData({ ...sampleData, marginOfError: parseFloat(e.target.value) || 0 })}
                className="input"
                disabled={readOnly}
              />
            </div>
          )}

          {(sampleData.calculationType === 'mean_comparison' || sampleData.calculationType === 'proportion_comparison') && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Différence min. détectable {sampleData.calculationType === 'proportion_comparison' ? '(%)' : ''}
              </label>
              <input
                type="number"
                step="0.1"
                value={sampleData.minimumDetectableDifference}
                onChange={(e) => updateData({ ...sampleData, minimumDetectableDifference: parseFloat(e.target.value) || 0 })}
                className="input"
                disabled={readOnly}
              />
            </div>
          )}

          {(sampleData.calculationType === 'mean_estimation' || sampleData.calculationType === 'mean_comparison') && (
            <div>
              <label className="block text-sm font-medium mb-2">Écart-type estimé (σ)</label>
              <input
                type="number"
                step="0.1"
                value={sampleData.estimatedStdDev}
                onChange={(e) => updateData({ ...sampleData, estimatedStdDev: parseFloat(e.target.value) || 0 })}
                className="input"
                disabled={readOnly}
              />
            </div>
          )}

          {(sampleData.calculationType === 'proportion_estimation' || sampleData.calculationType === 'proportion_comparison') && (
            <div>
              <label className="block text-sm font-medium mb-2">Proportion estimée (%)</label>
              <input
                type="number"
                step="1"
                min="1"
                max="99"
                value={sampleData.estimatedProportion}
                onChange={(e) => updateData({ ...sampleData, estimatedProportion: parseFloat(e.target.value) || 50 })}
                className="input"
                disabled={readOnly}
              />
              <span className="text-xs text-gray-500">50% = variance maximale</span>
            </div>
          )}
        </div>

        {/* Finite population correction */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={sampleData.useFiniteCorrection}
              onChange={(e) => updateData({ ...sampleData, useFiniteCorrection: e.target.checked })}
              className="w-4 h-4"
              disabled={readOnly}
            />
            <span className="text-sm font-medium">Appliquer correction pour population finie</span>
          </label>
          {sampleData.useFiniteCorrection && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-2">Taille de la population (N)</label>
              <input
                type="number"
                value={sampleData.populationSize || ''}
                onChange={(e) => updateData({ ...sampleData, populationSize: parseInt(e.target.value) || 0 })}
                placeholder="Laissez vide pour population infinie"
                className="input w-48"
                disabled={readOnly}
              />
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Résultats</h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-measure-light rounded-xl p-6 text-center">
            <div className="text-sm text-gray-500 mb-2">Taille d'échantillon calculée</div>
            <div className="text-5xl font-bold text-measure">{sampleData.calculatedSampleSize}</div>
            <div className="text-sm text-gray-500 mt-2">observations minimum</div>
          </div>

          <div className={cn(
            'rounded-xl p-6 text-center',
            isAdequate ? 'bg-measure-light' : 'bg-control-light'
          )}>
            <div className="text-sm text-gray-500 mb-2">Taille d'échantillon prévue</div>
            <input
              type="number"
              value={sampleData.actualSampleSize || ''}
              onChange={(e) => updateData({ ...sampleData, actualSampleSize: parseInt(e.target.value) || 0 })}
              className="text-5xl font-bold bg-transparent text-center w-full border-b-2 border-dashed focus:outline-none"
              style={{ color: isAdequate ? '#16a34a' : '#dc2626' }}
              disabled={readOnly}
            />
            <div className="flex items-center justify-center gap-2 mt-2">
              {isAdequate ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-measure" />
                  <span className="text-measure font-medium">Adéquat</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-control" />
                  <span className="text-control font-medium">
                    Insuffisant ({sampleData.calculatedSampleSize - sampleData.actualSampleSize} manquants)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Formula display */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium mb-2">Formule utilisée:</div>
          <div className="font-mono text-sm text-gray-700">
            {sampleData.calculationType === 'mean_estimation' && (
              <>n = (Z × σ / E)² = ({zValues[sampleData.confidenceLevel]} × {sampleData.estimatedStdDev} / {sampleData.marginOfError})² = {sampleData.calculatedSampleSize}</>
            )}
            {sampleData.calculationType === 'proportion_estimation' && (
              <>n = Z² × p × (1-p) / E² = {zValues[sampleData.confidenceLevel]}² × {sampleData.estimatedProportion/100} × {1-sampleData.estimatedProportion/100} / {(sampleData.marginOfError/100)}² = {sampleData.calculatedSampleSize}</>
            )}
            {sampleData.calculationType === 'mean_comparison' && (
              <>n = 2 × (Zα + Zβ)² × σ² / Δ² = 2 × ({zValues[sampleData.confidenceLevel]} + {powerZValues[sampleData.power]})² × {sampleData.estimatedStdDev}² / {sampleData.minimumDetectableDifference}² = {sampleData.calculatedSampleSize} (par groupe)</>
            )}
            {sampleData.calculationType === 'proportion_comparison' && (
              <>n = (Zα + Zβ)² × 2 × p × (1-p) / Δ² ≈ {sampleData.calculatedSampleSize} (par groupe)</>
            )}
          </div>
        </div>
      </div>

      {/* Sensitivity */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Analyse de sensibilité</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-2 text-left">Niveau de confiance</th>
              <th className="px-4 py-2 text-center">90%</th>
              <th className="px-4 py-2 text-center">95%</th>
              <th className="px-4 py-2 text-center">99%</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2">Taille requise</td>
              {[90, 95, 99].map((conf) => {
                const size = calculateSampleSize({ ...sampleData, confidenceLevel: conf });
                return (
                  <td key={conf} className={cn(
                    'px-4 py-2 text-center font-medium',
                    conf === sampleData.confidenceLevel ? 'bg-measure-light text-measure' : ''
                  )}>
                    {size}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Justification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Justification des paramètres</label>
          <textarea
            value={sampleData.justification}
            onChange={(e) => updateData({ ...sampleData, justification: e.target.value })}
            placeholder="Expliquez le choix des paramètres (écart-type estimé, marge d'erreur...)..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
        <div className="card p-6">
          <label className="block text-sm font-medium mb-2">Notes sur la collecte des données</label>
          <textarea
            value={sampleData.dataCollectionNotes}
            onChange={(e) => updateData({ ...sampleData, dataCollectionNotes: e.target.value })}
            placeholder="Méthode d'échantillonnage, stratification, randomisation..."
            className="input min-h-[120px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}

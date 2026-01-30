import { useState, useEffect } from 'react';
import { Plus, Trash2, Database, Calendar } from 'lucide-react';
import type { ToolDefinition } from '@/types';

interface DataPoint {
  id: string;
  variable: string;
  operationalDefinition: string;
  measureType: 'continuous' | 'discrete' | 'attribute';
  sampleSize: number;
  frequency: string;
  source: string;
  responsible: string;
  method: string;
  notes: string;
}

interface PlanCollecteData {
  objective: string;
  startDate: string;
  endDate: string;
  dataPoints: DataPoint[];
}

interface PlanCollecteTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyDataPoint = (): DataPoint => ({
  id: crypto.randomUUID(),
  variable: '',
  operationalDefinition: '',
  measureType: 'continuous',
  sampleSize: 30,
  frequency: '',
  source: '',
  responsible: '',
  method: '',
  notes: '',
});

const measureTypes = {
  continuous: { label: 'Continue', description: 'Temps, poids, température...' },
  discrete: { label: 'Discrète', description: 'Nombre de défauts, quantités...' },
  attribute: { label: 'Attribut', description: 'Conforme/Non-conforme...' },
};

export default function PlanCollecteTemplate({
  data,
  onChange,
  readOnly = false,
}: PlanCollecteTemplateProps) {
  const [planData, setPlanData] = useState<PlanCollecteData>({
    objective: data.objective || '',
    startDate: data.startDate || '',
    endDate: data.endDate || '',
    dataPoints: data.dataPoints?.length ? data.dataPoints : [createEmptyDataPoint()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setPlanData({
        objective: data.objective || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        dataPoints: data.dataPoints?.length ? data.dataPoints : [createEmptyDataPoint()],
      });
    }
  }, [data]);

  const updateData = (newData: PlanCollecteData) => {
    setPlanData(newData);
    onChange(newData);
  };

  const addDataPoint = () => {
    updateData({
      ...planData,
      dataPoints: [...planData.dataPoints, createEmptyDataPoint()],
    });
  };

  const removeDataPoint = (id: string) => {
    if (planData.dataPoints.length > 1) {
      updateData({
        ...planData,
        dataPoints: planData.dataPoints.filter((dp) => dp.id !== id),
      });
    }
  };

  const updateDataPoint = (id: string, field: keyof DataPoint, value: string | number) => {
    updateData({
      ...planData,
      dataPoints: planData.dataPoints.map((dp) =>
        dp.id === id ? { ...dp, [field]: value } : dp
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-measure flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Plan de Collecte de Données</h2>
            <p className="text-sm text-gray-500">
              Définir quoi mesurer, comment et quand
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-3">
            <label className="block text-sm font-medium mb-2">
              Objectif de la collecte
            </label>
            <textarea
              value={planData.objective}
              onChange={(e) => updateData({ ...planData, objective: e.target.value })}
              placeholder="Pourquoi collectons-nous ces données ? Quel est l'objectif ?"
              className="input min-h-[80px] resize-none"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date de début
            </label>
            <input
              type="date"
              value={planData.startDate}
              onChange={(e) => updateData({ ...planData, startDate: e.target.value })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Date de fin
            </label>
            <input
              type="date"
              value={planData.endDate}
              onChange={(e) => updateData({ ...planData, endDate: e.target.value })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div className="flex items-end">
            <div className="bg-measure-light rounded-lg p-3 text-center w-full">
              <div className="text-2xl font-bold text-measure">
                {planData.dataPoints.length}
              </div>
              <div className="text-xs text-gray-500">Variable(s)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Measure Type Legend */}
      <div className="card p-4">
        <div className="flex items-center justify-center gap-6 text-sm">
          {Object.entries(measureTypes).map(([key, { label, description }]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="font-medium">{label}:</span>
              <span className="text-gray-500">{description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data Points */}
      <div className="space-y-4">
        {planData.dataPoints.map((dp, index) => (
          <div key={dp.id} className="card overflow-hidden">
            <div className="bg-measure text-white px-4 py-2 flex items-center justify-between">
              <span className="font-medium">Variable {index + 1}</span>
              {!readOnly && planData.dataPoints.length > 1 && (
                <button
                  onClick={() => removeDataPoint(dp.id)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom de la variable (Y ou X)
                  </label>
                  <input
                    type="text"
                    value={dp.variable}
                    onChange={(e) => updateDataPoint(dp.id, 'variable', e.target.value)}
                    placeholder="Ex: Temps de cycle, Taux de défauts..."
                    className="input"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type de mesure
                  </label>
                  <select
                    value={dp.measureType}
                    onChange={(e) => updateDataPoint(dp.id, 'measureType', e.target.value)}
                    className="input"
                    disabled={readOnly}
                  >
                    {Object.entries(measureTypes).map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Définition opérationnelle
                </label>
                <textarea
                  value={dp.operationalDefinition}
                  onChange={(e) => updateDataPoint(dp.id, 'operationalDefinition', e.target.value)}
                  placeholder="Définition précise de ce qui est mesuré et comment..."
                  className="input min-h-[60px] resize-none"
                  disabled={readOnly}
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Taille échantillon
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={dp.sampleSize}
                    onChange={(e) => updateDataPoint(dp.id, 'sampleSize', parseInt(e.target.value) || 30)}
                    className="input"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fréquence
                  </label>
                  <input
                    type="text"
                    value={dp.frequency}
                    onChange={(e) => updateDataPoint(dp.id, 'frequency', e.target.value)}
                    placeholder="Ex: Horaire, quotidien..."
                    className="input"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    value={dp.source}
                    onChange={(e) => updateDataPoint(dp.id, 'source', e.target.value)}
                    placeholder="D'où vient la donnée ?"
                    className="input"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={dp.responsible}
                    onChange={(e) => updateDataPoint(dp.id, 'responsible', e.target.value)}
                    placeholder="Qui collecte ?"
                    className="input"
                    disabled={readOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Méthode de collecte
                  </label>
                  <input
                    type="text"
                    value={dp.method}
                    onChange={(e) => updateDataPoint(dp.id, 'method', e.target.value)}
                    placeholder="Comment sont collectées les données ?"
                    className="input"
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={dp.notes}
                    onChange={(e) => updateDataPoint(dp.id, 'notes', e.target.value)}
                    placeholder="Remarques particulières..."
                    className="input"
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          onClick={addDataPoint}
          className="btn btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une variable
        </button>
      )}

      {/* Summary */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Résumé du plan</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-measure-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-measure">
              {planData.dataPoints.filter((dp) => dp.measureType === 'continuous').length}
            </div>
            <div className="text-sm text-gray-500">Variables continues</div>
          </div>
          <div className="bg-analyze-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-analyze">
              {planData.dataPoints.filter((dp) => dp.measureType === 'discrete').length}
            </div>
            <div className="text-sm text-gray-500">Variables discrètes</div>
          </div>
          <div className="bg-define-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-define">
              {planData.dataPoints.filter((dp) => dp.measureType === 'attribute').length}
            </div>
            <div className="text-sm text-gray-500">Attributs</div>
          </div>
        </div>
      </div>
    </div>
  );
}

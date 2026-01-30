import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, BarChart3, ArrowUpDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolDefinition } from '@/types';

interface ParetoItem {
  id: string;
  category: string;
  value: number;
  unit: string;
}

interface ParetoData {
  title: string;
  description: string;
  items: ParetoItem[];
}

interface ParetoTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyItem = (): ParetoItem => ({
  id: crypto.randomUUID(),
  category: '',
  value: 0,
  unit: '',
});

const barColors = [
  'bg-define',
  'bg-measure',
  'bg-analyze',
  'bg-improve',
  'bg-control',
  'bg-gray-500',
  'bg-indigo-500',
  'bg-pink-500',
];

export default function ParetoTemplate({
  data,
  onChange,
  readOnly = false,
}: ParetoTemplateProps) {
  const [paretoData, setParetoData] = useState<ParetoData>({
    title: data.title || '',
    description: data.description || '',
    items: data.items?.length ? data.items : [createEmptyItem()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setParetoData({
        title: data.title || '',
        description: data.description || '',
        items: data.items?.length ? data.items : [createEmptyItem()],
      });
    }
  }, [data]);

  const updateData = (newData: ParetoData) => {
    setParetoData(newData);
    onChange(newData);
  };

  const addItem = () => {
    updateData({
      ...paretoData,
      items: [...paretoData.items, createEmptyItem()],
    });
  };

  const removeItem = (id: string) => {
    if (paretoData.items.length > 1) {
      updateData({
        ...paretoData,
        items: paretoData.items.filter((item) => item.id !== id),
      });
    }
  };

  const updateItem = (id: string, field: keyof ParetoItem, value: string | number) => {
    updateData({
      ...paretoData,
      items: paretoData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  // Sort items by value descending
  const sortItems = () => {
    const sorted = [...paretoData.items].sort((a, b) => b.value - a.value);
    updateData({ ...paretoData, items: sorted });
  };

  // Calculate Pareto analysis
  const paretoAnalysis = useMemo(() => {
    const sorted = [...paretoData.items]
      .filter((item) => item.value > 0 && item.category)
      .sort((a, b) => b.value - a.value);

    const total = sorted.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return { sorted: [], total: 0, maxValue: 0, vital: [], trivial: [] };

    let cumulative = 0;
    const withCumulative = sorted.map((item) => {
      cumulative += item.value;
      return {
        ...item,
        percentage: (item.value / total) * 100,
        cumulative: (cumulative / total) * 100,
      };
    });

    const vital = withCumulative.filter((item) => item.cumulative <= 80);
    const trivial = withCumulative.filter((item) => item.cumulative > 80);

    return {
      sorted: withCumulative,
      total,
      maxValue: Math.max(...sorted.map((i) => i.value)),
      vital,
      trivial,
    };
  }, [paretoData.items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-analyze flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Diagramme de Pareto</h2>
            <p className="text-sm text-gray-500">
              Règle 80/20 - Identifier les causes principales
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Titre de l'analyse
            </label>
            <input
              type="text"
              value={paretoData.title}
              onChange={(e) => updateData({ ...paretoData, title: e.target.value })}
              placeholder="Ex: Causes des retards de livraison"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={paretoData.description}
              onChange={(e) => updateData({ ...paretoData, description: e.target.value })}
              placeholder="Contexte de l'analyse"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Pareto Chart Visualization */}
      {paretoAnalysis.sorted.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Visualisation Pareto</h3>
          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-gray-500">
              Valeur
            </div>

            {/* Chart container */}
            <div className="ml-8 mr-12">
              {/* Bars and cumulative line */}
              <div className="flex items-end gap-2 h-64 border-b border-l border-gray-200 relative">
                {/* 80% line */}
                <div
                  className="absolute left-0 right-0 border-t-2 border-dashed border-control z-10"
                  style={{ bottom: '80%' }}
                >
                  <span className="absolute -right-12 -top-2 text-xs text-control font-medium">
                    80%
                  </span>
                </div>

                {paretoAnalysis.sorted.map((item, index) => {
                  const heightPercent = (item.value / paretoAnalysis.maxValue) * 100;
                  const cumulativePercent = item.cumulative;

                  return (
                    <div
                      key={item.id}
                      className="flex-1 flex flex-col items-center relative group"
                    >
                      {/* Cumulative line point */}
                      <div
                        className="absolute w-3 h-3 bg-control rounded-full border-2 border-white shadow z-20"
                        style={{
                          bottom: `${cumulativePercent}%`,
                          transform: 'translateY(50%)',
                        }}
                      />

                      {/* Cumulative line */}
                      {index > 0 && (
                        <svg
                          className="absolute w-full h-full pointer-events-none"
                          style={{ bottom: 0, left: '-50%' }}
                        >
                          <line
                            x1="50%"
                            y1={`${100 - paretoAnalysis.sorted[index - 1].cumulative}%`}
                            x2="150%"
                            y2={`${100 - cumulativePercent}%`}
                            stroke="#E11D48"
                            strokeWidth="2"
                          />
                        </svg>
                      )}

                      {/* Bar */}
                      <div
                        className={cn(
                          'w-full rounded-t transition-all',
                          barColors[index % barColors.length],
                          'group-hover:opacity-80'
                        )}
                        style={{ height: `${heightPercent}%` }}
                      />

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30">
                        {item.category}: {item.value} ({item.percentage.toFixed(1)}%)
                        <br />
                        Cumulé: {cumulativePercent.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div className="flex gap-2 mt-2">
                {paretoAnalysis.sorted.map((item) => (
                  <div
                    key={item.id}
                    className="flex-1 text-xs text-center text-gray-600 truncate"
                    title={item.category}
                  >
                    {item.category}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Y-axis for cumulative */}
            <div className="absolute right-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400">
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-define rounded" />
              <span className="text-sm text-gray-600">Valeur par catégorie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-control rounded" />
              <span className="text-sm text-gray-600">Cumul (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-control" />
              <span className="text-sm text-gray-600">Seuil 80%</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold">Données</h3>
          {!readOnly && (
            <button
              onClick={sortItems}
              className="btn btn-secondary text-sm flex items-center gap-1"
            >
              <ArrowUpDown className="w-4 h-4" />
              Trier par valeur
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-sm">
                <th className="px-4 py-3 text-left font-medium">Catégorie</th>
                <th className="px-4 py-3 text-left font-medium">Valeur</th>
                <th className="px-4 py-3 text-left font-medium">Unité</th>
                <th className="px-4 py-3 text-center font-medium">%</th>
                <th className="px-4 py-3 text-center font-medium">Cumulé</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {paretoData.items.map((item) => {
                const analysis = paretoAnalysis.sorted.find((a) => a.id === item.id);
                return (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                        placeholder="Nom de la catégorie"
                        className="input"
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        value={item.value}
                        onChange={(e) =>
                          updateItem(item.id, 'value', parseFloat(e.target.value) || 0)
                        }
                        className="input w-32"
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        placeholder="Ex: cas"
                        className="input w-24"
                        disabled={readOnly}
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      {analysis ? `${analysis.percentage.toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {analysis && (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            analysis.cumulative <= 80
                              ? 'bg-control-light text-control'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {analysis.cumulative.toFixed(1)}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {!readOnly && paretoData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-control hover:bg-control-light rounded-lg transition-colors"
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
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={addItem}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une catégorie
            </button>
          </div>
        )}
      </div>

      {/* 80/20 Analysis */}
      {paretoAnalysis.sorted.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Analyse 80/20</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-control mb-2">
                Causes vitales (80% des effets)
              </h4>
              <div className="bg-control-light rounded-lg p-4">
                {paretoAnalysis.vital.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune donnée</p>
                ) : (
                  <ul className="space-y-2">
                    {paretoAnalysis.vital.map((item, index) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-control text-white text-xs flex items-center justify-center">
                            {index + 1}
                          </span>
                          {item.category}
                        </span>
                        <span className="font-medium">
                          {item.value} ({item.percentage.toFixed(1)}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Causes triviales (20% des effets)
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                {paretoAnalysis.trivial.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucune donnée</p>
                ) : (
                  <ul className="space-y-2">
                    {paretoAnalysis.trivial.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between text-sm text-gray-600"
                      >
                        <span>{item.category}</span>
                        <span>
                          {item.value} ({item.percentage.toFixed(1)}%)
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-improve-light rounded-lg">
            <p className="text-sm">
              <strong>Conclusion :</strong>{' '}
              {paretoAnalysis.vital.length > 0
                ? `En se concentrant sur ${paretoAnalysis.vital.length} cause(s) principale(s),
                   vous pouvez adresser ${paretoAnalysis.vital.length > 0 ? paretoAnalysis.vital[paretoAnalysis.vital.length - 1].cumulative.toFixed(0) : 0}%
                   du problème total.`
                : 'Ajoutez des données pour voir l\'analyse.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

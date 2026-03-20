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

          {/* Chart container */}
          <div className="relative" style={{ height: '350px', paddingBottom: '40px' }}>
            {/* Y-axis labels (left - values) */}
            <div className="absolute left-0 top-0 w-12 flex flex-col justify-between text-xs text-gray-500 text-right pr-2" style={{ height: '280px' }}>
              <span>{paretoAnalysis.maxValue}</span>
              <span>{Math.round(paretoAnalysis.maxValue * 0.5)}</span>
              <span>0</span>
            </div>

            {/* Y-axis labels (right - cumulative %) */}
            <div className="absolute right-0 top-0 w-10 flex flex-col justify-between text-xs text-rose-500 font-medium pl-1" style={{ height: '280px' }}>
              <span>100%</span>
              <span>50%</span>
              <span>0%</span>
            </div>

            {/* Chart area */}
            <div className="absolute left-14 right-12 top-0 bg-gradient-to-b from-gray-50 to-white border border-gray-200 rounded-lg overflow-hidden" style={{ height: '280px' }}>
              {/* Grid lines */}
              <div className="absolute left-0 right-0 border-t border-gray-100" style={{ top: '50%' }} />

              {/* 80% threshold line */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-rose-300 z-20"
                style={{ top: '20%' }}
              >
                <span className="absolute -right-1 -top-5 text-xs text-rose-500 font-bold bg-white px-1 rounded shadow-sm">80%</span>
              </div>

              {/* Main chart content - using flex for even distribution */}
              <div className="absolute inset-0 flex items-end px-6">
                {paretoAnalysis.sorted.map((item, index) => {
                  const heightPercent = (item.value / paretoAnalysis.maxValue) * 100;
                  const isVital = item.cumulative <= 80;

                  return (
                    <div
                      key={item.id}
                      className="flex-1 relative group h-full flex items-end justify-center"
                    >
                      {/* Bar */}
                      <div
                        className={cn(
                          'rounded-t transition-all duration-300 shadow-sm cursor-pointer',
                          isVital ? barColors[index % barColors.length] : 'bg-gray-300',
                          'hover:opacity-80'
                        )}
                        style={{
                          height: `${heightPercent}%`,
                          width: 'clamp(12px, 60%, 32px)'
                        }}
                      />

                      {/* Cumulative point - positioned at center of flex item */}
                      <div
                        className="absolute left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full shadow-md z-30"
                        style={{ top: `${100 - item.cumulative}%` }}
                      />

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50 shadow-xl">
                        <div className="font-semibold text-sm">{item.category}</div>
                        <div className="mt-1 space-y-0.5">
                          <div>Valeur: <span className="font-bold text-blue-300">{item.value}</span> ({item.percentage.toFixed(1)}%)</div>
                          <div>Cumulé: <span className="font-bold text-rose-300">{item.cumulative.toFixed(1)}%</span></div>
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
                          <div className="border-6 border-transparent border-t-gray-800" style={{ borderWidth: '6px' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cumulative line SVG overlay */}
              <svg
                className="absolute pointer-events-none z-10"
                style={{ left: '24px', right: '24px', top: 0, bottom: 0, width: 'calc(100% - 48px)', height: '100%' }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <polyline
                  fill="none"
                  stroke="#E11D48"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                  points={paretoAnalysis.sorted.map((item, index) => {
                    const n = paretoAnalysis.sorted.length;
                    const segmentWidth = 100 / n;
                    const x = segmentWidth * index + segmentWidth / 2;
                    const y = 100 - item.cumulative;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="absolute left-14 right-12 flex px-6" style={{ top: '290px' }}>
              {paretoAnalysis.sorted.map((item) => (
                <div
                  key={`label-${item.id}`}
                  className="flex-1 text-xs text-center text-gray-600 font-medium truncate px-1"
                  title={item.category}
                >
                  {item.category}
                </div>
              ))}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-define">{paretoAnalysis.sorted.length}</div>
              <div className="text-xs text-gray-500">Catégories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-analyze">{paretoAnalysis.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-control">{paretoAnalysis.vital.length}</div>
              <div className="text-xs text-gray-500">Causes vitales (80%)</div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-define rounded" />
              <span className="text-sm text-gray-600">Causes vitales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded" />
              <span className="text-sm text-gray-600">Causes triviales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-control rounded-full" />
              <span className="text-sm text-gray-600">Cumul (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-control" />
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

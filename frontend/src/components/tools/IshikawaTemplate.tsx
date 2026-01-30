import { useState, useEffect } from 'react';
import { Plus, Trash2, GitBranch } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolDefinition } from '@/types';

interface Cause {
  id: string;
  text: string;
}

interface Category {
  id: string;
  name: string;
  causes: Cause[];
}

interface IshikawaData {
  problem: string;
  categories: Category[];
}

interface IshikawaTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Méthode', causes: [] },
  { id: '2', name: 'Main d\'oeuvre', causes: [] },
  { id: '3', name: 'Milieu', causes: [] },
  { id: '4', name: 'Matière', causes: [] },
  { id: '5', name: 'Machine', causes: [] },
  { id: '6', name: 'Mesure', causes: [] },
];

const categoryColors = [
  'bg-define',
  'bg-measure',
  'bg-analyze',
  'bg-improve',
  'bg-control',
  'bg-gray-600',
];

const createEmptyCause = (): Cause => ({
  id: crypto.randomUUID(),
  text: '',
});

export default function IshikawaTemplate({
  data,
  onChange,
  readOnly = false,
}: IshikawaTemplateProps) {
  const [ishikawaData, setIshikawaData] = useState<IshikawaData>({
    problem: data.problem || '',
    categories: data.categories?.length ? data.categories : defaultCategories,
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setIshikawaData({
        problem: data.problem || '',
        categories: data.categories?.length ? data.categories : defaultCategories,
      });
    }
  }, [data]);

  const updateData = (newData: IshikawaData) => {
    setIshikawaData(newData);
    onChange(newData);
  };

  const updateCategoryName = (categoryId: string, name: string) => {
    updateData({
      ...ishikawaData,
      categories: ishikawaData.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, name } : cat
      ),
    });
  };

  const addCause = (categoryId: string) => {
    updateData({
      ...ishikawaData,
      categories: ishikawaData.categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, causes: [...cat.causes, createEmptyCause()] }
          : cat
      ),
    });
  };

  const updateCause = (categoryId: string, causeId: string, text: string) => {
    updateData({
      ...ishikawaData,
      categories: ishikawaData.categories.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              causes: cat.causes.map((cause) =>
                cause.id === causeId ? { ...cause, text } : cause
              ),
            }
          : cat
      ),
    });
  };

  const removeCause = (categoryId: string, causeId: string) => {
    updateData({
      ...ishikawaData,
      categories: ishikawaData.categories.map((cat) =>
        cat.id === categoryId
          ? { ...cat, causes: cat.causes.filter((c) => c.id !== causeId) }
          : cat
      ),
    });
  };

  const topCategories = ishikawaData.categories.slice(0, 3);
  const bottomCategories = ishikawaData.categories.slice(3, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-analyze flex items-center justify-center">
            <GitBranch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Diagramme d'Ishikawa (6M)</h2>
            <p className="text-sm text-gray-500">
              Analyse causes-effet pour identifier les causes racines
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Effet / Problème à analyser
          </label>
          <input
            type="text"
            value={ishikawaData.problem}
            onChange={(e) =>
              updateData({ ...ishikawaData, problem: e.target.value })
            }
            placeholder="Ex: Retards de livraison fréquents"
            className="input text-lg font-medium"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Fishbone Diagram Visual */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Vue Diagramme</h3>
        <div className="relative bg-gray-50 rounded-xl p-8 min-h-[400px]">
          {/* Central spine */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1 bg-gray-400" />

          {/* Problem box (fish head) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-control text-white px-6 py-4 rounded-lg font-semibold max-w-[200px] text-center shadow-lg">
            {ishikawaData.problem || 'Effet / Problème'}
          </div>

          {/* Top categories */}
          <div className="absolute top-4 left-8 right-[220px] flex justify-around">
            {topCategories.map((cat, index) => (
              <div key={cat.id} className="text-center">
                <div className={cn('inline-block px-3 py-1 rounded-lg text-white text-sm font-medium', categoryColors[index])}>
                  {cat.name}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {cat.causes.length} cause(s)
                </div>
                {/* Diagonal line simulation */}
                <div className="w-px h-20 bg-gray-300 mx-auto mt-2 transform rotate-45 origin-top" />
              </div>
            ))}
          </div>

          {/* Bottom categories */}
          <div className="absolute bottom-4 left-8 right-[220px] flex justify-around">
            {bottomCategories.map((cat, index) => (
              <div key={cat.id} className="text-center">
                {/* Diagonal line simulation */}
                <div className="w-px h-20 bg-gray-300 mx-auto mb-2 transform -rotate-45 origin-bottom" />
                <div className="mb-2 text-xs text-gray-500">
                  {cat.causes.length} cause(s)
                </div>
                <div className={cn('inline-block px-3 py-1 rounded-lg text-white text-sm font-medium', categoryColors[index + 3])}>
                  {cat.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Detail */}
      <div className="grid grid-cols-2 gap-4">
        {ishikawaData.categories.map((category, index) => (
          <div key={category.id} className="card overflow-hidden">
            {/* Category header */}
            <div className={cn('p-4 text-white', categoryColors[index])}>
              <input
                type="text"
                value={category.name}
                onChange={(e) => updateCategoryName(category.id, e.target.value)}
                className="bg-transparent border-b border-white/30 focus:border-white outline-none w-full font-semibold placeholder-white/50"
                placeholder="Nom de la catégorie"
                disabled={readOnly}
              />
            </div>

            {/* Causes */}
            <div className="p-4">
              {category.causes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Aucune cause identifiée
                </p>
              ) : (
                <div className="space-y-2 mb-4">
                  {category.causes.map((cause) => (
                    <div key={cause.id} className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', categoryColors[index])} />
                      <input
                        type="text"
                        value={cause.text}
                        onChange={(e) =>
                          updateCause(category.id, cause.id, e.target.value)
                        }
                        placeholder="Décrivez la cause..."
                        className="input flex-1 text-sm"
                        disabled={readOnly}
                      />
                      {!readOnly && (
                        <button
                          onClick={() => removeCause(category.id, cause.id)}
                          className="p-1.5 text-gray-400 hover:text-control hover:bg-control-light rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!readOnly && (
                <button
                  onClick={() => addCause(category.id)}
                  className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter une cause
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Synthèse des causes</h3>
        <div className="grid grid-cols-6 gap-4">
          {ishikawaData.categories.map((cat, index) => (
            <div key={cat.id} className="text-center">
              <div className={cn('text-2xl font-bold', categoryColors[index].replace('bg-', 'text-'))}>
                {cat.causes.length}
              </div>
              <div className="text-xs text-gray-500 truncate">{cat.name}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 text-center">
          <span className="text-gray-500">Total : </span>
          <span className="font-bold text-lg">
            {ishikawaData.categories.reduce((sum, cat) => sum + cat.causes.length, 0)} causes identifiées
          </span>
        </div>
      </div>
    </div>
  );
}

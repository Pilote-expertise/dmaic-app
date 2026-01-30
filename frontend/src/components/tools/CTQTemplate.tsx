import { useState, useEffect } from 'react';
import { Plus, Trash2, Target, ArrowRight } from 'lucide-react';
import type { ToolDefinition } from '@/types';

interface CTQItem {
  id: string;
  customerNeed: string;
  driver: string;
  ctq: string;
  specification: string;
  lowerLimit: string;
  upperLimit: string;
  unit: string;
}

interface CTQData {
  projectContext: string;
  items: CTQItem[];
}

interface CTQTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyItem = (): CTQItem => ({
  id: crypto.randomUUID(),
  customerNeed: '',
  driver: '',
  ctq: '',
  specification: '',
  lowerLimit: '',
  upperLimit: '',
  unit: '',
});

export default function CTQTemplate({
  data,
  onChange,
  readOnly = false,
}: CTQTemplateProps) {
  const [ctqData, setCtqData] = useState<CTQData>({
    projectContext: data.projectContext || '',
    items: data.items?.length ? data.items : [createEmptyItem()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setCtqData({
        projectContext: data.projectContext || '',
        items: data.items?.length ? data.items : [createEmptyItem()],
      });
    }
  }, [data]);

  const updateData = (newData: CTQData) => {
    setCtqData(newData);
    onChange(newData);
  };

  const addItem = () => {
    updateData({
      ...ctqData,
      items: [...ctqData.items, createEmptyItem()],
    });
  };

  const removeItem = (id: string) => {
    if (ctqData.items.length > 1) {
      updateData({
        ...ctqData,
        items: ctqData.items.filter((item) => item.id !== id),
      });
    }
  };

  const updateItem = (id: string, field: keyof CTQItem, value: string) => {
    updateData({
      ...ctqData,
      items: ctqData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-define flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Arbre CTQ</h2>
            <p className="text-sm text-gray-500">
              Critical to Quality - Du besoin client aux spécifications mesurables
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Contexte du projet
          </label>
          <textarea
            value={ctqData.projectContext}
            onChange={(e) =>
              updateData({ ...ctqData, projectContext: e.target.value })
            }
            placeholder="Décrivez le contexte et l'objectif de l'analyse CTQ..."
            className="input min-h-[80px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* CTQ Flow Legend */}
      <div className="card p-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-define" />
            <span>Besoin Client</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-measure" />
            <span>Driver</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-analyze" />
            <span>CTQ</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-improve" />
            <span>Spécification</span>
          </div>
        </div>
      </div>

      {/* CTQ Items */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left bg-define text-white font-medium">
                  Besoin Client
                </th>
                <th className="px-4 py-3 text-left bg-measure text-white font-medium">
                  Driver
                </th>
                <th className="px-4 py-3 text-left bg-analyze text-white font-medium">
                  CTQ
                </th>
                <th className="px-4 py-3 text-left bg-improve text-white font-medium" colSpan={4}>
                  Spécification
                </th>
                <th className="px-2 py-3 bg-gray-50 w-10"></th>
              </tr>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                <th className="px-4 py-2 text-left font-normal">
                  Qu'attend le client ?
                </th>
                <th className="px-4 py-2 text-left font-normal">
                  Facteur de satisfaction
                </th>
                <th className="px-4 py-2 text-left font-normal">
                  Caractéristique critique
                </th>
                <th className="px-4 py-2 text-left font-normal">Description</th>
                <th className="px-4 py-2 text-left font-normal">Limite inf.</th>
                <th className="px-4 py-2 text-left font-normal">Limite sup.</th>
                <th className="px-4 py-2 text-left font-normal">Unité</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {ctqData.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-2 py-2">
                    <textarea
                      value={item.customerNeed}
                      onChange={(e) =>
                        updateItem(item.id, 'customerNeed', e.target.value)
                      }
                      placeholder="Ex: Livraison rapide"
                      className="w-full min-h-[60px] p-2 border border-define/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-define focus:border-transparent text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <textarea
                      value={item.driver}
                      onChange={(e) =>
                        updateItem(item.id, 'driver', e.target.value)
                      }
                      placeholder="Ex: Délai de traitement"
                      className="w-full min-h-[60px] p-2 border border-measure/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-measure focus:border-transparent text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <textarea
                      value={item.ctq}
                      onChange={(e) =>
                        updateItem(item.id, 'ctq', e.target.value)
                      }
                      placeholder="Ex: Temps de cycle commande"
                      className="w-full min-h-[60px] p-2 border border-analyze/30 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-analyze focus:border-transparent text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.specification}
                      onChange={(e) =>
                        updateItem(item.id, 'specification', e.target.value)
                      }
                      placeholder="Description"
                      className="w-full p-2 border border-improve/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-improve focus:border-transparent text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.lowerLimit}
                      onChange={(e) =>
                        updateItem(item.id, 'lowerLimit', e.target.value)
                      }
                      placeholder="Min"
                      className="w-20 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-improve focus:border-transparent text-sm text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.upperLimit}
                      onChange={(e) =>
                        updateItem(item.id, 'upperLimit', e.target.value)
                      }
                      placeholder="Max"
                      className="w-20 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-improve focus:border-transparent text-sm text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) =>
                        updateItem(item.id, 'unit', e.target.value)
                      }
                      placeholder="Ex: h"
                      className="w-16 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-improve focus:border-transparent text-sm text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && ctqData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-gray-400 hover:text-control hover:bg-control-light rounded-lg transition-colors"
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

        {!readOnly && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={addItem}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une ligne CTQ
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Synthèse CTQ</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-define-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-define">
              {new Set(ctqData.items.map((i) => i.customerNeed).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-500">Besoins clients</div>
          </div>
          <div className="bg-measure-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-measure">
              {new Set(ctqData.items.map((i) => i.driver).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-500">Drivers</div>
          </div>
          <div className="bg-analyze-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-analyze">
              {ctqData.items.filter((i) => i.ctq).length}
            </div>
            <div className="text-sm text-gray-500">CTQs identifiés</div>
          </div>
          <div className="bg-improve-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-improve">
              {ctqData.items.filter((i) => i.specification && (i.lowerLimit || i.upperLimit)).length}
            </div>
            <div className="text-sm text-gray-500">Avec spécification</div>
          </div>
        </div>
      </div>
    </div>
  );
}

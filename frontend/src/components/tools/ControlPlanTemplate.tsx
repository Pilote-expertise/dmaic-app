import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, AlertTriangle } from 'lucide-react';
import type { ToolDefinition } from '@/types';

interface ControlItem {
  id: string;
  processStep: string;
  characteristic: string;
  specification: string;
  measurementMethod: string;
  sampleSize: string;
  frequency: string;
  controlMethod: string;
  reactionPlan: string;
  responsible: string;
}

interface ControlPlanData {
  processName: string;
  revision: string;
  date: string;
  preparedBy: string;
  approvedBy: string;
  items: ControlItem[];
}

interface ControlPlanTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyItem = (): ControlItem => ({
  id: crypto.randomUUID(),
  processStep: '',
  characteristic: '',
  specification: '',
  measurementMethod: '',
  sampleSize: '',
  frequency: '',
  controlMethod: '',
  reactionPlan: '',
  responsible: '',
});

export default function ControlPlanTemplate({
  data,
  onChange,
  readOnly = false,
}: ControlPlanTemplateProps) {
  const [planData, setPlanData] = useState<ControlPlanData>({
    processName: data.processName || '',
    revision: data.revision || '1.0',
    date: data.date || new Date().toISOString().split('T')[0],
    preparedBy: data.preparedBy || '',
    approvedBy: data.approvedBy || '',
    items: data.items?.length ? data.items : [createEmptyItem()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setPlanData({
        processName: data.processName || '',
        revision: data.revision || '1.0',
        date: data.date || new Date().toISOString().split('T')[0],
        preparedBy: data.preparedBy || '',
        approvedBy: data.approvedBy || '',
        items: data.items?.length ? data.items : [createEmptyItem()],
      });
    }
  }, [data]);

  const updateData = (newData: ControlPlanData) => {
    setPlanData(newData);
    onChange(newData);
  };

  const addItem = () => {
    updateData({
      ...planData,
      items: [...planData.items, createEmptyItem()],
    });
  };

  const removeItem = (id: string) => {
    if (planData.items.length > 1) {
      updateData({
        ...planData,
        items: planData.items.filter((item) => item.id !== id),
      });
    }
  };

  const updateItem = (id: string, field: keyof ControlItem, value: string) => {
    updateData({
      ...planData,
      items: planData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-control flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Plan de Contrôle</h2>
            <p className="text-sm text-gray-500">
              Définir les actions de contrôle pour maintenir les améliorations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">
              Nom du processus
            </label>
            <input
              type="text"
              value={planData.processName}
              onChange={(e) => updateData({ ...planData, processName: e.target.value })}
              placeholder="Processus concerné"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Révision</label>
            <input
              type="text"
              value={planData.revision}
              onChange={(e) => updateData({ ...planData, revision: e.target.value })}
              placeholder="1.0"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={planData.date}
              onChange={(e) => updateData({ ...planData, date: e.target.value })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Préparé par</label>
            <input
              type="text"
              value={planData.preparedBy}
              onChange={(e) => updateData({ ...planData, preparedBy: e.target.value })}
              placeholder="Nom"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Control Plan Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-control text-white">
                <th className="px-3 py-3 text-left font-medium">Étape</th>
                <th className="px-3 py-3 text-left font-medium">Caractéristique</th>
                <th className="px-3 py-3 text-left font-medium">Spécification</th>
                <th className="px-3 py-3 text-left font-medium">Méthode mesure</th>
                <th className="px-3 py-3 text-left font-medium">Échantillon</th>
                <th className="px-3 py-3 text-left font-medium">Fréquence</th>
                <th className="px-3 py-3 text-left font-medium">Méthode contrôle</th>
                <th className="px-3 py-3 text-left font-medium">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  Plan de réaction
                </th>
                <th className="px-3 py-3 text-left font-medium">Responsable</th>
                <th className="px-2 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {planData.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.processStep}
                      onChange={(e) => updateItem(item.id, 'processStep', e.target.value)}
                      placeholder="Étape"
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.characteristic}
                      onChange={(e) => updateItem(item.id, 'characteristic', e.target.value)}
                      placeholder="Caractéristique"
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.specification}
                      onChange={(e) => updateItem(item.id, 'specification', e.target.value)}
                      placeholder="LSL-USL"
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.measurementMethod}
                      onChange={(e) => updateItem(item.id, 'measurementMethod', e.target.value)}
                      placeholder="Instrument"
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.sampleSize}
                      onChange={(e) => updateItem(item.id, 'sampleSize', e.target.value)}
                      placeholder="n=5"
                      className="w-20 p-2 border border-gray-200 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) => updateItem(item.id, 'frequency', e.target.value)}
                      placeholder="Horaire"
                      className="w-24 p-2 border border-gray-200 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.controlMethod}
                      onChange={(e) => updateItem(item.id, 'controlMethod', e.target.value)}
                      placeholder="Carte X-R"
                      className="w-full p-2 border border-gray-200 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.reactionPlan}
                      onChange={(e) => updateItem(item.id, 'reactionPlan', e.target.value)}
                      placeholder="Action si hors limite"
                      className="w-full p-2 border border-control/30 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.responsible}
                      onChange={(e) => updateItem(item.id, 'responsible', e.target.value)}
                      placeholder="Nom"
                      className="w-24 p-2 border border-gray-200 rounded text-sm"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-2 py-2">
                    {!readOnly && planData.items.length > 1 && (
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-gray-400 hover:text-control hover:bg-control-light rounded transition-colors"
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
              Ajouter un point de contrôle
            </button>
          </div>
        )}
      </div>

      {/* Approval section */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Approbation</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Préparé par
            </label>
            <input
              type="text"
              value={planData.preparedBy}
              onChange={(e) => updateData({ ...planData, preparedBy: e.target.value })}
              placeholder="Nom et signature"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Approuvé par
            </label>
            <input
              type="text"
              value={planData.approvedBy}
              onChange={(e) => updateData({ ...planData, approvedBy: e.target.value })}
              placeholder="Nom et signature"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Résumé</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-control-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-control">
              {planData.items.length}
            </div>
            <div className="text-sm text-gray-500">Points de contrôle</div>
          </div>
          <div className="bg-analyze-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-analyze">
              {planData.items.filter((i) => i.reactionPlan).length}
            </div>
            <div className="text-sm text-gray-500">Plans de réaction définis</div>
          </div>
          <div className="bg-improve-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-improve">
              {new Set(planData.items.map((i) => i.responsible).filter(Boolean)).size}
            </div>
            <div className="text-sm text-gray-500">Responsables assignés</div>
          </div>
        </div>
      </div>
    </div>
  );
}

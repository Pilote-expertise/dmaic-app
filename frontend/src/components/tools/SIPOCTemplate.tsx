import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolDefinition } from '@/types';

interface SIPOCRow {
  id: string;
  suppliers: string;
  inputs: string;
  process: string;
  outputs: string;
  customers: string;
}

interface SIPOCData {
  processName: string;
  processDescription: string;
  rows: SIPOCRow[];
}

interface SIPOCTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const columnConfig = [
  { key: 'suppliers', label: 'Suppliers', color: 'bg-define', description: 'Fournisseurs' },
  { key: 'inputs', label: 'Inputs', color: 'bg-measure', description: 'Entrées' },
  { key: 'process', label: 'Process', color: 'bg-analyze', description: 'Processus' },
  { key: 'outputs', label: 'Outputs', color: 'bg-improve', description: 'Sorties' },
  { key: 'customers', label: 'Customers', color: 'bg-control', description: 'Clients' },
];

const createEmptyRow = (): SIPOCRow => ({
  id: crypto.randomUUID(),
  suppliers: '',
  inputs: '',
  process: '',
  outputs: '',
  customers: '',
});

export default function SIPOCTemplate({
  data,
  onChange,
  readOnly = false,
}: SIPOCTemplateProps) {
  const [sipocData, setSipocData] = useState<SIPOCData>({
    processName: data.processName || '',
    processDescription: data.processDescription || '',
    rows: data.rows?.length ? data.rows : [createEmptyRow()],
  });

  useEffect(() => {
    if (data.rows?.length) {
      setSipocData({
        processName: data.processName || '',
        processDescription: data.processDescription || '',
        rows: data.rows,
      });
    }
  }, [data]);

  const updateData = (newData: SIPOCData) => {
    setSipocData(newData);
    onChange(newData);
  };

  const addRow = () => {
    updateData({
      ...sipocData,
      rows: [...sipocData.rows, createEmptyRow()],
    });
  };

  const removeRow = (id: string) => {
    if (sipocData.rows.length > 1) {
      updateData({
        ...sipocData,
        rows: sipocData.rows.filter((row) => row.id !== id),
      });
    }
  };

  const updateRow = (id: string, field: keyof SIPOCRow, value: string) => {
    updateData({
      ...sipocData,
      rows: sipocData.rows.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex gap-1">
            {columnConfig.map((col) => (
              <div
                key={col.key}
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm',
                  col.color
                )}
              >
                {col.label[0]}
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Diagramme SIPOC</h2>
            <p className="text-sm text-gray-500">
              Suppliers - Inputs - Process - Outputs - Customers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nom du processus
            </label>
            <input
              type="text"
              value={sipocData.processName}
              onChange={(e) =>
                updateData({ ...sipocData, processName: e.target.value })
              }
              placeholder="Ex: Processus de commande client"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Description du processus
            </label>
            <input
              type="text"
              value={sipocData.processDescription}
              onChange={(e) =>
                updateData({ ...sipocData, processDescription: e.target.value })
              }
              placeholder="Ex: Gestion des commandes de A à Z"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* SIPOC Matrix */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-10 px-2 py-3 bg-gray-50"></th>
                {columnConfig.map((col) => (
                  <th
                    key={col.key}
                    className={cn('px-4 py-3 text-left', col.color)}
                  >
                    <div className="text-white">
                      <div className="font-semibold">{col.label}</div>
                      <div className="text-xs font-normal opacity-80">
                        {col.description}
                      </div>
                    </div>
                  </th>
                ))}
                <th className="w-10 px-2 py-3 bg-gray-50"></th>
              </tr>
            </thead>
            <tbody>
              {sipocData.rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-2 py-2 text-center text-gray-400">
                    <GripVertical className="w-4 h-4 mx-auto" />
                  </td>
                  {columnConfig.map((col) => (
                    <td key={col.key} className="px-2 py-2">
                      <textarea
                        value={row[col.key as keyof SIPOCRow] || ''}
                        onChange={(e) =>
                          updateRow(row.id, col.key as keyof SIPOCRow, e.target.value)
                        }
                        placeholder={`${col.description}...`}
                        className="w-full min-h-[80px] p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-define focus:border-transparent text-sm"
                        disabled={readOnly}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    {!readOnly && sipocData.rows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
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
              onClick={addRow}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter une ligne
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="card p-4">
        <h3 className="font-medium mb-3">Légende SIPOC</h3>
        <div className="grid grid-cols-5 gap-4 text-sm">
          {columnConfig.map((col) => (
            <div key={col.key} className="flex items-start gap-2">
              <div className={cn('w-3 h-3 rounded mt-1', col.color)} />
              <div>
                <div className="font-medium">{col.label}</div>
                <div className="text-gray-500 text-xs">
                  {col.key === 'suppliers' && 'Qui fournit les entrées ?'}
                  {col.key === 'inputs' && 'Quelles sont les entrées ?'}
                  {col.key === 'process' && 'Quelles sont les étapes clés ?'}
                  {col.key === 'outputs' && 'Quelles sont les sorties ?'}
                  {col.key === 'customers' && 'Qui reçoit les sorties ?'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

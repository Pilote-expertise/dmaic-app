import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, AlertTriangle, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolDefinition } from '@/types';

interface AMDECRow {
  id: string;
  function: string;
  failureMode: string;
  effect: string;
  severity: number;
  cause: string;
  occurrence: number;
  currentControls: string;
  detection: number;
  rpn: number;
  recommendedAction: string;
  responsible: string;
  deadline: string;
  newSeverity: number;
  newOccurrence: number;
  newDetection: number;
  newRpn: number;
}

interface AMDECData {
  processName: string;
  analysisDate: string;
  team: string;
  rows: AMDECRow[];
}

interface AMDECTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition?: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyRow = (): AMDECRow => ({
  id: crypto.randomUUID(),
  function: '',
  failureMode: '',
  effect: '',
  severity: 1,
  cause: '',
  occurrence: 1,
  currentControls: '',
  detection: 1,
  rpn: 1,
  recommendedAction: '',
  responsible: '',
  deadline: '',
  newSeverity: 1,
  newOccurrence: 1,
  newDetection: 1,
  newRpn: 1,
});

const getRPNColor = (rpn: number): string => {
  if (rpn >= 200) return 'bg-control text-white';
  if (rpn >= 120) return 'bg-analyze text-white';
  if (rpn >= 80) return 'bg-yellow-500 text-white';
  return 'bg-improve text-white';
};

export default function AMDECTemplate({
  data,
  onChange,
  readOnly = false,
}: AMDECTemplateProps) {
  const [amdecData, setAmdecData] = useState<AMDECData>({
    processName: data.processName || '',
    analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
    team: data.team || '',
    rows: data.rows?.length ? data.rows : [createEmptyRow()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setAmdecData({
        processName: data.processName || '',
        analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
        team: data.team || '',
        rows: data.rows?.length ? data.rows : [createEmptyRow()],
      });
    }
  }, [data]);

  const updateData = (newData: AMDECData) => {
    setAmdecData(newData);
    onChange(newData);
  };

  const addRow = () => {
    updateData({
      ...amdecData,
      rows: [...amdecData.rows, createEmptyRow()],
    });
  };

  const removeRow = (id: string) => {
    if (amdecData.rows.length > 1) {
      updateData({
        ...amdecData,
        rows: amdecData.rows.filter((row) => row.id !== id),
      });
    }
  };

  const updateRow = (id: string, field: keyof AMDECRow, value: string | number) => {
    updateData({
      ...amdecData,
      rows: amdecData.rows.map((row) => {
        if (row.id !== id) return row;

        const updatedRow = { ...row, [field]: value };

        // Auto-calculate RPN
        if (['severity', 'occurrence', 'detection'].includes(field)) {
          updatedRow.rpn =
            updatedRow.severity * updatedRow.occurrence * updatedRow.detection;
        }

        // Auto-calculate new RPN
        if (['newSeverity', 'newOccurrence', 'newDetection'].includes(field)) {
          updatedRow.newRpn =
            updatedRow.newSeverity * updatedRow.newOccurrence * updatedRow.newDetection;
        }

        return updatedRow;
      }),
    });
  };

  // Statistics
  const stats = useMemo(() => {
    const rows = amdecData.rows.filter((r) => r.rpn > 0);
    if (rows.length === 0) return { avgRpn: 0, maxRpn: 0, critical: 0, improved: 0 };

    return {
      avgRpn: Math.round(rows.reduce((sum, r) => sum + r.rpn, 0) / rows.length),
      maxRpn: Math.max(...rows.map((r) => r.rpn)),
      critical: rows.filter((r) => r.rpn >= 200).length,
      improved: rows.filter((r) => r.newRpn < r.rpn && r.recommendedAction).length,
    };
  }, [amdecData.rows]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-control flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Analyse AMDEC / FMEA</h2>
            <p className="text-sm text-gray-500">
              Analyse des Modes de Défaillance, de leurs Effets et de leur Criticité
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Processus analysé
            </label>
            <input
              type="text"
              value={amdecData.processName}
              onChange={(e) =>
                updateData({ ...amdecData, processName: e.target.value })
              }
              placeholder="Nom du processus"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Date d'analyse
            </label>
            <input
              type="date"
              value={amdecData.analysisDate}
              onChange={(e) =>
                updateData({ ...amdecData, analysisDate: e.target.value })
              }
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Équipe</label>
            <input
              type="text"
              value={amdecData.team}
              onChange={(e) =>
                updateData({ ...amdecData, team: e.target.value })
              }
              placeholder="Membres de l'équipe"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* RPN Legend */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Échelle RPN :</span>
            <div className="flex items-center gap-2">
              <span className={cn('px-2 py-0.5 rounded text-xs', getRPNColor(50))}>
                &lt;80 Faible
              </span>
              <span className={cn('px-2 py-0.5 rounded text-xs', getRPNColor(100))}>
                80-119 Modéré
              </span>
              <span className={cn('px-2 py-0.5 rounded text-xs', getRPNColor(150))}>
                120-199 Élevé
              </span>
              <span className={cn('px-2 py-0.5 rounded text-xs', getRPNColor(250))}>
                ≥200 Critique
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            RPN = Sévérité × Occurrence × Détection (1-10 chacun)
          </div>
        </div>
      </div>

      {/* AMDEC Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th colSpan={4} className="bg-define text-white px-2 py-2 text-center">
                  Identification
                </th>
                <th colSpan={4} className="bg-measure text-white px-2 py-2 text-center">
                  Évaluation initiale
                </th>
                <th colSpan={4} className="bg-improve text-white px-2 py-2 text-center">
                  Actions correctives
                </th>
                <th colSpan={4} className="bg-control text-white px-2 py-2 text-center">
                  Évaluation finale
                </th>
                <th className="w-10 bg-gray-50"></th>
              </tr>
              <tr className="bg-gray-50 text-xs">
                <th className="px-2 py-2 text-left">Fonction</th>
                <th className="px-2 py-2 text-left">Mode défaillance</th>
                <th className="px-2 py-2 text-left">Effet</th>
                <th className="px-2 py-2 text-left">Cause</th>
                <th className="px-2 py-2 text-center w-12">S</th>
                <th className="px-2 py-2 text-center w-12">O</th>
                <th className="px-2 py-2 text-center w-12">D</th>
                <th className="px-2 py-2 text-center w-16">RPN</th>
                <th className="px-2 py-2 text-left">Actions</th>
                <th className="px-2 py-2 text-left">Responsable</th>
                <th className="px-2 py-2 text-left">Délai</th>
                <th className="px-2 py-2 text-left">Contrôles</th>
                <th className="px-2 py-2 text-center w-12">S'</th>
                <th className="px-2 py-2 text-center w-12">O'</th>
                <th className="px-2 py-2 text-center w-12">D'</th>
                <th className="px-2 py-2 text-center w-16">RPN'</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {amdecData.rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  {/* Identification */}
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={row.function}
                      onChange={(e) => updateRow(row.id, 'function', e.target.value)}
                      className="w-full p-1 border border-gray-200 rounded text-xs"
                      placeholder="Fonction"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={row.failureMode}
                      onChange={(e) => updateRow(row.id, 'failureMode', e.target.value)}
                      className="w-full p-1 border border-gray-200 rounded text-xs"
                      placeholder="Mode"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={row.effect}
                      onChange={(e) => updateRow(row.id, 'effect', e.target.value)}
                      className="w-full p-1 border border-gray-200 rounded text-xs"
                      placeholder="Effet"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={row.cause}
                      onChange={(e) => updateRow(row.id, 'cause', e.target.value)}
                      className="w-full p-1 border border-gray-200 rounded text-xs"
                      placeholder="Cause"
                      disabled={readOnly}
                    />
                  </td>

                  {/* Initial evaluation */}
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.severity}
                      onChange={(e) => updateRow(row.id, 'severity', parseInt(e.target.value) || 1)}
                      className="w-12 p-1 border border-gray-200 rounded text-xs text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.occurrence}
                      onChange={(e) => updateRow(row.id, 'occurrence', parseInt(e.target.value) || 1)}
                      className="w-12 p-1 border border-gray-200 rounded text-xs text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.detection}
                      onChange={(e) => updateRow(row.id, 'detection', parseInt(e.target.value) || 1)}
                      className="w-12 p-1 border border-gray-200 rounded text-xs text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <div
                      className={cn(
                        'px-2 py-1 rounded text-center font-bold text-xs',
                        getRPNColor(row.rpn)
                      )}
                    >
                      {row.rpn}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={row.recommendedAction}
                      onChange={(e) => updateRow(row.id, 'recommendedAction', e.target.value)}
                      className="w-full p-1 border border-gray-200 rounded text-xs"
                      placeholder="Action"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={row.responsible}
                      onChange={(e) => updateRow(row.id, 'responsible', e.target.value)}
                      className="w-full p-1 border border-gray-200 rounded text-xs"
                      placeholder="Resp."
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="date"
                      value={row.deadline}
                      onChange={(e) => updateRow(row.id, 'deadline', e.target.value)}
                      className="w-28 p-1 border border-gray-200 rounded text-xs"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="text"
                      value={row.currentControls}
                      onChange={(e) => updateRow(row.id, 'currentControls', e.target.value)}
                      className="w-full p-1 border border-gray-200 rounded text-xs"
                      placeholder="Contrôles"
                      disabled={readOnly}
                    />
                  </td>

                  {/* Final evaluation */}
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.newSeverity}
                      onChange={(e) => updateRow(row.id, 'newSeverity', parseInt(e.target.value) || 1)}
                      className="w-12 p-1 border border-gray-200 rounded text-xs text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.newOccurrence}
                      onChange={(e) => updateRow(row.id, 'newOccurrence', parseInt(e.target.value) || 1)}
                      className="w-12 p-1 border border-gray-200 rounded text-xs text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={row.newDetection}
                      onChange={(e) => updateRow(row.id, 'newDetection', parseInt(e.target.value) || 1)}
                      className="w-12 p-1 border border-gray-200 rounded text-xs text-center"
                      disabled={readOnly}
                    />
                  </td>
                  <td className="px-1 py-1">
                    <div className="flex items-center gap-1">
                      <div
                        className={cn(
                          'px-2 py-1 rounded text-center font-bold text-xs',
                          getRPNColor(row.newRpn)
                        )}
                      >
                        {row.newRpn}
                      </div>
                      {row.newRpn < row.rpn && (
                        <TrendingDown className="w-3 h-3 text-improve" />
                      )}
                    </div>
                  </td>

                  <td className="px-1 py-1">
                    {!readOnly && amdecData.rows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
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
              onClick={addRow}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un mode de défaillance
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Synthèse AMDEC</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.avgRpn}</div>
            <div className="text-sm text-gray-500">RPN moyen</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className={cn('text-2xl font-bold', stats.maxRpn >= 200 ? 'text-control' : 'text-gray-700')}>
              {stats.maxRpn}
            </div>
            <div className="text-sm text-gray-500">RPN max</div>
          </div>
          <div className="bg-control-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-control">{stats.critical}</div>
            <div className="text-sm text-gray-500">Critiques (≥200)</div>
          </div>
          <div className="bg-improve-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-improve">{stats.improved}</div>
            <div className="text-sm text-gray-500">Améliorés</div>
          </div>
        </div>
      </div>
    </div>
  );
}

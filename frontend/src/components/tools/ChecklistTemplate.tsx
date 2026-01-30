import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolDefinition } from '@/types';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  comment: string;
  status: 'ok' | 'nok' | 'na' | 'pending';
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface ChecklistData {
  title: string;
  description: string;
  reviewDate: string;
  reviewer: string;
  sections: ChecklistSection[];
}

interface ChecklistTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyItem = (): ChecklistItem => ({
  id: crypto.randomUUID(),
  text: '',
  checked: false,
  comment: '',
  status: 'pending',
});

const createEmptySection = (): ChecklistSection => ({
  id: crypto.randomUUID(),
  title: '',
  items: [createEmptyItem()],
});

const statusConfig = {
  ok: { label: 'OK', color: 'bg-improve text-white', icon: CheckSquare },
  nok: { label: 'NOK', color: 'bg-control text-white', icon: AlertCircle },
  na: { label: 'N/A', color: 'bg-gray-400 text-white', icon: Square },
  pending: { label: '?', color: 'bg-gray-200 text-gray-600', icon: Square },
};

export default function ChecklistTemplate({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}: ChecklistTemplateProps) {
  const [checklistData, setChecklistData] = useState<ChecklistData>({
    title: data.title || toolDefinition?.name || '',
    description: data.description || '',
    reviewDate: data.reviewDate || new Date().toISOString().split('T')[0],
    reviewer: data.reviewer || '',
    sections: data.sections?.length ? data.sections : [createEmptySection()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setChecklistData({
        title: data.title || toolDefinition?.name || '',
        description: data.description || '',
        reviewDate: data.reviewDate || new Date().toISOString().split('T')[0],
        reviewer: data.reviewer || '',
        sections: data.sections?.length ? data.sections : [createEmptySection()],
      });
    }
  }, [data, toolDefinition]);

  const updateData = (newData: ChecklistData) => {
    setChecklistData(newData);
    onChange(newData);
  };

  // Section management
  const addSection = () => {
    updateData({
      ...checklistData,
      sections: [...checklistData.sections, createEmptySection()],
    });
  };

  const removeSection = (sectionId: string) => {
    if (checklistData.sections.length > 1) {
      updateData({
        ...checklistData,
        sections: checklistData.sections.filter((s) => s.id !== sectionId),
      });
    }
  };

  const updateSectionTitle = (sectionId: string, title: string) => {
    updateData({
      ...checklistData,
      sections: checklistData.sections.map((s) =>
        s.id === sectionId ? { ...s, title } : s
      ),
    });
  };

  // Item management
  const addItem = (sectionId: string) => {
    updateData({
      ...checklistData,
      sections: checklistData.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: [...s.items, createEmptyItem()] }
          : s
      ),
    });
  };

  const removeItem = (sectionId: string, itemId: string) => {
    updateData({
      ...checklistData,
      sections: checklistData.sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
          : s
      ),
    });
  };

  const updateItem = (sectionId: string, itemId: string, field: keyof ChecklistItem, value: string | boolean) => {
    updateData({
      ...checklistData,
      sections: checklistData.sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((i) =>
                i.id === itemId ? { ...i, [field]: value } : i
              ),
            }
          : s
      ),
    });
  };

  // Calculate stats
  const allItems = checklistData.sections.flatMap((s) => s.items);
  const stats = {
    total: allItems.length,
    ok: allItems.filter((i) => i.status === 'ok').length,
    nok: allItems.filter((i) => i.status === 'nok').length,
    na: allItems.filter((i) => i.status === 'na').length,
    pending: allItems.filter((i) => i.status === 'pending').length,
  };

  const completionRate = stats.total > 0
    ? Math.round(((stats.ok + stats.nok + stats.na) / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-improve flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Checklist de validation</h2>
            <p className="text-sm text-gray-500">
              Vérifiez point par point les critères requis
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">Titre</label>
            <input
              type="text"
              value={checklistData.title}
              onChange={(e) => updateData({ ...checklistData, title: e.target.value })}
              placeholder="Titre de la checklist"
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Date de revue</label>
            <input
              type="date"
              value={checklistData.reviewDate}
              onChange={(e) => updateData({ ...checklistData, reviewDate: e.target.value })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Reviewer</label>
            <input
              type="text"
              value={checklistData.reviewer}
              onChange={(e) => updateData({ ...checklistData, reviewer: e.target.value })}
              placeholder="Nom"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progression</span>
          <span className="text-sm text-gray-500">{completionRate}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
          {stats.ok > 0 && (
            <div
              className="bg-improve h-full"
              style={{ width: `${(stats.ok / stats.total) * 100}%` }}
            />
          )}
          {stats.nok > 0 && (
            <div
              className="bg-control h-full"
              style={{ width: `${(stats.nok / stats.total) * 100}%` }}
            />
          )}
          {stats.na > 0 && (
            <div
              className="bg-gray-400 h-full"
              style={{ width: `${(stats.na / stats.total) * 100}%` }}
            />
          )}
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-improve" />
            OK ({stats.ok})
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-control" />
            NOK ({stats.nok})
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-400" />
            N/A ({stats.na})
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-200" />
            En attente ({stats.pending})
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {checklistData.sections.map((section, sectionIndex) => (
          <div key={section.id} className="card overflow-hidden">
            {/* Section header */}
            <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-100">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                placeholder={`Section ${sectionIndex + 1}`}
                className="flex-1 bg-transparent font-medium focus:outline-none"
                disabled={readOnly}
              />
              {!readOnly && checklistData.sections.length > 1 && (
                <button
                  onClick={() => removeSection(section.id)}
                  className="p-1 text-gray-400 hover:text-control hover:bg-control-light rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-100">
              {section.items.map((item, itemIndex) => (
                <div key={item.id} className="p-4 flex items-start gap-3">
                  {/* Status buttons */}
                  <div className="flex gap-1">
                    {(['ok', 'nok', 'na'] as const).map((status) => {
                      const config = statusConfig[status];
                      return (
                        <button
                          key={status}
                          onClick={() => updateItem(section.id, item.id, 'status', status)}
                          className={cn(
                            'w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all',
                            item.status === status
                              ? config.color
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          )}
                          disabled={readOnly}
                          title={config.label}
                        >
                          {config.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Item content */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => updateItem(section.id, item.id, 'text', e.target.value)}
                      placeholder={`Critère ${itemIndex + 1}`}
                      className="input"
                      disabled={readOnly}
                    />
                    {(item.status === 'nok' || item.comment) && (
                      <input
                        type="text"
                        value={item.comment}
                        onChange={(e) => updateItem(section.id, item.id, 'comment', e.target.value)}
                        placeholder="Commentaire / Action requise"
                        className={cn(
                          'input text-sm',
                          item.status === 'nok' && 'border-control/30'
                        )}
                        disabled={readOnly}
                      />
                    )}
                  </div>

                  {/* Remove button */}
                  {!readOnly && section.items.length > 1 && (
                    <button
                      onClick={() => removeItem(section.id, item.id)}
                      className="p-2 text-gray-400 hover:text-control hover:bg-control-light rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add item button */}
            {!readOnly && (
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={() => addItem(section.id)}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un critère
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          onClick={addSection}
          className="btn btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une section
        </button>
      )}

      {/* Summary */}
      {stats.nok > 0 && (
        <div className="card p-6 border-control/30">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-control">
            <AlertCircle className="w-5 h-5" />
            Points non conformes ({stats.nok})
          </h3>
          <ul className="space-y-2">
            {checklistData.sections.flatMap((s) =>
              s.items
                .filter((i) => i.status === 'nok')
                .map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-control mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium">{item.text || 'Sans titre'}</span>
                      {item.comment && (
                        <p className="text-gray-500 text-xs">{item.comment}</p>
                      )}
                    </div>
                  </li>
                ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

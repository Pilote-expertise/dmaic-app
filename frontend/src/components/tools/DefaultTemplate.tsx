import { useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import type { ToolDefinition } from '@/types';

interface DefaultTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

export default function DefaultTemplate({
  data,
  onChange,
  toolDefinition,
  readOnly = false,
}: DefaultTemplateProps) {
  const [notes, setNotes] = useState<string>(data.notes || '');
  const [items, setItems] = useState<string[]>(data.items || []);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onChange({ ...data, notes: value, items });
  };

  const addItem = () => {
    const newItems = [...items, ''];
    setItems(newItems);
    onChange({ ...data, notes, items: newItems });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    onChange({ ...data, notes, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange({ ...data, notes, items: newItems });
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{toolDefinition?.nameFr || toolDefinition?.name}</h2>
            <p className="text-sm text-gray-500">{toolDefinition?.descriptionFr || toolDefinition?.description}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Notes section */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Notes et observations
          </label>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Ajoutez vos notes ici..."
            className="input min-h-[150px] resize-none"
            disabled={readOnly}
          />
        </div>

        {/* Items list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Éléments</label>
            {!readOnly && (
              <button
                onClick={addItem}
                className="text-sm text-define hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Aucun élément. Cliquez sur "Ajouter" pour commencer.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    placeholder={`Élément ${index + 1}`}
                    className="input flex-1"
                    disabled={readOnly}
                  />
                  {!readOnly && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-gray-400 hover:text-control hover:bg-control-light rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            <strong>Note :</strong> Ce template est générique. Utilisez les notes
            et les éléments pour documenter vos analyses. Les templates spécifiques
            seront disponibles pour chaque outil.
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, Trash2, MessageSquare, Users } from 'lucide-react';
import type { ToolDefinition } from '@/types';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
}

interface VoiceEntry {
  id: string;
  segmentId: string;
  verbatim: string;
  need: string;
  priority: 'high' | 'medium' | 'low';
  source: string;
}

interface VOCData {
  projectContext: string;
  segments: CustomerSegment[];
  voices: VoiceEntry[];
}

interface VOCTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptySegment = (): CustomerSegment => ({
  id: crypto.randomUUID(),
  name: '',
  description: '',
});

const createEmptyVoice = (segmentId: string = ''): VoiceEntry => ({
  id: crypto.randomUUID(),
  segmentId,
  verbatim: '',
  need: '',
  priority: 'medium',
  source: '',
});

export default function VOCTemplate({
  data,
  onChange,
  readOnly = false,
}: VOCTemplateProps) {
  const [vocData, setVocData] = useState<VOCData>({
    projectContext: data.projectContext || '',
    segments: data.segments?.length ? data.segments : [createEmptySegment()],
    voices: data.voices?.length ? data.voices : [],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setVocData({
        projectContext: data.projectContext || '',
        segments: data.segments?.length ? data.segments : [createEmptySegment()],
        voices: data.voices || [],
      });
    }
  }, [data]);

  const updateData = (newData: VOCData) => {
    setVocData(newData);
    onChange(newData);
  };

  // Segments management
  const addSegment = () => {
    updateData({
      ...vocData,
      segments: [...vocData.segments, createEmptySegment()],
    });
  };

  const removeSegment = (id: string) => {
    if (vocData.segments.length > 1) {
      updateData({
        ...vocData,
        segments: vocData.segments.filter((s) => s.id !== id),
        voices: vocData.voices.filter((v) => v.segmentId !== id),
      });
    }
  };

  const updateSegment = (id: string, field: keyof CustomerSegment, value: string) => {
    updateData({
      ...vocData,
      segments: vocData.segments.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  // Voices management
  const addVoice = (segmentId: string) => {
    updateData({
      ...vocData,
      voices: [...vocData.voices, createEmptyVoice(segmentId)],
    });
  };

  const removeVoice = (id: string) => {
    updateData({
      ...vocData,
      voices: vocData.voices.filter((v) => v.id !== id),
    });
  };

  const updateVoice = (id: string, field: keyof VoiceEntry, value: string) => {
    updateData({
      ...vocData,
      voices: vocData.voices.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    });
  };

  const getVoicesForSegment = (segmentId: string) =>
    vocData.voices.filter((v) => v.segmentId === segmentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-measure flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Voix du Client (VOC)</h2>
            <p className="text-sm text-gray-500">
              Capturez et analysez les besoins des clients
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Contexte du projet
          </label>
          <textarea
            value={vocData.projectContext}
            onChange={(e) =>
              updateData({ ...vocData, projectContext: e.target.value })
            }
            placeholder="Décrivez le contexte et les objectifs de la collecte VOC..."
            className="input min-h-[80px] resize-none"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Customer Segments */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-define" />
            Segments Clients
          </h3>
          {!readOnly && (
            <button
              onClick={addSegment}
              className="btn btn-secondary text-sm flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Ajouter un segment
            </button>
          )}
        </div>

        <div className="space-y-4">
          {vocData.segments.map((segment) => (
            <div
              key={segment.id}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Segment header */}
              <div className="bg-gray-50 p-4 flex items-center gap-3">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={segment.name}
                    onChange={(e) =>
                      updateSegment(segment.id, 'name', e.target.value)
                    }
                    placeholder="Nom du segment"
                    className="input font-medium"
                    disabled={readOnly}
                  />
                  <input
                    type="text"
                    value={segment.description}
                    onChange={(e) =>
                      updateSegment(segment.id, 'description', e.target.value)
                    }
                    placeholder="Description"
                    className="input"
                    disabled={readOnly}
                  />
                </div>
                {!readOnly && vocData.segments.length > 1 && (
                  <button
                    onClick={() => removeSegment(segment.id)}
                    className="p-2 text-gray-400 hover:text-control hover:bg-control-light rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Voices for this segment */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500">
                    {getVoicesForSegment(segment.id).length} voix capturées
                  </span>
                  {!readOnly && (
                    <button
                      onClick={() => addVoice(segment.id)}
                      className="text-sm text-define hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une voix
                    </button>
                  )}
                </div>

                {getVoicesForSegment(segment.id).length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-4">
                    Aucune voix capturée pour ce segment
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getVoicesForSegment(segment.id).map((voice) => (
                      <div
                        key={voice.id}
                        className="bg-white border border-gray-100 rounded-lg p-4"
                      >
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Verbatim client
                            </label>
                            <textarea
                              value={voice.verbatim}
                              onChange={(e) =>
                                updateVoice(voice.id, 'verbatim', e.target.value)
                              }
                              placeholder="Citation exacte du client..."
                              className="input text-sm min-h-[60px] resize-none"
                              disabled={readOnly}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">
                              Besoin identifié
                            </label>
                            <textarea
                              value={voice.need}
                              onChange={(e) =>
                                updateVoice(voice.id, 'need', e.target.value)
                              }
                              placeholder="Besoin traduit..."
                              className="input text-sm min-h-[60px] resize-none"
                              disabled={readOnly}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">
                              Source
                            </label>
                            <input
                              type="text"
                              value={voice.source}
                              onChange={(e) =>
                                updateVoice(voice.id, 'source', e.target.value)
                              }
                              placeholder="Entretien, enquête, réclamation..."
                              className="input text-sm"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="w-32">
                            <label className="block text-xs text-gray-500 mb-1">
                              Priorité
                            </label>
                            <select
                              value={voice.priority}
                              onChange={(e) =>
                                updateVoice(voice.id, 'priority', e.target.value)
                              }
                              className="input text-sm"
                              disabled={readOnly}
                            >
                              <option value="high">Haute</option>
                              <option value="medium">Moyenne</option>
                              <option value="low">Basse</option>
                            </select>
                          </div>
                          {!readOnly && (
                            <button
                              onClick={() => removeVoice(voice.id)}
                              className="p-2 text-gray-400 hover:text-control hover:bg-control-light rounded-lg transition-colors mt-5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Synthèse</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-define">
              {vocData.segments.length}
            </div>
            <div className="text-sm text-gray-500">Segments clients</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-measure">
              {vocData.voices.length}
            </div>
            <div className="text-sm text-gray-500">Voix capturées</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-control">
              {vocData.voices.filter((v) => v.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-500">Priorités hautes</div>
          </div>
        </div>
      </div>
    </div>
  );
}

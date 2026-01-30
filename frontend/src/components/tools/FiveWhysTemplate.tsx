import { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, ArrowDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ToolDefinition } from '@/types';

interface WhyChain {
  id: string;
  problem: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCause: string;
  countermeasure: string;
}

interface FiveWhysData {
  analysisDate: string;
  analyst: string;
  chains: WhyChain[];
}

interface FiveWhysTemplateProps {
  data: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  toolDefinition: ToolDefinition;
  readOnly?: boolean;
}

const createEmptyChain = (): WhyChain => ({
  id: crypto.randomUUID(),
  problem: '',
  why1: '',
  why2: '',
  why3: '',
  why4: '',
  why5: '',
  rootCause: '',
  countermeasure: '',
});

export default function FiveWhysTemplate({
  data,
  onChange,
  readOnly = false,
}: FiveWhysTemplateProps) {
  const [fiveWhysData, setFiveWhysData] = useState<FiveWhysData>({
    analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
    analyst: data.analyst || '',
    chains: data.chains?.length ? data.chains : [createEmptyChain()],
  });

  useEffect(() => {
    if (Object.keys(data).length > 0) {
      setFiveWhysData({
        analysisDate: data.analysisDate || new Date().toISOString().split('T')[0],
        analyst: data.analyst || '',
        chains: data.chains?.length ? data.chains : [createEmptyChain()],
      });
    }
  }, [data]);

  const updateData = (newData: FiveWhysData) => {
    setFiveWhysData(newData);
    onChange(newData);
  };

  const addChain = () => {
    updateData({
      ...fiveWhysData,
      chains: [...fiveWhysData.chains, createEmptyChain()],
    });
  };

  const removeChain = (id: string) => {
    if (fiveWhysData.chains.length > 1) {
      updateData({
        ...fiveWhysData,
        chains: fiveWhysData.chains.filter((chain) => chain.id !== id),
      });
    }
  };

  const updateChain = (id: string, field: keyof WhyChain, value: string) => {
    updateData({
      ...fiveWhysData,
      chains: fiveWhysData.chains.map((chain) =>
        chain.id === id ? { ...chain, [field]: value } : chain
      ),
    });
  };

  const getChainDepth = (chain: WhyChain): number => {
    if (chain.why5) return 5;
    if (chain.why4) return 4;
    if (chain.why3) return 3;
    if (chain.why2) return 2;
    if (chain.why1) return 1;
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-analyze flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Analyse 5 Pourquoi</h2>
            <p className="text-sm text-gray-500">
              Identifier les causes racines en posant "Pourquoi ?" 5 fois
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Date d'analyse
            </label>
            <input
              type="date"
              value={fiveWhysData.analysisDate}
              onChange={(e) => updateData({ ...fiveWhysData, analysisDate: e.target.value })}
              className="input"
              disabled={readOnly}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Analyste
            </label>
            <input
              type="text"
              value={fiveWhysData.analyst}
              onChange={(e) => updateData({ ...fiveWhysData, analyst: e.target.value })}
              placeholder="Nom de l'analyste"
              className="input"
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Why Chains */}
      <div className="space-y-6">
        {fiveWhysData.chains.map((chain, chainIndex) => (
          <div key={chain.id} className="card overflow-hidden">
            <div className="bg-analyze text-white px-4 py-3 flex items-center justify-between">
              <span className="font-medium">Analyse #{chainIndex + 1}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-80">
                  Profondeur: {getChainDepth(chain)}/5
                </span>
                {!readOnly && fiveWhysData.chains.length > 1 && (
                  <button
                    onClick={() => removeChain(chain.id)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              {/* Problem statement */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2 text-control">
                  Problème initial
                </label>
                <textarea
                  value={chain.problem}
                  onChange={(e) => updateChain(chain.id, 'problem', e.target.value)}
                  placeholder="Décrivez le problème observé..."
                  className="input min-h-[60px] resize-none border-control/30"
                  disabled={readOnly}
                />
              </div>

              {/* Why chain */}
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((num) => {
                  const fieldName = `why${num}` as keyof WhyChain;
                  const prevFieldName = num > 1 ? `why${num - 1}` as keyof WhyChain : 'problem';
                  const hasPrevious = chain[prevFieldName as keyof WhyChain];
                  const hasValue = chain[fieldName];

                  return (
                    <div key={num} className="relative">
                      {/* Arrow */}
                      {num > 1 && (
                        <div className="absolute -top-3 left-8 flex flex-col items-center">
                          <ArrowDown className="w-5 h-5 text-analyze" />
                        </div>
                      )}

                      <div
                        className={cn(
                          'flex items-start gap-4 p-4 rounded-lg border-2 transition-all',
                          hasValue
                            ? 'border-analyze bg-analyze-light/30'
                            : hasPrevious
                            ? 'border-dashed border-gray-300'
                            : 'border-dashed border-gray-200 opacity-50'
                        )}
                      >
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0',
                            hasValue
                              ? 'bg-analyze text-white'
                              : 'bg-gray-200 text-gray-500'
                          )}
                        >
                          {num}
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-2">
                            Pourquoi #{num} ?
                          </label>
                          <textarea
                            value={chain[fieldName] || ''}
                            onChange={(e) => updateChain(chain.id, fieldName, e.target.value)}
                            placeholder={
                              hasPrevious
                                ? `Pourquoi "${
                                    (num === 1 ? chain.problem : chain[prevFieldName as keyof WhyChain] || '').slice(0, 30)
                                  }..." ?`
                                : 'Remplissez d\'abord le niveau précédent'
                            }
                            className="input min-h-[60px] resize-none"
                            disabled={readOnly || !hasPrevious}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Root cause and countermeasure */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-improve" />
                      Cause racine identifiée
                    </label>
                    <textarea
                      value={chain.rootCause}
                      onChange={(e) => updateChain(chain.id, 'rootCause', e.target.value)}
                      placeholder="Synthèse de la cause racine..."
                      className="input min-h-[80px] resize-none border-improve/30"
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-control" />
                      Contre-mesure proposée
                    </label>
                    <textarea
                      value={chain.countermeasure}
                      onChange={(e) => updateChain(chain.id, 'countermeasure', e.target.value)}
                      placeholder="Action corrective à mettre en place..."
                      className="input min-h-[80px] resize-none border-control/30"
                      disabled={readOnly}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <button
          onClick={addChain}
          className="btn btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Ajouter une nouvelle analyse
        </button>
      )}

      {/* Summary */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Synthèse</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-analyze-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-analyze">
              {fiveWhysData.chains.length}
            </div>
            <div className="text-sm text-gray-500">Analyses effectuées</div>
          </div>
          <div className="bg-improve-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-improve">
              {fiveWhysData.chains.filter((c) => c.rootCause).length}
            </div>
            <div className="text-sm text-gray-500">Causes racines identifiées</div>
          </div>
          <div className="bg-control-light rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-control">
              {fiveWhysData.chains.filter((c) => c.countermeasure).length}
            </div>
            <div className="text-sm text-gray-500">Contre-mesures définies</div>
          </div>
        </div>

        {/* List of root causes */}
        {fiveWhysData.chains.some((c) => c.rootCause) && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-medium mb-2">Causes racines identifiées :</h4>
            <ul className="space-y-2">
              {fiveWhysData.chains
                .filter((c) => c.rootCause)
                .map((chain, index) => (
                  <li key={chain.id} className="flex items-start gap-2 text-sm">
                    <span className="w-6 h-6 rounded bg-analyze text-white flex items-center justify-center text-xs flex-shrink-0">
                      {index + 1}
                    </span>
                    <span>{chain.rootCause}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

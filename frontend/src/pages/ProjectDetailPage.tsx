import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight,
  Users,
  Calendar,
  Settings,
  FileText,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Download,
  Share2,
} from 'lucide-react';
import { projectsApi, toolsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';
import type { ToolDefinition } from '@/types';

const phaseConfig = {
  DEFINE: {
    color: 'bg-define',
    lightColor: 'bg-define-light',
    textColor: 'text-define',
    borderColor: 'border-define',
    label: 'Définir',
    description: 'Définir le problème, le périmètre et les objectifs du projet',
    letter: 'D',
  },
  MEASURE: {
    color: 'bg-measure',
    lightColor: 'bg-measure-light',
    textColor: 'text-measure',
    borderColor: 'border-measure',
    label: 'Mesurer',
    description: 'Mesurer la performance actuelle et collecter les données',
    letter: 'M',
  },
  ANALYZE: {
    color: 'bg-analyze',
    lightColor: 'bg-analyze-light',
    textColor: 'text-analyze',
    borderColor: 'border-analyze',
    label: 'Analyser',
    description: 'Analyser les données et identifier les causes racines',
    letter: 'A',
  },
  IMPROVE: {
    color: 'bg-improve',
    lightColor: 'bg-improve-light',
    textColor: 'text-improve',
    borderColor: 'border-improve',
    label: 'Innover',
    description: 'Développer et mettre en œuvre des solutions d\'amélioration',
    letter: 'I',
  },
  CONTROL: {
    color: 'bg-control',
    lightColor: 'bg-control-light',
    textColor: 'text-control',
    borderColor: 'border-control',
    label: 'Contrôler',
    description: 'Contrôler les résultats et pérenniser les améliorations',
    letter: 'C',
  },
};

const priorityBadges = {
  OBLIGATORY: { label: 'Obligatoire', className: 'bg-control text-white' },
  RECOMMENDED: { label: 'Recommandé', className: 'bg-analyze text-white' },
  SITUATIONAL: { label: 'Situationnel', className: 'bg-gray-400 text-white' },
};

type DmaicPhase = keyof typeof phaseConfig;

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['DEFINE']));
  const [selectedPhase, setSelectedPhase] = useState<DmaicPhase>('DEFINE');

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId!),
    enabled: !!projectId,
  });

  const { data: toolDefinitions } = useQuery({
    queryKey: ['tool-definitions'],
    queryFn: toolsApi.getDefinitions,
  });

  const { data: toolInstances } = useQuery({
    queryKey: ['project-tools', projectId],
    queryFn: () => toolsApi.getProjectTools(projectId!),
    enabled: !!projectId,
  });

  // Group tools by phase
  const toolsByPhase = useMemo(() => {
    if (!toolDefinitions) return {};

    const grouped: Record<string, ToolDefinition[]> = {};
    toolDefinitions.forEach((tool) => {
      if (!grouped[tool.phase]) {
        grouped[tool.phase] = [];
      }
      grouped[tool.phase].push(tool);
    });

    // Sort by priority within each phase
    Object.keys(grouped).forEach((phase) => {
      grouped[phase].sort((a, b) => {
        const priorityOrder = { OBLIGATORY: 0, RECOMMENDED: 1, SITUATIONAL: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    });

    return grouped;
  }, [toolDefinitions]);

  // Get tool instance status
  const getToolStatus = (toolDefId: string): 'completed' | 'in_progress' | 'not_started' => {
    const instance = toolInstances?.find((t) => t.toolDefinitionId === toolDefId);
    if (!instance) return 'not_started';
    return instance.status === 'COMPLETED' ? 'completed' : 'in_progress';
  };

  const togglePhase = (phase: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phase)) {
      newExpanded.delete(phase);
    } else {
      newExpanded.add(phase);
    }
    setExpandedPhases(newExpanded);
    // Sélectionner la phase pour l'affichage principal
    setSelectedPhase(phase as DmaicPhase);
  };

  // Calculate phase completion
  const getPhaseCompletion = (phase: string): number => {
    const phaseTools = toolsByPhase[phase] || [];
    if (phaseTools.length === 0) return 0;
    const completedCount = phaseTools.filter(
      (t) => getToolStatus(t.id) === 'completed'
    ).length;
    return Math.round((completedCount / phaseTools.length) * 100);
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Chargement du projet...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold mb-2">Projet non trouvé</h2>
        <p className="text-gray-500 mb-4">Ce projet n'existe pas ou vous n'y avez pas accès.</p>
        <Link to="/projects" className="btn btn-primary">
          Retour aux projets
        </Link>
      </div>
    );
  }

  const phases = ['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL'] as DmaicPhase[];
  const currentPhaseIndex = phases.indexOf(project.currentPhase as DmaicPhase);

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg',
                phaseConfig[project.currentPhase as DmaicPhase].color
              )}
            >
              {project.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-gray-500">{project.code}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Partager
          </button>
          {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
            <button className="btn btn-secondary">
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Project info bar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>
                Créé le{' '}
                {new Date(project.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{project.members?.length || 0} membre(s)</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">Progression globale</div>
            <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  phaseConfig[project.currentPhase as DmaicPhase].color
                )}
                style={{ width: `${project.progress || 0}%` }}
              />
            </div>
            <div className="font-semibold">{project.progress || 0}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* DMAIC Stepper */}
        <div className="lg:col-span-1">
          <div className="card p-4 sticky top-4">
            <h3 className="font-semibold mb-4">Phases DMAIC</h3>
            <div className="space-y-2">
              {phases.map((phase, index) => {
                const config = phaseConfig[phase];
                const isExpanded = expandedPhases.has(phase);
                const isCurrent = phase === project.currentPhase;
                const isCompleted = index < currentPhaseIndex;
                const phaseCompletion = getPhaseCompletion(phase);
                const phaseTools = toolsByPhase[phase] || [];

                return (
                  <div key={phase} className="relative">
                    {/* Connector line */}
                    {index < phases.length - 1 && (
                      <div
                        className={cn(
                          'absolute left-5 top-10 w-0.5 h-full -mb-2',
                          isCompleted ? config.color : 'bg-gray-200'
                        )}
                      />
                    )}

                    {/* Phase header */}
                    <button
                      onClick={() => togglePhase(phase)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                        isCurrent
                          ? `${config.lightColor} ${config.borderColor} border-2`
                          : 'hover:bg-gray-50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm relative z-10',
                          isCompleted || isCurrent ? config.color : 'bg-gray-300'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          config.letter
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              'font-medium',
                              isCurrent ? config.textColor : ''
                            )}
                          >
                            {config.label}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', config.color)}
                              style={{ width: `${phaseCompletion}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {phaseCompletion}%
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Phase tools */}
                    {isExpanded && phaseTools.length > 0 && (
                      <div className="ml-8 mt-2 space-y-1 pb-2">
                        {phaseTools.map((tool) => {
                          const status = getToolStatus(tool.id);
                          return (
                            <Link
                              key={tool.id}
                              to={`/projects/${projectId}/tools/${tool.code}`}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                            >
                              {status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-improve" />
                              ) : status === 'in_progress' ? (
                                <Clock className="w-4 h-4 text-analyze" />
                              ) : (
                                <Circle className="w-4 h-4 text-gray-300" />
                              )}
                              <span className="flex-1 text-sm truncate group-hover:text-define">
                                {tool.nameFr}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                  priorityBadges[tool.priority].className
                                )}
                              >
                                {tool.priority === 'OBLIGATORY' ? 'O' : tool.priority === 'RECOMMENDED' ? 'R' : 'S'}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3">
          {/* Phase overview cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {phases.map((phase, index) => {
              const config = phaseConfig[phase];
              const isCompleted = index < currentPhaseIndex;
              const isCurrent = phase === project.currentPhase;
              const phaseCompletion = getPhaseCompletion(phase);

              return (
                <div
                  key={phase}
                  className={cn(
                    'card p-4 text-center cursor-pointer transition-all hover:shadow-md',
                    isCurrent && `ring-2 ${config.borderColor.replace('border-', 'ring-')}`,
                    selectedPhase === phase && 'ring-2 ring-gray-400'
                  )}
                  onClick={() => {
                    setExpandedPhases(new Set([phase]));
                    setSelectedPhase(phase);
                  }}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-bold text-xl',
                      isCompleted || isCurrent ? config.color : 'bg-gray-300'
                    )}
                  >
                    {config.letter}
                  </div>
                  <div className="font-medium text-sm">{config.label}</div>
                  <div className="text-2xl font-bold mt-1">{phaseCompletion}%</div>
                </div>
              );
            })}
          </div>

          {/* Selected phase details */}
          <div className="card">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <span
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm',
                        phaseConfig[selectedPhase].color
                      )}
                    >
                      {phaseConfig[selectedPhase].letter}
                    </span>
                    Phase {phaseConfig[selectedPhase].label}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {phaseConfig[selectedPhase].description}
                  </p>
                </div>
                {selectedPhase === project.currentPhase && (
                  <span className="px-3 py-1 bg-measure-light text-measure text-sm font-medium rounded-full">
                    Phase actuelle
                  </span>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-medium mb-4">Outils de cette phase ({(toolsByPhase[selectedPhase] || []).length})</h3>
              {(toolsByPhase[selectedPhase] || []).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun outil défini pour cette phase.</p>
                  <p className="text-sm mt-2">Vérifiez que les outils ont été chargés dans la base de données.</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(toolsByPhase[selectedPhase] || []).map((tool) => {
                  const status = getToolStatus(tool.id);
                  const config = phaseConfig[selectedPhase];

                  return (
                    <Link
                      key={tool.id}
                      to={`/projects/${projectId}/tools/${tool.code}`}
                      className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all group"
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center',
                          status === 'completed'
                            ? 'bg-improve-light'
                            : status === 'in_progress'
                            ? 'bg-analyze-light'
                            : config.lightColor
                        )}
                      >
                        {status === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5 text-improve" />
                        ) : status === 'in_progress' ? (
                          <Clock className="w-5 h-5 text-analyze" />
                        ) : (
                          <FileText className={cn('w-5 h-5', config.textColor)} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate group-hover:text-define">
                            {tool.nameFr}
                          </span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full font-medium',
                              priorityBadges[tool.priority].className
                            )}
                          >
                            {priorityBadges[tool.priority].label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {tool.descriptionFr}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-define transition-colors" />
                    </Link>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

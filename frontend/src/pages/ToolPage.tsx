import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Download,
  HelpCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { projectsApi, toolsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

// Import tool templates
import SIPOCTemplate from '@/components/tools/SIPOCTemplate';
import CharteProjetTemplate from '@/components/tools/CharteProjetTemplate';
import VOCTemplate from '@/components/tools/VOCTemplate';
import CTQTemplate from '@/components/tools/CTQTemplate';
import IshikawaTemplate from '@/components/tools/IshikawaTemplate';
import AMDECTemplate from '@/components/tools/AMDECTemplate';
import ParetoTemplate from '@/components/tools/ParetoTemplate';
import PlanCollecteTemplate from '@/components/tools/PlanCollecteTemplate';
import ControlPlanTemplate from '@/components/tools/ControlPlanTemplate';
import FiveWhysTemplate from '@/components/tools/FiveWhysTemplate';
import ChecklistTemplate from '@/components/tools/ChecklistTemplate';
import ActionPlanTemplate from '@/components/tools/ActionPlanTemplate';
import DefaultTemplate from '@/components/tools/DefaultTemplate';

// New specialized templates
import ROITemplate from '@/components/tools/ROITemplate';
import FinancialJustificationTemplate from '@/components/tools/FinancialJustificationTemplate';
import SixSigmaIndicatorsTemplate from '@/components/tools/SixSigmaIndicatorsTemplate';
import ProjectRiskAnalysisTemplate from '@/components/tools/ProjectRiskAnalysisTemplate';
import ProjectReviewTemplate from '@/components/tools/ProjectReviewTemplate';
import MSATemplate from '@/components/tools/MSATemplate';
import SampleSizeTemplate from '@/components/tools/SampleSizeTemplate';
import DistributionTestsTemplate from '@/components/tools/DistributionTestsTemplate';
import CTQMeasureTemplate from '@/components/tools/CTQMeasureTemplate';
import BrainstormingTemplate from '@/components/tools/BrainstormingTemplate';
import GanttTemplate from '@/components/tools/GanttTemplate';
import ProjectCalendarTemplate from '@/components/tools/ProjectCalendarTemplate';
import TrainingTemplate from '@/components/tools/TrainingTemplate';
import GainsCalculationTemplate from '@/components/tools/GainsCalculationTemplate';
import ProjectClosureTemplate from '@/components/tools/ProjectClosureTemplate';

const phaseConfig = {
  DEFINE: { color: 'bg-define', textColor: 'text-define', label: 'Définir' },
  MEASURE: { color: 'bg-measure', textColor: 'text-measure', label: 'Mesurer' },
  ANALYZE: { color: 'bg-analyze', textColor: 'text-analyze', label: 'Analyser' },
  IMPROVE: { color: 'bg-improve', textColor: 'text-improve', label: 'Innover' },
  CONTROL: { color: 'bg-control', textColor: 'text-control', label: 'Contrôler' },
};

const priorityBadges = {
  OBLIGATORY: { label: 'Obligatoire', className: 'bg-control text-white' },
  RECOMMENDED: { label: 'Recommandé', className: 'bg-analyze text-white' },
  SITUATIONAL: { label: 'Situationnel', className: 'bg-gray-400 text-white' },
};

// Map tool codes to template components
const toolTemplates: Record<string, React.ComponentType<any>> = {
  // ============ DEFINE Phase (7 tools) ============
  ROI: ROITemplate,
  FINANCIAL_JUSTIFICATION: FinancialJustificationTemplate,
  PROJECT_CHARTER: CharteProjetTemplate,
  CTQ: CTQTemplate,
  SIX_SIGMA_INDICATORS: SixSigmaIndicatorsTemplate,
  PROJECT_RISK_ANALYSIS: ProjectRiskAnalysisTemplate,
  PROJECT_REVIEW: ProjectReviewTemplate,
  // Legacy aliases
  SIPOC: SIPOCTemplate,
  CHARTE_PROJET: CharteProjetTemplate,
  VOC: VOCTemplate,

  // ============ MEASURE Phase (7 tools) ============
  PARETO: ParetoTemplate,
  DATA_COLLECTION_PLAN: PlanCollecteTemplate,
  DISTRIBUTION_TESTS: DistributionTestsTemplate,
  MSA: MSATemplate,
  SAMPLE_SIZE: SampleSizeTemplate,
  CTQ_MEASURE: CTQMeasureTemplate,
  PROJECT_REVIEW_MEASURE: ProjectReviewTemplate,
  // Legacy aliases
  PLAN_COLLECTE: PlanCollecteTemplate,

  // ============ ANALYZE Phase (4 tools) ============
  SAMPLE_SIZE_ANALYZE: SampleSizeTemplate,
  MSA_ANALYZE: MSATemplate,
  DISTRIBUTION_TESTS_ANALYZE: DistributionTestsTemplate,
  PROJECT_REVIEW_ANALYZE: ProjectReviewTemplate,
  // Legacy aliases
  ISHIKAWA: IshikawaTemplate,
  FIVE_WHYS: FiveWhysTemplate,
  CINQ_POURQUOI: FiveWhysTemplate,

  // ============ IMPROVE Phase (7 tools) ============
  SIX_SIGMA_INDICATORS_IMPROVE: SixSigmaIndicatorsTemplate,
  PROJECT_REVIEW_IMPROVE: ProjectReviewTemplate,
  SAMPLE_SIZE_IMPROVE: SampleSizeTemplate,
  BRAINSTORMING: BrainstormingTemplate,
  FMEA_IMPROVE: AMDECTemplate,
  GANTT_IMPROVE: GanttTemplate,
  PROJECT_CALENDAR: ProjectCalendarTemplate,
  // Legacy aliases
  AMDEC: AMDECTemplate,
  ACTION_PLAN: ActionPlanTemplate,
  PLAN_ACTIONS: ActionPlanTemplate,

  // ============ CONTROL Phase (6 tools) ============
  FMEA_UPDATE: AMDECTemplate,
  CONTROL_PLAN: ControlPlanTemplate,
  TRAINING: TrainingTemplate,
  GAINS_CALCULATION: GainsCalculationTemplate,
  PROJECT_REVIEW_CONTROL: ProjectReviewTemplate,
  PROJECT_CLOSURE: ProjectClosureTemplate,

  // ============ General/Legacy ============
  GATE_REVIEW: ChecklistTemplate,
  VALIDATION: ChecklistTemplate,
  CAPABILITY: DefaultTemplate,
  HYPOTHESIS_TEST: DefaultTemplate,
  DOE: DefaultTemplate,
  PILOT: ChecklistTemplate,
  SPC: DefaultTemplate,
  CONTROL_CHART: DefaultTemplate,
};

export default function ToolPage() {
  const { projectId, toolId } = useParams<{ projectId: string; toolId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useAuth(); // Ensure user is authenticated

  const [data, setData] = useState<Record<string, any>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(projectId!),
    enabled: !!projectId,
  });

  // Fetch tool definition
  const { data: toolDefinition, isLoading: defLoading } = useQuery({
    queryKey: ['tool-definition', toolId],
    queryFn: () => toolsApi.getDefinition(toolId!),
    enabled: !!toolId,
  });

  // Fetch tool definitions for navigation
  const { data: allDefinitions } = useQuery({
    queryKey: ['tool-definitions'],
    queryFn: toolsApi.getDefinitions,
  });

  // Fetch tool instance (if exists)
  const { data: toolInstance, isLoading: instanceLoading } = useQuery({
    queryKey: ['tool-instance', projectId, toolId],
    queryFn: async () => {
      const instances = await toolsApi.getProjectTools(projectId!);
      return instances.find((t) => t.toolDefinition.code === toolId) || null;
    },
    enabled: !!projectId && !!toolId,
  });

  // Initialize data when instance loads
  useEffect(() => {
    if (toolInstance?.data) {
      setData(toolInstance.data as Record<string, any>);
    } else if (toolDefinition?.schema) {
      // Initialize with empty schema structure
      setData({});
    }
  }, [toolInstance, toolDefinition]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (saveData: { data: Record<string, any>; status?: string }) => {
      if (toolInstance) {
        return toolsApi.updateToolInstance(toolInstance.id, saveData);
      } else {
        return toolsApi.createToolInstance({
          projectId: projectId!,
          toolDefinitionId: toolId!,
          data: saveData.data,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-instance', projectId, toolId] });
      queryClient.invalidateQueries({ queryKey: ['project-tools', projectId] });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    },
  });

  // Handle data change
  const handleDataChange = (newData: Record<string, any>) => {
    setData(newData);
    setHasUnsavedChanges(true);
  };

  // Handle save
  const handleSave = () => {
    saveMutation.mutate({ data });
  };

  // Handle mark as complete
  const handleMarkComplete = () => {
    saveMutation.mutate({ data, status: 'COMPLETED' });
  };

  // Get navigation tools (prev/next in same phase)
  const navigationTools = allDefinitions
    ?.filter((t) => t.phase === toolDefinition?.phase)
    .sort((a, b) => {
      const priorityOrder = { OBLIGATORY: 0, RECOMMENDED: 1, SITUATIONAL: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const currentIndex = navigationTools?.findIndex((t) => t.id === toolId) ?? -1;
  const prevTool = currentIndex > 0 ? navigationTools?.[currentIndex - 1] : null;
  const nextTool =
    currentIndex >= 0 && currentIndex < (navigationTools?.length ?? 0) - 1
      ? navigationTools?.[currentIndex + 1]
      : null;

  // Get template component
  const TemplateComponent =
    toolTemplates[toolDefinition?.code || ''] || DefaultTemplate;

  if (defLoading || instanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-define" />
      </div>
    );
  }

  if (!toolDefinition) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold mb-2">Outil non trouvé</h2>
        <p className="text-gray-500 mb-4">Cet outil n'existe pas.</p>
        <Link to={`/projects/${projectId}`} className="btn btn-primary">
          Retour au projet
        </Link>
      </div>
    );
  }

  const phase = toolDefinition.phase as keyof typeof phaseConfig;
  const config = phaseConfig[phase];

  return (
    <div className="animate-in flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs font-bold text-white',
                  config.color
                )}
              >
                {config.label}
              </span>
              <h1 className="text-xl font-bold">{toolDefinition.nameFr}</h1>
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  priorityBadges[toolDefinition.priority].className
                )}
              >
                {priorityBadges[toolDefinition.priority].label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {project?.name} • {toolDefinition.descriptionFr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          {lastSaved && (
            <span className="text-sm text-gray-400">
              Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="text-sm text-analyze">Modifications non sauvegardées</span>
          )}

          <button
            onClick={() => setShowHelp(!showHelp)}
            className={cn(
              'btn btn-secondary flex items-center gap-2',
              showHelp && 'bg-define text-white hover:bg-define'
            )}
          >
            <HelpCircle className="w-4 h-4" />
            Aide
          </button>

          <button className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter
          </button>

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending || !hasUnsavedChanges}
            className="btn btn-primary flex items-center gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Sauvegarder
          </button>

          {toolInstance?.status !== 'COMPLETED' && (
            <button
              onClick={handleMarkComplete}
              disabled={saveMutation.isPending}
              className="btn bg-improve text-white hover:bg-improve/90 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Terminer
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tool template area */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <TemplateComponent
              data={data}
              onChange={handleDataChange}
              toolDefinition={toolDefinition}
              readOnly={false}
            />
          </div>
        </div>

        {/* Help panel */}
        {showHelp && (
          <div className="w-80 border-l border-gray-100 bg-white overflow-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold">Aide contextuelle</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="font-medium mb-2">Qu'est-ce que {toolDefinition.nameFr} ?</h4>
                <p className="text-sm text-gray-600">{toolDefinition.descriptionFr}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Comment l'utiliser ?</h4>
                <p className="text-sm text-gray-600">
                  Remplissez chaque section du template avec les informations pertinentes
                  à votre projet. Sauvegardez régulièrement vos modifications.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Conseils</h4>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Impliquez les parties prenantes</li>
                  <li>Utilisez des données factuelles</li>
                  <li>Soyez précis et concis</li>
                  <li>Validez avec l'équipe</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-2">
          {prevTool ? (
            <Link
              to={`/projects/${projectId}/tools/${prevTool.code}`}
              className="btn btn-secondary flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {prevTool.nameFr}
            </Link>
          ) : (
            <span className="text-sm text-gray-400">Début de la phase</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          {toolInstance?.status === 'COMPLETED' ? (
            <span className="flex items-center gap-1 text-improve">
              <CheckCircle2 className="w-4 h-4" />
              Complété
            </span>
          ) : toolInstance ? (
            <span className="flex items-center gap-1 text-analyze">
              <Clock className="w-4 h-4" />
              En cours
            </span>
          ) : (
            <span>Non commencé</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {nextTool ? (
            <Link
              to={`/projects/${projectId}/tools/${nextTool.code}`}
              className="btn btn-primary flex items-center gap-2"
            >
              {nextTool.nameFr}
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="text-sm text-gray-400">Fin de la phase</span>
          )}
        </div>
      </div>
    </div>
  );
}

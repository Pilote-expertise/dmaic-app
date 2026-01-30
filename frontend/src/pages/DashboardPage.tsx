import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { dashboardApi, projectsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';

const phaseColors: Record<string, string> = {
  DEFINE: 'bg-define',
  MEASURE: 'bg-measure',
  ANALYZE: 'bg-analyze',
  IMPROVE: 'bg-improve',
  CONTROL: 'bg-control',
};

const phaseLabels: Record<string, string> = {
  DEFINE: 'Définir',
  MEASURE: 'Mesurer',
  ANALYZE: 'Analyser',
  IMPROVE: 'Innover',
  CONTROL: 'Contrôler',
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: myStats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: dashboardApi.getMyStats,
  });

  const activeProjects = projects?.filter(p => p.status === 'IN_PROGRESS') || [];
  const completedProjects = projects?.filter(p => p.status === 'COMPLETED') || [];

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">
          Bonjour, {user?.firstName} !
        </h1>
        <p className="text-gray-500">
          Voici un aperçu de vos projets DMAIC
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-define-light flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-define" />
            </div>
            {myStats && (
              <span className="text-sm text-measure font-medium">
                +{myStats.projects.total}
              </span>
            )}
          </div>
          <p className="text-3xl font-bold mb-1">{activeProjects.length}</p>
          <p className="text-gray-500 text-sm">Projets actifs</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-measure-light flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-measure" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">{completedProjects.length}</p>
          <p className="text-gray-500 text-sm">Projets terminés</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-analyze-light flex items-center justify-center">
              <Clock className="w-6 h-6 text-analyze" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">
            {myStats?.activity.toolsCompletedThisMonth || 0}
          </p>
          <p className="text-gray-500 text-sm">Outils complétés ce mois</p>
        </div>

        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-improve-light flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-improve" />
            </div>
          </div>
          <p className="text-3xl font-bold mb-1">
            {projects?.length ? Math.round(
              (completedProjects.length / projects.length) * 100
            ) : 0}%
          </p>
          <p className="text-gray-500 text-sm">Taux de complétion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects list */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-lg">Projets en cours</h2>
              <Link
                to="/projects"
                className="text-sm text-define hover:underline flex items-center gap-1"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {projectsLoading ? (
              <div className="p-6 text-center text-gray-500">Chargement...</div>
            ) : activeProjects.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p className="mb-4">Aucun projet actif</p>
                <Link to="/projects" className="btn btn-primary">
                  Créer un projet
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {activeProjects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm',
                        phaseColors[project.currentPhase]
                      )}
                    >
                      {project.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{project.name}</p>
                      <p className="text-sm text-gray-500">
                        Phase : {phaseLabels[project.currentPhase]}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', phaseColors[project.currentPhase])}
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 w-10">
                        {project.progress || 0}%
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="flex items-center gap-2 p-6 border-b border-gray-100">
            <Activity className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-lg">Activité récente</h2>
          </div>

          <div className="p-4 space-y-4">
            {myStats?.activity.recentContributions.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-define-light flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-define" />
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{activity.action}</span>
                    {activity.project && (
                      <span className="text-gray-500">
                        {' '}sur {activity.project.name}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(activity.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {(!myStats?.activity.recentContributions || myStats.activity.recentContributions.length === 0) && (
              <p className="text-center text-gray-500 text-sm py-4">
                Aucune activité récente
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

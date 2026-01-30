import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
} from 'lucide-react';
import { projectsApi, dashboardApi } from '@/services/api';
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

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [_selectedPhase, _setSelectedPhase] = useState(''); // Reserved for future filtering

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: dashboardApi.getMyStats,
  });

  // Calculate statistics
  const projectStats = {
    total: projects?.length || 0,
    byStatus: {
      DRAFT: projects?.filter((p) => p.status === 'DRAFT').length || 0,
      IN_PROGRESS: projects?.filter((p) => p.status === 'IN_PROGRESS').length || 0,
      COMPLETED: projects?.filter((p) => p.status === 'COMPLETED').length || 0,
      ON_HOLD: projects?.filter((p) => p.status === 'ON_HOLD').length || 0,
      CANCELLED: projects?.filter((p) => p.status === 'CANCELLED').length || 0,
    },
    byPhase: {
      DEFINE: projects?.filter((p) => p.currentPhase === 'DEFINE').length || 0,
      MEASURE: projects?.filter((p) => p.currentPhase === 'MEASURE').length || 0,
      ANALYZE: projects?.filter((p) => p.currentPhase === 'ANALYZE').length || 0,
      IMPROVE: projects?.filter((p) => p.currentPhase === 'IMPROVE').length || 0,
      CONTROL: projects?.filter((p) => p.currentPhase === 'CONTROL').length || 0,
    },
    avgProgress: projects?.length
      ? Math.round(
          projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length
        )
      : 0,
  };

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Rapports</h1>
          <p className="text-gray-500">Synthèse et statistiques des projets DMAIC</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input w-auto"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
            <option value="all">Tout</option>
          </select>
          <button className="btn btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exporter PDF
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-define-light flex items-center justify-center">
              <FileText className="w-6 h-6 text-define" />
            </div>
            <div>
              <p className="text-3xl font-bold">{projectStats.total}</p>
              <p className="text-gray-500 text-sm">Projets totaux</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-measure-light flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-measure" />
            </div>
            <div>
              <p className="text-3xl font-bold">{projectStats.byStatus.IN_PROGRESS}</p>
              <p className="text-gray-500 text-sm">En cours</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-improve-light flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-improve" />
            </div>
            <div>
              <p className="text-3xl font-bold">{projectStats.avgProgress}%</p>
              <p className="text-gray-500 text-sm">Progression moyenne</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-analyze-light flex items-center justify-center">
              <Users className="w-6 h-6 text-analyze" />
            </div>
            <div>
              <p className="text-3xl font-bold">
                {stats?.activity.toolsCompletedThisMonth || 0}
              </p>
              <p className="text-gray-500 text-sm">Outils complétés (mois)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Projects by Phase */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-400" />
            Répartition par phase
          </h3>
          <div className="space-y-4">
            {Object.entries(projectStats.byPhase).map(([phase, count]) => {
              const percentage =
                projectStats.total > 0
                  ? Math.round((count / projectStats.total) * 100)
                  : 0;
              return (
                <div key={phase} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-3 h-3 rounded',
                          phaseColors[phase as keyof typeof phaseColors]
                        )}
                      />
                      <span>{phaseLabels[phase as keyof typeof phaseLabels]}</span>
                    </div>
                    <span className="font-medium">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        phaseColors[phase as keyof typeof phaseColors]
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual bar chart */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-end justify-around h-32 gap-2">
              {Object.entries(projectStats.byPhase).map(([phase, count]) => {
                const maxCount = Math.max(...Object.values(projectStats.byPhase), 1);
                const height = (count / maxCount) * 100;
                return (
                  <div key={phase} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-sm font-medium">{count}</span>
                    <div
                      className={cn(
                        'w-full rounded-t transition-all',
                        phaseColors[phase as keyof typeof phaseColors]
                      )}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-xs text-gray-500">
                      {phaseLabels[phase as keyof typeof phaseLabels][0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Projects by Status */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            Répartition par statut
          </h3>
          <div className="space-y-4">
            {[
              { key: 'IN_PROGRESS', label: 'En cours', color: 'bg-measure' },
              { key: 'COMPLETED', label: 'Terminés', color: 'bg-improve' },
              { key: 'DRAFT', label: 'Brouillons', color: 'bg-gray-400' },
              { key: 'ON_HOLD', label: 'En pause', color: 'bg-analyze' },
              { key: 'CANCELLED', label: 'Annulés', color: 'bg-control' },
            ].map(({ key, label, color }) => {
              const count = projectStats.byStatus[key as keyof typeof projectStats.byStatus];
              const percentage =
                projectStats.total > 0
                  ? Math.round((count / projectStats.total) * 100)
                  : 0;
              return (
                <div key={key} className="flex items-center gap-4">
                  <div className={cn('w-3 h-3 rounded', color)} />
                  <span className="flex-1 text-sm">{label}</span>
                  <span className="text-sm font-medium">{count}</span>
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pie chart visualization */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-center">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                {(() => {
                  let cumulative = 0;
                  const segments = [
                    { count: projectStats.byStatus.IN_PROGRESS, color: '#16a34a' },
                    { count: projectStats.byStatus.COMPLETED, color: '#9333ea' },
                    { count: projectStats.byStatus.DRAFT, color: '#9ca3af' },
                    { count: projectStats.byStatus.ON_HOLD, color: '#ea580c' },
                    { count: projectStats.byStatus.CANCELLED, color: '#dc2626' },
                  ];

                  return segments.map((segment, i) => {
                    const percentage = projectStats.total > 0
                      ? (segment.count / projectStats.total) * 100
                      : 0;
                    const dashArray = percentage;
                    const dashOffset = -cumulative;
                    cumulative += percentage;

                    return (
                      <circle
                        key={i}
                        cx="16"
                        cy="16"
                        r="14"
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="4"
                        strokeDasharray={`${dashArray} ${100 - dashArray}`}
                        strokeDashoffset={dashOffset}
                        className="transition-all"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold">{projectStats.total}</div>
                  <div className="text-xs text-gray-500">Projets</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold">Derniers projets</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-sm text-gray-600">
                <th className="px-6 py-3 text-left font-medium">Projet</th>
                <th className="px-6 py-3 text-left font-medium">Code</th>
                <th className="px-6 py-3 text-left font-medium">Phase</th>
                <th className="px-6 py-3 text-left font-medium">Progression</th>
                <th className="px-6 py-3 text-left font-medium">Statut</th>
                <th className="px-6 py-3 text-left font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {projects?.slice(0, 10).map((project) => (
                <tr key={project.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium">{project.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{project.code}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium text-white',
                        phaseColors[project.currentPhase]
                      )}
                    >
                      {phaseLabels[project.currentPhase]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            phaseColors[project.currentPhase]
                          )}
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm">{project.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        project.status === 'IN_PROGRESS' && 'bg-measure-light text-measure',
                        project.status === 'COMPLETED' && 'bg-improve-light text-improve',
                        project.status === 'DRAFT' && 'bg-gray-100 text-gray-600',
                        project.status === 'ON_HOLD' && 'bg-analyze-light text-analyze',
                        project.status === 'CANCELLED' && 'bg-control-light text-control'
                      )}
                    >
                      {project.status === 'IN_PROGRESS' && 'En cours'}
                      {project.status === 'COMPLETED' && 'Terminé'}
                      {project.status === 'DRAFT' && 'Brouillon'}
                      {project.status === 'ON_HOLD' && 'En pause'}
                      {project.status === 'CANCELLED' && 'Annulé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(project.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

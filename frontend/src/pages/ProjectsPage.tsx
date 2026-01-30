import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  FolderKanban,
  Users,
  Calendar,
} from 'lucide-react';
import { projectsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/utils/cn';
import type { Project, CreateProjectData } from '@/types';

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

const statusLabels: Record<string, string> = {
  DRAFT: 'Brouillon',
  IN_PROGRESS: 'En cours',
  ON_HOLD: 'En pause',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-measure-light text-measure',
  ON_HOLD: 'bg-analyze-light text-analyze',
  COMPLETED: 'bg-improve-light text-improve',
  CANCELLED: 'bg-control-light text-control',
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPhase, setFilterPhase] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowCreateModal(false);
    },
  });

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPhase = !filterPhase || project.currentPhase === filterPhase;
    const matchesStatus = !filterStatus || project.status === filterStatus;
    return matchesSearch && matchesPhase && matchesStatus;
  });

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Projets DMAIC</h1>
          <p className="text-gray-500">
            {projects?.length || 0} projet{(projects?.length || 0) > 1 ? 's' : ''} au total
          </p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau projet
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="input w-auto"
          >
            <option value="">Toutes les phases</option>
            {Object.entries(phaseLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-auto"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : filteredProjects?.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun projet trouvé</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterPhase || filterStatus
              ? 'Essayez de modifier vos filtres'
              : 'Créez votre premier projet DMAIC'}
          </p>
          {(user?.role === 'ADMIN' || user?.role === 'PROJECT_MANAGER') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Créer un projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects?.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card hover:shadow-lg transition-shadow group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg',
              phaseColors[project.currentPhase]
            )}
          >
            {project.name.substring(0, 2).toUpperCase()}
          </div>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              statusColors[project.status]
            )}
          >
            {statusLabels[project.status]}
          </span>
        </div>

        {/* Info */}
        <h3 className="font-semibold text-lg mb-1 group-hover:text-define transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-gray-500 mb-4">{project.code}</p>

        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">Progression</span>
            <span className="font-medium">{project.progress || 0}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', phaseColors[project.currentPhase])}
              style={{ width: `${project.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Phase indicator */}
        <div className="flex items-center gap-1 mb-4">
          {['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL'].map((phase) => {
            const phases = ['DEFINE', 'MEASURE', 'ANALYZE', 'IMPROVE', 'CONTROL'];
            const currentIndex = phases.indexOf(project.currentPhase);
            const phaseIndex = phases.indexOf(phase);
            const isCompleted = phaseIndex < currentIndex;
            const isCurrent = phase === project.currentPhase;

            return (
              <div
                key={phase}
                className={cn(
                  'flex-1 h-1.5 rounded-full',
                  isCompleted
                    ? phaseColors[phase]
                    : isCurrent
                    ? `${phaseColors[phase]} opacity-50`
                    : 'bg-gray-200'
                )}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{project.members?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>
              {new Date(project.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
          <div
            className={cn(
              'px-2 py-0.5 rounded text-xs font-medium',
              phaseColors[project.currentPhase],
              'text-white'
            )}
          >
            {phaseLabels[project.currentPhase]}
          </div>
        </div>
      </div>
    </Link>
  );
}

interface CreateProjectModalProps {
  onClose: () => void;
  onSubmit: (data: CreateProjectData) => void;
  isLoading: boolean;
}

function CreateProjectModal({ onClose, onSubmit, isLoading }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    name: '',
    code: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.code) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold">Nouveau projet DMAIC</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nom du projet <span className="text-control">*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Amélioration processus de production"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Code projet <span className="text-control">*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="Ex: DMAIC-2024-001"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              className="input min-h-[100px] resize-none"
              placeholder="Décrivez brièvement l'objectif du projet..."
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isLoading || !formData.name || !formData.code}
            >
              {isLoading ? 'Création...' : 'Créer le projet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

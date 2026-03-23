import { useState, useEffect } from 'react';
import { FileText, ChevronLeft, ChevronRight, Filter, Calendar, RefreshCw } from 'lucide-react';
import { adminApi } from '@/services/api';
import type { AuditLog } from '@/types';
import toast from 'react-hot-toast';

interface AuditLogWithRelations extends Omit<AuditLog, 'project'> {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  project?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface PaginatedResponse {
  logs: AuditLogWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AuditLogsTab() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 25 };
      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await adminApi.getAuditLogs(params);
      setData(response);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      VIEW: 'bg-gray-100 text-gray-800'
    };

    const labels: Record<string, string> = {
      CREATE: 'Création',
      UPDATE: 'Modification',
      DELETE: 'Suppression',
      VIEW: 'Consultation'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[action] || 'bg-gray-100 text-gray-800'}`}>
        {labels[action] || action}
      </span>
    );
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      Project: 'Projet',
      User: 'Utilisateur',
      ToolInstance: 'Outil',
      AccessRequest: 'Demande d\'accès',
      Comment: 'Commentaire'
    };
    return labels[type] || type;
  };

  const formatChanges = (changes: string | Record<string, unknown> | null | undefined) => {
    if (!changes) return null;
    try {
      // If it's already an object, stringify it directly
      if (typeof changes === 'object') {
        return (
          <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto max-w-md">
            {JSON.stringify(changes, null, 2)}
          </pre>
        );
      }
      // If it's a string, parse it first
      const parsed = JSON.parse(changes);
      return (
        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-x-auto max-w-md">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch {
      return <span className="text-xs text-gray-500">{String(changes)}</span>;
    }
  };

  const handleResetFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            showFilters ? 'bg-define text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtres
          {Object.values(filters).some(v => v) && (
            <span className="w-2 h-2 bg-yellow-400 rounded-full" />
          )}
        </button>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Panel de filtres */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="input w-full"
            >
              <option value="">Toutes</option>
              <option value="CREATE">Création</option>
              <option value="UPDATE">Modification</option>
              <option value="DELETE">Suppression</option>
              <option value="VIEW">Consultation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Type d'entité</label>
            <select
              value={filters.entityType}
              onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
              className="input w-full"
            >
              <option value="">Tous</option>
              <option value="Project">Projet</option>
              <option value="User">Utilisateur</option>
              <option value="ToolInstance">Outil</option>
              <option value="AccessRequest">Demande d'accès</option>
              <option value="Comment">Commentaire</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date début</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date fin</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="input w-full"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
            <button
              onClick={handleResetFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-define border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun log d'audit trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Détails
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.user.firstName} {log.user.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{log.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getEntityTypeLabel(log.entityType)}
                      </span>
                      <div className="text-xs text-gray-500 font-mono">
                        {log.entityId.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.project ? (
                        <div>
                          <span className="text-gray-900">{log.project.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({log.project.code})</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {log.changes && (
                        <details className="cursor-pointer">
                          <summary className="text-define hover:text-define/80">
                            Voir les changements
                          </summary>
                          {formatChanges(log.changes)}
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {data.pagination.page} sur {data.pagination.totalPages}
              {' '}({data.pagination.total} résultats)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(prev => Math.min(data.pagination.totalPages, prev + 1))}
                disabled={page === data.pagination.totalPages}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

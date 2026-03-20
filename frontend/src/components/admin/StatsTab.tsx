import { useState, useEffect } from 'react';
import { Users, FolderKanban, Wrench, UserPlus, Activity, TrendingUp } from 'lucide-react';
import { adminApi } from '@/services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AdminStats {
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  projects: {
    total: number;
    byStatus: Record<string, number>;
  };
  tools: {
    total: number;
    byStatus: Record<string, number>;
  };
  accessRequests: {
    pending: number;
  };
  activity: {
    last7Days: number;
    byDay: Record<string, number>;
  };
}

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function StatsTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch (error: any) {
        toast.error('Erreur lors du chargement des statistiques');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-define border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Impossible de charger les statistiques
      </div>
    );
  }

  // Préparer les données pour les graphiques
  const roleData = Object.entries(stats.users.byRole).map(([name, value]) => ({
    name: name === 'ADMIN' ? 'Admin' : name === 'PROJECT_MANAGER' ? 'Chef de projet' : 'Contributeur',
    value
  }));

  const projectStatusData = Object.entries(stats.projects.byStatus).map(([name, value]) => ({
    name: name === 'DRAFT' ? 'Brouillon' :
          name === 'IN_PROGRESS' ? 'En cours' :
          name === 'COMPLETED' ? 'Terminé' : 'Archivé',
    value
  }));

  const toolStatusData = Object.entries(stats.tools.byStatus).map(([name, value]) => ({
    name: name === 'NOT_STARTED' ? 'Non démarré' :
          name === 'IN_PROGRESS' ? 'En cours' : 'Terminé',
    value
  }));

  // Données d'activité par jour (derniers 7 jours)
  const activityData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
    activityData.push({
      day: dayName,
      actions: stats.activity.byDay[dateStr] || 0
    });
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Utilisateurs</p>
              <p className="text-3xl font-bold mt-1">{stats.users.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
              {stats.users.byRole['ADMIN'] || 0} admins
            </span>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
              {stats.users.byRole['PROJECT_MANAGER'] || 0} chefs
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Projets</p>
              <p className="text-3xl font-bold mt-1">{stats.projects.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
              {stats.projects.byStatus['IN_PROGRESS'] || 0} en cours
            </span>
            <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded">
              {stats.projects.byStatus['COMPLETED'] || 0} terminés
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outils utilisés</p>
              <p className="text-3xl font-bold mt-1">{stats.tools.total}</p>
            </div>
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
          <div className="mt-4 flex gap-2 text-xs">
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
              {stats.tools.byStatus['COMPLETED'] || 0} complétés
            </span>
            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
              {stats.tools.byStatus['IN_PROGRESS'] || 0} en cours
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Demandes en attente</p>
              <p className="text-3xl font-bold mt-1">{stats.accessRequests.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              À traiter dans l'onglet "Demandes d'accès"
            </span>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activité des 7 derniers jours */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Activité (7 derniers jours)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: number) => [value, 'Actions']}
                />
                <Bar dataKey="actions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            {stats.activity.last7Days} actions totales cette semaine
          </div>
        </div>

        {/* Répartition des rôles */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Répartition des rôles</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'utilisateurs']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statut des projets */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Statut des projets</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'projets']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Statut des outils */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-6">
            <Wrench className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold">Statut des outils</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={toolStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  formatter={(value: number) => [value, 'outils']}
                />
                <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

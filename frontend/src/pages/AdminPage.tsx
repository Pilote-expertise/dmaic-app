import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, UserPlus, BarChart3, FileText } from 'lucide-react';
import AccessRequestsTab from '@/components/admin/AccessRequestsTab';
import UsersTab from '@/components/admin/UsersTab';
import StatsTab from '@/components/admin/StatsTab';
import AuditLogsTab from '@/components/admin/AuditLogsTab';

type TabType = 'requests' | 'users' | 'stats' | 'logs';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'requests', label: 'Demandes d\'accès', icon: <UserPlus className="w-5 h-5" /> },
  { id: 'users', label: 'Utilisateurs', icon: <Users className="w-5 h-5" /> },
  { id: 'stats', label: 'Statistiques', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'logs', label: 'Logs d\'audit', icon: <FileText className="w-5 h-5" /> },
];

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('requests');

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Administration</h1>
        <p className="text-gray-500">
          Gérez les utilisateurs, les demandes d'accès et consultez les statistiques
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-define text-define'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'requests' && <AccessRequestsTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'logs' && <AuditLogsTab />}
      </div>
    </div>
  );
}

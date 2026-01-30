import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/contexts/AuthContext';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Tableau de bord', path: '/' },
  { icon: FolderKanban, label: 'Projets', path: '/projects' },
  { icon: BarChart3, label: 'Rapports', path: '/reports' },
];

const adminNavItems = [
  { icon: Users, label: 'Utilisateurs', path: '/users' },
  { icon: Settings, label: 'Paramètres', path: '/settings' },
];

export default function Sidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-sidebar border-r border-white/10 flex flex-col">
      {/* Main navigation */}
      <nav className="flex-1 p-4">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
            Navigation
          </p>
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              Administration
            </p>
            <ul className="space-y-1">
              {adminNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* DMAIC Phases indicator */}
        <div className="mt-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
            Phases DMAIC
          </p>
          <div className="flex items-center gap-2 px-3">
            {['D', 'M', 'A', 'I', 'C'].map((phase, index) => {
              const colors = [
                'bg-define',
                'bg-measure',
                'bg-analyze',
                'bg-improve',
                'bg-control',
              ];
              return (
                <div
                  key={phase}
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold',
                    colors[index]
                  )}
                >
                  {phase}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Help */}
      <div className="p-4 border-t border-white/10">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors w-full">
          <HelpCircle className="w-5 h-5" />
          Aide & Documentation
        </button>
      </div>
    </aside>
  );
}

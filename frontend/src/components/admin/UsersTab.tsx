import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Key, MoreVertical, Shield, User, UserCog } from 'lucide-react';
import { adminApi } from '@/services/api';
import type { User as UserType } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface UserWithCounts extends UserType {
  _count: {
    ownedProjects: number;
    contributions: number;
  };
}

export default function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Modals
  const [editModal, setEditModal] = useState<{ open: boolean; user: UserWithCounts | null }>({
    open: false,
    user: null
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: UserWithCounts | null }>({
    open: false,
    user: null
  });
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ''
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getUsers(searchQuery || undefined, roleFilter || undefined);
      setUsers(data);
    } catch (error: any) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleEdit = (user: UserWithCounts) => {
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
    setEditModal({ open: true, user });
    setActionMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editModal.user) return;

    try {
      await adminApi.updateUser(editModal.user.id, editForm);
      toast.success('Utilisateur mis à jour');
      setEditModal({ open: false, user: null });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.user) return;

    try {
      await adminApi.deleteUser(deleteModal.user.id);
      toast.success('Utilisateur supprimé');
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await adminApi.forcePasswordReset(userId);
      toast.success('Email de réinitialisation envoyé');
      setActionMenuId(null);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case 'PROJECT_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserCog className="w-3 h-3" />
            Chef de projet
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <User className="w-3 h-3" />
            Contributeur
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-full sm:w-48"
        >
          <option value="">Tous les rôles</option>
          <option value="ADMIN">Admin</option>
          <option value="PROJECT_MANAGER">Chef de projet</option>
          <option value="CONTRIBUTOR">Contributeur</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-define border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun utilisateur trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inscription
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-define to-control rounded-full flex items-center justify-center text-white font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-gray-400">(vous)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    <div className="text-sm">
                      <span className="font-medium">{user._count.ownedProjects}</span> propriétaire
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{user._count.contributions}</span> membre
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {actionMenuId === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                          <button
                            onClick={() => handleEdit(user)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                          >
                            <Edit2 className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                          >
                            <Key className="w-4 h-4" />
                            Réinitialiser MDP
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              onClick={() => {
                                setDeleteModal({ open: true, user });
                                setActionMenuId(null);
                              }}
                              className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Click outside to close menu */}
      {actionMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenuId(null)}
        />
      )}

      {/* Modal édition */}
      {editModal.open && editModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Modifier l'utilisateur</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prénom</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nom</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                  className="input w-full"
                  disabled={editModal.user.id === currentUser?.id}
                >
                  <option value="CONTRIBUTOR">Contributeur</option>
                  <option value="PROJECT_MANAGER">Chef de projet</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {editModal.user.id === currentUser?.id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Vous ne pouvez pas modifier votre propre rôle
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditModal({ open: false, user: null })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-define text-white rounded-md hover:bg-define/90"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal suppression */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Supprimer l'utilisateur</h3>
            <p className="text-gray-500 mb-4">
              Êtes-vous sûr de vouloir supprimer <strong>{deleteModal.user.firstName} {deleteModal.user.lastName}</strong> ?
              Cette action est irréversible.
            </p>
            {deleteModal.user._count.ownedProjects > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm mb-4">
                Cet utilisateur possède {deleteModal.user._count.ownedProjects} projet(s).
                Transférez-les avant la suppression.
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteModal.user._count.ownedProjects > 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { usersApi } from '../../api';
import { formatDate, extractApiError } from '../../utils';
import Avatar from '../../components/ui/Avatar';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { TableSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const loadUsers = async (p = 1) => {
    setIsLoading(true);
    try {
      const { data } = await usersApi.list({ page: p, limit: 20 });
      setUsers(data.data.users);
      setPagination(data.data.pagination);
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadUsers(page); }, [page]);

  const handleRoleChange = async (userId, role) => {
    try {
      await usersApi.updateRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success('Role updated');
    } catch (error) {
      toast.error(extractApiError(error));
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setIsDeactivating(true);
    try {
      await usersApi.deactivate(deactivateTarget.id);
      setUsers((prev) => prev.map((u) => (u.id === deactivateTarget.id ? { ...u, is_active: false } : u)));
      toast.success('User deactivated');
      setDeactivateTarget(null);
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm mt-1">Manage team members and their roles</p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No users found" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} size="md" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={!user.is_active}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      {user.is_active && (
                        <button
                          onClick={() => setDeactivateTarget(user)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNextPage}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deactivateTarget}
        title="Deactivate User"
        message={`Are you sure you want to deactivate ${deactivateTarget?.name}? They will lose access immediately.`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
        isLoading={isDeactivating}
      />
    </div>
  );
}

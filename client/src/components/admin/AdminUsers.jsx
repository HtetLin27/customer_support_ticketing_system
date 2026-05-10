import { useState, useEffect } from 'react';
import { getAdminUsers, updateUserRole } from '../../api/admin.api';
import { useToast } from '../../context/ToastContext';
import { PageSpinner } from '../ui/Spinner';
import { useAuth } from '../../context/AuthContext';

const ROLE_STYLES = {
  admin: 'bg-purple-100 text-purple-700',
  agent: 'bg-orange-100 text-orange-700',
  customer: 'bg-blue-100 text-blue-700',
};

const ROLE_TRANSITIONS = {
  customer: { to: 'agent', label: 'Promote to Agent' },
  agent: { to: 'customer', label: 'Demote to Customer' },
  admin: null, // can't change admins from UI
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(null); // userId being changed
  const toast = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    getAdminUsers()
      .then((r) => setUsers(r.data.users))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setChanging(userId);
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setChanging(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  if (loading) return <PageSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <span className="text-sm text-gray-500">
          {filtered.length} of {users.length} users
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                     outline-none focus:ring-2 focus:ring-blue-500 flex-1 max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRole(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                     outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th
                className="text-left px-4 py-3 text-xs font-medium text-gray-500
                             uppercase tracking-wide"
              >
                User
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-medium text-gray-500
                             uppercase tracking-wide"
              >
                Role
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-medium text-gray-500
                             uppercase tracking-wide"
              >
                Joined
              </th>
              <th
                className="text-right px-4 py-3 text-xs font-medium text-gray-500
                             uppercase tracking-wide"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((u) => {
              const transition = ROLE_TRANSITIONS[u.role];
              const isSelf = u.id === currentUser?.id;
              const isChanging = changing === u.id;

              return (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center
                        justify-center text-xs font-medium
                        ${ROLE_STYLES[u.role]}`}
                      >
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {u.name}
                          {isSelf && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full
                      ${ROLE_STYLES[u.role]}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {transition && !isSelf ? (
                      <button
                        onClick={() => handleRoleChange(u.id, transition.to)}
                        disabled={isChanging}
                        className="text-xs border border-gray-300 hover:border-blue-400
                                   hover:text-blue-600 px-3 py-1.5 rounded-lg
                                   transition disabled:opacity-50"
                      >
                        {isChanging ? 'Updating...' : transition.label}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {isSelf ? 'Cannot edit self' : 'Admin'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-400">No users match your filters</div>
        )}
      </div>
    </div>
  );
}

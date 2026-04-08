/**
 * Users Page (Admin only)
 * View users and manage roles
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';
import { HiOutlineUsers, HiOutlineShieldCheck } from 'react-icons/hi';
import { ROLES, ROLE_LABELS } from '../config/permissions';
import { useAuth } from '../context/AuthContext';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { hasPerm } = useAuth();
  const canManageRole = hasPerm('user:manage_role');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/auth/users');
      setUsers(data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      await API.put('/auth/users/role', { userId, role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  // Distinct colours per role so the management table is scannable.
  const roleBadge = {
    admin: 'badge-danger',
    procurement: 'badge-success',
    warehouse: 'badge-info',
    production: 'badge-warning',
    qa: 'badge-pink',
    dispatch: 'badge-purple',
    distributor: 'badge-purple',
    employee: 'badge-info'
  };

  const columns = [
    { header: 'User', render: (item) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
          {item.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-white">{item.name}</p>
          <p className="text-xs text-slate-500">{item.email}</p>
        </div>
      </div>
    )},
    { header: 'Role', render: (item) => (
      <span className={`badge ${roleBadge[item.role] || 'badge-info'}`}>{ROLE_LABELS[item.role] || item.role}</span>
    )},
    { header: 'Permissions', render: (item) => (
      <span className="text-xs text-slate-400">{(item.permissions || []).length} granted</span>
    )},
    { header: 'Joined', render: (item) => (
      <span className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
    )},
    { header: 'Change Role', render: (item) => (
      <select
        value={item.role}
        disabled={!canManageRole}
        onChange={(e) => updateRole(item._id, e.target.value)}
        className="select-field"
        style={{ width: '170px', padding: '6px 28px 6px 10px', fontSize: '12px' }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>
    )}
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in page-container">
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <h1 className="flex items-center gap-2">
            <HiOutlineUsers className="text-indigo-400" /> User Management
          </h1>
          <p className="subtitle">Manage users and assign roles</p>
        </div>
        <div className="actions">
          <span className="flex items-center gap-2 text-sm text-slate-400">
            <HiOutlineShieldCheck className="text-indigo-400" /> {users.length} Total Users
          </span>
        </div>
      </div>

      {/* Role Summary — auto-fit so 8 roles flow cleanly across available width */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {ROLES.map((role) => (
          <div key={role} className="glass-card p-3 text-center">
            <p className="text-xl font-bold text-white">{users.filter((u) => u.role === role).length}</p>
            <span className={`badge ${roleBadge[role] || 'badge-info'} mt-1`}>{ROLE_LABELS[role]}</span>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} data={users} searchKey="name" emptyMessage="No users found" />
      </div>
    </div>
  );
};

export default Users;

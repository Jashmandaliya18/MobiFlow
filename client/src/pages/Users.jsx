/**
 * Users Page (Admin only)
 * View users and manage roles
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';
import { HiOutlineUsers, HiOutlineShieldCheck } from 'react-icons/hi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const roleBadge = {
    admin: 'badge-danger',
    employee: 'badge-info',
    distributor: 'badge-purple'
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
      <span className={`badge ${roleBadge[item.role]}`}>{item.role}</span>
    )},
    { header: 'Joined', render: (item) => (
      <span className="text-sm text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
    )},
    { header: 'Change Role', render: (item) => (
      <select
        value={item.role}
        onChange={(e) => updateRole(item._id, e.target.value)}
        className="select-field text-xs py-1.5 px-2"
        style={{ width: 'auto', minWidth: '120px' }}
      >
        <option value="admin">Admin</option>
        <option value="employee">Employee</option>
        <option value="distributor">Distributor</option>
      </select>
    )}
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <HiOutlineUsers className="text-indigo-400" /> User Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">Manage users and assign roles</p>
        </div>
        <div className="flex items-center gap-2">
          <HiOutlineShieldCheck className="text-indigo-400" />
          <span className="text-sm text-slate-400">{users.length} Total Users</span>
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {['admin', 'employee', 'distributor'].map(role => (
          <div key={role} className="glass-card p-4 text-center">
            <p className="text-xl font-bold text-white">{users.filter(u => u.role === role).length}</p>
            <span className={`badge ${roleBadge[role]} mt-1`}>{role}</span>
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

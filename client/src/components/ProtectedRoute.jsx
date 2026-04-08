/**
 * ProtectedRoute Component
 * Wraps routes that require authentication. Accepts either:
 *   - roles: array of role strings (legacy)
 *   - perms: array of permission keys; user must hold every listed perm
 *   - anyPerms: array of permission keys; user must hold at least one
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [], perms = [], anyPerms = [] }) => {
  const { user, loading, hasPerm, hasAnyPerm } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (perms.length > 0 && !hasPerm(...perms)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (anyPerms.length > 0 && !hasAnyPerm(...anyPerms)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

/**
 * Auth Context
 * Provides authentication state + permission helpers throughout the app.
 *
 * On mount, if a persisted token exists, it is validated against /auth/me
 * BEFORE the app is allowed to render a protected route. This prevents the
 * "token in localStorage points to a deleted user" situation from flashing
 * a broken dashboard.
 *
 * The axios response interceptor in api/axios.js dispatches a
 * `mobiflow:session-cleared` event whenever it evicts credentials; the
 * context listens for it so in-memory React state is kept in sync without
 * requiring a full reload.
 */
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import API, { clearSession } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate + validate on mount.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const savedToken = localStorage.getItem('mobiflow_token');
      const savedUser = localStorage.getItem('mobiflow_user');

      if (!savedToken || !savedUser) {
        if (!cancelled) setLoading(false);
        return;
      }

      // Optimistically populate state so the Sidebar etc. don't flicker
      // during the /me round-trip, but verify with the backend before
      // declaring the session healthy.
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        clearSession();
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const { data } = await API.get('/auth/me');
        if (cancelled) return;
        // Refresh the cached user (perms may have changed server-side).
        setUser(data);
        localStorage.setItem('mobiflow_user', JSON.stringify(data));
      } catch {
        // The axios interceptor will already have cleared the session +
        // redirected for 401/403/423; for any other error (e.g. network)
        // we leave the optimistic state alone so the user can retry.
        if (cancelled) return;
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    hydrate();
    return () => { cancelled = true; };
  }, []);

  // Axios interceptor fires this when the server rejects the session.
  useEffect(() => {
    const onCleared = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('mobiflow:session-cleared', onCleared);
    return () => window.removeEventListener('mobiflow:session-cleared', onCleared);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('mobiflow_token', authToken);
    localStorage.setItem('mobiflow_user', JSON.stringify(userData));
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setToken(null);
  };

  // Memoized Set for O(1) permission lookups
  const permSet = useMemo(
    () => new Set(user?.permissions || []),
    [user]
  );

  const hasRole = (...roles) => !!user && roles.includes(user.role);

  // Require every listed permission
  const hasPerm = (...perms) => {
    if (!user) return false;
    return perms.every((p) => permSet.has(p));
  };

  // Require at least one listed permission
  const hasAnyPerm = (...perms) => {
    if (!user) return false;
    return perms.some((p) => permSet.has(p));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, hasPerm, hasAnyPerm }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

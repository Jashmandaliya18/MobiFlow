/**
 * Axios Instance
 * Configured with base URL and auth token interceptor.
 *
 * The response interceptor evicts stored credentials ONLY when the server
 * signals the session itself is dead. Covered cases:
 *   401 — token missing, invalid, or points to a deleted user
 *   423 — account locked (SRS §4.1.1)
 *
 * A 403 means "you're authenticated but this action is not allowed for your
 * role/permissions" — that is NOT a session problem and must not log the
 * user out. The caller is expected to handle it (toast, hide UI, etc.).
 * A `Account is disabled` response uses 403 today; if that becomes a common
 * complaint we can switch the backend to return 401 for disabled accounts.
 *
 * A custom `skipAuthRedirect` axios option lets the login call opt out, so a
 * failed login attempt shows an error toast instead of forcing a redirect.
 */
import axios from 'axios';

const API = axios.create({
  baseURL: '', // Uses Vite proxy
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach JWT on every call.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mobiflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Shared eviction — called from the interceptor and from AuthContext.logout.
// Window-level event lets React components drop their in-memory copy of
// `user` immediately instead of waiting for the next page load.
export const clearSession = () => {
  localStorage.removeItem('mobiflow_token');
  localStorage.removeItem('mobiflow_user');
  window.dispatchEvent(new Event('mobiflow:session-cleared'));
};

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const skip = error.config?.skipAuthRedirect;

    // Only evict on session-level failures. 403 (forbidden action) is left
    // to the caller — the user stays logged in and just sees an error.
    if (!skip && (status === 401 || status === 423)) {
      if (localStorage.getItem('mobiflow_token')) {
        clearSession();
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;

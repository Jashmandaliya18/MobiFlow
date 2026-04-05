/**
 * App Component
 * Main application with routing, layout (Navbar + Sidebar), and auth protection
 */
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RawMaterials from './pages/RawMaterials';
import Manufacturing from './pages/Manufacturing';
import QualityControl from './pages/QualityControl';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Dispatch from './pages/Dispatch';
import Reports from './pages/Reports';
import Users from './pages/Users';

/**
 * Layout wrapper that adds Navbar + Sidebar for authenticated pages
 */
const AppLayout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <Navbar />
      <Sidebar />
      <main style={{
        marginLeft: '220px',
        marginTop: '64px',
        padding: '24px',
        minHeight: 'calc(100vh - 64px)',
        overflowX: 'hidden',
      }}>
        {children}
      </main>
    </div>
  );
};

/**
 * App Routes with auth-based redirects
 */
const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading MobiFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/raw-materials" element={
        <ProtectedRoute roles={['admin', 'employee']}>
          <AppLayout><RawMaterials /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/manufacturing" element={
        <ProtectedRoute roles={['admin', 'employee']}>
          <AppLayout><Manufacturing /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/quality-control" element={
        <ProtectedRoute roles={['admin', 'employee']}>
          <AppLayout><QualityControl /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/inventory" element={
        <ProtectedRoute>
          <AppLayout><Inventory /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <AppLayout><Orders /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/dispatch" element={
        <ProtectedRoute roles={['admin', 'employee']}>
          <AppLayout><Dispatch /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute roles={['admin', 'employee']}>
          <AppLayout><Reports /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute roles={['admin']}>
          <AppLayout><Users /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(15, 12, 50, 0.9)',
              backdropFilter: 'blur(20px)',
              color: '#e2e8f0',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: '16px',
              fontSize: '0.875rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              fontFamily: 'Inter, sans-serif'
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#0f0c32' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0f0c32' } }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;

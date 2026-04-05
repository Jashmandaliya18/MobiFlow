import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineArrowRight } from 'react-icons/hi';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', form);
      login(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-in">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '72px', height: '72px', margin: '0 auto 20px', borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', fontWeight: '900', color: '#fff',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
          }}>M</div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
            Welcome to <span className="gradient-text">MobiFlow</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Manufacturing Management System</p>
        </div>

        {/* Login Card */}
        <div style={{
          background: 'rgba(13, 11, 42, 0.7)',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          borderRadius: '20px',
          padding: '36px',
          backdropFilter: 'blur(20px)',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '28px' }}>Sign In</h2>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#4b5563', display: 'flex', alignItems: 'center',
                }}>
                  <HiOutlineMail size={18} />
                </div>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="admin@mobiflow.com"
                  required id="login-email"
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px',
                    background: 'rgba(8, 5, 30, 0.5)', border: '1px solid rgba(99, 102, 241, 0.1)',
                    borderRadius: '12px', color: '#e2e8f0', fontSize: '14px',
                    fontFamily: 'Inter, sans-serif', outline: 'none',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: '#4b5563', display: 'flex', alignItems: 'center',
                }}>
                  <HiOutlineLockClosed size={18} />
                </div>
                <input
                  type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="••••••••"
                  required id="login-password"
                  style={{
                    width: '100%', padding: '12px 14px 12px 42px',
                    background: 'rgba(8, 5, 30, 0.5)', border: '1px solid rgba(99, 102, 241, 0.1)',
                    borderRadius: '12px', color: '#e2e8f0', fontSize: '14px',
                    fontFamily: 'Inter, sans-serif', outline: 'none',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.08)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(99, 102, 241, 0.1)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button type="submit" disabled={loading} id="login-submit"
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontSize: '15px', fontWeight: '700', fontFamily: 'Inter, sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.25)',
                opacity: loading ? 0.6 : 1,
              }}>
              {loading ? (
                <>
                  <span style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Signing in...
                </>
              ) : (
                <>Sign In <HiOutlineArrowRight /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', marginTop: '24px' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: '#818cf8', fontWeight: '600', textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: '16px', padding: '20px', borderRadius: '16px',
          background: 'rgba(13, 11, 42, 0.5)', border: '1px solid rgba(99, 102, 241, 0.08)',
        }}>
          <p style={{ fontSize: '10px', fontWeight: '700', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '12px' }}>Demo Credentials</p>
          {[
            { role: 'Admin', email: 'admin@mobiflow.com', pass: 'admin123', color: '#f87171' },
            { role: 'Employee', email: 'john@mobiflow.com', pass: 'employee123', color: '#60a5fa' },
            { role: 'Distributor', email: 'techmart@dist.com', pass: 'dist123', color: '#a78bfa' },
          ].map(c => (
            <div key={c.role} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
              <span style={{ color: '#94a3b8', fontWeight: '600', width: '80px' }}>{c.role}</span>
              <span style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>{c.email} / {c.pass}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;

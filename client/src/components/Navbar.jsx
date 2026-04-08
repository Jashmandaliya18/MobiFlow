import { useAuth } from '../context/AuthContext';
import { HiOutlineLogout, HiOutlineBell } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '../config/permissions';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleColor = {
    admin: '#f87171',
    procurement: '#34d399',
    warehouse: '#38bdf8',
    production: '#fbbf24',
    qa: '#f472b6',
    dispatch: '#c084fc',
    distributor: '#a78bfa',
    employee: '#60a5fa'
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: '64px', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', background: 'rgba(5, 8, 22, 0.9)',
      borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
      backdropFilter: 'blur(16px)',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: '900', color: '#fff',
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
        }}>M</div>
        <span style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>
          Mobi<span className="gradient-text">Flow</span>
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <HiOutlineBell size={20} />
        </button>
        <div style={{ width: '1px', height: '28px', background: 'rgba(99, 102, 241, 0.1)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: '700', color: '#fff', background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            flexShrink: 0,
          }}>{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div style={{ minWidth: 0, maxWidth: '180px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <span style={{
              fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
              color: roleColor[user?.role] || '#64748b', letterSpacing: '0.05em',
            }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>
        <button onClick={handleLogout} style={{
          background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
          display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '8px',
        }} title="Logout">
          <HiOutlineLogout size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

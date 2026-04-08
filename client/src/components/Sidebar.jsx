import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import {
  HiOutlineViewGrid, HiOutlineCube, HiOutlineCog, HiOutlineClipboardCheck,
  HiOutlineArchive, HiOutlineShoppingCart, HiOutlineTruck, HiOutlineChartBar, HiOutlineUsers
} from 'react-icons/hi';

const Sidebar = () => {
  const { hasAnyPerm } = useAuth();

  // Each entry lists the permissions that should expose the link.
  // Showing a link only requires that the user hold AT LEAST ONE of them.
  const menuItems = [
    { path: '/dashboard',      icon: HiOutlineViewGrid,       label: 'Dashboard',       perms: [PERMISSIONS.DASHBOARD_VIEW] },
    { path: '/raw-materials',  icon: HiOutlineCube,           label: 'Raw Materials',   perms: [PERMISSIONS.RAW_VIEW, PERMISSIONS.RAW_ADD] },
    { path: '/manufacturing',  icon: HiOutlineCog,            label: 'Manufacturing',   perms: [PERMISSIONS.MFG_VIEW, PERMISSIONS.MFG_CREATE] },
    { path: '/quality-control',icon: HiOutlineClipboardCheck, label: 'Quality Control', perms: [PERMISSIONS.QC_VIEW, PERMISSIONS.QC_ADD] },
    { path: '/inventory',      icon: HiOutlineArchive,        label: 'Inventory',       perms: [PERMISSIONS.INV_VIEW] },
    { path: '/orders',         icon: HiOutlineShoppingCart,   label: 'Orders',          perms: [PERMISSIONS.ORDER_VIEW_ALL, PERMISSIONS.ORDER_VIEW_OWN, PERMISSIONS.ORDER_PLACE] },
    { path: '/dispatch',       icon: HiOutlineTruck,          label: 'Dispatch',        perms: [PERMISSIONS.DISPATCH_VIEW, PERMISSIONS.DISPATCH_CREATE] },
    { path: '/reports',        icon: HiOutlineChartBar,       label: 'Reports',         perms: [PERMISSIONS.REPORT_INVENTORY, PERMISSIONS.REPORT_ORDERS, PERMISSIONS.REPORT_RAW, PERMISSIONS.REPORT_MANUFACTURING, PERMISSIONS.REPORT_QUALITY] },
    { path: '/users',          icon: HiOutlineUsers,          label: 'Users',           perms: [PERMISSIONS.USER_VIEW] },
  ];

  return (
    <aside className="app-sidebar" style={{
      position: 'fixed', left: 0, top: '64px', bottom: 0, width: '220px', zIndex: 40,
      background: 'rgba(5, 8, 22, 0.85)', borderRight: '1px solid rgba(99, 102, 241, 0.06)',
      overflowY: 'auto', flexDirection: 'column',
    }}>
      <nav style={{ padding: '20px 12px', flex: 1 }}>
        <p style={{ fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', padding: '0 12px', marginBottom: '12px' }}>
          Menu
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => {
            if (!hasAnyPerm(...item.perms)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 14px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: isActive ? '600' : '500',
                  color: isActive ? '#e2e8f0' : '#64748b',
                  background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.2s',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                })}
              >
                <Icon style={{ fontSize: '18px', flexShrink: 0 }} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid rgba(99, 102, 241, 0.06)' }}>
        <p style={{ fontSize: '11px', color: '#475569', textAlign: 'center', fontWeight: '500' }}>MobiFlow v1.0</p>
      </div>
    </aside>
  );
};

export default Sidebar;

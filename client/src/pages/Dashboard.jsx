import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineUsers, HiOutlineCube, HiOutlineCog, HiOutlineClipboardCheck,
  HiOutlineArchive, HiOutlineShoppingCart, HiOutlineTruck, HiOutlineExclamation
} from 'react-icons/hi';

const KPICard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: 'rgba(13, 11, 42, 0.65)', border: '1px solid rgba(99, 102, 241, 0.08)',
    borderRadius: '16px', padding: '20px', transition: 'border-color 0.3s',
  }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.08)'}
  >
    <div style={{
      width: '40px', height: '40px', borderRadius: '12px', marginBottom: '14px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `${color}15`, border: `1px solid ${color}20`,
    }}>
      <Icon style={{ fontSize: '18px', color }} />
    </div>
    <p style={{ fontSize: '28px', fontWeight: '800', color: '#fff', lineHeight: 1, marginBottom: '4px' }}>{value}</p>
    <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{label}</p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await API.get('/dashboard');
      setDashboard(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const kpis = dashboard?.kpis;
  const passRate = parseFloat(kpis?.qualityControl?.passRate) || 0;

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Welcome back,</p>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{user?.name} 👋</h1>
      </div>

      {/* KPI Grid — auto-fit so cards reflow cleanly at any viewport width */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        <KPICard icon={HiOutlineUsers} label="Total Users" value={kpis?.users || 0} color="#6366f1" />
        <KPICard icon={HiOutlineCube} label="Raw Materials" value={kpis?.rawMaterials?.total || 0} color="#8b5cf6" />
        <KPICard icon={HiOutlineCog} label="Active Batches" value={kpis?.manufacturing?.active || 0} color="#3b82f6" />
        <KPICard icon={HiOutlineClipboardCheck} label="QC Pass Rate" value={kpis?.qualityControl?.passRate || '0%'} color="#22c55e" />
        <KPICard icon={HiOutlineArchive} label="Inventory Items" value={kpis?.inventory?.total || 0} color="#f59e0b" />
        <KPICard icon={HiOutlineShoppingCart} label="Pending Orders" value={kpis?.orders?.pending || 0} color="#ef4444" />
        <KPICard icon={HiOutlineTruck} label="In Transit" value={kpis?.dispatch?.inTransit || 0} color="#14b8a6" />
        <KPICard icon={HiOutlineExclamation} label="Low Stock Alerts" value={(kpis?.rawMaterials?.lowStock || 0) + (kpis?.inventory?.lowStock || 0)} color="#f97316" />
      </div>

      {/* Middle Row: Manufacturing + QC Ring + Orders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Manufacturing */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineCog style={{ color: '#6366f1' }} /> Manufacturing
          </h3>
          {[
            { label: 'Total Batches', value: kpis?.manufacturing?.total || 0, color: '#a5b4fc' },
            { label: 'Active', value: kpis?.manufacturing?.active || 0, color: '#fbbf24' },
            { label: 'Completed', value: kpis?.manufacturing?.completed || 0, color: '#4ade80' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', marginBottom: '8px', borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.04)',
            }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* QC Donut */}
        <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineClipboardCheck style={{ color: '#22c55e' }} /> Quality Control
          </h3>
          <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 16px' }}>
            <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="40" stroke="rgba(99,102,241,0.08)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="40" stroke="#22c55e" strokeWidth="8" fill="none"
                strokeLinecap="round" strokeDasharray={`${passRate * 2.51} ${251 - passRate * 2.51}`} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{passRate}%</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Pass Rate</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '800', color: '#4ade80' }}>{kpis?.qualityControl?.passed || 0}</p>
              <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Passed</p>
            </div>
            <div>
              <p style={{ fontSize: '18px', fontWeight: '800', color: '#f87171' }}>{(kpis?.qualityControl?.total || 0) - (kpis?.qualityControl?.passed || 0)}</p>
              <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Failed</p>
            </div>
          </div>
        </div>

        {/* Order Pipeline */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineShoppingCart style={{ color: '#f59e0b' }} /> Order Pipeline
          </h3>
          {[
            { label: 'Pending', value: kpis?.orders?.pending || 0, color: '#fbbf24' },
            { label: 'Approved', value: (kpis?.orders?.total || 0) - (kpis?.orders?.pending || 0) - (kpis?.orders?.delivered || 0), color: '#60a5fa' },
            { label: 'Delivered', value: kpis?.orders?.delivered || 0, color: '#4ade80' },
          ].map(item => {
            const total = kpis?.orders?.total || 1;
            const pct = Math.round((item.value / total) * 100);
            return (
              <div key={item.label} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: item.color }}>{item.value}</span>
                </div>
                <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(99, 102, 241, 0.06)' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', width: `${pct}%`,
                    background: item.color, transition: 'width 1s ease',
                  }} />
                </div>
              </div>
            );
          })}
          <div style={{ textAlign: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(99, 102, 241, 0.06)' }}>
            <p style={{ fontSize: '24px', fontWeight: '800', color: '#fff' }}>{kpis?.orders?.total || 0}</p>
            <p style={{ fontSize: '11px', color: '#64748b' }}>Total Orders</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {/* Recent Orders */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Recent Orders</h3>
          {dashboard?.recentActivity?.orders?.length > 0 ? (
            dashboard.recentActivity.orders.map((order, i) => (
              <div key={order._id || i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '6px',
                background: 'rgba(99, 102, 241, 0.03)',
              }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{order.product_id?.item_name || 'Product'}</p>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>{order.distributor_id?.name} • Qty: {order.quantity}</p>
                </div>
                <span className={`status-badge status-${order.status?.toLowerCase()}`}>{order.status}</span>
              </div>
            ))
          ) : <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No recent orders</p>}
        </div>

        {/* Recent Batches */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>Recent Batches</h3>
          {dashboard?.recentActivity?.batches?.length > 0 ? (
            dashboard.recentActivity.batches.map((batch, i) => (
              <div key={batch._id || i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '6px',
                background: 'rgba(99, 102, 241, 0.03)',
              }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0' }}>{batch.product_name}</p>
                  <p style={{ fontSize: '11px', color: '#64748b' }}>{batch.batch_id} • {batch.stage}</p>
                </div>
                <span className={`status-badge status-${batch.status?.toLowerCase().replace(/\s/g, '-')}`}>{batch.status}</span>
              </div>
            ))
          ) : <p style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No recent batches</p>}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

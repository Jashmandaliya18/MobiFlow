const StatsCard = ({ icon: Icon, label, value, color = '#6366f1' }) => {
  return (
    <div style={{
      background: 'rgba(13, 11, 42, 0.65)', border: '1px solid rgba(99, 102, 241, 0.08)',
      borderRadius: '16px', padding: '20px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px', marginBottom: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}15`,
      }}>
        {Icon && <Icon style={{ fontSize: '18px', color }} />}
      </div>
      <p style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>{value}</p>
      <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>{label}</p>
    </div>
  );
};

export default StatsCard;

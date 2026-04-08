/**
 * Dispatch Page
 * Create dispatch records and track shipments
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX, HiOutlineTruck } from 'react-icons/hi';

const Dispatch = () => {
  const { hasPerm } = useAuth();
  const canCreate = hasPerm(PERMISSIONS.DISPATCH_CREATE);
  const canUpdate = hasPerm(PERMISSIONS.DISPATCH_UPDATE);

  const [dispatches, setDispatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order_id: '', carrier: '', tracking_id: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [dispRes, ordRes] = await Promise.all([
        API.get('/dispatch/all'),
        API.get('/order/all')
      ]);
      setDispatches(dispRes.data);
      // Only show approved orders that don't have a dispatch yet
      const dispatchedOrderIds = dispRes.data.map(d => d.order_id?._id);
      setOrders(ordRes.data.filter(o => o.status === 'Approved' && !dispatchedOrderIds.includes(o._id)));
    } catch (err) {
      toast.error('Failed to fetch dispatch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/dispatch/create', form);
      toast.success('Dispatch created');
      setForm({ order_id: '', carrier: '', tracking_id: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create dispatch');
    }
  };

  const updateDelivery = async (id, delivery_status) => {
    try {
      await API.put(`/dispatch/update/${id}`, { delivery_status });
      toast.success('Delivery status updated');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const columns = [
    { header: 'Tracking ID', render: (item) => <span className="font-mono text-xs text-indigo-400">{item.tracking_id}</span> },
    { header: 'Order', render: (item) => (
      <div>
        <p className="text-sm font-medium text-white">{item.order_id?.product_id?.item_name || 'N/A'}</p>
        <p className="text-xs text-slate-500">To: {item.order_id?.distributor_id?.name || 'N/A'}</p>
      </div>
    )},
    { header: 'Carrier', accessor: 'carrier' },
    { header: 'Dispatch Date', render: (item) => <span className="text-xs text-slate-400">{new Date(item.dispatch_date).toLocaleDateString()}</span> },
    { header: 'Status', render: (item) => (
      <span className={`status-badge status-${item.delivery_status.toLowerCase().replace(/\s/g, '-')}`}>{item.delivery_status}</span>
    )},
    ...(canUpdate ? [{
      header: 'Actions', render: (item) => {
        if (item.delivery_status === 'Delivered') return <span className="text-xs text-green-500">✓ Delivered</span>;
        const next = item.delivery_status === 'Pending' ? 'In Transit' : 'Delivered';
        return (
          <button onClick={() => updateDelivery(item._id, next)} className="btn-secondary text-xs py-1 px-3">
            → {next}
          </button>
        );
      }
    }] : [])
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in page-container">
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <h1>Distribution &amp; Dispatch</h1>
          <p className="subtitle">Schedule and track shipments</p>
        </div>
        {canCreate && (
          <div className="actions">
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? <><HiOutlineX /> Close</> : <><HiOutlineTruck /> Create Dispatch</>}
            </button>
          </div>
        )}
      </div>

      {/* Dispatch Form */}
      {showForm && canCreate && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Create Dispatch</h3>
          {orders.length === 0 ? (
            <p className="text-slate-400 text-sm">No approved orders available for dispatch.</p>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Select Order</label>
                <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })} className="select-field" required>
                  <option value="">Choose order...</option>
                  {orders.map(o => (
                    <option key={o._id} value={o._id}>
                      {o.product_id?.item_name} - {o.distributor_id?.name} (Qty: {o.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Carrier</label>
                <input value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} className="input-field" required placeholder="e.g. FastShip Logistics" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Tracking ID</label>
                <input value={form.tracking_id} onChange={(e) => setForm({ ...form, tracking_id: e.target.value })} className="input-field" required placeholder="e.g. TRK-2024-001" />
              </div>
              <div className="md:col-span-3 flex flex-wrap gap-3 pt-2">
                <button type="submit" className="btn-primary"><HiOutlinePlus /> Create Dispatch</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px'
      }}>
        {['Pending', 'In Transit', 'Delivered'].map(status => (
          <div key={status} className="glass-card p-4 text-center">
            <p className="text-xl font-bold text-white">{dispatches.filter(d => d.delivery_status === status).length}</p>
            <p className="text-xs text-slate-400">{status}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} data={dispatches} searchKey="tracking_id" emptyMessage="No dispatch records" />
      </div>
    </div>
  );
};

export default Dispatch;

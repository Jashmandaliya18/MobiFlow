/**
 * Orders Page
 * Place and manage orders (role-dependent views)
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX, HiOutlineShoppingCart } from 'react-icons/hi';

const Orders = () => {
  const { user, hasPerm } = useAuth();
  const canPlaceOrder = hasPerm(PERMISSIONS.ORDER_PLACE);
  const canViewAll    = hasPerm(PERMISSIONS.ORDER_VIEW_ALL);
  const canUpdate     = hasPerm(PERMISSIONS.ORDER_UPDATE);

  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: '', quantity: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const ordRes = canViewAll
        ? await API.get('/order/all')
        : await API.get(`/order/history/${user._id}`);
      const invRes = await API.get('/inventory/all');
      setOrders(Array.isArray(ordRes.data) ? ordRes.data : []);
      setInventory(invRes.data);
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/order/place', { product_id: form.product_id, quantity: Number(form.quantity) });
      toast.success('Order placed successfully');
      setForm({ product_id: '', quantity: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
  };

  const updateOrder = async (id, status) => {
    try {
      await API.put(`/order/update/${id}`, { status });
      toast.success(`Order ${status.toLowerCase()}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const getStatusActions = (order) => {
    if (!canUpdate) return null;
    const nextStatus = {
      'Pending': 'Approved',
      'Approved': null, // Dispatch handles next transition
    };
    const next = nextStatus[order.status];
    if (!next) return null;
    return (
      <button onClick={() => updateOrder(order._id, next)} className="btn-secondary text-xs py-1 px-3">
        {next === 'Approved' ? '✓ Approve' : `→ ${next}`}
      </button>
    );
  };

  const columns = [
    { header: 'Order ID', render: (item) => <span className="font-mono text-xs text-indigo-400">{item._id?.slice(-8)}</span> },
    { header: 'Product', render: (item) => <span className="font-medium text-white">{item.product_id?.item_name || 'N/A'}</span> },
    { header: 'Distributor', render: (item) => (
      <div>
        <p className="text-sm">{item.distributor_id?.name || 'N/A'}</p>
        <p className="text-xs text-slate-500">{item.distributor_id?.email || ''}</p>
      </div>
    )},
    { header: 'Qty', accessor: 'quantity' },
    { header: 'Status', render: (item) => (
      <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
    )},
    { header: 'Date', render: (item) => <span className="text-xs text-slate-500">{new Date(item.order_date).toLocaleDateString()}</span> },
    ...(canUpdate ? [{ header: 'Actions', render: (item) => getStatusActions(item) }] : [])
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in page-container">
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <h1>{canViewAll ? 'Order Management' : 'My Orders'}</h1>
          <p className="subtitle">{canViewAll ? 'Manage distributor orders' : 'Place and track your orders'}</p>
        </div>
        {canPlaceOrder && (
          <div className="actions">
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? <><HiOutlineX /> Close</> : <><HiOutlineShoppingCart /> Place Order</>}
            </button>
          </div>
        )}
      </div>

      {/* Place Order Form — visible only to users with order:place */}
      {showForm && canPlaceOrder && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Place New Order</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-300 mb-1">Select Product</label>
              <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="select-field" required>
                <option value="">Choose product...</option>
                {inventory.filter(i => i.status === 'In Stock').map(item => (
                  <option key={item._id} value={item._id}>{item.item_name} (Available: {item.quantity})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input-field" required placeholder="0" />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary"><HiOutlinePlus /> Place Order</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Orders Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {['Pending', 'Approved', 'Dispatched', 'Delivered'].map(status => (
          <div key={status} className="glass-card p-4 text-center">
            <p className="text-xl font-bold text-white">{orders.filter(o => o.status === status).length}</p>
            <p className="text-xs text-slate-400">{status}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <DataTable columns={columns} data={orders} emptyMessage="No orders found" />
      </div>
    </div>
  );
};

export default Orders;

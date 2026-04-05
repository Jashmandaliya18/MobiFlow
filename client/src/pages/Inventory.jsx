/**
 * Inventory Page
 * Manage warehouse inventory with stock tracking
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX, HiOutlinePencil, HiOutlineExclamation } from 'react-icons/hi';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ item_name: '', quantity: '', location: '', lot_number: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [invRes, lowRes] = await Promise.all([
        API.get('/inventory/all'),
        API.get('/inventory/low-stock')
      ]);
      setItems(invRes.data);
      setLowStock(lowRes.data.items || []);
    } catch (err) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, quantity: Number(form.quantity) };
      if (editId) {
        await API.put(`/inventory/update/${editId}`, payload);
        toast.success('Inventory updated');
      } else {
        await API.post('/inventory/add', payload);
        toast.success('Item added');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (item) => {
    setForm({ item_name: item.item_name, quantity: item.quantity.toString(), location: item.location, lot_number: item.lot_number });
    setEditId(item._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ item_name: '', quantity: '', location: '', lot_number: '' });
    setEditId(null);
    setShowForm(false);
  };

  const columns = [
    { header: 'Item', render: (item) => <span className="font-medium text-white">{item.item_name}</span> },
    { header: 'Quantity', render: (item) => (
      <span className={item.status !== 'In Stock' ? 'text-amber-400 font-semibold' : 'text-white'}>
        {item.quantity.toLocaleString()}
      </span>
    )},
    { header: 'Location', accessor: 'location' },
    { header: 'Lot Number', render: (item) => <span className="font-mono text-xs text-slate-400">{item.lot_number}</span> },
    { header: 'Batch', render: (item) => (
      item.linked_batch
        ? <span className="font-mono text-xs text-indigo-400">{item.linked_batch.batch_id || '—'}</span>
        : <span className="text-slate-600 text-xs">Manual Entry</span>
    )},
    { header: 'Status', render: (item) => (
      <span className={`status-badge status-${item.status.toLowerCase().replace(/\s/g, '-')}`}>{item.status}</span>
    )},
    { header: 'Actions', render: (item) => (
      <button onClick={() => handleEdit(item)} className="btn-secondary text-xs py-1 px-3">
        <HiOutlinePencil className="inline mr-1" /> Edit
      </button>
    )}
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory & Warehouse</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time inventory tracking and management</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">
          {showForm ? <><HiOutlineX /> Close</> : <><HiOutlinePlus /> Add Item</>}
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="glass-card p-4 mb-6 flex items-start gap-3" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <HiOutlineExclamation className="text-2xl text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-400">Low Stock Alert</p>
            <p className="text-sm text-slate-400">
              {lowStock.length} item(s) need attention: {lowStock.map(i => `${i.item_name} (${i.quantity})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">{editId ? 'Edit Item' : 'Add Inventory Item'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Item Name</label>
              <input name="item_name" value={form.item_name} onChange={handleChange} className="input-field" required placeholder="e.g. MobiFlow Sensor Module" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Quantity</label>
              <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} className="input-field" required placeholder="0" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Location</label>
              <input name="location" value={form.location} onChange={handleChange} className="input-field" required placeholder="e.g. Warehouse A - Zone 1" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Lot Number</label>
              <input name="lot_number" value={form.lot_number} onChange={handleChange} className="input-field" required placeholder="e.g. LOT-001" />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Item</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card p-6">
        <DataTable columns={columns} data={items} searchKey="item_name" emptyMessage="No inventory items found" />
      </div>
    </div>
  );
};

export default Inventory;

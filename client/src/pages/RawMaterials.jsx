/**
 * Raw Materials Page
 * Add, view, update raw materials with low stock alerts
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineExclamation, HiOutlinePencil, HiOutlineX } from 'react-icons/hi';

const RawMaterials = () => {
  const { hasPerm } = useAuth();
  const canAdd = hasPerm(PERMISSIONS.RAW_ADD);
  const canUpdate = hasPerm(PERMISSIONS.RAW_UPDATE);

  const [materials, setMaterials] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    material_name: '', material_type: '', supplier_name: '',
    quantity: '', cost: '', reorder_threshold: '50', storage_location: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matRes, lowRes] = await Promise.all([
        API.get('/raw/all'),
        API.get('/raw/low-stock')
      ]);
      setMaterials(matRes.data);
      setLowStock(lowRes.data.materials || []);
    } catch (err) {
      toast.error('Failed to fetch materials');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        cost: Number(form.cost),
        reorder_threshold: Number(form.reorder_threshold)
      };

      if (editId) {
        await API.put(`/raw/update/${editId}`, payload);
        toast.success('Material updated');
      } else {
        await API.post('/raw/add', payload);
        toast.success('Material added');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (material) => {
    setForm({
      material_name: material.material_name,
      material_type: material.material_type,
      supplier_name: material.supplier_name,
      quantity: material.quantity.toString(),
      cost: material.cost.toString(),
      reorder_threshold: material.reorder_threshold.toString(),
      storage_location: material.storage_location
    });
    setEditId(material._id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({ material_name: '', material_type: '', supplier_name: '', quantity: '', cost: '', reorder_threshold: '50', storage_location: '' });
    setEditId(null);
    setShowForm(false);
  };

  const columns = [
    { header: 'Material', accessor: 'material_name', render: (item) => (
      <div>
        <p className="font-medium text-white">{item.material_name}</p>
        <p className="text-xs text-slate-500">{item.material_type}</p>
      </div>
    )},
    { header: 'Supplier', accessor: 'supplier_name' },
    { header: 'Quantity', render: (item) => (
      <span className={item.quantity <= item.reorder_threshold ? 'text-amber-400 font-semibold' : 'text-white'}>
        {item.quantity.toLocaleString()}
      </span>
    )},
    { header: 'Cost', render: (item) => `$${item.cost.toFixed(2)}` },
    { header: 'Location', accessor: 'storage_location' },
    { header: 'Status', render: (item) => (
      item.quantity <= item.reorder_threshold
        ? <span className="status-badge status-low">Low Stock</span>
        : <span className="status-badge status-in-stock">In Stock</span>
    )},
    ...(canUpdate ? [{
      header: 'Actions', render: (item) => (
        <button onClick={() => handleEdit(item)} className="btn-secondary text-xs py-1 px-3">
          <HiOutlinePencil className="inline mr-1" /> Edit
        </button>
      )
    }] : [])
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <h1>Raw Materials</h1>
          <p className="subtitle">Manage raw materials and supplier tracking</p>
        </div>
        {canAdd && (
          <div className="actions">
            <button onClick={() => { resetForm(); setShowForm(!showForm); }} className="btn-primary">
              {showForm ? <><HiOutlineX /> Close</> : <><HiOutlinePlus /> Add Material</>}
            </button>
          </div>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="glass-card p-4 flex items-start gap-3" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <HiOutlineExclamation className="text-2xl text-amber-400 flex-shrink-0 mt-0.5" />
          <div style={{ minWidth: 0 }}>
            <p className="font-semibold text-amber-400">Low Stock Alert</p>
            <p className="text-sm text-slate-400">
              {lowStock.length} material(s) at or below reorder threshold:
              {' '}{lowStock.map(m => m.material_name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editId ? 'Edit Material' : 'Add New Material'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Material Name</label>
              <input name="material_name" value={form.material_name} onChange={handleChange} className="input-field" required placeholder="e.g. Capacitor 100µF" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Material Type</label>
              <input name="material_type" value={form.material_type} onChange={handleChange} className="input-field" required placeholder="e.g. Electronic Component" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Supplier Name</label>
              <input name="supplier_name" value={form.supplier_name} onChange={handleChange} className="input-field" required placeholder="e.g. DigiParts Inc." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Quantity</label>
              <input name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} className="input-field" required placeholder="0" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Cost per Unit ($)</label>
              <input name="cost" type="number" min="0" step="0.01" value={form.cost} onChange={handleChange} className="input-field" required placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Reorder Threshold</label>
              <input name="reorder_threshold" type="number" min="0" value={form.reorder_threshold} onChange={handleChange} className="input-field" placeholder="50" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm text-slate-300 mb-1">Storage Location</label>
              <input name="storage_location" value={form.storage_location} onChange={handleChange} className="input-field" required placeholder="e.g. Warehouse A - Shelf 1" />
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex flex-wrap gap-3 pt-2">
              <button type="submit" className="btn-primary">{editId ? 'Update' : 'Add'} Material</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Materials Table */}
      <div className="glass-card p-6">
        <DataTable columns={columns} data={materials} searchKey="material_name" emptyMessage="No raw materials found. Add your first material!" />
      </div>
    </div>
  );
};

export default RawMaterials;

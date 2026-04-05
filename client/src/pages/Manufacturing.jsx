/**
 * Manufacturing Page
 * Create batches, track stages, manage production
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX, HiOutlineArrowRight } from 'react-icons/hi';

const Manufacturing = () => {
  const [batches, setBatches] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_name: '', quantity: '', materials_used: [] });
  const [selectedMaterial, setSelectedMaterial] = useState({ material: '', quantity_used: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [batchRes, matRes] = await Promise.all([
        API.get('/manufacturing/all'),
        API.get('/raw/all')
      ]);
      setBatches(batchRes.data);
      setMaterials(matRes.data);
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addMaterialToBOM = () => {
    if (!selectedMaterial.material || !selectedMaterial.quantity_used) return;
    setForm({
      ...form,
      materials_used: [...form.materials_used, { ...selectedMaterial, quantity_used: Number(selectedMaterial.quantity_used) }]
    });
    setSelectedMaterial({ material: '', quantity_used: '' });
  };

  const removeMaterialFromBOM = (index) => {
    setForm({
      ...form,
      materials_used: form.materials_used.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/manufacturing/create', {
        product_name: form.product_name,
        quantity: Number(form.quantity),
        materials_used: form.materials_used
      });
      toast.success('Batch created successfully');
      setForm({ product_name: '', quantity: '', materials_used: [] });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create batch');
    }
  };

  const updateBatch = async (id, updates) => {
    try {
      await API.put(`/manufacturing/update/${id}`, updates);
      toast.success('Batch updated');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const getNextStage = (current) => {
    const flow = ['Assembly', 'Testing', 'Packaging', 'Completed'];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const columns = [
    { header: 'Batch ID', render: (item) => <span className="font-mono text-indigo-400 text-xs">{item.batch_id}</span> },
    { header: 'Product', accessor: 'product_name', render: (item) => <span className="font-medium text-white">{item.product_name}</span> },
    { header: 'Qty', accessor: 'quantity' },
    { header: 'Stage', render: (item) => {
      const stages = ['Assembly', 'Testing', 'Packaging', 'Completed'];
      const currentIdx = stages.indexOf(item.stage);
      return (
        <div className="flex items-center gap-1">
          {stages.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${i <= currentIdx ? 'bg-indigo-500' : 'bg-slate-700'}`} title={s} />
              {i < stages.length - 1 && <div className={`w-4 h-0.5 ${i < currentIdx ? 'bg-indigo-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
          <span className="ml-2 text-xs text-slate-400">{item.stage}</span>
        </div>
      );
    }},
    { header: 'Status', render: (item) => (
      <span className={`status-badge status-${item.status.toLowerCase().replace(/\s/g, '-')}`}>{item.status}</span>
    )},
    { header: 'Defects', render: (item) => (
      <span className={item.defective_count > 0 ? 'text-red-400 font-semibold' : 'text-slate-500'}>{item.defective_count}</span>
    )},
    { header: 'Actions', render: (item) => {
      const nextStage = getNextStage(item.stage);
      if (!nextStage || item.status === 'Completed') return <span className="text-xs text-slate-600">Done</span>;
      return (
        <button
          onClick={() => updateBatch(item._id, { stage: nextStage, status: nextStage === 'Completed' ? 'Completed' : 'In Progress' })}
          className="btn-secondary text-xs py-1 px-3"
        >
          → {nextStage}
        </button>
      );
    }}
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manufacturing & Assembly</h1>
          <p className="text-slate-400 text-sm mt-1">Create and track production batches</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><HiOutlineX /> Close</> : <><HiOutlinePlus /> Create Batch</>}
        </button>
      </div>

      {/* Create Batch Form */}
      {showForm && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Create Production Batch</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Product Name</label>
                <input name="product_name" value={form.product_name} onChange={handleChange} className="input-field" required placeholder="e.g. MobiFlow Sensor Module" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Quantity</label>
                <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} className="input-field" required placeholder="100" />
              </div>
            </div>

            {/* BOM Section */}
            <div>
              <label className="block text-sm text-slate-300 mb-2">Bill of Materials (BOM)</label>
              <div className="flex gap-3 mb-3">
                <select
                  value={selectedMaterial.material}
                  onChange={(e) => setSelectedMaterial({ ...selectedMaterial, material: e.target.value })}
                  className="select-field flex-1"
                >
                  <option value="">Select Material</option>
                  {materials.map(m => (
                    <option key={m._id} value={m._id}>{m.material_name} (Avail: {m.quantity})</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={selectedMaterial.quantity_used}
                  onChange={(e) => setSelectedMaterial({ ...selectedMaterial, quantity_used: e.target.value })}
                  className="input-field w-28"
                />
                <button type="button" onClick={addMaterialToBOM} className="btn-secondary">
                  <HiOutlinePlus />
                </button>
              </div>

              {form.materials_used.length > 0 && (
                <div className="space-y-2">
                  {form.materials_used.map((bom, i) => {
                    const mat = materials.find(m => m._id === bom.material);
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(15, 10, 46, 0.4)' }}>
                        <span className="text-sm text-slate-300">{mat?.material_name || 'Material'} × {bom.quantity_used}</span>
                        <button type="button" onClick={() => removeMaterialFromBOM(i)} className="text-red-400 hover:text-red-300">
                          <HiOutlineX />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary"><HiOutlineArrowRight /> Create Batch</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Batches Table */}
      <div className="glass-card p-6">
        <DataTable columns={columns} data={batches} searchKey="product_name" emptyMessage="No production batches yet" />
      </div>
    </div>
  );
};

export default Manufacturing;

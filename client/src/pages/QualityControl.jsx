/**
 * Quality Control Page
 * Record inspections and view QC reports
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX, HiOutlineClipboardCheck } from 'react-icons/hi';

const QualityControl = () => {
  const [reports, setReports] = useState({ summary: {}, reports: [] });
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ batch_id: '', inspection_result: 'Pass', defects: '', remarks: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [qcRes, batchRes] = await Promise.all([
        API.get('/qc/report'),
        API.get('/manufacturing/all')
      ]);
      setReports(qcRes.data);
      setBatches(batchRes.data);
    } catch (err) {
      toast.error('Failed to fetch QC data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        defects: form.defects ? form.defects.split(',').map(d => d.trim()).filter(Boolean) : []
      };
      await API.post('/qc/add', payload);
      toast.success('Inspection recorded');
      setForm({ batch_id: '', inspection_result: 'Pass', defects: '', remarks: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record inspection');
    }
  };

  const columns = [
    { header: 'Batch', render: (item) => (
      <div>
        <p className="font-mono text-xs text-indigo-400">{item.batch_id?.batch_id || 'N/A'}</p>
        <p className="text-xs text-slate-500">{item.batch_id?.product_name || ''}</p>
      </div>
    )},
    { header: 'Result', render: (item) => (
      <span className={`status-badge status-${item.inspection_result.toLowerCase()}`}>{item.inspection_result}</span>
    )},
    { header: 'Defects', render: (item) => (
      item.defects?.length > 0
        ? <div className="space-y-1">{item.defects.map((d, i) => <span key={i} className="badge badge-danger mr-1 text-xs">{d}</span>)}</div>
        : <span className="text-slate-600 text-xs">None</span>
    )},
    { header: 'Remarks', render: (item) => <span className="text-xs text-slate-400">{item.remarks || '—'}</span> },
    { header: 'Inspector', render: (item) => <span className="text-xs">{item.inspected_by?.name || '—'}</span> },
    { header: 'Date', render: (item) => <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</span> }
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Quality Control</h1>
          <p className="text-slate-400 text-sm mt-1">Inspect products and manage quality reports</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><HiOutlineX /> Close</> : <><HiOutlineClipboardCheck /> Record Inspection</>}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-white">{reports.summary.total || 0}</p>
          <p className="text-xs text-slate-400">Total Inspections</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{reports.summary.passed || 0}</p>
          <p className="text-xs text-slate-400">Passed</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{reports.summary.failed || 0}</p>
          <p className="text-xs text-slate-400">Failed</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-indigo-400">{reports.summary.passRate || '0%'}</p>
          <p className="text-xs text-slate-400">Pass Rate</p>
        </div>
      </div>

      {/* Inspection Form */}
      {showForm && (
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-white mb-4">Record Inspection</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Select Batch</label>
              <select name="batch_id" value={form.batch_id} onChange={(e) => setForm({ ...form, batch_id: e.target.value })} className="select-field" required>
                <option value="">Choose batch...</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.batch_id} - {b.product_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Inspection Result</label>
              <select name="inspection_result" value={form.inspection_result} onChange={(e) => setForm({ ...form, inspection_result: e.target.value })} className="select-field">
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Defects (comma separated)</label>
              <input name="defects" value={form.defects} onChange={(e) => setForm({ ...form, defects: e.target.value })} className="input-field" placeholder="e.g. Soldering defect, alignment issue" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Remarks</label>
              <input name="remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="input-field" placeholder="Additional notes..." />
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary">Record Inspection</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Reports Table */}
      <div className="glass-card p-6">
        <DataTable columns={columns} data={reports.reports || []} emptyMessage="No inspection records yet" />
      </div>
    </div>
  );
};

export default QualityControl;

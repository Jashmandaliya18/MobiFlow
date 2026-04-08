/**
 * Reports Page (SRS §3.1.8)
 *
 * Five report types backed by REST endpoints that accept `?format=csv|pdf`
 * for downloads. Tabs, summary cards, and columns are defined in a single
 * `REPORT_DEFS` config so adding a new report is ~10 lines.
 *
 * Security: the tab list is filtered by the user's effective permissions,
 * the route itself is guarded in App.jsx, and every export request flows
 * through the axios instance (JWT attached automatically).
 */
import { useState, useEffect, useMemo } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';
import toast from 'react-hot-toast';
import {
  HiOutlineChartBar, HiOutlineArchive, HiOutlineShoppingCart,
  HiOutlineCube, HiOutlineCog, HiOutlineClipboardCheck,
  HiOutlineDocumentDownload, HiOutlineDocumentText
} from 'react-icons/hi';

// ------- Report definitions ---------------------------------------------

const REPORT_DEFS = [
  {
    key: 'inventory',
    perm: PERMISSIONS.REPORT_INVENTORY,
    label: 'Inventory',
    icon: HiOutlineArchive,
    endpoint: '/reports/inventory',
    itemsKey: 'items',
    searchKey: 'item_name',
    summaryCards: [
      { label: 'Total Items',   key: 'totalItems',    color: '#fff' },
      { label: 'Total Units',   key: 'totalQuantity', color: '#818cf8', format: (n) => Number(n || 0).toLocaleString() },
      { label: 'In Stock',      key: 'inStock',       color: '#4ade80' },
      { label: 'Low Stock',     key: 'low',           color: '#fbbf24' },
      { label: 'Out of Stock',  key: 'outOfStock',    color: '#f87171' },
    ],
    columns: [
      { header: 'Item',     render: (r) => <span className="font-medium text-white">{r.item_name}</span> },
      { header: 'Quantity', render: (r) => r.quantity.toLocaleString() },
      { header: 'Location', accessor: 'location' },
      { header: 'Lot #',    render: (r) => <span className="font-mono text-xs text-slate-400">{r.lot_number}</span> },
      { header: 'Status',   render: (r) => <span className={`status-badge status-${r.status.toLowerCase().replace(/\s/g, '-')}`}>{r.status}</span> },
    ],
  },
  {
    key: 'orders',
    perm: PERMISSIONS.REPORT_ORDERS,
    label: 'Orders',
    icon: HiOutlineShoppingCart,
    endpoint: '/reports/orders',
    itemsKey: 'orders',
    summaryCards: [
      { label: 'Total Orders', key: 'totalOrders', color: '#fff' },
      { label: 'Pending',      key: 'pending',     color: '#fbbf24' },
      { label: 'Approved',     key: 'approved',    color: '#60a5fa' },
      { label: 'Dispatched',   key: 'dispatched',  color: '#a78bfa' },
      { label: 'Delivered',    key: 'delivered',   color: '#4ade80' },
    ],
    columns: [
      { header: 'Product',     render: (r) => <span className="font-medium text-white">{r.product_id?.item_name || 'N/A'}</span> },
      { header: 'Distributor', render: (r) => r.distributor_id?.name || 'N/A' },
      { header: 'Quantity',    accessor: 'quantity' },
      { header: 'Status',      render: (r) => <span className={`status-badge status-${r.status.toLowerCase()}`}>{r.status}</span> },
      { header: 'Date',        render: (r) => new Date(r.order_date).toLocaleDateString() },
    ],
  },
  {
    key: 'raw-materials',
    perm: PERMISSIONS.REPORT_RAW,
    label: 'Raw Materials',
    icon: HiOutlineCube,
    endpoint: '/reports/raw-materials',
    itemsKey: 'items',
    searchKey: 'material_name',
    summaryCards: [
      { label: 'Materials',  key: 'totalMaterials', color: '#fff' },
      { label: 'Total Units', key: 'totalUnits',    color: '#818cf8', format: (n) => Number(n || 0).toLocaleString() },
      { label: 'Low Stock',  key: 'lowStock',       color: '#fbbf24' },
    ],
    columns: [
      { header: 'Material', render: (r) => <span className="font-medium text-white">{r.material_name}</span> },
      { header: 'Type',     accessor: 'material_type' },
      { header: 'Supplier', accessor: 'supplier_name' },
      { header: 'Quantity', render: (r) => (
          <span className={r.quantity <= r.reorder_threshold ? 'text-amber-400 font-semibold' : ''}>
            {r.quantity.toLocaleString()}
          </span>
        ) },
      { header: 'Reorder @', accessor: 'reorder_threshold' },
      { header: 'Cost',     render: (r) => `$${Number(r.cost).toFixed(2)}` },
    ],
  },
  {
    key: 'manufacturing',
    perm: PERMISSIONS.REPORT_MANUFACTURING,
    label: 'Manufacturing',
    icon: HiOutlineCog,
    endpoint: '/reports/manufacturing',
    itemsKey: 'items',
    searchKey: 'product_name',
    summaryCards: [
      { label: 'Total Batches', key: 'totalBatches',  color: '#fff' },
      { label: 'In Progress',   key: 'inProgress',    color: '#60a5fa' },
      { label: 'Completed',     key: 'completed',     color: '#4ade80' },
      { label: 'On Hold',       key: 'onHold',        color: '#fbbf24' },
      { label: 'Total Defects', key: 'totalDefects',  color: '#f87171' },
    ],
    columns: [
      { header: 'Batch ID', render: (r) => <span className="font-mono text-indigo-400 text-xs">{r.batch_id}</span> },
      { header: 'Product',  render: (r) => <span className="font-medium text-white">{r.product_name}</span> },
      { header: 'Quantity', accessor: 'quantity' },
      { header: 'Stage',    accessor: 'stage' },
      { header: 'Status',   render: (r) => <span className={`status-badge status-${r.status.toLowerCase().replace(/\s/g, '-')}`}>{r.status}</span> },
      { header: 'Defects',  render: (r) => <span className={r.defective_count > 0 ? 'text-red-400 font-semibold' : 'text-slate-500'}>{r.defective_count}</span> },
      { header: 'Created',  render: (r) => new Date(r.createdAt).toLocaleDateString() },
    ],
  },
  {
    key: 'quality',
    perm: PERMISSIONS.REPORT_QUALITY,
    label: 'Quality Control',
    icon: HiOutlineClipboardCheck,
    endpoint: '/reports/quality',
    itemsKey: 'items',
    summaryCards: [
      { label: 'Inspections',  key: 'totalInspections',   color: '#fff' },
      { label: 'Passed',       key: 'passed',             color: '#4ade80' },
      { label: 'Failed',       key: 'failed',             color: '#f87171' },
      { label: 'Pass Rate',    key: 'passRate',           color: '#818cf8' },
      { label: 'Defects Logged', key: 'totalDefectsLogged', color: '#fbbf24' },
    ],
    columns: [
      { header: 'Batch',     render: (r) => <span className="font-mono text-xs text-indigo-400">{r.batch_id?.batch_id || '—'}</span> },
      { header: 'Product',   render: (r) => r.batch_id?.product_name || '—' },
      { header: 'Result',    render: (r) => <span className={`status-badge status-${r.inspection_result.toLowerCase()}`}>{r.inspection_result}</span> },
      { header: 'Defects',   render: (r) => (r.defects?.length ? r.defects.join(', ') : <span className="text-slate-600">None</span>) },
      { header: 'Inspector', render: (r) => r.inspected_by?.name || '—' },
      { header: 'Date',      render: (r) => new Date(r.createdAt).toLocaleDateString() },
    ],
  },
];

// ------- Download helper ------------------------------------------------

// Triggers a browser download for the given blob + filename.
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// Pull the filename from a Content-Disposition header, fall back to default.
const filenameFromResponse = (response, fallback) => {
  const dispo = response.headers['content-disposition'] || '';
  const match = /filename="?([^"]+)"?/.exec(dispo);
  return match ? match[1] : fallback;
};

// ------- Component ------------------------------------------------------

const Reports = () => {
  const { hasPerm } = useAuth();

  // Only show reports the user is allowed to see.
  const availableReports = useMemo(
    () => REPORT_DEFS.filter((r) => hasPerm(r.perm)),
    [hasPerm]
  );

  const [activeKey, setActiveKey] = useState(() => availableReports[0]?.key || null);
  const [data, setData] = useState({});     // { [reportKey]: { summary, items } }
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null); // 'csv' | 'pdf' | null

  useEffect(() => {
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const results = await Promise.all(
          availableReports.map((r) =>
            API.get(r.endpoint).then((res) => [r.key, res.data]).catch((err) => {
              console.error(`Report ${r.key} fetch failed`, err);
              return [r.key, { summary: {}, items: [] }];
            })
          )
        );
        if (cancelled) return;
        setData(Object.fromEntries(results));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    return () => { cancelled = true; };
  }, [availableReports]);

  const activeReport = availableReports.find((r) => r.key === activeKey);
  const activeData = activeReport ? data[activeReport.key] : null;
  // Backends use different keys for the row list (items/orders). The config
  // declares which one to read so the component doesn't need to care.
  const rows = activeData ? (activeData[activeReport.itemsKey] || []) : [];

  const handleDownload = async (format) => {
    if (!activeReport) return;
    setDownloading(format);
    try {
      const response = await API.get(activeReport.endpoint, {
        params: { format },
        responseType: 'blob',
      });
      const fallback = `${activeReport.key}-report.${format}`;
      downloadBlob(response.data, filenameFromResponse(response, fallback));
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to download ${format.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  };

  // --- Render ------------------------------------------------------------

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  if (availableReports.length === 0) {
    return (
      <div className="animate-fade-in page-container">
        <div className="glass-card p-12 text-center">
          <HiOutlineChartBar className="text-4xl text-indigo-400 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No reports available for your role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in page-container">
      <div className="page-header">
        <div style={{ minWidth: 0 }}>
          <h1 className="flex items-center gap-2">
            <HiOutlineChartBar className="text-indigo-400" /> Reports &amp; Analytics
          </h1>
          <p className="subtitle">System-wide reports with CSV &amp; PDF export</p>
        </div>
        {activeReport && (
          <div className="actions">
            <button
              onClick={() => handleDownload('csv')}
              disabled={downloading !== null}
              className="btn-secondary"
              title="Download current report as CSV"
            >
              <HiOutlineDocumentDownload /> {downloading === 'csv' ? 'Preparing…' : 'CSV'}
            </button>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading !== null}
              className="btn-primary"
              title="Download current report as PDF"
            >
              <HiOutlineDocumentText /> {downloading === 'pdf' ? 'Preparing…' : 'PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Tab buttons */}
      <div className="flex flex-wrap gap-2">
        {availableReports.map((r) => {
          const Icon = r.icon;
          const isActive = r.key === activeKey;
          return (
            <button
              key={r.key}
              onClick={() => setActiveKey(r.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}
            >
              <Icon /> {r.label}
            </button>
          );
        })}
      </div>

      {/* Active report */}
      {activeReport && activeData && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            {activeReport.summaryCards.map((card) => {
              const raw = activeData.summary?.[card.key];
              const value = card.format ? card.format(raw) : (raw ?? 0);
              return (
                <div key={card.key} className="glass-card p-4 text-center">
                  <p className="text-xl font-bold" style={{ color: card.color }}>{value}</p>
                  <p className="text-xs text-slate-400">{card.label}</p>
                </div>
              );
            })}
          </div>

          <div className="glass-card p-6">
            <DataTable
              columns={activeReport.columns}
              data={rows}
              searchKey={activeReport.searchKey}
              emptyMessage={`No ${activeReport.label.toLowerCase()} data`}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;

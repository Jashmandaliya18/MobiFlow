/**
 * Reports Page
 * System reports for inventory and orders
 */
import { useState, useEffect } from 'react';
import API from '../api/axios';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineArchive, HiOutlineShoppingCart } from 'react-icons/hi';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventoryReport, setInventoryReport] = useState({ summary: {}, items: [] });
  const [orderReport, setOrderReport] = useState({ summary: {}, orders: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const [invRes, ordRes] = await Promise.all([
        API.get('/reports/inventory'),
        API.get('/reports/orders')
      ]);
      setInventoryReport(invRes.data);
      setOrderReport(ordRes.data);
    } catch (err) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const invColumns = [
    { header: 'Item', render: (item) => <span className="font-medium text-white">{item.item_name}</span> },
    { header: 'Quantity', render: (item) => item.quantity.toLocaleString() },
    { header: 'Location', accessor: 'location' },
    { header: 'Lot #', render: (item) => <span className="font-mono text-xs text-slate-400">{item.lot_number}</span> },
    { header: 'Status', render: (item) => (
      <span className={`status-badge status-${item.status.toLowerCase().replace(/\s/g, '-')}`}>{item.status}</span>
    )}
  ];

  const ordColumns = [
    { header: 'Product', render: (item) => <span className="font-medium text-white">{item.product_id?.item_name || 'N/A'}</span> },
    { header: 'Distributor', render: (item) => item.distributor_id?.name || 'N/A' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Status', render: (item) => (
      <span className={`status-badge status-${item.status.toLowerCase()}`}>{item.status}</span>
    )},
    { header: 'Date', render: (item) => new Date(item.order_date).toLocaleDateString() }
  ];

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <HiOutlineChartBar className="text-indigo-400" /> Reports & Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">System-wide reports and analytics</p>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'inventory'
              ? 'text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          style={activeTab === 'inventory' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}
        >
          <HiOutlineArchive /> Inventory Report
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'orders'
              ? 'text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          style={activeTab === 'orders' ? { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2))' } : {}}
        >
          <HiOutlineShoppingCart /> Order Report
        </button>
      </div>

      {/* Inventory Report */}
      {activeTab === 'inventory' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-white">{inventoryReport.summary.totalItems || 0}</p>
              <p className="text-xs text-slate-400">Total Items</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-indigo-400">{inventoryReport.summary.totalQuantity?.toLocaleString() || 0}</p>
              <p className="text-xs text-slate-400">Total Units</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-green-400">{inventoryReport.summary.inStock || 0}</p>
              <p className="text-xs text-slate-400">In Stock</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-amber-400">{inventoryReport.summary.low || 0}</p>
              <p className="text-xs text-slate-400">Low Stock</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-red-400">{inventoryReport.summary.outOfStock || 0}</p>
              <p className="text-xs text-slate-400">Out of Stock</p>
            </div>
          </div>
          <div className="glass-card p-6">
            <DataTable columns={invColumns} data={inventoryReport.items || []} searchKey="item_name" emptyMessage="No inventory data" />
          </div>
        </div>
      )}

      {/* Order Report */}
      {activeTab === 'orders' && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-white">{orderReport.summary.totalOrders || 0}</p>
              <p className="text-xs text-slate-400">Total Orders</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-amber-400">{orderReport.summary.pending || 0}</p>
              <p className="text-xs text-slate-400">Pending</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-blue-400">{orderReport.summary.approved || 0}</p>
              <p className="text-xs text-slate-400">Approved</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-purple-400">{orderReport.summary.dispatched || 0}</p>
              <p className="text-xs text-slate-400">Dispatched</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-xl font-bold text-green-400">{orderReport.summary.delivered || 0}</p>
              <p className="text-xs text-slate-400">Delivered</p>
            </div>
          </div>
          <div className="glass-card p-6">
            <DataTable columns={ordColumns} data={orderReport.orders || []} emptyMessage="No order data" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;

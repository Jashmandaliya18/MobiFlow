/**
 * Dashboard Controller
 * Aggregates KPIs and reports from all modules.
 *
 * Report endpoints (SRS §3.1.3, §3.1.5, §3.1.8) support three formats:
 *   - default JSON   (for the frontend Reports page)
 *   - ?format=csv    (CSV download)
 *   - ?format=pdf    (PDF download)
 * The same controller handles all three to keep aggregation logic in one place.
 */
const User = require('../models/User');
const RawMaterial = require('../models/RawMaterial');
const Manufacturing = require('../models/Manufacturing');
const QualityControl = require('../models/QualityControl');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Dispatch = require('../models/Dispatch');
const { writeCsv, writePdf, tsSuffix } = require('../utils/reportWriter');

// Shared helper — dispatches to the right writer based on ?format.
const sendReport = (req, res, { slug, title, subtitle, summaryMap, columns, rows }) => {
  const format = (req.query.format || 'json').toLowerCase();
  const filenameBase = `${slug}-${tsSuffix()}`;

  if (format === 'csv') {
    return writeCsv(res, {
      filename: `${filenameBase}.csv`,
      columns,
      rows,
    });
  }

  if (format === 'pdf') {
    return writePdf(res, {
      filename: `${filenameBase}.pdf`,
      title,
      subtitle,
      summary: Object.entries(summaryMap),
      columns,
      rows,
    });
  }

  // Default JSON response keeps the existing UI working unchanged.
  return res.json({ summary: summaryMap, items: rows });
};

/**
 * GET /dashboard
 * Main dashboard with KPIs across all modules
 */
exports.getDashboard = async (req, res) => {
  try {
    // Parallel aggregation for performance
    const [
      totalUsers,
      totalMaterials,
      lowStockMaterials,
      totalBatches,
      activeBatches,
      completedBatches,
      totalInspections,
      passedInspections,
      totalInventory,
      lowStockInventory,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalDispatches,
      inTransitDispatches
    ] = await Promise.all([
      User.countDocuments(),
      RawMaterial.countDocuments(),
      RawMaterial.countDocuments({ $expr: { $lte: ['$quantity', '$reorder_threshold'] } }),
      Manufacturing.countDocuments(),
      Manufacturing.countDocuments({ status: 'In Progress' }),
      Manufacturing.countDocuments({ status: 'Completed' }),
      QualityControl.countDocuments(),
      QualityControl.countDocuments({ inspection_result: 'Pass' }),
      Inventory.countDocuments(),
      Inventory.countDocuments({ status: { $in: ['Low', 'Out of Stock'] } }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'Pending' }),
      Order.countDocuments({ status: 'Delivered' }),
      Dispatch.countDocuments(),
      Dispatch.countDocuments({ delivery_status: 'In Transit' })
    ]);

    // Recent activity
    const recentOrders = await Order.find()
      .populate('distributor_id', 'name')
      .populate('product_id', 'item_name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentBatches = await Manufacturing.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      kpis: {
        users: totalUsers,
        rawMaterials: { total: totalMaterials, lowStock: lowStockMaterials },
        manufacturing: { total: totalBatches, active: activeBatches, completed: completedBatches },
        qualityControl: {
          total: totalInspections,
          passed: passedInspections,
          passRate: totalInspections ? ((passedInspections / totalInspections) * 100).toFixed(1) + '%' : '0%'
        },
        inventory: { total: totalInventory, lowStock: lowStockInventory },
        orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders },
        dispatch: { total: totalDispatches, inTransit: inTransitDispatches }
      },
      recentActivity: {
        orders: recentOrders,
        batches: recentBatches
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data.' });
  }
};

/**
 * GET /reports/inventory  (SRS §3.1.4)
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const items = await Inventory.find()
      .populate('linked_batch', 'batch_id product_name')
      .sort({ item_name: 1 });

    const summaryMap = {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      inStock: items.filter((i) => i.status === 'In Stock').length,
      low: items.filter((i) => i.status === 'Low').length,
      outOfStock: items.filter((i) => i.status === 'Out of Stock').length,
    };

    const columns = [
      { header: 'Item', accessor: (r) => r.item_name },
      { header: 'Quantity', accessor: (r) => r.quantity },
      { header: 'Location', accessor: (r) => r.location },
      { header: 'Lot', accessor: (r) => r.lot_number },
      { header: 'Batch', accessor: (r) => r.linked_batch?.batch_id || '' },
      { header: 'Status', accessor: (r) => r.status },
    ];

    // Backwards-compat: JSON response keeps the legacy `items` field name.
    if (!req.query.format || req.query.format === 'json') {
      return res.json({ summary: summaryMap, items });
    }

    return sendReport(req, res, {
      slug: 'inventory-report',
      title: 'Inventory Report',
      subtitle: `Generated ${new Date().toLocaleString()}`,
      summaryMap,
      columns,
      rows: items,
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ message: 'Server error generating inventory report.' });
  }
};

/**
 * GET /reports/orders  (SRS §3.1.5)
 */
exports.getOrderReport = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('distributor_id', 'name email')
      .populate('product_id', 'item_name')
      .sort({ createdAt: -1 });

    const summaryMap = {
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === 'Pending').length,
      approved: orders.filter((o) => o.status === 'Approved').length,
      dispatched: orders.filter((o) => o.status === 'Dispatched').length,
      delivered: orders.filter((o) => o.status === 'Delivered').length,
    };

    const columns = [
      { header: 'Order ID', accessor: (r) => r._id.toString().slice(-8) },
      { header: 'Product', accessor: (r) => r.product_id?.item_name || '' },
      { header: 'Distributor', accessor: (r) => r.distributor_id?.name || '' },
      { header: 'Quantity', accessor: (r) => r.quantity },
      { header: 'Status', accessor: (r) => r.status },
      { header: 'Date', accessor: (r) => new Date(r.order_date).toISOString().slice(0, 10) },
    ];

    if (!req.query.format || req.query.format === 'json') {
      return res.json({ summary: summaryMap, orders });
    }

    return sendReport(req, res, {
      slug: 'orders-report',
      title: 'Orders Report',
      subtitle: `Generated ${new Date().toLocaleString()}`,
      summaryMap,
      columns,
      rows: orders,
    });
  } catch (error) {
    console.error('Order report error:', error);
    res.status(500).json({ message: 'Server error generating order report.' });
  }
};

/**
 * GET /reports/raw-materials  (SRS §3.1.1)
 */
exports.getRawMaterialReport = async (req, res) => {
  try {
    const rows = await RawMaterial.find().sort({ material_name: 1 });

    const summaryMap = {
      totalMaterials: rows.length,
      totalUnits: rows.reduce((s, r) => s + r.quantity, 0),
      lowStock: rows.filter((r) => r.quantity <= r.reorder_threshold).length,
    };

    const columns = [
      { header: 'Material', accessor: (r) => r.material_name },
      { header: 'Type', accessor: (r) => r.material_type },
      { header: 'Supplier', accessor: (r) => r.supplier_name },
      { header: 'Quantity', accessor: (r) => r.quantity },
      { header: 'Reorder @', accessor: (r) => r.reorder_threshold },
      { header: 'Cost/unit', accessor: (r) => `$${Number(r.cost).toFixed(2)}` },
      { header: 'Location', accessor: (r) => r.storage_location },
    ];

    if (!req.query.format || req.query.format === 'json') {
      return res.json({ summary: summaryMap, items: rows });
    }

    return sendReport(req, res, {
      slug: 'raw-materials-report',
      title: 'Raw Materials Report',
      subtitle: `Generated ${new Date().toLocaleString()}`,
      summaryMap,
      columns,
      rows,
    });
  } catch (error) {
    console.error('Raw material report error:', error);
    res.status(500).json({ message: 'Server error generating raw material report.' });
  }
};

/**
 * GET /reports/manufacturing  (SRS §3.1.2)
 */
exports.getManufacturingReport = async (req, res) => {
  try {
    const rows = await Manufacturing.find()
      .populate('materials_used.material', 'material_name')
      .sort({ createdAt: -1 });

    const summaryMap = {
      totalBatches: rows.length,
      inProgress: rows.filter((r) => r.status === 'In Progress').length,
      completed: rows.filter((r) => r.status === 'Completed').length,
      onHold: rows.filter((r) => r.status === 'On Hold').length,
      totalDefects: rows.reduce((s, r) => s + (r.defective_count || 0), 0),
    };

    const columns = [
      { header: 'Batch ID', accessor: (r) => r.batch_id },
      { header: 'Product', accessor: (r) => r.product_name },
      { header: 'Quantity', accessor: (r) => r.quantity },
      { header: 'Stage', accessor: (r) => r.stage },
      { header: 'Status', accessor: (r) => r.status },
      { header: 'Defects', accessor: (r) => r.defective_count },
      { header: 'Created', accessor: (r) => new Date(r.createdAt).toISOString().slice(0, 10) },
    ];

    if (!req.query.format || req.query.format === 'json') {
      return res.json({ summary: summaryMap, items: rows });
    }

    return sendReport(req, res, {
      slug: 'manufacturing-report',
      title: 'Manufacturing Report',
      subtitle: `Generated ${new Date().toLocaleString()}`,
      summaryMap,
      columns,
      rows,
    });
  } catch (error) {
    console.error('Manufacturing report error:', error);
    res.status(500).json({ message: 'Server error generating manufacturing report.' });
  }
};

/**
 * GET /reports/quality  (SRS §3.1.3)
 */
exports.getQualityReport = async (req, res) => {
  try {
    const rows = await QualityControl.find()
      .populate('batch_id', 'batch_id product_name')
      .populate('inspected_by', 'name')
      .sort({ createdAt: -1 });

    const passed = rows.filter((r) => r.inspection_result === 'Pass').length;
    const summaryMap = {
      totalInspections: rows.length,
      passed,
      failed: rows.length - passed,
      passRate: rows.length ? `${((passed / rows.length) * 100).toFixed(1)}%` : '0%',
      totalDefectsLogged: rows.reduce((s, r) => s + (r.defects?.length || 0), 0),
    };

    const columns = [
      { header: 'Batch', accessor: (r) => r.batch_id?.batch_id || '' },
      { header: 'Product', accessor: (r) => r.batch_id?.product_name || '' },
      { header: 'Result', accessor: (r) => r.inspection_result },
      { header: 'Defects', accessor: (r) => (r.defects || []).join('; ') },
      { header: 'Inspector', accessor: (r) => r.inspected_by?.name || '' },
      { header: 'Remarks', accessor: (r) => r.remarks || '' },
      { header: 'Date', accessor: (r) => new Date(r.createdAt).toISOString().slice(0, 10) },
    ];

    if (!req.query.format || req.query.format === 'json') {
      return res.json({ summary: summaryMap, items: rows });
    }

    return sendReport(req, res, {
      slug: 'quality-report',
      title: 'Quality Control Report',
      subtitle: `Generated ${new Date().toLocaleString()}`,
      summaryMap,
      columns,
      rows,
    });
  } catch (error) {
    console.error('Quality report error:', error);
    res.status(500).json({ message: 'Server error generating quality report.' });
  }
};

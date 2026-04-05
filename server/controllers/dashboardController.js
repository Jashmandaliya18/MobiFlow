/**
 * Dashboard Controller
 * Aggregates KPIs and reports from all modules
 */
const User = require('../models/User');
const RawMaterial = require('../models/RawMaterial');
const Manufacturing = require('../models/Manufacturing');
const QualityControl = require('../models/QualityControl');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Dispatch = require('../models/Dispatch');

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
 * GET /reports/inventory
 * Detailed inventory report
 */
exports.getInventoryReport = async (req, res) => {
  try {
    const items = await Inventory.find()
      .populate('linked_batch', 'batch_id product_name')
      .sort({ item_name: 1 });

    const summary = {
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      inStock: items.filter(i => i.status === 'In Stock').length,
      low: items.filter(i => i.status === 'Low').length,
      outOfStock: items.filter(i => i.status === 'Out of Stock').length
    };

    res.json({ summary, items });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ message: 'Server error generating inventory report.' });
  }
};

/**
 * GET /reports/orders
 * Detailed order report
 */
exports.getOrderReport = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('distributor_id', 'name email')
      .populate('product_id', 'item_name')
      .sort({ createdAt: -1 });

    const summary = {
      totalOrders: orders.length,
      pending: orders.filter(o => o.status === 'Pending').length,
      approved: orders.filter(o => o.status === 'Approved').length,
      dispatched: orders.filter(o => o.status === 'Dispatched').length,
      delivered: orders.filter(o => o.status === 'Delivered').length
    };

    res.json({ summary, orders });
  } catch (error) {
    console.error('Order report error:', error);
    res.status(500).json({ message: 'Server error generating order report.' });
  }
};

/**
 * Order Controller
 * Manages distributor orders with inventory integration
 * Integration: Placing an approved order reduces inventory stock
 */
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const { orderSchema, orderUpdateSchema } = require('../validators/validators');
const { PERMISSIONS, userHasPermission } = require('../config/permissions');

/**
 * POST /order/place
 * Place a new order (distributor)
 * Integration: Checks inventory availability
 */
exports.placeOrder = async (req, res) => {
  try {
    const { error, value } = orderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Verify inventory item exists and has stock
    const inventoryItem = await Inventory.findById(value.product_id);
    if (!inventoryItem) {
      return res.status(404).json({ message: 'Product not found in inventory.' });
    }

    if (inventoryItem.quantity < value.quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${inventoryItem.quantity}, Requested: ${value.quantity}`
      });
    }

    // Create the order with the distributor's user ID
    const order = await Order.create({
      ...value,
      distributor_id: req.user._id
    });

    await order.populate(['distributor_id', 'product_id']);

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({ message: 'Server error placing order.' });
  }
};

/**
 * PUT /order/update/:id
 * Update order status
 * Integration: When approved, deducts inventory; status flow enforced
 */
exports.updateOrder = async (req, res) => {
  try {
    const { error, value } = orderUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Enforce status flow: Pending → Approved → Dispatched → Delivered
    const statusFlow = ['Pending', 'Approved', 'Dispatched', 'Delivered'];
    const currentIdx = statusFlow.indexOf(order.status);
    const newIdx = statusFlow.indexOf(value.status);

    if (newIdx <= currentIdx) {
      return res.status(400).json({
        message: `Cannot change status from ${order.status} to ${value.status}. Status can only move forward.`
      });
    }

    // Integration: When order is approved, deduct from inventory
    if (value.status === 'Approved' && order.status === 'Pending') {
      const inventoryItem = await Inventory.findById(order.product_id);
      if (!inventoryItem || inventoryItem.quantity < order.quantity) {
        return res.status(400).json({ message: 'Insufficient inventory to approve this order.' });
      }

      inventoryItem.quantity -= order.quantity;
      await inventoryItem.save(); // Triggers status recalculation
    }

    order.status = value.status;
    await order.save();
    await order.populate(['distributor_id', 'product_id']);

    res.json({ message: 'Order status updated successfully', order });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error updating order.' });
  }
};

/**
 * GET /order/:id
 * Get a specific order
 */
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('distributor_id', 'name email')
      .populate('product_id', 'item_name quantity location');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // SRS §3.1.5: distributors see only their own orders unless they also
    // hold order:view_all (granted via override).
    const canViewAll = userHasPermission(req.user, PERMISSIONS.ORDER_VIEW_ALL);
    if (!canViewAll) {
      const ownerId = order.distributor_id?._id?.toString() || order.distributor_id?.toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You can only view your own orders.' });
      }
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error fetching order.' });
  }
};

/**
 * GET /order/history/:distributorId
 * Get order history for a specific distributor
 */
exports.getOrderHistory = async (req, res) => {
  try {
    // SRS §3.1.5: distributors may only view their own history; staff with
    // order:view_all may view any distributor's history.
    const canViewAll = userHasPermission(req.user, PERMISSIONS.ORDER_VIEW_ALL);
    if (!canViewAll && req.params.distributorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view your own order history.' });
    }

    const orders = await Order.find({ distributor_id: req.params.distributorId })
      .populate('product_id', 'item_name quantity location')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: 'Server error fetching order history.' });
  }
};

/**
 * GET /order/all
 * Get all orders (admin/employee)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('distributor_id', 'name email')
      .populate('product_id', 'item_name quantity location')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
};

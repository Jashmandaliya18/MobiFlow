/**
 * Dispatch Controller
 * Manages shipment scheduling, tracking, and delivery
 * Integration: Updates order status when dispatch status changes
 */
const Dispatch = require('../models/Dispatch');
const Order = require('../models/Order');
const { dispatchSchema, dispatchUpdateSchema } = require('../validators/validators');

/**
 * POST /dispatch/create
 * Create a dispatch record for an order
 * Integration: Sets order status to 'Dispatched'
 */
exports.createDispatch = async (req, res) => {
  try {
    const { error, value } = dispatchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Verify order exists and is approved
    const order = await Order.findById(value.order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.status !== 'Approved') {
      return res.status(400).json({
        message: `Order must be in 'Approved' status to dispatch. Current status: ${order.status}`
      });
    }

    // Check if dispatch already exists for this order
    const existingDispatch = await Dispatch.findOne({ order_id: value.order_id });
    if (existingDispatch) {
      return res.status(400).json({ message: 'Dispatch record already exists for this order.' });
    }

    const dispatch = await Dispatch.create(value);

    // Integration: Update order status to Dispatched
    order.status = 'Dispatched';
    await order.save();

    await dispatch.populate('order_id');

    res.status(201).json({ message: 'Dispatch created successfully', dispatch });
  } catch (error) {
    console.error('Create dispatch error:', error);
    res.status(500).json({ message: 'Server error creating dispatch.' });
  }
};

/**
 * PUT /dispatch/update/:id
 * Update dispatch delivery status
 * Integration: When delivered, updates order status to 'Delivered'
 */
exports.updateDispatch = async (req, res) => {
  try {
    const { error, value } = dispatchUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const dispatch = await Dispatch.findById(req.params.id);
    if (!dispatch) {
      return res.status(404).json({ message: 'Dispatch record not found.' });
    }

    dispatch.delivery_status = value.delivery_status;
    await dispatch.save();

    // Integration: When delivered, update order status
    if (value.delivery_status === 'Delivered') {
      await Order.findByIdAndUpdate(dispatch.order_id, { status: 'Delivered' });
    }

    await dispatch.populate('order_id');

    res.json({ message: 'Dispatch updated successfully', dispatch });
  } catch (error) {
    console.error('Update dispatch error:', error);
    res.status(500).json({ message: 'Server error updating dispatch.' });
  }
};

/**
 * GET /dispatch/all
 * Get all dispatch records
 */
exports.getAllDispatches = async (req, res) => {
  try {
    const dispatches = await Dispatch.find()
      .populate({
        path: 'order_id',
        populate: [
          { path: 'distributor_id', select: 'name email' },
          { path: 'product_id', select: 'item_name' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json(dispatches);
  } catch (error) {
    console.error('Get dispatches error:', error);
    res.status(500).json({ message: 'Server error fetching dispatches.' });
  }
};

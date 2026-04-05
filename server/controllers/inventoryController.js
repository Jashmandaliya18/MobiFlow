/**
 * Inventory Controller
 * Manages warehouse inventory with stock tracking and low stock alerts
 */
const Inventory = require('../models/Inventory');
const { inventorySchema, inventoryUpdateSchema } = require('../validators/validators');

/**
 * POST /inventory/add
 * Add a new inventory item
 */
exports.addItem = async (req, res) => {
  try {
    const { error, value } = inventorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const item = await Inventory.create(value);
    res.status(201).json({ message: 'Inventory item added successfully', item });
  } catch (error) {
    console.error('Add inventory error:', error);
    res.status(500).json({ message: 'Server error adding inventory item.' });
  }
};

/**
 * PUT /inventory/update/:id
 * Update inventory item
 */
exports.updateItem = async (req, res) => {
  try {
    const { error, value } = inventoryUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found.' });
    }

    Object.assign(item, value);
    await item.save(); // Triggers pre-save hook for status calculation

    res.json({ message: 'Inventory updated successfully', item });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ message: 'Server error updating inventory.' });
  }
};

/**
 * GET /inventory/all
 * Get all inventory items
 */
exports.getAllItems = async (req, res) => {
  try {
    const items = await Inventory.find()
      .populate('linked_batch', 'batch_id product_name')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Server error fetching inventory.' });
  }
};

/**
 * GET /inventory/low-stock
 * Get items with low or out of stock status
 */
exports.getLowStock = async (req, res) => {
  try {
    const items = await Inventory.find({
      status: { $in: ['Low', 'Out of Stock'] }
    }).sort({ quantity: 1 });

    res.json({ count: items.length, items });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Server error fetching low stock items.' });
  }
};

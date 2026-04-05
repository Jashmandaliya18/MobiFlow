/**
 * Manufacturing Controller
 * Manages production batches with BOM logic and stage progression
 * Integration: Deducts raw materials on batch creation, adds to inventory on completion
 */
const Manufacturing = require('../models/Manufacturing');
const RawMaterial = require('../models/RawMaterial');
const Inventory = require('../models/Inventory');
const { manufacturingSchema, manufacturingUpdateSchema } = require('../validators/validators');

/**
 * POST /manufacturing/create
 * Create a new production batch (deducts raw materials via BOM)
 */
exports.createBatch = async (req, res) => {
  try {
    const { error, value } = manufacturingSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // BOM Logic: Deduct raw materials
    if (value.materials_used && value.materials_used.length > 0) {
      for (const item of value.materials_used) {
        const material = await RawMaterial.findById(item.material);
        if (!material) {
          return res.status(404).json({ message: `Raw material ${item.material} not found.` });
        }
        if (material.quantity < item.quantity_used) {
          return res.status(400).json({
            message: `Insufficient stock for ${material.material_name}. Available: ${material.quantity}, Requested: ${item.quantity_used}`
          });
        }
      }

      // Deduct quantities after validation
      for (const item of value.materials_used) {
        await RawMaterial.findByIdAndUpdate(item.material, {
          $inc: { quantity: -item.quantity_used }
        });
      }
    }

    const batch = await Manufacturing.create(value);
    await batch.populate('materials_used.material');

    res.status(201).json({ message: 'Batch created successfully', batch });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ message: 'Server error creating batch.' });
  }
};

/**
 * PUT /manufacturing/update/:id
 * Update batch stage/status. On completion, adds finished goods to inventory.
 */
exports.updateBatch = async (req, res) => {
  try {
    const { error, value } = manufacturingUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const batch = await Manufacturing.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found.' });
    }

    // Update fields
    Object.assign(batch, value);

    // Integration: When batch is completed, add to inventory
    if (value.stage === 'Completed' || value.status === 'Completed') {
      batch.stage = 'Completed';
      batch.status = 'Completed';

      const goodQuantity = batch.quantity - batch.defective_count;
      if (goodQuantity > 0) {
        // Check if inventory item already exists for this batch
        const existingInventory = await Inventory.findOne({ linked_batch: batch._id });
        if (!existingInventory) {
          await Inventory.create({
            item_name: batch.product_name,
            quantity: goodQuantity,
            location: 'Warehouse A',
            lot_number: batch.batch_id,
            linked_batch: batch._id
          });
        }
      }
    }

    await batch.save();
    await batch.populate('materials_used.material');

    res.json({ message: 'Batch updated successfully', batch });
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ message: 'Server error updating batch.' });
  }
};

/**
 * GET /manufacturing/all
 * Get all production batches
 */
exports.getAllBatches = async (req, res) => {
  try {
    const batches = await Manufacturing.find()
      .populate('materials_used.material')
      .sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ message: 'Server error fetching batches.' });
  }
};

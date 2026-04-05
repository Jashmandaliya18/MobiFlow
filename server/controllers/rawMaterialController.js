/**
 * Raw Material Controller
 * Manages raw materials: add, update, list, and low stock alerts
 */
const RawMaterial = require('../models/RawMaterial');
const { rawMaterialSchema, rawMaterialUpdateSchema } = require('../validators/validators');

/**
 * POST /raw/add
 * Add a new raw material
 */
exports.addMaterial = async (req, res) => {
  try {
    const { error, value } = rawMaterialSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check for duplicate material name
    const existing = await RawMaterial.findOne({ material_name: value.material_name });
    if (existing) {
      return res.status(400).json({ message: 'Material with this name already exists.' });
    }

    const material = await RawMaterial.create(value);
    res.status(201).json({ message: 'Material added successfully', material });
  } catch (error) {
    console.error('Add material error:', error);
    res.status(500).json({ message: 'Server error adding material.' });
  }
};

/**
 * PUT /raw/update/:id
 * Update raw material details or stock
 */
exports.updateMaterial = async (req, res) => {
  try {
    const { error, value } = rawMaterialUpdateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const material = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({ message: 'Material not found.' });
    }

    res.json({ message: 'Material updated successfully', material });
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ message: 'Server error updating material.' });
  }
};

/**
 * GET /raw/all
 * Get all raw materials
 */
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await RawMaterial.find().sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ message: 'Server error fetching materials.' });
  }
};

/**
 * GET /raw/low-stock
 * Get materials below reorder threshold
 */
exports.getLowStock = async (req, res) => {
  try {
    const materials = await RawMaterial.find({
      $expr: { $lte: ['$quantity', '$reorder_threshold'] }
    }).sort({ quantity: 1 });

    res.json({
      count: materials.length,
      materials
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ message: 'Server error fetching low stock materials.' });
  }
};

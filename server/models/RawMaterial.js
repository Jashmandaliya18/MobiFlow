/**
 * Raw Material Model
 * Tracks raw materials, suppliers, and stock levels
 */
const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  material_name: {
    type: String,
    required: [true, 'Material name is required'],
    trim: true,
    unique: true
  },
  material_type: {
    type: String,
    required: [true, 'Material type is required'],
    trim: true
  },
  supplier_name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0,
    default: 0
  },
  cost: {
    type: Number,
    required: [true, 'Cost is required'],
    min: 0
  },
  reorder_threshold: {
    type: Number,
    required: true,
    min: 0,
    default: 50
  },
  storage_location: {
    type: String,
    required: [true, 'Storage location is required'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);

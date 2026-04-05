/**
 * Inventory Model
 * Tracks finished goods in warehouse with stock status
 */
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  item_name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0,
    default: 0
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  lot_number: {
    type: String,
    required: [true, 'Lot number is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['In Stock', 'Low', 'Out of Stock'],
    default: 'In Stock'
  },
  linked_batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturing'
  }
}, {
  timestamps: true
});

// Auto-update status based on quantity
inventorySchema.pre('save', function(next) {
  if (this.quantity === 0) {
    this.status = 'Out of Stock';
  } else if (this.quantity <= 20) {
    this.status = 'Low';
  } else {
    this.status = 'In Stock';
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);

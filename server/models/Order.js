/**
 * Order Model
 * Tracks distributor orders with status lifecycle:
 * Pending → Approved → Dispatched → Delivered
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  distributor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Distributor ID is required']
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Dispatched', 'Delivered'],
    default: 'Pending'
  },
  order_date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);

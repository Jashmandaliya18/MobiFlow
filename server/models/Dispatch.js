/**
 * Dispatch Model
 * Tracks shipment and delivery for orders
 */
const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required']
  },
  dispatch_date: {
    type: Date,
    default: Date.now
  },
  delivery_status: {
    type: String,
    enum: ['Pending', 'In Transit', 'Delivered'],
    default: 'Pending'
  },
  tracking_id: {
    type: String,
    required: [true, 'Tracking ID is required'],
    trim: true
  },
  carrier: {
    type: String,
    required: [true, 'Carrier name is required'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dispatch', dispatchSchema);

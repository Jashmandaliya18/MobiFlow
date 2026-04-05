/**
 * Quality Control Model
 * Records inspection results for manufacturing batches
 */
const mongoose = require('mongoose');

const qualityControlSchema = new mongoose.Schema({
  batch_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturing',
    required: [true, 'Batch ID is required']
  },
  inspection_result: {
    type: String,
    enum: ['Pass', 'Fail'],
    required: [true, 'Inspection result is required']
  },
  defects: [{
    type: String,
    trim: true
  }],
  remarks: {
    type: String,
    trim: true,
    default: ''
  },
  inspected_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('QualityControl', qualityControlSchema);

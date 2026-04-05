/**
 * Manufacturing Model
 * Tracks production batches through Assembly → Testing → Packaging stages
 */
const mongoose = require('mongoose');

const manufacturingSchema = new mongoose.Schema({
  batch_id: {
    type: String,
    required: true,
    unique: true
  },
  product_name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 1
  },
  stage: {
    type: String,
    enum: ['Assembly', 'Testing', 'Packaging', 'Completed'],
    default: 'Assembly'
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'On Hold'],
    default: 'In Progress'
  },
  defective_count: {
    type: Number,
    default: 0,
    min: 0
  },
  materials_used: [{
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial'
    },
    quantity_used: {
      type: Number,
      min: 0
    }
  }]
}, {
  timestamps: true
});

// Auto-generate batch_id before validation
manufacturingSchema.pre('validate', async function(next) {
  if (!this.batch_id) {
    const count = await mongoose.model('Manufacturing').countDocuments();
    this.batch_id = `BATCH-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Manufacturing', manufacturingSchema);

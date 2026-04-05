/**
 * Joi Validation Schemas
 * Centralized input validation for all API endpoints
 */
const Joi = require('joi');

// --- Auth Validators ---
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required'
  }),
  role: Joi.string().valid('admin', 'employee', 'distributor').default('employee')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// --- Raw Material Validators ---
const rawMaterialSchema = Joi.object({
  material_name: Joi.string().required().messages({ 'any.required': 'Material name is required' }),
  material_type: Joi.string().required(),
  supplier_name: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  cost: Joi.number().min(0).required(),
  reorder_threshold: Joi.number().min(0).default(50),
  storage_location: Joi.string().required()
});

const rawMaterialUpdateSchema = Joi.object({
  material_name: Joi.string(),
  material_type: Joi.string(),
  supplier_name: Joi.string(),
  quantity: Joi.number().min(0),
  cost: Joi.number().min(0),
  reorder_threshold: Joi.number().min(0),
  storage_location: Joi.string()
}).min(1);

// --- Manufacturing Validators ---
const manufacturingSchema = Joi.object({
  product_name: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  materials_used: Joi.array().items(
    Joi.object({
      material: Joi.string().required(), // ObjectId as string
      quantity_used: Joi.number().min(0).required()
    })
  ).default([])
});

const manufacturingUpdateSchema = Joi.object({
  stage: Joi.string().valid('Assembly', 'Testing', 'Packaging', 'Completed'),
  status: Joi.string().valid('In Progress', 'Completed', 'On Hold'),
  defective_count: Joi.number().min(0)
}).min(1);

// --- Quality Control Validators ---
const qcSchema = Joi.object({
  batch_id: Joi.string().required(),
  inspection_result: Joi.string().valid('Pass', 'Fail').required(),
  defects: Joi.array().items(Joi.string()).default([]),
  remarks: Joi.string().allow('').default('')
});

// --- Inventory Validators ---
const inventorySchema = Joi.object({
  item_name: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  location: Joi.string().required(),
  lot_number: Joi.string().required(),
  linked_batch: Joi.string().allow(null, '')
});

const inventoryUpdateSchema = Joi.object({
  item_name: Joi.string(),
  quantity: Joi.number().min(0),
  location: Joi.string(),
  lot_number: Joi.string(),
  status: Joi.string().valid('In Stock', 'Low', 'Out of Stock')
}).min(1);

// --- Order Validators ---
const orderSchema = Joi.object({
  product_id: Joi.string().required(),
  quantity: Joi.number().min(1).required()
});

const orderUpdateSchema = Joi.object({
  status: Joi.string().valid('Pending', 'Approved', 'Dispatched', 'Delivered').required()
});

// --- Dispatch Validators ---
const dispatchSchema = Joi.object({
  order_id: Joi.string().required(),
  carrier: Joi.string().required(),
  tracking_id: Joi.string().required()
});

const dispatchUpdateSchema = Joi.object({
  delivery_status: Joi.string().valid('Pending', 'In Transit', 'Delivered').required()
});

module.exports = {
  registerSchema,
  loginSchema,
  rawMaterialSchema,
  rawMaterialUpdateSchema,
  manufacturingSchema,
  manufacturingUpdateSchema,
  qcSchema,
  inventorySchema,
  inventoryUpdateSchema,
  orderSchema,
  orderUpdateSchema,
  dispatchSchema,
  dispatchUpdateSchema
};

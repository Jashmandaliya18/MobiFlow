/**
 * Joi Validation Schemas
 * Centralized input validation for all API endpoints
 */
const Joi = require('joi');

// --- Auth Validators ---
// SRS §4.1.1: min 12 chars, upper + lower + digit + special.
// Legacy seed users use shorter passwords, so the policy is only enforced
// on /register + /update; login continues to accept existing hashes.
const STRONG_PASSWORD = Joi.string()
  .min(12)
  .pattern(/[A-Z]/, 'uppercase letter')
  .pattern(/[a-z]/, 'lowercase letter')
  .pattern(/\d/, 'digit')
  .pattern(/[^A-Za-z0-9]/, 'special character')
  .required()
  .messages({
    'string.min': 'Password must be at least 12 characters',
    'string.pattern.name': 'Password must include an {#name}',
    'any.required': 'Password is required'
  });

const ROLE_VALUES = ['admin', 'procurement', 'warehouse', 'production', 'qa', 'dispatch', 'distributor', 'employee'];

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email',
    'any.required': 'Email is required'
  }),
  password: STRONG_PASSWORD,
  role: Joi.string().valid(...ROLE_VALUES).default('employee')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateRoleSchema = Joi.object({
  userId: Joi.string().required(),
  role: Joi.string().valid(...ROLE_VALUES).required()
});

const updatePermissionsSchema = Joi.object({
  userId: Joi.string().required(),
  permissions_granted: Joi.array().items(Joi.string()).default([]),
  permissions_revoked: Joi.array().items(Joi.string()).default([])
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
  updateRoleSchema,
  updatePermissionsSchema,
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

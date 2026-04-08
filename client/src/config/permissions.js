/**
 * Client-side mirror of server/config/permissions.js.
 * Keys MUST stay in sync with the backend catalog — this file is import-only
 * for the UI; authorization is still enforced server-side.
 */
export const PERMISSIONS = {
  // Raw Material
  RAW_ADD: 'raw:add',
  RAW_UPDATE: 'raw:update',
  RAW_VIEW: 'raw:view',
  RAW_LOW_STOCK: 'raw:low_stock',

  // Manufacturing
  MFG_CREATE: 'manufacturing:create',
  MFG_UPDATE: 'manufacturing:update',
  MFG_VIEW: 'manufacturing:view',

  // Quality Control
  QC_ADD: 'qc:add',
  QC_VIEW: 'qc:view',

  // Inventory
  INV_ADD: 'inventory:add',
  INV_UPDATE: 'inventory:update',
  INV_VIEW: 'inventory:view',
  INV_LOW_STOCK: 'inventory:low_stock',

  // Orders
  ORDER_PLACE: 'order:place',
  ORDER_UPDATE: 'order:update',
  ORDER_VIEW_ALL: 'order:view_all',
  ORDER_VIEW_OWN: 'order:view_own',

  // Dispatch
  DISPATCH_CREATE: 'dispatch:create',
  DISPATCH_UPDATE: 'dispatch:update',
  DISPATCH_VIEW: 'dispatch:view',

  // User management
  USER_VIEW: 'user:view',
  USER_MANAGE_ROLE: 'user:manage_role',
  USER_MANAGE_PERMS: 'user:manage_perms',

  // Reporting
  DASHBOARD_VIEW: 'dashboard:view',
  REPORT_INVENTORY: 'report:inventory',
  REPORT_ORDERS: 'report:orders',
  REPORT_RAW: 'report:raw',
  REPORT_MANUFACTURING: 'report:manufacturing',
  REPORT_QUALITY: 'report:quality'
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  procurement: 'Procurement',
  warehouse: 'Warehouse',
  production: 'Production',
  qa: 'Quality Assurance',
  dispatch: 'Dispatch',
  distributor: 'Distributor',
  employee: 'Employee (legacy)'
};

export const ROLES = Object.keys(ROLE_LABELS);

/**
 * Permissions Catalog (SRS §3.1.7, §4.1.2)
 *
 * Single source of truth for the RBAC model. Each module has a list of
 * permission keys; each role maps to the permissions granted by default.
 *
 * Route files import PERMISSIONS.<key>, never hard-coded strings.
 * Per-user overrides (User.permissions_granted / permissions_revoked) layer
 * on top of the role defaults to satisfy SRS §4.1.2 "fine-grained permissions".
 */

const PERMISSIONS = {
  // Raw Material Management (SRS §3.1.1)
  RAW_ADD: 'raw:add',
  RAW_UPDATE: 'raw:update',
  RAW_VIEW: 'raw:view',
  RAW_LOW_STOCK: 'raw:low_stock',

  // Manufacturing & Assembly (SRS §3.1.2)
  MFG_CREATE: 'manufacturing:create',
  MFG_UPDATE: 'manufacturing:update',
  MFG_VIEW: 'manufacturing:view',

  // Quality Control (SRS §3.1.3)
  QC_ADD: 'qc:add',
  QC_VIEW: 'qc:view',

  // Inventory & Warehouse (SRS §3.1.4)
  INV_ADD: 'inventory:add',
  INV_UPDATE: 'inventory:update',
  INV_VIEW: 'inventory:view',
  INV_LOW_STOCK: 'inventory:low_stock',

  // Distributor & Order Management (SRS §3.1.5)
  ORDER_PLACE: 'order:place',
  ORDER_UPDATE: 'order:update',
  ORDER_VIEW_ALL: 'order:view_all',
  ORDER_VIEW_OWN: 'order:view_own',

  // Distribution & Dispatch (SRS §3.1.6)
  DISPATCH_CREATE: 'dispatch:create',
  DISPATCH_UPDATE: 'dispatch:update',
  DISPATCH_VIEW: 'dispatch:view',

  // User & Role Management (SRS §3.1.7)
  USER_VIEW: 'user:view',
  USER_MANAGE_ROLE: 'user:manage_role',
  USER_MANAGE_PERMS: 'user:manage_perms',

  // Reporting & Administrative Monitoring (SRS §3.1.8)
  DASHBOARD_VIEW: 'dashboard:view',
  REPORT_INVENTORY: 'report:inventory',
  REPORT_ORDERS: 'report:orders',
  REPORT_RAW: 'report:raw',
  REPORT_MANUFACTURING: 'report:manufacturing',
  REPORT_QUALITY: 'report:quality'
};

const ALL_PERMS = Object.values(PERMISSIONS);

// Default role → permission mapping. Least-privilege per SRS §4.1.2.
// Rule of thumb: if a role can view a resource, it can also see that
// resource's low-stock alert. Keeping these bundled prevents the frontend
// from having to conditionally skip requests on every page it loads.
const ROLE_PERMISSIONS = {
  admin: ALL_PERMS,

  procurement: [
    PERMISSIONS.RAW_ADD,
    PERMISSIONS.RAW_UPDATE,
    PERMISSIONS.RAW_VIEW,
    PERMISSIONS.RAW_LOW_STOCK,
    PERMISSIONS.INV_VIEW,
    PERMISSIONS.INV_LOW_STOCK,
    PERMISSIONS.REPORT_RAW,
    PERMISSIONS.REPORT_INVENTORY,
    PERMISSIONS.DASHBOARD_VIEW
  ],

  warehouse: [
    PERMISSIONS.RAW_VIEW,
    PERMISSIONS.RAW_LOW_STOCK,
    PERMISSIONS.INV_ADD,
    PERMISSIONS.INV_UPDATE,
    PERMISSIONS.INV_VIEW,
    PERMISSIONS.INV_LOW_STOCK,
    PERMISSIONS.REPORT_INVENTORY,
    PERMISSIONS.REPORT_RAW,
    PERMISSIONS.DASHBOARD_VIEW
  ],

  production: [
    PERMISSIONS.RAW_VIEW,
    PERMISSIONS.RAW_LOW_STOCK,
    PERMISSIONS.MFG_CREATE,
    PERMISSIONS.MFG_UPDATE,
    PERMISSIONS.MFG_VIEW,
    PERMISSIONS.INV_VIEW,
    PERMISSIONS.INV_LOW_STOCK,
    PERMISSIONS.REPORT_MANUFACTURING,
    PERMISSIONS.REPORT_RAW,
    PERMISSIONS.DASHBOARD_VIEW
  ],

  qa: [
    PERMISSIONS.RAW_VIEW,       // see materials that went into a batch
    PERMISSIONS.RAW_LOW_STOCK,
    PERMISSIONS.MFG_VIEW,
    PERMISSIONS.QC_ADD,
    PERMISSIONS.QC_VIEW,
    PERMISSIONS.INV_VIEW,
    PERMISSIONS.INV_LOW_STOCK,
    PERMISSIONS.REPORT_QUALITY,
    PERMISSIONS.REPORT_MANUFACTURING,
    PERMISSIONS.DASHBOARD_VIEW
  ],

  dispatch: [
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.DISPATCH_CREATE,
    PERMISSIONS.DISPATCH_UPDATE,
    PERMISSIONS.DISPATCH_VIEW,
    PERMISSIONS.INV_VIEW,
    PERMISSIONS.INV_LOW_STOCK,
    PERMISSIONS.REPORT_ORDERS,
    PERMISSIONS.DASHBOARD_VIEW
  ],

  distributor: [
    PERMISSIONS.ORDER_PLACE,
    PERMISSIONS.ORDER_VIEW_OWN,
    PERMISSIONS.INV_VIEW,
    PERMISSIONS.INV_LOW_STOCK,
    PERMISSIONS.DASHBOARD_VIEW
  ],

  // Legacy generic operator role (pre-RBAC seed data). Combines the shop-floor
  // roles so older fixtures keep working without a migration.
  employee: [
    PERMISSIONS.RAW_VIEW,
    PERMISSIONS.RAW_LOW_STOCK,
    PERMISSIONS.MFG_CREATE,
    PERMISSIONS.MFG_UPDATE,
    PERMISSIONS.MFG_VIEW,
    PERMISSIONS.QC_ADD,
    PERMISSIONS.QC_VIEW,
    PERMISSIONS.INV_ADD,
    PERMISSIONS.INV_UPDATE,
    PERMISSIONS.INV_VIEW,
    PERMISSIONS.INV_LOW_STOCK,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_VIEW_ALL,
    PERMISSIONS.DISPATCH_CREATE,
    PERMISSIONS.DISPATCH_UPDATE,
    PERMISSIONS.DISPATCH_VIEW,
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.REPORT_INVENTORY,
    PERMISSIONS.REPORT_ORDERS,
    PERMISSIONS.REPORT_RAW,
    PERMISSIONS.REPORT_MANUFACTURING,
    PERMISSIONS.REPORT_QUALITY
  ]
};

/**
 * Resolve the effective permission set for a user:
 *   role defaults + user.permissions_granted - user.permissions_revoked
 */
function permissionsForUser(user) {
  if (!user) return new Set();
  const base = ROLE_PERMISSIONS[user.role] || [];
  const granted = user.permissions_granted || [];
  const revoked = new Set(user.permissions_revoked || []);
  const effective = new Set();
  for (const p of base) if (!revoked.has(p)) effective.add(p);
  for (const p of granted) if (!revoked.has(p)) effective.add(p);
  return effective;
}

function userHasPermission(user, perm) {
  if (!user) return false;
  return permissionsForUser(user).has(perm);
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ALL_PERMS,
  permissionsForUser,
  userHasPermission
};

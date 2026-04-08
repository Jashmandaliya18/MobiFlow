/**
 * RBAC Middleware (SRS §4.1.2)
 *
 * Permission-based authorization on top of JWT auth. Prefer `requirePerm`
 * in routes; keep `roleAuth` (legacy) for the few places that still need
 * raw role checks. Every denial is logged with the SRS-required fields
 * (user, action, object id, source IP) so logging/auditing (§4.1.4) can
 * be wired to a central logger later.
 */
const { userHasPermission, permissionsForUser } = require('../config/permissions');

function logDenial(req, perm) {
  // Keep stdout for now; swap for a central logger when one is introduced.
  console.warn(
    `[RBAC DENY] user=${req.user?._id || 'anon'} email=${req.user?.email || '-'} ` +
    `role=${req.user?.role || '-'} perm=${perm} ` +
    `method=${req.method} path=${req.originalUrl} ip=${req.ip}`
  );
}

/**
 * Require ALL of the listed permissions.
 * Usage: router.post('/add', auth, requirePerm(PERMISSIONS.RAW_ADD), handler)
 */
function requirePerm(...perms) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    for (const p of perms) {
      if (!userHasPermission(req.user, p)) {
        logDenial(req, p);
        return res.status(403).json({
          message: `Access denied. Missing permission: ${p}.`
        });
      }
    }
    next();
  };
}

/**
 * Require AT LEAST ONE of the listed permissions.
 * Useful for endpoints where multiple roles legitimately have overlapping access
 * via different perms (e.g. distributor own-orders vs staff all-orders).
 */
function requireAnyPerm(...perms) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    const effective = permissionsForUser(req.user);
    const ok = perms.some((p) => effective.has(p));
    if (!ok) {
      logDenial(req, perms.join('|'));
      return res.status(403).json({
        message: `Access denied. Missing any of: ${perms.join(', ')}.`
      });
    }
    next();
  };
}

module.exports = { requirePerm, requireAnyPerm };

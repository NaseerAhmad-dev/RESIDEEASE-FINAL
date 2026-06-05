const jwt = require('jsonwebtoken');
const { fail } = require('../utils/helpers');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is not set');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(res, 'Unauthorized', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return fail(res, 'Invalid or expired token', 401);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || (req.user.role !== 'super_admin' && !roles.includes(req.user.role))) {
      return fail(res, 'Forbidden: insufficient permissions', 403);
    }
    next();
  };
}

module.exports = { authenticate, requireRole, JWT_SECRET };

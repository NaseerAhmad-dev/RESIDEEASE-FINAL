const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/bed.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

// Mounted at /api/rooms/:roomId/beds
router.get('/',    authenticate, ctrl.getByRoom);
router.post('/',   authenticate, requireRole('office', 'admin'), ctrl.create);
router.post('/bulk', authenticate, requireRole('office', 'admin'), ctrl.bulkCreate);

module.exports = router;

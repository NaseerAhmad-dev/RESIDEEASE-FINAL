const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, ctrl.getSettings);
router.put('/', authenticate, requireRole('admin'), ctrl.updateSettings);
router.put('/hostel', authenticate, requireRole('admin'), ctrl.updateHostelSettings);
router.put('/rooms/:roomId', authenticate, requireRole('office', 'admin'), ctrl.updateRoomSettings);
router.put('/meals/:mealId', authenticate, requireRole('manager', 'admin'), ctrl.updateMealSettings);
router.put('/system', authenticate, requireRole('admin'), ctrl.updateSystemSettings);

module.exports = router;

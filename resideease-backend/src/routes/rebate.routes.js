const router = require('express').Router();
const ctrl = require('../controllers/rebate.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, ctrl.getAll);
router.post('/', authenticate, ctrl.submit);
router.get('/pending', authenticate, requireRole('manager', 'admin'), ctrl.getPending);
router.get('/student/:studentId', authenticate, ctrl.getByStudent);
router.put('/:id/approve', authenticate, requireRole('manager', 'admin'), ctrl.approve);
router.put('/:id/reject', authenticate, requireRole('manager', 'admin'), ctrl.reject);
router.put('/:id/cancel', authenticate, ctrl.cancel);

module.exports = router;

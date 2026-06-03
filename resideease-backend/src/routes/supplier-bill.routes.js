const router = require('express').Router();
const ctrl = require('../controllers/supplier-bill.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/',              authenticate, ctrl.getAll);
router.post('/',             authenticate, requireRole('manager', 'admin'), ctrl.create);
router.put('/:id/status',   authenticate, requireRole('manager', 'admin'), ctrl.updateStatus);
router.delete('/:id',       authenticate, requireRole('manager', 'admin'), ctrl.remove);

module.exports = router;

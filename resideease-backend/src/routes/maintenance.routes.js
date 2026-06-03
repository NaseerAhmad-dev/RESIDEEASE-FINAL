const router = require('express').Router();
const ctrl = require('../controllers/maintenance.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/',                  authenticate, ctrl.getAll);
router.post('/',                 authenticate, ctrl.create);
router.put('/:id/status',        authenticate, requireRole('manager', 'admin'), ctrl.updateStatus);

module.exports = router;

const router = require('express').Router();
const ctrl = require('../controllers/notice.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/',           authenticate, ctrl.getAll);
router.post('/',          authenticate, requireRole('manager', 'admin'), ctrl.create);
router.put('/:id',        authenticate, requireRole('manager', 'admin'), ctrl.update);
router.delete('/:id',     authenticate, requireRole('manager', 'admin'), ctrl.remove);
router.put('/:id/pin',    authenticate, requireRole('manager', 'admin'), ctrl.togglePin);

module.exports = router;

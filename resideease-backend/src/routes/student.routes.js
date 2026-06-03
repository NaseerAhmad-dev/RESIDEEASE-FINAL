const router = require('express').Router();
const ctrl = require('../controllers/student.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/', authenticate, ctrl.getAll);
router.post('/', authenticate, requireRole('manager', 'admin'), ctrl.create);
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id', authenticate, requireRole('manager', 'admin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('manager', 'admin'), ctrl.remove);

module.exports = router;

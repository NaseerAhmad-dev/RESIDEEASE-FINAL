const router = require('express').Router();
const ctrl = require('../controllers/employee.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/',      authenticate, ctrl.getAll);
router.get('/:id',   authenticate, ctrl.getById);
router.post('/',     authenticate, requireRole('admin', 'manager'), ctrl.create);
router.put('/:id',   authenticate, requireRole('admin', 'manager'), ctrl.update);
router.delete('/:id',authenticate, requireRole('admin', 'manager'), ctrl.remove);

module.exports = router;

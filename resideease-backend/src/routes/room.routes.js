const router = require('express').Router();
const ctrl = require('../controllers/room.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/',    authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/',   authenticate, requireRole('office', 'admin'), ctrl.create);
router.put('/:id', authenticate, requireRole('office', 'admin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('office', 'admin'), ctrl.remove);

module.exports = router;

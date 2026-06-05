const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/',        authenticate, requireRole('super_admin'), ctrl.listUsers);
router.get('/roles',   authenticate, requireRole('super_admin'), ctrl.listRoles);
router.post('/',       authenticate, requireRole('super_admin'), ctrl.createUser);
router.put('/:id',     authenticate, requireRole('super_admin'), ctrl.updateUser);
router.delete('/:id',  authenticate, requireRole('super_admin'), ctrl.deleteUser);

module.exports = router;

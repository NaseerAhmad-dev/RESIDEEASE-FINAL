const router = require('express').Router();
const ctrl = require('../controllers/hostel.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/',                authenticate, requireRole('super_admin'), ctrl.listHostels);
router.get('/:id',             authenticate, requireRole('super_admin'), ctrl.getHostel);
router.post('/',               authenticate, requireRole('super_admin'), ctrl.createHostel);
router.put('/:id',             authenticate, requireRole('super_admin'), ctrl.updateHostel);
router.delete('/:id',          authenticate, requireRole('super_admin'), ctrl.deleteHostel);
router.post('/:id/owners',     authenticate, requireRole('super_admin'), ctrl.addOwner);

module.exports = router;

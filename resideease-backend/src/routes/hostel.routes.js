const router = require('express').Router();
const ctrl    = require('../controllers/hostel.controller');
const subCtrl = require('../controllers/subscription.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const sa = [authenticate, requireRole('super_admin')];

router.get('/',                ...sa, ctrl.listHostels);
router.get('/:id',             ...sa, ctrl.getHostel);
router.post('/',               ...sa, ctrl.createHostel);
router.put('/:id',             ...sa, ctrl.updateHostel);
router.delete('/:id',          ...sa, ctrl.deleteHostel);
router.post('/:id/owners',     ...sa, ctrl.addOwner);

router.put('/:id/subscription',  ...sa, subCtrl.upsertSubscription);
router.get('/:id/payments',      ...sa, subCtrl.listPayments);
router.post('/:id/payments',     ...sa, subCtrl.recordPayment);

module.exports = router;

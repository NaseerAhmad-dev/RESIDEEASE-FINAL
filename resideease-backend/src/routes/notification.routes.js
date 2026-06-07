const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

const auth = [authenticate, requireRole('admin', 'office')];

router.get('/',               authenticate, ctrl.getAll);
router.put('/mark-all-read',  auth,         ctrl.markAllRead);
router.put('/:id/read',       auth,         ctrl.markRead);

module.exports = router;

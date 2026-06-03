const router = require('express').Router();
const ctrl = require('../controllers/audit.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/',                    authenticate, ctrl.getAll);
router.get('/:year/:month',        authenticate, ctrl.getByMonthYear);
router.post('/',                   authenticate, requireRole('manager', 'admin'), ctrl.publish);

module.exports = router;

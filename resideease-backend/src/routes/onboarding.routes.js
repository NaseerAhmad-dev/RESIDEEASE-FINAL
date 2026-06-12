const router = require('express').Router();
const ctrl = require('../controllers/onboarding.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

router.get('/status',   authenticate, requireRole('admin'), ctrl.getStatus);
router.post('/complete', authenticate, requireRole('admin'), ctrl.complete);

module.exports = router;

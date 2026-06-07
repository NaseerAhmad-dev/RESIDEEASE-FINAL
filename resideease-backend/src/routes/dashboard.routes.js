const router = require('express').Router();
const ctrl   = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/',       authenticate, ctrl.getStats);
router.get('/counts', authenticate, ctrl.getCounts);

module.exports = router;

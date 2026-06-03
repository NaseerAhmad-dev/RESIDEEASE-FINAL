const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', ctrl.login);                  // Manager/admin login
router.post('/student/login', ctrl.studentLogin);   // Student login
router.get('/me', authenticate, ctrl.getMe);        // Get current user info

module.exports = router;

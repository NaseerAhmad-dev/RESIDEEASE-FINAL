const router = require('express').Router();
const ctrl = require('../controllers/mess.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

// Enrollments
router.get('/enrollments', authenticate, ctrl.getEnrollments);
router.post('/enrollments', authenticate, ctrl.createEnrollment);
router.get('/enrollments/today', authenticate, ctrl.getTodayEnrollments);
router.get('/enrollments/pending', authenticate, ctrl.getPendingEnrollments);
router.get('/enrollments/coupon/:couponNumber', authenticate, ctrl.getByCoupon);
router.put('/enrollments/:id/serve', authenticate, requireRole('manager', 'admin'), ctrl.serveEnrollment);

// Notifications
router.get('/notifications', authenticate, ctrl.getNotifications);
router.post('/notifications', authenticate, requireRole('manager', 'admin'), ctrl.createNotification);
router.put('/notifications/:id/read', authenticate, ctrl.markRead);

// Stats
router.get('/stats/today', authenticate, ctrl.getTodayStats);

module.exports = router;

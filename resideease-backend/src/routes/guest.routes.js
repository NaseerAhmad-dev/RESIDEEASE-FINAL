const router = require('express').Router();
const ctrl = require('../controllers/guest.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// Strict rate limit for OTP endpoint (prevent abuse)
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes.' },
});

router.post('/otp', otpLimiter, ctrl.generateOtp);    // Public – generate OTP
router.post('/verify-otp', ctrl.verifyOtp);           // Public – verify OTP
router.post('/register', ctrl.register);              // Public – register after OTP
router.get('/', authenticate, requireRole('manager', 'admin'), ctrl.getAll);

module.exports = router;

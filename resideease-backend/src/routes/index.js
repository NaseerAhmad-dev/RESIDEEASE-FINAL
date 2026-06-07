const router = require('express').Router();

router.use('/dashboard',              require('./dashboard.routes'));
router.use('/auth',                   require('./auth.routes'));
router.use('/users',                  require('./user.routes'));
router.use('/hostels',                require('./hostel.routes'));
router.use('/students',               require('./student.routes'));
router.use('/employees',              require('./employee.routes'));
router.use('/mess',                   require('./mess.routes'));
router.use('/rebates',                require('./rebate.routes'));
router.use('/guests',                 require('./guest.routes'));
router.use('/settings',               require('./settings.routes'));
router.use('/rooms',                  require('./room.routes'));
router.use('/notices',                require('./notice.routes'));
router.use('/maintenance',            require('./maintenance.routes'));
router.use('/supplier-bills',         require('./supplier-bill.routes'));
router.use('/notifications',           require('./notification.routes'));
router.use('/student-notifications',  require('./student-notification.routes'));
router.use('/audit',                  require('./audit.routes'));

module.exports = router;

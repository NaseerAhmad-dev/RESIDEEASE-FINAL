const router = require('express').Router();
const ctrl = require('../controllers/student-notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/student/:studentId',          authenticate, ctrl.getByStudent);
router.post('/',                           authenticate, ctrl.addMany);
router.put('/:id/read',                   authenticate, ctrl.markRead);
router.put('/student/:studentId/read-all', authenticate, ctrl.markAllRead);

module.exports = router;

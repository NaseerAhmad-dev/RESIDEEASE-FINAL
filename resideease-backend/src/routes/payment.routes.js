const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/',                    authenticate, ctrl.create);
router.get('/',                     authenticate, ctrl.getAll);
router.get('/student/:studentId',   authenticate, ctrl.getByStudent);

module.exports = router;

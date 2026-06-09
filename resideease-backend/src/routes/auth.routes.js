const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/login', ctrl.login);                     // Admin/manager/office login
router.post('/student/login', ctrl.studentLogin);      // Student login
router.post('/employee/login', ctrl.employeeLogin);    // Employee login (mess manager, etc.)
router.get('/me', authenticate, ctrl.getMe);           // Get current user info

module.exports = router;

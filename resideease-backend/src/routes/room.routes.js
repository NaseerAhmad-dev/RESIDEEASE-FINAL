const router = require('express').Router();
const ctrl    = require('../controllers/room.controller');
const bedCtrl = require('../controllers/bed.controller');
const { authenticate, requireRole } = require('../middleware/auth.middleware');

// ── Room CRUD ─────────────────────────────────────────────────────────────────
router.get('/',          authenticate, ctrl.getAll);
router.post('/',         authenticate, requireRole('office', 'admin'), ctrl.create);
router.post('/bulk',     authenticate, requireRole('office', 'admin'), ctrl.bulkCreate);
router.get('/:id',    authenticate, ctrl.getById);
router.put('/:id',    authenticate, requireRole('office', 'admin'), ctrl.update);
router.delete('/:id', authenticate, requireRole('office', 'admin'), ctrl.remove);

// ── Beds (flat routes, no sub-router nesting) ─────────────────────────────────
router.get( '/:roomId/beds',      authenticate,                              bedCtrl.getByRoom);
router.post('/:roomId/beds',      authenticate, requireRole('office', 'admin'), bedCtrl.create);
router.post('/:roomId/beds/bulk', authenticate, requireRole('office', 'admin'), bedCtrl.bulkCreate);
router.put( '/beds/:id',          authenticate, requireRole('office', 'admin'), bedCtrl.update);

module.exports = router;

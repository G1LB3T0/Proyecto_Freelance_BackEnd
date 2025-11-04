const express = require('express');
const router = express.Router();
const { authMiddleware, anyAuthenticated, ensureEventOwnerOrAdmin } = require('../middleware/auth');

const {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getEventByIdDetailed
} = require('../controllers/event.controller');


// Log route access for debugging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// NUEVAS RUTAS ESPECÍFICAS (PRIMERO - ANTES DE TODO)
router.get('/upcoming', authMiddleware, anyAuthenticated, getUpcomingEvents);
router.get('/my-events', authMiddleware, anyAuthenticated, getAllEvents); // Solo mis eventos

// RUTAS EXISTENTES CON AUTENTICACIÓN
router.get('/', authMiddleware, anyAuthenticated, getAllEvents); // Requiere autenticación
router.post('/', authMiddleware, anyAuthenticated, createEvent);

// RUTAS DINÁMICAS (deben ir AL FINAL)
router.get('/:id', authMiddleware, anyAuthenticated, getEventByIdDetailed);            // GET /api/events/:id
router.get('/:id/detailed', authMiddleware, anyAuthenticated, getEventByIdDetailed);   // GET /api/events/:id/detailed (alternativa)
router.put('/:id', authMiddleware, anyAuthenticated, ensureEventOwnerOrAdmin, updateEvent);
router.delete('/:id', authMiddleware, anyAuthenticated, ensureEventOwnerOrAdmin, deleteEvent);

module.exports = router;
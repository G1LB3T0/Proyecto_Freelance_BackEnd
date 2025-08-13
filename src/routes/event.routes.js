const express = require('express');
const router = express.Router();

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
router.get('/upcoming', getUpcomingEvents);// RUTAS EXISTENTES  
router.get('/', getAllEvents);
router.post('/', createEvent);// RUTAS DINÁMICAS (deben ir AL FINAL)
router.get('/:id', getEventByIdDetailed);            // GET /api/events/:id
router.get('/:id/detailed', getEventByIdDetailed);   // GET /api/events/:id/detailed (alternativa)
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
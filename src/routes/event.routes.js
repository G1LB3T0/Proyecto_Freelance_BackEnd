const express = require('express');
const router = express.Router();

const {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/event.controller');


// Log route access for debugging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

router.get('/', getAllEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
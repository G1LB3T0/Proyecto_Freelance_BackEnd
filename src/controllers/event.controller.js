const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/events
const getAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

// POST /api/events
const createEvent = async (req, res) => {
  try {
    const { title, description, start_time, end_time, category, status, user_id } = req.body;

    const newEvent = await prisma.event.create({
      data: {
        title,
        description,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : null,
        category,
        status,
        user_id: parseInt(user_id)
      }
    });

    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ error: 'Error al crear evento' });
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start_time, end_time, category, status } = req.body;

    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : null,
        category,
        status
      }
    });

    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar evento' });
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    res.status(400).json({ error: 'Error al eliminar evento' });
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
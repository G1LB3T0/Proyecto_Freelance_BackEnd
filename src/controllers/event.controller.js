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
    const { title, day, month, year, user_id } = req.body;

    // Validaciones básicas
    if (!title || !day || !month || !year || !user_id) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios: title, day, month, year, user_id'
      });
    }

    if (day < 1 || day > 31) {
      return res.status(400).json({ error: 'El día debe estar entre 1 y 31' });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'El mes debe estar entre 1 y 12' });
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
        user_id: parseInt(user_id)
      }
    });

    res.status(201).json(newEvent);
  } catch (err) {
    console.error('Error al crear evento:', err);
    res.status(400).json({ error: 'Error al crear evento: ' + err.message });
  }
};

// PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, day, month, year } = req.body;

    // Validaciones básicas
    if (day && (day < 1 || day > 31)) {
      return res.status(400).json({ error: 'El día debe estar entre 1 y 31' });
    }

    if (month && (month < 1 || month > 12)) {
      return res.status(400).json({ error: 'El mes debe estar entre 1 y 12' });
    }

    const dataToUpdate = {};
    if (title) dataToUpdate.title = title;
    if (day) dataToUpdate.day = parseInt(day);
    if (month) dataToUpdate.month = parseInt(month);
    if (year) dataToUpdate.year = parseInt(year);

    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    });

    res.json(updatedEvent);
  } catch (err) {
    console.error('Error al actualizar evento:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Evento no encontrado' });
    } else {
      res.status(400).json({ error: 'Error al actualizar evento: ' + err.message });
    }
  }
};

// DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.event.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Evento eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar evento:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Evento no encontrado' });
    } else {
      res.status(400).json({ error: 'Error al eliminar evento: ' + err.message });
    }
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
};
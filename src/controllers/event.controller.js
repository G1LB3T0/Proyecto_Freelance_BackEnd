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

// ===== NUEVAS FUNCIONES PARA UPCOMING EVENTS =====

// Obtener eventos próximos (upcoming events) - Versión adaptada al esquema actual
const getUpcomingEvents = async (req, res) => {
  try {
    const {
      limit = 10,
      user_id
    } = req.query;

    // Obtener la fecha actual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentDay = now.getDate();

    // Construir filtros para eventos futuros basados en day/month/year
    const whereConditions = {
      OR: [
        // Eventos en años futuros
        { year: { gt: currentYear } },
        // Eventos en el año actual pero en meses futuros
        {
          AND: [
            { year: currentYear },
            { month: { gt: currentMonth } }
          ]
        },
        // Eventos en el año y mes actual pero en días futuros
        {
          AND: [
            { year: currentYear },
            { month: currentMonth },
            { day: { gte: currentDay } }
          ]
        }
      ]
    };

    // Filtro por usuario específico (si se proporciona)
    if (user_id) {
      whereConditions.user_id = parseInt(user_id);
    }

    // Obtener eventos próximos con información del organizador
    const upcomingEvents = await prisma.event.findMany({
      where: whereConditions,
      include: {
        login_credentials: {
          select: {
            id: true,
            name: true,
            username: true,
            user_type: true
          }
        }
      },
      // Ordenar por fecha (año, mes, día)
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
        { day: 'asc' },
        { created_at: 'desc' }
      ],
      take: parseInt(limit)
    });

    // Formatear la respuesta para el frontend
    const formattedEvents = upcomingEvents.map(event => {
      // Crear una fecha para calcular días hasta el evento
      const eventDate = new Date(event.year, event.month - 1, event.day);
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        event_date: {
          day: event.day,
          month: event.month,
          year: event.year,
          formatted: eventDate.toISOString().split('T')[0] // YYYY-MM-DD
        },
        event_time: event.event_time,
        category: event.category,
        is_public: event.is_public,
        attendees: {
          current: event.current_attendees || 0,
          max: event.max_attendees,
          available: event.max_attendees ? event.max_attendees - (event.current_attendees || 0) : null,
          percentage: event.max_attendees ? Math.round(((event.current_attendees || 0) / event.max_attendees) * 100) : null
        },
        organizer: {
          id: event.login_credentials.id,
          name: event.login_credentials.name,
          username: event.login_credentials.username,
          user_type: event.login_credentials.user_type
        },
        status: event.status,
        created_at: event.created_at,
        days_until: daysUntil
      };
    });

    res.json({
      success: true,
      data: {
        events: formattedEvents,
        total: formattedEvents.length,
        message: `Se encontraron ${formattedEvents.length} eventos próximos`
      }
    });

  } catch (error) {
    console.error('Error al obtener eventos próximos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};

// Obtener un evento específico por ID (versión mejorada)
const getEventByIdDetailed = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        login_credentials: {
          select: {
            id: true,
            name: true,
            username: true,
            user_type: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Evento no encontrado'
      });
    }

    // Formatear respuesta
    const formattedEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      event_date: event.event_date,
      event_time: event.event_time,
      category: event.category,
      is_public: event.is_public,
      attendees: {
        current: event.current_attendees,
        max: event.max_attendees,
        available: event.max_attendees ? event.max_attendees - event.current_attendees : null,
        percentage: event.max_attendees ? Math.round((event.current_attendees / event.max_attendees) * 100) : null
      },
      organizer: {
        id: event.login_credentials.id,
        name: event.login_credentials.name,
        username: event.login_credentials.username,
        user_type: event.login_credentials.user_type
      },
      status: event.status,
      created_at: event.created_at,
      updated_at: event.updated_at,
      days_until: Math.ceil((new Date(event.event_date) - new Date()) / (1000 * 60 * 60 * 24))
    };

    res.json({
      success: true,
      data: formattedEvent
    });

  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    });
  }
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getEventByIdDetailed
};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function parseBool(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value !== 'string') return fallback;
    return ['true', '1', 'yes'].includes(value.toLowerCase());
}

const getAllEvents = async (req, res) => {
    try {
        const isMyEventsRoute = req.route?.path === '/my-events';
        const includePublic = parseBool(req.query.include_public, !isMyEventsRoute);

        let where = {};
        if (isMyEventsRoute) {
            where.user_id = req.user.id;
        } else {
            where = includePublic
                ? { OR: [{ user_id: req.user.id }, { is_public: true }] }
                : { user_id: req.user.id };
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: [
                { year: 'asc' },
                { month: 'asc' },
                { day: 'asc' }
            ],
            include: {
                login_credentials: { select: { id: true, username: true, user_type: true } }
            }
        });

        res.json({ success: true, data: events, count: events.length });
    } catch (err) {
        console.error('Error al obtener eventos:', err);
        res.status(500).json({ success: false, error: 'Error al obtener eventos' });
    }
};

const createEvent = async (req, res) => {
    try {
        const { title, day, month, year, description, location, event_time, category, is_public = false } = req.body;

        if (!title || !day || !month || !year) {
            return res.status(400).json({ success: false, error: 'Faltan campos obligatorios: title, day, month, year' });
        }
        if (day < 1 || day > 31) return res.status(400).json({ success: false, error: 'El día debe estar entre 1 y 31' });
        if (month < 1 || month > 12) return res.status(400).json({ success: false, error: 'El mes debe estar entre 1 y 12' });

        const canSetPublic = ['project_manager', 'admin'].includes(req.user.user_type?.toLowerCase?.() || '');
        const eventIsPublic = Boolean(is_public) && canSetPublic;
        const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        const newEvent = await prisma.event.create({
            data: {
                title,
                day: parseInt(day),
                month: parseInt(month),
                year: parseInt(year),
                description: description || null,
                location: location || null,
                event_date: eventDate,
                event_time: event_time || null,
                category: category || 'personal',
                is_public: eventIsPublic,
                status: 'active',
                user_id: req.user.id
            },
            include: { login_credentials: { select: { id: true, username: true, user_type: true } } }
        });

        res.status(201).json({ success: true, data: newEvent, message: `Evento creado exitosamente${eventIsPublic ? ' (público)' : ' (privado)'}` });
    } catch (err) {
        console.error('Error al crear evento:', err);
        res.status(400).json({ success: false, error: 'Error al crear evento' });
    }
};

const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, day, month, year, description, location, event_time, category, is_public } = req.body;

        if (day !== undefined) {
            const d = parseInt(day);
            if (isNaN(d) || d < 1 || d > 31) return res.status(400).json({ success: false, error: 'El día debe estar entre 1 y 31' });
        }
        if (month !== undefined) {
            const m = parseInt(month);
            if (isNaN(m) || m < 1 || m > 12) return res.status(400).json({ success: false, error: 'El mes debe estar entre 1 y 12' });
        }

        const data = {};
        if (title !== undefined) data.title = title;
        if (day !== undefined) data.day = parseInt(day);
        if (month !== undefined) data.month = parseInt(month);
        if (year !== undefined) data.year = parseInt(year);
        if (description !== undefined) data.description = description;
        if (location !== undefined) data.location = location;
        if (event_time !== undefined) data.event_time = event_time;
        if (category !== undefined) data.category = category;

        if (is_public !== undefined) {
            const canSetPublic = ['project_manager', 'admin'].includes(req.user.user_type?.toLowerCase?.() || '');
            if (canSetPublic) data.is_public = Boolean(is_public);
        }

        if (data.day !== undefined || data.month !== undefined || data.year !== undefined) {
            const current = await prisma.event.findUnique({ where: { id: parseInt(id) }, select: { day: true, month: true, year: true } });
            if (!current) return res.status(404).json({ success: false, error: 'Evento no encontrado' });
            const newDay = data.day ?? current.day;
            const newMonth = data.month ?? current.month;
            const newYear = data.year ?? current.year;
            data.event_date = new Date(newYear, newMonth - 1, newDay);
        }

        const updated = await prisma.event.update({ where: { id: parseInt(id) }, data, include: { login_credentials: { select: { id: true, username: true, user_type: true } } } });
        res.json({ success: true, data: updated, message: 'Evento actualizado exitosamente' });
    } catch (err) {
        console.error('Error al actualizar evento:', err);
        if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        res.status(400).json({ success: false, error: 'Error al actualizar evento' });
    }
};

const getUpcomingEvents = async (req, res) => {
    try {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1;
        const d = now.getDate();

        const where = {
            AND: [
                { OR: [{ user_id: req.user.id }, { is_public: true }] },
                {
                    OR: [
                        { year: { gt: y } },
                        { AND: [{ year: y }, { month: { gt: m } }] },
                        { AND: [{ year: y }, { month: m }, { day: { gte: d } }] }
                    ]
                }
            ]
        };

        const items = await prisma.event.findMany({
            where,
            orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }],
            include: { login_credentials: { select: { id: true, username: true, user_type: true } } },
            take: 20
        });

        const withExtras = items.map(ev => {
            const dt = new Date(ev.year, ev.month - 1, ev.day);
            const daysLeft = Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return { ...ev, days_left: daysLeft, is_today: daysLeft === 0, is_this_week: daysLeft <= 7 };
        });

        res.json({ success: true, data: withExtras, count: withExtras.length });
    } catch (err) {
        console.error('Error al obtener eventos próximos:', err);
        res.status(500).json({ success: false, error: 'Error al obtener eventos próximos' });
    }
};

const getEventByIdDetailed = async (req, res) => {
    try {
        const { id } = req.params;
        const ev = await prisma.event.findUnique({
            where: { id: parseInt(id) },
            include: {
                login_credentials: {
                    select: {
                        id: true,
                        username: true,
                        user_type: true,
                        user_details: { select: { first_name: true, last_name: true, profile_picture: true } }
                    }
                }
            }
        });
        if (!ev) return res.status(404).json({ success: false, error: 'Evento no encontrado' });

        const isOwner = ev.user_id === req.user.id;
        const isAdmin = (req.user.user_type || '').toLowerCase() === 'admin';
        if (!isOwner && !isAdmin && !ev.is_public) return res.status(403).json({ success: false, error: 'No tienes permisos para ver este evento' });

        res.json({ success: true, data: ev });
    } catch (err) {
        console.error('Error al obtener evento detallado:', err);
        res.status(500).json({ success: false, error: 'Error al obtener evento detallado' });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.event.delete({ where: { id: parseInt(id) } });
        res.json({ success: true, message: 'Evento eliminado exitosamente' });
    } catch (err) {
        console.error('Error al eliminar evento:', err);
        if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        res.status(400).json({ success: false, error: 'Error al eliminar evento' });
    }
};

module.exports = { getAllEvents, createEvent, updateEvent, deleteEvent, getUpcomingEvents, getEventByIdDetailed };

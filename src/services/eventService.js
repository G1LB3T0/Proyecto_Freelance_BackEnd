const prisma = require('../database/db');

/**
 * Servicio para gestión de eventos y sincronización con proyectos
 */

/**
 * Crear evento en el calendario basado en un proyecto
 * @param {Object} projectData - Datos del proyecto
 * @param {number} projectData.projectId - ID del proyecto
 * @param {string} projectData.title - Título del proyecto
 * @param {number} projectData.freelancerId - ID del freelancer
 * @param {Date} projectData.deadline - Fecha límite del proyecto
 * @returns {Promise<Object>} - Evento creado
 */
const createProjectEvent = async (projectData) => {
    const { projectId, title, freelancerId, deadline } = projectData;

    if (!projectId || !title || !freelancerId || !deadline) {
        throw new Error('Faltan datos requeridos para crear el evento del proyecto');
    }

    const eventDate = new Date(deadline);

    const event = await prisma.event.create({
        data: {
            user_id: freelancerId,
            title: `Proyecto: ${title}`,
            description: `Fecha límite del proyecto: ${title}`,
            location: 'Proyecto FreelanceHub',
            event_date: eventDate,
            event_time: '23:59', // Hora por defecto para deadline
            category: 'proyecto',
            is_public: false,
            max_attendees: 1,
            current_attendees: 1,
            status: 'active',
            day: eventDate.getDate(),
            month: eventDate.getMonth() + 1,
            year: eventDate.getFullYear()
        }
    });

    return event;
};

/**
 * Sincronizar proyecto existente con calendario
 * @param {number} projectId - ID del proyecto
 * @returns {Promise<Object>} - Evento creado
 */
const syncProjectToCalendar = async (projectId) => {
    // Obtener datos del proyecto
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            freelancer: {
                select: { id: true, username: true }
            }
        }
    });

    if (!project) {
        throw new Error('Proyecto no encontrado');
    }

    if (!project.freelancer_id) {
        throw new Error('El proyecto no tiene freelancer asignado');
    }

    if (!project.deadline) {
        throw new Error('El proyecto no tiene fecha límite definida');
    }

    // Verificar si ya existe un evento para este proyecto
    const existingEvent = await prisma.event.findFirst({
        where: {
            user_id: project.freelancer_id,
            title: `Proyecto: ${project.title}`
        }
    });

    if (existingEvent) {
        throw new Error('Ya existe un evento en el calendario para este proyecto');
    }

    // Crear el evento
    return await createProjectEvent({
        projectId: project.id,
        title: project.title,
        freelancerId: project.freelancer_id,
        deadline: project.deadline
    });
};

/**
 * Obtener eventos de proyectos de un usuario
 * @param {number} userId - ID del usuario
 * @returns {Promise<Array>} - Lista de eventos de proyectos
 */
const getProjectEvents = async (userId) => {
    const events = await prisma.event.findMany({
        where: {
            user_id: userId,
            category: 'proyecto'
        },
        orderBy: {
            event_date: 'asc'
        }
    });

    return events;
};

/**
 * Eliminar evento de proyecto cuando se cancela o completa
 * @param {number} projectId - ID del proyecto
 * @param {number} freelancerId - ID del freelancer
 * @returns {Promise<boolean>} - Resultado de la eliminación
 */
const removeProjectEvent = async (projectId, freelancerId) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { title: true }
    });

    if (!project) {
        return false;
    }

    const deletedEvent = await prisma.event.deleteMany({
        where: {
            user_id: freelancerId,
            title: `Proyecto: ${project.title}`,
            category: 'proyecto'
        }
    });

    return deletedEvent.count > 0;
};

module.exports = {
    createProjectEvent,
    syncProjectToCalendar,
    getProjectEvents,
    removeProjectEvent
};
const prisma = require('../database/db');
const eventService = require('../services/eventService');

// Obtener todos los proyectos con paginación y filtros optimizados
exports.getProjects = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            category_id,
            include_details = 'false',
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const includeDetails = include_details === 'true';

        // Construir filtros dinámicamente
        const where = {};
        if (status) where.status = status;
        if (category_id) where.category_id = parseInt(category_id);

        // Configurar ordenamiento
        const orderBy = {};
        orderBy[sort_by] = sort_order;

        console.log('🔄 Getting optimized projects with filters:', { where, includeDetails, page, limit });

        // ✅ OPTIMIZACIÓN: Includes condicionales y selects específicos
        const baseSelect = {
            id: true,
            client_id: true,
            freelancer_id: true,
            title: true,
            description: true,
            budget: true,
            status: true,
            deadline: true,
            created_at: true,
            priority: true
        };

        const includeOptions = includeDetails ? {
            client: {
                select: { id: true, username: true, email: true }
            },
            freelancer: {
                select: { id: true, username: true, email: true }
            },
            categories: {
                select: { id: true, name: true }
            }
        } : {};

        // Consulta optimizada con paginación
        const [projects, total] = await Promise.all([
            prisma.project.findMany({
                where,
                select: includeDetails ? undefined : baseSelect,
                include: includeDetails ? includeOptions : undefined,
                orderBy,
                skip: offset,
                take: parseInt(limit)
            }),
            prisma.project.count({ where })
        ]);

        console.log('✅ Projects optimizados obtenidos:', projects.length, 'de', total);

        res.json({
            success: true,
            data: projects,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / parseInt(limit)),
                total_projects: total,
                projects_per_page: parseInt(limit),
                has_next_page: offset + parseInt(limit) < total,
                has_prev_page: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error('❌ Error en getProjects:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proyectos',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener proyecto por ID - versión debug
exports.getProjectById = async (req, res) => {
    const { id } = req.params;
    try {
        const project = await prisma.project.findUnique({
            where: { id: Number(id) }
        });

        if (!project) {
            return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
        }

        res.json({ success: true, data: project });
    } catch (error) {
        console.error('❌ Error detallado en getProjectById:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proyecto',
            details: error.message
        });
    }
};

// Obtener proyectos por cliente con lazy loading de proposals
exports.getProjectsByClient = async (req, res) => {
    const { clientId } = req.params;
    const { include_proposals = 'false', status } = req.query;

    try {
        // Filtros dinámicos
        const where = { client_id: Number(clientId) };
        if (status) where.status = status;

        console.log('🔄 Getting optimized client projects for:', clientId);

        // ✅ OPTIMIZACIÓN: Includes condicionales para evitar N+1
        const includeOptions = {
            freelancer: {
                select: { id: true, username: true, email: true }
            },
            categories: {
                select: { id: true, name: true }
            }
        };

        // Solo incluir proposals si se solicita explícitamente
        if (include_proposals === 'true') {
            includeOptions.project_proposals = {
                select: {
                    id: true,
                    proposed_budget: true,
                    delivery_time: true,
                    status: true,
                    created_at: true,
                    login_credentials: {
                        select: { id: true, username: true, email: true }
                    }
                },
                orderBy: { created_at: 'desc' }
            };
        }

        const projects = await prisma.project.findMany({
            where,
            include: includeOptions,
            orderBy: { created_at: 'desc' }
        });

        console.log('✅ Client projects optimizados:', projects.length, 'proyectos');

        res.json({
            success: true,
            data: projects,
            meta: {
                client_id: Number(clientId),
                includes_proposals: include_proposals === 'true',
                total_count: projects.length
            }
        });

    } catch (error) {
        console.error('❌ Error en getProjectsByClient:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proyectos del cliente',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener proyectos por freelancer optimizado
exports.getProjectsByFreelancer = async (req, res) => {
    const { freelancerId } = req.params;
    const { status, include_categories = 'true' } = req.query;

    try {
        // Filtros dinámicos
        const where = { freelancer_id: Number(freelancerId) };
        if (status) where.status = status;

        console.log('🔄 Getting optimized freelancer projects for:', freelancerId);

        // ✅ OPTIMIZACIÓN: Includes condicionales y selects específicos
        const includeOptions = {
            client: {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    user_details: {
                        select: {
                            first_name: true,
                            last_name: true
                        }
                    }
                }
            }
        };

        // Solo incluir categorías si se solicita
        if (include_categories === 'true') {
            includeOptions.categories = {
                select: { id: true, name: true, description: true }
            };
        }

        const projects = await prisma.project.findMany({
            where,
            include: includeOptions,
            orderBy: [
                { status: 'asc' }, // Primero los activos
                { created_at: 'desc' }
            ]
        });

        // Estadísticas rápidas
        const stats = {
            total: projects.length,
            by_status: {}
        };

        projects.forEach(project => {
            stats.by_status[project.status] = (stats.by_status[project.status] || 0) + 1;
        });

        console.log('✅ Freelancer projects optimizados:', stats);

        res.json({
            success: true,
            data: projects,
            meta: {
                freelancer_id: Number(freelancerId),
                stats,
                includes_categories: include_categories === 'true'
            }
        });

    } catch (error) {
        console.error('❌ Error en getProjectsByFreelancer:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proyectos del freelancer',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Filtrar proyectos por status
exports.getProjectsByStatus = async (req, res) => {
    const { status } = req.params;
    try {
        const projects = await prisma.project.findMany({
            where: { status },
            include: {
                client: { select: { id: true, username: true, email: true } },
                freelancer: { select: { id: true, username: true, email: true } },
                categories: true
            }
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al filtrar proyectos por estado' });
    }
};

// Crear proyecto con integración de cuestionario
exports.createProject = async (req, res) => {
    try {
        const { title, description, budget, deadline, category_id, skills_required, priority, questionnaire_session_id } = req.body;

        // Validar autenticación
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        // Validaciones de campos requeridos
        if (!title || !description || budget === undefined || budget === null) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: title, description, budget'
            });
        }

        // Normalizaciones
        const parsedBudget = Number.parseFloat(budget);
        if (Number.isNaN(parsedBudget) || parsedBudget <= 0) {
            return res.status(400).json({ success: false, error: 'El presupuesto (budget) debe ser un número positivo' });
        }

        let parsedDeadline = null;
        if (deadline) {
            const d = new Date(deadline);
            if (isNaN(d.getTime())) {
                return res.status(400).json({ success: false, error: 'Fecha inválida en deadline (usar formato ISO: YYYY-MM-DD)' });
            }
            parsedDeadline = d;
        }

        let parsedCategoryId = null;
        if (category_id !== undefined && category_id !== null && category_id !== '') {
            parsedCategoryId = Number(category_id);
            if (Number.isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
                return res.status(400).json({ success: false, error: 'category_id debe ser un entero positivo' });
            }
            // Verificar existencia de la categoría
            const categoryExists = await prisma.categories.findUnique({ where: { id: parsedCategoryId } });
            if (!categoryExists) {
                return res.status(400).json({ success: false, error: 'La categoría indicada no existe' });
            }
        }

        // skills_required debe ser array de strings; admitir string separado por comas
        let parsedSkills = [];
        if (Array.isArray(skills_required)) {
            parsedSkills = skills_required.filter(Boolean).map(s => String(s).trim()).filter(Boolean);
        } else if (typeof skills_required === 'string') {
            parsedSkills = skills_required.split(',').map(s => s.trim()).filter(Boolean);
        }

        const safePriority = ['low', 'medium', 'high'].includes(String(priority).toLowerCase())
            ? String(priority).toLowerCase()
            : 'medium';

        console.log('🔄 Creando proyecto con integración de cuestionario');

        // Transacción para crear proyecto y asociar cuestionario
        const result = await prisma.$transaction(async (tx) => {
            // 1. Crear el proyecto
            const project = await tx.project.create({
                data: {
                    client_id: req.user.id,
                    title: String(title).trim(),
                    description: String(description).trim(),
                    budget: parsedBudget,
                    deadline: parsedDeadline,
                    category_id: parsedCategoryId,
                    skills_required: parsedSkills,
                    priority: safePriority
                },
                include: {
                    client: { select: { id: true, username: true, email: true } },
                    categories: true
                }
            });

            // 2. Si hay questionnaire_session_id, asociar el cuestionario con el proyecto
            let questionnaireResponse = null;
            if (questionnaire_session_id) {
                try {
                    questionnaireResponse = await tx.project_questionnaire_responses.update({
                        where: {
                            session_id: questionnaire_session_id,
                            user_id: req.user.id
                        },
                        data: {
                            project_id: project.id,
                            updated_at: new Date()
                        }
                    });
                    console.log('✅ Cuestionario asociado con proyecto:', project.id);
                } catch (questionnaireError) {
                    console.warn('⚠️ No se pudo asociar cuestionario:', questionnaireError.message);
                    // No fallar la creación del proyecto por esto
                }
            }

            return { project, questionnaireResponse };
        });

        const response = {
            success: true,
            message: 'Proyecto creado exitosamente',
            data: result.project
        };

        // Incluir información del cuestionario si se asoció
        if (result.questionnaireResponse) {
            response.questionnaire = {
                associated: true,
                session_id: result.questionnaireResponse.session_id,
                completion_percentage: result.questionnaireResponse.completion_percentage
            };
        }

        console.log('✅ Proyecto creado:', result.project.id);
        res.status(201).json(response);
    } catch (error) {
        console.error('Error al crear proyecto:', error);
        // Mejorar feedback del error para depuración
        res.status(500).json({
            success: false,
            error: 'Error al crear proyecto',
            code: error.code,
            meta: error.meta,
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Actualizar proyecto
exports.updateProject = async (req, res) => {
    const { id } = req.params;
    try {
        // Primero verificar que el proyecto existe y pertenece al usuario
        // Permitir a 'admin' editar cualquier proyecto; los 'project_manager' deben ser dueños
        const skipOwnership = req.user.user_type === 'admin';
        if (!skipOwnership) {
            const existingProject = await prisma.project.findUnique({
                where: { id: Number(id) },
                select: { client_id: true }
            });

            if (!existingProject) {
                return res.status(404).json({
                    success: false,
                    error: 'Proyecto no encontrado'
                });
            }

            if (existingProject.client_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permisos para actualizar este proyecto'
                });
            }
        }

        const data = { ...req.body };
        // Normalizaciones de tipos
        if (data.budget !== undefined) {
            const budgetNum = parseFloat(data.budget);
            if (Number.isNaN(budgetNum) || budgetNum <= 0) {
                return res.status(400).json({ success: false, error: 'El presupuesto (budget) debe ser un número positivo' });
            }
            data.budget = budgetNum;
        }
        if (data.deadline) {
            const d = new Date(data.deadline);
            if (isNaN(d.getTime())) {
                return res.status(400).json({ success: false, error: 'Fecha inválida en deadline (usar formato ISO: YYYY-MM-DD)' });
            }
            data.deadline = d;
        }
        if (data.category_id !== undefined && data.category_id !== null && data.category_id !== '') {
            const catId = Number(data.category_id);
            if (Number.isNaN(catId) || catId <= 0) {
                return res.status(400).json({ success: false, error: 'category_id debe ser un entero positivo' });
            }
            // validar existencia de categoría
            const categoryExists = await prisma.categories.findUnique({ where: { id: catId } });
            if (!categoryExists) {
                return res.status(400).json({ success: false, error: 'La categoría indicada no existe' });
            }
            data.category_id = catId;
        }
        if (data.freelancer_id) {
            const fid = Number(data.freelancer_id);
            if (Number.isNaN(fid) || fid <= 0) {
                return res.status(400).json({ success: false, error: 'freelancer_id debe ser un entero positivo' });
            }
            data.freelancer_id = fid;
        }
        if (data.completion_date) {
            const cd = new Date(data.completion_date);
            if (isNaN(cd.getTime())) {
                return res.status(400).json({ success: false, error: 'Fecha inválida en completion_date (usar formato ISO: YYYY-MM-DD)' });
            }
            data.completion_date = cd;
        }

        // Normalización/validación de listas controladas
        if (data.priority) {
            const p = String(data.priority).toLowerCase();
            // Mapear "urgent" a "high" para compatibilidad con UI
            const normalized = p === 'urgent' ? 'high' : p;
            const allowedPriorities = ['low', 'medium', 'high'];
            if (!allowedPriorities.includes(normalized)) {
                return res.status(400).json({ success: false, error: `priority inválido. Valores permitidos: ${allowedPriorities.join(', ')}` });
            }
            data.priority = normalized;
        }

        if (data.status) {
            const s = String(data.status).toLowerCase();
            // Compatibilidad: mapear "closed" a "cancelled"
            const normalized = s === 'closed' ? 'cancelled' : s;
            const allowedStatuses = ['open', 'in_progress', 'completed', 'cancelled'];
            if (!allowedStatuses.includes(normalized)) {
                return res.status(400).json({ success: false, error: `status inválido. Valores permitidos: ${allowedStatuses.join(', ')}` });
            }
            data.status = normalized;
        }

        // Normalizar skills_required de string a array
        if (data.skills_required) {
            if (Array.isArray(data.skills_required)) {
                data.skills_required = data.skills_required.filter(Boolean).map((s) => String(s).trim()).filter(Boolean);
            } else if (typeof data.skills_required === 'string') {
                data.skills_required = data.skills_required.split(',').map((s) => s.trim()).filter(Boolean);
            }
        }

        // Remover client_id del data para evitar que se pueda cambiar
        delete data.client_id;

        const project = await prisma.project.update({
            where: { id: Number(id) },
            data,
            include: {
                client: { select: { id: true, username: true, email: true } },
                freelancer: { select: { id: true, username: true, email: true } },
                categories: true
            }
        });

        res.json({ success: true, data: project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al actualizar proyecto' });
    }
};

// Eliminar proyecto
exports.deleteProject = async (req, res) => {
    const { id } = req.params;
    try {
        // Primero verificar que el proyecto existe y pertenece al usuario (a menos que sea admin)
        if (req.user.user_type !== 'admin') {
            const existingProject = await prisma.project.findUnique({
                where: { id: Number(id) },
                select: { client_id: true }
            });

            if (!existingProject) {
                return res.status(404).json({
                    success: false,
                    error: 'Proyecto no encontrado'
                });
            }

            if (existingProject.client_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'No tienes permisos para eliminar este proyecto'
                });
            }
        }

        await prisma.project.delete({ where: { id: Number(id) } });
        res.json({ success: true, message: 'Proyecto eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al eliminar proyecto' });
    }
};

// ===============================
// SINCRONIZACIÓN CON CALENDARIO
// ===============================

// Sincronizar proyecto con calendario manualmente
exports.syncProjectToCalendar = async (req, res) => {
    const { id } = req.params;
    try {
        const event = await eventService.syncProjectToCalendar(Number(id));

        res.json({
            success: true,
            message: 'Proyecto sincronizado con calendario',
            data: {
                projectId: Number(id),
                eventId: event.id,
                eventTitle: event.title,
                eventDate: event.event_date
            }
        });
    } catch (error) {
        console.error('Error al sincronizar proyecto con calendario:', error);

        // Manejar errores específicos
        if (error.message.includes('no encontrado')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        if (error.message.includes('no tiene freelancer') || error.message.includes('no tiene fecha límite') || error.message.includes('Ya existe')) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(500).json({ success: false, error: 'Error al sincronizar con calendario' });
    }
};

// Obtener eventos de proyectos del usuario autenticado
exports.getMyProjectEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const events = await eventService.getProjectEvents(userId);

        res.json({
            success: true,
            data: events,
            count: events.length
        });
    } catch (error) {
        console.error('Error al obtener eventos de proyectos:', error);
        res.status(500).json({ success: false, error: 'Error al obtener eventos de proyectos' });
    }
};

// Remover evento de proyecto del calendario
exports.removeProjectEvent = async (req, res) => {
    const { id } = req.params;
    try {
        // Verificar que el proyecto existe y obtener freelancer
        const project = await prisma.project.findUnique({
            where: { id: Number(id) },
            select: { freelancer_id: true, client_id: true }
        });

        if (!project) {
            return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
        }

        // Solo el freelancer o client pueden remover el evento
        if (req.user.user_type !== 'admin' &&
            req.user.id !== project.freelancer_id &&
            req.user.id !== project.client_id) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para remover el evento de este proyecto'
            });
        }

        const removed = await eventService.removeProjectEvent(Number(id), project.freelancer_id);

        if (removed) {
            res.json({
                success: true,
                message: 'Evento de proyecto removido del calendario'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'No se encontró evento para este proyecto'
            });
        }
    } catch (error) {
        console.error('Error al remover evento de proyecto:', error);
        res.status(500).json({ success: false, error: 'Error al remover evento de proyecto' });
    }
};


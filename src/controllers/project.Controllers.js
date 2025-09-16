const prisma = require('../database/db');

// Obtener todos los proyectos
exports.getProjects = async (req, res) => {
    try {
        // Prueba básica sin includes
        const projectCount = await prisma.project.count();

        const projects = await prisma.project.findMany();

        res.json({ success: true, data: projects, count: projectCount });
    } catch (error) {
        console.error('❌ Error completo:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error meta:', error.meta);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proyectos',
            details: error.message,
            code: error.code
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

// Obtener proyectos por cliente
exports.getProjectsByClient = async (req, res) => {
    const { clientId } = req.params;
    try {
        const projects = await prisma.project.findMany({
            where: { client_id: Number(clientId) },
            include: {
                freelancer: { select: { id: true, username: true, email: true } },
                categories: true,
                project_proposals: {
                    include: {
                        login_credentials: { select: { id: true, username: true, email: true } }
                    }
                }
            }
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener proyectos del cliente' });
    }
};

// Obtener proyectos por freelancer
exports.getProjectsByFreelancer = async (req, res) => {
    const { freelancerId } = req.params;
    try {
        const projects = await prisma.project.findMany({
            where: { freelancer_id: Number(freelancerId) },
            include: {
                client: { select: { id: true, username: true, email: true } },
                categories: true
            }
        });
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener proyectos del freelancer' });
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

// Crear proyecto
exports.createProject = async (req, res) => {
    try {
        const { title, description, budget, deadline, category_id, skills_required, priority } = req.body;

        // Validar campos requeridos (client_id se toma automáticamente del usuario autenticado)
        if (!title || !description || !budget) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: title, description, budget'
            });
        }

        const project = await prisma.project.create({
            data: {
                client_id: req.user.id, // ✅ Usar automáticamente el usuario autenticado
                title,
                description,
                budget: parseFloat(budget),
                deadline: deadline ? new Date(deadline) : null,
                category_id: category_id ? Number(category_id) : null,
                skills_required: skills_required || [],
                priority: priority || 'medium'
            },
            include: {
                client: { select: { id: true, username: true, email: true } },
                categories: true
            }
        });

        res.status(201).json({ success: true, data: project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al crear proyecto' });
    }
};

// Actualizar proyecto
exports.updateProject = async (req, res) => {
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
                    error: 'No tienes permisos para actualizar este proyecto'
                });
            }
        }

        const data = { ...req.body };
        if (data.budget) data.budget = parseFloat(data.budget);
        if (data.deadline) data.deadline = new Date(data.deadline);
        if (data.category_id) data.category_id = Number(data.category_id);
        if (data.freelancer_id) data.freelancer_id = Number(data.freelancer_id);
        if (data.completion_date) data.completion_date = new Date(data.completion_date);

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


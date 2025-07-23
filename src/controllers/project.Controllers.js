const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // ✅ Añadir logs detallados
});

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
        const { client_id, title, description, budget, deadline, category_id, skills_required, priority } = req.body;

        // Validar campos requeridos
        if (!client_id || !title || !description || !budget) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: client_id, title, description, budget'
            });
        }

        const project = await prisma.project.create({
            data: {
                client_id: Number(client_id),
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
        const data = { ...req.body };
        if (data.budget) data.budget = parseFloat(data.budget);
        if (data.deadline) data.deadline = new Date(data.deadline);
        if (data.category_id) data.category_id = Number(data.category_id);
        if (data.freelancer_id) data.freelancer_id = Number(data.freelancer_id);
        if (data.completion_date) data.completion_date = new Date(data.completion_date);

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
        await prisma.project.delete({ where: { id: Number(id) } });
        res.json({ success: true, message: 'Proyecto eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al eliminar proyecto' });
    }
};

// === PROPUESTAS ===

// Crear propuesta para proyecto
exports.createProposal = async (req, res) => {
    try {
        const { project_id, freelancer_id, proposed_budget, delivery_time, proposal_text, cover_letter, portfolio_links } = req.body;

        const proposal = await prisma.project_proposals.create({
            data: {
                project_id: Number(project_id),
                freelancer_id: Number(freelancer_id),
                proposed_budget: parseFloat(proposed_budget),
                delivery_time: Number(delivery_time),
                proposal_text,
                cover_letter,
                portfolio_links: portfolio_links || []
            },
            include: {
                login_credentials: { select: { id: true, username: true, email: true } },
                project: { select: { id: true, title: true } }
            }
        });

        res.status(201).json({ success: true, data: proposal });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al crear propuesta' });
    }
};

// Obtener propuestas de un proyecto
exports.getProjectProposals = async (req, res) => {
    const { projectId } = req.params;
    try {
        const proposals = await prisma.project_proposals.findMany({
            where: { project_id: Number(projectId) },
            include: {
                login_credentials: { select: { id: true, username: true, email: true } }
            }
        });
        res.json({ success: true, data: proposals });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener propuestas' });
    }
};

// Obtener propuestas de un freelancer
exports.getFreelancerProposals = async (req, res) => {
    const { freelancerId } = req.params;
    try {
        const proposals = await prisma.project_proposals.findMany({
            where: { freelancer_id: Number(freelancerId) },
            include: {
                project: {
                    include: {
                        client: { select: { id: true, username: true, email: true } }
                    }
                }
            }
        });
        res.json({ success: true, data: proposals });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener propuestas del freelancer' });
    }
};

// Aceptar propuesta
exports.acceptProposal = async (req, res) => {
    const { proposalId } = req.params;
    try {
        // Obtener la propuesta
        const proposal = await prisma.project_proposals.findUnique({
            where: { id: Number(proposalId) }
        });

        if (!proposal) {
            return res.status(404).json({ success: false, error: 'Propuesta no encontrada' });
        }

        // Actualizar propuesta como aceptada y proyecto con freelancer asignado
        await prisma.$transaction([
            prisma.project_proposals.update({
                where: { id: Number(proposalId) },
                data: { status: 'accepted' }
            }),
            prisma.project.update({
                where: { id: proposal.project_id },
                data: {
                    freelancer_id: proposal.freelancer_id,
                    status: 'in_progress'
                }
            }),
            // Rechazar otras propuestas del mismo proyecto
            prisma.project_proposals.updateMany({
                where: {
                    project_id: proposal.project_id,
                    id: { not: Number(proposalId) }
                },
                data: { status: 'rejected' }
            })
        ]);

        res.json({ success: true, message: 'Propuesta aceptada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al aceptar propuesta' });
    }
};

// Rechazar propuesta
exports.rejectProposal = async (req, res) => {
    const { proposalId } = req.params;
    try {
        await prisma.project_proposals.update({
            where: { id: Number(proposalId) },
            data: { status: 'rejected' }
        });

        res.json({ success: true, message: 'Propuesta rechazada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al rechazar propuesta' });
    }
};

// === REVIEWS ===

// Crear review para proyecto
exports.createReview = async (req, res) => {
    try {
        const { project_id, reviewer_id, reviewed_id, rating, comment } = req.body;

        // Verificar si ya existe una review para este proyecto
        const existingReview = await prisma.reviews.findUnique({
            where: { project_id: Number(project_id) }
        });

        if (existingReview) {
            return res.status(409).json({ 
                success: false, 
                error: 'Ya existe una review para este proyecto' 
            });
        }

        const review = await prisma.reviews.create({
            data: {
                project_id: Number(project_id),
                reviewer_id: Number(reviewer_id),
                reviewed_id: Number(reviewed_id),
                rating: Number(rating),
                comment
            },
            include: {
                login_credentials_reviews_reviewer_idTologin_credentials: { select: { id: true, username: true } },
                login_credentials_reviews_reviewed_idTologin_credentials: { select: { id: true, username: true } },
                project: { select: { id: true, title: true } }
            }
        });

        res.status(201).json({ success: true, data: review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al crear review' });
    }
};

// Obtener reviews de un usuario
exports.getUserReviews = async (req, res) => {
    const { userId } = req.params;
    try {
        const reviews = await prisma.reviews.findMany({
            where: { reviewed_id: Number(userId) },
            include: {
                login_credentials_reviews_reviewer_idTologin_credentials: { select: { id: true, username: true } },
                project: { select: { id: true, title: true } }
            }
        });
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener reviews' });
    }
};
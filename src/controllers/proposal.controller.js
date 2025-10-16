

const prisma = require('../database/db');
const eventService = require('../services/eventService');

// Crear propuesta para proyecto
exports.createProposal = async (req, res) => {
    try {
        const { project_id, proposed_budget, delivery_time, proposal_text, cover_letter, portfolio_links } = req.body;

        const proposal = await prisma.project_proposals.create({
            data: {
                project_id: Number(project_id),
                freelancer_id: req.user.id, // ✅ Usar automáticamente el usuario autenticado
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

// Obtener propuestas de un proyecto optimizado
exports.getProjectProposals = async (req, res) => {
    const { projectId } = req.params;
    const { status, include_freelancer_details = 'true' } = req.query;

    try {
        // Filtros dinámicos
        const where = { project_id: Number(projectId) };
        if (status) where.status = status;

        console.log('🔄 Getting optimized project proposals for:', projectId);

        // ✅ OPTIMIZACIÓN: Selects específicos y includes condicionales
        const includeOptions = {};

        if (include_freelancer_details === 'true') {
            includeOptions.login_credentials = {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    user_details: {
                        select: {
                            first_name: true,
                            last_name: true,
                            profile_picture: true
                        }
                    }
                }
            };
        }

        const proposals = await prisma.project_proposals.findMany({
            where,
            select: {
                id: true,
                proposed_budget: true,
                delivery_time: true,
                proposal_text: true,
                cover_letter: true,
                status: true,
                created_at: true,
                freelancer_id: true,
                ...includeOptions
            },
            orderBy: [
                { status: 'asc' }, // Pending primero
                { created_at: 'desc' }
            ]
        });

        // Estadísticas rápidas
        const stats = {
            total: proposals.length,
            by_status: {}
        };

        proposals.forEach(proposal => {
            stats.by_status[proposal.status || 'pending'] =
                (stats.by_status[proposal.status || 'pending'] || 0) + 1;
        });

        console.log('✅ Project proposals optimizadas:', stats);

        res.json({
            success: true,
            data: proposals,
            meta: {
                project_id: Number(projectId),
                stats,
                includes_freelancer_details: include_freelancer_details === 'true'
            }
        });

    } catch (error) {
        console.error('❌ Error en getProjectProposals:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener propuestas',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener propuestas de un freelancer optimizado
exports.getFreelancerProposals = async (req, res) => {
    const { freelancerId } = req.params;
    const { status, include_project_details = 'true' } = req.query;

    try {
        // Filtros dinámicos
        const where = { freelancer_id: Number(freelancerId) };
        if (status) where.status = status;

        console.log('🔄 Getting optimized freelancer proposals for:', freelancerId);

        // ✅ OPTIMIZACIÓN: Includes condicionales y selects específicos
        const includeOptions = {};

        if (include_project_details === 'true') {
            includeOptions.project = {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    budget: true,
                    status: true,
                    deadline: true,
                    created_at: true,
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
                }
            };
        }

        const proposals = await prisma.project_proposals.findMany({
            where,
            select: {
                id: true,
                project_id: true,
                proposed_budget: true,
                delivery_time: true,
                proposal_text: true,
                cover_letter: true,
                status: true,
                created_at: true,
                ...includeOptions
            },
            orderBy: [
                { status: 'asc' }, // Pending/active primero
                { created_at: 'desc' }
            ]
        });

        // Estadísticas y métricas
        const stats = {
            total: proposals.length,
            by_status: {},
            avg_proposed_budget: 0,
            total_potential_income: 0
        };

        let totalBudget = 0;
        proposals.forEach(proposal => {
            const status = proposal.status || 'pending';
            stats.by_status[status] = (stats.by_status[status] || 0) + 1;

            if (proposal.proposed_budget) {
                totalBudget += parseFloat(proposal.proposed_budget);
                if (status === 'accepted') {
                    stats.total_potential_income += parseFloat(proposal.proposed_budget);
                }
            }
        });

        stats.avg_proposed_budget = proposals.length > 0 ? totalBudget / proposals.length : 0;

        console.log('✅ Freelancer proposals optimizadas:', stats);

        res.json({
            success: true,
            data: proposals,
            meta: {
                freelancer_id: Number(freelancerId),
                stats,
                includes_project_details: include_project_details === 'true'
            }
        });

    } catch (error) {
        console.error('❌ Error en getFreelancerProposals:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener propuestas del freelancer',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Aceptar propuesta
exports.acceptProposal = async (req, res) => {
    const { proposalId } = req.params;
    try {
        // Obtener la propuesta con datos del proyecto
        const proposal = await prisma.project_proposals.findUnique({
            where: { id: Number(proposalId) },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        deadline: true,
                        client_id: true
                    }
                }
            }
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

        // Sincronizar con calendario si el proyecto tiene deadline
        let calendarEvent = null;
        if (proposal.project.deadline) {
            try {
                calendarEvent = await eventService.createProjectEvent({
                    projectId: proposal.project.id,
                    title: proposal.project.title,
                    freelancerId: proposal.freelancer_id,
                    deadline: proposal.project.deadline
                });
                console.log('✅ Evento creado en calendario para el proyecto:', proposal.project.title);
            } catch (calendarError) {
                console.warn('⚠️ No se pudo crear el evento en calendario:', calendarError.message);
                // No fallar la aceptación por error en calendario
            }
        }

        const response = {
            success: true,
            message: 'Propuesta aceptada',
            data: {
                proposalId: Number(proposalId),
                projectId: proposal.project.id,
                freelancerId: proposal.freelancer_id,
                calendarSync: calendarEvent ? true : false
            }
        };

        if (calendarEvent) {
            response.data.eventId = calendarEvent.id;
        }

        res.json(response);
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
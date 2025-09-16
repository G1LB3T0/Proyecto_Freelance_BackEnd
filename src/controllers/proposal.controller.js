

const prisma = require('../database/db');

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
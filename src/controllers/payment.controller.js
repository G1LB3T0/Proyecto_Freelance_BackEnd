const prisma = require('../database/db');

// Configuración de comisiones
const PLATFORM_COMMISSION_RATE = 0.10; // 10% de comisión

/**
 * Crear pago en escrow cuando se acepta una propuesta
 * Se llama automáticamente desde proposal.controller
 */
async function createEscrowPayment(proposalData) {
    try {
        const { proposalId, projectId, clientId, freelancerId, amount } = proposalData;

        console.log('Creando pago en escrow:', { proposalId, projectId, amount });

        // Crear transacción de escrow (dinero en custodia)
        const escrowTransaction = await prisma.transactions.create({
            data: {
                title: `Pago en Escrow - Proyecto #${projectId}`,
                user_id: clientId,
                project_id: projectId,
                type: 'expense',
                amount: amount.toString(),
                currency: 'GTQ',
                status: 'pending', // Pendiente hasta que el cliente deposite
                description: `Pago en custodia para propuesta #${proposalId}`,
                metadata: {
                    proposal_id: proposalId,
                    freelancer_id: freelancerId,
                    payment_type: 'escrow',
                    escrow_status: 'awaiting_deposit'
                }
            }
        });

        console.log('Transacción de escrow creada:', escrowTransaction.id);
        return escrowTransaction;

    } catch (error) {
        console.error('Error creando pago en escrow:', error);
        throw error;
    }
}

/**
 * Obtener estado del pago de un proyecto
 * GET /api/payments/project/:projectId
 */
async function getProjectPaymentStatus(req, res) {
    try {
        const { projectId } = req.params;

        // Obtener proyecto con propuesta aceptada
        const project = await prisma.project.findUnique({
            where: { id: Number(projectId) },
            include: {
                project_proposals: {
                    where: { status: 'accepted' }
                },
                transactions: {
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                error: 'Proyecto no encontrado' 
            });
        }

        // Calcular totales
        let totalPaid = 0;
        let escrowAmount = 0;
        let releasedAmount = 0;

        project.transactions.forEach(tx => {
            const amount = parseFloat(tx.amount);
            const metadata = tx.metadata || {};
            
            if (metadata.payment_type === 'escrow') {
                if (tx.status === 'completed') {
                    escrowAmount += amount;
                }
            } else if (metadata.payment_type === 'payout') {
                if (tx.status === 'completed') {
                    releasedAmount += amount;
                }
            }
        });

        const acceptedProposal = project.project_proposals[0];
        const expectedAmount = acceptedProposal ? parseFloat(acceptedProposal.proposed_budget) : 0;

        res.json({
            success: true,
            data: {
                project_id: project.id,
                project_status: project.status,
                expected_payment: expectedAmount,
                escrow_amount: escrowAmount,
                released_amount: releasedAmount,
                payment_status: determinePaymentStatus(project, escrowAmount, releasedAmount, expectedAmount),
                transactions: project.transactions
            }
        });

    } catch (error) {
        console.error('Error obteniendo estado de pago:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener estado de pago' 
        });
    }
}

/**
 * Cliente deposita dinero en escrow
 * POST /api/payments/escrow/deposit
 */
async function depositToEscrow(req, res) {
    try {
        const { project_id, amount, payment_method = 'bank_transfer' } = req.body;

        if (!project_id || !amount) {
            return res.status(400).json({
                success: false,
                error: 'project_id y amount son requeridos'
            });
        }

        // Verificar que el usuario es el cliente del proyecto
        const project = await prisma.project.findUnique({
            where: { id: Number(project_id) },
            include: {
                project_proposals: {
                    where: { status: 'accepted' }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                error: 'Proyecto no encontrado' 
            });
        }

        if (project.client_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Solo el cliente puede depositar fondos' 
            });
        }

        const acceptedProposal = project.project_proposals[0];
        if (!acceptedProposal) {
            return res.status(400).json({
                success: false,
                error: 'No hay propuesta aceptada para este proyecto'
            });
        }

        console.log('Procesando depósito a escrow:', { project_id, amount, payment_method });

        // Crear transacción de depósito
        const transaction = await prisma.transactions.create({
            data: {
                title: `Depósito Escrow - ${project.title}`,
                user_id: req.user.id,
                project_id: Number(project_id),
                type: 'expense',
                amount: amount.toString(),
                currency: 'GTQ',
                status: 'completed',
                description: `Fondos depositados en custodia para el proyecto`,
                metadata: {
                    proposal_id: acceptedProposal.id,
                    freelancer_id: acceptedProposal.freelancer_id,
                    payment_type: 'escrow',
                    escrow_status: 'deposited',
                    payment_method
                }
            }
        });

        console.log('Depósito completado:', transaction.id);

        res.status(201).json({
            success: true,
            message: 'Fondos depositados en escrow exitosamente',
            data: transaction
        });

    } catch (error) {
        console.error('Error en depósito a escrow:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al depositar fondos' 
        });
    }
}

/**
 * Liberar pago al freelancer cuando el proyecto se completa
 * POST /api/payments/release
 */
async function releasePayment(req, res) {
    try {
        const { project_id } = req.body;

        if (!project_id) {
            return res.status(400).json({
                success: false,
                error: 'project_id es requerido'
            });
        }

        // Obtener proyecto con todas las relaciones
        const project = await prisma.project.findUnique({
            where: { id: Number(project_id) },
            include: {
                project_proposals: {
                    where: { status: 'accepted' }
                },
                transactions: true,
                client: {
                    select: { id: true, username: true, email: true }
                },
                freelancer: {
                    select: { id: true, username: true, email: true }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ 
                success: false, 
                error: 'Proyecto no encontrado' 
            });
        }

        // Verificar que el usuario es el cliente
        if (project.client_id !== req.user.id) {
            return res.status(403).json({ 
                success: false, 
                error: 'Solo el cliente puede liberar el pago' 
            });
        }

        // Verificar que el proyecto está completado
        if (project.status !== 'completed') {
            return res.status(400).json({
                success: false,
                error: 'El proyecto debe estar completado para liberar el pago'
            });
        }

        const acceptedProposal = project.project_proposals[0];
        if (!acceptedProposal) {
            return res.status(400).json({
                success: false,
                error: 'No hay propuesta aceptada'
            });
        }

        // Verificar que hay fondos en escrow
        const escrowTransaction = project.transactions.find(tx => 
            tx.metadata?.payment_type === 'escrow' && 
            tx.status === 'completed'
        );

        if (!escrowTransaction) {
            return res.status(400).json({
                success: false,
                error: 'No hay fondos depositados en escrow'
            });
        }

        // Verificar que no se ha liberado ya
        const existingPayout = project.transactions.find(tx => 
            tx.metadata?.payment_type === 'payout'
        );

        if (existingPayout) {
            return res.status(400).json({
                success: false,
                error: 'El pago ya fue liberado'
            });
        }

        console.log('Liberando pago al freelancer:', {
            project_id,
            freelancer_id: project.freelancer_id,
            amount: acceptedProposal.proposed_budget
        });

        const amount = parseFloat(acceptedProposal.proposed_budget);
        const commission = amount * PLATFORM_COMMISSION_RATE;
        const freelancerAmount = amount - commission;

        // Crear transacciones en una transacción de BD
        const result = await prisma.$transaction(async (tx) => {
            // 1. Pago al freelancer (income para el freelancer)
            const payoutTransaction = await tx.transactions.create({
                data: {
                    title: `Pago Recibido - ${project.title}`,
                    user_id: project.freelancer_id,
                    project_id: Number(project_id),
                    type: 'income',
                    amount: freelancerAmount.toString(),
                    currency: 'GTQ',
                    status: 'completed',
                    description: `Pago por completar el proyecto`,
                    metadata: {
                        proposal_id: acceptedProposal.id,
                        payment_type: 'payout',
                        original_amount: amount,
                        commission_amount: commission,
                        commission_rate: PLATFORM_COMMISSION_RATE
                    }
                }
            });

            // 2. Comisión de la plataforma
            const commissionRecord = await tx.commissions.create({
                data: {
                    transactionId: payoutTransaction.id,
                    project_id: Number(project_id),
                    amount: commission.toString(),
                    percentage: PLATFORM_COMMISSION_RATE,
                    status: 'completed'
                }
            });

            return { payoutTransaction, commissionRecord };
        });

        console.log('Pago liberado exitosamente:', result.payoutTransaction.id);

        res.json({
            success: true,
            message: 'Pago liberado al freelancer exitosamente',
            data: {
                payout: result.payoutTransaction,
                commission: result.commissionRecord,
                summary: {
                    total_amount: amount,
                    freelancer_receives: freelancerAmount,
                    platform_commission: commission,
                    commission_rate: `${PLATFORM_COMMISSION_RATE * 100}%`
                }
            }
        });

    } catch (error) {
        console.error('Error liberando pago:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al liberar pago',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

/**
 * Obtener historial de pagos del usuario (como freelancer)
 * GET /api/payments/freelancer/history
 */
async function getFreelancerPaymentHistory(req, res) {
    try {
        const userId = req.user.id;
        const { status, limit = 50, offset = 0 } = req.query;

        const where = {
            user_id: userId,
            type: 'income',
            metadata: {
                path: ['payment_type'],
                equals: 'payout'
            }
        };

        if (status) {
            where.status = status;
        }

        const payments = await prisma.transactions.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        client: {
                            select: { id: true, username: true, email: true }
                        }
                    }
                }
            },
            orderBy: { transaction_date: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });

        // Calcular totales
        const totals = await prisma.transactions.aggregate({
            where: {
                user_id: userId,
                type: 'income',
                metadata: {
                    path: ['payment_type'],
                    equals: 'payout'
                },
                status: 'completed'
            },
            _sum: { amount: true },
            _count: true
        });

        res.json({
            success: true,
            data: payments,
            summary: {
                total_earnings: parseFloat(totals._sum.amount || 0),
                total_payments: totals._count,
                showing: payments.length
            }
        });

    } catch (error) {
        console.error('Error obteniendo historial de pagos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener historial de pagos' 
        });
    }
}

/**
 * Obtener pagos pendientes de liberar (para clientes)
 * GET /api/payments/client/pending
 */
async function getClientPendingPayments(req, res) {
    try {
        const userId = req.user.id;

        // Obtener proyectos del cliente con propuestas aceptadas (en progreso o completados)
        const projects = await prisma.project.findMany({
            where: {
                client_id: userId,
                status: { in: ['in_progress', 'completed'] },
                project_proposals: {
                    some: { status: 'accepted' }
                }
            },
            include: {
                freelancer: {
                    select: { id: true, username: true, email: true }
                },
                project_proposals: {
                    where: { status: 'accepted' }
                },
                transactions: true
            }
        });

        // Procesar cada proyecto para determinar su estado de pago
        const pendingPayments = projects.map(project => {
            const acceptedProposal = project.project_proposals[0];
            const amount = acceptedProposal ? parseFloat(acceptedProposal.proposed_budget) : 0;

            // Calcular montos depositados y liberados
            let escrowAmount = 0;
            let hasPayout = false;
            let hasEscrowRecord = false;

            project.transactions.forEach(tx => {
                if (tx.metadata?.payment_type === 'escrow') {
                    hasEscrowRecord = true;
                    if (tx.status === 'completed') {
                        escrowAmount += parseFloat(tx.amount);
                    }
                }
                if (tx.metadata?.payment_type === 'payout') {
                    hasPayout = true;
                }
            });

            // Determinar estado del pago
            let payment_status;
            let action_required;

            if (hasPayout) {
                payment_status = 'released';
                action_required = null;
            } else if (project.status === 'completed' && escrowAmount >= amount) {
                payment_status = 'ready_to_release';
                action_required = 'release';
            } else if (escrowAmount >= amount) {
                payment_status = 'escrowed';
                action_required = 'wait';
            } else if (escrowAmount > 0) {
                payment_status = 'partial_deposit';
                action_required = 'deposit_remaining';
            } else if (hasEscrowRecord) {
                // Tiene registro de escrow pero no hay depósito completado
                payment_status = 'pending_deposit';
                action_required = 'deposit';
            } else {
                // No hay ningún registro de escrow
                payment_status = 'pending_deposit';
                action_required = 'deposit';
            }

            return {
                project_id: project.id,
                project_title: project.title,
                project_status: project.status,
                freelancer: project.freelancer,
                amount: amount,
                deposited_amount: escrowAmount,
                remaining_amount: Math.max(0, amount - escrowAmount),
                payment_status,
                action_required,
                completion_date: project.completion_date,
                days_since_completion: project.completion_date 
                    ? Math.floor((new Date() - new Date(project.completion_date)) / (1000 * 60 * 60 * 24))
                    : null
            };
        }).filter(p => p.action_required !== null); // Filtrar solo los que requieren acción

        res.json({
            success: true,
            data: pendingPayments,
            count: pendingPayments.length
        });

    } catch (error) {
        console.error('Error obteniendo pagos pendientes:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al obtener pagos pendientes' 
        });
    }
}

// Función helper para determinar el estado del pago
function determinePaymentStatus(project, escrowAmount, releasedAmount, expectedAmount) {
    if (releasedAmount >= expectedAmount) {
        return 'payment_released';
    }
    if (escrowAmount >= expectedAmount) {
        return 'escrowed';
    }
    if (escrowAmount > 0) {
        return 'partial_escrow';
    }
    return 'pending_deposit';
}

module.exports = {
    createEscrowPayment,
    getProjectPaymentStatus,
    depositToEscrow,
    releasePayment,
    getFreelancerPaymentHistory,
    getClientPendingPayments
};

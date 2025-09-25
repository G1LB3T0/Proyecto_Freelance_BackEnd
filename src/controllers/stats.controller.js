const prisma = require('../database/db');

/**
 * CONTROLADOR DE ESTADÍSTICAS
 * Endpoints para dashboard y métricas de rendimiento
 */

// ========================
// 1. RESUMEN GENERAL (Overview)
// ========================

/**
 * GET /api/stats/overview
 * Resumen general de métricas: tareas, productividad, finanzas
 */
const getOverview = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const userIdInt = parseInt(userId);

        if (isNaN(userIdInt)) {
            return res.status(400).json({ error: 'userId must be a valid number' });
        }

        console.log('Getting overview for userId:', userIdInt);

        // Test each query individually
        let totalProjectsAsFreelancer;
        try {
            totalProjectsAsFreelancer = await prisma.project.count({
                where: {
                    freelancer_id: userIdInt
                }
            });
            console.log('Freelancer projects:', totalProjectsAsFreelancer);
        } catch (error) {
            console.error('Error in freelancer count:', error);
            throw error;
        }

        let totalProjectsAsClient;
        try {
            totalProjectsAsClient = await prisma.project.count({
                where: {
                    client_id: userIdInt
                }
            });
            console.log('Client projects:', totalProjectsAsClient);
        } catch (error) {
            console.error('Error in client count:', error);
            throw error;
        }

        const overview = {
            totalProjects: totalProjectsAsFreelancer + totalProjectsAsClient,
            completedProjects: 0,
            inProgressProjects: 0,
            pendingProjects: 0,
            totalIncome: 0,
            thisMonthIncome: 0,
            averageRating: 0,
            totalReviews: 0
        };

        res.json(overview);
    } catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};// ========================
// 2. RENDIMIENTO SEMANAL
// ========================

/**
 * GET /api/stats/weekly-performance
 * Rendimiento semanal por días
 */
exports.getWeeklyPerformance = async (req, res) => {
    try {
        const { userId, role, anchor } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }

        // TODO: Calcular semana basada en anchor
        const weeklyData = [
            { "day": "L", "completed": 0, "inProgress": 0, "pending": 0, "productivity": 0 },
            { "day": "M", "completed": 0, "inProgress": 0, "pending": 0, "productivity": 0 },
            { "day": "X", "completed": 0, "inProgress": 0, "pending": 0, "productivity": 0 },
            { "day": "J", "completed": 0, "inProgress": 0, "pending": 0, "productivity": 0 },
            { "day": "V", "completed": 0, "inProgress": 0, "pending": 0, "productivity": 0 },
            { "day": "S", "completed": 0, "inProgress": 0, "pending": 0, "productivity": 0 },
            { "day": "D", "completed": 0, "inProgress": 0, "pending": 0, "productivity": 0 }
        ];

        res.json({
            success: true,
            data: weeklyData
        });

    } catch (error) {
        console.error('Error en getWeeklyPerformance:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// ========================
// 3. DISTRIBUCIÓN DE TAREAS
// ========================

/**
 * GET /api/stats/task-distribution
 * Distribución de tareas por estado
 */
exports.getTaskDistribution = async (req, res) => {
    try {
        const { userId, role, from, to } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }

        const userIdInt = parseInt(userId);

        // Get project counts by status for both freelancer and client roles
        const freelancerProjects = await prisma.project.groupBy({
            by: ['status'],
            where: {
                freelancer_id: userIdInt
            },
            _count: {
                status: true
            }
        });

        const clientProjects = await prisma.project.groupBy({
            by: ['status'],
            where: {
                client_id: userIdInt
            },
            _count: {
                status: true
            }
        });

        // Combine counts
        const statusCounts = {};
        [...freelancerProjects, ...clientProjects].forEach(stat => {
            statusCounts[stat.status] = (statusCounts[stat.status] || 0) + stat._count.status;
        });

        const totalProjects = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

        // Calculate distribution
        const completedCount = statusCounts['completed'] || 0;
        const inProgressCount = statusCounts['in_progress'] || 0;
        const pendingCount = (statusCounts['open'] || 0) + (statusCounts['pending'] || 0);

        const distribution = [
            {
                "name": "Completadas",
                "value": completedCount,
                "percentage": totalProjects > 0 ? Math.round((completedCount / totalProjects) * 100) : 0,
                "color": "#10b981"
            },
            {
                "name": "En Progreso",
                "value": inProgressCount,
                "percentage": totalProjects > 0 ? Math.round((inProgressCount / totalProjects) * 100) : 0,
                "color": "#3b82f6"
            },
            {
                "name": "Pendientes",
                "value": pendingCount,
                "percentage": totalProjects > 0 ? Math.round((pendingCount / totalProjects) * 100) : 0,
                "color": "#f59e0b"
            }
        ];

        res.json({
            success: true,
            data: distribution
        });

    } catch (error) {
        console.error('Error en getTaskDistribution:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// ========================
// 4. PRODUCTIVIDAD POR HORA
// ========================

/**
 * GET /api/stats/productivity/hourly
 * Productividad por hora del día
 */
exports.getHourlyProductivity = async (req, res) => {
    try {
        const { userId, date } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }

        // TODO: Calcular productividad por horas
        const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
            hour,
            completed: 0,
            inProgress: 0
        }));

        res.json({
            success: true,
            data: hourlyData
        });

    } catch (error) {
        console.error('Error en getHourlyProductivity:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// ========================
// 5. TENDENCIA MENSUAL
// ========================

/**
 * GET /api/stats/trend/monthly
 * Tendencia mensual de tareas
 */
exports.getMonthlyTrend = async (req, res) => {
    try {
        const { userId, months = 6 } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }

        const userIdInt = parseInt(userId);
        const monthsCount = parseInt(months);
        const monthlyData = [];
        const now = new Date();

        // Generate data for the last N months
        for (let i = monthsCount - 1; i >= 0; i--) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
            const monthKey = startOfMonth.toISOString().slice(0, 7); // YYYY-MM

            // Get projects completed in this month
            const completedProjects = await prisma.project.count({
                where: {
                    freelancer_id: userIdInt,
                    status: 'completed',
                    completion_date: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });

            // Get new projects created in this month
            const newProjects = await prisma.project.count({
                where: {
                    OR: [
                        { freelancer_id: userIdInt },
                        { client_id: userIdInt }
                    ],
                    created_at: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });

            // Calculate velocity (completed/new ratio)
            const velocity = newProjects > 0 ? Math.round((completedProjects / newProjects) * 100) : 0;

            monthlyData.push({
                month: monthKey,
                completed: completedProjects,
                newTasks: newProjects,
                velocity: velocity
            });
        }

        res.json({
            success: true,
            data: monthlyData
        });

    } catch (error) {
        console.error('Error en getMonthlyTrend:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// ========================
// 6. PROGRESO POR PROYECTO
// ========================

/**
 * GET /api/stats/projects/progress
 * Progreso de tareas por proyecto
 */
exports.getProjectsProgress = async (req, res) => {
    try {
        const { userId, role, from, to } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }

        const userIdInt = parseInt(userId);

        // Get projects where user is either freelancer or client
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { freelancer_id: userIdInt },
                    { client_id: userIdInt }
                ]
            },
            select: {
                id: true,
                title: true,
                status: true,
                budget: true,
                deadline: true,
                created_at: true,
                completion_date: true,
                client: {
                    select: {
                        id: true,
                        user_details: {
                            select: {
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                },
                freelancer: {
                    select: {
                        id: true,
                        user_details: {
                            select: {
                                first_name: true,
                                last_name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 10 // Limit to most recent projects
        });

        const projectsProgress = projects.map(project => {
            // Calculate progress based on status
            let progress = 0;
            switch (project.status) {
                case 'open':
                case 'pending':
                    progress = 0;
                    break;
                case 'in_progress':
                    progress = 50; // Assume 50% for in progress
                    break;
                case 'completed':
                    progress = 100;
                    break;
                case 'cancelled':
                    progress = 0;
                    break;
                default:
                    progress = 0;
            }

            // Determine client name
            const clientName = project.client?.user_details
                ? `${project.client.user_details.first_name} ${project.client.user_details.last_name}`.trim()
                : 'Cliente';

            return {
                id: project.id,
                title: project.title,
                client: clientName,
                progress,
                status: project.status,
                budget: parseFloat(project.budget || 0),
                deadline: project.deadline ? project.deadline.toISOString().split('T')[0] : null
            };
        });

        res.json({
            success: true,
            data: projectsProgress
        });

    } catch (error) {
        console.error('Error en getProjectsProgress:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// ========================
// 7. ACTIVIDAD DE HOY
// ========================

/**
 * GET /api/stats/activity/today
 * Timeline de actividad del día actual
 */
exports.getTodayActivity = async (req, res) => {
    try {
        const { userId, role } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }

        // TODO: Obtener actividades del día
        const todayActivity = [];

        res.json({
            success: true,
            data: todayActivity
        });

    } catch (error) {
        console.error('Error en getTodayActivity:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// ========================
// 8. FINANZAS - RESUMEN
// ========================

/**
 * GET /api/stats/finance/summary
 * Resumen financiero
 */
exports.getFinanceSummary = async (req, res) => {
    try {
        const { userId, role, from, to } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }

        const userIdInt = parseInt(userId);

        // Calculate income from completed projects where user is freelancer
        const incomeData = await prisma.project.aggregate({
            where: {
                freelancer_id: userIdInt,
                status: 'completed'
            },
            _sum: {
                budget: true
            },
            _count: {
                id: true
            }
        });

        const totalIncome = parseFloat(incomeData._sum.budget || 0);
        const completedProjectsCount = incomeData._count.id || 0;

        // Calculate pending income (projects in progress)
        const pendingData = await prisma.project.aggregate({
            where: {
                freelancer_id: userIdInt,
                status: 'in_progress'
            },
            _sum: {
                budget: true
            },
            _count: {
                id: true
            }
        });

        const pendingIncome = parseFloat(pendingData._sum.budget || 0);
        const inProgressProjectsCount = pendingData._count.id || 0;

        // Calculate expenses (for simplicity, we'll estimate as 20% of income)
        const totalExpenses = totalIncome * 0.2;

        // Count projects by payment status (using project status as proxy)
        const projectStatusCounts = await prisma.project.groupBy({
            by: ['status'],
            where: {
                freelancer_id: userIdInt
            },
            _count: {
                status: true
            }
        });

        const statusCounts = {};
        projectStatusCounts.forEach(stat => {
            statusCounts[stat.status] = stat._count.status;
        });

        const financeSummary = {
            income: totalIncome,
            expenses: totalExpenses,
            balance: totalIncome - totalExpenses,
            invoices: {
                paid: statusCounts['completed'] || 0,
                pending: statusCounts['in_progress'] || 0,
                overdue: statusCounts['open'] || 0 // Consider open projects as overdue for simplicity
            }
        };

        res.json({
            success: true,
            data: financeSummary
        });

    } catch (error) {
        console.error('Error en getFinanceSummary:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// ========================
// 9. FINANZAS - SERIES
// ========================

/**
 * GET /api/stats/finance/series
 * Series temporales financieras
 */
exports.getFinanceSeries = async (req, res) => {
    try {
        const { userId, groupBy = 'month', from, to } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'userId es requerido'
            });
        }

        if (!['month', 'week'].includes(groupBy)) {
            return res.status(400).json({
                success: false,
                error: 'groupBy debe ser "month" o "week"'
            });
        }

        // TODO: Calcular series financieras
        const financeSeries = [];

        res.json({
            success: true,
            data: financeSeries
        });

    } catch (error) {
        console.error('Error en getFinanceSeries:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Exportar la función getOverview que faltaba
exports.getOverview = getOverview;
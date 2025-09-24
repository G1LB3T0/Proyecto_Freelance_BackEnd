const prisma = require('../database/db');

// Obtener estadísticas del usuario autenticado
const getUserStats = async (req, res) => {
    try {
        // Usar el ID del usuario autenticado (inyectado por authMiddleware)
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
        }

        // Obtener estadísticas usando Prisma
        const [
            projectStats,
            postsStats,
            userProfile,
            unreadNotifications
        ] = await Promise.all([
            // Estadísticas de proyectos
            prisma.project.groupBy({
                by: ['status'],
                where: {
                    OR: [
                        { client_id: userId },
                        { freelancer_id: userId }
                    ]
                },
                _count: {
                    id: true
                }
            }),

            // Estadísticas de posts
            prisma.posts.aggregate({
                where: {
                    user_id: userId
                },
                _count: {
                    id: true
                },
                _sum: {
                    likes_count: true,
                    comments_count: true
                }
            }),

            // Datos del perfil de usuario
            prisma.user_profiles.findFirst({
                where: {
                    user_id: userId
                },
                select: {
                    profile_views: true,
                    connections_count: true
                }
            }),

            // Notificaciones no leídas
            prisma.notifications.count({
                where: {
                    user_id: userId,
                    read_status: false
                }
            })
        ]);

        // Procesar estadísticas de proyectos
        const projectCounts = {
            total: 0,
            active: 0,
            completed: 0,
            pending: 0
        };

        projectStats.forEach(stat => {
            projectCounts.total += stat._count.id;
            if (stat.status === 'active') projectCounts.active = stat._count.id;
            if (stat.status === 'completed') projectCounts.completed = stat._count.id;
            if (stat.status === 'pending') projectCounts.pending = stat._count.id;
        });

        // Formatear la respuesta
        const response = {
            success: true,
            data: {
                projects: projectCounts,
                posts: {
                    total: postsStats._count.id || 0,
                    total_likes: postsStats._sum.likes_count || 0,
                    total_comments: postsStats._sum.comments_count || 0
                },
                profile: {
                    views: userProfile?.profile_views || 0,
                    connections: userProfile?.connections_count || 0
                },
                notifications: {
                    unread: unreadNotifications || 0
                }
            }
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error al obtener estadísticas del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getUserStats
};

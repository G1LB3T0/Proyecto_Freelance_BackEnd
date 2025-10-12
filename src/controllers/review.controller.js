const prisma = require('../database/db');

// === REVIEWS ===

// Crear review para proyecto
exports.createReview = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        const { project_id, reviewed_id, rating, comment } = req.body;

        if (!project_id || !reviewed_id || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: project_id, reviewed_id, rating'
            });
        }

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
                reviewer_id: req.user.id,
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

// Obtener reviews de un proyecto específico
exports.getProjectReviews = async (req, res) => {
    const { projectId } = req.params;
    try {
        const reviews = await prisma.reviews.findMany({
            where: { project_id: Number(projectId) },
            include: {
                login_credentials_reviews_reviewer_idTologin_credentials: { select: { id: true, username: true } },
                login_credentials_reviews_reviewed_idTologin_credentials: { select: { id: true, username: true } }
            }
        });
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener reviews del proyecto' });
    }
};

// Obtener estadísticas de reviews de un usuario
exports.getUserReviewStats = async (req, res) => {
    const { userId } = req.params;
    try {
        const stats = await prisma.reviews.aggregate({
            where: { reviewed_id: Number(userId) },
            _avg: { rating: true },
            _count: { id: true }
        });

        res.json({
            success: true,
            data: {
                average_rating: stats._avg.rating || 0,
                total_reviews: stats._count.id || 0
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener estadísticas de reviews' });
    }
};

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Crear una nueva publicación
const createPost = async (req, res) => {
    try {
        const { user_id } = req.query; // Temporal, luego será req.user.id
        const { title, content, image_url, category_id } = req.body;

        // Validaciones básicas
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Título y contenido son requeridos'
            });
        }

        // Obtener información del usuario para author_name y author_avatar
        const user = await prisma.login.findUnique({
            where: { id: parseInt(user_id) },
            include: {
                user_profiles: true
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Crear la publicación
        const newPost = await prisma.posts.create({
            data: {
                user_id: parseInt(user_id),
                author_name: user.user_profiles?.full_name || user.email,
                author_avatar: user.user_profiles?.profile_picture || null,
                title: title.trim(),
                content: content.trim(),
                image_url: image_url || null,
                category_id: category_id ? parseInt(category_id) : null,
                likes_count: 0,
                comments_count: 0
            },
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.status(201).json({
            success: true,
            message: 'Publicación creada exitosamente',
            data: newPost
        });

    } catch (error) {
        console.error('Error al crear publicación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

// Obtener todas las publicaciones con paginación
const getPosts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            category_id,
            user_id: filter_user_id,
            search
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Construir filtros dinámicamente
        const where = {};

        if (category_id) {
            where.category_id = parseInt(category_id);
        }

        if (filter_user_id) {
            where.user_id = parseInt(filter_user_id);
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Obtener posts con información relacionada
        const posts = await prisma.posts.findMany({
            where,
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            },
            skip: offset,
            take: parseInt(limit)
        });

        // Contar total para paginación
        const total = await prisma.posts.count({ where });

        res.json({
            success: true,
            data: {
                posts,
                pagination: {
                    current_page: parseInt(page),
                    total_pages: Math.ceil(total / parseInt(limit)),
                    total_posts: total,
                    posts_per_page: parseInt(limit),
                    has_next_page: offset + parseInt(limit) < total,
                    has_prev_page: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error al obtener publicaciones:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

// Obtener una publicación específica
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await prisma.posts.findUnique({
            where: { id: parseInt(id) },
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        if (!post) {
            return res.status(404).json({
                success: false,
                error: 'Publicación no encontrada'
            });
        }

        res.json({
            success: true,
            data: post
        });

    } catch (error) {
        console.error('Error al obtener publicación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

// Actualizar una publicación
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.query; // Temporal, luego será req.user.id
        const { title, content, image_url, category_id } = req.body;

        // Verificar que la publicación existe y pertenece al usuario
        const existingPost = await prisma.posts.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                error: 'Publicación no encontrada'
            });
        }

        if (existingPost.user_id !== parseInt(user_id)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para editar esta publicación'
            });
        }

        // Preparar datos para actualizar
        const updateData = { updated_at: new Date() };

        if (title) updateData.title = title.trim();
        if (content) updateData.content = content.trim();
        if (image_url !== undefined) updateData.image_url = image_url;
        if (category_id) updateData.category_id = parseInt(category_id);

        // Actualizar la publicación
        const updatedPost = await prisma.posts.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                categories: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Publicación actualizada exitosamente',
            data: updatedPost
        });

    } catch (error) {
        console.error('Error al actualizar publicación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

// Eliminar una publicación
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.query; // Temporal, luego será req.user.id

        // Verificar que la publicación existe y pertenece al usuario
        const existingPost = await prisma.posts.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                error: 'Publicación no encontrada'
            });
        }

        if (existingPost.user_id !== parseInt(user_id)) {
            return res.status(403).json({
                success: false,
                error: 'No tienes permisos para eliminar esta publicación'
            });
        }

        // Eliminar la publicación
        await prisma.posts.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Publicación eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar publicación:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: error.message
        });
    }
};

module.exports = {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost
};

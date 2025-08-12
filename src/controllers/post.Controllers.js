const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los posts con filtros y paginación
exports.getPosts = async (req, res) => {
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

// Obtener un post por ID
exports.getPostById = async (req, res) => {
    const { id } = req.params;
    try {
        const post = await prisma.posts.findUnique({
            where: { id: Number(id) },
            include: { login_credentials: true, categories: true }
        });
        if (!post) return res.status(404).json({ success: false, error: 'No encontrado' });
        res.json({ success: true, data: post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener post' });
    }
};

// Listar posts de un usuario
exports.getPostsByUserId = async (req, res) => {
    const { userId } = req.params;
    try {
        const posts = await prisma.posts.findMany({
            where: { user_id: Number(userId) },
            include: { categories: true }
        });
        res.json({ success: true, data: posts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al filtrar por usuario' });
    }
};

// Listar posts de una categoría
exports.getPostsByCategoryId = async (req, res) => {
    const { categoryId } = req.params;
    try {
        const posts = await prisma.posts.findMany({
            where: { category_id: Number(categoryId) },
            include: { login_credentials: true }
        });
        res.json({ success: true, data: posts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al filtrar por categoría' });
    }
};

// Crear un post
exports.createPost = async (req, res) => {
    try {
        const { user_id, title, content, image_url, category_id } = req.body;

        // Validar campos requeridos
        if (!user_id || !title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: user_id, title, content'
            });
        }

        const post = await prisma.posts.create({
            data: {
                user_id: Number(user_id),
                title,
                content,
                image_url,
                category_id: category_id ? Number(category_id) : null
            }
        });
        res.status(201).json({ success: true, data: post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al crear post' });
    }
};

// Actualizar un post
exports.updatePost = async (req, res) => {
    const { id } = req.params;
    try {
        const data = { ...req.body };
        if (data.category_id) data.category_id = Number(data.category_id);
        const post = await prisma.posts.update({
            where: { id: Number(id) },
            data
        });
        res.json({ success: true, data: post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al actualizar post' });
    }
};

// Crear una nueva publicación
exports.createPost = async (req, res) => {
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
        const user = await prisma.login_credentials.findUnique({
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
                author_name: user.user_profiles?.full_name || user.name || user.email,
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

// Eliminar un post
exports.deletePost = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.posts.delete({ where: { id: Number(id) } });
        res.json({ success: true, message: 'Post eliminado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al eliminar post' });
    }
};

// Crear nueva publicación
exports.createPost = async (req, res) => {
    try {
        const { title, content, category_id, user_id } = req.body;

        // Validaciones básicas
        if (!title || !content || !category_id || !user_id) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos obligatorios: title, content, category_id, user_id'
            });
        }

        // Crear el post
        const newPost = await prisma.posts.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                category_id: parseInt(category_id),
                user_id: parseInt(user_id),
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
            data: newPost,
            message: 'Publicación creada exitosamente'
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

// Actualizar publicación
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, category_id } = req.body;

        // Verificar que el post existe
        const existingPost = await prisma.posts.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingPost) {
            return res.status(404).json({
                success: false,
                error: 'Publicación no encontrada'
            });
        }

        // Preparar datos para actualizar
        const updateData = {};
        if (title) updateData.title = title.trim();
        if (content) updateData.content = content.trim();
        if (category_id) updateData.category_id = parseInt(category_id);
        updateData.updated_at = new Date();

        // Actualizar el post
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
            data: updatedPost,
            message: 'Publicación actualizada exitosamente'
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
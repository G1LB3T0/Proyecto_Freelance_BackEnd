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
        const { title, content, image_url, category_id } = req.body;

        // Validar campos requeridos
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: title, content'
            });
        }

        // Usar el user_id del usuario autenticado automáticamente
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        }

        const post = await prisma.posts.create({
            data: {
                user_id: req.user.id, // ID del usuario autenticado
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
        // Validación adicional: solo propietario o admin (ya validado por middleware, esto es redundante defensivo)
        if (!req.user) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });

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

// Eliminar un post
exports.deletePost = async (req, res) => {
    const { id } = req.params;
    try {
        if (!req.user) return res.status(401).json({ success: false, error: 'Usuario no autenticado' });

        await prisma.posts.delete({
            where: { id: Number(id) }
        });
        res.json({ success: true, message: 'Post eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al eliminar post' });
    }
};

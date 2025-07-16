const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los posts
exports.getPosts = async (req, res) => {
    try {
        const posts = await prisma.posts.findMany({
            include: { login_credentials: true, categories: true }
        });
        res.json({ success: true, data: posts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error al obtener posts' });
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
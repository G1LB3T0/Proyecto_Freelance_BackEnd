const { Router } = require('express');
const router = Router();

// Importar middleware de autenticación
const { authMiddleware, validateOwnership } = require('../middleware/auth');

// Importar los controladores desde un archivo separado
const {
    getPosts,
    getPostById,
    getPostsByUserId,
    getPostsByCategoryId,
    createPost,
    updatePost,
    deletePost
} = require('../controllers/post.Controllers.js'); // Asegúrate de que los controladores están en el archivo adecuado

// Definición de las rutas
router.get("/", getPosts);  // Obtener todos los posts (público)
router.get("/:id", getPostById);  // Obtener un post por ID (público)
router.get("/user/:userId", getPostsByUserId);  // Obtener posts por ID de usuario (público)
router.get("/category/:categoryId", getPostsByCategoryId);  // Obtener posts por ID de categoría (público)

// Rutas protegidas
router.post("/", authMiddleware, createPost);  // Crear un nuevo post (requiere autenticación)
router.put("/:id", authMiddleware, validateOwnership('posts', 'id', 'params', 'user_id'), updatePost);  // Actualizar un post por ID (solo el dueño)
router.delete("/:id", authMiddleware, validateOwnership('posts', 'id', 'params', 'user_id'), deletePost);  // Eliminar un post por ID (solo el dueño)

module.exports = router;




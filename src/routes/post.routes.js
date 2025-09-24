const { Router } = require('express');
const router = Router();

// Importar middleware de autenticación
const { authMiddleware, anyAuthenticated, ensurePostOwnerOrAdmin } = require('../middleware/auth');

// Importar los controladores desde un archivo separado
const {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost
} = require('../controllers/post.Controllers.js');

// RUTAS PARA PUBLICACIONES

// Rutas públicas
router.get("/", getPosts);  // Obtener todos los posts (con filtros y paginación)
router.get("/:id", getPostById);  // Obtener un post por ID

// Rutas protegidas
router.post("/", authMiddleware, anyAuthenticated, createPost);  // Crear nueva publicación
router.put("/:id", authMiddleware, anyAuthenticated, ensurePostOwnerOrAdmin, updatePost);  // Actualizar una publicación
router.delete("/:id", authMiddleware, anyAuthenticated, ensurePostOwnerOrAdmin, deletePost);  // Eliminar una publicación

module.exports = router;




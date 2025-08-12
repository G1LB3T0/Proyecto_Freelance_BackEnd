const { Router } = require('express');
const router = Router();

// Importar los controladores actualizados
const {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost
} = require('../controllers/post.Controllers.js');

// RUTAS PARA PUBLICACIONES

// Crear nueva publicación
router.post("/", createPost);

// Obtener todas las publicaciones (con filtros y paginación)
router.get("/", getPosts);

// Obtener una publicación específica
router.get("/:id", getPostById);

// Actualizar una publicación
router.put("/:id", updatePost);

// Eliminar una publicación
router.delete("/:id", deletePost);

module.exports = router;




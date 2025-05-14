const { Router } = require('express');
const router = Router();

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
router.get("/", getPosts);  // Obtener todos los posts
router.get("/:id", getPostById);  // Obtener un post por ID
router.get("/user/:userId", getPostsByUserId);  // Obtener posts por ID de usuario
router.get("/category/:categoryId", getPostsByCategoryId);  // Obtener posts por ID de categoría
router.post("/", createPost);  // Crear un nuevo post
router.put("/:id", updatePost);  // Actualizar un post por ID
router.delete("/:id", deletePost);  // Eliminar un post por ID

module.exports = router;




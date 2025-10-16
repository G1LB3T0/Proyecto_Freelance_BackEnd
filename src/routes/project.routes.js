const { Router } = require('express');
const router = Router();
const {
    authMiddleware,
    clientOnly,
    anyAuthenticated,
    validateClientOwnership,
    validateParamOwnership
} = require('../middleware/auth'); const {
    getProjects,
    getProjectById,
    getProjectsByClient,
    getProjectsByFreelancer,
    getProjectsByStatus,
    createProject,
    updateProject,
    deleteProject,
    syncProjectToCalendar,
    getMyProjectEvents,
    removeProjectEvent
} = require('../controllers/project.Controllers.js');

// === RUTAS DE PROYECTOS ===
router.get("/", authMiddleware, anyAuthenticated, getProjects);                                    // GET /projects - Todos los proyectos (autenticados)
router.get("/:id", authMiddleware, anyAuthenticated, getProjectById);                              // GET /projects/1 - Proyecto por ID (autenticados)
router.get("/client/:clientId", authMiddleware, validateParamOwnership('clientId'), getProjectsByClient);            // GET /projects/client/1 - Proyectos de un cliente (solo propios o admin)
router.get("/freelancer/:freelancerId", authMiddleware, validateParamOwnership('freelancerId'), getProjectsByFreelancer); // GET /projects/freelancer/1 - Proyectos de un freelancer (solo propios o admin)
router.get("/status/:status", authMiddleware, anyAuthenticated, getProjectsByStatus);              // GET /projects/status/open - Proyectos por estado
router.post("/", authMiddleware, clientOnly, createProject);                                 // POST /projects - Crear proyecto (automáticamente usa req.user.id)
router.put("/:id", authMiddleware, clientOnly, updateProject);                               // PUT /projects/1 - Actualizar proyecto (validar ownership en controlador)
router.delete("/:id", authMiddleware, clientOnly, deleteProject);                            // DELETE /projects/1 - Eliminar proyecto (validar ownership en controlador)

// === RUTAS DE SINCRONIZACIÓN CON CALENDARIO ===
router.post("/:id/sync-calendar", authMiddleware, anyAuthenticated, syncProjectToCalendar);        // POST /projects/1/sync-calendar - Sincronizar proyecto con calendario
router.get("/calendar/events", authMiddleware, anyAuthenticated, getMyProjectEvents);              // GET /projects/calendar/events - Obtener eventos de proyectos del usuario
router.delete("/:id/calendar-event", authMiddleware, anyAuthenticated, removeProjectEvent);        // DELETE /projects/1/calendar-event - Remover evento de proyecto

module.exports = router;
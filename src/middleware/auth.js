const jwt = require("jsonwebtoken");
const prisma = require("../database/db");

// Configuración JWT (compatible con tu implementación)
const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_super_segura";

// Middleware de autenticación (adaptado a tu estructura de datos)
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de acceso requerido",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Obtener información del usuario desde tu tabla `Login`
    const user = await prisma.login.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        email: true,
        user_type: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(403).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
};

// Middleware de roles (adaptado a tu campo `user_type`)
const roleMiddleware = (allowedUserTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      console.error('roleMiddleware: Usuario no autenticado');
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Normalizar a minúsculas para la comparación
    const userType = req.user.user_type?.toLowerCase();
    const allowedTypes = allowedUserTypes.map((type) => type.toLowerCase());

    console.log('roleMiddleware check:', {
      userType: req.user.user_type,
      userTypeNormalized: userType,
      allowedTypes,
      isAllowed: allowedTypes.includes(userType)
    });

    if (!allowedTypes.includes(userType)) {
      console.error('roleMiddleware: Acceso denegado', {
        userType,
        allowedTypes
      });
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a este recurso",
        debug: process.env.NODE_ENV === 'development' ? {
          yourType: userType,
          allowedTypes
        } : undefined
      });
    }

    console.log('roleMiddleware: Acceso permitido');
    next();
  };
};

// Middleware específico para freelancers
const freelancerOnly = roleMiddleware(["freelancer"]);

// Middleware específico para clientes/project managers/emprendedores
const clientOnly = roleMiddleware(["client", "project_manager", "emprendedor"]);

// Middleware específico para administradores
const adminOnly = roleMiddleware(["admin"]);

// Middleware para cualquier usuario autenticado
const anyAuthenticated = roleMiddleware([
  "freelancer",
  "client",
  "project_manager",
  "emprendedor",
  "admin",
]);

// Middleware de validación de ownership
const validateOwnership = (options = {}) => {
  const {
    idField = "client_id",
    source = "body",
    allowedRoles = ["client", "project_manager", "emprendedor", "admin"],
    skipForRoles = ["admin"],
  } = options;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    // Admins pueden saltarse la validación
    if (skipForRoles.includes(req.user.user_type)) {
      return next();
    }

    // Verificar que el usuario tenga un rol permitido para esta validación
    if (!allowedRoles.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: "Tipo de usuario no autorizado para esta acción",
      });
    }

    // Obtener el ID a validar según la fuente
    let providedId;
    switch (source) {
      case "params":
        providedId = req.params[idField];
        break;
      case "query":
        providedId = req.query[idField];
        break;
      case "body":
      default:
        providedId = req.body[idField];
        break;
    }

    // Si no se proporciona ID, continuar (puede ser opcional)
    if (!providedId) {
      return next();
    }

    // Validar que el ID coincida con el usuario autenticado
    if (Number(providedId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para acceder a recursos de otro usuario`,
      });
    }

    next();
  };
};

// Helpers específicos para validación de ownership
const validateClientOwnership = validateOwnership({
  idField: "client_id",
  allowedRoles: ["client", "project_manager", "emprendedor", "admin"],
});

const validateFreelancerOwnership = validateOwnership({
  idField: "freelancer_id",
  allowedRoles: ["freelancer", "admin"],
});

const validateUserOwnership = validateOwnership({
  idField: "user_id",
  allowedRoles: ["freelancer", "client", "project_manager", "emprendedor", "admin"],
});

// Helper para validar ownership en parámetros de URL
const validateParamOwnership = (paramName = "id") =>
  validateOwnership({
    idField: paramName,
    source: "params",
    allowedRoles: ["freelancer", "client", "project_manager", "emprendedor", "admin"],
  });

// === Ownership por recurso (consultando BD) ===
// Posts: solo propietario (user_id) o admin pueden modificar/eliminar
const ensurePostOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Usuario no autenticado" });
    }

    // Los admins siempre pueden
    if (req.user.user_type === "admin") return next();

    const postId = Number(req.params.id);
    if (!postId)
      return res
        .status(400)
        .json({ success: false, message: "ID de post inválido" });

    const post = await prisma.posts.findUnique({
      where: { id: postId },
      select: { user_id: true },
    });

    if (!post)
      return res
        .status(404)
        .json({ success: false, message: "Post no encontrado" });

    if (post.user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "No tienes permisos para modificar este post",
        });
    }

    next();
  } catch (error) {
    console.error("Error en ensurePostOwnerOrAdmin:", error);
    res
      .status(500)
      .json({ success: false, message: "Error de validación de ownership" });
  }
};

// Events: solo propietario (user_id) o admin pueden modificar/eliminar
const ensureEventOwnerOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Usuario no autenticado" });
    }

    if (req.user.user_type === "admin") return next();

    const eventId = Number(req.params.id);
    if (!eventId)
      return res
        .status(400)
        .json({ success: false, message: "ID de evento inválido" });

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { user_id: true },
    });

    if (!event)
      return res
        .status(404)
        .json({ success: false, message: "Evento no encontrado" });

    if (event.user_id !== req.user.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "No tienes permisos para modificar este evento",
        });
    }

    next();
  } catch (error) {
    console.error("Error en ensureEventOwnerOrAdmin:", error);
    res
      .status(500)
      .json({ success: false, message: "Error de validación de ownership" });
  }
};

module.exports = {
  authMiddleware,
  roleMiddleware,
  freelancerOnly,
  clientOnly,
  adminOnly,
  anyAuthenticated,
  validateOwnership,
  validateClientOwnership,
  validateFreelancerOwnership,
  validateUserOwnership,
  validateParamOwnership,
  ensurePostOwnerOrAdmin,
  ensureEventOwnerOrAdmin,
};

// CONSTANTES BACKEND - REFACTORIZACIÓN SPRINT 11

// Estados de proyectos (sync con frontend)
const PROJECT_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  PENDING: "pending",
  DRAFT: "draft",
};

// Tipos de usuario (sync con frontend)
const USER_TYPES = {
  FREELANCER: "freelancer",
  PROJECT_MANAGER: "project_manager",
  ADMIN: "admin",
};

// Estados de transacciones
const TRANSACTION_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

// Códigos de respuesta HTTP
const HTTP_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

module.exports = {
  PROJECT_STATUS,
  USER_TYPES,
  TRANSACTION_STATUS,
  HTTP_CODES,
};

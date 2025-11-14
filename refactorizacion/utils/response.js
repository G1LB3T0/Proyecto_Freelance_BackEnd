// RESPONSE HELPERS - REFACTORIZACIÓN SPRINT 11
// Unifica respuestas de API y manejo de errores

/**
 * Respuesta exitosa estandarizada
 * @param {Object} res - Response object
 * @param {any} data - Datos a enviar
 * @param {string} message - Mensaje opcional
 */
const sendSuccess = (res, data, message = "Success") => {
  return res.json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Respuesta de error estandarizada
 * @param {Object} res - Response object
 * @param {Error|string} error - Error a enviar
 * @param {number} code - Código HTTP
 */
const sendError = (res, error, code = 500) => {
  console.error("❌ API Error:", error);
  return res.status(code).json({
    success: false,
    error: error.message || error,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Respuesta de validación
 * @param {Object} res - Response object
 * @param {Array} errors - Errores de validación
 */
const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    error: "Validation failed",
    details: errors,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  sendSuccess,
  sendError,
  sendValidationError,
};

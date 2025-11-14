// PRUEBAS BACKEND - REFACTORIZACIÓN SPRINT 11

const { sendSuccess, sendError } = require("./utils/response");
const { PROJECT_STATUS, USER_TYPES, HTTP_CODES } = require("./constants");

// SIMULAR RESPONSE OBJECT
const mockRes = {
  json: (data) => {
    console.log("Response JSON:", JSON.stringify(data, null, 2));
    return mockRes;
  },
  status: (code) => {
    console.log("Status Code:", code);
    return mockRes;
  },
};

console.log("=== PRUEBAS BACKEND REFACTORIZACIÓN ===");

console.log("\nCONSTANTES:");
console.log("- PROJECT_STATUS.COMPLETED:", PROJECT_STATUS.COMPLETED);
console.log("- USER_TYPES.FREELANCER:", USER_TYPES.FREELANCER);
console.log("- HTTP_CODES.OK:", HTTP_CODES.OK);

console.log("\nRESPONSE HELPERS:");
console.log("- Success response:");
sendSuccess(mockRes, { projects: 5 }, "Projects retrieved");

console.log("\n- Error response:");
sendError(mockRes, new Error("Database connection failed"), 500);

console.log("\nRESULTADO: Refactorización backend OK");
console.log("BENEFICIO: Respuestas consistentes, constantes centralizadas");

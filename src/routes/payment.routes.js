const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authMiddleware, anyAuthenticated, clientOnly } = require('../middleware/auth');

// === ESTADO DE PAGOS ===
// Obtener estado del pago de un proyecto
router.get('/project/:projectId', authMiddleware, anyAuthenticated, paymentController.getProjectPaymentStatus);

// === ESCROW (CUSTODIA) ===
// Cliente deposita dinero en escrow
router.post('/escrow/deposit', authMiddleware, clientOnly, paymentController.depositToEscrow);

// === LIBERACIÓN DE PAGOS ===
// Cliente libera pago al freelancer cuando el proyecto se completa
router.post('/release', authMiddleware, clientOnly, paymentController.releasePayment);

// === HISTORIAL ===
// Historial de pagos recibidos (freelancer)
router.get('/freelancer/history', authMiddleware, anyAuthenticated, paymentController.getFreelancerPaymentHistory);

// Pagos pendientes de liberar (cliente)
router.get('/client/pending', authMiddleware, clientOnly, paymentController.getClientPendingPayments);

module.exports = router;

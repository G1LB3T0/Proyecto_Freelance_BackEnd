const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const { authMiddleware, adminOnly, anyAuthenticated } = require('../middleware/auth');

// === TRANSACCIONES ===
// Crear transacción
router.post('/transactions', authMiddleware, anyAuthenticated, financeController.createTransaction);

// Listar transacciones por usuario (con filtros)
router.get('/user/:userId/transactions', authMiddleware, anyAuthenticated, financeController.getTransactionsByUser);

// Obtener balance detallado por usuario
router.get('/user/:userId/balance', authMiddleware, anyAuthenticated, financeController.getBalanceByUser);

// Dashboard financiero completo
router.get('/user/:userId/dashboard', authMiddleware, anyAuthenticated, financeController.getFinancialDashboard);

// === CATEGORÍAS ===
// Crear categoría
router.post('/categories', authMiddleware, anyAuthenticated, financeController.createCategory);

// Listar categorías
router.get('/categories', authMiddleware, anyAuthenticated, financeController.getCategories);

// === FACTURAS ===
// Crear factura
router.post('/invoices', authMiddleware, anyAuthenticated, financeController.createInvoice);

// Listar facturas
router.get('/invoices', authMiddleware, anyAuthenticated, financeController.getInvoices);

// === RUTAS LEGACY (mantener compatibilidad) ===
router.post('/', authMiddleware, anyAuthenticated, financeController.createTransaction);
router.get('/user/:userId', authMiddleware, anyAuthenticated, financeController.getTransactionsByUser);

module.exports = router;

// src/routes/finance.routes.js
const express = require('express');
const router = express.Router();
const { authMiddleware, anyAuthenticated } = require('../middleware/auth');

const {
  getAllTransactions,
  getTransactionByIdDetailed,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listCategories,
  getSummary,
} = require('../controllers/finance.controller');

// Log route access for debugging (igual que events)
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// RUTAS ESPECÍFICAS (poner primero)
router.get('/categories', listCategories); // público o protegido según definas tu UX
router.get('/summary', authMiddleware, anyAuthenticated, getSummary);

// RUTAS BASE
router.get('/transactions', authMiddleware, anyAuthenticated, getAllTransactions);
router.post('/transactions', authMiddleware, anyAuthenticated, createTransaction);

// RUTAS DINÁMICAS (siempre al final)
router.get('/transactions/:id/detailed', authMiddleware, anyAuthenticated, getTransactionByIdDetailed);
router.get('/transactions/:id', authMiddleware, anyAuthenticated, getTransactionByIdDetailed);
router.put('/transactions/:id', authMiddleware, anyAuthenticated, updateTransaction);
router.delete('/transactions/:id', authMiddleware, anyAuthenticated, deleteTransaction);

module.exports = router;
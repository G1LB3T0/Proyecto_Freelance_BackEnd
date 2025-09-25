const express = require('express');
const {
    getOverview,
    getWeeklyPerformance,
    getTaskDistribution,
    getHourlyProductivity,
    getMonthlyTrend,
    getProjectsProgress,
    getTodayActivity,
    getFinanceSummary,
    getFinanceSeries
} = require('../controllers/stats.controller');

const router = express.Router();

// ========================
// RUTAS DE ESTADÍSTICAS
// ========================

// 1. Resumen general
router.get('/overview', getOverview);

// 2. Rendimiento semanal
router.get('/weekly-performance', getWeeklyPerformance);

// 3. Distribución de tareas
router.get('/task-distribution', getTaskDistribution);

// 4. Productividad por hora
router.get('/productivity/hourly', getHourlyProductivity);

// 5. Tendencia mensual
router.get('/trend/monthly', getMonthlyTrend);

// 6. Progreso por proyecto
router.get('/projects/progress', getProjectsProgress);

// 7. Actividad de hoy
router.get('/activity/today', getTodayActivity);

// 8. Finanzas - resumen
router.get('/finance/summary', getFinanceSummary);

// 9. Finanzas - series
router.get('/finance/series', getFinanceSeries);

module.exports = router;
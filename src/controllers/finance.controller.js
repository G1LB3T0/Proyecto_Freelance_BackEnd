// src/controllers/finance.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TIPOS = new Set(['ingreso', 'gasto']);
const ESTADOS = new Set(['pendiente', 'pagado', 'completado', 'vencido']);
const isISO = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const toNum = (v) =>
  v && typeof v === 'object' && typeof v.toNumber === 'function'
    ? v.toNumber()
    : Number(v);

// GET /api/finance/transactions
const getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      tipo,
      from,
      to,
      category_id,
      q,
      limit = 50,
      offset = 0,
    } = req.query;

    const where = { user_id: userId };

    if (tipo && TIPOS.has(tipo)) where.tipo = tipo;
    if (from || to) {
      where.fecha = {};
      if (from) {
        if (!isISO(from)) return res.status(400).json({ error: 'from inválido (YYYY-MM-DD)' });
        where.fecha.gte = new Date(from);
      }
      if (to) {
        if (!isISO(to)) return res.status(400).json({ error: 'to inválido (YYYY-MM-DD)' });
        where.fecha.lte = new Date(to);
      }
    }
    if (category_id !== undefined) where.category_id = Number(category_id);
    if (q) where.concepto = { contains: q, mode: 'insensitive' };

    const take = Math.max(1, Math.min(200, Number(limit)));
    const skip = Math.max(0, Number(offset));

    const rows = await prisma.finance_transactions.findMany({
      where,
      orderBy: [{ fecha: 'desc' }, { id: 'desc' }],
      take,
      skip,
      include: {
        finance_categories: true,
      },
    });

    // normalizamos Decimal / fecha
    const data = rows.map((t) => ({
      ...t,
      monto: toNum(t.monto),
      fecha: t.fecha.toISOString().slice(0, 10),
    }));

    res.json(data);
  } catch (err) {
    console.error('Error al obtener transacciones:', err);
    res.status(500).json({ error: 'Error al obtener transacciones' });
  }
};

// GET /api/finance/transactions/:id/detailed
const getTransactionByIdDetailed = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const tx = await prisma.finance_transactions.findFirst({
      where: { id, user_id: userId },
      include: {
        finance_categories: true,
        login_credentials: {
          select: {
            name: true,
            email: true,
            user_details: {
              select: { first_name: true, last_name: true },
            },
          },
        },
      },
    });

    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transacción no encontrada' });
    }

    res.json({
      success: true,
      data: {
        ...tx,
        monto: toNum(tx.monto),
        fecha: tx.fecha.toISOString().slice(0, 10),
      },
    });
  } catch (err) {
    console.error('Error al obtener transacción detallada:', err);
    res.status(500).json({ success: false, error: 'Error al obtener transacción detallada' });
  }
};

// POST /api/finance/transactions
const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tipo, concepto, monto, fecha, estado, category_id } = req.body;

    if (!TIPOS.has(tipo)) return res.status(400).json({ error: 'tipo inválido' });
    if (!concepto) return res.status(400).json({ error: 'concepto requerido' });
    if (!(Number.isFinite(+monto) && +monto > 0)) return res.status(400).json({ error: 'monto inválido' });
    if (!isISO(fecha)) return res.status(400).json({ error: 'fecha inválida (YYYY-MM-DD)' });
    if (estado && !ESTADOS.has(estado)) return res.status(400).json({ error: 'estado inválido' });

    const created = await prisma.finance_transactions.create({
      data: {
        user_id: userId,
        tipo,
        concepto: String(concepto),
        monto: +monto,
        fecha: new Date(fecha),
        estado: estado || (tipo === 'ingreso' ? 'pendiente' : 'pagado'),
        category_id: category_id ?? null,
      },
    });

    res.status(201).json({
      ...created,
      monto: toNum(created.monto),
      fecha: created.fecha.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error('Error al crear transacción:', err);
    res.status(400).json({ error: 'Error al crear transacción: ' + err.message });
  }
};

// PUT /api/finance/transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const { concepto, monto, fecha, estado, tipo, category_id } = req.body;

    if (tipo !== undefined && !TIPOS.has(tipo)) return res.status(400).json({ error: 'tipo inválido' });
    if (estado !== undefined && !ESTADOS.has(estado)) return res.status(400).json({ error: 'estado inválido' });
    if (monto !== undefined && !(Number.isFinite(+monto) && +monto > 0)) return res.status(400).json({ error: 'monto inválido' });
    if (fecha !== undefined && !isISO(fecha)) return res.status(400).json({ error: 'fecha inválida (YYYY-MM-DD)' });

    const { count } = await prisma.finance_transactions.updateMany({
      where: { id, user_id: userId },
      data: {
        ...(concepto !== undefined ? { concepto: String(concepto) } : {}),
        ...(monto !== undefined ? { monto: +monto } : {}),
        ...(fecha !== undefined ? { fecha: new Date(fecha) } : {}),
        ...(estado !== undefined ? { estado } : {}),
        ...(tipo !== undefined ? { tipo } : {}),
        ...(category_id !== undefined ? { category_id: category_id ?? null } : {}),
      },
    });

    if (!count) {
      return res.status(404).json({ error: 'Transacción no encontrada' });
    }

    const updated = await prisma.finance_transactions.findFirst({ where: { id, user_id: userId } });
    res.json({
      ...updated,
      monto: toNum(updated.monto),
      fecha: updated.fecha.toISOString().slice(0, 10),
    });
  } catch (err) {
    console.error('Error al actualizar transacción:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Transacción no encontrada' });
    } else {
      res.status(400).json({ error: 'Error al actualizar transacción: ' + err.message });
    }
  }
};

// DELETE /api/finance/transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);

    const { count } = await prisma.finance_transactions.deleteMany({
      where: { id, user_id: userId },
    });

    if (!count) return res.status(404).json({ error: 'Transacción no encontrada' });

    res.json({ message: 'Transacción eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar transacción:', err);
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Transacción no encontrada' });
    } else {
      res.status(400).json({ error: 'Error al eliminar transacción: ' + err.message });
    }
  }
};

// GET /api/finance/categories
const listCategories = async (_req, res) => {
  try {
    const cats = await prisma.finance_categories.findMany({ orderBy: { name: 'asc' } });
    res.json(cats);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// GET /api/finance/summary?year=2025&month=9
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || (now.getMonth() + 1);

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd   = new Date(Date.UTC(year, month, 1));
    const yearStart  = new Date(Date.UTC(year, 0, 1));
    const yearEnd    = new Date(Date.UTC(year + 1, 0, 1));

    const [sumIngMes, sumGasMes, sumIngYear] = await Promise.all([
      prisma.finance_transactions.aggregate({
        where: { user_id: userId, tipo: 'ingreso', fecha: { gte: monthStart, lt: monthEnd } },
        _sum: { monto: true },
      }),
      prisma.finance_transactions.aggregate({
        where: { user_id: userId, tipo: 'gasto',   fecha: { gte: monthStart, lt: monthEnd } },
        _sum: { monto: true },
      }),
      prisma.finance_transactions.aggregate({
        where: { user_id: userId, tipo: 'ingreso', fecha: { gte: yearStart,  lt: yearEnd } },
        _sum: { monto: true },
      }),
    ]);

    const ingresosMes  = toNum(sumIngMes._sum.monto || 0);
    const gastosMes    = toNum(sumGasMes._sum.monto || 0);
    const ingresosAnio = toNum(sumIngYear._sum.monto || 0);

    res.json({
      ingresosMes,
      gastosMes,
      balanceMes: ingresosMes - gastosMes,
      ingresosAnio,
    });
  } catch (err) {
    console.error('Error al obtener summary:', err);
    res.status(500).json({ error: 'Error al obtener summary' });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionByIdDetailed,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  listCategories,
  getSummary,
};
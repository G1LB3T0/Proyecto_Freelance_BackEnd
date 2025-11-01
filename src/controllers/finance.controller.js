const prisma = require('../database/db');
const { Prisma } = require('@prisma/client');

// Crear transacción (income/expense/payout/refund)
async function createTransaction(req, res) {
    try {
        const {
            title,
            project_id,
            user_id,
            type,
            amount,
            currency,
            status,
            transaction_date,
            description,
            category_id,
            invoice_id,
            metadata
        } = req.body;

        if (!user_id || !type || !amount || !title) {
            return res.status(400).json({
                success: false,
                message: 'user_id, type, amount y title son requeridos'
            });
        }

        const tx = await prisma.transactions.create({
            data: {
                title,
                project_id: project_id || null,
                user_id,
                type,
                amount: amount.toString(),
                currency: currency || 'GTQ',
                status: status || 'pending',
                transaction_date: transaction_date ? new Date(transaction_date) : new Date(),
                description,
                category_id: category_id || null,
                invoice_id: invoice_id || null,
                metadata: metadata || null
            },
            include: {
                category: true,
                invoice: true,
                project: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        res.status(201).json({ success: true, data: tx });
    } catch (error) {
        console.error('createTransaction error:', error);
        res.status(500).json({ success: false, message: 'Error creando transacción' });
    }
}

// Obtener transacciones por usuario con filtros
async function getTransactionsByUser(req, res) {
    try {
        const userId = Number(req.params.userId);
        const { status, category_id, type, limit = 50, offset = 0 } = req.query;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: 'userId requerido' });
        }

        // WHERE dinámico seguro usando Prisma.sql
        const whereParts = [Prisma.sql`t.user_id = ${userId}`];
        if (status) whereParts.push(Prisma.sql`t.status = ${status}`);
        if (category_id) whereParts.push(Prisma.sql`t.category_id = ${Number(category_id)}`);
        if (type) whereParts.push(Prisma.sql`t.type = ${type}`);
        const whereSql = Prisma.sql`WHERE ${Prisma.join(whereParts, Prisma.sql` AND `)}`;

        const rows = await prisma.$queryRaw`
            SELECT
                t.id,
                t.type,
                t.title,
                t.description,
                t.amount,
                t.status,
                t.transaction_date,
                t.created_at,
                COALESCE(c.name, 'Otros') AS category_name
            FROM transactions t
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            ${whereSql}
            ORDER BY t.transaction_date DESC
            LIMIT ${Number(limit)} OFFSET ${Number(offset)}
        `;

        const data = rows.map(r => ({
            id: r.id,
            type: r.type,
            title: r.title,
            description: r.description,
            amount: Number(r.amount) || 0,
            status: r.status,
            transaction_date: r.transaction_date || r.created_at,
            category: { name: r.category_name }
        }));

        return res.json({ success: true, data });
    } catch (error) {
        console.error('getTransactionsByUser error:', { message: error.message, code: error.code, stack: error.stack });
        return res.status(500).json({ success: false, message: 'Error al obtener transacciones' });
    }
}

// Dashboard financiero completo
async function getFinancialDashboard(req, res) {
    try {
        const userId = Number(req.params.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: 'userId requerido' });
        }

        // Resumen por tipo/estado (sin casts específicos del motor)
        const summary = await prisma.$queryRaw`
            SELECT 
                type,
                status,
                SUM(amount) AS total,
                COUNT(*) AS count
            FROM transactions
            WHERE user_id = ${userId}
            GROUP BY type, status
        `;

        // Agregados por categoría
        const byCategory = await prisma.$queryRaw`
            SELECT 
                c.name AS category_name,
                c.color,
                SUM(t.amount) AS total,
                COUNT(t.id) AS count
            FROM transactions t
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            WHERE t.user_id = ${userId}
            GROUP BY c.id, c.name, c.color
            ORDER BY total DESC
        `;

        // Facturas pendientes
        const pendingInvoices = await prisma.invoice.findMany({
            where: {
                transactions: { some: { user_id: userId } },
                status: { in: ['pending', 'overdue'] }
            },
            orderBy: { due_date: 'asc' }
        });

        // Próximo pago (factura más cercana)
        const nextPayment = await prisma.invoice.findFirst({
            where: {
                transactions: { some: { user_id: userId } },
                status: 'pending',
                due_date: { gte: new Date() }
            },
            orderBy: { due_date: 'asc' }
        });

        // Totales
        let totalIncome = 0, totalExpense = 0, pendingAmount = 0;
        for (const item of summary) {
            const amount = Number(item.total) || 0;
            const t = (item.type || '').toLowerCase();
            if (t === 'income') totalIncome += amount;
            if (t === 'expense') totalExpense += amount;
            if (item.status === 'pending') pendingAmount += amount;
        }

        const balance = totalIncome - totalExpense;

        return res.json({
            success: true,
            data: {
                summary: {
                    balance,
                    totalIncome,
                    totalExpense,
                    pendingAmount,
                    pendingInvoicesCount: pendingInvoices.length
                },
                byCategory,
                pendingInvoices,
                nextPayment,
                rawSummary: summary
            }
        });
    } catch (error) {
        console.error('getFinancialDashboard error:', { message: error.message, code: error.code, stack: error.stack });
        return res.status(500).json({ success: false, message: 'Error al obtener dashboard financiero' });
    }
}

// Gestión de Categorías
async function createCategory(req, res) {
    try {
        const { name, description, color } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        }

        const category = await prisma.Category.create({
            data: { name, description, color }
        });

        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('createCategory error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Ya existe una categoría con ese nombre' });
        }
        res.status(500).json({ success: false, message: 'Error creando categoría' });
    }
}

async function getCategories(req, res) {
    try {
        const rows = await prisma.$queryRaw`
            SELECT 
                c.id,
                c.name,
                c.color,
                COUNT(t.id) AS transactions_count
            FROM transaction_categories c
            LEFT JOIN transactions t ON t.category_id = c.id
            GROUP BY c.id, c.name, c.color
            ORDER BY c.name ASC
        `;
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('getCategories error:', { message: error.message, code: error.code, stack: error.stack });
        return res.status(500).json({ success: false, message: 'Error al obtener categorías' });
    }
}

// Gestión de Facturas
async function createInvoice(req, res) {
    try {
        const { invoice_number, client_name, client_email, amount, due_date, notes } = req.body;

        if (!client_name || !amount || !due_date) {
            return res.status(400).json({
                success: false,
                message: 'client_name, amount y due_date son requeridos'
            });
        }

        const invoice = await prisma.invoice.create({
            data: {
                invoice_number,
                client_name,
                client_email,
                amount: amount.toString(),
                due_date: new Date(due_date),
                notes
            }
        });

        res.status(201).json({ success: true, data: invoice });
    } catch (error) {
        console.error('createInvoice error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Ya existe una factura con ese número' });
        }
        res.status(500).json({ success: false, message: 'Error creando factura' });
    }
}

async function getInvoices(req, res) {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (status) where.status = status;

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                transactions: true,
                _count: {
                    select: { transactions: true }
                }
            },
            orderBy: { created_at: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });

        res.json({ success: true, data: invoices });
    } catch (error) {
        console.error('getInvoices error:', error);
        res.status(500).json({ success: false, message: 'Error al obtener facturas' });
    }
}

// Calcular balance por usuario (versión mejorada)
async function getBalanceByUser(req, res) {
    try {
        const userId = Number(req.params.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ success: false, message: 'userId requerido' });
        }

        const result = await prisma.$queryRaw`
            SELECT 
                type,
                status,
                SUM(amount) AS total,
                COUNT(*) AS count
            FROM transactions
            WHERE user_id = ${userId}
            GROUP BY type, status
        `;

        let totalIncome = 0, totalExpense = 0, pendingIncome = 0, pendingExpense = 0;

        for (const r of result) {
            const amt = Number(r.total) || 0;
            const t = (r.type || '').toLowerCase();
            if (t === 'income') {
                totalIncome += amt;
                if (r.status === 'pending') pendingIncome += amt;
            }
            if (t === 'expense') {
                totalExpense += amt;
                if (r.status === 'pending') pendingExpense += amt;
            }
        }

        const balance = totalIncome - totalExpense;

        return res.json({
            success: true,
            data: {
                balance,
                totalIncome,
                totalExpense,
                pendingIncome,
                pendingExpense,
                breakdown: result
            }
        });
    } catch (error) {
        console.error('getBalanceByUser error:', { message: error.message, code: error.code, stack: error.stack });
        return res.status(500).json({ success: false, message: 'Error al calcular balance' });
    }
}

module.exports = {
    createTransaction,
    getTransactionsByUser,
    getFinancialDashboard,
    getBalanceByUser,
    createCategory,
    getCategories,
    createInvoice,
    getInvoices
};

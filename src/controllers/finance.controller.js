const prisma = require('../database/db');

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

        const where = { user_id: userId };
        if (status) where.status = status;
        if (category_id) where.category_id = Number(category_id);
        if (type) where.type = type;

        const transactions = await prisma.transactions.findMany({
            where,
            include: {
                category: true,
                invoice: true,
                project: {
                    select: { id: true, title: true }
                }
            },
            orderBy: { transaction_date: 'desc' },
            take: Number(limit),
            skip: Number(offset)
        });

        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('getTransactionsByUser error:', error);
        res.status(500).json({ success: false, message: 'Error al obtener transacciones' });
    }
}

// Dashboard financiero completo
async function getFinancialDashboard(req, res) {
    try {
        const userId = Number(req.params.userId);

        // Resumen financiero
        const summary = await prisma.$queryRaw`
            SELECT 
                type,
                status,
                SUM(amount)::numeric(12,2) as total,
                COUNT(*)::integer as count
            FROM transactions
            WHERE user_id = ${userId}
            GROUP BY type, status
        `;

        // Transacciones por categoría
        const byCategory = await prisma.$queryRaw`
            SELECT 
                c.name as category_name,
                c.color,
                SUM(t.amount)::numeric(12,2) as total,
                COUNT(t.*)::integer as count
            FROM transactions t
            LEFT JOIN transaction_categories c ON t.category_id = c.id
            WHERE t.user_id = ${userId}
            GROUP BY c.id, c.name, c.color
            ORDER BY total DESC
        `;

        // Facturas pendientes
        const pendingInvoices = await prisma.invoice.findMany({
            where: {
                transactions: {
                    some: {
                        user_id: userId
                    }
                },
                status: { in: ['pending', 'overdue'] }
            },
            orderBy: { due_date: 'asc' }
        });

        // Próximo pago (factura más cercana)
        const nextPayment = await prisma.invoice.findFirst({
            where: {
                transactions: {
                    some: { user_id: userId }
                },
                status: 'pending',
                due_date: { gte: new Date() }
            },
            orderBy: { due_date: 'asc' }
        });

        // Calcular totales
        let totalIncome = 0, totalExpense = 0, pendingAmount = 0;
        summary.forEach(item => {
            const amount = parseFloat(item.total);
            const type = item.type.toLowerCase();
            if (type === 'income') totalIncome += amount;
            if (type === 'expense') totalExpense += amount;
            if (item.status === 'pending') pendingAmount += amount;
        });

        const balance = totalIncome - totalExpense;

        res.json({
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
        console.error('getFinancialDashboard error:', error);
        res.status(500).json({ success: false, message: 'Error al obtener dashboard financiero' });
    }
}

// Gestión de Categorías
async function createCategory(req, res) {
    try {
        const { name, description, color } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'El nombre es requerido' });
        }

        const category = await prisma.category.create({
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
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { transactions: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('getCategories error:', error);
        res.status(500).json({ success: false, message: 'Error al obtener categorías' });
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

        const result = await prisma.$queryRaw`
            SELECT 
                type,
                status,
                SUM(amount)::numeric(12,2) as total,
                COUNT(*)::integer as count
            FROM transactions
            WHERE user_id = ${userId}
            GROUP BY type, status
        `;

        // Transformar resultado a balance detallado
        let totalIncome = 0, totalExpense = 0, pendingIncome = 0, pendingExpense = 0;

        result.forEach(r => {
            const amt = parseFloat(r.total);
            const type = r.type.toLowerCase();
            if (type === 'income') {
                totalIncome += amt;
                if (r.status === 'pending') pendingIncome += amt;
            }
            if (type === 'expense') {
                totalExpense += amt;
                if (r.status === 'pending') pendingExpense += amt;
            }
        });

        const balance = totalIncome - totalExpense;

        res.json({
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
        console.error('getBalanceByUser error:', error);
        res.status(500).json({ success: false, message: 'Error al calcular balance' });
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

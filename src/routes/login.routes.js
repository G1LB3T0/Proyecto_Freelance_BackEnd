const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Ruta para obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const users = await prisma.login.findMany();
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener usuarios'
        });
    }
});

// Ruta para obtener un usuario por email
router.get('/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await prisma.login.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener usuario'
        });
    }
});

module.exports = router; 
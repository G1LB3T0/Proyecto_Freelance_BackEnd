const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

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

// Ruta para hacer login y generar JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que email y password no estén vacíos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario por email
        const user = await prisma.login.findUnique({
            where: { email }
        });

        // Validar existencia y contraseña
        if (!user || user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, user_type: user.user_type },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Enviar respuesta con token y datos básicos del usuario
        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    user_type: user.user_type
                },
                token: token
            }
        });

    } catch (error) {
        console.error('Error al hacer login:', error);
        res.status(500).json({
            success: false,
            error: 'Error al hacer login'
        });
    }
});

module.exports = router;

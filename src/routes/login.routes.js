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





//ruta para hacer el login 
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscamos el usuario por email
        const user = await prisma.login.findUnique({
            where: {
                email: email
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Comparamos la contraseña (sin encriptar por ahora)
        if (user.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: user
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
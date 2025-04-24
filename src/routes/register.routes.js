const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Ruta para registrar un nuevo usuario
router.post('/', async (req, res) => {
    try {
        const {
            email,
            password, // sin encriptar por ahora
            first_name,
            last_name,
            phone,
            date_of_birth,
            gender,
            country,
            postal_code
        } = req.body;

        // 1. Verificar si el email o teléfono ya existen
        const existingLogin = await prisma.login.findUnique({ where: { email } });
        const existingPhone = await prisma.user_details.findUnique({ where: { phone } });

        if (existingLogin || existingPhone) {
            return res.status(409).json({
                success: false,
                message: 'Correo o teléfono ya en uso'
            });
        }

        // 2. Crear credenciales de login
        const login = await prisma.login.create({
            data: {
                email,
                password // sin encriptar por ahora
            }
        });

        // 3. Crear detalles del usuario
        const userDetails = await prisma.user_details.create({
            data: {
                user_id: login.id,
                first_name,
                last_name,
                phone,
                date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
                gender,
                country,
                postal_code
            }
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado con éxito',
            data: {
                id: userDetails.id,
                email: login.email,
                nombre: userDetails.first_name,
                apellido: userDetails.last_name
            }
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar usuario'
        });
    }
});

module.exports = router;

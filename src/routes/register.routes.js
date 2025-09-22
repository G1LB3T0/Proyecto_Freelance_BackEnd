const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Ruta para registrar un nuevo usuario
router.post('/', async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            username,
            date_of_birth,
            gender,
            country,
            postal_code,
            user_type = 'freelancer'
        } = req.body;

        // Validaciones
        if (!email || !password || !first_name || !last_name || !username) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos obligatorios deben estar presentes'
            });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Formato de email inválido'
            });
        }

        // Validar contraseña
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // 1. Verificar si el email o username ya existen
        const existingLogin = await prisma.login.findUnique({ where: { email } });
        const existingUser = await prisma.login.findUnique({ where: { username } });

        if (existingLogin) {
            return res.status(409).json({
                success: false,
                error: 'El email ya está en uso'
            });
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'El username ya está en uso'
            });
        }

        // (Se omite manejo de teléfono; el modelo solo define phone_e164 y no se usa en este flujo mínimo)

        // 2. Crear credenciales de login
        const login = await prisma.login.create({
            data: {
                email,
                password,
                username,
                user_type
            }
        });

        // 3. Crear detalles del usuario
        const userDetails = await prisma.user_details.create({
            data: {
                user_id: login.id,
                first_name,
                last_name,
                date_of_birth: date_of_birth ? new Date(date_of_birth) : undefined,
                gender,
                country,
                postal_code
            }
        });

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: userDetails.id,
                    email: login.email,
                    nombre: userDetails.first_name,
                    apellido: userDetails.last_name,
                    username: login.username,
                }
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

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { authMiddleware } = require('../middleware/auth');
const prisma = require('../database/db');

const router = express.Router();

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_super_segura';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

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

        // Buscar usuario por email e incluir sus detalles
        const user = await prisma.login.findUnique({
            where: { email },
            include: {
                user_details: true  // Incluir los detalles del usuario
            }
        });

        console.log('👤 Usuario encontrado:', {
            id: user?.id,
            username: user?.username,
            user_details: user?.user_details
        });

        // Validar existencia del usuario
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Validar contraseña (usando bcrypt si está hasheada, sino comparación directa)
        const isPasswordValid = user.password.startsWith('$2b$')
            ? await bcrypt.compare(password, user.password)
            : user.password === password;

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Crear payload del token con información esencial
        const tokenPayload = {
            id: user.id,
            username: user.username,
            email: user.email,
            user_type: user.user_type
        };

        // Generar token JWT (JWT se encarga del iat y exp automáticamente)
        const token = jwt.sign(
            tokenPayload,
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Preparar datos del usuario para la respuesta
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            user_type: user.user_type,
            name: user.name,
            // Incluir datos de user_details si existen
            first_name: user.user_details?.first_name || null,
            last_name: user.user_details?.last_name || null,
            phone: user.user_details?.phone_e164 || null,
            country: user.user_details?.country || null,
            full_name: user.user_details?.first_name && user.user_details?.last_name
                ? `${user.user_details.first_name} ${user.user_details.last_name}`
                : user.name || user.username
        };

        console.log('📦 Datos de usuario preparados:', userData);

        // Enviar respuesta con token y datos completos del usuario
        res.status(200).json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: userData,
                token: token,
                expiresIn: JWT_EXPIRES_IN
            }
        });

    } catch (error) {
        console.error('Error al hacer login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    }
});

// Ruta para verificar si el token es válido
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        // El middleware ya verificó el token y cargó datos actualizados del usuario
        res.status(200).json({
            success: true,
            message: 'Token válido',
            data: {
                user: req.user
            }
        });
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para refrescar token
router.post('/refresh', authMiddleware, async (req, res) => {
    try {
        // Generar nuevo token con los datos actuales del usuario
        const newTokenPayload = {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            user_type: req.user.user_type
        };

        const newToken = jwt.sign(
            newTokenPayload,
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(200).json({
            success: true,
            message: 'Token renovado exitosamente',
            data: {
                token: newToken,
                expiresIn: JWT_EXPIRES_IN
            }
        });
    } catch (error) {
        console.error('Error al refrescar token:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// Ruta para cerrar sesión
router.post('/logout', authMiddleware, (req, res) => {
    try {
        // No se revoca el token en backend; el cliente debe eliminarlo del almacenamiento.
        res.status(200).json({
            success: true,
            message: 'Sesión cerrada. Elimina el token almacenado en el cliente.',
            data: {
                user: {
                    id: req.user.id,
                    username: req.user.username,
                    email: req.user.email,
                    user_type: req.user.user_type
                }
            }
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;

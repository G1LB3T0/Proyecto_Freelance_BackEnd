const prisma = require('../database/db');

// Obtener configuración del usuario
exports.getUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const userDetails = await prisma.user_details.findUnique({
            where: { user_id: userId },
            select: {
                first_name: true,
                last_name: true,
                phone: true,
                phone_e164: true,
                bio: true,
                profile_picture: true,
                website_url: true,
                location: true,
                date_of_birth: true,
                gender: true,
                country: true,
                postal_code: true
            }
        });

        // Obtener enlaces sociales
        const socialLinks = await prisma.user_social_links.findMany({
            where: { user_id: userId },
            select: {
                id: true,
                platform: true,
                url: true
            }
        });

        res.json({
            success: true,
            data: {
                ...userDetails,
                social_links: socialLinks
            }
        });
    } catch (error) {
        console.error('Error getting user settings:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener configuración del usuario'
        });
    }
};

// Actualizar configuración del usuario
exports.updateUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            first_name,
            last_name,
            phone,
            phone_e164,
            bio,
            website_url,
            location,
            date_of_birth,
            gender,
            country,
            postal_code
        } = req.body;

        // Validaciones
        if (bio && bio.length > 1000) {
            return res.status(400).json({
                success: false,
                error: 'La biografía no puede exceder 1000 caracteres'
            });
        }

        if (first_name && (!isValidName(first_name) || first_name.length > 50)) {
            return res.status(400).json({
                success: false,
                error: 'El nombre solo puede contener letras, espacios y tildes (máx 50 caracteres)'
            });
        }

        if (last_name && (!isValidName(last_name) || last_name.length > 50)) {
            return res.status(400).json({
                success: false,
                error: 'El apellido solo puede contener letras, espacios y tildes (máx 50 caracteres)'
            });
        }

        if (website_url && !isValidURL(website_url)) {
            return res.status(400).json({
                success: false,
                error: 'La URL del sitio web no es válida'
            });
        }

        if (location && location.length > 150) {
            return res.status(400).json({
                success: false,
                error: 'La ubicación no puede exceder 150 caracteres'
            });
        }

        // Preparar datos para actualizar
        const updateData = {};
        if (first_name !== undefined) updateData.first_name = sanitizeName(first_name);
        if (last_name !== undefined) updateData.last_name = sanitizeName(last_name);
        if (phone !== undefined) updateData.phone = phone;
        if (phone_e164 !== undefined) updateData.phone_e164 = phone_e164;
        if (bio !== undefined) updateData.bio = sanitizeBio(bio);
        if (website_url !== undefined) updateData.website_url = normalizeURL(website_url);
        if (location !== undefined) updateData.location = sanitizeText(location);
        if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
        if (gender !== undefined) updateData.gender = gender;
        if (country !== undefined) updateData.country = country;
        if (postal_code !== undefined) updateData.postal_code = postal_code;

        updateData.updated_at = new Date();

        // Actualizar o crear user_details
        const updatedUserDetails = await prisma.user_details.upsert({
            where: { user_id: userId },
            update: updateData,
            create: {
                user_id: userId,
                ...updateData
            }
        });

        res.json({
            success: true,
            data: updatedUserDetails,
            message: 'Configuración actualizada correctamente'
        });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar configuración del usuario'
        });
    }
};

// Gestionar enlaces sociales
exports.updateSocialLinks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { social_links } = req.body; // Array de { platform, url }

        if (!Array.isArray(social_links)) {
            return res.status(400).json({
                success: false,
                error: 'social_links debe ser un array'
            });
        }

        // Validar cada enlace
        for (const link of social_links) {
            if (!link.platform || !link.url) {
                return res.status(400).json({
                    success: false,
                    error: 'Cada enlace debe tener platform y url'
                });
            }

            if (!isValidURL(link.url)) {
                return res.status(400).json({
                    success: false,
                    error: `URL inválida para ${link.platform}`
                });
            }
        }

        // Eliminar enlaces existentes y crear nuevos (estrategia simple)
        await prisma.user_social_links.deleteMany({
            where: { user_id: userId }
        });

        // Crear nuevos enlaces
        const createdLinks = await prisma.user_social_links.createMany({
            data: social_links.map(link => ({
                user_id: userId,
                platform: link.platform.toLowerCase(),
                url: normalizeURL(link.url)
            }))
        });

        res.json({
            success: true,
            data: createdLinks,
            message: 'Enlaces sociales actualizados correctamente'
        });
    } catch (error) {
        console.error('Error updating social links:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar enlaces sociales'
        });
    }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere contraseña actual y nueva contraseña'
            });
        }

        if (new_password.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'La nueva contraseña debe tener al menos 8 caracteres'
            });
        }

        // Obtener usuario actual
        const user = await prisma.login.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // TODO: Verificar contraseña actual con bcrypt
        // const isValidPassword = await bcrypt.compare(current_password, user.password);
        // if (!isValidPassword) {
        //     return res.status(401).json({
        //         success: false,
        //         error: 'Contraseña actual incorrecta'
        //     });
        // }

        // Por ahora comparación simple (cambiar por bcrypt)
        if (user.password !== current_password) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña actual incorrecta'
            });
        }

        // TODO: Hash nueva contraseña con bcrypt
        // const hashedPassword = await bcrypt.hash(new_password, 10);

        // Actualizar contraseña
        await prisma.login.update({
            where: { id: userId },
            data: {
                password: new_password // TODO: usar hashedPassword
            }
        });

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            error: 'Error al cambiar contraseña'
        });
    }
};

// Funciones auxiliares de validación y sanitización
function isValidName(name) {
    // Acepta letras, espacios, tildes, apostrofes y guiones
    const nameRegex = /^[\p{L}\p{M}'\-\s]+$/u;
    return nameRegex.test(name);
}

function isValidURL(url) {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
}

function sanitizeName(name) {
    if (!name) return name;
    // Trim y colapsar espacios múltiples
    return name.trim().replace(/\s+/g, ' ');
}

function sanitizeBio(bio) {
    if (!bio) return bio;
    // Trim y limitar longitud
    return bio.trim().substring(0, 1000);
}

function sanitizeText(text) {
    if (!text) return text;
    return text.trim().replace(/\s+/g, ' ');
}

function normalizeURL(url) {
    if (!url) return url;
    // Asegurar https y quitar trailing slash
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
        normalized = 'https://' + normalized;
    }
    return normalized.replace(/\/$/, '');
}
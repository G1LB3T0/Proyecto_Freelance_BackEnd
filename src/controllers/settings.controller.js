const prisma = require('../database/db');

// Obtener la configuración agregada/derivada del usuario
const getUserSettings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    // Obtener user_details, social links y perfil
    const [details, socials, profile] = await Promise.all([
      prisma.user_details.findUnique({ where: { user_id: userId } }),
      prisma.user_social_links.findMany({ where: { user_id: userId } }),
      prisma.user_profiles.findUnique({ where: { user_id: userId } })
    ]);

    const socialLinks = {};
    (socials || []).forEach(s => {
      socialLinks[s.platform] = s.url;
    });

    const settings = {
      phone_e164: details?.phone_e164 || '',
      bio: details?.bio || profile?.bio || '',
      location: details?.location || '',
      website_url: details?.website_url || '',
      profile_picture: details?.profile_picture || profile?.avatar || null,
      first_name: details?.first_name || '',
      last_name: details?.last_name || '',
      social_links: socialLinks
    };

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error al obtener settings del usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Obtener información del perfil básica (similar a login.verify)
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const user = await prisma.login.findUnique({
      where: { id: userId },
      include: { user_details: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      user_type: user.user_type,
      name: user.name,
      first_name: user.user_details?.first_name || null,
      last_name: user.user_details?.last_name || null,
      phone: user.user_details?.phone_e164 || null,
      country: user.user_details?.country || null,
      full_name: user.user_details?.first_name && user.user_details?.last_name
        ? `${user.user_details.first_name} ${user.user_details.last_name}`
        : user.name || user.username
    };

    return res.status(200).json({ success: true, data: { user: userData } });
  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Actualizar settings (user_details y social links)
const updateUserSettings = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const payload = req.body || {};

    // Actualizar o crear user_details
    const detailsData = {
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone_e164: payload.phone_e164,
      bio: payload.bio,
      location: payload.location,
      website_url: payload.website_url,
      profile_picture: payload.profile_picture
    };

    // Limpiar undefined
    Object.keys(detailsData).forEach(k => detailsData[k] === undefined && delete detailsData[k]);

    const existing = await prisma.user_details.findUnique({ where: { user_id: userId } });
    if (existing) {
      await prisma.user_details.update({ where: { user_id: userId }, data: detailsData });
    } else {
      await prisma.user_details.create({ data: { user_id: userId, ...detailsData } });
    }

    // Manejar social links (espera un objeto social_links: { linkedin, github, ... })
    const socialLinks = payload.social_links || {};
    const platforms = Object.keys(socialLinks);
    for (const platform of platforms) {
      const url = socialLinks[platform];
      if (!url) continue;
      // Upsert by unique [user_id, platform]
      await prisma.user_social_links.upsert({
        where: { user_id_platform: { user_id: userId, platform } },
        update: { url },
        create: { user_id: userId, platform, url }
      });
    }

    return res.status(200).json({ success: true, message: 'Configuración actualizada' });
  } catch (error) {
    console.error('Error al actualizar settings del usuario:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Se requieren ambas contraseñas' });
    }

    const user = await prisma.login.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    // Comparación simple (sin encriptado)
    if (user.password !== current_password) {
      return res.status(403).json({ success: false, message: 'Contraseña actual incorrecta' });
    }

    // Actualizar contraseña en texto plano (sin hash)
    await prisma.login.update({ where: { id: userId }, data: { password: new_password } });

    return res.status(200).json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// Subir avatar (acepta base64 o URL en body.avatar)
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Usuario no autenticado' });

    const { avatar } = req.body || {};
    if (!avatar) return res.status(400).json({ success: false, message: 'Avatar requerido' });

    const existing = await prisma.user_details.findUnique({ where: { user_id: userId } });
    if (existing) {
      await prisma.user_details.update({ where: { user_id: userId }, data: { profile_picture: avatar } });
    } else {
      await prisma.user_details.create({ data: { user_id: userId, profile_picture: avatar } });
    }

    return res.status(200).json({ success: true, message: 'Avatar actualizado', data: { profile_picture: avatar } });
  } catch (error) {
    console.error('Error al subir avatar:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  getUserSettings,
  getUserProfile,
  updateUserSettings,
  changePassword,
  uploadAvatar
};

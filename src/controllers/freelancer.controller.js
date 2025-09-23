const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los usuarios (freelancers y project managers)
exports.getAllFreelancers = async (req, res) => {
    try {
        const users = await prisma.login.findMany({
            where: {
                user_type: {
                    in: ['freelancer', 'project_manager']
                }
            },
            include: {
                user_details: true,
                freelancer_skills: {
                    include: {
                        skills: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error al obtener freelancers:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Filtrar freelancers por skill específica
exports.getFreelancersBySkill = async (req, res) => {
    try {
        const { skillName } = req.params;
        const freelancers = await prisma.login.findMany({
            where: {
                user_type: 'freelancer',
                freelancer_skills: {
                    some: {
                        skills: {
                            name: {
                                contains: skillName,
                                mode: 'insensitive'
                            }
                        }
                    }
                }
            },
            include: {
                user_details: true,
                freelancer_skills: {
                    include: {
                        skills: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: freelancers
        });
    } catch (error) {
        console.error('Error al filtrar freelancers por skill:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Filtrar freelancers por nivel de competencia mínimo
exports.getFreelancersBySkillAndLevel = async (req, res) => {
    try {
        const { skillName, minLevel } = req.params;
        const freelancers = await prisma.login.findMany({
            where: {
                user_type: 'freelancer',
                freelancer_skills: {
                    some: {
                        skills: {
                            name: {
                                contains: skillName,
                                mode: 'insensitive'
                            }
                        },
                        proficiency_level: {
                            gte: parseInt(minLevel)
                        }
                    }
                }
            },
            include: {
                user_details: true,
                freelancer_skills: {
                    include: {
                        skills: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: freelancers
        });
    } catch (error) {
        console.error('Error al filtrar freelancers por skill y nivel:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Filtrar freelancers por país
exports.getFreelancersByCountry = async (req, res) => {
    try {
        const { country } = req.params;
        const freelancers = await prisma.login.findMany({
            where: {
                user_type: 'freelancer',
                user_details: {
                    country: {
                        contains: country,
                        mode: 'insensitive'
                    }
                }
            },
            include: {
                user_details: true,
                freelancer_skills: {
                    include: {
                        skills: true
                    }
                }
            }
        });

        res.json({
            success: true,
            data: freelancers
        });
    } catch (error) {
        console.error('Error al filtrar freelancers por país:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
}; 
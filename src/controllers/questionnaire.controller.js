const prisma = require('../database/db');
const crypto = require('crypto');

/**
 * CONTROLADOR DE CUESTIONARIOS DE PROYECTO
 * Maneja el guardado y recuperación de respuestas del cuestionario
 * antes y durante la creación de proyectos
 */

// Crear o actualizar respuestas del cuestionario
exports.saveQuestionnaireResponses = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        const {
            session_id,
            project_id,
            project_type,
            project_scope,
            timeline,
            budget_range,
            technical_level,
            preferred_tools,
            design_provided,
            content_ready,
            communication_frequency,
            meeting_preference,
            timezone,
            special_requirements,
            target_audience,
            success_metrics,
            inspiration_links,
            competitor_analysis,
            is_complete
        } = req.body;

        // Generar session_id si no se proporciona
        const sessionId = session_id || crypto.randomUUID();

        // Calcular porcentaje de completitud
        const totalFields = 16; // Campos principales del cuestionario
        const filledFields = [
            project_type, project_scope, timeline, budget_range,
            technical_level, preferred_tools, design_provided, content_ready,
            communication_frequency, meeting_preference, timezone,
            special_requirements, target_audience, success_metrics,
            inspiration_links, competitor_analysis
        ].filter(field => field !== undefined && field !== null && field !== '').length;

        const completion_percentage = Math.round((filledFields / totalFields) * 100);

        console.log('🔄 Guardando respuestas del cuestionario para usuario:', userId);

        // Buscar respuesta existente
        let existingResponse = null;

        if (project_id) {
            existingResponse = await prisma.project_questionnaire_responses.findUnique({
                where: { project_id: Number(project_id) }
            });
        } else if (sessionId) {
            existingResponse = await prisma.project_questionnaire_responses.findUnique({
                where: { session_id: sessionId }
            });
        }

        const responseData = {
            user_id: userId,
            session_id: sessionId,
            project_id: project_id ? Number(project_id) : null,
            project_type,
            project_scope,
            timeline,
            budget_range,
            technical_level,
            preferred_tools: preferred_tools || [],
            design_provided: Boolean(design_provided),
            content_ready: Boolean(content_ready),
            communication_frequency,
            meeting_preference,
            timezone,
            special_requirements,
            target_audience,
            success_metrics,
            inspiration_links: inspiration_links || [],
            competitor_analysis,
            is_complete: Boolean(is_complete),
            completion_percentage,
            updated_at: new Date()
        };

        let questionnaireResponse;

        if (existingResponse) {
            // Actualizar respuesta existente
            questionnaireResponse = await prisma.project_questionnaire_responses.update({
                where: { id: existingResponse.id },
                data: responseData
            });
        } else {
            // Crear nueva respuesta
            questionnaireResponse = await prisma.project_questionnaire_responses.create({
                data: responseData
            });
        }

        console.log('✅ Respuestas del cuestionario guardadas:', {
            id: questionnaireResponse.id,
            session_id: questionnaireResponse.session_id,
            completion_percentage: questionnaireResponse.completion_percentage,
            is_complete: questionnaireResponse.is_complete
        });

        res.status(existingResponse ? 200 : 201).json({
            success: true,
            message: existingResponse ? 'Cuestionario actualizado' : 'Cuestionario guardado',
            data: {
                id: questionnaireResponse.id,
                session_id: questionnaireResponse.session_id,
                project_id: questionnaireResponse.project_id,
                completion_percentage: questionnaireResponse.completion_percentage,
                is_complete: questionnaireResponse.is_complete,
                created_at: questionnaireResponse.created_at,
                updated_at: questionnaireResponse.updated_at
            }
        });

    } catch (error) {
        console.error('❌ Error al guardar cuestionario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Obtener respuestas del cuestionario
exports.getQuestionnaireResponses = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { session_id, project_id } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        let where = { user_id: userId };

        if (project_id) {
            where.project_id = Number(project_id);
        } else if (session_id) {
            where.session_id = session_id;
        }

        console.log('🔄 Obteniendo respuestas del cuestionario:', where);

        const questionnaireResponse = await prisma.project_questionnaire_responses.findFirst({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        created_at: true
                    }
                }
            }
        });

        if (!questionnaireResponse) {
            return res.status(404).json({
                success: false,
                error: 'No se encontraron respuestas del cuestionario'
            });
        }

        console.log('✅ Respuestas del cuestionario encontradas:', questionnaireResponse.id);

        res.json({
            success: true,
            data: questionnaireResponse
        });

    } catch (error) {
        console.error('❌ Error al obtener cuestionario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Listar cuestionarios del usuario
exports.getUserQuestionnaires = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 10, is_complete } = req.query;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const where = { user_id: userId };

        if (is_complete !== undefined) {
            where.is_complete = is_complete === 'true';
        }

        console.log('🔄 Listando cuestionarios del usuario:', userId);

        const [questionnaires, total] = await Promise.all([
            prisma.project_questionnaire_responses.findMany({
                where,
                select: {
                    id: true,
                    session_id: true,
                    project_id: true,
                    project_type: true,
                    project_scope: true,
                    budget_range: true,
                    completion_percentage: true,
                    is_complete: true,
                    created_at: true,
                    updated_at: true,
                    project: {
                        select: {
                            id: true,
                            title: true,
                            status: true
                        }
                    }
                },
                orderBy: { updated_at: 'desc' },
                skip: offset,
                take: parseInt(limit)
            }),
            prisma.project_questionnaire_responses.count({ where })
        ]);

        // Estadísticas rápidas
        const stats = {
            total,
            completed: questionnaires.filter(q => q.is_complete).length,
            incomplete: questionnaires.filter(q => !q.is_complete).length,
            with_project: questionnaires.filter(q => q.project_id).length
        };

        console.log('✅ Cuestionarios listados:', stats);

        res.json({
            success: true,
            data: questionnaires,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(total / parseInt(limit)),
                total_items: total,
                items_per_page: parseInt(limit),
                has_next_page: offset + parseInt(limit) < total,
                has_prev_page: parseInt(page) > 1
            },
            stats
        });

    } catch (error) {
        console.error('❌ Error al listar cuestionarios:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Asociar cuestionario con proyecto creado
exports.linkQuestionnaireToProject = async (req, res) => {
    try {
        const { session_id, project_id } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        if (!session_id || !project_id) {
            return res.status(400).json({
                success: false,
                error: 'session_id y project_id son requeridos'
            });
        }

        console.log('🔄 Asociando cuestionario con proyecto:', { session_id, project_id });

        // Verificar que el proyecto pertenece al usuario
        const project = await prisma.project.findFirst({
            where: {
                id: Number(project_id),
                client_id: userId
            }
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                error: 'Proyecto no encontrado o no autorizado'
            });
        }

        // Actualizar el cuestionario con el project_id
        const questionnaireResponse = await prisma.project_questionnaire_responses.update({
            where: { session_id },
            data: {
                project_id: Number(project_id),
                updated_at: new Date()
            }
        });

        console.log('✅ Cuestionario asociado con proyecto:', questionnaireResponse.id);

        res.json({
            success: true,
            message: 'Cuestionario asociado con proyecto exitosamente',
            data: {
                id: questionnaireResponse.id,
                session_id: questionnaireResponse.session_id,
                project_id: questionnaireResponse.project_id
            }
        });

    } catch (error) {
        console.error('❌ Error al asociar cuestionario con proyecto:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
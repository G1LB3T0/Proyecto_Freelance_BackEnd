import request from 'supertest'
import { app } from '../../index.js'

// Credenciales e IDs de usuarios seed usados en los tests
export const TEST_USERS = {
    freelancer: {
        id: 1,
        email: 'jperez@gmail.com',
        password: 'donjuan217',
        user_type: 'freelancer'
    },
    freelancer_alt: {
        id: 3,
        email: 'carlossanchez@icloud.com',
        password: 'donjuan217',
        user_type: 'freelancer'
    },
    project_manager: {
        id: 2,
        email: 'pablo456@gmail.com',
        password: 'hola456',
        user_type: 'project_manager'
    },
    project_manager_alt: {
        id: 4,
        email: 'lauraramirez@icloud.com',
        password: 'capi789',
        user_type: 'project_manager'
    }
}

/**
 * Obtiene un token JWT válido para un usuario específico
 * @param {string} userType - Tipo de usuario: 'freelancer', 'client', 'project_manager', 'existing' 
 * @returns {Promise<string>} Token JWT
 */
export async function getAuthToken(userType = 'freelancer') {
    const user = TEST_USERS[userType]

    if (!user) {
        throw new Error(`Usuario de tipo "${userType}" no encontrado`)
    }

    const loginResponse = await request(app)
        .post('/login/login')
        .send({
            email: user.email,
            password: user.password
        })
        .expect(200)

    if (!loginResponse.body.success || !loginResponse.body.data.token) {
        throw new Error(`Failed to get auth token for ${userType}: ${JSON.stringify(loginResponse.body)}`)
    }

    return loginResponse.body.data.token
}

/**
 * Crea headers de autorización para requests autenticados
 * @param {string} token - Token JWT
 * @returns {Object} Headers con Authorization
 */
export function createAuthHeaders(token) {
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
}

/**
 * Helper para hacer requests autenticados
 * @param {Object} requestObj - Objeto request de supertest
 * @param {string} userType - Tipo de usuario para obtener token
 * @returns {Promise<Object>} Request con headers de autorización
 */
export async function authenticateRequest(requestObj, userType = 'freelancer') {
    const token = await getAuthToken(userType)
    const configuredRequest = requestObj.set(createAuthHeaders(token))
    // Retornamos el request envuelto para evitar que await lo resuelva como promesa
    return {
        request: configuredRequest,
        token
    }
}

/**
 * Obtiene múltiples tokens para diferentes tipos de usuarios
 * @returns {Promise<Object>} Objeto con tokens para cada tipo de usuario
 */
export async function getAllAuthTokens() {
    const tokens = {}

    for (const [userType] of Object.entries(TEST_USERS)) {
        try {
            tokens[userType] = await getAuthToken(userType)
        } catch (error) {
            console.warn(`No se pudo obtener token para ${userType}:`, error.message)
            tokens[userType] = null
        }
    }

    return tokens
}

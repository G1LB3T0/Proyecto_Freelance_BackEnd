import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { authenticateRequest, createAuthHeaders, getAllAuthTokens, TEST_USERS } from '../helpers/auth.js'

describe('Reviews API', () => {
    let tokens = {}
    let seededProjectId
    let testReviewId

    beforeAll(async () => {
        tokens = await getAllAuthTokens()

        if (!tokens.project_manager) {
            throw new Error('No se pudo obtener token de project_manager para las pruebas de reviews')
        }

        const projectPayload = {
            title: 'Proyecto para reviews API test',
            description: 'Proyecto auxiliar para probar reviews',
            budget: 1800,
            deadline: '2025-12-01',
            category_id: 1,
            skills_required: ['Node.js', 'Testing']
        }

    const { request: projectRequest } = await authenticateRequest(request(app).post('/projects'), 'project_manager')
    const projectResponse = await projectRequest.send(projectPayload).expect(201)
        seededProjectId = projectResponse.body.data.id
    })

    describe('POST /reviews', () => {
        it('debería rechazar acceso sin autenticación', async () => {
            const response = await request(app)
                .post('/reviews')
                .send({
                    project_id: seededProjectId,
                    reviewed_id: TEST_USERS.freelancer_alt.id,
                    rating: 5,
                    comment: 'Excelente trabajo'
                })
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })

        it('debería crear review con usuario autenticado', async () => {
            const response = await request(app)
                .post('/reviews')
                .set(createAuthHeaders(tokens.project_manager))
                .send({
                    project_id: seededProjectId,
                    reviewed_id: TEST_USERS.freelancer_alt.id,
                    rating: 5,
                    comment: 'Review de prueba'
                })
                .expect(201)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(true)
            expect(response.body.data).toHaveProperty('id')
            expect(response.body.data).toHaveProperty('rating')
            expect(response.body.data.rating).toBe(5)
            testReviewId = response.body.data.id
        })
    })

    describe('GET /reviews/user/:userId', () => {
        it('debería obtener reviews de un usuario (endpoint público)', async () => {
            const response = await request(app)
                .get('/reviews/user/1')
                .expect(200)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(true)
            expect(Array.isArray(response.body.data)).toBe(true)
        })
    })

    describe('GET /reviews/user/:userId/stats', () => {
        it('debería obtener estadísticas de reviews de un usuario (endpoint público)', async () => {
            const response = await request(app)
                .get('/reviews/user/1/stats')
                .expect(200)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(true)
            expect(response.body.data).toHaveProperty('average_rating')
            expect(response.body.data).toHaveProperty('total_reviews')
            expect(typeof response.body.data.average_rating).toBe('number')
            expect(typeof response.body.data.total_reviews).toBe('number')
        })
    })

    describe('GET /reviews/project/:projectId', () => {
        it('debería rechazar acceso sin autenticación', async () => {
            const response = await request(app)
                .get(`/reviews/project/${seededProjectId}`)
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })

        it('debería obtener reviews de un proyecto con autenticación', async () => {
            const response = await request(app)
                .get(`/reviews/project/${seededProjectId}`)
                .set(createAuthHeaders(tokens.project_manager))
                .expect(200)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(true)
            expect(Array.isArray(response.body.data)).toBe(true)
        })
    })
})

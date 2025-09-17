import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { getAuthToken, createAuthHeaders, getAllAuthTokens } from '../helpers/auth.js'

describe('Reviews API', () => {
    let tokens = {}
    let testProjectId
    let testReviewId

    beforeAll(async () => {
        // Obtener tokens para diferentes tipos de usuarios
        tokens = await getAllAuthTokens()
    })

    describe('POST /reviews', () => {
        it('debería rechazar acceso sin autenticación', async () => {
            const response = await request(app)
                .post('/reviews')
                .send({
                    project_id: 1,
                    reviewer_id: 1,
                    reviewed_id: 2,
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
                .set(createAuthHeaders(tokens.existing || tokens.client || tokens.freelancer))
                .send({
                    project_id: 999999, // ID que probablemente no existe para evitar duplicados
                    reviewer_id: 1,
                    reviewed_id: 2,
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
                .get('/reviews/project/1')
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })

        it('debería obtener reviews de un proyecto con autenticación', async () => {
            const response = await request(app)
                .get('/reviews/project/1')
                .set(createAuthHeaders(tokens.existing || tokens.client || tokens.freelancer))
                .expect(200)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(true)
            expect(Array.isArray(response.body.data)).toBe(true)
        })
    })
})

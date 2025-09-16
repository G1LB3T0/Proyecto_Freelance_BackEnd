import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { getAuthToken, createAuthHeaders, getAllAuthTokens } from '../helpers/auth.js'

describe('Proposals API', () => {
    let tokens = {}
    let testProjectId
    let testProposalId

    beforeAll(async () => {
        // Obtener tokens para diferentes tipos de usuarios
        tokens = await getAllAuthTokens()

        // Crear un proyecto de test si es necesario para las propuestas
        if (tokens.client || tokens.project_manager) {
            const projectResponse = await request(app)
                .post('/projects')
                .set(createAuthHeaders(tokens.client || tokens.project_manager))
                .send({
                    client_id: 1,
                    title: 'Proyecto Test para Propuestas',
                    description: 'Descripción de prueba',
                    budget: 1000.00
                })

            if (projectResponse.status === 201) {
                testProjectId = projectResponse.body.data.id
            }
        }
    })

    describe('POST /proposals', () => {
        it('debería rechazar acceso sin autenticación', async () => {
            const response = await request(app)
                .post('/proposals')
                .send({
                    project_id: 1,
                    freelancer_id: 1,
                    proposed_budget: 800.00,
                    delivery_time: 14,
                    proposal_text: 'Mi propuesta de prueba'
                })
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })

        it('debería rechazar propuesta de usuario que no es freelancer', async () => {
            if (!tokens.client && !tokens.project_manager) {
                console.warn('Saltando test: no hay tokens de client/project_manager')
                return
            }

            const response = await request(app)
                .post('/proposals')
                .set(createAuthHeaders(tokens.client || tokens.project_manager))
                .send({
                    project_id: testProjectId || 1,
                    freelancer_id: 1,
                    proposed_budget: 800.00,
                    delivery_time: 14,
                    proposal_text: 'Mi propuesta de prueba'
                })
                .expect(403)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })

        it('debería crear propuesta con usuario freelancer', async () => {
            if (!tokens.freelancer) {
                console.warn('Saltando test: no hay token de freelancer')
                return
            }

            const response = await request(app)
                .post('/proposals')
                .set(createAuthHeaders(tokens.freelancer))
                .send({
                    project_id: testProjectId || 1,
                    freelancer_id: 1,
                    proposed_budget: 800.00,
                    delivery_time: 14,
                    proposal_text: 'Mi propuesta de prueba'
                })
                .expect(201)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(true)
            expect(response.body.data).toHaveProperty('id')
            testProposalId = response.body.data.id
        })
    })

    describe('GET /proposals/project/:projectId', () => {
        it('debería rechazar acceso sin autenticación', async () => {
            const response = await request(app)
                .get('/proposals/project/1')
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })

        it('debería obtener propuestas de un proyecto con autenticación', async () => {
            const response = await request(app)
                .get(`/proposals/project/${testProjectId || 1}`)
                .set(createAuthHeaders(tokens.existing || tokens.client || tokens.freelancer))
                .expect(200)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(true)
            expect(Array.isArray(response.body.data)).toBe(true)
        })
    })

    describe('PATCH /proposals/:proposalId/accept', () => {
        it('debería rechazar acceso sin autenticación', async () => {
            const response = await request(app)
                .patch(`/proposals/${testProposalId || 1}/accept`)
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })

        it('debería rechazar aceptación por freelancer', async () => {
            if (!tokens.freelancer || !testProposalId) {
                console.warn('Saltando test: no hay token de freelancer o propuesta de test')
                return
            }

            const response = await request(app)
                .patch(`/proposals/${testProposalId}/accept`)
                .set(createAuthHeaders(tokens.freelancer))
                .expect(403)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })

        it('debería permitir aceptación por client/project_manager', async () => {
            if ((!tokens.client && !tokens.project_manager) || !testProposalId) {
                console.warn('Saltando test: no hay tokens de client/project_manager o propuesta de test')
                return
            }

            const response = await request(app)
                .patch(`/proposals/${testProposalId}/accept`)
                .set(createAuthHeaders(tokens.client || tokens.project_manager))
                .expect(200)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(true)
        })
    })
})

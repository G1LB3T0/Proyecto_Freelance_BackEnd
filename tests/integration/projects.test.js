import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { authenticateRequest, createAuthHeaders, getAllAuthTokens, TEST_USERS } from '../helpers/auth.js'

describe('Projects API', () => {
  let testProjectId
  let testProposalId
  let tokens = {}

  const clientType = 'project_manager'
  const clientAltType = 'project_manager_alt'
  const freelancerType = 'freelancer'
  const freelancerAltType = 'freelancer_alt'

  beforeAll(async () => {
    // Obtener tokens para diferentes tipos de usuarios
    tokens = await getAllAuthTokens()

    if (!tokens[clientType] || !tokens[freelancerType] || !tokens[freelancerAltType]) {
      throw new Error('No se pudieron obtener los tokens necesarios para las pruebas de proyectos')
    }
  })

  describe('GET /projects', () => {
    it('debería rechazar acceso sin autenticación', async () => {
      const response = await request(app)
        .get('/projects')
        .expect(401)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(false)
    })

    it('debería obtener todos los proyectos con autenticación', async () => {
      const response = await request(app)
        .get('/projects')
        .set(createAuthHeaders(tokens[clientType]))
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /projects/:id', () => {
    it('debería rechazar acceso sin autenticación', async () => {
      const response = await request(app)
        .get('/projects/1')
        .expect(401)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(false)
    })

    it('debería obtener un proyecto específico por ID con autenticación', async () => {
      // Primero obtener todos los proyectos para tener un ID válido
      const projectsResponse = await request(app)
        .get('/projects')
        .set(createAuthHeaders(tokens[clientType]))

      const firstProject = projectsResponse.body.data[0]

      if (firstProject) {
        const response = await request(app)
          .get(`/projects/${firstProject.id}`)
          .set(createAuthHeaders(tokens[clientType]))
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('id')
        expect(response.body.data.id).toBe(firstProject.id)
        expect(response.body.data).toHaveProperty('client_id')
        expect(response.body.data).toHaveProperty('freelancer_id')
        expect(response.body.data).toHaveProperty('title')
        expect(response.body.data).toHaveProperty('description')
        expect(response.body.data).toHaveProperty('budget')
      }
    })

    it('debería devolver 404 para un proyecto inexistente', async () => {
      const response = await request(app)
        .get('/projects/99999')
        .set(createAuthHeaders(tokens[clientType]))
        .expect(404)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /projects/client/:clientId', () => {
    it('debería obtener proyectos de un cliente específico', async () => {
      const response = await request(app)
        .get(`/projects/client/${TEST_USERS[clientType].id}`)
        .set(createAuthHeaders(tokens[clientType]))
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /projects/freelancer/:freelancerId', () => {
    it('debería obtener proyectos de un freelancer específico', async () => {
      const response = await request(app)
        .get(`/projects/freelancer/${TEST_USERS[freelancerAltType].id}`)
        .set(createAuthHeaders(tokens[freelancerAltType]))
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /projects/status/:status', () => {
    it('debería obtener proyectos por estado "open"', async () => {
      const response = await request(app)
        .get('/projects/status/open')
        .set(createAuthHeaders(tokens[clientType]))
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('debería obtener proyectos por estado "completed"', async () => {
      const response = await request(app)
        .get('/projects/status/completed')
        .set(createAuthHeaders(tokens[clientType]))
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /projects', () => {
    it('debería crear un nuevo proyecto', async () => {
      const newProject = {
        title: 'Proyecto Test desde Vitest',
        description: 'Descripción del proyecto de prueba',
        budget: 2500.00,
        deadline: '2025-12-31',
        category_id: 1,
        skills_required: ['JavaScript', 'React', 'Node.js'],
        priority: 'high'
      }

        const { request: projectRequest } = await authenticateRequest(request(app).post('/projects'), clientType)
        const response = await projectRequest
        .send(newProject)
        .expect(201)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.title).toBe(newProject.title)
      expect(response.body.data.description).toBe(newProject.description)
      expect(parseFloat(response.body.data.budget)).toBe(newProject.budget)

      // Guardar el ID para tests posteriores
      testProjectId = response.body.data.id
    })

    it('debería rechazar crear proyecto sin campos requeridos', async () => {
      const invalidProject = {
        // Falta title, description y budget
      }

        const { request: invalidRequest } = await authenticateRequest(request(app).post('/projects'), clientType)
        const response = await invalidRequest
        .send(invalidProject)
        .expect(400)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /projects/:id', () => {
    it('debería actualizar un proyecto existente', async () => {
      if (!testProjectId) {
        console.log('Saltando test de actualización - no hay proyecto de prueba')
        return
      }

      const updateData = {
        title: 'Proyecto Actualizado desde Test',
        description: 'Descripción actualizada',
        budget: 3000.00,
        status: 'in_progress'
      }

        const { request: updateRequest } = await authenticateRequest(request(app).put(`/projects/${testProjectId}`), clientType)
        const response = await updateRequest
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(updateData.title)
      expect(response.body.data.description).toBe(updateData.description)
      expect(parseFloat(response.body.data.budget)).toBe(updateData.budget)
      expect(response.body.data.status).toBe(updateData.status)
    })
  })

  describe('DELETE /projects/:id', () => {
    it('debería eliminar un proyecto', async () => {
      if (!testProjectId) {
        console.log('Saltando test de eliminación - no hay proyecto de prueba')
        return
      }

        const { request: deleteRequest } = await authenticateRequest(request(app).delete(`/projects/${testProjectId}`), clientType)
        const response = await deleteRequest.expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('message')
    })
  })

  // Tests para Propuestas
  describe('Project Proposals', () => {
    let proposalProjectId

    beforeAll(async () => {
      // Crear un proyecto para las propuestas
      const newProject = {
        title: 'Proyecto para Propuestas Test',
        description: 'Proyecto para probar propuestas',
        budget: 1500.00,
        deadline: '2025-11-30',
        category_id: 1,
        skills_required: ['Python', 'Django']
      }

        const { request: projectRequest } = await authenticateRequest(request(app).post('/projects'), clientType)
        const projectResponse = await projectRequest
        .send(newProject)
        .expect(201)

      proposalProjectId = projectResponse.body.data.id
    })

    describe('POST /projects/proposals', () => {
      it('debería crear una nueva propuesta', async () => {
        const newProposal = {
          project_id: proposalProjectId,
          proposed_budget: 1400.00,
          delivery_time: 30,
          proposal_text: 'Propuesta de prueba desde Vitest',
          cover_letter: 'Carta de presentación de prueba',
          portfolio_links: ['https://github.com/test', 'https://portfolio.test.com']
        }

          const { request: proposalRequest } = await authenticateRequest(request(app).post('/projects/proposals'), freelancerAltType)
          const response = await proposalRequest
          .send(newProposal)
          .expect(201)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('id')
        expect(response.body.data.proposal_text).toBe(newProposal.proposal_text)
        expect(parseFloat(response.body.data.proposed_budget)).toBe(newProposal.proposed_budget)

        testProposalId = response.body.data.id
      })
    })

    describe('GET /projects/:projectId/proposals', () => {
      it('debería obtener propuestas de un proyecto', async () => {
        const response = await request(app)
          .get(`/projects/${proposalProjectId}/proposals`)
          .set(createAuthHeaders(tokens[clientType]))
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })

    describe('GET /projects/freelancer/:freelancerId/proposals', () => {
      it('debería obtener propuestas de un freelancer', async () => {
        const response = await request(app)
          .get(`/projects/freelancer/${TEST_USERS[freelancerAltType].id}/proposals`)
          .set(createAuthHeaders(tokens[freelancerAltType]))
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })

    describe('PATCH /projects/proposals/:proposalId/accept', () => {
      it('debería aceptar una propuesta', async () => {
        if (!testProposalId) {
          console.log('Saltando test de aceptar propuesta - no hay propuesta de prueba')
          return
        }

        const response = await request(app)
          .patch(`/projects/proposals/${testProposalId}/accept`)
          .set(createAuthHeaders(tokens[clientType]))
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('message')
      })
    })

    describe('PATCH /projects/proposals/:proposalId/reject', () => {
      it('debería rechazar una propuesta', async () => {
        if (!testProposalId) {
          console.log('Saltando test de rechazar propuesta - no hay propuesta de prueba')
          return
        }

        const response = await request(app)
          .patch(`/projects/proposals/${testProposalId}/reject`)
          .set(createAuthHeaders(tokens[clientType]))
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('message')
      })
    })
  })

  // Tests para Reviews
  describe('Project Reviews', () => {
    let reviewProjectId

    beforeAll(async () => {
      // Crear un proyecto para las reviews
      const newProject = {
        title: 'Proyecto para Reviews Test',
        description: 'Proyecto para probar reviews',
        budget: 2000.00,
        deadline: '2025-12-30',
        category_id: 1,
        skills_required: ['React', 'Node.js']
      }

        const { request: projectRequest } = await authenticateRequest(request(app).post('/projects'), clientType)
        const projectResponse = await projectRequest
        .send(newProject)
        .expect(201)

      reviewProjectId = projectResponse.body.data.id
    })

    describe('POST /projects/reviews', () => {
      it('debería crear una nueva review', async () => {
        const newReview = {
          project_id: reviewProjectId,
          reviewed_id: TEST_USERS[freelancerAltType].id,
          rating: 5,
          comment: 'Excelente trabajo, muy profesional'
        }

          const { request: reviewRequest } = await authenticateRequest(request(app).post('/projects/reviews'), clientType)
          const response = await reviewRequest
          .send(newReview)
          .expect(201)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('id')
        expect(response.body.data.rating).toBe(newReview.rating)
        expect(response.body.data.comment).toBe(newReview.comment)
      })
    })

    describe('GET /projects/user/:userId/reviews', () => {
      it('debería obtener reviews de un usuario', async () => {
        const response = await request(app)
          .get(`/projects/user/${TEST_USERS[freelancerAltType].id}/reviews`)
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
  })
}) 
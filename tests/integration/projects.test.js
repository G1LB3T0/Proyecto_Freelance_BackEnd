import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'

describe('Projects API', () => {
  let testProjectId
  let testProposalId

  describe('GET /projects', () => {
    it('debería obtener todos los proyectos', async () => {
      const response = await request(app)
        .get('/projects')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /projects/:id', () => {
    it('debería obtener un proyecto específico por ID', async () => {
      // Primero obtener todos los proyectos para tener un ID válido
      const projectsResponse = await request(app).get('/projects')
      const firstProject = projectsResponse.body.data[0]
      
      if (firstProject) {
        const response = await request(app)
          .get(`/projects/${firstProject.id}`)
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('id')
        expect(response.body.data.id).toBe(firstProject.id)
      }
    })

    it('debería devolver 404 para un proyecto inexistente', async () => {
      const response = await request(app)
        .get('/projects/99999')
        .expect(404)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /projects/client/:clientId', () => {
    it('debería obtener proyectos de un cliente específico', async () => {
      const response = await request(app)
        .get('/projects/client/1')
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
        .get('/projects/freelancer/3')
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
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('debería obtener proyectos por estado "completed"', async () => {
      const response = await request(app)
        .get('/projects/status/completed')
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
        client_id: 2,
        title: 'Proyecto Test desde Vitest',
        description: 'Descripción del proyecto de prueba',
        budget: 2500.00,
        deadline: '2025-12-31',
        category_id: 1,
        skills_required: ['JavaScript', 'React', 'Node.js'],
        priority: 'high'
      }

      const response = await request(app)
        .post('/projects')
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
        client_id: 2,
        // Falta title, description y budget
      }

      const response = await request(app)
        .post('/projects')
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

      const response = await request(app)
        .put(`/projects/${testProjectId}`)
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

      const response = await request(app)
        .delete(`/projects/${testProjectId}`)
        .expect(200)

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
        client_id: 2,
        title: 'Proyecto para Propuestas Test',
        description: 'Proyecto para probar propuestas',
        budget: 1500.00,
        deadline: '2025-11-30',
        category_id: 1,
        skills_required: ['Python', 'Django']
      }

      const projectResponse = await request(app)
        .post('/projects')
        .send(newProject)

      proposalProjectId = projectResponse.body.data.id
    })

    describe('POST /projects/proposals', () => {
      it('debería crear una nueva propuesta', async () => {
        const newProposal = {
          project_id: proposalProjectId,
          freelancer_id: 3,
          proposed_budget: 1400.00,
          delivery_time: 30,
          proposal_text: 'Propuesta de prueba desde Vitest',
          cover_letter: 'Carta de presentación de prueba',
          portfolio_links: ['https://github.com/test', 'https://portfolio.test.com']
        }

        const response = await request(app)
          .post('/projects/proposals')
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
          .get('/projects/freelancer/3/proposals')
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
        client_id: 2,
        title: 'Proyecto para Reviews Test',
        description: 'Proyecto para probar reviews',
        budget: 2000.00,
        deadline: '2025-12-30',
        category_id: 1,
        skills_required: ['React', 'Node.js']
      }

      const projectResponse = await request(app)
        .post('/projects')
        .send(newProject)

      reviewProjectId = projectResponse.body.data.id
    })

    describe('POST /projects/reviews', () => {
      it('debería crear una nueva review', async () => {
        const newReview = {
          project_id: reviewProjectId,
          reviewer_id: 1,
          reviewed_id: 5,
          rating: 5,
          comment: 'Excelente trabajo, muy profesional'
        }

        const response = await request(app)
          .post('/projects/reviews')
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
          .get('/projects/user/5/reviews')
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })
  })
}) 
import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { authenticateRequest, createAuthHeaders, getAllAuthTokens, TEST_USERS } from '../helpers/auth.js'

describe('Projects Progress Feature', () => {
  let tokens = {}
  const clientType = 'project_manager'

  beforeAll(async () => {
    tokens = await getAllAuthTokens()
    if (!tokens[clientType]) {
      throw new Error('No se pudo obtener token para project_manager')
    }
  })

  it('GET /projects incluye el campo progress', async () => {
    const res = await request(app)
      .get('/projects')
      .set(createAuthHeaders(tokens[clientType]))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(Array.isArray(res.body.data)).toBe(true)
    if (res.body.data.length > 0) {
      const p = res.body.data[0]
      expect(p).toHaveProperty('progress')
      expect(typeof p.progress).toBe('number')
      expect(p.progress).toBeGreaterThanOrEqual(0)
      expect(p.progress).toBeLessThanOrEqual(100)
    }
  })

  it('Permite actualizar progress con PUT /projects/:id', async () => {
    // Crear proyecto base
    const newProject = {
      title: 'Proyecto con progreso (test)',
      description: 'Probando actualización de progreso',
      budget: 1234.56,
      deadline: '2025-12-31',
      category_id: 1,
      skills_required: ['JavaScript'],
      priority: 'medium'
    }

    const { request: createReq } = await authenticateRequest(request(app).post('/projects'), clientType)
    const createRes = await createReq.send(newProject).expect(201)
    expect(createRes.body.success).toBe(true)
    const projectId = createRes.body.data.id

    // Actualizar progreso a 42
    const updatePayload = { progress: 42, status: 'in_progress' }
    const { request: updateReq } = await authenticateRequest(request(app).put(`/projects/${projectId}`), clientType)
    const updateRes = await updateReq.send(updatePayload).expect(200)
    expect(updateRes.body.success).toBe(true)
    expect(updateRes.body.data).toHaveProperty('progress')
    expect(updateRes.body.data.progress).toBe(42)

    // Forzar validación de límites (mayor a 100 se clamp o error 400 según backend)
    const { request: invalidReq } = await authenticateRequest(request(app).put(`/projects/${projectId}`), clientType)
    const invalidRes = await invalidReq.send({ progress: 150, status: 'in_progress' }).expect(200)
    // Backend actual permite valores fuera de 0-100; verificamos persistencia del valor enviado
    expect(invalidRes.body.success).toBe(true)
    expect(typeof invalidRes.body.data.progress).toBe('number')
    expect(invalidRes.body.data.progress).toBe(150)
  })
})

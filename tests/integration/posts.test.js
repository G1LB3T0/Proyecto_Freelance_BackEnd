import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'
import { authenticateRequest, createAuthHeaders, getAllAuthTokens, TEST_USERS } from '../helpers/auth.js'

describe('Posts API', () => {
  let testPostId
  let tokens = {}

  const ownerType = 'freelancer'
  const otherType = 'freelancer_alt'

  beforeAll(async () => {
    tokens = await getAllAuthTokens()

    if (!tokens[ownerType]) {
      throw new Error('No se pudo obtener token para el usuario propietario de posts')
    }
  })

  describe('GET /api/posts', () => {
    it('debería obtener todos los posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('posts')
      expect(Array.isArray(response.body.data.posts)).toBe(true)
    })
  })

  describe('GET /api/posts/:id', () => {
    it('debería obtener un post específico por ID', async () => {
      const postsResponse = await request(app).get('/api/posts')
      const posts = postsResponse.body.data?.posts ?? []
      const firstPost = posts[0]

      if (!firstPost) {
        return
      }

      const response = await request(app)
        .get(`/api/posts/${firstPost.id}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(firstPost.id)
    })

    it('debería devolver 404 para un post inexistente', async () => {
      const response = await request(app)
        .get('/api/posts/99999')
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /api/posts/user/:userId', () => {
    it('debería obtener posts de un usuario específico', async () => {
      const response = await request(app)
        .get(`/api/posts/user/${TEST_USERS.freelancer.id}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/posts/category/:categoryId', () => {
    it('debería obtener posts por categoría', async () => {
      const response = await request(app)
        .get('/api/posts/category/1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /api/posts', () => {
    it('debería crear un nuevo post', async () => {
      const newPost = {
        title: 'Test Post desde Vitest',
        content: 'Este es un post de prueba creado desde los tests',
        image_url: 'https://test-image.com/test.jpg',
        category_id: 1
      }

      const { request: authedRequest } = await authenticateRequest(request(app).post('/api/posts'), ownerType)
      const response = await authedRequest
        .send(newPost)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.title).toBe(newPost.title)
      expect(response.body.data.content).toBe(newPost.content)

      testPostId = response.body.data.id
    })

    it('debería rechazar crear post sin campos requeridos', async () => {
      const { request: authedRequest } = await authenticateRequest(request(app).post('/api/posts'), ownerType)
      const response = await authedRequest
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/posts/:id', () => {
    it('debería rechazar actualización de usuario sin ownership', async () => {
      if (!testPostId || !tokens[otherType]) {
        return
      }

      const response = await request(app)
        .put(`/api/posts/${testPostId}`)
        .set(createAuthHeaders(tokens[otherType]))
        .send({ title: 'Cambio no autorizado' })
        .expect(403)

      expect(response.body.success).toBe(false)
    })

    it('debería actualizar un post existente', async () => {
      if (!testPostId) {
        return
      }

      const updateData = {
        title: 'Post Actualizado desde Test',
        content: 'Contenido actualizado para el test'
      }

      const { request: authedRequest } = await authenticateRequest(request(app).put(`/api/posts/${testPostId}`), ownerType)
      const response = await authedRequest
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(updateData.title)
      expect(response.body.data.content).toBe(updateData.content)
    })
  })

  describe('DELETE /api/posts/:id', () => {
    it('debería eliminar un post', async () => {
      if (!testPostId) {
        return
      }

  const { request: authedRequest } = await authenticateRequest(request(app).delete(`/api/posts/${testPostId}`), ownerType)
  const response = await authedRequest.expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('message')
    })
  })
})
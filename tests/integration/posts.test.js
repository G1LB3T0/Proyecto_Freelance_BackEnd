import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'

describe('Posts API', () => {
  let testPostId
  let authToken

  beforeAll(async () => {
    // Obtener token de autenticación para tests
    const loginResponse = await request(app)
      .post('/api/login')
      .send({
        email: 'jperez@gmail.com',
        password: 'donjuan217'
      })
    
    authToken = loginResponse.body.data.token
  })

  describe('GET /posts', () => {
    it('debería obtener todos los posts', async () => {
      const response = await request(app)
        .get('/posts')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /posts/:id', () => {
    it('debería obtener un post específico por ID', async () => {
      // Primero obtener todos los posts para tener un ID válido
      const postsResponse = await request(app).get('/posts')
      const firstPost = postsResponse.body.data[0]
      
      if (firstPost) {
        const response = await request(app)
          .get(`/posts/${firstPost.id}`)
          .expect(200)

        expect(response.body).toHaveProperty('success')
        expect(response.body.success).toBe(true)
        expect(response.body.data).toHaveProperty('id')
        expect(response.body.data.id).toBe(firstPost.id)
      }
    })

    it('debería devolver 404 para un post inexistente', async () => {
      const response = await request(app)
        .get('/posts/99999')
        .expect(404)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(false)
    })
  })

  describe('GET /posts/user/:userId', () => {
    it('debería obtener posts de un usuario específico', async () => {
      const response = await request(app)
        .get('/posts/user/1')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /posts/category/:categoryId', () => {
    it('debería obtener posts por categoría', async () => {
      const response = await request(app)
        .get('/posts/category/1')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /posts', () => {
    it('debería crear un nuevo post', async () => {
      const newPost = {
        user_id: 1,
        title: 'Test Post desde Vitest',
        content: 'Este es un post de prueba creado desde los tests',
        image_url: 'https://test-image.com/test.jpg',
        category_id: 1
      }

      const response = await request(app)
        .post('/posts')
        .send(newPost)
        .expect(201)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.title).toBe(newPost.title)
      expect(response.body.data.content).toBe(newPost.content)

      // Guardar el ID para tests posteriores
      testPostId = response.body.data.id
    })

    it('debería rechazar crear post sin campos requeridos', async () => {
      const invalidPost = {
        user_id: 1,
        // Falta title y content
      }

      const response = await request(app)
        .post('/posts')
        .send(invalidPost)
        .expect(400)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /posts/:id', () => {
    it('debería actualizar un post existente', async () => {
      if (!testPostId) {
        console.log('Saltando test de actualización - no hay post de prueba')
        return
      }

      const updateData = {
        title: 'Post Actualizado desde Test',
        content: 'Contenido actualizado para el test'
      }

      const response = await request(app)
        .put(`/posts/${testPostId}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe(updateData.title)
      expect(response.body.data.content).toBe(updateData.content)
    })
  })

  describe('DELETE /posts/:id', () => {
    it('debería eliminar un post', async () => {
      if (!testPostId) {
        console.log('Saltando test de eliminación - no hay post de prueba')
        return
      }

      const response = await request(app)
        .delete(`/posts/${testPostId}`)
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('message')
    })
  })
}) 
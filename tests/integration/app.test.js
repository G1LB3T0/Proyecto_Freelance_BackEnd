import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'

describe('API Endpoints', () => {
  describe('GET /login', () => {
    it('debería obtener todos los usuarios', async () => {
      const response = await request(app)
        .get('/login')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('POST /login/login', () => {
    it('debería rechazar login con credenciales inválidas', async () => {
      const response = await request(app)
        .post('/login/login')
        .send({
          email: 'usuario_inexistente@test.com',
          password: 'password_incorrecto'
        })
        .expect(401)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(false)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toBe('Credenciales inválidas')
    })

    it('debería aceptar login con credenciales válidas', async () => {
      const response = await request(app)
        .post('/login/login')
        .send({
          email: 'jperez@gmail.com',
          password: 'donjuan217'
        })
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('user')
    })
  })

  describe('Rutas no encontradas', () => {
    it('debería devolver 404 para rutas inexistentes', async () => {
      const response = await request(app)
        .get('/ruta-que-no-existe')
        .expect(404)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('mensaje')
      expect(response.body.error.mensaje).toBe('Ruta no encontrada')
    })
  })
}) 
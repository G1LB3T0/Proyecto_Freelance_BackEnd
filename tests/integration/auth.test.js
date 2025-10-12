import { describe, it, expect } from 'vitest'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import { app } from '../../index.js'
import { TEST_USERS, getAuthToken } from '../helpers/auth.js'

const validCredentials = {
  email: TEST_USERS.freelancer.email,
  password: TEST_USERS.freelancer.password
}

describe('Autenticación y sesiones', () => {
  describe('POST /login/login', () => {
    it('retorna token y datos de usuario con credenciales correctas', async () => {
      const response = await request(app)
        .post('/login/login')
        .send(validCredentials)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user.email).toBe(validCredentials.email)
    })

    it('rechaza credenciales inválidas', async () => {
      const response = await request(app)
        .post('/login/login')
        .send({ ...validCredentials, password: 'clave_incorrecta' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Credenciales inválidas')
    })
  })

  describe('GET /login/verify', () => {
    it('acepta token válido', async () => {
      const token = await getAuthToken('freelancer')

      const response = await request(app)
        .get('/login/verify')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(validCredentials.email)
    })

    it('rechaza peticiones sin token', async () => {
      const response = await request(app)
        .get('/login/verify')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Token de acceso requerido')
    })

    it('rechaza token inválido', async () => {
      const response = await request(app)
        .get('/login/verify')
        .set('Authorization', 'Bearer token.invalido')
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Token inválido o expirado')
    })
  })

  describe('POST /login/refresh', () => {
    it('emite un nuevo token para sesiones activas', async () => {
      const token = await getAuthToken('freelancer')

      const response = await request(app)
        .post('/login/refresh')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('token')

      const refreshedToken = response.body.data.token
      expect(typeof refreshedToken).toBe('string')
      expect(refreshedToken.length).toBeGreaterThan(0)

      const originalPayload = jwt.decode(token)
      const refreshedPayload = jwt.decode(refreshedToken)

      if (originalPayload?.iat && refreshedPayload?.iat) {
        expect(refreshedPayload.iat).toBeGreaterThanOrEqual(originalPayload.iat)
      }
    })

    it('requiere token válido', async () => {
      const response = await request(app)
        .post('/login/refresh')
        .set('Authorization', 'Bearer token_invalido')
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /login/logout', () => {
    it('confirma cierre de sesión para clientes', async () => {
      const token = await getAuthToken('freelancer')

      const response = await request(app)
        .post('/login/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('Sesión cerrada')
    })
  })
})

import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'

/**
 * Tests de integración para endpoints de configuración de usuario:
 *   GET    /api/configuration/settings
 *   PUT    /api/configuration/settings
 *   POST   /api/configuration/change-password
 */

describe('Configuration / User Settings API', () => {
  let token
  let userEmail
  let originalPassword

  beforeAll(async () => {
    // Crear usuario dinámico mediante /register para no depender del seed
    const ts = Date.now()
    userEmail = `config.user.${ts}@example.com`
    originalPassword = 'ConfigTestPass123'

    const newUserPayload = {
      email: userEmail,
      password: originalPassword,
      username: `configuser${ts}`,
      first_name: 'Config',
      last_name: 'Tester',
      date_of_birth: '1990-01-01',
      gender: 'Male',
      country: 'Guatemala',
      postal_code: '01001'
    }

    const registerRes = await request(app)
      .post('/register')
      .send(newUserPayload)
      .expect(201)

    expect(registerRes.body.success).toBe(true)

    // Login para obtener token
    const loginRes = await request(app)
      .post('/login/login')
      .send({ email: userEmail, password: originalPassword })
      .expect(200)

    token = loginRes.body.data.token
    expect(token).toBeDefined()
  })

  describe('GET /api/configuration/settings', () => {
    it('debe devolver settings (aunque sean null si no existen detalles)', async () => {
      const res = await request(app)
        .get('/api/configuration/settings')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)

      expect(res.body).toHaveProperty('success', true)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('social_links')
    })

    it('debe rechazar sin token', async () => {
      const res = await request(app)
        .get('/api/configuration/settings')
        .expect(401)

      expect(res.body.success).toBe(false)
    })
  })

  describe('PUT /api/configuration/settings - validaciones', () => {
    it('rechaza nombre inválido', async () => {
      const res = await request(app)
        .put('/api/configuration/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ first_name: '***###' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/nombre/i)
    })

    it('rechaza apellido inválido', async () => {
      const res = await request(app)
        .put('/api/configuration/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ last_name: '1234' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/apellido/i)
    })

    it('rechaza bio demasiado larga', async () => {
      const longBio = 'a'.repeat(1001)
      const res = await request(app)
        .put('/api/configuration/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: longBio })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/biografía/i)
    })

    it('rechaza website_url inválida', async () => {
      const res = await request(app)
        .put('/api/configuration/settings')
        .set('Authorization', `Bearer ${token}`)
        .send({ website_url: 'notaurl' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/url/i)
    })

    it('actualiza datos válidos', async () => {
      const payload = {
        first_name: 'José',
        last_name: 'Pérez',
        bio: 'Desarrollador fullstack',
        website_url: 'https://miportafolio.com',
        location: 'Guatemala City'
      }

      const res = await request(app)
        .put('/api/configuration/settings')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body).toHaveProperty('data')
      expect(res.body.data.first_name).toBe(payload.first_name)
      expect(res.body.data.last_name).toBe(payload.last_name)
      expect(res.body.message).toMatch(/actualizada/i)
    })
  })

  describe('POST /api/configuration/change-password', () => {
    it('rechaza si faltan campos', async () => {
      const res = await request(app)
        .post('/api/configuration/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: 'x' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/contraseña/i)
    })

    it('rechaza contraseña nueva corta', async () => {
      const res = await request(app)
        .post('/api/configuration/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: originalPassword, new_password: '123' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/al menos 8/i)
    })

    it('rechaza contraseña actual incorrecta', async () => {
      const res = await request(app)
        .post('/api/configuration/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: 'ErrorPass999', new_password: 'NuevaPasswordSegura1' })
        .expect(401)

      expect(res.body.success).toBe(false)
      expect(res.body.error).toMatch(/incorrecta/i)
    })

    it('cambia la contraseña correctamente y permite login con la nueva', async () => {
      const NEW_PASSWORD = 'TemporalSegura123'

      // Paso 1: cambiar
      const changeRes = await request(app)
        .post('/api/configuration/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ current_password: originalPassword, new_password: NEW_PASSWORD })
        .expect(200)

      expect(changeRes.body.success).toBe(true)

      // Paso 2: login con la nueva
      const loginNew = await request(app)
        .post('/login/login')
        .send({ email: userEmail, password: NEW_PASSWORD })
        .expect(200)

      expect(loginNew.body.success).toBe(true)
      expect(loginNew.body.data).toHaveProperty('token')
    })
  })
})

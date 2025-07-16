import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'

describe('Freelancers API', () => {
  describe('GET /api/freelancers', () => {
    it('debería obtener todos los freelancers', async () => {
      const response = await request(app)
        .get('/api/freelancers')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/freelancers/skill/:skillName', () => {
    it('debería obtener freelancers por skill "JavaScript"', async () => {
      const response = await request(app)
        .get('/api/freelancers/skill/JavaScript')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('debería obtener freelancers por skill "Python"', async () => {
      const response = await request(app)
        .get('/api/freelancers/skill/Python')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('debería devolver array vacío para skill inexistente', async () => {
      const response = await request(app)
        .get('/api/freelancers/skill/SkillInexistente')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(0)
    })
  })

  describe('GET /api/freelancers/skill/:skillName/level/:minLevel', () => {
    it('debería obtener freelancers por skill y nivel mínimo', async () => {
      const response = await request(app)
        .get('/api/freelancers/skill/JavaScript/level/3')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('debería obtener freelancers con nivel alto', async () => {
      const response = await request(app)
        .get('/api/freelancers/skill/SQL/level/4')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })
  })

  describe('GET /api/freelancers/country/:country', () => {
    it('debería obtener freelancers por país', async () => {
      const response = await request(app)
        .get('/api/freelancers/country/Guatemala')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('debería devolver array vacío para país inexistente', async () => {
      const response = await request(app)
        .get('/api/freelancers/country/PaisInexistente')
        .expect(200)

      expect(response.body).toHaveProperty('success')
      expect(response.body.success).toBe(true)
      expect(response.body).toHaveProperty('data')
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBe(0)
    })
  })
}) 
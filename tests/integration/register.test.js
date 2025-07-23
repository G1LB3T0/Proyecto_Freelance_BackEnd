import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'

describe('Register API', () => {
  describe('POST /register', () => {
    it('debería registrar un nuevo usuario freelancer', async () => {
      const timestamp = Date.now()
      const newUser = {
        email: `test.freelancer.${timestamp}@example.com`,
        password: 'testpassword123',
        username: `testfreelancer${timestamp}`,
        first_name: 'Test',
        last_name: 'Freelancer',
        phone: `123456789${timestamp % 1000}`,
        date_of_birth: '1990-01-01',
        gender: 'Male',
        country: 'Guatemala',
        postal_code: '01001'
      }

      const response = await request(app)
        .post('/register')
        .send(newUser)
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Usuario registrado exitosamente')
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data.user).toHaveProperty('id')
      expect(response.body.data.user).toHaveProperty('email', newUser.email)
      expect(response.body.data.user).toHaveProperty('nombre', newUser.first_name)
      expect(response.body.data.user).toHaveProperty('apellido', newUser.last_name)
      expect(response.body.data.user).toHaveProperty('username', newUser.username)
    })

    it('debería registrar un nuevo usuario project_manager', async () => {
      const timestamp = Date.now()
      const newUser = {
        email: `test.manager.${timestamp}@example.com`,
        password: 'testpassword123',
        username: `testmanager${timestamp}`,
        first_name: 'Test',
        last_name: 'Manager',
        phone: `098765432${timestamp % 1000}`,
        date_of_birth: '1985-05-15',
        gender: 'Female',
        country: 'Guatemala',
        postal_code: '01002',
        user_type: 'project_manager'
      }

      const response = await request(app)
        .post('/register')
        .send(newUser)
        .expect(201)

      expect(response.body).toHaveProperty('success', true)
      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('Usuario registrado exitosamente')
      expect(response.body).toHaveProperty('data')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data.user).toHaveProperty('id')
      expect(response.body.data.user).toHaveProperty('email', newUser.email)
      expect(response.body.data.user).toHaveProperty('nombre', newUser.first_name)
      expect(response.body.data.user).toHaveProperty('apellido', newUser.last_name)
      expect(response.body.data.user).toHaveProperty('username', newUser.username)
    })

    it('debería rechazar registro con email duplicado', async () => {
      const duplicateUser = {
        email: 'jperez@gmail.com', // Email que ya existe en la BD
        password: 'testpassword123',
        username: 'duplicateuser',
        first_name: 'Duplicate',
        last_name: 'User',
        phone: '1111111111',
        date_of_birth: '1995-01-01',
        gender: 'Male',
        country: 'Guatemala',
        postal_code: '01001'
      }

      const response = await request(app)
        .post('/register')
        .send(duplicateUser)
        .expect(409)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('email')
    })

    it('debería rechazar registro con username duplicado', async () => {
      const duplicateUser = {
        email: 'newuser@example.com',
        password: 'testpassword123',
        username: 'juanp', // Username que ya existe en la BD
        first_name: 'New',
        last_name: 'User',
        phone: '2222222222',
        date_of_birth: '1995-01-01',
        gender: 'Male',
        country: 'Guatemala',
        postal_code: '01001'
      }

      const response = await request(app)
        .post('/register')
        .send(duplicateUser)
        .expect(409)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('username')
    })

    it('debería rechazar registro con campos faltantes', async () => {
      const incompleteUser = {
        email: 'incomplete@example.com',
        password: 'testpassword123',
        // Falta username, first_name, etc.
      }

      const response = await request(app)
        .post('/register')
        .send(incompleteUser)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('obligatorios')
    })

    it('debería rechazar registro con email inválido', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'testpassword123',
        username: 'invaliduser',
        first_name: 'Invalid',
        last_name: 'User',
        phone: '3333333333',
        date_of_birth: '1995-01-01',
        gender: 'Male',
        country: 'Guatemala',
        postal_code: '01001'
      }

      const response = await request(app)
        .post('/register')
        .send(invalidUser)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('email')
    })

    it('debería rechazar registro con contraseña muy corta', async () => {
      const weakPasswordUser = {
        email: 'weakpass@example.com',
        password: '123', // Contraseña muy corta
        username: 'weakpassuser',
        first_name: 'Weak',
        last_name: 'Password',
        phone: '4444444444',
        date_of_birth: '1995-01-01',
        gender: 'Male',
        country: 'Guatemala',
        postal_code: '01001'
      }

      const response = await request(app)
        .post('/register')
        .send(weakPasswordUser)
        .expect(400)

      expect(response.body).toHaveProperty('success', false)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('contraseña')
    })
  })
}) 
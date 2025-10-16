import { describe, it, expect, beforeAll, vi } from 'vitest'
import request from 'supertest'
import { app } from '../../index.js'

// Mock del servicio de eventos para evitar dependencias de BD en tests unitarios
vi.mock('../../src/services/eventService', () => ({
    createProjectEvent: vi.fn().mockResolvedValue({
        id: 123,
        title: 'Proyecto: Test Project',
        user_id: 1,
        event_date: new Date('2025-12-31'),
        category: 'proyecto'
    }),
    syncProjectToCalendar: vi.fn().mockResolvedValue({
        id: 456,
        title: 'Proyecto: Sync Test',
        user_id: 1,
        event_date: new Date('2025-12-31')
    }),
    getProjectEvents: vi.fn().mockResolvedValue([
        {
            id: 789,
            title: 'Proyecto: Event Test',
            user_id: 1,
            category: 'proyecto'
        }
    ]),
    removeProjectEvent: vi.fn().mockResolvedValue(true)
}))

describe('Project Calendar Sync Integration Tests', () => {

    describe('POST /projects/:id/sync-calendar', () => {
        it('debería requerir autenticación', async () => {
            const response = await request(app)
                .post('/projects/1/sync-calendar')
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
            expect(response.body.message).toContain('Token')
        })
    })

    describe('GET /projects/calendar/events', () => {
        it('debería requerir autenticación para obtener eventos', async () => {
            const response = await request(app)
                .get('/projects/calendar/events')
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })
    })

    describe('DELETE /projects/:id/calendar-event', () => {
        it('debería requerir autenticación para eliminar eventos', async () => {
            const response = await request(app)
                .delete('/projects/1/calendar-event')
                .expect(401)

            expect(response.body).toHaveProperty('success')
            expect(response.body.success).toBe(false)
        })
    })

})

describe('EventService Unit Tests', () => {
    it('debería tener las funciones principales exportadas', async () => {
        const eventService = await import('../../src/services/eventService.js')

        expect(typeof eventService.createProjectEvent).toBe('function')
        expect(typeof eventService.syncProjectToCalendar).toBe('function')
        expect(typeof eventService.getProjectEvents).toBe('function')
        expect(typeof eventService.removeProjectEvent).toBe('function')
    })
})
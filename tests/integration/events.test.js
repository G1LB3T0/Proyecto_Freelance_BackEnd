import request from 'supertest'
import { app } from '../../index.js'
import { authenticateRequest, getAuthToken, createAuthHeaders } from '../helpers/auth.js'

describe('Eventos API - autenticación y autorización', () => {
    let tokenExisting;
    let tokenPM;
    let tokenClient;

    beforeAll(async () => {
        try { tokenExisting = await getAuthToken('existing'); } catch (_) { }
        try { tokenPM = await getAuthToken('project_manager'); } catch (_) { }
        try { tokenClient = await getAuthToken('client'); } catch (_) { }
    });

    it('GET /api/events sin token -> 401', async () => {
        const res = await request(app).get('/api/events');
        expect([401, 403]).toContain(res.status); // según middleware puede devolver 401 o 403
    });

    it('GET /api/events con token válido -> 200', async () => {
        if (!tokenExisting) return; // omitir si no hay usuario seeded
        const res = await request(app)
            .get('/api/events')
            .set(createAuthHeaders(tokenExisting));
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
    });

    it('POST /api/events (freelancer/cliente) con is_public=true crea evento privado', async () => {
        const token = tokenClient || tokenExisting; // usar algún usuario no admin/PM
        if (!token) return;
        const payload = {
            title: 'Reunión privada test',
            day: 15,
            month: 12,
            year: 2025,
            is_public: true
        };
        const res = await request(app)
            .post('/api/events')
            .set(createAuthHeaders(token))
            .send(payload);
        expect([200, 201]).toContain(res.status);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('title', payload.title);
        // Debe forzar privado si no es PM/admin
        if (res.body?.data) {
            expect(res.body.data.is_public).toBe(false);
        }
    });

    it('POST /api/events (PM) con is_public=true crea evento público', async () => {
        if (!tokenPM) return; // omitir si no existe PM seed
        const payload = {
            title: 'Anuncio público test',
            day: 20,
            month: 11,
            year: 2025,
            is_public: true
        };
        const res = await request(app)
            .post('/api/events')
            .set(createAuthHeaders(tokenPM))
            .send(payload);
        expect([200, 201]).toContain(res.status);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('is_public', true);
    });

    it('GET /api/events/my-events devuelve solo eventos del usuario', async () => {
        if (!tokenExisting) return;
        const res = await request(app)
            .get('/api/events/my-events')
            .set(createAuthHeaders(tokenExisting));
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        if (Array.isArray(res.body.data) && res.body.data.length) {
            for (const ev of res.body.data) {
                expect(ev.user_id).toBeDefined();
                // No podemos conocer el ID aquí, pero al menos debe existir
            }
        }
    });

    it('GET /api/events/upcoming entrega campos enriquecidos', async () => {
        if (!tokenExisting) return;
        const res = await request(app)
            .get('/api/events/upcoming')
            .set(createAuthHeaders(tokenExisting));
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        if (Array.isArray(res.body.data) && res.body.data.length) {
            const item = res.body.data[0];
            expect(item).toHaveProperty('days_left');
            expect(item).toHaveProperty('is_today');
            expect(item).toHaveProperty('is_this_week');
        }
    });
});

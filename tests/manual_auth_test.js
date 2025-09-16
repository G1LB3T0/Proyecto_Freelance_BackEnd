#!/usr/bin/env node

// Test manual para verificar autenticación
// Ejecutar con: node tests/manual_auth_test.js

const { app } = require('../index.js');
const request = require('supertest');

async function testAuth() {
    console.log('🧪 Iniciando tests manuales de autenticación...\n');

    try {
        // Test 1: Login
        console.log('1. Probando login...');
        const loginResponse = await request(app)
            .post('/login/login')
            .send({
                email: 'jperez@gmail.com',
                password: 'donjuan217'
            });

        console.log(`   Status: ${loginResponse.status}`);
        if (loginResponse.status === 200) {
            console.log('   ✅ Login exitoso');
            const token = loginResponse.body.data?.token;
            console.log(`   Token obtenido: ${token ? token.substring(0, 20) + '...' : 'NO ENCONTRADO'}`);

            if (token) {
                // Test 2: Acceso protegido con token
                console.log('\n2. Probando acceso protegido a /projects...');
                const projectsResponse = await request(app)
                    .get('/projects')
                    .set('Authorization', `Bearer ${token}`);

                console.log(`   Status: ${projectsResponse.status}`);
                if (projectsResponse.status === 200) {
                    console.log('   ✅ Acceso autorizado a /projects');
                    console.log(`   Proyectos encontrados: ${projectsResponse.body.data?.length || 0}`);
                } else {
                    console.log('   ❌ Acceso denegado a /projects');
                    console.log(`   Error: ${projectsResponse.body.message || projectsResponse.body.error}`);
                }

                // Test 3: Acceso sin token
                console.log('\n3. Probando acceso sin token a /projects...');
                const noAuthResponse = await request(app)
                    .get('/projects');

                console.log(`   Status: ${noAuthResponse.status}`);
                if (noAuthResponse.status === 401) {
                    console.log('   ✅ Correctamente bloqueado sin autenticación');
                } else {
                    console.log('   ❌ Debería haber bloqueado el acceso');
                }

                // Test 4: Verificar token
                console.log('\n4. Probando verificación de token...');
                const verifyResponse = await request(app)
                    .get('/login/verify')
                    .set('Authorization', `Bearer ${token}`);

                console.log(`   Status: ${verifyResponse.status}`);
                if (verifyResponse.status === 200) {
                    console.log('   ✅ Token válido');
                    console.log(`   Usuario: ${verifyResponse.body.data?.user?.username || 'N/A'}`);
                    console.log(`   Tipo: ${verifyResponse.body.data?.user?.user_type || 'N/A'}`);
                } else {
                    console.log('   ❌ Token inválido');
                }
            }
        } else {
            console.log('   ❌ Login falló');
            console.log(`   Error: ${loginResponse.body.message || loginResponse.body.error}`);
        }

        console.log('\n🏁 Tests completados');

    } catch (error) {
        console.error('❌ Error ejecutando tests:', error.message);
    }

    process.exit(0);
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
    testAuth();
}

module.exports = { testAuth };

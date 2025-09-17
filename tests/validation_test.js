#!/usr/bin/env node

// Test de validación de estructura sin dependencias
// Ejecutar con: node tests/validation_test.js

const fs = require('fs');
const path = require('path');

console.log('🔍 Validando estructura de archivos y configuración...\n');

const tests = [
    {
        name: 'Middleware de autenticación',
        file: 'src/middleware/auth.js',
        checks: [
            { pattern: /authMiddleware/, desc: 'Función authMiddleware exportada' },
            { pattern: /roleMiddleware/, desc: 'Función roleMiddleware exportada' },
            { pattern: /freelancerOnly/, desc: 'Helper freelancerOnly exportado' },
            { pattern: /clientOnly/, desc: 'Helper clientOnly exportado' },
            { pattern: /prisma\.login\.findUnique/, desc: 'Consulta a tabla login' },
            { pattern: /user_type/, desc: 'Campo user_type validado' }
        ]
    },
    {
        name: 'Rutas de login actualizadas',
        file: 'src/routes/login.routes.js',
        checks: [
            { pattern: /authMiddleware/, desc: 'Importa authMiddleware' },
            { pattern: /router\.get\('\/verify', authMiddleware/, desc: 'Ruta /verify protegida' },
            { pattern: /router\.post\('\/refresh', authMiddleware/, desc: 'Ruta /refresh protegida' },
            { pattern: /prisma = require/, desc: 'Usa cliente Prisma compartido' }
        ]
    },
    {
        name: 'Rutas de proyectos protegidas',
        file: 'src/routes/project.routes.js',
        checks: [
            { pattern: /authMiddleware/, desc: 'Importa authMiddleware' },
            { pattern: /clientOnly/, desc: 'Importa clientOnly' },
            { pattern: /anyAuthenticated/, desc: 'Importa anyAuthenticated' },
            { pattern: /router\.get\("\/", authMiddleware/, desc: 'GET / protegido' },
            { pattern: /router\.post\("\/", authMiddleware, clientOnly/, desc: 'POST / solo clientes' }
        ]
    },
    {
        name: 'Rutas de propuestas protegidas',
        file: 'src/routes/proposal.routes.js',
        checks: [
            { pattern: /authMiddleware/, desc: 'Importa authMiddleware' },
            { pattern: /freelancerOnly/, desc: 'Importa freelancerOnly' },
            { pattern: /router\.post\('\/', authMiddleware, freelancerOnly/, desc: 'POST / solo freelancers' },
            { pattern: /router\.patch.*accept.*clientOnly/, desc: 'Accept solo clientes' }
        ]
    },
    {
        name: 'Rutas de reviews protegidas',
        file: 'src/routes/review.routes.js',
        checks: [
            { pattern: /authMiddleware/, desc: 'Importa authMiddleware' },
            { pattern: /anyAuthenticated/, desc: 'Importa anyAuthenticated' },
            { pattern: /router\.post\('\/', authMiddleware/, desc: 'POST / protegido' }
        ]
    },
    {
        name: 'Controlador de propuestas',
        file: 'src/controllers/proposal.controller.js',
        checks: [
            { pattern: /prisma = require/, desc: 'Usa cliente Prisma compartido' },
            { pattern: /exports\.createProposal/, desc: 'Exporta createProposal' },
            { pattern: /exports\.acceptProposal/, desc: 'Exporta acceptProposal' },
            { pattern: /login_credentials.*select/, desc: 'Include login_credentials' }
        ]
    },
    {
        name: 'Controlador de reviews',
        file: 'src/controllers/review.controller.js',
        checks: [
            { pattern: /prisma = require/, desc: 'Usa cliente Prisma compartido' },
            { pattern: /exports\.createReview/, desc: 'Exporta createReview' },
            { pattern: /exports\.getUserReviews/, desc: 'Exporta getUserReviews' },
            { pattern: /exports\.getUserReviewStats/, desc: 'Exporta getUserReviewStats' }
        ]
    },
    {
        name: 'Index.js actualizado',
        file: 'index.js',
        checks: [
            { pattern: /proposalRoutes = require.*proposal\.routes/, desc: 'Importa proposal routes' },
            { pattern: /reviewRoutes = require.*review\.routes/, desc: 'Importa review routes' },
            { pattern: /app\.use\('\/proposals', proposalRoutes/, desc: 'Monta /proposals' },
            { pattern: /app\.use\('\/reviews', reviewRoutes/, desc: 'Monta /reviews' }
        ]
    }
];

let totalChecks = 0;
let passedChecks = 0;
let failedFiles = [];

for (const test of tests) {
    console.log(`📁 ${test.name}`);

    try {
        const filePath = path.join(__dirname, '..', test.file);
        const content = fs.readFileSync(filePath, 'utf8');

        let fileChecks = 0;
        let filePassed = 0;

        for (const check of test.checks) {
            totalChecks++;
            fileChecks++;

            if (check.pattern.test(content)) {
                console.log(`   ✅ ${check.desc}`);
                passedChecks++;
                filePassed++;
            } else {
                console.log(`   ❌ ${check.desc}`);
            }
        }

        if (filePassed === fileChecks) {
            console.log(`   🎉 Archivo completamente válido (${filePassed}/${fileChecks})`);
        } else {
            console.log(`   ⚠️  Archivo parcialmente válido (${filePassed}/${fileChecks})`);
            failedFiles.push(test.file);
        }

    } catch (error) {
        console.log(`   ❌ Error leyendo archivo: ${error.message}`);
        failedFiles.push(test.file);
    }

    console.log('');
}

// Helper tests
console.log('📋 Helpers de testing');
const helperTests = [
    {
        name: 'Helper de autenticación',
        file: 'tests/helpers/auth.js',
        checks: [
            { pattern: /export.*getAuthToken/, desc: 'Exporta getAuthToken' },
            { pattern: /export.*createAuthHeaders/, desc: 'Exporta createAuthHeaders' },
            { pattern: /TEST_USERS/, desc: 'Define usuarios de test' },
            { pattern: /\/login\/login/, desc: 'Usa endpoint correcto' }
        ]
    }
];

for (const test of helperTests) {
    console.log(`📁 ${test.name}`);

    try {
        const filePath = path.join(__dirname, test.file);
        const content = fs.readFileSync(filePath, 'utf8');

        for (const check of test.checks) {
            totalChecks++;

            if (check.pattern.test(content)) {
                console.log(`   ✅ ${check.desc}`);
                passedChecks++;
            } else {
                console.log(`   ❌ ${check.desc}`);
            }
        }

    } catch (error) {
        console.log(`   ❌ Error leyendo archivo: ${error.message}`);
    }

    console.log('');
}

// Resumen final
console.log('📊 RESUMEN FINAL');
console.log(`✅ Checks pasados: ${passedChecks}/${totalChecks}`);
console.log(`📈 Porcentaje de éxito: ${Math.round((passedChecks / totalChecks) * 100)}%`);

if (failedFiles.length > 0) {
    console.log(`⚠️  Archivos con issues: ${failedFiles.join(', ')}`);
} else {
    console.log('🎉 Todos los archivos están correctamente configurados!');
}

if (passedChecks === totalChecks) {
    console.log('\n🚀 LISTO PARA DEPLOYMENT - Todos los checks pasaron!');
} else {
    console.log('\n🔧 REQUIERE ATENCIÓN - Algunos checks fallaron');
}

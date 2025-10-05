require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { seedDatabase } = require('./src/database/seedData');

// Importación de rutas
const ejemploRoutes = require('./src/routes/ejemplo.routes');
const loginRoutes = require('./src/routes/login.routes');
const registerRoutes = require('./src/routes/register.routes');
const postRoutes = require('./src/routes/post.routes');
const freelancerRoutes = require('./src/routes/freelancer.routes');
const projectRoutes = require('./src/routes/project.routes');
const proposalRoutes = require('./src/routes/proposal.routes');
const reviewRoutes = require('./src/routes/review.routes');
const eventRoutes = require('./src/routes/event.routes');
const userRoutes = require('./src/routes/user.routes');
const configurationRoutes = require('./src/routes/configuration.routes');
const statsRoutes = require('./src/routes/stats.routes');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la base de datos
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Manejo de CORS
app.use((req, res, next) => {
    const allowedOrigins = [
        // Desarrollo local
        'http://localhost:5173',     // Vite dev server (default)
        'http://localhost:3001',     // Frontend en puerto 3001
        'http://localhost:3000',     // Backend mismo
        'http://localhost:4173',     // Vite preview
        
        // Producción - Servidor 3.15.45.170
        'http://3.15.45.170',        // Frontend en puerto 80 (HTTP)
        'http://3.15.45.170:3001',   // Frontend en puerto 3001
        'http://3.15.45.170:80',     // Frontend en puerto 80 explícito
        'https://3.15.45.170',       // Frontend HTTPS
        'https://3.15.45.170:443',   // Frontend HTTPS explícito
        
        // Variable de entorno personalizada
        process.env.CORS_ORIGIN,
        process.env.FRONTEND_URL
    ].filter(Boolean); // Filtrar valores null/undefined

    const origin = req.headers.origin;
    console.log('🔍 Origin recibido:', origin);

    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        console.log('✅ CORS permitido para:', origin);
    } else {
        // Para desarrollo, permitir cualquier localhost
        if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
            res.header('Access-Control-Allow-Origin', origin);
            console.log('🔧 CORS permitido (localhost):', origin);
        } else if (origin) {
            // Log para debugging en producción
            console.log('⚠️  Origin no permitido:', origin);
            console.log('📋 Origins permitidos:', allowedOrigins);
        }
    }

    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Manejar preflight requests (OPTIONS)
    if (req.method === 'OPTIONS') {
        console.log('🔀 Preflight request para:', origin);
        return res.status(200).json({});
    }
    
    next();
});

// Rutas
app.use('/login', loginRoutes);
app.use('/register', registerRoutes);
app.use('/ejemplo', ejemploRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/projects', projectRoutes);
app.use('/proposals', proposalRoutes);
app.use('/reviews', reviewRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/configuration', configurationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/reviews', reviewRoutes);

// Manejo de errores para rutas no encontradas
app.use((req, res, next) => {
    const error = new Error('Ruta no encontrada');
    error.status = 404;
    next(error);
});

// Manejador global de errores
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            mensaje: error.message
        }
    });
});

// Exportar la conexión a la base de datos para usarla en otros archivos
module.exports = { app, pool };

// Solo iniciar el servidor si no estamos en modo test y no estamos siendo importados
if (process.env.NODE_ENV !== 'test' && require.main === module) {
    // Función para inicializar la aplicación
    async function startServer() {
        try {
            // Ejecutar seeding de la base de datos
            await seedDatabase(pool);

            // Iniciar el servidor
            app.listen(port, () => {
                console.log(`🚀 Servidor corriendo en el puerto ${port}`);
            });
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            process.exit(1);
        }
    }

    startServer();
}

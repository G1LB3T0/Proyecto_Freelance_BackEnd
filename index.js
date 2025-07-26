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
const eventRoutes = require('./src/routes/event.routes');

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
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

// Rutas
app.use('/api', loginRoutes);
app.use('/register', registerRoutes);
app.use('/ejemplo', ejemploRoutes);
app.use('/posts', postRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/projects', projectRoutes);
app.use('/api/events', eventRoutes);

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

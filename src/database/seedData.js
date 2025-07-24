/**
 * Función para insertar datos semilla (seed data) de forma segura
 * Solo inserta datos si no existen, preservando datos existentes
 */
async function seedDatabase(pool) {
    const client = await pool.connect();

    try {
        console.log('🌱 Iniciando proceso de seeding de la base de datos...');

        // 1. Insertar categorías básicas si no existen
        await seedCategories(client);

        // 2. Insertar skills básicas si no existen
        await seedSkills(client);

        // 3. Insertar usuarios de ejemplo si no existen
        await seedUsers(client);

        // 4. Insertar datos de ejemplo adicionales si no existen
        await seedExampleData(client);

        console.log('✅ Proceso de seeding completado exitosamente');

    } catch (error) {
        console.error('❌ Error durante el seeding:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function seedCategories(client) {
    const categories = [
        'Tecnología',
        'Salud',
        'Deportes',
        'Entretenimiento',
        'Educación'
    ];

    for (const category of categories) {
        await client.query(`
            INSERT INTO categories (name) 
            VALUES ($1) 
            ON CONFLICT DO NOTHING
        `, [category]);
    }
    console.log('📁 Categorías básicas verificadas/insertadas');
}

async function seedSkills(client) {
    const skills = [
        ['JavaScript', 'Lenguaje de programación para desarrollo web'],
        ['Python', 'Lenguaje de programación versátil y fácil de aprender'],
        ['React', 'Biblioteca JavaScript para construir interfaces de usuario'],
        ['Node.js', 'Entorno de ejecución para JavaScript del lado del servidor'],
        ['SQL', 'Lenguaje para gestionar bases de datos relacionales'],
        ['UI/UX Design', 'Diseño de interfaces y experiencia de usuario'],
        ['Project Management', 'Gestión y coordinación de proyectos'],
        ['DevOps', 'Prácticas que combinan desarrollo de software y operaciones']
    ];

    for (const [name, description] of skills) {
        await client.query(`
            INSERT INTO skills (name, description) 
            VALUES ($1, $2) 
            ON CONFLICT (name) DO NOTHING
        `, [name, description]);
    }
    console.log('🛠️ Skills básicas verificadas/insertadas');
}

async function seedUsers(client) {
    // Solo insertar usuarios de ejemplo si no existe ningún usuario
    const { rows } = await client.query('SELECT COUNT(*) FROM login_credentials');
    const userCount = parseInt(rows[0].count);

    if (userCount === 0) {
        console.log('👥 No hay usuarios existentes, insertando usuarios de ejemplo...');

        const users = [
            ['juanp', 'jperez@gmail.com', 'donjuan217', 'freelancer', 'Juan Pérez'],
            ['pablito', 'pablo456@gmail.com', 'hola456', 'project_manager', 'Pablo Hernán'],
            ['csanchez', 'carlossanchez@icloud.com', 'donjuan217', 'freelancer', 'Carlos Sánchez'],
            ['laurita', 'lauraramirez@icloud.com', 'capi789', 'project_manager', 'Laura Ramírez'],
            ['noobmaster', 'nbmaster@gmail.com', 'noobmaster69', 'freelancer', 'Noob Master'],
            ['karla98', 'karlafernandez@gmail.com', 'karlaf98', 'project_manager', 'Karla Fernández']
        ];

        for (const [username, email, password, user_type, name] of users) {
            const result = await client.query(`
                INSERT INTO login_credentials (username, email, password, user_type, name) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING id
            `, [username, email, password, user_type, name]);

            const userId = result.rows[0].id;

            // Insertar detalles de usuario correspondientes
            const userDetails = getUserDetails(userId, username);
            if (userDetails) {
                await client.query(`
                    INSERT INTO user_details 
                    (user_id, first_name, last_name, phone, date_of_birth, gender, country, postal_code) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, userDetails);
            }
        }

        console.log('👥 Usuarios de ejemplo insertados');
    } else {
        console.log(`👥 Ya existen ${userCount} usuarios, saltando inserción de usuarios de ejemplo`);
    }
}

function getUserDetails(userId, username) {
    const detailsMap = {
        'juanp': [userId, 'Juan', 'Perez', '12345678', '1995-03-15', 'Male', 'Guatemala', '01001'],
        'pablito': [userId, 'Pablo', 'Hernan', '87654321', '1999-06-15', 'Male', 'Guatemala', '01001'],
        'csanchez': [userId, 'Carlos', 'Sanchez', '12348765', '2000-03-15', 'Male', 'Guatemala', '01001'],
        'laurita': [userId, 'Laura', 'Ramirez', '87651234', '2004-03-15', 'Female', 'Guatemala', '01001'],
        'noobmaster': [userId, 'TheNoob', 'Master', '24681357', '2005-04-09', 'Male', 'Guatemala', '01001'],
        'karla98': [userId, 'Karla', 'Fernandez', '98765432', '1998-05-10', 'Female', 'Guatemala', '01002']
    };

    return detailsMap[username] || null;
}

async function seedExampleData(client) {
    // Solo insertar datos de ejemplo si hay pocos registros
    const { rows: postRows } = await client.query('SELECT COUNT(*) FROM posts');
    const postCount = parseInt(postRows[0].count);

    if (postCount < 3) {
        console.log('📝 Insertando posts de ejemplo...');
        // Insertar algunos posts de ejemplo si hay usuarios
        const { rows: users } = await client.query('SELECT id FROM login_credentials LIMIT 3');

        if (users.length > 0) {
            const posts = [
                [users[0].id, 'Cómo aprender SQL', 'SQL es un lenguaje fundamental para trabajar con bases de datos...', 'https://mi-imagen.com/sql.jpg', 1],
                [users[1]?.id || users[0].id, 'Desarrollo web con JavaScript', 'JavaScript es el lenguaje de programación más popular...', 'https://mi-imagen.com/javascript.jpg', 1],
                [users[2]?.id || users[0].id, 'Mejores prácticas de seguridad', 'En este post, revisamos las mejores prácticas...', 'https://mi-imagen.com/security.jpg', 1]
            ];

            for (const [user_id, title, content, image_url, category_id] of posts) {
                await client.query(`
                    INSERT INTO posts (user_id, title, content, image_url, category_id, created_at, updated_at) 
                    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                `, [user_id, title, content, image_url, category_id]);
            }
        }
    }
}

module.exports = { seedDatabase };

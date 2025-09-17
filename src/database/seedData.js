/**
 * Función para verificar y completar datos faltantes después de init.sql
 * Solo actúa como verificador, no duplica datos
 */
async function seedDatabase(pool) {
    const client = await pool.connect();

    try {
        console.log('🔍 Verificando integridad de datos post-init.sql...');

        // 1. Verificar que existan categorías mínimas
        await verifyMinimalData(client);

        console.log('✅ Verificación de datos completada exitosamente');

    } catch (error) {
        console.error('❌ Error durante la verificación:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function verifyMinimalData(client) {
    // Verificar categorías
    const { rows: categories } = await client.query('SELECT COUNT(*) FROM categories');
    const categoryCount = parseInt(categories[0].count);

    if (categoryCount === 0) {
        console.log('⚠️ No hay categorías, añadiendo básicas...');
        const basicCategories = ['Tecnología', 'Diseño', 'Marketing', 'Escritura', 'Traducción'];

        for (const category of basicCategories) {
            await client.query(`INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING`, [category]);
        }
        console.log('📁 Categorías básicas insertadas');
    } else {
        console.log(`📁 ${categoryCount} categorías verificadas`);
    }

    // Verificar usuarios
    const { rows: users } = await client.query('SELECT COUNT(*) FROM login_credentials');
    const userCount = parseInt(users[0].count);
    console.log(`👥 ${userCount} usuarios verificados en la base de datos`);

    // Verificar skills
    const { rows: skills } = await client.query('SELECT COUNT(*) FROM skills');
    const skillCount = parseInt(skills[0].count);
    console.log(`🛠️ ${skillCount} skills verificadas en la base de datos`);
}

module.exports = { seedDatabase };

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

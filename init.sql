-- Tabla de credenciales de login
CREATE TABLE IF NOT EXISTS login_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('freelancer', 'project_manager')),
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de detalles de usuario
CREATE TABLE IF NOT EXISTS user_details (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20) UNIQUE,
    date_of_birth DATE,
    gender VARCHAR(10),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);




-- Tabla de proyectos (SINGULAR - project, no projects)
CREATE TABLE IF NOT EXISTS project (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    freelancer_id INT REFERENCES login_credentials(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    deadline DATE,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
    category_id INT REFERENCES categories(id),
    skills_required TEXT[],
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    completion_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de propuestas de freelancers
CREATE TABLE IF NOT EXISTS project_proposals (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    freelancer_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    proposed_budget DECIMAL(10,2) NOT NULL,
    delivery_time INT NOT NULL,
    proposal_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    cover_letter TEXT,
    portfolio_links TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, freelancer_id)
);

-- Tabla de reviews
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    project_id INT UNIQUE NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    reviewed_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de skills
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de relación entre freelancers y skills
CREATE TABLE IF NOT EXISTS freelancer_skills (
    id SERIAL PRIMARY KEY,
    freelancer_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INT CHECK (proficiency_level BETWEEN 1 AND 5),
    years_of_experience DECIMAL(4,1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(freelancer_id, skill_id)
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    author_name VARCHAR(255),
    author_avatar VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    category_id INT REFERENCES categories(id),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Índices para performance 
create index idx_posts_user_id on posts(user_id);
create index idx_posts_category_id on posts(category_id);
create index idx_posts_created_at on posts(created_at);


CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY REFERENCES login_credentials(id) ON DELETE CASCADE,
    avatar VARCHAR(255),
    bio TEXT,
    interests TEXT,
    profile_views INTEGER DEFAULT 0,
    projects_count INTEGER DEFAULT 0,
    connections_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('message', 'opportunity', 'project_update', 'like', 'comment')),
    priority SMALLINT DEFAULT 0,
    read_status BOOLEAN DEFAULT FALSE,
    related_id INTEGER,
    related_type VARCHAR(50) CHECK (related_type IN ('post', 'project', 'message')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice optimizado que propusiste
CREATE INDEX idx_notifications_user_read_date 
    ON notifications(user_id, read_status, created_at DESC);

-- ========== INSERTS ==========

-- Insertar usuarios
INSERT INTO login_credentials (username, email, password, user_type, name) VALUES 
('juanp', 'jperez@gmail.com', 'donjuan217', 'freelancer', 'Juan Pérez'),
('pablito', 'pablo456@gmail.com', 'hola456', 'project_manager', 'Pablo Hernán'),
('csanchez', 'carlossanchez@icloud.com', 'donjuan217', 'freelancer', 'Carlos Sánchez'),
('laurita', 'lauraramirez@icloud.com', 'capi789', 'project_manager', 'Laura Ramírez'),
('noobmaster', 'nbmaster@gmail.com', 'noobmaster69', 'freelancer', 'Noob Master'),
('karla98', 'karlafernandez@gmail.com', 'karlaf98', 'project_manager', 'Karla Fernández');

-- Insertar detalles de usuarios
INSERT INTO user_details (user_id, first_name, last_name, phone, date_of_birth, gender, country, postal_code) VALUES
(1, 'Juan', 'Perez', '12345678', '1995-03-15', 'Male', 'Guatemala', '01001'),
(2, 'Pablo', 'Hernan', '87654321', '1999-06-15', 'Male', 'Guatemala', '01001'),
(3, 'Carlos', 'Sanchez', '12348765', '2000-03-15', 'Male', 'Guatemala', '01001'),
(4, 'Laura', 'Ramirez', '87651234', '2004-03-15', 'Female', 'Guatemala', '01001'),
(5, 'TheNoob', 'Master', '24681357', '2005-04-09', 'Male', 'Guatemala', '01001'),
(6, 'Karla', 'Fernandez', '98765432', '1998-05-10', 'Female', 'Guatemala', '01002');

-- Insertar categorías
INSERT INTO categories (name) VALUES 
('Tecnología'),
('Salud'),
('Deportes'),
('Entretenimiento'),
('Educación');


-- Insertar proyectos
INSERT INTO project (client_id, freelancer_id, title, description, budget, deadline, status, category_id, skills_required, priority) VALUES 
(1, 5, 'Desarrollo de página web corporativa', 'Necesito una página web moderna para mi empresa con diseño responsive y sistema de contacto', 1500.00, '2025-07-15', 'open', 1, ARRAY['HTML', 'CSS', 'JavaScript', 'React'], 'high'),
(2, 3, 'App móvil de delivery', 'Aplicación móvil para delivery de comida con sistema de pagos integrado', 3000.00, '2025-08-30', 'open', 1, ARRAY['React Native', 'Node.js', 'MongoDB'], 'medium'),
(3, 1, 'Sistema de gestión escolar', 'Sistema web para gestionar estudiantes, notas y asistencia', 2500.00, '2025-09-01', 'open', 1, ARRAY['Python', 'Django', 'PostgreSQL'], 'medium'),
(4, 5, 'Campaña de marketing digital', 'Diseño de campaña publicitaria para redes sociales', 800.00, '2025-06-30', 'open', 4, ARRAY['Photoshop', 'Marketing Digital', 'Redes Sociales'], 'low');

-- Insertar propuestas
INSERT INTO project_proposals (project_id, freelancer_id, proposed_budget, delivery_time, proposal_text, cover_letter) VALUES 
(1, 5, 1400.00, 30, 'Tengo 3 años de experiencia en desarrollo web con React. Puedo entregar el proyecto en tiempo record con diseño moderno y responsive.', 'Me interesa mucho este proyecto porque se alinea perfectamente con mi experiencia.'),
(1, 6, 1600.00, 25, 'Soy especialista en desarrollo frontend y backend. Mi propuesta incluye hosting gratuito por 6 meses.', 'Ofrezco servicios completos de desarrollo web con garantía.'),
(2, 3, 2800.00, 45, 'He desarrollado 5 apps similares. Mi propuesta incluye testing completo y documentación técnica.', 'Especialista en aplicaciones móviles con experiencia comprobada.'),
(3, 5, 2300.00, 40, 'Especialista en Python/Django con experiencia en sistemas educativos. Portfolio disponible.', 'Mi experiencia en sistemas educativos me hace el candidato ideal.');

-- Insertar algunas reviews de ejemplo
INSERT INTO reviews (project_id, reviewer_id, reviewed_id, rating, comment) VALUES 
(1, 1, 5, 5, 'Excelente trabajo, cumplió con todos los requerimientos y entregó a tiempo.'),
(2, 2, 3, 4, 'Buen trabajo, aunque hubo algunos retrasos menores.');



-- Insertar algunos skills de ejemplo
INSERT INTO skills (name, description) VALUES
('JavaScript', 'Lenguaje de programación para desarrollo web'),
('Python', 'Lenguaje de programación versátil y fácil de aprender'),
('React', 'Biblioteca JavaScript para construir interfaces de usuario'),
('Node.js', 'Entorno de ejecución para JavaScript del lado del servidor'),
('SQL', 'Lenguaje para gestionar bases de datos relacionales'),
('UI/UX Design', 'Diseño de interfaces y experiencia de usuario'),
('Project Management', 'Gestión y coordinación de proyectos'),
('DevOps', 'Prácticas que combinan desarrollo de software y operaciones');

-- Actualizar algunos usuarios existentes como freelancers
UPDATE login_credentials SET user_type = 'freelancer' WHERE id IN (1, 3, 5);
UPDATE login_credentials SET user_type = 'project_manager' WHERE id IN (2, 4, 6);

-- Asignar algunas skills a freelancers
INSERT INTO freelancer_skills (freelancer_id, skill_id, proficiency_level, years_of_experience) VALUES
(1, 1, 4, 3.5),  -- Juan Perez con JavaScript
(1, 5, 5, 4.0),  -- Juan Perez con SQL
(3, 2, 4, 2.5),  -- Carlos Sanchez con Python
(3, 3, 3, 2.0),  -- Carlos Sanchez con React
(5, 4, 4, 3.0),  -- TheNoob Master con Node.js
(5, 6, 3, 1.5);  -- TheNoob Master con UI/UX Design



INSERT INTO events (user_id, title, day, month, year) VALUES
(1, 'App Móvil Fitness', 20, 5, 2025),
(1, 'Workshop de React', 21, 5, 2025),
(1, 'Blog Personal', 25, 5, 2025),
(1, 'Networking Online', 29, 5, 2025);

-- ====================================
-- SEED DATA PARA NUEVAS ENTIDADES
-- ====================================

-- Datos para user_profiles (datos sociales)
INSERT INTO user_profiles (user_id, avatar, bio, interests, profile_views, connections_count, is_verified, is_active, last_active_at) VALUES 
(1, 'https://avatar.com/juan.jpg', 'Desarrollador full-stack con 5 años de experiencia', 'JavaScript,Node.js,React,SQL', 156, 34, true, true, NOW() - INTERVAL '2 hours'),
(2, 'https://avatar.com/maria.jpg', 'Diseñadora UI/UX especializada en aplicaciones móviles', 'Design,UI/UX,Figma,Mobile', 89, 28, false, true, NOW() - INTERVAL '1 day'),
(3, 'https://avatar.com/carlos.jpg', 'Project Manager con experiencia en equipos ágiles', 'Management,Scrum,Leadership', 203, 67, true, true, NOW() - INTERVAL '30 minutes'),
(4, 'https://avatar.com/ana.jpg', 'Data Scientist y Machine Learning Engineer', 'Python,ML,Data Science,AI', 134, 45, false, true, NOW() - INTERVAL '3 hours');

-- Datos para la nueva tabla posts (con estructura mejorada)
INSERT INTO posts (user_id, author_name, author_avatar, title, content, image_url, category_id, likes_count, comments_count) VALUES 
(1, 'Juan Pérez', 'https://avatar.com/juan.jpg', 'Cómo aprender SQL', 'SQL es un lenguaje fundamental para trabajar con bases de datos. En este artículo, aprenderás los conceptos básicos para comenzar...', 'https://mi-imagen.com/sql.jpg', 1, 23, 8),
(2, 'María González', 'https://avatar.com/maria.jpg', 'Diseño UI/UX para móviles', 'Las mejores prácticas para crear interfaces intuitivas en aplicaciones móviles. Consejos y herramientas esenciales...', 'https://mi-imagen.com/ui-design.jpg', 2, 45, 12),
(3, 'Carlos Rodríguez', 'https://avatar.com/carlos.jpg', 'Mejores prácticas de seguridad en bases de datos', 'En este post, revisamos las mejores prácticas para asegurar las bases de datos, protegiendo los datos sensibles de los usuarios...', 'https://mi-imagen.com/security.jpg', 1, 67, 15),
(1, 'Juan Pérez', 'https://avatar.com/juan.jpg', 'Optimización de consultas SQL', 'Las consultas SQL son esenciales para el rendimiento de las bases de datos. Aquí discutimos algunas técnicas para optimizarlas...', 'https://mi-imagen.com/optimize-sql.jpg', 1, 34, 9),
(2, 'María González', 'https://avatar.com/maria.jpg', 'Tendencias en UX 2025', 'Descubre las últimas tendencias en experiencia de usuario que dominarán este año...', 'https://mi-imagen.com/ux-trends.jpg', 2, 56, 18);

-- Datos para notifications
INSERT INTO notifications (user_id, message, type, priority, related_id, related_type) VALUES 
(1, 'Carlos le dio like a tu post "Cómo aprender SQL"', 'like', 0, 1, 'post'),
(1, 'Tienes una nueva propuesta de proyecto', 'opportunity', 2, 1, 'project'),
(1, 'María comentó en tu post', 'comment', 1, 1, 'post'),
(2, 'Tu proyecto "Desarrollo de API REST" ha sido actualizado', 'project_update', 1, 2, 'project'),
(2, 'Nuevo mensaje privado de Juan', 'message', 2, 1, 'message'),
(3, 'Tienes 5 nuevas conexiones pendientes', 'message', 1, NULL, NULL),
(1, 'Tu post ha recibido 25 likes', 'like', 0, 2, 'post');
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

-- Tabla de posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    category_id INT REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Insertar posts
INSERT INTO posts (user_id, title, content, image_url, category_id, created_at, updated_at) VALUES 
(1, 'Cómo aprender SQL', 'SQL es un lenguaje fundamental para trabajar con bases de datos. En este artículo, aprenderás los conceptos básicos para comenzar...', 'https://mi-imagen.com/sql.jpg', 1, NOW(), NOW()),
(2, 'Desarrollo web con JavaScript', 'JavaScript es el lenguaje de programación más popular para desarrollo web. En este artículo, exploramos sus características principales...', 'https://mi-imagen.com/javascript.jpg', 1, NOW(), NOW()),
(3, 'Mejores prácticas de seguridad en bases de datos', 'En este post, revisamos las mejores prácticas para asegurar las bases de datos, protegiendo los datos sensibles de los usuarios...', 'https://mi-imagen.com/security.jpg', 1, NOW(), NOW()),
(1, 'Introducción al diseño de interfaces de usuario', 'El diseño de interfaces de usuario es una parte clave del desarrollo de software. Este artículo cubre los principios básicos...', 'https://mi-imagen.com/ui-design.jpg', 1, NOW(), NOW()),
(2, 'Cómo optimizar consultas SQL', 'Las consultas SQL son esenciales para el rendimiento de las bases de datos. Aquí discutimos algunas técnicas para optimizarlas...', 'https://mi-imagen.com/optimize-sql.jpg', 1, NOW(), NOW());

-- Insertar proyectos
INSERT INTO project (client_id, title, description, budget, deadline, status, category_id, skills_required, priority) VALUES 
(1, 'Desarrollo de página web corporativa', 'Necesito una página web moderna para mi empresa con diseño responsive y sistema de contacto', 1500.00, '2025-07-15', 'open', 1, ARRAY['HTML', 'CSS', 'JavaScript', 'React'], 'high'),
(2, 'App móvil de delivery', 'Aplicación móvil para delivery de comida con sistema de pagos integrado', 3000.00, '2025-08-30', 'open', 1, ARRAY['React Native', 'Node.js', 'MongoDB'], 'medium'),
(3, 'Sistema de gestión escolar', 'Sistema web para gestionar estudiantes, notas y asistencia', 2500.00, '2025-09-01', 'open', 1, ARRAY['Python', 'Django', 'PostgreSQL'], 'medium'),
(4, 'Campaña de marketing digital', 'Diseño de campaña publicitaria para redes sociales', 800.00, '2025-06-30', 'open', 4, ARRAY['Photoshop', 'Marketing Digital', 'Redes Sociales'], 'low');

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
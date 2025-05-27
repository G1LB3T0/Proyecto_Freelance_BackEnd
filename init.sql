-- Tabla de credenciales de login
CREATE TABLE IF NOT EXISTS login_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
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

-- Tabla de posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- agregar url para imgagenes al post 
ALTER TABLE posts
ADD COLUMN image_url VARCHAR(255);

-- Tabla de categories para los posts
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);


--agregar relacion de post con categories
ALTER TABLE posts
  ADD COLUMN category_id INT REFERENCES categories(id);


  -- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Tabla para propuestas de freelancers
CREATE TABLE IF NOT EXISTS project_proposals (
    id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    freelancer_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    proposed_budget DECIMAL(10,2) NOT NULL,
    delivery_time INT NOT NULL, -- días
    proposal_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, freelancer_id)
);



--hace falta cambiar el tipo de dato en gender, y agregar la columna de estado para el post
-- no acepta el tipo de valor ENUM 


-- Inserciones en login_credentials con username
INSERT INTO login_credentials (username, email, password) VALUES ('juanp', 'jperez@gmail.com', 'donjuan217');
INSERT INTO login_credentials (username, email, password) VALUES ('pablito', 'pablo456@gmail.com', 'hola456');
INSERT INTO login_credentials (username, email, password) VALUES ('csanchez', 'carlossanchez@icloud.com', 'donjuan217');
INSERT INTO login_credentials (username, email, password) VALUES ('laurita', 'lauraramirez@icloud.com', 'capi789');
INSERT INTO login_credentials (username, email, password) VALUES ('noobmaster', 'nbmaster@gmail.com', 'noobmaster69');
INSERT INTO login_credentials (username, email, password) VALUES ('karla98', 'karlafernandez@gmail.com', 'karlaf98');

-- Inserciones en user_details
INSERT INTO user_details (user_id, first_name, last_name, phone, date_of_birth, gender, country, postal_code)
VALUES (1, 'Juan', 'Perez', '12345678', '1995-03-15', 'Male', 'Guatemala', '01001');

INSERT INTO user_details (user_id, first_name, last_name, phone, date_of_birth, gender, country, postal_code)
VALUES (2, 'Pablo', 'Hernan', '87654321', '1999-06-15', 'Male', 'Guatemala', '01001');

INSERT INTO user_details (user_id, first_name, last_name, phone, date_of_birth, gender, country, postal_code)
VALUES (3, 'Carlos', 'Sanchez', '12348765', '2000-03-15', 'Male', 'Guatemala', '01001');

INSERT INTO user_details (user_id, first_name, last_name, phone, date_of_birth, gender, country, postal_code)
VALUES (4, 'Laura', 'Ramirez', '87651234', '2004-03-15', 'Female', 'Guatemala', '01001');

INSERT INTO user_details (user_id, first_name, last_name, phone, date_of_birth, gender, country, postal_code)
VALUES (5, 'TheNoob', 'Master', '24681357', '2005-04-09', 'Male', 'Guatemala', '01001');

INSERT INTO user_details (user_id, first_name, last_name, phone, date_of_birth, gender, country, postal_code)
VALUES (6, 'Karla', 'Fernandez', '98765432', '1998-05-10', 'Female', 'Guatemala', '01002');


--algunas categorias 
-- Insertar algunas categorías
INSERT INTO categories (name)
VALUES 
('Tecnología'),
('Salud'),
('Deportes'),
('Entretenimiento'),
('Educación');

--Insertar algunos posts
INSERT INTO posts (user_id, title, content, image_url, created_at, updated_at)
VALUES 
(1, 'Cómo aprender SQL', 'SQL es un lenguaje fundamental para trabajar con bases de datos. En este artículo, aprenderás los conceptos básicos para comenzar...', 'https://mi-imagen.com/sql.jpg', NOW(), NOW());

INSERT INTO posts (user_id, title, content, image_url, created_at, updated_at)
VALUES 
(2, 'Desarrollo web con JavaScript', 'JavaScript es el lenguaje de programación más popular para desarrollo web. En este artículo, exploramos sus características principales...', 'https://mi-imagen.com/javascript.jpg', NOW(), NOW());

INSERT INTO posts (user_id, title, content, image_url, created_at, updated_at)
VALUES 
(3, 'Mejores prácticas de seguridad en bases de datos', 'En este post, revisamos las mejores prácticas para asegurar las bases de datos, protegiendo los datos sensibles de los usuarios...', 'https://mi-imagen.com/security.jpg', NOW(), NOW());

INSERT INTO posts (user_id, title, content, image_url, created_at, updated_at)
VALUES 
(1, 'Introducción al diseño de interfaces de usuario', 'El diseño de interfaces de usuario es una parte clave del desarrollo de software. Este artículo cubre los principios básicos...', 'https://mi-imagen.com/ui-design.jpg', NOW(), NOW());

INSERT INTO posts (user_id, title, content, image_url, created_at, updated_at)
VALUES 
(2, 'Cómo optimizar consultas SQL', 'Las consultas SQL son esenciales para el rendimiento de las bases de datos. Aquí discutimos algunas técnicas para optimizarlas...', 'https://mi-imagen.com/optimize-sql.jpg', NOW(), NOW());

-- Insertar algunos proyectos de ejemplo
INSERT INTO projects (client_id, title, description, budget, deadline, status, category_id, skills_required) VALUES 
(1, 'Desarrollo de página web corporativa', 'Necesito una página web moderna para mi empresa con diseño responsive y sistema de contacto', 1500.00, '2025-07-15', 'open', 1, ARRAY['HTML', 'CSS', 'JavaScript', 'React']),
(2, 'App móvil de delivery', 'Aplicación móvil para delivery de comida con sistema de pagos integrado', 3000.00, '2025-08-30', 'open', 1, ARRAY['React Native', 'Node.js', 'MongoDB']),
(3, 'Sistema de gestión escolar', 'Sistema web para gestionar estudiantes, notas y asistencia', 2500.00, '2025-09-01', 'open', 1, ARRAY['Python', 'Django', 'PostgreSQL']),
(4, 'Campaña de marketing digital', 'Diseño de campaña publicitaria para redes sociales', 800.00, '2025-06-30', 'open', 4, ARRAY['Photoshop', 'Marketing Digital', 'Redes Sociales']);


-- Insertar algunas propuestas de ejemplo
INSERT INTO project_proposals (project_id, freelancer_id, proposed_budget, delivery_time, proposal_text) VALUES 
(1, 5, 1400.00, 30, 'Tengo 3 años de experiencia en desarrollo web con React. Puedo entregar el proyecto en tiempo record con diseño moderno y responsive.'),
(1, 6, 1600.00, 25, 'Soy especialista en desarrollo frontend y backend. Mi propuesta incluye hosting gratuito por 6 meses.'),
(2, 3, 2800.00, 45, 'He desarrollado 5 apps similares. Mi propuesta incluye testing completo y documentación técnica.'),
(3, 5, 2300.00, 40, 'Especialista en Python/Django con experiencia en sistemas educativos. Portfolio disponible.');
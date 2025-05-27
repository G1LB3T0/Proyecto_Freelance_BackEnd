-- Tabla de credenciales de login
CREATE TABLE IF NOT EXISTS login_credentials (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('freelancer', 'project_manager')),
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



--hace falta cambiar el tipo de dato en gender, y agregar la columna de estado para el post
-- no acepta el tipo de valor ENUM 


-- Inserciones en login_credentials con username
INSERT INTO login_credentials (username, email, password, user_type) VALUES 
('juanp', 'jperez@gmail.com', 'donjuan217', 'freelancer');
INSERT INTO login_credentials (username, email, password, user_type) VALUES 
('pablito', 'pablo456@gmail.com', 'hola456', 'project_manager');
INSERT INTO login_credentials (username, email, password, user_type) VALUES 
('csanchez', 'carlossanchez@icloud.com', 'donjuan217', 'freelancer');
INSERT INTO login_credentials (username, email, password, user_type) VALUES 
('laurita', 'lauraramirez@icloud.com', 'capi789', 'project_manager');
INSERT INTO login_credentials (username, email, password, user_type) VALUES 
('noobmaster', 'nbmaster@gmail.com', 'noobmaster69', 'freelancer');
INSERT INTO login_credentials (username, email, password, user_type) VALUES 
('karla98', 'karlafernandez@gmail.com', 'karlaf98', 'project_manager');

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
--ESTE ARCHIVO ES PARA CREAR LA ESTRUCTURA DE LA BASE DE DATOS Y SEMBRAR DATOS INICIALES RICOS
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
    phone_e164 VARCHAR(20) UNIQUE,
    bio TEXT,
    profile_picture VARCHAR(500),
    website_url VARCHAR(500),
    location VARCHAR(150),
    date_of_birth DATE,
    gender VARCHAR(10),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de links sociales de usuarios
CREATE TABLE IF NOT EXISTS user_social_links (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES user_details(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, platform)
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

CREATE TABLE IF NOT EXISTS event (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    event_date TIMESTAMP NOT NULL,
    event_time VARCHAR(10),
    category VARCHAR(100),
    is_public BOOLEAN DEFAULT true,
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    day INT NOT NULL CHECK (day BETWEEN 1 AND 31),
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Tabla de respuestas del cuestionario de proyectos
CREATE TABLE IF NOT EXISTS project_questionnaire_responses (
    id SERIAL PRIMARY KEY,
    project_id INT UNIQUE REFERENCES project(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES login_credentials(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE, -- Para respuestas temporales antes de crear proyecto
    
    -- Información del proyecto
    project_type VARCHAR(100),
    project_scope VARCHAR(50) CHECK (project_scope IN ('small', 'medium', 'large')),
    timeline VARCHAR(50) CHECK (timeline IN ('urgent', 'normal', 'flexible')),
    budget_range VARCHAR(50) CHECK (budget_range IN ('<1k', '1k-5k', '5k-10k', '10k+')),
    
    -- Detalles técnicos
    technical_level VARCHAR(50) CHECK (technical_level IN ('basic', 'intermediate', 'advanced')),
    preferred_tools TEXT[], -- Array de herramientas preferidas
    design_provided BOOLEAN DEFAULT FALSE, -- ¿Tiene diseños listos?
    content_ready BOOLEAN DEFAULT FALSE, -- ¿Tiene el contenido listo?
    
    -- Comunicación y seguimiento
    communication_frequency VARCHAR(50) CHECK (communication_frequency IN ('daily', 'weekly', 'milestone')),
    meeting_preference VARCHAR(50) CHECK (meeting_preference IN ('video', 'chat', 'email')),
    timezone VARCHAR(100),
    
    -- Requerimientos especiales
    special_requirements TEXT, -- Texto libre para requerimientos especiales
    target_audience VARCHAR(255),
    success_metrics TEXT, -- Cómo medir el éxito del proyecto
    
    -- Referencias y ejemplos
    inspiration_links TEXT[], -- URLs de referencia
    competitor_analysis TEXT, -- Análisis de competencia
    
    -- Metadatos
    is_complete BOOLEAN DEFAULT FALSE, -- ¿Cuestionario completado?
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para la tabla de cuestionarios
CREATE INDEX idx_questionnaire_user_id ON project_questionnaire_responses(user_id);
CREATE INDEX idx_questionnaire_session_id ON project_questionnaire_responses(session_id);
CREATE INDEX idx_questionnaire_is_complete ON project_questionnaire_responses(is_complete);

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
INSERT INTO user_details (user_id, first_name, last_name, phone_e164, date_of_birth, gender, country, postal_code) VALUES
(1, 'Juan', 'Perez', '+50212345678', '1995-03-15', 'Male', 'Guatemala', '01001'),
(2, 'Pablo', 'Hernan', '+50287654321', '1999-06-15', 'Male', 'Guatemala', '01001'),
(3, 'Carlos', 'Sanchez', '+50212348765', '2000-03-15', 'Male', 'Guatemala', '01001'),
(4, 'Laura', 'Ramirez', '+50287651234', '2004-03-15', 'Female', 'Guatemala', '01001'),
(5, 'TheNoob', 'Master', '+50224681357', '2005-04-09', 'Male', 'Guatemala', '01001'),
(6, 'Karla', 'Fernandez', '+50298765432', '1998-05-10', 'Female', 'Guatemala', '01002');

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



-- Datos de eventos próximos (upcoming events) para la home page
INSERT INTO event (user_id, title, description, location, event_date, event_time, category, is_public, max_attendees, current_attendees, status, day, month, year) VALUES 
(1, 'Conferencia de JavaScript 2025', 'Únete a la conferencia más grande de JavaScript del año. Aprende sobre las últimas tecnologías y frameworks como React 19, Node.js 20, y las nuevas herramientas de desarrollo.', 'Centro de Convenciones Tech', '2025-08-13 09:00:00', '09:00', 'Tecnología', true, 500, 247, 'active', 13, 8, 2025),
(2, 'Workshop de React Avanzado', 'Taller práctico para desarrolladores que quieren llevar sus habilidades de React al siguiente nivel. Incluye hooks avanzados, context API y patterns de optimización.', 'Aula Virtual - Zoom', '2025-08-19 14:00:00', '14:00', 'Educación', true, 50, 35, 'active', 19, 8, 2025),
(3, 'Networking para Freelancers', 'Evento de networking presencial para conectar freelancers, emprendedores y potenciales clientes. Incluye presentaciones de pitch de 2 minutos.', 'Coworking Space Downtown', '2025-09-11 18:30:00', '18:30', 'Networking', true, 100, 67, 'active', 11, 9, 2025),
(1, 'Hackathon 48 horas - IA y Sostenibilidad', 'Competencia de desarrollo de aplicaciones enfocada en inteligencia artificial para soluciones sostenibles. Premios de $10,000 USD.', 'Universidad Tech - Campus Central', '2025-08-26 19:00:00', '19:00', 'Competencia', true, 200, 134, 'active', 26, 8, 2025),
(4, 'Curso de UX/UI Design - Intensivo', 'Curso intensivo de diseño UX/UI para principiantes y profesionales. 3 días de inmersión total en metodologías de diseño centrado en el usuario.', 'Online - Plataforma propia', '2025-09-02 10:00:00', '10:00', 'Diseño', true, 75, 45, 'active', 2, 9, 2025),
(2, 'Meetup de Node.js Developers', 'Encuentro mensual de desarrolladores de Node.js. Este mes: Microservicios con Fastify y mejores prácticas de deployment.', 'Café Tech Hub', '2025-08-15 19:00:00', '19:00', 'Tecnología', true, 40, 28, 'active', 15, 8, 2025),
(3, 'Conferencia de Ciberseguridad', 'Evento especializado en las últimas tendencias de ciberseguridad, ethical hacking y protección de datos empresariales.', 'Hotel Marriott - Salón Principal', '2025-09-18 08:30:00', '08:30', 'Seguridad', true, 300, 189, 'active', 18, 9, 2025),

-- NUEVOS EVENTOS AGREGADOS PARA MÁS VARIEDAD
(5, 'Bootcamp de Python para Principiantes', 'Aprende Python desde cero en este intensivo de 3 días. Incluye ejercicios prácticos, proyectos reales y certificado de participación.', 'Academia de Programación Central', '2025-08-14 09:30:00', '09:30', 'Educación', true, 30, 18, 'active', 14, 8, 2025),

(6, 'Taller de Marketing Digital para Freelancers', 'Estrategias efectivas de marketing digital específicamente diseñadas para freelancers. Aprende a posicionar tu marca personal.', 'Hub de Emprendimiento', '2025-08-17 10:00:00', '10:00', 'Marketing', true, 25, 12, 'active', 17, 8, 2025),

(1, 'Conferencia de Machine Learning y AI', 'Explora las últimas tendencias en inteligencia artificial, machine learning y deep learning. Con expertos internacionales.', 'Centro de Convenciones Tech', '2025-08-20 08:00:00', '08:00', 'Tecnología', true, 400, 267, 'active', 20, 8, 2025),

(2, 'Workshop de Figma y Prototipado', 'Domina Figma para crear prototipos interactivos y diseños colaborativos. Desde básico hasta avanzado en un día.', 'Estudio de Diseño Creativo', '2025-08-22 14:30:00', '14:30', 'Diseño', true, 20, 15, 'active', 22, 8, 2025),

(4, 'Meetup de Data Science', 'Encuentro mensual de científicos de datos. Tema del mes: Análisis predictivo con Python y R. Networking incluido.', 'Café Data Lab', '2025-08-24 18:00:00', '18:00', 'Tecnología', true, 35, 22, 'active', 24, 8, 2025),

(3, 'Conferencia de Blockchain y Criptomonedas', 'Todo lo que necesitas saber sobre blockchain, NFTs, DeFi y el futuro de las finanzas descentralizadas.', 'Auditorio Financiero', '2025-08-28 09:00:00', '09:00', 'Fintech', true, 250, 178, 'active', 28, 8, 2025),

(5, 'Taller de Testing Automatizado', 'Aprende a implementar testing automatizado en tus aplicaciones. Cypress, Jest, Selenium y mejores prácticas.', 'Online - Plataforma Tech', '2025-08-30 16:00:00', '16:00', 'Tecnología', true, 40, 29, 'active', 30, 8, 2025),

(6, 'Evento de Emprendimiento Tech', 'Presenta tu startup tech, conecta con inversores y conoce las últimas tendencias del ecosistema emprendedor.', 'Incubadora StartUp Valley', '2025-09-03 19:00:00', '19:00', 'Emprendimiento', true, 80, 54, 'active', 3, 9, 2025),

(1, 'Workshop de DevOps y Kubernetes', 'Domina Docker, Kubernetes y las mejores prácticas de DevOps para deployments escalables y seguros.', 'Tech Training Center', '2025-09-05 10:30:00', '10:30', 'Tecnología', true, 45, 33, 'active', 5, 9, 2025),

(2, 'Conferencia de Diseño UX/UI 2025', 'Los mejores diseñadores del país comparten sus experiencias, metodologías y casos de éxito en UX/UI.', 'Palacio de Convenciones', '2025-09-08 08:30:00', '08:30', 'Diseño', true, 300, 213, 'active', 8, 9, 2025),

(4, 'Bootcamp de Project Management', 'Metodologías ágiles, Scrum, Kanban y herramientas modernas para gestionar proyectos exitosamente.', 'Instituto de Gestión', '2025-09-12 09:00:00', '09:00', 'Gestión', true, 60, 41, 'active', 12, 9, 2025),

(3, 'Hackathon de Salud Digital', 'Desarrolla soluciones tecnológicas para el sector salud. Premios de $15,000 USD y mentoring incluido.', 'Hospital Tech Innovation', '2025-09-15 18:00:00', '18:00', 'Competencia', true, 150, 89, 'active', 15, 9, 2025),

(5, 'Taller de APIs y Microservicios', 'Aprende a diseñar e implementar APIs RESTful y arquitectura de microservicios con Node.js y Spring Boot.', 'Centro de Desarrollo', '2025-09-20 15:00:00', '15:00', 'Tecnología', true, 35, 24, 'active', 20, 9, 2025),

(6, 'Evento de Women in Tech', 'Celebramos a las mujeres en tecnología. Charlas inspiracionales, networking y oportunidades profesionales.', 'Auditorio Empresarial', '2025-09-25 17:30:00', '17:30', 'Networking', true, 120, 87, 'active', 25, 9, 2025),

(1, 'Conferencia de Cloud Computing', 'AWS, Azure, Google Cloud y las mejores prácticas para migrar y optimizar aplicaciones en la nube.', 'Centro de Convenciones Tech', '2025-10-02 08:00:00', '08:00', 'Tecnología', true, 350, 198, 'active', 2, 10, 2025),

(2, 'Workshop de Mobile Development', 'Desarrollo de aplicaciones móviles nativas y cross-platform. React Native, Flutter y Swift en un solo evento.', 'Mobile Dev Studio', '2025-10-05 13:00:00', '13:00', 'Tecnología', true, 50, 37, 'active', 5, 10, 2025),

(4, 'Meetup de Freelancers Avanzados', 'Para freelancers experimentados: estrategias de pricing, gestión de clientes internacionales y escalamiento.', 'Coworking Premium', '2025-10-10 19:00:00', '19:00', 'Freelancing', true, 40, 28, 'active', 10, 10, 2025),

(3, 'Conferencia de E-commerce y Fintech', 'Tendencias en comercio electrónico, payment gateways, y soluciones fintech para América Latina.', 'Hotel Business Center', '2025-10-15 09:30:00', '09:30', 'Fintech', true, 200, 142, 'active', 15, 10, 2025),

-- Eventos pasados para testing
(1, 'Meetup de JavaScript - Agosto', 'Evento pasado para testing de filtros de fechas', 'Café Tech Hub', '2025-08-01 18:00:00', '18:00', 'Tecnología', true, 30, 25, 'completed', 1, 8, 2025),
(2, 'Workshop de CSS Grid', 'Evento pasado para testing', 'Online', '2025-07-28 15:00:00', '15:00', 'Educación', true, 25, 20, 'completed', 28, 7, 2025);

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
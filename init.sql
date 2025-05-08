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

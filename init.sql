
CREATE TABLE IF NOT EXISTS login_credentials (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO login_credentials (email, password) VALUES ('jperez@gmail.com', 'donjuan217');
INSERT INTO login_credentials (email, password) VALUES ('pablo456@gmail.com', 'hola456');
INSERT INTO login_credentials (email, password) VALUES ('carlossanchez@icloud.com', 'donjuan217');
INSERT INTO login_credentials (email, password) VALUES ('lauraramirez@icloud.com', 'capi789');
INSERT INTO login_credentials (email, password) VALUES ('nbmaster@gmail.com', 'noobmaster69');

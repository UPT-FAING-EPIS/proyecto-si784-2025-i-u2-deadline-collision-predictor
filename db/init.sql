CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo ENUM('tarea', 'examen', 'proyecto') NOT NULL,
    deadline DATETIME NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completado TINYINT(1) DEFAULT '0',
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insertar un usuario de prueba para las pruebas de Playwright
-- Contraseña: password123 (hash generado con bcryptjs)
INSERT IGNORE INTO usuarios (username, password_hash) VALUES (
    'test@example.com', '$2a$10$tJ9fFpL5JpX2oD.xG/i.1e/n.o2i/L.e/Xl.o.e/X.2o/o2'
); 
/*CREATE TABLE IF NOT EXISTS usuarios (
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
*/
-- se comento la anterior bd expuesta en el init (JL)
CREATE TABLE IF NOT EXISTS `eventos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('tarea','examen','proyecto') COLLATE utf8mb4_unicode_ci NOT NULL,
  `deadline` datetime NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla deadline_collision.usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


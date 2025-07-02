-- =====================================================
-- INSTALACIÓN PASO A PASO DE INTEGRACIÓN CON MOODLE
-- =====================================================

-- Paso 1: Crear tabla de configuración de Moodle
SELECT 'Paso 1: Creando tabla user_moodle_config...' as status;

CREATE TABLE IF NOT EXISTS `user_moodle_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `moodle_url` varchar(255) NOT NULL,
  `moodle_token` varchar(255) NOT NULL,
  `moodle_user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `moodle_user_id` (`moodle_user_id`),
  CONSTRAINT `user_moodle_config_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Tabla user_moodle_config creada/verificada' as result;

-- Paso 2: Crear tabla de cursos de Moodle
SELECT 'Paso 2: Creando tabla moodle_courses...' as status;

CREATE TABLE IF NOT EXISTS `moodle_courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `user_id` int NOT NULL,
  `fullname` varchar(255) NOT NULL,
  `shortname` varchar(100) NOT NULL,
  `summary` text,
  `startdate` date NULL,
  `enddate` date NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_user_unique` (`course_id`, `user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `moodle_courses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Tabla moodle_courses creada/verificada' as result;

-- Paso 3: Crear tabla de tareas de Moodle
SELECT 'Paso 3: Creando tabla moodle_assignments...' as status;

CREATE TABLE IF NOT EXISTS `moodle_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assignment_id` int NOT NULL,
  `course_id` int NOT NULL,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `intro` text,
  `duedate` datetime NULL,
  `allowsubmissionsfromdate` datetime NULL,
  `cutoffdate` datetime NULL,
  `maxattempts` int DEFAULT -1,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `assignment_user_unique` (`assignment_id`, `user_id`),
  KEY `course_id` (`course_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `moodle_assignments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Tabla moodle_assignments creada/verificada' as result;

-- Paso 4: Crear tabla de eventos del calendario de Moodle
SELECT 'Paso 4: Creando tabla moodle_calendar_events...' as status;

CREATE TABLE IF NOT EXISTS `moodle_calendar_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NOT NULL,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `eventtype` varchar(50) NOT NULL,
  `timestart` datetime NOT NULL,
  `timeduration` int DEFAULT 0,
  `courseid` int NULL,
  `categoryid` int NULL,
  `groupid` int NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_user_unique` (`event_id`, `user_id`),
  KEY `user_id` (`user_id`),
  KEY `courseid` (`courseid`),
  CONSTRAINT `moodle_calendar_events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✓ Tabla moodle_calendar_events creada/verificada' as result;

-- Paso 5: Agregar columnas a la tabla eventos
SELECT 'Paso 5: Agregando columnas a la tabla eventos...' as status;

-- Verificar si la columna moodle_assignment_id existe
SET @assignment_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                         WHERE TABLE_SCHEMA = DATABASE() 
                         AND TABLE_NAME = 'eventos' 
                         AND COLUMN_NAME = 'moodle_assignment_id');

-- Agregar columna si no existe
SET @sql = IF(@assignment_exists = 0, 
              'ALTER TABLE `eventos` ADD COLUMN `moodle_assignment_id` int NULL',
              'SELECT "Columna moodle_assignment_id ya existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si la columna moodle_course_id existe
SET @course_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
                      WHERE TABLE_SCHEMA = DATABASE() 
                      AND TABLE_NAME = 'eventos' 
                      AND COLUMN_NAME = 'moodle_course_id');

-- Agregar columna si no existe
SET @sql = IF(@course_exists = 0, 
              'ALTER TABLE `eventos` ADD COLUMN `moodle_course_id` int NULL',
              'SELECT "Columna moodle_course_id ya existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✓ Columnas agregadas a la tabla eventos' as result;

-- Paso 6: Agregar índices
SELECT 'Paso 6: Agregando índices...' as status;

-- Verificar y agregar índice para moodle_assignment_id
SET @assignment_index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                               WHERE TABLE_SCHEMA = DATABASE() 
                               AND TABLE_NAME = 'eventos' 
                               AND INDEX_NAME = 'moodle_assignment_id');

SET @sql = IF(@assignment_index_exists = 0, 
              'ALTER TABLE `eventos` ADD KEY `moodle_assignment_id` (`moodle_assignment_id`)',
              'SELECT "Índice moodle_assignment_id ya existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar y agregar índice para moodle_course_id
SET @course_index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                           WHERE TABLE_SCHEMA = DATABASE() 
                           AND TABLE_NAME = 'eventos' 
                           AND INDEX_NAME = 'moodle_course_id');

SET @sql = IF(@course_index_exists = 0, 
              'ALTER TABLE `eventos` ADD KEY `moodle_course_id` (`moodle_course_id`)',
              'SELECT "Índice moodle_course_id ya existe" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT '✓ Índices agregados' as result;

-- Paso 7: Verificación final
SELECT 'Paso 7: Verificación final...' as status;

-- Mostrar resumen de tablas creadas
SELECT 
  TABLE_NAME,
  'Creada' as status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN (
  'user_moodle_config',
  'moodle_courses', 
  'moodle_assignments',
  'moodle_calendar_events'
)
ORDER BY TABLE_NAME;

-- Mostrar columnas agregadas a eventos
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'eventos' 
AND COLUMN_NAME IN ('moodle_assignment_id', 'moodle_course_id')
ORDER BY COLUMN_NAME;

SELECT '🎉 ¡Instalación de integración con Moodle completada exitosamente!' as final_status; 
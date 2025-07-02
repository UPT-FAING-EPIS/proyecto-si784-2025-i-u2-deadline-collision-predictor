-- Tabla para configuración de Moodle por usuario
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

-- Tabla para cursos de Moodle
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

-- Tabla para tareas de Moodle
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

-- Agregar campos de referencia a Moodle en la tabla eventos existente
ALTER TABLE `eventos` 
ADD COLUMN `moodle_assignment_id` int NULL,
ADD COLUMN `moodle_course_id` int NULL,
ADD KEY `moodle_assignment_id` (`moodle_assignment_id`),
ADD KEY `moodle_course_id` (`moodle_course_id`);

-- Tabla para eventos del calendario de Moodle
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
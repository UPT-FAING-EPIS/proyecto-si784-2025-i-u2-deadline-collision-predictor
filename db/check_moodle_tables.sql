-- =====================================================
-- SCRIPT DE VERIFICACIÓN Y DIAGNÓSTICO PARA MOODLE
-- =====================================================

-- Verificar si las tablas de Moodle existen
SELECT 
  TABLE_NAME,
  CASE 
    WHEN TABLE_NAME IS NOT NULL THEN 'EXISTE'
    ELSE 'NO EXISTE'
  END as status
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN (
  'user_moodle_config',
  'moodle_courses', 
  'moodle_assignments',
  'moodle_calendar_events'
)
ORDER BY TABLE_NAME;

-- Verificar estructura de la tabla eventos
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'eventos'
ORDER BY ORDINAL_POSITION;

-- Verificar si las columnas de Moodle existen en eventos
SELECT 
  COLUMN_NAME,
  CASE 
    WHEN COLUMN_NAME IS NOT NULL THEN 'EXISTE'
    ELSE 'NO EXISTE'
  END as status
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'eventos' 
AND COLUMN_NAME IN ('moodle_assignment_id', 'moodle_course_id')
ORDER BY COLUMN_NAME;

-- Verificar índices en la tabla eventos
SELECT 
  INDEX_NAME,
  COLUMN_NAME,
  NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'eventos'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Verificar restricciones de clave foránea
SELECT 
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() 
AND REFERENCED_TABLE_NAME IS NOT NULL
AND TABLE_NAME LIKE '%moodle%'
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Mostrar versión de MySQL
SELECT VERSION() as mysql_version;

-- Mostrar configuración de SQL mode
SELECT @@sql_mode as sql_mode; 
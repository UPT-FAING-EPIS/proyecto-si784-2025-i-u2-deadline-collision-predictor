# Integración con Moodle

Esta guía te ayudará a configurar y usar la integración con Moodle en tu aplicación **Deadline Collision Predictor**.

## 🎯 Características de la Integración

- **Sincronización de Cursos**: Obtiene automáticamente todos tus cursos de Moodle
- **Sincronización de Tareas**: Importa todas las tareas y asignaciones con sus fechas límite
- **Sincronización de Calendario**: Integra eventos del calendario de Moodle
- **Detección de Colisiones**: Identifica automáticamente conflictos entre deadlines
- **Interfaz Unificada**: Visualiza todo en tu calendario personal

## 📋 Requisitos Previos

1. **Acceso a Moodle**: Necesitas tener acceso a una plataforma Moodle
2. **Token de Acceso**: Debes generar un token de seguridad en Moodle
3. **ID de Usuario**: Tu ID de usuario en la plataforma Moodle

## 🔧 Configuración Paso a Paso

### Paso 1: Instalar las Tablas de Base de Datos

**IMPORTANTE**: Antes de usar la integración, debes ejecutar las migraciones de base de datos.

#### Opción A: Instalación Automática (Recomendada)
```bash
# Ejecuta el script de instalación paso a paso
mysql -u tu_usuario -p tu_base_de_datos < db/install_moodle_integration.sql
```

#### Opción B: Instalación Simple
```bash
# Si la opción A falla, usa esta versión más simple
mysql -u tu_usuario -p tu_base_de_datos < db/migrations/add_moodle_tables_simple.sql
```

#### Opción C: Instalación Manual
```bash
# Si las opciones anteriores fallan, ejecuta las migraciones por separado
mysql -u tu_usuario -p tu_base_de_datos < db/migrations/add_moodle_tables.sql
```

#### Verificar la Instalación
```bash
# Ejecuta el script de verificación para diagnosticar problemas
mysql -u tu_usuario -p tu_base_de_datos < db/check_moodle_tables.sql
```

### Paso 2: Obtener tu Token de Moodle

1. **Inicia sesión** en tu plataforma Moodle
2. **Ve a tu perfil** (haz clic en tu nombre en la esquina superior derecha)
3. **Selecciona "Preferencias"** o "Configuración"
4. **Busca la sección "Servicios web"** o "Tokens de seguridad"
5. **Haz clic en "Crear token"** o "Generar token"
6. **Copia el token generado** (guárdalo en un lugar seguro)

### Paso 3: Obtener tu ID de Usuario

1. **Ve a tu perfil** en Moodle
2. **Busca tu ID de usuario** en la URL o en la información del perfil
3. **Anota el número** (ejemplo: 123)

### Paso 4: Configurar la Integración

1. **Accede a la página de Moodle** en tu aplicación
2. **Completa el formulario** con:
   - **URL de Moodle**: La URL completa de tu plataforma (ej: `https://moodle.tuuniversidad.edu`)
   - **Token de Acceso**: El token que generaste en el Paso 2
   - **ID de Usuario**: Tu ID de usuario de Moodle
3. **Haz clic en "Guardar Configuración"**

## 🔄 Proceso de Sincronización

### 1. Sincronizar Cursos
- Haz clic en **"Sincronizar Cursos"**
- Se importarán todos tus cursos de Moodle
- Podrás ver la lista de cursos con sus detalles

### 2. Sincronizar Tareas
- Haz clic en **"Sincronizar Tareas"**
- Se importarán todas las tareas de tus cursos
- Las tareas aparecerán automáticamente en tu calendario

### 3. Sincronizar Calendario
- Haz clic en **"Sincronizar Calendario"**
- Se importarán los eventos del calendario de Moodle
- Se integrarán con tu calendario personal

## 📊 Visualización de Datos

### Cursos
- **Nombre completo** del curso
- **Código corto** del curso
- **Descripción** (si está disponible)
- **Fechas de inicio y fin**
- **Botón para ver tareas** del curso

### Tareas
- **Nombre de la tarea**
- **Descripción** detallada
- **Fecha límite** con indicadores visuales:
  - 🟢 **Verde**: Tarea con tiempo suficiente
  - 🟡 **Amarillo**: Tarea próxima a vencer (menos de 7 días)
  - 🔴 **Rojo**: Tarea vencida
- **Botón para agregar al calendario**

## 🎨 Características Especiales

### Indicadores de Estado
- **Tareas vencidas**: Se muestran en rojo con icono de advertencia
- **Tareas próximas**: Se muestran en amarillo con icono de reloj
- **Tareas normales**: Se muestran en verde con icono de check

### Integración con Calendario
- Las tareas de Moodle aparecen automáticamente en tu calendario
- Se marcan con el prefijo `[Curso]` para identificarlas
- Mantienen la sincronización con Moodle

### Detección de Colisiones
- El sistema detecta automáticamente cuando tienes múltiples tareas en la misma fecha
- Te sugiere fechas alternativas para organizarte mejor

## 🔒 Seguridad

- **Tokens encriptados**: Los tokens se almacenan de forma segura
- **Validación de credenciales**: Se verifica la validez de las credenciales antes de guardarlas
- **Acceso personal**: Cada usuario solo ve sus propios datos

## 🛠️ Solución de Problemas

### Error: "Credenciales de Moodle inválidas"
- Verifica que la URL de Moodle sea correcta
- Asegúrate de que el token no haya expirado
- Confirma que el ID de usuario sea correcto

### Error: "No se encontraron cursos"
- Verifica que tengas cursos asignados en Moodle
- Confirma que tu token tenga permisos para acceder a cursos
- Revisa que el ID de usuario sea correcto

### Error: "Error de conexión con Moodle"
- Verifica tu conexión a internet
- Confirma que la URL de Moodle sea accesible
- Revisa que el servidor de Moodle esté funcionando

### Error: "Error en la base de datos"

#### Problema: Error al ejecutar migraciones
**Solución:**
1. **Ejecuta el script de verificación**:
   ```bash
   mysql -u tu_usuario -p tu_base_de_datos < db/check_moodle_tables.sql
   ```

2. **Si hay errores, usa la instalación paso a paso**:
   ```bash
   mysql -u tu_usuario -p tu_base_de_datos < db/install_moodle_integration.sql
   ```

3. **Si persisten los errores, ejecuta manualmente**:
   ```sql
   -- Verificar versión de MySQL
   SELECT VERSION();
   
   -- Verificar configuración de SQL mode
   SELECT @@sql_mode;
   
   -- Crear tablas una por una
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
     CONSTRAINT `user_moodle_config_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

#### Problema: Columnas no se agregaron a la tabla eventos
**Solución:**
```sql
-- Agregar columnas manualmente
ALTER TABLE `eventos` ADD COLUMN `moodle_assignment_id` int NULL;
ALTER TABLE `eventos` ADD COLUMN `moodle_course_id` int NULL;

-- Agregar índices
ALTER TABLE `eventos` ADD KEY `moodle_assignment_id` (`moodle_assignment_id`);
ALTER TABLE `eventos` ADD KEY `moodle_course_id` (`moodle_course_id`);
```

#### Problema: Error de restricción de clave foránea
**Solución:**
1. **Verifica que la tabla `usuarios` existe**:
   ```sql
   SHOW TABLES LIKE 'usuarios';
   ```

2. **Verifica la estructura de la tabla usuarios**:
   ```sql
   DESCRIBE usuarios;
   ```

3. **Si la tabla no existe, créala primero**:
   ```sql
   CREATE TABLE IF NOT EXISTS `usuarios` (
     `id` int NOT NULL AUTO_INCREMENT,
     `username` varchar(50) NOT NULL,
     `password_hash` varchar(255) NOT NULL,
     `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (`id`),
     UNIQUE KEY `username` (`username`)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   ```

### Error: "MySQL version not supported"
**Solución:**
- **MySQL 5.7+**: Usa `db/migrations/add_moodle_tables_simple.sql`
- **MySQL 8.0+**: Usa `db/install_moodle_integration.sql`
- **Versiones anteriores**: Ejecuta las migraciones manualmente

## 📱 Uso Móvil

La integración es completamente responsiva y funciona en:
- **Smartphones** y tablets
- **Navegadores móviles**
- **Aplicaciones web progresivas**

## 🔄 Sincronización Automática

Para mantener tus datos actualizados:
- **Sincroniza regularmente** (recomendado: una vez por semana)
- **Verifica las fechas límite** después de cada sincronización
- **Revisa las colisiones** detectadas por el sistema

## 📞 Soporte

Si tienes problemas con la integración:
1. **Revisa esta documentación**
2. **Ejecuta el script de verificación** para diagnosticar problemas
3. **Verifica tu configuración de Moodle**
4. **Contacta al administrador** de tu plataforma Moodle
5. **Revisa los logs** de la aplicación para más detalles

---

**¡Disfruta de una gestión de tareas académicas más eficiente con la integración de Moodle!** 🎓 
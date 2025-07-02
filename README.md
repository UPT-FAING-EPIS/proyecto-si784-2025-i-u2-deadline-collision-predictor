[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/c_xOAv9g)
[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=19770719)
# proyecto-formatos-01


# Deadline Collision Predictor

Aplicación web para que estudiantes de ingeniería gestionen sus tareas y eviten colisiones de deadlines. Utiliza IA heurística para distribuir tareas y agendar automáticamente. **¡Ahora con integración completa con Moodle!**

## Descripción del Proyecto

Deadline Collision Predictor es una plataforma que ayuda a los estudiantes a organizar sus actividades académicas, evitando la superposición de fechas límite (deadlines) y mejorando la gestión del tiempo.  
La aplicación permite:

- Registrar y autenticar usuarios.
- Crear, editar y eliminar eventos/tareas académicas.
- Visualizar los eventos en un calendario interactivo.
- Detectar y notificar colisiones de fechas entre tareas.
- Sugerir la mejor distribución de actividades usando IA heurística.
- **🆕 Integración completa con Moodle** para sincronizar cursos, tareas y calendario.
- Realizar pruebas automatizadas de calidad (unitarias, integración, interfaz y mutación).
- Automatizar la infraestructura de despliegue con Terraform y GitHub Actions.

## Objetivos

- Facilitar la gestión de tareas y eventos académicos para estudiantes.
- Prevenir colisiones de fechas límite mediante notificaciones automáticas.
- Optimizar la distribución de actividades usando inteligencia artificial heurística.
- **🆕 Sincronizar automáticamente con plataformas LMS como Moodle**.
- Garantizar la calidad del software mediante pruebas automatizadas y buenas prácticas de desarrollo.
- Automatizar el despliegue y la infraestructura del proyecto utilizando Terraform y GitHub Actions.

## Características principales

- **Registro e inicio de sesión de usuarios** con autenticación segura.
- **Gestión de eventos/tareas**: creación, edición, eliminación y visualización en calendario.
- **Detección de colisiones** entre deadlines y notificaciones al usuario.
- **Asistente inteligente** para sugerir la mejor distribución de tareas.
- **Panel de control (dashboard)** para visualizar el progreso y próximos eventos.
- **🆕 Integración con Moodle**:
  - Sincronización automática de cursos
  - Importación de tareas y asignaciones
  - Integración del calendario de Moodle
  - Detección de colisiones entre tareas de Moodle y eventos locales
- **Pruebas automatizadas**: unitarias, integración, interfaz y mutación.
- **Automatización de infraestructura**: despliegue en Azure App Service y gestión con Terraform.

## Arquitectura general

- **Frontend:** HTML, CSS, JavaScript, FullCalendar.js, Bootstrap.
- **Backend:** Node.js, Express.js.
- **Base de datos:** MySQL (en servidor propio).
- **🆕 Integración:** API REST de Moodle para sincronización de datos.
- **Infraestructura:** Azure App Service (automatizada con Terraform).
- **Automatización y CI/CD:** GitHub Actions.
- **Pruebas:** Jest (unitarias e integración), Playwright/Selenium (interfaz), Stryker (mutación).

## Instalación y Uso

### Requisitos previos

- Node.js (v18 o superior)
- MySQL
- Cuenta en Azure (para despliegue)
- Terraform (opcional, para infraestructura como código)
- **🆕 Acceso a plataforma Moodle** (para integración)

### Instalación local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/proyecto-si784-2025-i-u2-deadline-collision-predictor.git
   cd proyecto-si784-2025-i-u2-deadline-collision-predictor
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   # Edita el archivo .env con tus configuraciones
   ```

4. Ejecuta las migraciones de la base de datos:
   ```bash
   mysql -u tu_usuario -p tu_base_de_datos < db/init.sql
   mysql -u tu_usuario -p tu_base_de_datos < db/migrations/add_moodle_tables.sql
   ```

5. Inicia la aplicación:
   ```bash
   npm start
   ```

6. Accede a la aplicación en [http://localhost:3000](http://localhost:3000)

### 🆕 Configuración de Integración con Moodle

1. **Obtén tu token de Moodle**:
   - Inicia sesión en tu plataforma Moodle
   - Ve a tu perfil → Preferencias → Servicios web
   - Genera un token de acceso

2. **Configura la integración**:
   - Accede a la página "Moodle" en la aplicación
   - Ingresa la URL de tu Moodle, token y ID de usuario
   - Guarda la configuración

3. **Sincroniza tus datos**:
   - Haz clic en "Sincronizar Cursos"
   - Luego "Sincronizar Tareas"
   - Finalmente "Sincronizar Calendario"

Para más detalles, consulta la [documentación completa de integración con Moodle](MOODLE_INTEGRATION.md).

---

## Pruebas y Automatización

El proyecto cuenta con pruebas automatizadas de calidad:

- **Pruebas unitarias y de integración:** ejecutadas con Jest y Supertest.
- **Pruebas de interfaz de usuario:** automatizadas con Playwright y/o Selenium.
- **Pruebas de mutación:** realizadas con Stryker.
- **Automatización de infraestructura:** mediante Terraform y GitHub Actions.

### Ejecución de pruebas

```bash
npm test
```

### Generar reporte de cobertura

```bash
npm test -- --coverage
```

### Automatización CI/CD

El repositorio incluye workflows de GitHub Actions para:

- Ejecutar pruebas y generar reportes de cobertura.
- Realizar pruebas de mutación.
- Ejecutar pruebas de interfaz de usuario.
- Automatizar el despliegue y la infraestructura con Terraform.

---

## 🆕 Nuevas Funcionalidades

### Integración con Moodle
- **Sincronización automática** de cursos y tareas
- **Importación de calendario** de Moodle
- **Detección de colisiones** entre eventos de Moodle y locales
- **Interfaz unificada** para gestionar todo desde un solo lugar

### Mejoras en la IA
- **Procesamiento mejorado** de fechas en español
- **Detección inteligente** de tipos de tareas
- **Sugerencias automáticas** para evitar colisiones

### Interfaz de Usuario
- **Diseño responsivo** mejorado
- **Navegación intuitiva** entre módulos
- **Indicadores visuales** para estados de tareas

---

## Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

---

## Licencia

Este proyecto está bajo la licencia ISC.

---

**¡Organiza tus tareas académicas de manera inteligente y evita colisiones de deadlines con la integración completa de Moodle!** 🎓✨

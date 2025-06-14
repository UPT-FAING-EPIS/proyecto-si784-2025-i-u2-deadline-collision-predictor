[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/c_xOAv9g)
[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=19770719)
# proyecto-formatos-01


# Deadline Collision Predictor

Aplicación web para que estudiantes de ingeniería gestionen sus tareas y eviten colisiones de deadlines. Utiliza IA heurística para distribuir tareas y agendar automáticamente.

## Descripción del Proyecto

Deadline Collision Predictor es una plataforma que ayuda a los estudiantes a organizar sus actividades académicas, evitando la superposición de fechas límite (deadlines) y mejorando la gestión del tiempo.  
La aplicación permite:

- Registrar y autenticar usuarios.
- Crear, editar y eliminar eventos/tareas académicas.
- Visualizar los eventos en un calendario interactivo.
- Detectar y notificar colisiones de fechas entre tareas.
- Sugerir la mejor distribución de actividades usando IA heurística.
- Realizar pruebas automatizadas de calidad (unitarias, integración, interfaz y mutación).
- Automatizar la infraestructura de despliegue con Terraform y GitHub Actions.

## Objetivos

- Facilitar la gestión de tareas y eventos académicos para estudiantes.
- Prevenir colisiones de fechas límite mediante notificaciones automáticas.
- Optimizar la distribución de actividades usando inteligencia artificial heurística.
- Garantizar la calidad del software mediante pruebas automatizadas y buenas prácticas de desarrollo.
- Automatizar el despliegue y la infraestructura del proyecto utilizando Terraform y GitHub Actions.

## Características principales

- **Registro e inicio de sesión de usuarios** con autenticación segura.
- **Gestión de eventos/tareas**: creación, edición, eliminación y visualización en calendario.
- **Detección de colisiones** entre deadlines y notificaciones al usuario.
- **Asistente inteligente** para sugerir la mejor distribución de tareas.
- **Panel de control (dashboard)** para visualizar el progreso y próximos eventos.
- **Pruebas automatizadas**: unitarias, integración, interfaz y mutación.
- **Automatización de infraestructura**: despliegue en Azure App Service y gestión con Terraform.

## Arquitectura general

- **Frontend:** HTML, CSS, JavaScript, FullCalendar.js, Bootstrap.
- **Backend:** Node.js, Express.js.
- **Base de datos:** MySQL (en servidor propio).
- **Infraestructura:** Azure App Service (automatizada con Terraform).
- **Automatización y CI/CD:** GitHub Actions.
- **Pruebas:** Jest (unitarias e integración), Playwright/Selenium (interfaz), Stryker (mutación).

## Instalación y Uso

### Requisitos previos

- Node.js (v18 o superior)
- MySQL
- Cuenta en Azure (para despliegue)
- Terraform (opcional, para infraestructura como código)

### Instalación local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/proyecto-si784-2025-i-u2-deadline-collision-predictor.git
   cd proyecto-si784-2025-i-u2-deadline-collision-predictor
   ```

2.  Inicia la aplicación:
   ```bash
   npm start
   ```

5. Accede a la aplicación en [http://localhost:3000](http://localhost:3000)

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

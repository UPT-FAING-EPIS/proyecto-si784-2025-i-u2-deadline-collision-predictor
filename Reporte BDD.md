# Informe de Pruebas BDD, Unitarias, Integración e Interfaz

## Proyecto: Deadline Collision Predictor

**Autor:** [Tu Nombre]  
**Fecha:** [Fecha de entrega]

---

## 1. Introducción

En este informe se documentan las pruebas realizadas al proyecto **Deadline Collision Predictor**. Se incluyen pruebas unitarias, de integración y de interfaz de usuario, siguiendo la metodología BDD (Behavior Driven Development) con escenarios en formato **Dado / Cuando / Entonces**.

---

## 2. Resumen de Pruebas

| Tipo de Prueba      | Cantidad | Herramienta         |
|---------------------|----------|---------------------|
| Unitarias           | 7        | Jest                |
| Integración         | 5        | Jest + Supertest    |
| Interfaz de Usuario | 4        | Playwright/Selenium |

**Total:** 16 pruebas

---

## 3. Escenarios BDD

### 3.1 Pruebas Unitarias (Jest)

1. **Dado** un usuario válido  
   **Cuando** se registra  
   **Entonces** se crea correctamente en la base de datos

2. **Dado** un usuario existente  
   **Cuando** intenta iniciar sesión con contraseña correcta  
   **Entonces** recibe un token JWT válido

3. **Dado** un usuario existente  
   **Cuando** intenta iniciar sesión con contraseña incorrecta  
   **Entonces** recibe un error de autenticación

4. **Dado** un evento válido  
   **Cuando** se agrega al calendario  
   **Entonces** se almacena correctamente

5. **Dado** un evento existente  
   **Cuando** se elimina  
   **Entonces** ya no aparece en la base de datos

6. **Dado** un usuario  
   **Cuando** solicita sus eventos  
   **Entonces** recibe la lista de eventos asociados

7. **Dado** un evento con fecha pasada  
   **Cuando** se consulta el estado  
   **Entonces** aparece como completado

---

### 3.2 Pruebas de Integración (Jest + Supertest)

8. **Dado** el endpoint `/api/auth/register`  
   **Cuando** se envía un usuario nuevo  
   **Entonces** responde con éxito y crea el usuario

9. **Dado** el endpoint `/api/auth/login`  
   **Cuando** se envían credenciales válidas  
   **Entonces** responde con un token

10. **Dado** el endpoint `/api/eventos`  
    **Cuando** se crea un evento con JWT válido  
    **Entonces** responde con el evento creado

11. **Dado** el endpoint `/api/eventos`  
    **Cuando** se solicita la lista de eventos  
    **Entonces** responde con los eventos del usuario

12. **Dado** el endpoint `/api/eventos/:id`  
    **Cuando** se elimina un evento existente  
    **Entonces** responde con éxito y elimina el evento

---

### 3.3 Pruebas de Interfaz de Usuario (Playwright/Selenium)

13. **Dado** el formulario de registro  
    **Cuando** el usuario ingresa datos válidos y envía  
    **Entonces** ve un mensaje de registro exitoso

14. **Dado** el formulario de login  
    **Cuando** el usuario ingresa credenciales válidas  
    **Entonces** accede al dashboard

15. **Dado** el calendario  
    **Cuando** el usuario agrega un evento  
    **Entonces** el evento aparece en el calendario

16. **Dado** el dashboard  
    **Cuando** el usuario elimina un evento  
    **Entonces** el evento desaparece de la lista

---

## 4. Evidencias

- **Cobertura de pruebas unitarias:**  
  ![Cobertura Jest](ruta/a/tu/captura-cobertura.png)

- **Reporte de pruebas de mutación:**  
  ![Reporte Stryker](ruta/a/tu/captura-stryker.png)

- **Reporte de pruebas de interfaz:**  
  ![Reporte Playwright](ruta/a/tu/captura-playwright.png)

---

## 5. Conclusiones

- Se implementaron y ejecutaron más de 15 pruebas cubriendo lógica de negocio, integración y experiencia de usuario.
- La automatización de pruebas garantiza la calidad y robustez del sistema.
- Se recomienda mantener y ampliar la suite de pruebas conforme evolucione el proyecto.

---

## 6. Anexos

- [Enlace a los reportes en GitHub Pages](URL_AQUI)
- [Enlace al repositorio](URL_AQUI)

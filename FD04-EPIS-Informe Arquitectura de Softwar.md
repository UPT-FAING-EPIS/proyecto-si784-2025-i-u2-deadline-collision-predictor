<center>

[comment]: <img src="./media/media/image1.png" style="width:1.088in;height:1.46256in" alt="escudo.png" />

![./media/media/image1.png](./media/logo-upt.png)

**UNIVERSIDAD PRIVADA DE TACNA**

**FACULTAD DE INGENIERIA**

**Escuela Profesional de Ingeniería de Sistemas**

**Proyecto *FitMach***

Curso: Calidad y Pruebas de Software

Docente: Mag. Ing. Patrick Cuadros Quiroga

Integrantes:

***
 Vargas Gutierrez, Angel Jose (2020066922)<br>
 Chino Rivera, Angel Alessandro (2021069830)<br>
 Luna Juarez, Juan Brendon (2020068762) )<br>
***

**Tacna – Perú**

***2025***

**  
**
</center>
<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

|CONTROL DE VERSIONES||||||
| :-: | :- | :- | :- | :- | :- |
|Versión|Hecha por|Revisada por|Aprobada por|Fecha|Motivo|
|1\.0|MPV|ELV|ARV|10/10/2020|Versión Original|












**Sistema *FitMach***

**Documento de Visión**

**Versión *1.0***
**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

|CONTROL DE VERSIONES||||||
| :-: | :- | :- | :- | :- | :- |
|Versión|Hecha por|Revisada por|Aprobada por|Fecha|Motivo|
|1\.0|MPV|ELV|ARV|10/10/2020|Versión Original|


<div style="page-break-after: always; visibility: hidden">\pagebreak</div>


**INDICE GENERAL**
#
[1.	Introducción](#_Toc52661346)

1.1	Propósito<br>

El Sistema FitMatch es una plataforma diseñada para conectar a personas con intereses comunes en el entrenamiento físico, facilitando la interacción entre usuarios. Su objetivo es mejorar la experiencia fitness a través de la tecnología, permitiendo encontrar compañeros de entrenamiento de manera sencilla. Además, el sistema contará con una sección de ventas donde los gimnasios podrán ofrecer membresías, productos deportivos y otros servicios.

1.2	Alcance<br>

El **Sistema FitMatch** tiene como objetivo conectar a personas interesadas en el entrenamiento físico a través de una plataforma digital. Este sistema permitirá la interacción entre usuarios mediante herramientas avanzadas como la geolocalización y la mensajería en tiempo real.  

El alcance del sistema abarca los siguientes aspectos:  

1.3	Definiciones, Siglas y Abreviaturas<br>

Fit Match: Nombre del sistema, plataforma diseñada para conectar usuarios interesados en el entrenamiento físico.
MySQL: Sistema de gestión de bases de datos utilizado en el proyecto.


1.4	Referencias<br>

Este documento se apoya en varios informes técnicos y administrativos desarrollados previamente:  
- **Informe de Visión del Sistema FitMatch**: Detalla el objetivo, alcance y visión general del sistema.  
- **Especificación de Requerimientos de Software (SRS) de FitMatch**: Define los requisitos funcionales y no funcionales necesarios para la implementación.  
- **Informe de Factibilidad de FitMatch**: Explora la viabilidad económica, técnica, operativa y social del proyecto.  
- **Informe Final de Proyecto de FitMatch**: Resume los resultados y logros obtenidos durante el desarrollo inicial del sistema.  

1.5	Visión General<br>

**FitMatch** es una plataforma diseñada para conectar personas interesadas en el entrenamiento físico. Su propósito es facilitar la interacción entre usuarios, permitiendo la búsqueda de compañeros de ejercicio.  
La aplicación integra funcionalidades como emparejamiento por intereses y geolocalización, mensajería interna y un sistema de venta de productos y servicios para gimnasios. FitMatch busca mejorar la experiencia de los usuarios y fomentar una comunidad activa y comprometida con el bienestar físico.  

[2.	Posicionamiento](#_Toc52661347)

2.1	Oportunidad de negocio<br>

El sistema **FitMatch** surge como una solución estratégica para mejorar la experiencia de las personas interesadas en el entrenamiento físico. Actualmente, muchas personas buscan compañeros de ejercicio pero no cuentan con una plataforma eficiente que facilite estas conexiones.  
La falta de motivación y la dificultad para encontrar personas con objetivos similares pueden afectar la constancia en el entrenamiento, reduciendo los resultados y el compromiso con un estilo de vida saludable. FitMatch busca cerrar esta brecha ofreciendo una plataforma especializada para conectar a la comunidad fitness.  


2.2	Definición del problema<br>

El mundo del fitness presenta diversos desafíos para quienes buscan mantenerse activos, mejorar su rendimiento físico o encontrar apoyo en su entrenamiento. Muchas personas abandonan sus rutinas debido a la falta de motivación, la dificultad para encontrar compañeros con objetivos similares.  
A pesar del auge de las redes sociales y aplicaciones de fitness, no existe una plataforma enfocada exclusivamente en facilitar la conexión entre usuarios con intereses y necesidades compartidas. Los gimnasios, por su parte, no siempre cuentan con mecanismos efectivos para fomentar la formación de grupos de entrenamiento, lo que limita el acceso al apoyo de la comunidad fitness.  
**FitMatch** busca solucionar estos problemas ofreciendo una plataforma dedicada a la conexión y el acompañamiento en el entrenamiento físico. 

[3.	Descripción de los interesados y usuarios](#_Toc52661348)

3.1	Resumen de los interesados

Los interesados en **FitMatch** incluyen a todas las partes que tienen un impacto directo o indirecto en la plataforma. Estos pueden ser propietarios de gimnasios, entrenadores personales, desarrolladores del sistema, etc. Su interés radica en cómo la plataforma puede generar valor, aumentar la participación de los usuarios y mejorar la oferta de servicios fitness.  

3.2	Resumen de los usuarios

Los usuarios de **FitMatch** son principalmente personas interesadas en el entrenamiento físico, desde principiantes hasta atletas experimentados. Estos usuarios buscan compañeros de ejercicio, entrenadores personales o simplemente un entorno motivador para mantenerse activos. Además, los gimnasios y entrenadores pueden usar la plataforma para ofrecer sus servicios y conectarse con clientes potenciales.  

3.3	Entorno de usuario

**FitMatch** se diseñará para ser accesible en cualquier computadora, brindando una experiencia intuitiva y fluida. Los usuarios podrán registrarse, crear perfiles, buscar compañeros de entrenamiento según su ubicación y preferencias, e interactuar mediante mensajes y publicaciones.  

3.4	Perfiles de los interesados

- **Propietarios de gimnasios**: Buscan aumentar la visibilidad de sus establecimientos, atraer nuevos clientes y fomentar la interacción entre los miembros de sus gimnasios.  
- **Desarrolladores del sistema**: Encargados de la creación y mantenimiento de la plataforma, asegurando su correcto funcionamiento y evolución.  

3.5	Perfiles de los Usuarios

- **Usuarios generales**: Personas que buscan motivación para entrenar, encontrar compañeros de ejercicio y mejorar su rendimiento físico.  
- **Usuarios avanzados**: Deportistas o entusiastas del fitness que buscan optimizar sus entrenamientos con entrenadores o compañeros con niveles similares.  

3.6	Necesidades de los interesados y usuarios

### **Necesidades de los interesados:**  
- Aumentar la visibilidad y el alcance de gimnasios.  
- Ofrecer una plataforma confiable y segura que fomente la interacción entre los usuarios.  
- Generar ingresos a través de suscripciones, publicidad o servicios premium.  

### **Necesidades de los usuarios:**  
- Encontrar compañeros de entrenamiento con objetivos similares.  
- Disponer de una herramienta práctica y accesible que facilite la planificación de entrenamientos.  
- Mantener la motivación y el compromiso a través de la interacción con la comunidad. 

[4.	Vista General del Producto](#_Toc52661349)

4.1	Perspectiva del producto

**FitMatch** es una plataforma innovadora diseñada para conectar personas interesadas en el entrenamiento físico, facilitando la búsqueda de compañeros de ejercicio y entrenadores personales. Su enfoque basado en geolocalización y preferencias personalizadas permite una experiencia optimizada para los usuarios. Además, el sistema incluye una sección de ventas para gimnasios y entrenadores, permitiéndoles ofrecer sus servicios y productos directamente a los usuarios.  
El producto busca posicionarse como una solución integral dentro del sector fitness, proporcionando herramientas interactivas que fomentan la motivación y el compromiso con el entrenamiento.  


4.2	Resumen de capacidades

- **Emparejamiento inteligente**: Conexión entre usuarios y entrenadores basada en ubicación y objetivos de entrenamiento.  
- **Mensajería interna**: Comunicación directa entre usuarios y entrenadores dentro de la plataforma.  
- **Publicación de rutinas y planes**: Entrenadores y gimnasios pueden compartir programas de entrenamiento personalizados.  
- **Marketplace fitness**: Venta de productos y servicios relacionados con el entrenamiento.  

4.3	Suposiciones y dependencias

- Se asume que los usuarios cuentan con acceso a internet para utilizar la plataforma.  
- La precisión del emparejamiento depende de la disponibilidad y actualización de datos de ubicación y preferencias del usuario.  
- La adopción del sistema por parte de gimnasios será clave para su éxito.  
- Dependencia de pasarelas de pago seguras para gestionar compras dentro de la plataforma.  
- Cumplimiento con normativas de protección de datos y privacidad.  

4.4	Costos y precios

**FitMatch** tendrá un modelo de negocio basado en:  

- **Acceso gratuito** con funciones básicas para usuarios generales.  
- **Comisiones por ventas** dentro del marketplace de productos y servicios fitness.  
- **Publicidad y promoción** de gimnasios y entrenadores dentro de la plataforma. 

4.5	Licenciamiento e instalación

- **Modelo SaaS (Software as a Service)**: No requiere instalación local, accesible desde la web y dispositivos móviles.  
- **Licenciamiento basado en suscripción**, con opciones para usuarios individuales, entrenadores y gimnasios.  
- **Cumplimiento con regulaciones de privacidad y seguridad** para garantizar la protección de los datos de los usuarios.  
- **Actualizaciones y mantenimiento** incluidos dentro de las suscripciones premium para garantizar mejoras continuas.

[5.	Características del producto](#_Toc52661350)

FitMatch ofrece una serie de características clave diseñadas para mejorar la experiencia de los usuarios dentro del mundo del fitness:  

- **Emparejamiento**: Algoritmo que conecta a usuarios con compañeros de entrenamiento y entrenadores personales basándose en ubicación, intereses y objetivos.  
- **Mensajería interna**: Comunicación directa y segura entre usuarios y entrenadores dentro de la plataforma.  
- **Marketplace fitness**: Venta de productos y servicios como suplementos, equipos de entrenamiento y asesorías personalizadas.  

[6.	Restricciones](#_Toc52661351)

El desarrollo y uso de FitMatch están sujetos a las siguientes restricciones:  

- **Acceso a internet**: La plataforma requiere una conexión activa para su funcionamiento.  
- **Privacidad y protección de datos**: Cumplimiento con regulaciones de privacidad como GDPR y la normativa local.  
- **Requisitos técnicos**: Compatible con navegadores modernos y dispositivos móviles con iOS o Android.  
- **Interacciones reguladas**: La comunicación entre usuarios debe respetar términos de servicio y condiciones de uso. 
- **Limitaciones en la precisión del emparejamiento**: Basado en la disponibilidad y actualización de datos del usuario.  

[7.	Rangos de calidad](#_Toc52661352)

Para garantizar una experiencia óptima, FitMatch debe cumplir con los siguientes estándares de calidad:  

- **Disponibilidad**: Mínimo 99% de tiempo en línea para garantizar acceso continuo.  
- **Seguridad**: Implementación de cifrado en datos sensibles y protección contra accesos no autorizados.  
- **Experiencia de usuario (UX/UI)**: Diseño intuitivo y adaptable a distintos dispositivos.  
- **Compatibilidad**: Soporte para versiones recientes de navegadores web.  
- **Mantenimiento y actualizaciones**: Correcciones y mejoras periódicas sin afectar la experiencia del usuario.  

[8.	Precedencia y Prioridad](#_Toc52661353)

Las características de FitMatch serán implementadas en el siguiente orden de prioridad:  

- **Sistema de emparejamiento** (alta prioridad) → Base principal del producto.  
- **Mensajería interna** (alta prioridad) → Facilita la interacción entre usuarios.  
- **Marketplace fitness** (media-alta prioridad) → Genera oportunidades de negocio dentro de la plataforma.  
- **Control de métricas y progreso** (media prioridad) → Mejora la experiencia del usuario.  

[9.	Otros requerimientos del producto](#_Toc52661354)

b) Estandares legales

c) Estandares de comunicación	](#_toc394513800)37

d) Estandaraes de cumplimiento de la plataforma	](#_toc394513800)42

e) Estandaraes de calidad y seguridad	](#_toc394513800)42

[CONCLUSIONES](#_Toc52661355)

[RECOMENDACIONES](#_Toc52661356)

[BIBLIOGRAFIA](#_Toc52661357)

[WEBGRAFIA](#_Toc52661358)


<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

**<u>Informe de Visión</u>**

1. <span id="_Toc52661346" class="anchor"></span>**Introducción**

    1.1	Propósito

    1.2	Alcance

    1.3	Definiciones, Siglas y Abreviaturas

    1.4	Referencias

    1.5	Visión General

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

2. <span id="_Toc52661347" class="anchor"></span>**Posicionamiento**

    2.1	Oportunidad de negocio

    2.2	Definición del problema

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

3. <span id="_Toc52661348" class="anchor"></span>**Vista General del Producto**

    3.1	Resumen de los interesados

    3.2	Resumen de los usuarios

    3.3	Entorno de usuario

    3.4	Perfiles de los interesados

    3.5	Perfiles de los Usuarios

    3.6	Necesidades de los interesados y usuarios

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

4. <span id="_Toc52661349" class="anchor"></span>**Estudio de
    Factibilidad**

    4.1	Perspectiva del producto

    4.2	Resumen de capacidades

    4.3	Suposiciones y dependencias

    4.4	Costos y precios

    4.5	Licenciamiento e instalación

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

5. <span id="_Toc52661350" class="anchor"></span>**Características del producto**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

6. <span id="_Toc52661351" class="anchor"></span>**Restricciones**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

7. <span id="_Toc52661352" class="anchor"></span>**Rangos de Calidad**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

8. <span id="_Toc52661353" class="anchor"></span>**Precedencia y Prioridad**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

9. <span id="_Toc52661354" class="anchor"></span>**Otros requerimientos del producto**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

<span id="_Toc52661355" class="anchor"></span>**CONCLUSIONES**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

<span id="_Toc52661356" class="anchor"></span>**RECOMENDACIONES**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

<span id="_Toc52661357" class="anchor"></span>**BIBLIOGRAFIA**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

<span id="_Toc52661358" class="anchor"></span>**WEBGRAFIA**

<div style="page-break-after: always; visibility: hidden">\pagebreak</div>

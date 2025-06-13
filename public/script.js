document.addEventListener('DOMContentLoaded', function() {
    // Verifica autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Mostrar nombre de usuario
    function getUserFromToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.username;
        } catch {
            return '';
        }
    }
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) {
        userNameSpan.textContent = '👤 ' + getUserFromToken(token);
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        };
    }

    // Verificar que axios esté disponible
    if (typeof axios === 'undefined') {
        console.error('Error: Axios no está cargado. Asegúrate de incluir la librería axios.');
        alert('Error: La librería axios no está disponible. Por favor, recarga la página.');
        return;
    }

    // Configurar axios con timeout
    axios.defaults.timeout = 10000; // 10 segundos
    axios.defaults.baseURL = window.location.origin;

    let eventosUsuario = [];
    let bienvenidaMostrada = false;

    // Inicialización del calendario
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('Error: No se encontró el elemento calendar');
        return;
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        locale: 'es',
        events: function(fetchInfo, successCallback, failureCallback) {
            axios.get('/api/eventos', {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(response => {
                eventosUsuario = response.data;
                const eventos = eventosUsuario.map(ev => ({
                    id: ev.id,
                    title: ev.nombre,
                    start: ev.deadline,
                    extendedProps: { 
                        tipo: ev.tipo,
                        completado: ev.completado || false
                    }
                }));
                successCallback(eventos);
            })
            .catch(error => {
                console.error('Error cargando eventos:', error);
                failureCallback(error);
                successCallback([]);
            });
        },
        eventDidMount: function(info) {
            // Aplicar clase según el tipo
            if (info.event.extendedProps.tipo === 'examen') {
                info.el.classList.add('urgent');
            } else if (info.event.extendedProps.tipo === 'proyecto') {
                info.el.classList.add('warning');
            } else {
                info.el.classList.add('normal');
            }
            
            // Aplicar clase si está completado
            if (info.event.extendedProps.completado) {
                info.el.classList.add('completed');
            }
        },
        eventClick: function(info) {
            const evento = info.event;
            const fecha = new Date(evento.start);
            
            // Actualizar contenido del panel
            document.getElementById('eventTitle').textContent = evento.title;
            document.getElementById('eventType').textContent = evento.extendedProps.tipo;
            document.getElementById('eventDate').textContent = fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('eventTime').textContent = fecha.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Actualizar estado del checkbox
            const completedCheckbox = document.getElementById('eventCompleted');
            completedCheckbox.checked = evento.extendedProps.completado || false;
            
            // Configurar evento del checkbox
            completedCheckbox.onchange = async function() {
                try {
                    const completadoValue = this.checked ? 1 : 0; // Convertir booleano a 1 o 0
                    const response = await axios.put(`/api/eventos/${evento.id}`, {
                        completado: completadoValue
                    }, {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });

                    if (response.status === 200) {
                        // Actualizar el evento en el calendario
                        evento.setExtendedProp('completado', this.checked);
                        
                        // Actualizar la apariencia del evento directamente en el DOM
                        const eventElement = info.el; // info.el ya está disponible en eventClick closure
                        if (this.checked) {
                            eventElement.classList.add('completed');
                        } else {
                            eventElement.classList.remove('completed');
                        }

                        // También actualizamos el evento en el array local para consistencia
                        const index = eventosUsuario.findIndex(ev => ev.id === evento.id);
                        if (index !== -1) {
                            eventosUsuario[index].completado = this.checked;
                        }
                        
                        // No es necesario refetchEvents() para el cambio visual inmediato
                        // Solo si hubiera cambios más complejos en el evento que requieran recarga total.
                    }
                } catch (error) {
                    console.error('Error al actualizar estado:', error);
                    this.checked = !this.checked; // Revertir el cambio si hay error
                    alert('Error al actualizar el estado del evento. Por favor, revisa la consola para más detalles.');
                }
            };
            
            // Configurar evento del botón eliminar
            document.getElementById('deleteEventBtn').onclick = async function() {
                if (confirm('¿Estás seguro de que deseas eliminar este evento?')) {
                    try {
                        await axios.delete(`/api/eventos/${evento.id}`, {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        evento.remove();
                        bootstrap.Offcanvas.getInstance(document.getElementById('eventDetailsPanel')).hide();
                    } catch (error) {
                        console.error('Error al eliminar evento:', error);
                        alert('Error al eliminar el evento');
                    }
                }
            };
            
            // Mostrar el panel
            const eventPanel = new bootstrap.Offcanvas(document.getElementById('eventDetailsPanel'));
            eventPanel.show();
        }
    });
    calendar.render();

    // Elementos del DOM
    const modal = document.getElementById('taskModal');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const closeBtn = document.querySelector('.close');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    // Verificar que todos los elementos existen
    if (!modal || !addTaskBtn || !closeBtn || !chatForm || !chatInput || !chatMessages) {
        console.error('Error: No se encontraron todos los elementos del DOM necesarios');
        return;
    }

    // Función para agregar mensaje al chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (!isUser) {
            const icon = document.createElement('i');
            icon.className = 'fas fa-robot';
            contentDiv.appendChild(icon);
        }
        
        const textP = document.createElement('p');
        textP.textContent = text;
        contentDiv.appendChild(textP);
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Mensaje inicial del asistente SOLO una vez
    function mostrarBienvenida() {
        if (!bienvenidaMostrada) {
            addMessage('¡Hola! Soy tu asistente para programar tareas. Puedes escribirme de forma natural, por ejemplo: "Tengo un examen de Calidad el jueves 12 de junio" o "Necesito entregar el proyecto de Sistemas el próximo lunes".');
            bienvenidaMostrada = true;
        }
    }

    // Abrir modal
    addTaskBtn.onclick = function() {
        modal.style.display = "block";
        chatInput.focus();
        if (chatMessages.children.length === 0) {
            mostrarBienvenida();
        }
    }

    // Cerrar modal
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Manejar envío del chat
    chatForm.onsubmit = async function(e) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;
        addMessage(text, true);
        chatInput.value = '';

        const textLower = text.toLowerCase();

        // Comandos especiales para notificaciones
        if (textLower.includes('eventos próximos') || textLower.includes('eventos proximos') || textLower.includes('próximos eventos') || textLower.includes('proximos eventos') || textLower.includes('tengo eventos próximos') || textLower.includes('tengo eventos proximos')) {
            notificarEventosProximos();
            return;
        }
        if (textLower.includes('colisiones') || textLower.includes('conflictos') || textLower.includes('choques') || textLower.includes('tengo colisiones')) {
            notificarColisiones();
            return;
        }

        // Prioridad 1: Detectar si es una INTENCIÓN DE AGREGAR/CREAR tarea
        const isAddIntent = textLower.startsWith('agrega') ||
                            textLower.startsWith('crea') ||
                            textLower.startsWith('añade') ||
                            textLower.includes('necesito agregar') ||
                            textLower.includes('debo hacer') ||
                            textLower.includes('registrar') ||
                            (textLower.includes('tengo') && !textLower.includes('tengo eventos') && !textLower.includes('tengo colisiones'));
        
        if (isAddIntent) {
            try {
                const response = await axios.post('/api/ai/process', { text }, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const taskData = response.data;
                addMessage(`Entendido. Voy a crear una ${taskData.tipo} llamada "${taskData.nombre}" para el ${new Date(taskData.deadline).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${new Date(taskData.deadline).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}.`);

                // Comprobar colisión de eventos en la misma fecha (solo para agregar)
                const fechaNueva = new Date(taskData.deadline);
                const colision = eventosUsuario.find(ev => {
                    const fechaEv = new Date(ev.deadline);
                    return fechaEv.toDateString() === fechaNueva.toDateString();
                });
                if (colision) {
                    // Buscar fecha alternativa (primer día libre antes del deadline)
                    let fechaSugerida = new Date(fechaNueva);
                    let intentos = 0;
                    while (intentos < 7) {
                        fechaSugerida.setDate(fechaSugerida.getDate() - 1);
                        const existe = eventosUsuario.find(ev => {
                            const f = new Date(ev.deadline);
                            return f.toDateString() === fechaSugerida.toDateString();
                        });
                        if (!existe && fechaSugerida > new Date()) break;
                        intentos++;
                    }
                    addMessage(`⚠️ Atención: Ya tienes otro evento ese día. Te recomiendo organizarte y trabajar en tus pendientes el ${fechaSugerida.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`);
                }

                // POST directo a /api/eventos
                try {
                    const res = await axios.post('/api/eventos', {
                        nombre: taskData.nombre,
                        tipo: taskData.tipo,
                        deadline: taskData.deadline
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        }
                    });
                    if (res.status === 200 || res.status === 201) {
                        calendar.refetchEvents();
                        addMessage('¡Tarea agregada exitosamente! ¿Necesitas agregar otra tarea?');
                    }
                } catch (err) {
                    addMessage('Lo siento, hubo un error al guardar la tarea. Por favor, inténtalo de nuevo.');
                }
            } catch (error) {
                console.error('Error procesando el texto:', error);
                addMessage('Lo siento, no pude entender completamente tu mensaje. ¿Podrías reformularlo? Por ejemplo: "Tengo un examen de Matemáticas el jueves 15 de junio"');
            }
            return; // Importante para evitar que se ejecute la lógica de consulta
        }

        // Prioridad 2: Si no es una intención de agregar, entonces detecta si es una pregunta sobre eventos
        if (textLower.includes('mañana') || textLower.includes('que tengo') || textLower.includes('eventos')) {
            try {
                const response = await axios.post('/api/ai/ask', { pregunta: text }, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                addMessage(response.data.respuesta);
            } catch (error) {
                console.error('Error al consultar eventos:', error);
                addMessage('Lo siento, hubo un error al obtener tus eventos. Por favor, inténtalo de nuevo.');
            }
            return;
        }

        // Si no coincide con ninguna de las anteriores (ni agregar, ni preguntar sobre mañana)
        addMessage('Lo siento, no pude entender tu solicitud. Por favor, intenta reformularla. Recuerda que puedo ayudarte a agregar tareas o consultar tus eventos de mañana.');
    };

    // Función para verificar colisiones
    async function checkCollisions() {
        try {
            const response = await axios.get('/api/tareas/colisiones');
            const colisiones = response.data;

            if (Array.isArray(colisiones)) {
                colisiones.forEach(colision => {
                    const event = calendar.getEventById(colision.id);
                    if (event) {
                        event.setProp('classNames', ['urgent']);
                    }
                });
            }
        } catch (error) {
            console.error('Error al verificar colisiones:', error);
        }
    }

    // Función para procesamiento local básico
    function processTextLocally(text) {
        try {
            const lowercaseText = text.toLowerCase();
            
            // Extraer nombre de la tarea
            let nombre = text;
            let tipo = 'tarea';
            let duracion = 60;
            
            // Determinar tipo
            if (lowercaseText.includes('examen') || lowercaseText.includes('exámen')) {
                tipo = 'examen';
                duracion = 120;
                // Extraer materia del examen
                const materiaMatch = text.match(/examen\s+de\s+([a-záéíóúñ\s]+)/i);
                if (materiaMatch) {
                    nombre = `Examen de ${materiaMatch[1].trim()}`;
                }
            } else if (lowercaseText.includes('proyecto')) {
                tipo = 'proyecto';
                duracion = 180;
                const proyectoMatch = text.match(/proyecto\s+de\s+([a-záéíóúñ\s]+)/i);
                if (proyectoMatch) {
                    nombre = `Proyecto de ${proyectoMatch[1].trim()}`;
                }
            } else if (lowercaseText.includes('tarea') || lowercaseText.includes('entrega')) {
                tipo = 'tarea';
                duracion = 90;
            }
            
            // Extraer fecha
            const fechaPatterns = [
                /(?:el\s+)?(\w+)\s+(\d{1,2})\s+de\s+(\w+)/i, // "lunes 17 de junio"
                /(\d{1,2})\s+de\s+(\w+)/i, // "17 de junio"
                /(\d{1,2})\/(\d{1,2})\/(\d{4})/i, // "17/06/2024"
                /(\d{1,2})-(\d{1,2})-(\d{4})/i // "17-06-2024"
            ];
            
            const meses = {
                'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
                'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
                'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
            };
            
            let deadline = null;
            const today = new Date();
            
            for (const pattern of fechaPatterns) {
                const match = text.match(pattern);
                if (match) {
                    if (pattern.source.includes('de')) {
                        // Formato con mes en texto
                        const dia = parseInt(match[2] || match[1]);
                        const mesTexto = (match[3] || match[2]).toLowerCase();
                        const mes = meses[mesTexto];
                        
                        if (mes !== undefined && dia >= 1 && dia <= 31) {
                            deadline = new Date(today.getFullYear(), mes, dia);
                            if (deadline < today) {
                                deadline.setFullYear(deadline.getFullYear() + 1);
                            }
                        }
                    } else {
                        // Formato numérico
                        const dia = parseInt(match[1]);
                        const mes = parseInt(match[2]) - 1;
                        const año = parseInt(match[3]);
                        deadline = new Date(año, mes, dia);
                    }
                    break;
                }
            }
            
            // Si no se encontró fecha, usar una fecha por defecto (mañana)
            if (!deadline) {
                deadline = new Date();
                deadline.setDate(deadline.getDate() + 1);
            }
            
            return {
                nombre: nombre.trim(),
                tipo: tipo,
                duracion: duracion,
                deadline: deadline.toISOString().split('T')[0]
            };
            
        } catch (error) {
            console.error('Error en procesamiento local:', error);
            return null;
        }
    }

    // Verificar colisiones cada 5 minutos
    setInterval(checkCollisions, 300000);
    checkCollisions(); // Verificar al cargar la página

    // Notificación de eventos próximos (3 días antes)
    function notificarEventosProximos() {
        const hoy = new Date();
        let encontrados = false;
        eventosUsuario.forEach(ev => {
            const fechaEv = new Date(ev.deadline);
            const diff = (fechaEv - hoy) / (1000 * 60 * 60 * 24);
            if (diff > 0 && diff <= 3) {
                addMessage(`⏰ ¡Tienes un ${ev.tipo} próximo! "${ev.nombre}" es el ${fechaEv.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. ¡No lo olvides!`);
                encontrados = true;
            }
        });
        if (!encontrados) addMessage('No tienes eventos próximos en los próximos 3 días.');
    }

    // Notificación de colisiones
    function notificarColisiones() {
        let colisiones = [];
        for (let i = 0; i < eventosUsuario.length; i++) {
            for (let j = i + 1; j < eventosUsuario.length; j++) {
                const fecha1 = new Date(eventosUsuario[i].deadline).toDateString();
                const fecha2 = new Date(eventosUsuario[j].deadline).toDateString();
                if (fecha1 === fecha2) {
                    colisiones.push({
                        fecha: fecha1,
                        eventos: [eventosUsuario[i], eventosUsuario[j]]
                    });
                }
            }
        }
        if (colisiones.length > 0) {
            colisiones.forEach(col => {
                addMessage(`⚠️ Tienes colisión de eventos el ${col.fecha}:\n- ${col.eventos[0].nombre} (${col.eventos[0].tipo})\n- ${col.eventos[1].nombre} (${col.eventos[1].tipo})`);
            });
        } else {
            addMessage('No tienes colisiones de eventos en tu calendario.');
        }
    }
});
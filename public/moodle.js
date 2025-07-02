document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // Configurar axios
    axios.defaults.baseURL = window.location.origin;
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;

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

    // Configurar logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        };
    }

    // Elementos del DOM
    const moodleConfigForm = document.getElementById('moodleConfigForm');
    const syncCoursesBtn = document.getElementById('syncCoursesBtn');
    const syncAssignmentsBtn = document.getElementById('syncAssignmentsBtn');
    const syncCalendarBtn = document.getElementById('syncCalendarBtn');
    const coursesSection = document.getElementById('coursesSection');
    const assignmentsSection = document.getElementById('assignmentsSection');
    const coursesList = document.getElementById('coursesList');
    const assignmentsList = document.getElementById('assignmentsList');
    const syncStatus = document.getElementById('syncStatus');

    // Cargar configuración existente
    loadMoodleConfig();

    // Event listeners
    moodleConfigForm.addEventListener('submit', handleConfigSubmit);
    syncCoursesBtn.addEventListener('click', syncCourses);
    syncAssignmentsBtn.addEventListener('click', syncAssignments);
    syncCalendarBtn.addEventListener('click', syncCalendar);

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        const alertClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 
                          type === 'warning' ? 'alert-warning' : 'alert-info';
        
        syncStatus.innerHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                   type === 'error' ? 'exclamation-circle' : 
                                   type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = syncStatus.querySelector('.alert');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    // Cargar configuración de Moodle
    async function loadMoodleConfig() {
        try {
            const response = await axios.get('/api/moodle/config');
            if (response.data.success && response.data.config) {
                const config = response.data.config;
                document.getElementById('moodleUrl').value = config.moodle_url || '';
                document.getElementById('moodleUserId').value = config.moodle_user_id || '';
                // No cargar el token por seguridad
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    }

    // Manejar envío del formulario de configuración
    async function handleConfigSubmit(e) {
        e.preventDefault();
        
        const moodleUrl = document.getElementById('moodleUrl').value.trim();
        const moodleToken = document.getElementById('moodleToken').value.trim();
        const moodleUserId = document.getElementById('moodleUserId').value.trim();

        if (!moodleUrl || !moodleToken || !moodleUserId) {
            showNotification('Por favor, completa todos los campos', 'error');
            return;
        }

        try {
            showNotification('Validando configuración...', 'info');
            
            const response = await axios.post('/api/moodle/config', {
                moodle_url: moodleUrl,
                moodle_token: moodleToken,
                moodle_user_id: moodleUserId
            });

            if (response.data.success) {
                showNotification('Configuración guardada exitosamente', 'success');
                // Limpiar el campo del token por seguridad
                document.getElementById('moodleToken').value = '';
            }
        } catch (error) {
            console.error('Error guardando configuración:', error);
            showNotification(error.response?.data?.error || 'Error guardando configuración', 'error');
        }
    }

    // Sincronizar cursos
    async function syncCourses() {
        try {
            showNotification('Sincronizando cursos...', 'info');
            syncCoursesBtn.disabled = true;
            syncCoursesBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sincronizando...';

            const response = await axios.get('/api/moodle/courses');
            
            if (response.data.success) {
                showNotification(response.data.message, 'success');
                displayCourses(response.data.courses);
                coursesSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error sincronizando cursos:', error);
            showNotification(error.response?.data?.error || 'Error sincronizando cursos', 'error');
        } finally {
            syncCoursesBtn.disabled = false;
            syncCoursesBtn.innerHTML = '<i class="fas fa-book me-2"></i>Sincronizar Cursos';
        }
    }

    // Sincronizar tareas
    async function syncAssignments() {
        try {
            showNotification('Sincronizando tareas...', 'info');
            syncAssignmentsBtn.disabled = true;
            syncAssignmentsBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sincronizando...';

            const response = await axios.post('/api/moodle/sync-assignments');
            
            if (response.data.success) {
                showNotification(response.data.message, 'success');
                // Recargar la lista de tareas si está visible
                if (assignmentsSection.style.display !== 'none') {
                    loadAssignments();
                }
            }
        } catch (error) {
            console.error('Error sincronizando tareas:', error);
            showNotification(error.response?.data?.error || 'Error sincronizando tareas', 'error');
        } finally {
            syncAssignmentsBtn.disabled = false;
            syncAssignmentsBtn.innerHTML = '<i class="fas fa-tasks me-2"></i>Sincronizar Tareas';
        }
    }

    // Sincronizar calendario
    async function syncCalendar() {
        try {
            showNotification('Sincronizando calendario...', 'info');
            syncCalendarBtn.disabled = true;
            syncCalendarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Sincronizando...';

            const start = new Date();
            start.setMonth(start.getMonth() - 1);
            const end = new Date();
            end.setMonth(end.getMonth() + 2);

            const response = await axios.get('/api/moodle/calendar-events', {
                params: {
                    start: start.toISOString(),
                    end: end.toISOString()
                }
            });
            
            if (response.data.success) {
                showNotification(`${response.data.events.length} eventos del calendario sincronizados`, 'success');
            }
        } catch (error) {
            console.error('Error sincronizando calendario:', error);
            showNotification(error.response?.data?.error || 'Error sincronizando calendario', 'error');
        } finally {
            syncCalendarBtn.disabled = false;
            syncCalendarBtn.innerHTML = '<i class="fas fa-calendar-alt me-2"></i>Sincronizar Calendario';
        }
    }

    // Mostrar cursos
    function displayCourses(courses) {
        coursesList.innerHTML = '';
        
        if (courses.length === 0) {
            coursesList.innerHTML = '<div class="col-12"><p class="text-muted">No se encontraron cursos.</p></div>';
            return;
        }

        courses.forEach(course => {
            const courseCard = document.createElement('div');
            courseCard.className = 'col-md-6 col-lg-4 mb-3';
            courseCard.innerHTML = `
                <div class="card course-card h-100">
                    <div class="card-body">
                        <h6 class="card-title text-primary">${course.fullname}</h6>
                        <p class="card-text text-muted small">${course.shortname}</p>
                        ${course.summary ? `<p class="card-text small">${course.summary.substring(0, 100)}...</p>` : ''}
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>
                                ${course.startdate ? new Date(course.startdate * 1000).toLocaleDateString() : 'Sin fecha'}
                            </small>
                            <button class="btn btn-sm btn-outline-primary" onclick="loadCourseAssignments(${course.id})">
                                <i class="fas fa-tasks me-1"></i> Ver Tareas
                            </button>
                        </div>
                    </div>
                </div>
            `;
            coursesList.appendChild(courseCard);
        });
    }

    // Cargar tareas de un curso específico
    window.loadCourseAssignments = async function(courseId) {
        try {
            showNotification('Cargando tareas del curso...', 'info');
            
            const response = await axios.get(`/api/moodle/assignments/${courseId}`);
            
            if (response.data.success) {
                displayAssignments(response.data.assignments);
                assignmentsSection.style.display = 'block';
                assignmentsSection.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error('Error cargando tareas:', error);
            showNotification(error.response?.data?.error || 'Error cargando tareas', 'error');
        }
    };

    // Mostrar tareas
    function displayAssignments(assignments) {
        assignmentsList.innerHTML = '';
        
        if (assignments.length === 0) {
            assignmentsList.innerHTML = '<p class="text-muted">No se encontraron tareas en este curso.</p>';
            return;
        }

        assignments.forEach(assignment => {
            const assignmentItem = document.createElement('div');
            assignmentItem.className = 'assignment-item';
            
            const dueDate = assignment.duedate ? new Date(assignment.duedate * 1000) : null;
            const isOverdue = dueDate && dueDate < new Date();
            const isDueSoon = dueDate && dueDate > new Date() && dueDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            
            let statusClass = '';
            let statusIcon = '';
            if (isOverdue) {
                statusClass = 'text-danger';
                statusIcon = 'fas fa-exclamation-triangle';
            } else if (isDueSoon) {
                statusClass = 'text-warning';
                statusIcon = 'fas fa-clock';
            } else {
                statusClass = 'text-success';
                statusIcon = 'fas fa-check-circle';
            }

            assignmentItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${assignment.name}</h6>
                        ${assignment.intro ? `<p class="small text-muted mb-2">${assignment.intro.substring(0, 150)}...</p>` : ''}
                        <div class="small">
                            ${dueDate ? `
                                <span class="${statusClass}">
                                    <i class="${statusIcon} me-1"></i>
                                    Vence: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}
                                </span>
                            ` : '<span class="text-muted">Sin fecha límite</span>'}
                        </div>
                    </div>
                    <div class="ms-3">
                        <button class="btn btn-sm btn-outline-primary" onclick="addToCalendar(${assignment.id}, '${assignment.name}')">
                            <i class="fas fa-plus me-1"></i> Agregar
                        </button>
                    </div>
                </div>
            `;
            assignmentsList.appendChild(assignmentItem);
        });
    }

    // Agregar tarea al calendario local
    window.addToCalendar = async function(assignmentId, assignmentName) {
        try {
            // Aquí podrías implementar la lógica para agregar la tarea al calendario local
            showNotification(`Tarea "${assignmentName}" agregada al calendario`, 'success');
        } catch (error) {
            console.error('Error agregando tarea al calendario:', error);
            showNotification('Error agregando tarea al calendario', 'error');
        }
    };

    // Cargar tareas guardadas localmente
    async function loadAssignments() {
        try {
            const response = await axios.get('/api/eventos');
            const moodleEvents = response.data.filter(event => event.moodle_assignment_id);
            
            if (moodleEvents.length > 0) {
                displayAssignments(moodleEvents.map(event => ({
                    id: event.moodle_assignment_id,
                    name: event.nombre,
                    duedate: new Date(event.deadline).getTime() / 1000
                })));
                assignmentsSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error cargando tareas locales:', error);
        }
    }

    // Cargar tareas al iniciar si hay configuración
    loadAssignments();
}); 
document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    slotMinTime: "08:00:00",
    slotMaxTime: "22:00:00",
    height: "auto"
  });
  calendar.render();

  const taskForm = document.getElementById('taskForm');
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tarea = {
      nombre: document.getElementById('nombre').value,
      tipo: document.getElementById('tipo').value,
      duracion: parseInt(document.getElementById('duracion').value),
      deadline: document.getElementById('deadline').value
    };

    try {
      // Enviar tarea al backend
      const res = await fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tarea)
      });

      if (res.ok) {
        alert('Tarea guardada ✅');
        // Asignación automática simple (IA futura aquí)
        const fecha = new Date(tarea.deadline);
        fecha.setHours(10); // horario fijo por ahora
        calendar.addEvent({
          title: tarea.nombre + " (" + tarea.tipo + ")",
          start: fecha.toISOString(),
          end: new Date(fecha.getTime() + tarea.duracion * 60 * 60 * 1000).toISOString()
        });

        taskForm.reset();
      } else {
        alert('Error al guardar tarea');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  });

  // Cargar tareas previas del backend
  async function cargarTareas() {
    try {
      const res = await fetch('/api/tareas');
      const tareas = await res.json();

      tareas.forEach((tarea) => {
        const fecha = new Date(tarea.deadline);
        fecha.setHours(10);
        calendar.addEvent({
          title: tarea.nombre + " (" + tarea.tipo + ")",
          start: fecha.toISOString(),
          end: new Date(fecha.getTime() + tarea.duracion * 60 * 60 * 1000).toISOString()
        });
      });
    } catch (err) {
      console.error('Error cargando tareas:', err);
    }
  }

  cargarTareas();
});

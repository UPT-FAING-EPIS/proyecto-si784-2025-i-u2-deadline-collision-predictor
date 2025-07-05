document.getElementById("upt-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = document.getElementById("codigo").value;
  const password = document.getElementById("password").value;

  const resultadoDiv = document.getElementById("resultado");
  const descargasDiv = document.getElementById("descargas");

  resultadoDiv.innerHTML = "⏳ Procesando...";
  descargasDiv.classList.add("d-none");

  let horarioExtraido = null;

  try {
    const res = await fetch("/api/upt-horario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, password }),
    });

    const text = await res.text();
    // Intentamos parsear JSON solo si la respuesta parece JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Si no es JSON, mostramos el contenido crudo para debugging
      throw new Error(`Respuesta inesperada del servidor: ${text}`);
    }

    if (!res.ok) {
      throw new Error(data.error || "Error al obtener el horario.");
    }

    horarioExtraido = data.data; // Guardar el horario extraído

    resultadoDiv.innerHTML = "✅ Horario extraído correctamente.";
    document.getElementById("descarga-json").href = `/api/upt-horario/download/json/${codigo}`;
    document.getElementById("descarga-excel").href = `/api/upt-horario/download/excel/${codigo}`;
    descargasDiv.classList.remove("d-none");

    document.getElementById("subida-container").classList.remove("d-none");

    // Listener para subida (una vez)
    document.getElementById("btn-subir").addEventListener("click", async () => {
      const desde = document.getElementById("desde").value;
      const hasta = document.getElementById("hasta").value;
      const resultadoSubida = document.getElementById("resultado-subida");

      if (!desde || !hasta) {
        resultadoSubida.innerHTML = "❗ Debes seleccionar el rango de fechas.";
        return;
      }

      if (new Date(hasta) < new Date(desde)) {
        resultadoSubida.innerHTML = "❗ La fecha 'hasta' no puede ser menor que 'desde'.";
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/upt-horario/subir/${codigo}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({ desde, hasta, horario: horarioExtraido }),
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`Respuesta inesperada del servidor: ${text}`);
        }

        if (!res.ok) throw new Error(data.error || "Error al subir el horario.");

        resultadoSubida.innerHTML = "✅ Horario subido correctamente.";
      } catch (err) {
        resultadoSubida.innerHTML = `❌ ${err.message}`;
      }
    }, { once: true });
  } catch (err) {
    resultadoDiv.innerHTML = `❌ ${err.message}`;
  }
});

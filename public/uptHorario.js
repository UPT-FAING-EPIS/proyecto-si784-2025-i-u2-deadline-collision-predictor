document.getElementById("upt-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const codigo = document.getElementById("codigo").value;
  const password = document.getElementById("password").value;

  const resultadoDiv = document.getElementById("resultado");
  const descargasDiv = document.getElementById("descargas");

  resultadoDiv.innerHTML = "⏳ Procesando...";
  descargasDiv.classList.add("d-none");

  try {
    const res = await fetch("/api/upt-horario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Error al obtener el horario.");
    }

    resultadoDiv.innerHTML = "✅ Horario extraído correctamente.";
    document.getElementById("descarga-json").href = `/api/upt-horario/download/json/${codigo}`;
    document.getElementById("descarga-excel").href = `/api/upt-horario/download/excel/${codigo}`;
    descargasDiv.classList.remove("d-none");
  } catch (err) {
    resultadoDiv.innerHTML = `❌ ${err.message}`;
  }
});

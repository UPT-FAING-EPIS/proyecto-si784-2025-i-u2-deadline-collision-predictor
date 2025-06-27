terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 2.20.0"
    }
  }
}

provider "docker" {
  host = "ssh://root@161.132.45.140"
}

# Sube el proyecto automáticamente al servidor remoto
resource "null_resource" "subir_codigo" {
  provisioner "local-exec" {
    command = "scp -r -i Upt2025 ./proyecto-si784-2025-i-u2-deadline-collision-predictor root@161.132.45.140:/root/mi_proyecto"
  }
}

# Construye la imagen usando el Dockerfile en el servidor
resource "docker_image" "mi_app" {
  name = "mi_app_node"

  build {
    path       = "/root/mi_proyecto"
    dockerfile = "Dockerfile"
    remove     = true
  }

  depends_on = [null_resource.subir_codigo]
}



# Crea el contenedor
resource "docker_container" "mi_contenedor" {
  name  = "mi_app_node"
  image = docker_image.mi_app.name

  ports {
    internal = 3000
    external = 3000
  }

  working_dir = "/usr/src/app"
  command     = ["node", "server.js"]
}

import os
import re
import time
import json
import shutil
import tempfile
import pandas as pd
import pytesseract
import cv2
import sys

from PIL import Image
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

# Ruta a tesseract.exe (ajusta si es necesario)
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

class CaptchaSolver:
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()

    def procesar_imagen(self, driver, img_element):
        temp_path = os.path.join(self.temp_dir, "captcha.png")
        img_element.screenshot(temp_path)
        return temp_path

    def resolver(self, img_path):
        try:
            img = cv2.imread(img_path)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            inverted = cv2.bitwise_not(gray)
            _, thresh = cv2.threshold(inverted, 127, 255, cv2.THRESH_BINARY)

            config = '--psm 8 -c tessedit_char_whitelist=0123456789'
            texto = pytesseract.image_to_string(thresh, config=config)
            resultado = re.sub(r'\D', '', texto)  # Solo dígitos

            return resultado if len(resultado) == 4 else None
        except Exception as e:
            print(" Error OCR:", e)
            return None

    def limpiar(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)


def iniciar_navegador():
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--headless")  # Ejecutar sin ventana
    return webdriver.Chrome(options=options)


def login(driver, codigo, password):
    driver.get("https://net.upt.edu.pe/index2.php?n=a38c138bbf10e4d5d2fbf6cb08bb280b")
    time.sleep(2)

    driver.find_element(By.ID, "t1").send_keys(codigo)

    img = driver.find_element(By.CSS_SELECTOR, "#td_cuerpo_imagen_aleatoria img")
    solver = CaptchaSolver()
    img_path = solver.procesar_imagen(driver, img)
    captcha_auto = solver.resolver(img_path)

    if captcha_auto:
        print(f" Captcha detectado automáticamente: {captcha_auto}")
        captcha_final = captcha_auto
    else:
        os.startfile(img_path)
        captcha_final = input(" Escribe el número que ves en la imagen: ")

    driver.find_element(By.ID, "kamousagi").send_keys(captcha_final)

    # Usa la contraseña recibida como argumento
    botones = driver.find_elements(By.CLASS_NAME, "btn_cuerpo_login_number")
    mapa = {b.text.strip(): b for b in botones if b.text.strip().isdigit()}
    for d in password:
        if d in mapa:
            mapa[d].click()
            time.sleep(0.2)

    driver.find_element(By.ID, "Submit").click()
    time.sleep(3)

    match = re.search(r'sesion=([A-Za-z0-9]+)', driver.current_url)
    if not match:
        print(" Login fallido. Revisa captcha o contraseña.")
        driver.quit()
        exit(1)

    solver.limpiar()
    return match.group(1)


def extraer_horario(driver, token):
    driver.get(f"https://net.upt.edu.pe/alumno.php?mihorario=1&sesion={token}")
    time.sleep(2)
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    tabla = soup.find("table", {"align": "center", "style": "font-size:12px;"})
    if not tabla:
        return []

    filas = tabla.find_all("tr")[1:]
    horarios = []
    for fila in filas:
        cols = fila.find_all("td")
        if len(cols) < 10:
            continue
        horarios.append({
            "codigo": cols[0].text.strip(),
            "curso": cols[1].text.strip(),
            "seccion": cols[2].text.strip(),
            "lunes": cols[3].text.strip().replace("\n", " - "),
            "martes": cols[4].text.strip().replace("\n", " - "),
            "miércoles": cols[5].text.strip().replace("\n", " - "),
            "jueves": cols[6].text.strip().replace("\n", " - "),
            "viernes": cols[7].text.strip().replace("\n", " - "),
            "sábado": cols[8].text.strip().replace("\n", " - "),
            "domingo": cols[9].text.strip().replace("\n", " - "),
        })
    return horarios


def guardar_archivos(horarios, codigo):
    os.makedirs("scripts/horarios_json", exist_ok=True)
    os.makedirs("scripts/horarios_excel", exist_ok=True)

    with open(f"scripts/horarios_json/{codigo}.json", "w", encoding="utf-8") as f:
        json.dump(horarios, f, ensure_ascii=False, indent=4)

    df = pd.DataFrame(horarios)
    df.to_excel(f"scripts/horarios_excel/{codigo}.xlsx", index=False)

    print(f" Horario guardado como JSON y Excel en scripts/horarios_json/ y horarios_excel/")


def main():
    #  Leer argumentos desde línea de comandos
    if len(sys.argv) < 3:
        print(" Debes proporcionar el código y la contraseña como argumentos.")
        print("Ejemplo: python scrape_horario.py 2020068762 262001")
        exit(1)

    codigo = sys.argv[1]
    password = sys.argv[2]

    driver = iniciar_navegador()
    try:
        token = login(driver, codigo, password)
        horarios = extraer_horario(driver, token)
        if horarios:
            guardar_archivos(horarios, codigo)
            print(" Horario extraído correctamente.")
        else:
            print(" No se encontraron cursos en tu horario.")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()

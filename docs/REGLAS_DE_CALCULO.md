# Reglas de cálculo

Estas son las reglas que aplican por igual el constructor (`tools/construir_datos.py`) y el tablero. Están cubiertas por pruebas automáticas (`tests/`).

## 1. De los reportes del servidor al promedio horario
* Cada fila del reporte lleva la **hora de cierre** del intervalo. La hora 24:00 equivale a las 00:00 del día siguiente.
* Reportes de 10 minutos: el promedio horario es válido con **al menos 5 de 6 registros (75 %)**. Reportes de 1 hora: se toma el valor.
* **Dirección del viento**: promedio vectorial (circular), no aritmético.
* Se descartan los códigos `NoData`, `<Samp` y `9999999`, y los valores físicamente imposibles
  (PM < 0; humedad fuera de 0–100 %; velocidad del viento fuera de 0–60 m/s; dirección fuera de 0–360°; temperatura fuera de −10 a 60 °C).
  Ningún otro valor se corrige. Todo lo descartado queda en `datos/auditoria_codigos.csv`.
* Si dos reportes traen la misma hora, el posterior completa o corrige al anterior.

## 2. Media móvil de 24 h y ICA
* **Media móvil de 24 h**: promedio de las últimas 24 horas, válida con al menos 18 datos.
* **ICA diario**: ICA del promedio de las 24 horas de un día **cerrado** (marcas 01:00 a 24:00), con al menos 18 horas válidas. Un día en curso no se evalúa.
* **ICA** (Resolución 2254 de 2017, Tabla 6): interpolación lineal dentro del tramo de la concentración **sin redondear**, y el resultado se **trunca** a entero.
  Así se reproduce el Boletín N° 166 (33 de 34 valores coinciden; la diferencia restante está documentada en `tests/test_boletin_166.py`).
* Normas de PM2.5 de referencia: 37 µg/m³ (24 h) y 25 µg/m³ (anual).
* Categorías: Buena, Aceptable, Dañina a la salud de grupos sensibles, Dañina a la salud, Muy dañina a la salud y Peligrosa.

## 3. Lo que el tablero no incluye
* **Precipitación (pluviómetro TP200)**: no se publica. Los valores del equipo traen desbordamientos de 16 bits y códigos de error (65536, 9999, 55537),
  y la fila «Avg» del reporte es en realidad una suma. Se podría recuperar la lluvia diaria, pero CORPONOR decidió no incluirla hasta confirmar su confiabilidad.
* **Presión barométrica (PB)**: se audita pero no se usa. Ojo: no es plomo; los reportes la traen en mmHg (Centro, El Salado) o hPa (las demás estaciones).

## 4. Cómo auditar un valor
1. Busque la hora y la estación en `datos/historico.csv`.
2. Compare con el reporte original en `datos/crudos/`.
3. Revise `datos/auditoria_codigos.csv` para ver si hubo datos descartados en esa hora.
4. Recalcule con las reglas anteriores; `python -m pytest -q` verifica que el código las cumple.

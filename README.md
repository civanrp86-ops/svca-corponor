# Tablero de calidad del aire · SVCA CORPONOR

Tablero público del Sistema de Vigilancia de la Calidad del Aire (SVCA) de CORPONOR para San José de Cúcuta:
PM2.5 en tiempo real, Índice de Calidad del Aire (ICA) según la Resolución 2254 de 2017, histórico desde 2022,
variables meteorológicas, mapa de estaciones con foto y un panel de administración para validar datos y generar el
informe en PDF.

Todo el sitio es estático (HTML + JavaScript): no necesita servidor propio ni base de datos. Se publica en GitHub Pages y los datos
se reconstruyen automáticamente desde los reportes crudos que entrega el servidor de monitoreo.

## Cómo funciona

```
Reporte del servidor (.csv)           Revisión y aprobación                 Publicación automática
datos/crudos/AAAA/*.csv   ──►  solicitud de cambios (pull request)  ──►  merge a main
                               · informe de validación automático        · reconstruye la base
                               · lista de verificación                   · corre las pruebas
                               · aprobación de quien revisa              · publica en GitHub Pages
```

* **Reportes crudos** (`datos/crudos/`): son la fuente de verdad. No se editan a mano.
* **Constructor** (`tools/construir_datos.py`): convierte promedios de 10 minutos o de 1 hora en promedios horarios, descarta códigos de
  error y genera `historico.js`, `historico.csv`, `auditoria_codigos.csv` e `informe_validacion.md`.
* **Tablero** (`index.html` + `assets/`): lee `datos/historico.js` y calcula media móvil de 24 h, ICA, gráficas e informe PDF en el navegador.
* **Historial de cambios**: cada carga de datos queda en Git con usuario, fecha, hora y la aprobación de quien revisó.

## Estructura

| Carpeta o archivo | Contenido |
|---|---|
| `index.html` | Página del tablero |
| `assets/config.js` | **Configuración editable**: estaciones, posición en el mapa, fotos, clave del panel |
| `assets/app.js`, `assets/style.css` | Lógica y estilos |
| `assets/vendor/` | Chart.js y jsPDF (copias locales, sin servicios externos) |
| `datos/crudos/` | Reportes del servidor, por año |
| `datos/` | Resultados reconstruidos (no se guardan en Git; los genera el flujo automático) |
| `fotos/` | Fotos de las estaciones |
| `tools/construir_datos.py` | Constructor de la base de datos y del informe de validación |
| `tests/` | Pruebas automáticas (regla del ICA, agrupación horaria, contraste con el Boletín N° 166) |
| `docs/` | Guías: GitHub paso a paso, actualizar datos, reglas de cálculo, seguridad y límites |
| `.github/` | Flujos automáticos, plantillas de solicitud de cambios y de incidentes |

## Probarlo en su computador

```bash
pip install -r tools/requirements.txt
python tools/construir_datos.py          # genera los datos en datos/
python -m pytest -q                      # pruebas automáticas
python -m http.server 8000               # abrir http://localhost:8000
```

También funciona abriendo `index.html` con doble clic, siempre que antes haya ejecutado el constructor.

## Guías

1. [Publicar en GitHub paso a paso](docs/GITHUB_PASO_A_PASO.md)
2. [Actualizar los datos cada mes](docs/ACTUALIZAR_DATOS.md)
3. [Reglas de cálculo](docs/REGLAS_DE_CALCULO.md)
4. [Seguridad y límites](docs/SEGURIDAD_Y_LIMITES.md)

## Licencia y titularidad

Pendiente de definir con la oficina jurídica de CORPONOR antes de la publicación (por ejemplo, licencia abierta para el código y
condiciones de uso para los datos).

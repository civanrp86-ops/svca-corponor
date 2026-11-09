# Historial de versiones

## 1.1.1 · 2026-11-09
- «¿Cuándo está peor el aire?»: selector único de periodo sobre las dos gráficas, con las fechas exactas (desde–hasta) en el encabezado y en el subtítulo de cada gráfica; la gráfica por día de la semana explica qué promedia cada barra.

## 1.0.0 · 2026-11-04

Primera versión organizada como proyecto.

* Tablero con PM2.5, media móvil de 24 h, ICA (regla del boletín oficial de CORPONOR), calendario, mapa de calor anual, tendencias,
  hora y día más contaminados, variables meteorológicas con mapas de calor y rosa de los vientos.
* Tabla del ICA de la Resolución 2254 de 2017 bajo el mapa y foto de la estación al hacer clic.
* Panel de administración: validación previa de reportes, informe PDF de 11 páginas y descarga de las últimas 24 horas.
* Constructor de datos en Python con informe de validación, auditoría de códigos especiales y pruebas automáticas.
* Publicación automática en GitHub Pages con revisión obligatoria de los datos.

## 1.1.0 · 2026-11-09

- Datos hasta el 09/11/2026 08:00: tramo nuevo en `datos/crudos/2026/2026-11-09_tramo_26oct-09nov.csv`, tomado sin cambios del reporte horario 2022-2026
  entregado por el servidor (solo se ajustó el periodo del título). El resto del histórico no cambió.
- El lector acepta números de serie de Excel (marcas de las 00:00) y fechas con día de un dígito; las celdas vacías se auditan como «Vacío».
  Las celdas que Excel convirtió en fecha no se corrigen: se excluyen y quedan como «Texto» en la auditoría.
- El informe de validación avisa de PM2.5 casi nulo persistente (posible falla del equipo).
- Carpeta `db/` con el esquema de PostgreSQL, el cargador, el exportador y pruebas contra el cálculo en Python.
- `index.html` pide a los buscadores no indexar el sitio mientras no haya autorización (etiqueta marcada «PRE-PUBLICACIÓN»).

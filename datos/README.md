# Carpeta de datos

* `crudos/AAAA/` — reportes multiestación tal como los entrega el servidor (`.csv` o `.xlsx`, promedio de 10 minutos o de 1 hora).
  Esta es la única carpeta que se modifica a mano, y solo agregando archivos.
* `historico.js`, `historico.csv`, `auditoria_codigos.csv`, `informe_validacion.md` — resultados que **se reconstruyen solos**
  con `python tools/construir_datos.py` (o con el flujo automático de GitHub). No se suben a Git (están en `.gitignore`).

Convención de nombres: diario `datos/crudos/2026/2026-11-08.csv`, mensual `datos/crudos/2026/2026-11_reporte.csv`.
Nunca se borra un archivo anterior: la base se arma con todos. Si dos reportes traen la misma hora, gana el que termina más tarde
(según el periodo de su primera línea); las horas con NoData o vacías nunca borran datos ya cargados.

**Procedencia de `crudos/2026/2026-11-09_tramo_26oct-09nov.csv`:** son las filas del 26/10/2026 00:00 al 09/11/2026 08:00 del reporte horario 2022-2026
que entregó el servidor el 09/11/2026, sin modificar sus valores; solo se corrigió el periodo del título. El reporte completo se comparó con los años
ya cargados y coincide (PM2.5 y PM10 con diferencias de 0,01 µg/m³ como máximo). Del 04/11 al 09/11 hay 42 celdas que Excel convirtió en fecha: se excluyen.
Conviene reemplazar este tramo por una exportación directa del servidor.

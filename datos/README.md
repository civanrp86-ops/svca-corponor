# Carpeta de datos

* `crudos/AAAA/` — reportes multiestación tal como los entrega el servidor (`.csv` o `.xlsx`, promedio de 10 minutos o de 1 hora).
  Esta es la única carpeta que se modifica a mano, y solo agregando archivos.
* `historico.js`, `historico.csv`, `auditoria_codigos.csv`, `informe_validacion.md` — resultados que **se reconstruyen solos**
  con `python tools/construir_datos.py` (o con el flujo automático de GitHub). No se suben a Git (están en `.gitignore`).

Convención de nombres: diario `datos/crudos/2026/2026-11-08.csv`, mensual `datos/crudos/2026/2026-11_reporte.csv`.
Nunca se borra un archivo anterior: la base se arma con todos. Si dos reportes traen la misma hora, gana el que termina más tarde
(según el periodo de su primera línea); las horas con NoData o vacías nunca borran datos ya cargados.

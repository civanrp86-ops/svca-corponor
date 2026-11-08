# Actualizar los datos (diario o mensual)

## Lo esencial

* Cada carga es **un archivo nuevo** en `datos/crudos/AAAA/`. Nunca se borran ni se reemplazan los archivos anteriores:
  el tablero se reconstruye siempre con **todos** los reportes, así que el histórico completo se conserva.
* Un reporte nuevo solo **agrega** horas o **corrige** horas que ya existían con un valor válido. Si trae `NoData`, `<Samp` o celdas
  vacías en horas que ya estaban cargadas, esas horas **no se borran** (hay una prueba automática que lo garantiza).
* Si dos reportes traen la misma hora, gana el que **termina más tarde** según el periodo de su primera línea
  («Periodica: … - …»), no el nombre del archivo.

## Pasos

1. **Exportar** del servidor de monitoreo el reporte multiestación del periodo nuevo (promedio de 1 hora o de 10 minutos).
   Incluya el reporte tal cual: no lo abra ni lo edite en Excel.
2. **Nombrar** el archivo con la fecha: diario `AAAA-MM-DD.csv` (por ejemplo `2026-11-08.csv`) o mensual `AAAA-MM_reporte.csv`,
   y guardarlo en `datos/crudos/AAAA/`. Un nombre único por carga evita reemplazar por error un archivo anterior.
3. **Pre-validar (opcional)**: abra el tablero, entre al panel de administración y cargue el archivo; verá el mismo tipo de informe de validación
   antes de subir nada.
4. **Subir en una solicitud de cambios**:
   * En GitHub: `Add file` → `Upload files` dentro de `datos/crudos/AAAA/`, arrastre el archivo y elija
     **`Create a new branch for this commit and start a pull request`**. Título sugerido: «Datos de noviembre de 2026».
5. **Esperar la validación automática** (1 a 3 minutos). El sistema publica en la solicitud un comentario con el informe de validación
   y una marca verde o roja.
6. **Revisar** (otra persona): leer el informe y marcar la lista de verificación de la solicitud:
   * El conteo de datos coincide con la fila «Num» del reporte.
   * Los códigos especiales (NoData, &lt;Samp, 9999999) son los esperados y están asociados a fallas conocidas.
   * Picos horarios aislados y series pegadas: decidir si son reales o falla del equipo (ver abajo).
   * Disponibilidad por estación y año coherente con las fallas conocidas.
7. **Aprobar** (`Review changes` → `Approve`) y **unir** (`Merge pull request`). El tablero se actualiza solo en unos minutos.

## Qué hacer con valores dudosos

El sistema **no borra ni corrige** valores (salvo códigos de error y valores físicamente imposibles). Si quien valida decide que un valor no es confiable
(por ejemplo, el pico de 34,4 µg/m³ del 2 de octubre de 2026 en El Salado, que el boletín oficial no incluyó):

* Documentarlo en la solicitud de cambios (queda en el historial).
* Pendiente de implementar: una lista de exclusiones (`datos/exclusiones.csv`) que el constructor aplique de forma trazable.
  Mientras tanto, el informe PDF y el tablero muestran los datos tal como los reporta el equipo.

## Cargar más años (2022 en adelante)

Copie cada reporte anual a `datos/crudos/2022/`, `datos/crudos/2023/`, etc. y suba todo en una sola solicitud de cambios.
Pueden mezclarse reportes de 10 minutos y de 1 hora. Si dos reportes traen la misma hora, el que termina más tarde completa o corrige al anterior.

## Corregir una carga equivocada

* Si aún no se unió: cierre la solicitud de cambios.
* Si ya se publicó: en la solicitud unida pulse `Revert`. Se crea otra solicitud que deshace el cambio y se publica de nuevo el estado anterior.
* Si el servidor entrega luego un reporte corregido, súbalo como archivo nuevo (por ejemplo `2026-11-08_corregido.csv`): gana por terminar igual o más tarde.
  Si termina en la misma fecha que el original, el desempate es por nombre, así que use un sufijo como `_corregido`.

## Usar el panel de administración sin GitHub (solo pruebas)

El panel puede cargar reportes, validarlos y descargar `historico.js`, pero eso queda **solo en el navegador** y no se publica.
Para publicar, siempre se usa la solicitud de cambios.

## Pluviómetro

La columna `Pluv` de los reportes se ignora a propósito: los registros tienen códigos de error (65536, 9999, 55537) que contaminan los valores.
Ver `docs/REGLAS_DE_CALCULO.md`.

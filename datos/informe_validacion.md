# Informe de validación de datos

Generado el 2026-11-04 19:26 UTC · 64.757 horas-estación · 01/01/2025 a 25/10/2026

> Este informe lo revisa una persona **antes** de publicar. No se corrige ni se elimina ningún valor automáticamente (salvo códigos de error y valores físicamente imposibles).

## Archivos procesados

| Archivo | Promedio | Periodo | Registros | Conteo vs. fila «Num» | Códigos especiales (registros) |
|---|---|---|---|---|---|
| 2025.csv | 10 min | 01/01/2025 a 01/01/2026 | 52.561 | ✔ 30/30 | 9999999 3.181 · &lt;Samp 8.468 · NoData 330.097 |
| 2026.csv | 60 min | 01/01/2026 a 26/10/2026 | 7.153 | ✔ 30/30 | &lt;Samp 6.570 · NoData 67.540 |

## Disponibilidad de PM2.5 por estación y año

| Estación | Año | Horas válidas | Horas del periodo | % | Días con ICA | Mayor vacío (h) |
|---|---|---|---|---|---|---|
| Centro | 2025 | 8673 | 8760 | 99.0 | 360 | 0 |
| Centro | 2026 | 4291 | 7147 | 60.0 | 175 | 2252 |
| Comuneros | 2025 | 8607 | 8760 | 98.3 | 357 | 77 |
| Comuneros | 2026 | 7143 | 7147 | 99.9 | 297 | 0 |
| El Salado | 2025 | 8759 | 8760 | 100.0 | 365 | 0 |
| El Salado | 2026 | 7098 | 7147 | 99.3 | 294 | 0 |
| Punto Blanco | 2025 | 3728 | 8760 | 42.6 | 153 | 425 |
| Unidad Móvil | 2025 | 6827 | 8760 | 77.9 | 279 | 1088 |
| Unidad Móvil | 2026 | 2883 | 7147 | 40.3 | 117 | 4221 |

## Vacíos de PM2.5 de más de 72 horas

| Estación | Último dato antes | Primer dato después | Horas sin dato |
|---|---|---|---|
| Unidad Móvil | 10/04/2026 15:00 | 03/10/2026 13:00 | 4221 |
| Centro | 04/06/2026 20:00 | 06/09/2026 17:00 | 2252 |
| Unidad Móvil | 25/04/2025 10:00 | 09/06/2025 19:00 | 1088 |
| Unidad Móvil | 23/01/2025 02:00 | 17/02/2025 12:00 | 609 |
| Punto Blanco | 20/03/2025 17:00 | 07/04/2025 11:00 | 425 |
| Unidad Móvil | 09/04/2025 10:00 | 15/04/2025 11:00 | 144 |
| Comuneros | 28/06/2025 04:00 | 01/07/2025 10:00 | 77 |
| Comuneros | 09/05/2025 06:00 | 12/05/2025 10:00 | 75 |

## Series pegadas (12 horas seguidas o más con exactamente el mismo valor de PM2.5)

| Estación | Desde | Horas | Valor (µg/m³) |
|---|---|---|---|
| Centro | 21/04/2026 12:00 | 53 | 0.00 |

## Picos horarios aislados para revisar

_PM2.5 ≥ 25 µg/m³ y ≥ 3,5 veces la mediana de las horas vecinas. Pueden ser reales (quema, tráfico) o fallas del equipo; decide quien valida._

| Estación | Hora (cierre) | PM2.5 (µg/m³) | Mediana vecina |
|---|---|---|---|
| Comuneros | 28/08/2025 23:00 | 115.2 | 8.2 |
| Comuneros | 01/01/2026 01:00 | 341.6 | 36.4 |
| El Salado | 25/02/2026 12:00 | 240.4 | 30.0 |
| El Salado | 02/10/2026 14:00 | 34.4 | 4.6 |
| El Salado | 18/07/2025 21:00 | 34.6 | 4.6 |
| Comuneros | 17/09/2026 21:00 | 47.6 | 6.9 |
| Unidad Móvil | 19/06/2025 00:00 | 67.1 | 10.2 |
| Centro | 26/06/2025 10:00 | 39.0 | 5.9 |
| El Salado | 20/07/2026 03:00 | 26.8 | 4.8 |
| Centro | 20/09/2026 16:00 | 27.9 | 5.0 |
| Punto Blanco | 01/06/2025 20:00 | 25.7 | 4.8 |
| Unidad Móvil | 19/08/2025 23:00 | 52.1 | 9.9 |
| El Salado | 07/07/2025 07:00 | 55.6 | 10.7 |
| El Salado | 15/04/2026 01:00 | 47.0 | 9.9 |
| Unidad Móvil | 14/06/2025 09:00 | 54.5 | 11.9 |
| Comuneros | 14/04/2026 19:00 | 57.6 | 12.7 |
| El Salado | 27/07/2025 06:00 | 63.0 | 13.9 |
| Unidad Móvil | 07/04/2026 21:00 | 30.4 | 7.0 |
| El Salado | 27/09/2025 20:00 | 55.2 | 13.4 |
| Comuneros | 05/05/2025 21:00 | 42.0 | 10.2 |

Total de picos detectados: 33.

## Códigos especiales por estación y variable (registros)

| Estación | Variable | NoData | &lt;Samp | 9999999 | Imposible | Texto |
|---|---|---|---|---|---|---|
| Centro | PB | 360 | 11 | 0 | 0 | 0 |
| Centro | PM10 | 3365 | 14 | 0 | 0 | 0 |
| Centro | PM2.5 | 3365 | 14 | 0 | 0 | 0 |
| Centro | RH | 360 | 11 | 0 | 0 | 0 |
| Centro | TEMP | 360 | 11 | 0 | 0 | 0 |
| Centro | WD | 360 | 11 | 0 | 0 | 0 |
| Centro | WS | 360 | 11 | 0 | 0 | 0 |
| Comuneros | PB | 1088 | 760 | 0 | 0 | 0 |
| Comuneros | PM10 | 921 | 17 | 0 | 0 | 0 |
| Comuneros | PM2.5 | 921 | 17 | 0 | 0 | 0 |
| Comuneros | RH | 1092 | 783 | 0 | 0 | 0 |
| Comuneros | TEMP | 1092 | 783 | 0 | 0 | 0 |
| Comuneros | WD | 960 | 728 | 0 | 0 | 0 |
| Comuneros | WS | 960 | 728 | 0 | 0 | 0 |
| El Salado | PB | 10 | 2 | 0 | 0 | 0 |
| El Salado | PM10 | 57 | 4 | 0 | 0 | 0 |
| El Salado | PM2.5 | 57 | 4 | 0 | 0 | 0 |
| El Salado | RH | 10 | 2 | 0 | 0 | 0 |
| El Salado | TEMP | 10 | 2 | 0 | 0 | 0 |
| El Salado | WD | 10 | 2 | 0 | 0 | 0 |
| El Salado | WS | 10 | 2 | 0 | 0 | 0 |
| Punto Blanco | PB | 39973 | 78 | 0 | 0 | 0 |
| Punto Blanco | PM10 | 37327 | 10 | 0 | 0 | 0 |
| Punto Blanco | PM2.5 | 37327 | 10 | 0 | 0 | 0 |
| Punto Blanco | RH | 37325 | 2711 | 0 | 0 | 0 |
| Punto Blanco | TEMP | 37325 | 2711 | 0 | 0 | 0 |
| Punto Blanco | WD | 39973 | 78 | 0 | 0 | 0 |
| Punto Blanco | WS | 39973 | 78 | 0 | 0 | 0 |
| Unidad Móvil | PB | 12654 | 677 | 3171 | 0 | 0 |
| Unidad Móvil | PM10 | 15803 | 39 | 0 | 0 | 0 |
| Unidad Móvil | PM2.5 | 15803 | 39 | 0 | 0 | 0 |
| Unidad Móvil | RH | 22513 | 772 | 0 | 0 | 0 |
| Unidad Móvil | TEMP | 22513 | 772 | 4 | 0 | 0 |
| Unidad Móvil | WD | 11700 | 1573 | 0 | 0 | 0 |
| Unidad Móvil | WS | 11700 | 1573 | 6 | 0 | 0 |

_NoData: el equipo no reportó · &lt;Samp: muestras insuficientes en el intervalo · 9999999: código de error. Ninguno entra al cálculo. El detalle por tramos está en `datos/auditoria_codigos.csv`._

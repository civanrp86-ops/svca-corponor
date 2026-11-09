# Base de datos PostgreSQL (opcional)

El tablero público **no necesita** esta base: funciona con los archivos de `datos/`. La base sirve para guardar el histórico completo,
consultarlo con SQL, auditarlo y, más adelante, manejar las personas que elaboran y revisan los informes.

```
datos/crudos/*.csv ──► tools/construir_datos.py ──► datos/historico.csv ──► db/cargar_a_postgres.py ──► PostgreSQL
                       (validación y cálculo,                                                              │
                        una sola vez)                          datos/historico.js ◄── db/exportar_publico.py
```

La validación y las reglas de cálculo viven en un solo lugar (`construir_datos.py`). La base **no las repite**: guarda el resultado ya validado.
Lo único que calcula la base son las vistas del ICA, y una prueba automática comprueba que dan lo mismo que Python.

## 1. Instalar PostgreSQL en Windows
1. Descargue el instalador de https://www.postgresql.org/download/windows/ (versión 14 o superior). Incluye **pgAdmin**.
2. Durante la instalación anote la clave del usuario `postgres` y deje el puerto `5432`.
3. Abra **pgAdmin** → clic derecho en `Databases` → `Create` → `Database…` → nombre `svca`.
   (XAMPP no se toca: trae MariaDB, no PostgreSQL, y pueden convivir.)

## 2. Cargar los datos
Desde la carpeta del proyecto, en una terminal:

```bash
pip install -r tools/requirements.txt -r db/requirements.txt
python tools/construir_datos.py
set SVCA_DSN=postgresql://postgres:SU_CLAVE@localhost:5432/svca        (Windows; en Linux/Mac: export SVCA_DSN=...)
python db/cargar_a_postgres.py
```

Crea las tablas y las vistas si no existen, carga las horas-estación y deja una fila en la bitácora `carga`
(quién, cuándo y huella de cada reporte). Se puede repetir: lo que ya existe se actualiza, no se duplica.

## 3. Consultas útiles (en pgAdmin: clic derecho en `svca` → `Query Tool`)

```sql
-- ICA diario de una estación
SELECT dia, pm25_prom, horas_validas, ica, categoria
FROM v_ica_diario WHERE estacion = 'Comuneros' ORDER BY dia DESC LIMIT 30;

-- Días con ICA mayor a 100 (dañina a grupos sensibles o peor)
SELECT estacion, dia, pm25_prom, ica, categoria FROM v_ica_diario WHERE ica > 100 ORDER BY dia DESC;

-- ICA horario (media móvil de 24 h) de las últimas horas
SELECT * FROM v_ica_horario WHERE estacion = 'El Salado' ORDER BY hora_cierre DESC LIMIT 24;

-- Horas del día con mayor PM2.5 promedio
SELECT hora_cierre, pm25_promedio FROM v_pm25_por_hora_del_dia WHERE estacion = 'Comuneros' ORDER BY pm25_promedio DESC LIMIT 5;

-- Qué se descartó y por qué
SELECT estacion, variable, codigo, count(*) tramos, sum(registros) registros
FROM auditoria_codigo GROUP BY 1, 2, 3 ORDER BY registros DESC;

-- Bitácora de cargas
SELECT * FROM carga ORDER BY id DESC;
```

## 4. Publicar desde la base
```bash
python db/exportar_publico.py        # regenera datos/historico.js y datos/historico.csv desde PostgreSQL
```
Genera exactamente lo mismo que el constructor (se verificó byte a byte).

## 5. Probar que las vistas calculan bien
Cree una base vacía `svca_prueba` y ejecute:

```bash
set SVCA_TEST_DSN=postgresql://postgres:SU_CLAVE@localhost:5432/svca_prueba
python -m pytest tests/test_postgres.py -q
```
Compara el ICA diario, la media móvil de 24 h y la función `ica_pm25` contra el cálculo de Python. Sin esa variable, las pruebas se omiten.

## Notas
* **Horas:** se guardan como hora local de Colombia (UTC−5), hora de cierre (24:00 = 00:00 del día siguiente). Colombia no tiene horario de verano.
* **Seguridad:** no escriba la clave en archivos del repositorio. Use la variable `SVCA_DSN`. Para el sitio público no se necesita ninguna conexión a la base.
* **Producción:** una instalación en un computador personal sirve para desarrollar. Para la base oficial pida a TI un servidor con respaldo diario y un usuario de solo lectura para consultas.
* Las tablas `persona` y `estacion.foto` están listas para las firmas y las fotos, pero el tablero todavía no las usa.

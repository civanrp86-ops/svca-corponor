-- Esquema PostgreSQL del SVCA CORPONOR (PostgreSQL 12 o superior).
-- Se puede ejecutar varias veces sin dañar los datos (usa IF NOT EXISTS / OR REPLACE).
-- Las horas se guardan como hora local de Colombia (UTC-5, sin horario de verano), «hora de cierre»:
-- 24:00 de un día se guarda como 00:00 del día siguiente.

CREATE TABLE IF NOT EXISTS estacion (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT UNIQUE NOT NULL,
    latitud   NUMERIC(9,6),
    longitud  NUMERIC(9,6),
    foto      TEXT
);

INSERT INTO estacion (nombre) VALUES
    ('Centro'), ('Comuneros'), ('El Salado'), ('Punto Blanco'), ('Unidad Móvil')
ON CONFLICT (nombre) DO NOTHING;

CREATE TABLE IF NOT EXISTS medicion_horaria (
    estacion_id  INT       NOT NULL REFERENCES estacion(id),
    hora_cierre  TIMESTAMP NOT NULL,
    pm25         NUMERIC(8,2) CHECK (pm25 >= 0),
    pm10         NUMERIC(8,2) CHECK (pm10 >= 0),
    temperatura  NUMERIC(6,2) CHECK (temperatura BETWEEN -10 AND 60),
    humedad      NUMERIC(6,2) CHECK (humedad BETWEEN 0 AND 100),
    viento       NUMERIC(6,2) CHECK (viento BETWEEN 0 AND 60),
    direccion    NUMERIC(6,2) CHECK (direccion BETWEEN 0 AND 360),
    PRIMARY KEY (estacion_id, hora_cierre)
);

-- Tramos con NoData, <Samp, 9999999 o valores imposibles. Se recarga completa en cada carga.
CREATE TABLE IF NOT EXISTS auditoria_codigo (
    id         SERIAL PRIMARY KEY,
    archivo    TEXT,
    estacion   TEXT,
    variable   TEXT,
    codigo     TEXT,
    inicio     TIMESTAMP,
    fin        TIMESTAMP,
    registros  INT
);

-- Bitácora: quién cargó qué, cuándo, y con qué archivos (huella sha256).
CREATE TABLE IF NOT EXISTS carga (
    id          SERIAL PRIMARY KEY,
    cargado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    cargado_por TEXT NOT NULL DEFAULT current_user,
    archivos    TEXT,
    filas       INT,
    desde       TIMESTAMP,
    hasta       TIMESTAMP
);

-- Personas que elaboran y revisan los informes (para las firmas).
CREATE TABLE IF NOT EXISTS persona (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    cargo     TEXT,
    rol       TEXT CHECK (rol IN ('elaboro', 'reviso', 'aprobo')),
    firma_img TEXT,
    activa    BOOLEAN NOT NULL DEFAULT true
);

-- Categorías del ICA (Resolución 2254 de 2017)
CREATE TABLE IF NOT EXISTS ica_categoria (
    ica_desde INT PRIMARY KEY,
    ica_hasta INT NOT NULL,
    nombre    TEXT NOT NULL,
    color     TEXT NOT NULL
);
INSERT INTO ica_categoria VALUES
    (0,   50,  'Buena',                                  'Verde'),
    (51,  100, 'Aceptable',                              'Amarillo'),
    (101, 150, 'Dañina a la salud de grupos sensibles',  'Naranja'),
    (151, 200, 'Dañina a la salud',                      'Rojo'),
    (201, 300, 'Muy dañina a la salud',                  'Púrpura'),
    (301, 500, 'Peligrosa',                              'Marrón')
ON CONFLICT (ica_desde) DO NOTHING;

CREATE INDEX IF NOT EXISTS ix_medicion_hora ON medicion_horaria (hora_cierre);

-- ICA del PM2.5 (24 h), Tabla 6 de la Resolución 2254 de 2017.
-- Regla del boletín oficial: interpolación lineal en el tramo con la concentración SIN redondear,
-- y resultado truncado al entero.
CREATE OR REPLACE FUNCTION ica_pm25(c NUMERIC) RETURNS INT
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE
        WHEN c IS NULL THEN NULL
        WHEN c <= 12  THEN floor(( 50 -   0) * (c -   0) / (12 -   0) +   0 + 1e-9)::int
        WHEN c <= 37  THEN floor((100 -  51) * (c -  13) / (37 -  13) +  51 + 1e-9)::int
        WHEN c <= 55  THEN floor((150 - 101) * (c -  38) / (55 -  38) + 101 + 1e-9)::int
        WHEN c <= 150 THEN floor((200 - 151) * (c -  56) / (150 - 56) + 151 + 1e-9)::int
        WHEN c <= 250 THEN floor((300 - 201) * (c - 151) / (250 - 151) + 201 + 1e-9)::int
        ELSE least(500, floor((500 - 301) * (c - 251) / (500 - 251) + 301 + 1e-9)::int)
    END
$$;

-- Media móvil de 24 h de PM2.5: válida con al menos 18 datos en las últimas 24 horas.
CREATE OR REPLACE VIEW v_pm25_mm24 AS
SELECT estacion_id, hora_cierre, pm25,
       CASE WHEN count(pm25) OVER w >= 18 THEN avg(pm25) OVER w END AS mm24
FROM medicion_horaria
WINDOW w AS (PARTITION BY estacion_id ORDER BY hora_cierre
             RANGE BETWEEN INTERVAL '23 hours' PRECEDING AND CURRENT ROW);

CREATE OR REPLACE VIEW v_ica_horario AS
SELECT e.nombre AS estacion, m.hora_cierre, m.pm25,
       round(m.mm24, 1) AS mm24,
       ica_pm25(m.mm24) AS ica,
       c.nombre AS categoria, c.color
FROM v_pm25_mm24 m
JOIN estacion e ON e.id = m.estacion_id
LEFT JOIN ica_categoria c ON ica_pm25(m.mm24) BETWEEN c.ica_desde AND c.ica_hasta;

-- ICA diario: ICA del promedio de las 24 horas de un día cerrado (marcas 01:00 a 24:00), con al menos 18 horas válidas.
-- Un día solo se evalúa cuando ya existe una marca posterior a su cierre (00:00 del día siguiente o más).
CREATE OR REPLACE VIEW v_ica_diario AS
WITH dias AS (
    SELECT estacion_id,
           (hora_cierre - INTERVAL '1 minute')::date AS dia,
           avg(pm25) AS pm25_prom, count(pm25) AS horas_validas
    FROM medicion_horaria
    GROUP BY 1, 2
), limite AS (SELECT max(hora_cierre) AS ultima FROM medicion_horaria)
SELECT e.nombre AS estacion, d.dia, round(d.pm25_prom, 1) AS pm25_prom, d.horas_validas,
       ica_pm25(d.pm25_prom) AS ica, c.nombre AS categoria, c.color
FROM dias d
CROSS JOIN limite l
JOIN estacion e ON e.id = d.estacion_id
LEFT JOIN ica_categoria c ON ica_pm25(d.pm25_prom) BETWEEN c.ica_desde AND c.ica_hasta
WHERE d.horas_validas >= 18
  AND l.ultima >= (d.dia + 1)::timestamp;

-- Peores horas del día (hora local de cierre) y peores días: apoyo para las gráficas del tablero
CREATE OR REPLACE VIEW v_pm25_por_hora_del_dia AS
SELECT e.nombre AS estacion, extract(hour FROM m.hora_cierre)::int AS hora_cierre,
       round(avg(m.pm25), 1) AS pm25_promedio, count(m.pm25) AS datos
FROM medicion_horaria m JOIN estacion e ON e.id = m.estacion_id
GROUP BY 1, 2;

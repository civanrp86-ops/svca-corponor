#!/usr/bin/env python3
"""Carga a PostgreSQL la base ya validada por tools/construir_datos.py.

El cálculo y la validación se hacen una sola vez, en construir_datos.py; este script solo guarda el resultado en la base
(datos/historico.csv y datos/auditoria_codigos.csv) y deja una fila en la bitácora «carga».
Se puede repetir sin duplicar: si una hora ya existe, se actualiza.

Uso:
    python tools/construir_datos.py
    python db/cargar_a_postgres.py --dsn "postgresql://usuario:clave@localhost:5432/svca"
    (o defina la variable de entorno SVCA_DSN)
"""
from __future__ import annotations

import argparse
import hashlib
import io
import os
import sys
from pathlib import Path

import pandas as pd
import psycopg

RAIZ = Path(__file__).resolve().parent.parent
COLS = ['pm25', 'pm10', 'temperatura', 'humedad', 'viento', 'direccion']


def huella(ruta: Path) -> str:
    h = hashlib.sha256()
    with ruta.open('rb') as f:
        for bloque in iter(lambda: f.read(1 << 20), b''):
            h.update(bloque)
    return h.hexdigest()[:16]


def cargar(dsn: str, datos: Path, crudos: Path) -> dict:
    csv = datos / 'historico.csv'
    if not csv.exists():
        raise SystemExit(f'No existe {csv}. Ejecute primero: python tools/construir_datos.py')
    W = pd.read_csv(csv, sep=';', dtype={'estacion': str})
    W['fecha'] = pd.to_datetime(W['fecha'])
    aud_ruta = datos / 'auditoria_codigos.csv'
    A = pd.read_csv(aud_ruta, sep=';', encoding='utf-8-sig') if aud_ruta.exists() else pd.DataFrame()

    archivos = sorted(p for p in crudos.rglob('*') if p.suffix.lower() in ('.csv', '.xlsx')) if crudos.exists() else []
    detalle = '; '.join(f'{p.name}#{huella(p)}' for p in archivos)

    with psycopg.connect(dsn) as con:
        con.execute((Path(__file__).parent / 'esquema.sql').read_text(encoding='utf-8'))
        with con.cursor() as cur:
            cur.execute('CREATE TEMP TABLE _carga (fecha timestamp, estacion text, pm25 numeric, pm10 numeric, '
                        'temperatura numeric, humedad numeric, viento numeric, direccion numeric) ON COMMIT DROP')
            buf = io.StringIO()
            W.assign(fecha=W.fecha.dt.strftime('%Y-%m-%d %H:%M'))[['fecha', 'estacion'] + COLS].to_csv(
                buf, index=False, header=False, na_rep='\\N', sep='\t')
            with cur.copy('COPY _carga FROM STDIN WITH (FORMAT text)') as cp:
                cp.write(buf.getvalue())
            cur.execute("INSERT INTO estacion (nombre) SELECT DISTINCT estacion FROM _carga ON CONFLICT (nombre) DO NOTHING")
            cur.execute("""
                INSERT INTO medicion_horaria (estacion_id, hora_cierre, pm25, pm10, temperatura, humedad, viento, direccion)
                SELECT e.id, c.fecha, c.pm25, c.pm10, c.temperatura, c.humedad, c.viento, c.direccion
                FROM _carga c JOIN estacion e ON e.nombre = c.estacion
                ON CONFLICT (estacion_id, hora_cierre) DO UPDATE SET
                    pm25 = EXCLUDED.pm25, pm10 = EXCLUDED.pm10, temperatura = EXCLUDED.temperatura,
                    humedad = EXCLUDED.humedad, viento = EXCLUDED.viento, direccion = EXCLUDED.direccion""")
            cur.execute('TRUNCATE auditoria_codigo RESTART IDENTITY')
            if len(A):
                buf = io.StringIO()
                A[['archivo', 'estacion', 'variable', 'codigo', 'inicio', 'fin', 'registros']].to_csv(
                    buf, index=False, header=False, na_rep='\\N', sep='\t')
                with cur.copy('COPY auditoria_codigo (archivo, estacion, variable, codigo, inicio, fin, registros) '
                              'FROM STDIN WITH (FORMAT text)') as cp:
                    cp.write(buf.getvalue())
            cur.execute('INSERT INTO carga (archivos, filas, desde, hasta) VALUES (%s, %s, %s, %s)',
                        (detalle, len(W), W.fecha.min().to_pydatetime(), W.fecha.max().to_pydatetime()))
            cur.execute('SELECT count(*) FROM medicion_horaria')
            total = cur.fetchone()[0]
    return {'filas_cargadas': len(W), 'filas_en_base': total, 'desde': W.fecha.min(), 'hasta': W.fecha.max(),
            'auditoria': len(A)}


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description='Carga la base validada a PostgreSQL.')
    ap.add_argument('--dsn', default=os.environ.get('SVCA_DSN'), help='cadena de conexión (o variable SVCA_DSN)')
    ap.add_argument('--datos', default=str(RAIZ / 'datos'))
    ap.add_argument('--crudos', default=str(RAIZ / 'datos' / 'crudos'))
    a = ap.parse_args(argv)
    if not a.dsn:
        ap.error('Falta la conexión: use --dsn o defina SVCA_DSN')
    r = cargar(a.dsn, Path(a.datos), Path(a.crudos))
    print(f"Cargadas {r['filas_cargadas']} horas-estación ({r['desde']} a {r['hasta']}). "
          f"Total en la base: {r['filas_en_base']}. Registros de auditoría: {r['auditoria']}.")
    return 0


if __name__ == '__main__':
    sys.exit(main())

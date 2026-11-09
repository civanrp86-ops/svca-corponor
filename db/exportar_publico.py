#!/usr/bin/env python3
"""Exporta desde PostgreSQL los archivos que lee el sitio público (datos/historico.js y datos/historico.csv).

Uso:
    python db/exportar_publico.py --dsn "postgresql://usuario:clave@localhost:5432/svca" [--salida datos]
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import pandas as pd
import psycopg

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / 'tools'))
from construir_datos import COLUMNAS, csv_texto, js_texto  # noqa: E402


def exportar(dsn: str, salida: Path) -> int:
    with psycopg.connect(dsn) as con:
        filas = con.execute("""
            SELECT m.hora_cierre AS fecha, e.nombre AS estacion, m.pm25, m.pm10, m.temperatura, m.humedad,
                   m.viento, m.direccion
            FROM medicion_horaria m JOIN estacion e ON e.id = m.estacion_id""").fetchall()
    W = pd.DataFrame(filas, columns=COLUMNAS)
    for c in COLUMNAS[2:]:
        W[c] = pd.to_numeric(W[c]).astype(float)
    W['fecha'] = pd.to_datetime(W['fecha'])
    W = W.sort_values(['estacion', 'fecha']).reset_index(drop=True)
    salida.mkdir(parents=True, exist_ok=True)
    csv = csv_texto(W)
    (salida / 'historico.csv').write_text(csv, encoding='utf-8')
    (salida / 'historico.js').write_text(js_texto(csv, len(W)), encoding='utf-8')
    return len(W)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description='Exporta la base de PostgreSQL al formato del sitio público.')
    ap.add_argument('--dsn', default=os.environ.get('SVCA_DSN'))
    ap.add_argument('--salida', default=str(RAIZ / 'datos'))
    a = ap.parse_args(argv)
    if not a.dsn:
        ap.error('Falta la conexión: use --dsn o defina SVCA_DSN')
    n = exportar(a.dsn, Path(a.salida))
    print(f'Exportadas {n} horas-estación a {a.salida}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

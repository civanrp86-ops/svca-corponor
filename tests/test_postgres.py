"""Contrasta las vistas de PostgreSQL (db/esquema.sql) con el cálculo de Python.

Se omite si no hay base de pruebas. Para correrla:
    set SVCA_TEST_DSN=postgresql://usuario:clave@localhost:5432/svca_prueba   (Windows)
    export SVCA_TEST_DSN=...                                                  (Linux/Mac)
"""
import os
import sys
from pathlib import Path

import pandas as pd
import pytest

psycopg = pytest.importorskip('psycopg')
DSN = os.environ.get('SVCA_TEST_DSN')
pytestmark = pytest.mark.skipif(not DSN, reason='defina SVCA_TEST_DSN para probar PostgreSQL')

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / 'tools'))
sys.path.insert(0, str(RAIZ / 'db'))
from construir_datos import ica  # noqa: E402
import cargar_a_postgres  # noqa: E402


@pytest.fixture(scope='module')
def base():
    datos = RAIZ / 'datos'
    if not (datos / 'historico.csv').exists():
        pytest.skip('falta datos/historico.csv (ejecute tools/construir_datos.py)')
    cargar_a_postgres.cargar(DSN, datos, datos / 'crudos')
    W = pd.read_csv(datos / 'historico.csv', sep=';', parse_dates=['fecha'])
    return W


def test_funcion_ica_coincide_con_python():
    with psycopg.connect(DSN) as con:
        for c in [0, 5, 12, 12.4, 13, 25.55, 37, 37.5, 38, 55, 55.9, 56, 100, 150, 150.5, 151, 250, 251, 400, 500, 600]:
            sql = con.execute('SELECT ica_pm25(%s::numeric)', (c,)).fetchone()[0]
            assert sql == ica(float(c)), c
        assert con.execute('SELECT ica_pm25(NULL)').fetchone()[0] is None


def test_ica_diario_coincide_con_python(base):
    W = base.copy()
    W['dia'] = (W.fecha - pd.Timedelta(minutes=1)).dt.normalize()
    g = W.groupby(['estacion', 'dia']).pm25.agg(['mean', 'count']).reset_index()
    ultima = W.fecha.max()
    g = g[(g['count'] >= 18) & (ultima >= g.dia + pd.Timedelta(days=1))]
    esp = {(r.estacion, r.dia.date()): ica(r['mean']) for _, r in g.iterrows()}
    with psycopg.connect(DSN) as con:
        got = {(e, d): i for e, d, i in con.execute('SELECT estacion, dia, ica FROM v_ica_diario')}
    assert got == esp
    assert len(esp) > 500


def test_media_movil_24h_coincide_con_python(base):
    with psycopg.connect(DSN) as con:
        sql = pd.DataFrame(con.execute(
            "SELECT e.nombre, m.hora_cierre, m.mm24 FROM v_pm25_mm24 m JOIN estacion e ON e.id=m.estacion_id "
            "WHERE e.nombre = 'Comuneros' AND m.hora_cierre >= '2026-09-01'").fetchall(), columns=['est', 'fecha', 'mm24'])
    s = base[base.estacion == 'Comuneros'].set_index('fecha').pm25
    s = s.reindex(pd.date_range(s.index.min(), s.index.max(), freq='h'))
    mm = s.rolling(24, min_periods=18).mean()
    sql['mm24'] = sql.mm24.astype(float)
    sql = sql.set_index('fecha').mm24
    comun = sql.index.intersection(mm.index)
    a, b = sql.loc[comun], mm.loc[comun]
    assert ((a.isna() == b.isna()).all()) and ((a.dropna() - b.dropna()).abs() < 1e-6).all()

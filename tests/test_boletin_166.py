"""Contraste con el Boletín N° 166 de CORPONOR (16 de octubre de 2026): ICA diario de octubre de 2026.

El ICA diario es el ICA del promedio de 24 horas de un día cerrado (horas de cierre 01:00 a 24:00, mínimo 18 datos).
Se excluye El Salado el 2 de octubre: el boletín no incluye una hora con un pico de 34,4 µg/m³ que el validador descartó.
"""
from pathlib import Path

import pandas as pd
import pytest

from construir_datos import ica

RAIZ = Path(__file__).resolve().parents[1]
OFICIAL = {
    'El Salado': {1: 47, 3: 40, 4: 47, 5: 49, 6: 47, 7: 41, 8: 25, 9: 49, 10: 57, 11: 58, 12: 46, 13: 71, 14: 82, 15: 28},
    'Comuneros': {1: 45, 2: 21, 3: 38, 4: 46, 5: 58, 6: 50, 7: 31, 8: 21, 9: 44, 10: 44, 11: 54, 12: 37, 13: 60, 14: 66, 15: 28},
    'Centro': {1: 31, 2: 14, 3: 25, 4: 36},
}


@pytest.fixture(scope='module')
def base():
    ruta = RAIZ / 'datos' / 'historico.csv'
    if not ruta.exists():
        pytest.skip('datos/historico.csv no existe')
    return pd.read_csv(ruta, sep=';', parse_dates=['fecha'])


def ica_diario(base, estacion, dia):
    s = base[base.estacion == estacion].set_index('fecha').pm25
    ini = pd.Timestamp(2026, 10, dia) + pd.Timedelta(hours=1)
    ventana = s[ini: ini + pd.Timedelta(hours=23)].dropna()
    return ica(ventana.mean()) if len(ventana) >= 18 else None


def casos():
    return [(e, d, v) for e, dias in OFICIAL.items() for d, v in dias.items()]


@pytest.mark.parametrize('estacion,dia,oficial', casos())
def test_ica_diario_coincide_con_boletin(base, estacion, dia, oficial):
    esperado = ica_diario(base, estacion, dia)
    # Se tolera ±1 punto: el boletín usa datos ya validados por una persona.
    assert esperado is not None and abs(esperado - oficial) <= 1

"""Pruebas de la regla del ICA (Resolución 2254 de 2017, Tabla 6; regla de truncamiento del boletín oficial)."""
import pytest

from construir_datos import ica


@pytest.mark.parametrize('c,esperado', [
    (0, 0), (12, 50), (12.6, 50), (13, 51), (20, 65), (37, 100), (37.9, 100), (38, 101), (55, 150),
    (56, 151), (150, 200), (151, 201), (250, 300), (251, 301), (500, 500), (7.6, 31), (11.04, 46),
])
def test_ica_regla_oficial(c, esperado):
    assert ica(c) == esperado


def test_ica_sin_dato():
    assert ica(None) is None
    assert ica(float('nan')) is None


def test_ica_tope_500():
    assert ica(900) == 500

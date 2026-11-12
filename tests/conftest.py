import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))

import pytest


@pytest.fixture(autouse=True)
def _sin_resumen_de_github(monkeypatch):
    """Las pruebas llaman a construir_datos.main() con datos de ejemplo. Sin esto, en GitHub Actions
    esos informes de prueba se agregarían al resumen del flujo y se confundirían con el informe real."""
    monkeypatch.delenv('GITHUB_STEP_SUMMARY', raising=False)

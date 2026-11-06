"""Pruebas del constructor de datos con un reporte sintético que imita el formato del servidor."""
import base64
import gzip
import re

import pandas as pd

import construir_datos as cd

ENC = [
    'Multiestaci?n: Periodica:01/01/2026 00:00-01/01/2026 03:00  Tipo:AVG 10 Mins.,,,', ',,,',
    'Fecha & Hora,Barrio Comuneros,Barrio Comuneros,Barrio Comuneros',
    ',PM10,PM2.5,WD', ',ug/m3,ug/m3,Deg',
]


def reporte(ruta, num=None):
    filas = []
    horas = [
        # (PM10, PM2.5, WD) por registro de 10 minutos
        [('20', '10', '350'), ('20', '10', '10'), ('20', '10', '350'), ('20', '10', '10'), ('20', '10', '350'), ('9999999', '10', '10')],
        [('30', '12', '5'), ('30', '12', '5'), ('30', '12', '5'), ('30', '12', '5'), ('30', 'NoData', '5'), ('30', 'NoData', '5')],
        [('-5', '14', '90'), ('40', '14', '90'), ('40', '14', '90'), ('40', '14', '90'), ('40', '14', '90'), ('40', '<Samp', '90')],
    ]
    for h, regs in enumerate(horas):
        for k, (a, b, c) in enumerate(regs):
            minutos = h * 60 + (k + 1) * 10
            filas.append(f'01/01/2026 {minutos // 60:02d}:{minutos % 60:02d},{a},{b},{c}')
    num = num or '18,15,18'
    return ruta.write_text('\n'.join(ENC + filas + [f'Num,{num}']), encoding='latin1')


def test_agrupa_a_horas_y_aplica_regla_75(tmp_path):
    reporte(tmp_path / 'r.csv')
    res = cd.construir(cd.listar_reportes(tmp_path))
    W = res['W'].set_index('fecha')
    assert len(W) == 2                                    # la hora con 4 de 6 datos de PM2.5 no es válida
    h1, h3 = W.loc[pd.Timestamp('2026-01-01 01:00')], W.loc[pd.Timestamp('2026-01-01 03:00')]
    assert h1.pm25 == 10 and h1.pm10 == 20                # 9999999 excluido, quedan 5 de 6 datos
    assert h3.pm25 == 14 and h3.pm10 == 40                # -5 (imposible) y <Samp excluidos
    assert pd.Timestamp('2026-01-01 02:00') not in W.index


def test_direccion_del_viento_es_promedio_circular(tmp_path):
    reporte(tmp_path / 'r.csv')
    W = cd.construir(cd.listar_reportes(tmp_path))['W'].set_index('fecha')
    d = W.loc[pd.Timestamp('2026-01-01 01:00')].direccion
    assert min(d, 360 - d) < 1                            # 350° y 10° promedian 0° (no 180°)


def test_auditoria_de_codigos(tmp_path):
    reporte(tmp_path / 'r.csv')
    A = cd.construir(cd.listar_reportes(tmp_path))['auditoria']
    t = A.groupby('codigo').registros.sum().to_dict()
    assert t == {'NoData': 2, '<Samp': 1, '9999999': 1, 'Imposible': 1}


def test_contraste_con_fila_num(tmp_path):
    reporte(tmp_path / 'ok.csv')
    f = cd.construir(cd.listar_reportes(tmp_path))['archivos'][0]
    assert f['num_ok'] == 3 and f['num_total'] == 3 and not f['num_mal']


def test_estricto_falla_si_num_no_coincide(tmp_path, capsys):
    reporte(tmp_path / 'mal.csv', num='18,99,18')
    entrada, salida = tmp_path / 'in', tmp_path / 'out'
    entrada.mkdir()
    (tmp_path / 'mal.csv').rename(entrada / 'mal.csv')
    assert cd.main(['--entrada', str(entrada), '--salida', str(salida), '--estricto']) == 1


def test_salidas_y_ciclo_completo(tmp_path):
    entrada, salida = tmp_path / 'in', tmp_path / 'out'
    entrada.mkdir()
    reporte(entrada / 'r.csv')
    assert cd.main(['--entrada', str(entrada), '--salida', str(salida)]) == 0
    for nombre in ('historico.js', 'historico.csv', 'auditoria_codigos.csv', 'informe_validacion.md'):
        assert (salida / nombre).exists()
    js = (salida / 'historico.js').read_text(encoding='utf-8')
    csv = gzip.decompress(base64.b64decode(re.search(r'HISTORICO_GZ="([^"]+)"', js).group(1))).decode('utf-8')
    assert csv == (salida / 'historico.csv').read_text(encoding='utf-8')
    assert csv.splitlines()[0] == 'fecha;estacion;pm25;pm10;temperatura;humedad;viento;direccion'


def test_solo_validar_no_toca_la_base(tmp_path):
    entrada, salida = tmp_path / 'in', tmp_path / 'out'
    entrada.mkdir()
    reporte(entrada / 'r.csv')
    cd.main(['--entrada', str(entrada), '--salida', str(salida), '--solo-validar'])
    assert (salida / 'informe_validacion.md').exists() and not (salida / 'historico.js').exists()

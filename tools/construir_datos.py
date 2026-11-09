#!/usr/bin/env python3
"""Construye la base de datos del tablero SVCA CORPONOR a partir de los reportes crudos del servidor.

Uso:
    python tools/construir_datos.py                      # lee datos/crudos y escribe en datos/
    python tools/construir_datos.py --solo-validar       # solo genera el informe de validación (no toca la base)
    python tools/construir_datos.py --entrada otra/carpeta --salida salida/

Entrada : reportes multiestación (.csv o .xlsx), promedio de 10 minutos o de 1 hora, uno o varios años.
          Se aplican por fecha de fin del periodo; si dos reportes traen la misma hora, el que termina más tarde completa o corrige al
          anterior. NoData o vacíos nunca borran datos ya cargados.
Salida  : datos/historico.js            base que lee el tablero (CSV comprimido en gzip + base64)
          datos/historico.csv           la misma base en texto, para consulta y descarga
          datos/auditoria_codigos.csv   tramos con NoData, <Samp, 9999999, valores imposibles o texto
          datos/informe_validacion.md   informe para quien valida los datos antes de publicarlos

Reglas de cálculo (las mismas que usa el tablero; ver docs/REGLAS_DE_CALCULO.md):
  * Cada fila lleva la hora de cierre del intervalo (24:00 = 00:00 del día siguiente).
  * Promedio horario válido con al menos el 75 % de los registros (10 min: 5 de 6; 1 h: 1 de 1).
  * Dirección del viento: promedio vectorial (circular).
  * Se descartan NoData, <Samp, 9999999 y valores físicamente imposibles. No se corrige ningún otro valor.
"""
from __future__ import annotations

import argparse
import base64
import gzip
import io
import math
import os
import re
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

NOMBRE = {'barrio centro': 'Centro', 'barrio comuneros': 'Comuneros', 'barrio el salado': 'El Salado',
          'punto blanco': 'Punto Blanco', 'unidad movil': 'Unidad Móvil', 'unidad móvil': 'Unidad Móvil'}
VAR = {'PM2.5': 'pm25', 'PM10': 'pm10', 'TEMP': 'temperatura', 'RH': 'humedad', 'WS': 'viento',
       'WD': 'direccion', 'WDIR': 'direccion'}
AUDITADAS_SIN_USO = {'PB'}            # se auditan (códigos de error) pero no se usan en el tablero
# Fila de datos: «dd/mm/aaaa hh:mm» (el día puede traer un solo dígito; «24:00.» con punto final también vale) o un número de serie de Excel
# de 5 cifras, que es como Excel guarda las marcas de las 00:00 cuando se abre y se vuelve a guardar un reporte.
FECHA = re.compile(r'^\s*"?(\d{1,2}/\d{1,2}/\d{4} \d{1,2}:\d{2}|[4-5]\d{4}(\.\d+)?\s*"?$)')
LIM = {'pm25': (0, None), 'pm10': (0, None), 'humedad': (0, 100), 'viento': (0, 60),
       'direccion': (0, 360), 'temperatura': (-10, 60)}
SENTINELA = 9999990
COLUMNAS = ['fecha', 'estacion', 'pm25', 'pm10', 'temperatura', 'humedad', 'viento', 'direccion']

# Tabla 6 de la Resolución 2254 de 2017 para PM2.5 de 24 horas: (PM_bajo, PM_alto, ICA_bajo, ICA_alto)
BP = [(0, 12, 0, 50), (13, 37, 51, 100), (38, 55, 101, 150), (56, 150, 151, 200), (151, 250, 201, 300), (251, 500, 301, 500)]


def ica(c: float | None) -> int | None:
    """ICA del PM2.5 con la regla del boletín oficial de CORPONOR: interpolación lineal en el tramo
    donde cae la concentración SIN redondearla, y resultado truncado al entero."""
    if c is None or (isinstance(c, float) and math.isnan(c)):
        return None
    lo, hi, il, ih = next((b for b in BP if c <= b[1]), BP[-1])
    return min(500, int(math.floor((ih - il) / (hi - lo) * (c - lo) + il + 1e-9)))


# --------------------------------------------------------------------------------------------- lectura
def leer_crudo(ruta: Path) -> pd.DataFrame:
    if str(ruta).lower().endswith(('.xlsx', '.xlsm')):
        return pd.read_excel(ruta, header=None, dtype=object)
    with open(ruta, encoding='latin1') as f:
        primera = f.readline()
    sep = ';' if primera.count(';') > primera.count(',') else ','
    return pd.read_csv(ruta, header=None, dtype=str, encoding='latin1', sep=sep, keep_default_na=False, na_values=[''])


def paso_minutos(titulo: str) -> int:
    m = re.search(r'AVG\s+(\d+)\s*(Min|Hr)', titulo, re.I)
    if not m:
        return 60
    return int(m.group(1)) * (60 if m.group(2).lower().startswith('h') else 1)


def _marcas_tiempo(d: pd.DataFrame) -> pd.Series:
    """Hora de cierre de cada fila. Acepta «dd/mm/aaaa hh:mm» (día de 1 o 2 dígitos, 24:00 incluido) y números de serie de Excel."""
    f = d[0].astype(str).str.strip().str.strip('"')
    serie = f.str.match(r'^\d{5}(\.\d+)?$')
    t = pd.Series(pd.NaT, index=f.index, dtype='datetime64[ns]')
    if serie.any():
        t[serie] = pd.Timestamp('1899-12-30') + pd.to_timedelta((f[serie].astype(float) * 1440).round(), unit='m')
    txt = ~serie
    if txt.any():
        x = f[txt].str.extract(r'^(\d{1,2})/(\d{1,2})/(\d{4})\s+(\d{1,2}):(\d{2})').astype(int)
        base = pd.to_datetime(pd.DataFrame({'year': x[2], 'month': x[1], 'day': x[0]}))
        t[txt] = base + pd.to_timedelta(x[3], unit='h') + pd.to_timedelta(x[4], unit='m')
    return t


def parsear(ruta: Path) -> dict:
    """Lee un reporte y devuelve valores válidos (formato largo), tramos de códigos especiales y verificaciones."""
    raw = leer_crudo(ruta)
    titulo = str(raw.iloc[0, 0])
    paso = paso_minutos(titulo)
    est, var = raw.iloc[2].ffill(), raw.iloc[3]
    d = raw[raw[0].astype(str).str.match(FECHA)]
    if d.empty:
        raise ValueError(f'{ruta.name}: no se encontraron filas de datos con fecha dd/mm/aaaa hh:mm')
    tt = _marcas_tiempo(d)
    fila_num = raw[raw[0].astype(str).str.strip() == 'Num']
    largas, aud, rechazados, num_mal, num_ok, num_tot = [], [], Counter(), [], 0, 0
    codigos = Counter()
    for c in range(1, raw.shape[1]):
        e = NOMBRE.get(str(est[c]).strip().lower())
        vn = str(var[c]).strip().upper()
        v = VAR.get(vn)
        if not e or not (v or vn in AUDITADAS_SIN_USO):
            continue
        sx = d[c].astype(str).str.strip()
        x = pd.to_numeric(sx.str.replace(',', '.'), errors='coerce')
        cod = pd.Series('', index=sx.index, dtype=object)
        vacio = sx.isna() | sx.isin(['', 'nan'])  # pandas 3 conserva los vacíos como nulos; antes eran el texto «nan»
        cod[vacio] = 'Vacío'
        cod[x.isna() & ~vacio] = 'Texto'
        cod[sx.str.match(r'(?i)^no\s*data$')] = 'NoData'
        cod[sx.str.match(r'(?i)^<\s*samp')] = '<Samp'
        cod[x >= SENTINELA] = '9999999'
        if v:
            lo, hi = LIM[v]
            fuera = (x < SENTINELA) & ((x < lo) | ((x > hi) if hi is not None else False))
            cod[fuera] = 'Imposible'
            rechazados[(e, v)] += int(fuera.sum())
            ok = cod == ''
            largas.append(pd.DataFrame({'fecha': tt[ok].values, 'estacion': e, 'v': v, 'x': x[ok].values}))
            if len(fila_num):  # contraste con la fila «Num» del propio reporte
                try:
                    num_tot += 1
                    if int(float(str(fila_num.iloc[0, c]).replace(',', '.'))) == int(x.notna().sum()):
                        num_ok += 1
                    else:
                        num_mal.append(f"{e} {vn}: reporte {fila_num.iloc[0, c]} · leídos {int(x.notna().sum())}")
                except ValueError:
                    num_tot -= 1
        g = (cod != cod.shift()).cumsum()
        k = pd.DataFrame({'g': g.values, 'cod': cod.values, 't': tt.values})
        k = k[k.cod != ''].groupby('g').agg(codigo=('cod', 'first'), inicio=('t', 'min'), fin=('t', 'max'), registros=('t', 'size'))
        if len(k):
            k.insert(0, 'variable', vn)
            k.insert(0, 'estacion', e)
            aud.append(k)
            for code, n in k.groupby('codigo').registros.sum().items():
                codigos[code] += int(n)
    return {
        'archivo': ruta.name, 'paso': paso, 'titulo': titulo, 'desde': tt.min(), 'hasta': tt.max(), 'registros': len(d),
        'largas': pd.concat(largas) if largas else pd.DataFrame(columns=['fecha', 'estacion', 'v', 'x']),
        'auditoria': pd.concat(aud) if aud else pd.DataFrame(columns=['estacion', 'variable', 'codigo', 'inicio', 'fin', 'registros']),
        'num_ok': num_ok, 'num_total': num_tot, 'num_mal': num_mal, 'tiene_num': bool(len(fila_num)),
        'rechazados': {f'{k[0]} {k[1]}': n for k, n in rechazados.items() if n}, 'codigos': dict(codigos),
    }


def horario(largas: pd.DataFrame, paso: int) -> pd.DataFrame:
    """Agrupa a promedios horarios con la hora de cierre. Válido con >= 75 % de los registros del intervalo."""
    per = max(1, round(60 / paso)) if paso < 60 else 1
    need = int(math.ceil(.75 * per))
    L = largas.dropna(subset=['x']).copy()
    if L.empty:
        return L.rename(columns={'fecha': 'hora'}).assign(hora=pd.NaT)[['hora', 'estacion', 'v', 'x']]
    L['hora'] = pd.to_datetime(L.fecha).dt.ceil('h')
    N = L[L.v != 'direccion'].groupby(['hora', 'estacion', 'v']).x.agg(['mean', 'count']).reset_index()
    N = N[N['count'] >= need].rename(columns={'mean': 'x'})[['hora', 'estacion', 'v', 'x']]
    D = L[L.v == 'direccion'].copy()
    r = np.deg2rad(D.x.astype(float))
    D['s'], D['c'] = np.sin(r), np.cos(r)
    G = D.groupby(['hora', 'estacion']).agg(s=('s', 'mean'), c=('c', 'mean'), n=('x', 'count')).reset_index()
    G = G[G.n >= need]
    G['x'] = (np.rad2deg(np.arctan2(G.s, G.c)) + 360) % 360
    G['v'] = 'direccion'
    return pd.concat([N, G[['hora', 'estacion', 'v', 'x']]], ignore_index=True)


PERIODO = re.compile(r'(\d{1,2}/\d{1,2}/\d{4} \d{1,2}:\d{2})\s*-\s*(\d{1,2}/\d{1,2}/\d{4} \d{1,2}:\d{2})')


def periodo(ruta: Path) -> tuple[datetime, datetime]:
    """Inicio y fin del periodo que declara el título del reporte («Periodica:01/01/2026 00:00-26/10/2026 00:00»).
    Si no se puede leer, devuelve fechas mínimas (el archivo se procesa primero)."""
    try:
        if ruta.suffix.lower() in ('.xlsx', '.xlsm'):
            titulo = str(pd.read_excel(ruta, header=None, nrows=1, dtype=object).iloc[0, 0])
        else:
            with open(ruta, encoding='latin1') as f:
                titulo = f.readline()
        m = PERIODO.search(titulo)
        a, b = (pd.to_datetime(x.split()[0], format='%d/%m/%Y') + pd.to_timedelta(int(x.split()[1].split(':')[0]), unit='h') for x in m.groups())
        return a.to_pydatetime(), b.to_pydatetime()
    except Exception:
        return datetime.min, datetime.min


def listar_reportes(entrada: Path) -> list[Path]:
    """Reportes en el orden en que se aplican: el que termina más tarde va después y, si trae las mismas horas,
    completa o corrige a los anteriores. Así un reporte diario (2026-11-08.csv) corrige al anual (2026.csv) aunque
    alfabéticamente vaya antes. Las horas que un reporte trae como NoData nunca borran datos válidos ya cargados."""
    if entrada.is_file():
        return [entrada]
    rutas = [p for p in entrada.rglob('*') if p.suffix.lower() in ('.csv', '.xlsx', '.xlsm') and not p.name.startswith('.')]
    return sorted(rutas, key=lambda p: (periodo(p)[1], periodo(p)[0], str(p)))


def construir(rutas: list[Path]) -> dict:
    if not rutas:
        raise FileNotFoundError('No hay reportes (.csv o .xlsx) en la carpeta de entrada.')
    resumen, partes, auds = [], [], []
    for r in rutas:
        p = parsear(r)
        partes.append(horario(p.pop('largas'), p['paso']))
        a = p.pop('auditoria')
        if len(a):
            a = a.copy()
            a.insert(0, 'archivo', r.name)
            auds.append(a)
        resumen.append(p)
    H = pd.concat(partes, ignore_index=True)
    W = H.pivot_table(index=['hora', 'estacion'], columns='v', values='x', aggfunc='last').reset_index().rename(columns={'hora': 'fecha'})
    for v in ('pm25', 'pm10', 'temperatura', 'humedad', 'viento', 'direccion'):
        if v not in W:
            W[v] = np.nan
    W = W[W[['pm25', 'temperatura', 'humedad', 'viento']].notna().any(axis=1)].sort_values(['estacion', 'fecha']).reset_index(drop=True)
    A = pd.concat(auds, ignore_index=True) if auds else pd.DataFrame(columns=['archivo', 'estacion', 'variable', 'codigo', 'inicio', 'fin', 'registros'])
    return {'W': W[COLUMNAS], 'auditoria': A, 'archivos': resumen}


# --------------------------------------------------------------------------------------------- salidas
def csv_texto(W: pd.DataFrame) -> str:
    X = W.copy()
    X['fecha'] = pd.to_datetime(X.fecha).dt.strftime('%Y-%m-%d %H:%M')
    # lineterminator fijo: en Windows pandas usaría \r\n y la base quedaría distinta según el sistema
    return X.to_csv(sep=';', index=False, float_format='%.2f', na_rep='', lineterminator='\n')


def js_texto(csv: str, n_filas: int, ahora: datetime | None = None) -> str:
    ahora = ahora or datetime.now(timezone.utc)
    z = base64.b64encode(gzip.compress(csv.encode('utf-8'), 9)).decode()
    return (f"/* Base consolidada SVCA CORPONOR · generada {ahora:%Y-%m-%d %H:%M} UTC · {n_filas} horas-estación. "
            f"No editar a mano: se reconstruye con tools/construir_datos.py */\n"
            f"window.HISTORICO_TS={int(ahora.timestamp() * 1000)};\nwindow.HISTORICO_GZ=\"{z}\";\n")


def miles(n: int) -> str:
    return f'{int(n):,}'.replace(',', '.')


def informe_markdown(res: dict) -> str:
    W, A, F = res['W'], res['auditoria'], res['archivos']
    ahora = datetime.now(timezone.utc)
    L = [f"# Informe de validación de datos", '',
         f"Generado el {ahora:%Y-%m-%d %H:%M} UTC · {miles(len(W))} horas-estación · {W.fecha.min():%d/%m/%Y} a {W.fecha.max():%d/%m/%Y}", '',
         '> Este informe lo revisa una persona **antes** de publicar. No se corrige ni se elimina ningún valor automáticamente (salvo códigos de error y valores físicamente imposibles).', '',
         '## Archivos procesados', '', '| Archivo | Promedio | Periodo | Registros | Conteo vs. fila «Num» | Códigos especiales (registros) |', '|---|---|---|---|---|---|']
    for f in F:
        num = ('sin fila «Num»' if not f['tiene_num'] else (f"✔ {f['num_ok']}/{f['num_total']}" if not f['num_mal'] else f"⚠ {len(f['num_mal'])} columnas no coinciden"))
        cods = ' · '.join(f'{k} {miles(v)}' for k, v in sorted(f['codigos'].items())) or 'ninguno'
        L.append(f"| {f['archivo']} | {f['paso']} min | {f['desde']:%d/%m/%Y} a {f['hasta']:%d/%m/%Y} | {miles(f['registros'])} | {num} | {cods} |")
        for m in f['num_mal'][:6]:
            L.append(f"|  | ⚠ | | | {m} | |")
        if f['rechazados']:
            L.append(f"|  | | | | **Valores imposibles excluidos:** {', '.join(f'{k} {n}' for k, n in f['rechazados'].items())} | |")
    # disponibilidad por estación y año
    s = W.set_index('fecha')
    fin = W.fecha.max()
    L += ['', '## Disponibilidad de PM2.5 por estación y año', '', '| Estación | Año | Horas válidas | Horas del periodo | % | Días con ICA | Mayor vacío (h) |', '|---|---|---|---|---|---|---|']
    avisos_gap, pegadas, picos, casi_cero = [], [], [], []
    for e, g in W.groupby('estacion'):
        pm = g.dropna(subset=['pm25'])
        h = ((pm.fecha - pd.Timestamp('1970-01-01')) // pd.Timedelta(hours=1)).to_numpy()
        v = pm.pm25.to_numpy()
        # vacíos y series pegadas
        if len(h) > 1:
            dif = np.diff(h)
            for i in np.where(dif > 72)[0]:
                avisos_gap.append((e, pm.fecha.iloc[i], pm.fecha.iloc[i + 1], int(dif[i] - 1)))
            run = 1
            for i in range(1, len(h)):
                if h[i] == h[i - 1] + 1 and v[i] == v[i - 1]:
                    run += 1
                else:
                    if run >= 12:
                        pegadas.append((e, pm.fecha.iloc[i - run], run, v[i - 1]))
                    run = 1
            if run >= 12:
                pegadas.append((e, pm.fecha.iloc[len(h) - run], run, v[-1]))
            # PM2.5 casi nulo de forma persistente (≤ 0,1 µg/m³): típico de un equipo con falla, no de aire limpio
            run, ini = 0, 0
            for i in range(len(h)):
                if v[i] <= 0.1 and (run == 0 or h[i] == h[i - 1] + 1):
                    if run == 0:
                        ini = i
                    run += 1
                else:
                    if run >= 12:
                        casi_cero.append((e, pm.fecha.iloc[ini], run, float(v[ini:ini + run].max())))
                    run, ini = (1, i) if v[i] <= 0.1 else (0, 0)
            if run >= 12:
                casi_cero.append((e, pm.fecha.iloc[ini], run, float(v[ini:ini + run].max())))
        # picos aislados
        d = dict(zip(h.tolist(), v.tolist()))
        for hh, val in d.items():
            if val < 25:
                continue
            nb = sorted(d[hh + k] for k in (-3, -2, -1, 1, 2, 3) if hh + k in d)
            if len(nb) >= 4 and val >= 3.5 * nb[len(nb) // 2]:
                picos.append((e, pd.Timestamp('1970-01-01') + pd.Timedelta(hours=int(hh)), val, nb[len(nb) // 2]))
        # días con ICA (día cerrado con >= 18 horas)
        dia = (pm.fecha - pd.Timedelta(hours=1)).dt.floor('D')
        cuenta = pm.groupby(dia).pm25.agg(['count', 'mean'])
        cerrados = cuenta[(cuenta['count'] >= 18) & ((cuenta.index + pd.Timedelta(days=1)) <= fin)]
        for anio in sorted(pm.fecha.dt.year.unique()):
            ini = pd.Timestamp(anio, 1, 1, 1)
            hasta = min(pd.Timestamp(anio + 1, 1, 1), fin)
            total = int((hasta - ini) / pd.Timedelta(hours=1)) + 1
            validas = int(((pm.fecha >= ini) & (pm.fecha <= hasta)).sum())
            dias = int((cerrados.index.year == anio).sum())
            mg = max([x[3] for x in avisos_gap if x[0] == e and x[1].year == anio] or [0])
            L.append(f"| {e} | {anio} | {validas} | {total} | {validas / total * 100:.1f} | {dias} | {mg} |")
    L += ['', '## Vacíos de PM2.5 de más de 72 horas', '']
    L += (['| Estación | Último dato antes | Primer dato después | Horas sin dato |', '|---|---|---|---|'] +
          [f"| {e} | {a:%d/%m/%Y %H:%M} | {b:%d/%m/%Y %H:%M} | {n} |" for e, a, b, n in sorted(avisos_gap, key=lambda x: -x[3])[:15]]) if avisos_gap else ['Ninguno.']
    L += ['', '## Series pegadas (12 horas seguidas o más con exactamente el mismo valor de PM2.5)', '']
    L += (['| Estación | Desde | Horas | Valor (µg/m³) |', '|---|---|---|---|'] +
          [f"| {e} | {a:%d/%m/%Y %H:%M} | {n} | {val:.2f} |" for e, a, n, val in sorted(pegadas, key=lambda x: -x[2])[:15]]) if pegadas else ['Ninguna.']
    L += ['', '## PM2.5 casi nulo de forma persistente (0,1 µg/m³ o menos durante 12 horas o más)', '',
          '_En Cúcuta un valor así de bajo y sostenido suele indicar una falla del equipo. Se publica tal cual hasta que quien valida decida qué hacer._', '']
    L += (['| Estación | Desde | Horas | Máximo en el tramo (µg/m³) |', '|---|---|---|---|'] +
          [f"| {e} | {a:%d/%m/%Y %H:%M} | {n} | {mx:.2f} |" for e, a, n, mx in sorted(casi_cero, key=lambda x: -x[2])[:15]]) if casi_cero else ['Ninguno.']
    L += ['', '## Picos horarios aislados para revisar', '', '_PM2.5 ≥ 25 µg/m³ y ≥ 3,5 veces la mediana de las horas vecinas. Pueden ser reales (quema, tráfico) o fallas del equipo; decide quien valida._', '']
    L += (['| Estación | Hora (cierre) | PM2.5 (µg/m³) | Mediana vecina |', '|---|---|---|---|'] +
          [f"| {e} | {t:%d/%m/%Y %H:%M} | {val:.1f} | {md:.1f} |" for e, t, val, md in sorted(picos, key=lambda x: -x[2] / x[3])[:20]]
          + ([f'', f'Total de picos detectados: {len(picos)}.'] if len(picos) > 20 else [])) if picos else ['Ninguno.']
    if len(A):
        L += ['', '## Códigos especiales por estación y variable (registros)', '', '| Estación | Variable | NoData | <Samp | 9999999 | Imposible | Texto |', '|---|---|---|---|---|---|---|']
        T = A.pivot_table(index=['estacion', 'variable'], columns='codigo', values='registros', aggfunc='sum', fill_value=0)
        for (e, vn), r in T.iterrows():
            L.append(f"| {e} | {vn} | {int(r.get('NoData', 0))} | {int(r.get('<Samp', 0))} | {int(r.get('9999999', 0))} | {int(r.get('Imposible', 0))} | {int(r.get('Texto', 0))} |")
        L += ['', '_NoData: el equipo no reportó · <Samp: muestras insuficientes en el intervalo · 9999999: código de error. Ninguno entra al cálculo. El detalle por tramos está en `datos/auditoria_codigos.csv`._']
    return '\n'.join(L).replace('<Samp', '&lt;Samp') + '\n'


def escribir(res: dict, salida: Path, solo_validar: bool = False) -> None:
    salida.mkdir(parents=True, exist_ok=True)
    (salida / 'informe_validacion.md').write_text(informe_markdown(res), encoding='utf-8')
    if solo_validar:
        return
    csv = csv_texto(res['W'])
    (salida / 'historico.csv').write_text(csv, encoding='utf-8', newline='')
    (salida / 'historico.js').write_text(js_texto(csv, len(res['W'])), encoding='utf-8', newline='')
    A = res['auditoria'].copy()
    for c in ('inicio', 'fin'):
        A[c] = pd.to_datetime(A[c]).dt.strftime('%Y-%m-%d %H:%M')
    A.to_csv(salida / 'auditoria_codigos.csv', sep=';', index=False, encoding='utf-8-sig')


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description='Construye la base de datos del tablero SVCA CORPONOR.')
    ap.add_argument('--entrada', default='datos/crudos', help='carpeta (o archivo) con los reportes crudos')
    ap.add_argument('--salida', default='datos', help='carpeta donde se escriben los resultados')
    ap.add_argument('--solo-validar', action='store_true', help='genera solo el informe de validación')
    ap.add_argument('--estricto', action='store_true', help='falla si el conteo de datos no coincide con la fila «Num» de algún reporte')
    a = ap.parse_args(argv)
    rutas = listar_reportes(Path(a.entrada))
    print(f'{len(rutas)} reporte(s):', ', '.join(p.name for p in rutas))
    res = construir(rutas)
    escribir(res, Path(a.salida), a.solo_validar)
    for f in res['archivos']:
        print(f"  {f['archivo']}: promedio {f['paso']} min, {f['registros']} registros, «Num» {f['num_ok']}/{f['num_total']}")
    W = res['W']
    print(f"Base: {len(W)} horas-estación, {W.fecha.min():%Y-%m-%d} a {W.fecha.max():%Y-%m-%d}")
    resumen = os.environ.get('GITHUB_STEP_SUMMARY')
    if resumen:
        with open(resumen, 'a', encoding='utf-8') as fh:
            fh.write((Path(a.salida) / 'informe_validacion.md').read_text(encoding='utf-8'))
    if a.estricto and any(f['num_mal'] for f in res['archivos']):
        print('ERROR: el conteo de datos no coincide con la fila «Num» en algún reporte (ver informe_validacion.md).', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())

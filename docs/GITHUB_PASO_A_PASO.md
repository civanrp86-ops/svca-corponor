# Publicar el tablero en GitHub, paso a paso

Los nombres de los menús están en inglés, como los muestra GitHub por defecto (entre paréntesis, qué significan).

## 0. Qué necesita

* Una cuenta de GitHub. Para algo institucional conviene una **organización** de CORPONOR (gratuita) y no una cuenta personal:
  así el proyecto no depende de una sola persona. Se crea en `+` → `New organization`.
* Repositorio **público**. En cuentas gratuitas, GitHub Pages solo publica repositorios públicos; para uno privado se necesita un plan de pago
  (verifique las condiciones vigentes en la documentación de GitHub). Los datos son públicos por su naturaleza.
* Opcional: instalar [Git](https://git-scm.com/) si prefiere la línea de comandos. No es obligatorio: todo se puede hacer desde la web.

## 1. Crear el repositorio

1. `+` → `New repository`.
2. Nombre sugerido: `svca-corponor`. Visibilidad: `Public`. No marque «Add a README» (ya viene uno).
3. `Create repository`.

## 2. Subir el contenido de esta carpeta

**Desde la web** (sin instalar nada):

1. En el repositorio vacío, pulse `uploading an existing file`.
2. Arrastre **el contenido** de la carpeta (no la carpeta misma). Si la web no acepta la carpeta oculta `.github`, súbala aparte:
   `Add file` → `Upload files` y arrastre la carpeta `.github` completa.
3. En «Commit changes» escriba «Versión inicial» y pulse `Commit changes`.

Límites: cada archivo subido desde la web puede pesar hasta 25 MB (desde Git, hasta 100 MB). Los reportes de 10 minutos de un año pesan
cerca de 10 MB, así que caben.

**Desde la línea de comandos:**

```bash
cd svca-corponor
git init -b main
git add .
git commit -m "Versión inicial"
git remote add origin https://github.com/ORGANIZACION/svca-corponor.git
git push -u origin main
```

## 3. Activar GitHub Pages

1. `Settings` (configuración) → `Pages`.
2. En `Build and deployment` → `Source`, elija **`GitHub Actions`**.
3. Vaya a la pestaña `Actions`. Verá la ejecución «Construir datos y publicar». Cuando termine en verde (unos 2 a 4 minutos),
   la dirección del tablero aparece en `Settings` → `Pages`: `https://ORGANIZACION.github.io/svca-corponor/`.

Si la ejecución falla, abra el paso en rojo: el mensaje indica si fue una prueba o un reporte cuyo conteo no coincide con la fila «Num».
Mientras no termine en verde, **no se publica nada** y el sitio anterior sigue en línea.

## 4. Proteger la rama principal (revisión obligatoria)

Esto hace que nadie pueda publicar datos sin que otra persona los revise.

1. `Settings` → `Rules` → `Rulesets` → `New ruleset` → `New branch ruleset`.
2. Nombre: «Proteger main». `Enforcement status`: `Active`. En `Target branches` elija `Add target` → `Include default branch`.
3. Active:
   * `Require a pull request before merging` con **1** aprobación requerida (y, si quiere, `Require review from Code Owners`).
   * `Require status checks to pass` y agregue la verificación `validar` (aparece después de la primera solicitud de cambios).
   * `Block force pushes`.
4. `Create`.

(En cuentas o repositorios que muestran el menú antiguo: `Settings` → `Branches` → `Add branch protection rule` con las mismas opciones.)

## 5. Personas y permisos

`Settings` → `Collaborators and teams` → `Add people` (en una organización: `Teams`).

| Rol en GitHub | Para quién | Qué puede hacer |
|---|---|---|
| `Write` | Quien elabora (sube los reportes) | Crear solicitudes de cambios con datos nuevos |
| `Write` (distinta persona) | Quien revisa | Aprobar y unir (merge) los cambios |
| `Admin` | Responsable técnico (1 o 2 personas) | Cambiar configuración, reglas y permisos |
| `Read` | Consulta | Ver el repositorio |

Active la **verificación en dos pasos** en todas las cuentas (`Settings` → `Password and authentication`).

Para exigir que revise una persona concreta, edite `.github/CODEOWNERS` con su usuario.

## 6. Fotos de las estaciones y posición en el mapa

1. Suba las fotos a la carpeta `fotos/` (JPG de unos 1280 px de ancho y menos de 400 KB).
2. Edite `assets/config.js` (ícono del lápiz en GitHub) y quite el `//` de las líneas de `FOTOS_ESTACIONES` con los nombres reales.
3. La posición de cada estación se ajusta como administrador arrastrándola sobre el mapa (se recuerda en ese navegador). Para dejarla fija
   para todos, copie las coordenadas a `ESTACIONES_GEO` en `assets/config.js`.

## 7. Dominio propio e incrustación en la página de CORPONOR

* **Incrustar** el tablero dentro de una página de CORPONOR con un iframe:

  ```html
  <iframe src="https://ORGANIZACION.github.io/svca-corponor/" title="Calidad del aire - CORPONOR"
          style="width:100%;height:2600px;border:0" loading="lazy"></iframe>
  ```
* **Dominio propio** (por ejemplo `calidadaire.corponor.gov.co`): `Settings` → `Pages` → `Custom domain`. El área de tecnología de CORPONOR debe crear
  un registro DNS `CNAME` hacia `ORGANIZACION.github.io` y activar `Enforce HTTPS`.

## 8. Antes de la mesa técnica

* [ ] Repositorio público creado y Pages activo con ejecución en verde.
* [ ] Regla de protección de `main` activa y al menos dos personas con rol `Write`.
* [ ] Fotos de las estaciones cargadas.
* [ ] Cambiar `ADMIN_CLAVE` en `assets/config.js` (solo oculta el panel; ver [Seguridad y límites](SEGURIDAD_Y_LIMITES.md)).
* [ ] Texto de licencia y condiciones de uso aprobado por jurídica.

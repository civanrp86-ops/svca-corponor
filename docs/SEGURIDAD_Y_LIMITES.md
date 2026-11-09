# Seguridad y límites

## La clave del panel de administración no es seguridad real
El sitio es estático: no tiene servidor. La clave de `assets/config.js` (`ADMIN_CLAVE`) viaja en el código que descarga cualquier visitante,
así que solo sirve para **ocultar** el panel a la ciudadanía, no para protegerlo.
* No ponga allí una clave que use en otros sistemas.
* Lo que se haga en el panel (cargar datos, validar, descargar) queda **solo en el navegador de quien lo hace**; no cambia lo que ven los demás.
* La publicación real de datos solo ocurre por GitHub: solicitud de cambios, revisión obligatoria y flujo automático.

## Firmas de quien elaboró y quien revisó
* **Hoy**: el informe en PDF puede llevar nombre y cargo escritos. Eso **no es una firma verificable**.
* **Firma con usuario y clave real** exige un servidor (o un servicio de identidad) que autentique a la persona. No es posible con un sitio estático.
* **Alternativas viables**: (a) la aprobación en GitHub queda registrada con usuario, fecha y hora, y sirve como trazabilidad de la revisión;
  (b) firma digital o certificado institucional sobre el PDF final, con la herramienta que ya use CORPONOR.
* Pendiente de definir con CORPONOR: lista de personas (nombre, cargo, rol) y si se incluirán firmas escaneadas.

## Datos públicos y privacidad
Los datos son ambientales y públicos. No se almacenan datos personales de visitantes. Las fotos de estaciones no deben incluir personas identificables.

## Cuentas de GitHub
Active la verificación en dos pasos, use una organización de CORPONOR (no una cuenta personal) y mantenga al menos dos personas con permiso de escritura.

## Licencia
Pendiente de definir con la oficina jurídica de CORPONOR. Mientras tanto no se incluye archivo `LICENSE`.

## Alcance de los datos
Los valores son datos de monitoreo del SVCA procesados con las reglas de `docs/REGLAS_DE_CALCULO.md`. La ubicación de las estaciones en el mapa es aproximada.

## Antes de que la dirección autorice la publicación
Un repositorio público no se puede esconder: cualquiera que tenga el enlace lo ve. Mientras no haya autorización:
* No comparta el enlace fuera del equipo y úselo solo con quienes participan en la revisión.
* `index.html` incluye la etiqueta `<meta name="robots" content="noindex, nofollow">`, que pide a los buscadores no mostrar el sitio. Es una cortesía, no una barrera.
  **Al autorizarse la publicación, bórrela** (está marcada con un comentario «PRE-PUBLICACIÓN»).
* Si se necesita que nadie lo vea, el repositorio debe pasar a privado (`Settings` → `General` → `Danger Zone` → `Change visibility`). En una cuenta gratuita eso
  desactiva GitHub Pages; en un plan de pago se puede publicar desde un repositorio privado (verifique las condiciones vigentes en la documentación de GitHub).
  Para las demostraciones se puede usar la copia local del proyecto, que funciona sin conexión.

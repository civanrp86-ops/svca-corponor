/* Configuración editable del tablero SVCA CORPONOR.
   Este archivo se carga antes de app.js. Edítelo y suba el cambio al repositorio. */

// Clave del panel de administración. IMPORTANTE: solo oculta el panel en el navegador; no es seguridad real
// (cualquiera puede leer este archivo). La seguridad real se logra con permisos del repositorio (ver docs/GITHUB_PASO_A_PASO.md).
const ADMIN_CLAVE='cambiar-clave'; // Cambiar. Solo oculta el panel; no es seguridad real.

// Estaciones, en el orden en que se muestran.
const ST0=["Centro","Comuneros","El Salado","Punto Blanco","Unidad Móvil"];

// Ubicación de cada estación fija: [latitud, longitud] en grados decimales (WGS84; latitud Norte, longitud Oeste = negativa).
// Fuente: tablero de coordenadas del SVCA (foto del 09/11/2026). La de Comuneros tiene 4 decimales (~10 m) porque un reflejo
// tapaba las últimas cifras: confírmela con el GPS. Para afinar cualquiera: en el panel de administración arrastre la estación
// en el mapa, copie el texto que aparece y péguelo aquí.
const ESTACIONES_GEO={
  'Centro':        [7.8859178, -72.5020355],
  'Comuneros':     [7.9087,    -72.5211],
  'El Salado':     [7.9334922, -72.4965756],
  'Punto Blanco':  [7.9834602, -72.5035375]
};

// Vista inicial del mapa (se ajusta a las estaciones fijas). Cúcuta aproximado: [7.8939, -72.5078].
const MAPA_CENTRO=[7.8939,-72.5078], MAPA_ZOOM=12;

// Unidad Móvil: una fila por cada sitio donde ha estado, de la más antigua a la más reciente. Se usa la última cuya fecha ('desde')
// sea anterior o igual al dato que se muestra. Puede estar en cualquier municipio de Norte de Santander.
//   desde: 'AAAA-MM-DD' · lugar: nombre del sitio · municipio · coord: [lat, lng] · foto: ruta en fotos/ (opcional)
const UBICACIONES_MOVIL=[
  {desde:'2026-11-09', lugar:'Sitio por confirmar', municipio:'Pamplona', coord:[7.373323,-72.643921], foto:''},
  // Cuando se traslade, agregue una fila nueva debajo (no borre las anteriores). Ejemplo:
  // {desde:'2026-12-01', lugar:'Parque principal', municipio:'Ocaña', coord:[8.2371,-73.3560], foto:'fotos/movil-ocana.jpg'},
];

// Fotos de las estaciones (se muestran al hacer clic en la estación del mapa). Guarde las imágenes en la carpeta fotos/
// (JPG, de preferencia de unos 1280 px de ancho y menos de 400 KB) y declare aquí su ruta. Si una estación no tiene foto,
// se muestra un aviso de "foto pendiente".
const FOTOS_ESTACIONES={
  // 'Centro': 'fotos/centro.jpg',
  // 'Comuneros': 'fotos/comuneros.jpg',
  // 'El Salado': 'fotos/el-salado.jpg',
  // 'Punto Blanco': 'fotos/punto-blanco.jpg',
  // 'Unidad Móvil': 'fotos/unidad-movil.jpg',
};

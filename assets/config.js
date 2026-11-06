/* Configuración editable del tablero SVCA CORPONOR.
   Este archivo se carga antes de app.js. Edítelo y suba el cambio al repositorio. */

// Clave del panel de administración. IMPORTANTE: solo oculta el panel en el navegador; no es seguridad real
// (cualquiera puede leer este archivo). La seguridad real se logra con permisos del repositorio (ver docs/GITHUB_PASO_A_PASO.md).
const ADMIN_CLAVE='cambiar-clave'; // Cambiar. Solo oculta el panel; no es seguridad real.

// Estaciones, en el orden en que se muestran.
const ST0=["Centro","Comuneros","El Salado","Punto Blanco","Unidad Móvil"];

// Posición de cada estación sobre el mapa, como fracción (x, y) de la imagen. Un administrador puede arrastrarlas en el mapa;
// para dejarlas fijas para todos, copie aquí los valores finales (ver docs/ACTUALIZAR_DATOS.md).
const POS_INICIAL={'Centro':[.50,.66],'Comuneros':[.60,.48],'El Salado':[.30,.52],'Punto Blanco':[.42,.80],'Unidad Móvil':[.70,.30]};

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

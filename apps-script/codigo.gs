/**
 * Control de Servicios NAFIN — Google Apps Script
 * Proxy seguro entre el browser y Google Drive.
 *
 * Despliegue: Implementar → Nueva implementación
 *   Tipo: Aplicación web
 *   Ejecutar como: Yo
 *   Acceso: Cualquier persona
 *
 * Propiedades requeridas (Proyecto → Propiedades del script):
 *   CLAVE_SECRETA   — misma que NEXT_PUBLIC_APPS_SCRIPT_CLAVE en .env.local
 *   CARPETA_RAIZ_ID — id de la carpeta Drive donde viven los expedientes
 */

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var claveSecreta = PropertiesService.getScriptProperties().getProperty('CLAVE_SECRETA');

    if (!params.clave || params.clave !== claveSecreta) {
      return respuesta({ error: 'No autorizado' }, 403);
    }

    switch (params.accion) {
      case 'crearCarpeta':
        return respuesta(crearCarpeta(params));
      case 'subirArchivo':
        return respuesta(subirArchivo(params));
      case 'eliminarArchivo':
        return respuesta(eliminarArchivo(params));
      case 'eliminarCarpeta':
        return respuesta(eliminarCarpeta(params));
      default:
        return respuesta({ error: 'Acción desconocida: ' + params.accion }, 400);
    }
  } catch (err) {
    return respuesta({ error: 'Error interno: ' + err.message }, 500);
  }
}

function crearCarpeta(params) {
  if (!params.nombreCarpeta) throw new Error('nombreCarpeta es requerido');

  var carpetaRaizId = PropertiesService.getScriptProperties().getProperty('CARPETA_RAIZ_ID');
  var carpetaRaiz = DriveApp.getFolderById(carpetaRaizId);

  var iterador = carpetaRaiz.getFoldersByName(params.nombreCarpeta);
  var carpeta = iterador.hasNext()
    ? iterador.next()
    : carpetaRaiz.createFolder(params.nombreCarpeta);

  var subcarpetas = params.subcarpetas || [];
  for (var i = 0; i < subcarpetas.length; i++) {
    var subIter = carpeta.getFoldersByName(subcarpetas[i]);
    if (!subIter.hasNext()) carpeta.createFolder(subcarpetas[i]);
  }

  return { carpetaId: carpeta.getId(), url: carpeta.getUrl() };
}

function subirArchivo(params) {
  if (!params.carpetaId || !params.nombreArchivo || !params.contenidoB64 || !params.mimeType) {
    throw new Error('Faltan parámetros: carpetaId, nombreArchivo, contenidoB64, mimeType');
  }

  var carpeta = DriveApp.getFolderById(params.carpetaId);

  if (params.subcarpeta) {
    var subIter = carpeta.getFoldersByName(params.subcarpeta);
    carpeta = subIter.hasNext() ? subIter.next() : carpeta.createFolder(params.subcarpeta);
  }

  var bytes = Utilities.base64Decode(params.contenidoB64);
  var blob = Utilities.newBlob(bytes, params.mimeType, params.nombreArchivo);

  // elimina versión anterior si existe
  var existentes = carpeta.getFilesByName(params.nombreArchivo);
  while (existentes.hasNext()) existentes.next().setTrashed(true);

  var archivo = carpeta.createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    fileId: archivo.getId(),
    url: 'https://drive.google.com/file/d/' + archivo.getId() + '/view',
    nombre: archivo.getName(),
  };
}

function eliminarArchivo(params) {
  if (!params.fileId) throw new Error('fileId es requerido');
  DriveApp.getFileById(params.fileId).setTrashed(true);
  return { ok: true };
}

function eliminarCarpeta(params) {
  if (!params.carpetaId) throw new Error('carpetaId es requerido');
  DriveApp.getFolderById(params.carpetaId).setTrashed(true);
  return { ok: true };
}

function respuesta(data, codigo) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  void codigo;
  return output;
}

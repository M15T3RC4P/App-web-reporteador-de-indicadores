const SHEET_ID  = '1HusZlqL5OcmP8Oy_JjiVNinxNehrDZxf6wBuASEz5Lo';
const SHEET_NAME = 'BD_Oculta';
const DATA_RANGE = 'A2:Y';

// ─── 1. Punto de entrada de la Web App ───────────────────────────────────────
/**
 * doGet: sirve el archivo index.html como PLANTILLA de la Web App.
 * Usa createTemplateFromFile() (en vez de createHtmlOutputFromFile) para
 * que el motor de GAS procese las etiquetas <?!= include('...') ?> y
 * pueda inyectar estilos y scripts desde archivos separados.
 */
function doGet(e) {
  return HtmlService
    .createTemplateFromFile('index')
    .evaluate()
    .setTitle('Anexo Indicadores Contractuales — EPS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// ─── 2. Helper para incluir archivos HTML externos ────────────────────────────
/**
 * include: permite inyectar el contenido de otro archivo .html del proyecto
 * dentro de una plantilla GAS mediante la sintaxis <?!= include('nombre') ?>.
 *
 * Uso en index.html:
 *   <?!= include('styles') ?>   → inyecta <style>...</style>
 *   <?!= include('scripts') ?>  → inyecta <script>...</script>
 *
 * @param {string} filename - Nombre del archivo sin .html
 * @returns {string} Contenido HTML del archivo
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ─── 3. Lectura y transformación de la base de datos ─────────────────────────
/**
 * getAllData: lee la hoja BD_Oculta y transforma cada fila en un objeto
 * con campos nominados. Esta función es llamada desde el frontend via
 * google.script.run y retorna un array de objetos JSON-serializable.
 *
 * Optimización: se usa getValues() una sola vez (una única llamada I/O)
 * y el filtrado se realiza en el cliente para máxima responsividad.
 *
 * @returns {Object} { records: Array<Object>, filterOptions: Object }
 */
function getAllData() {
  try {
    const ss     = SpreadsheetApp.openById(SHEET_ID);
    const sheet  = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(`No se encontró la hoja "${SHEET_NAME}".`);
    }

    const rawData = sheet.getRange(DATA_RANGE).getValues();

    // Conjuntos para las opciones únicas de cada filtro (Sets → Arrays)
    const sets = {
      codigo:         new Set(),
      nombre:         new Set(),
      clasificacion:  new Set(),
      aplicaA:        new Set(),
      grupoRiesgo:    new Set()
    };

    // Mapeo de filas a objetos; se omiten filas completamente vacías
    const records = rawData
      .filter(row => row[0] !== '' && row[0] !== null && row[0] !== undefined)
      .map(row => {
        const obj = mapRowToObject_(row);
        // Poblar conjuntos de opciones únicas (solo valores no vacíos)
        if (obj.codigo)        sets.codigo.add(obj.codigo);
        if (obj.nombre)        sets.nombre.add(obj.nombre);
        if (obj.clasificacion) sets.clasificacion.add(obj.clasificacion);
        if (obj.aplicaA)       sets.aplicaA.add(obj.aplicaA);
        if (obj.grupoRiesgo)   sets.grupoRiesgo.add(obj.grupoRiesgo);
        return obj;
      });

    // Convertir Sets a Arrays ordenados para los multiselects
    const filterOptions = {
      codigo:        [...sets.codigo].sort(),
      nombre:        [...sets.nombre].sort(),
      clasificacion: [...sets.clasificacion].sort(),
      aplicaA:       [...sets.aplicaA].sort(),
      grupoRiesgo:   [...sets.grupoRiesgo].sort()
    };

    return { success: true, records, filterOptions };

  } catch (err) {
    // Retornar el error al cliente para manejo gracioso en el frontend
    return { success: false, error: err.message };
  }
}

// ─── 4. Helpers privados ──────────────────────────────────────────────────────
/**
 * mapRowToObject_: convierte una fila (array) en un objeto con nombres
 * descriptivos y genera los campos compuestos para el PDF.
 *
 * @param {Array} row - Fila cruda de getValues()
 * @returns {Object} Objeto con todos los campos del indicador
 */
function mapRowToObject_(row) {
  const numero      = String(row[0]  || '').trim();
  const proceso     = String(row[1]  || '').trim();
  const codigo      = String(row[2]  || '').trim();
  const version     = String(row[3]  || '').trim();
  const clasificacion = String(row[4] || '').trim();
  const aplicaA     = String(row[5]  || '').trim();
  const grupoRiesgo = String(row[6]  || '').trim();
  const nombre      = String(row[7]  || '').trim();
  const area        = String(row[8]  || '').trim();
  const esNormativo   = String(row[9]  || '').trim();
  const cual          = String(row[10]  || '').trim();
  const formulaNumerador   = String(row[11] || '').trim();
  const formulaDenominador = String(row[12] || '').trim();
  const formulaDatoUnico = String(row[13] || '').trim();
  const factor      = String(row[14] || '').trim();
  const tendencia   = String(row[15] || '').trim();
  const meta        = String(row[16] || '').trim();
  const unidad      = String(row[17] || '').trim();
  const periodicidad = String(row[18] || '').trim();
  const fuenteNumerador     = String(row[19] || '').trim();
  const fuenteDenominador     = String(row[20] || '').trim();
  const responsableEntrega = String(row[21] || '').trim();
  const responsableCalculo = String(row[22] || '').trim();
  const consideraciones = String(row[23] || '').trim();

  // ── Campos compuestos para el Anexo PDF ──────────────────────────────────
  // Fórmula unificada: combina numerador y denominador con separador visual
  const formulaUnificada = buildFormula_(formulaNumerador, formulaDenominador);

  // Meta unificada: combina meta, unidad y periodicidad
  const metaUnificada = [tendencia, meta, unidad]
    .filter(Boolean)
    .join(' | ');

  return {
    numero, proceso, codigo, version, clasificacion, aplicaA,
    grupoRiesgo, nombre, area, esNormativo, cual, formulaNumerador,
    formulaDenominador, formulaDatoUnico, factor, tendencia, meta, unidad, periodicidad,
    fuenteNumerador, fuenteDenominador, responsableEntrega, responsableCalculo, consideraciones,
    // Campos compuestos (usados en el PDF)
    formulaUnificada,
    metaUnificada
  };
}

/**
 * buildFormula_: construye la fórmula unificada para el PDF.
 * Si existen ambos términos, se presentan como fracción textual.
 *
 * @param {string} num - Texto del numerador
 * @param {string} den - Texto del denominador
 * @returns {string}
 */
function buildFormula_(num, den) {
  if (num && den) return `Numerador: ${num}\n \nDenominador: ${den}`;
  if (num)        return `Numerador: ${num}`;
  if (den)        return `Denominador: ${den}`;
  return '';
}
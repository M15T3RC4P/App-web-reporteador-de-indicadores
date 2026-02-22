# Documentación Técnica y Guía de Uso: Web App de Indicadores Contractuales (MIC)

## 1. Objetivo de la Aplicación
El objetivo principal de la aplicación es **automatizar y estandarizar la generación del "Anexo de Indicadores Contractuales"** (Formato GAS-GCR-F-63) para la EPS. La herramienta permite a los usuarios consultar rápidamente una base de datos centralizada de indicadores contractuales, filtrar los pertinentes para un contratista específico y exportar un documento PDF con formato institucional, listo para la firma y formalización del contrato.

## 2. Alcance
- **Fuente de Datos:** La app lee en tiempo real la información de una hoja de cálculo principal en Google Sheets (`BD_Oculta`), garantizando que los indicadores estén siempre actualizados en base a la última normativa (ej. Res 3280, res 5261, etc.).
- **Procesamiento:** Los datos se procesan en el navegador del usuario para asegurar alta velocidad en el filtrado (SPA - *Single Page Application*).
- **Salida / Output:** Un documento PDF perfectamente paginado con formato oficial (encabezados repetitivos, pie de página del sistema de gestión de calidad, y un bloque final automático con los datos del prestador y línea de firma).

## 3. ¿Qué contiene la App? (Arquitectura Básica)
Para un colaborador que apenas conoce la aplicación, es importante saber que está construida sobre **Google Apps Script (GAS)** y dividida en 4 archivos principales siguiendo buenas prácticas de separación de código:

1. **`Code.gs` (Backend):** Es el servidor. Se encarga de conectarse a Google Sheets por su ID, leer la hoja `BD_Oculta`, limpiar los datos (omitiendo filas vacías), extraer las opciones únicas para los filtros, y enviarle todo "empaquetado" de forma optimizada al frontend.
2. **`index.html` (Estructura/Plantilla):** Contiene el esqueleto visual de la aplicación. Aquí se encuentra el header (logo y título), los bloques para capturar datos y filtros, la tabla principal en pantalla, y un bloque especial oculto (`#print-section`) que solo se usa para estructurar el documento cuando se va a imprimir.
3. **`scripts.html` (Lógica Frontend - JavaScript):** Es el "cerebro" visual. Captura la información enviada por el backend, construye las listas desplegables (multiselects), aplica la lógica de filtrado dinámico cuando el usuario busca algo, maneja la paginación (de 25 en 25) e inserta los datos en la tabla de impresión.
4. **`styles.html` (Diseño - CSS):** Contiene las variables de colores institucionales de la EPS (Teal, Rojo, grises), el diseño estilo "app moderna" con bordes redondeados y sombras suaves, y lo más importante: **las reglas `@media print`**. Estas reglas dictan cómo debe verse la página *únicamente* cuando se exporte a PDF (ocultando colores de fondo innecesarios, botones, y forzando saltos de página).

---

## 4. Modos de Uso y Funcionalidad de Filtros
La App permite buscar indicadores basados en 5 criterios. Es crucial entender cómo operan:

- **Código, Nombre y Clasificación:** Filtros directos.
- **Aplica a (Comportamiento ESTRICTO - Acumulativo):** Funciona como un "Y" lógico. Si se selecciona "COMPLEJIDAD - ALTA" y "AMBITO - HOSPITALARIO", el indicador resultante **debe tener ambos valores** en su registro en la base de datos para aparecer en pantalla. 
- **Grupo de Riesgo (Comportamiento INCLUSIVO):** Funciona como un "O" lógico. Si se selecciona "MATERNO PERINATAL" y "CANCER", mostrará indicadores que pertenezcan a **cualquiera** de esos dos grupos.

---

## 5. El Paso a Paso para obtener el Exporte en PDF
Para el usuario operativo que necesita generar el anexo, este es el flujo de trabajo:

1. **Abrir la Web App:** Al ingresar al enlace, aparecerá una pantalla de carga ("Conectando con Google Sheets…"). Esperar a que desaparezca.
2. **Diligenciar los Datos del Prestador:**
   - Escribir el *Nombre del Prestador*, *NIT* y *Sede*.
   - *Nota:* Esta información **solo** aparecerá en la última hoja del PDF generado.
3. **Seleccionar Criterios de Búsqueda:**
   - Abrir los menús desplegables (filtros) y seleccionar las casillas de los parámetros requeridos por el contrato.
   - Hacer clic en el botón azul **"Buscar"**.
4. **Verificar los Resultados:**
   - La tabla mostrará la lista filtrada de indicadores. Puedes usar la paginación al final de la tabla para revisar que todo esté correcto.
5. **Generar el PDF:**
   - Hacer clic en el botón rojo superior derecho **"Imprimir Anexo"**.
6. **Configurar el cuadro de diálogo del navegador (Paso Crítico para PDF perfecto):**
   - **Destino:** Seleccionar *"Guardar como PDF"*.
   - **Diseño / Orientación:** Seleccionar *"Horizontal / Apaisado"*.
   - **Márgenes:** Por defecto.
   - **Configuraciones adicionales (Más opciones):** 
     - ❌ **Desmarcar** *"Encabezados y pies de página"* (Para evitar que salga la fecha, URL y número de página genérico del navegador en los bordes).
     - ✅ **Marcar** *"Gráficos de fondo"* (Para que el color de los encabezados de la tabla se vea correctamente en el PDF).
7. **Guardar:** Hacer clic en "Guardar", elegir la carpeta de destino en el PC y listo.
8. **Post-Impresión:** Al cerrar el cuadro de impresión, la pantalla mostrará un aviso preguntando si deseas *"Continuar"* (limpiando todos los datos para uno nuevo) o *"Editar selección"* (manteniendo tus filtros actuales por si te equivocaste en algo).

---

## 6. Consideraciones para obtener un Buen Resultado (Para Colaboradores)

- **Calidad de la Base de Datos:** La app refleja fielmente lo que está en Google Sheets (`BD_Oculta`). Si un indicador tiene errores ortográficos, espacios en blanco extra al final del texto o celdas mezcladas en Sheets, el PDF saldrá con esos defectos. Mantengan la base de datos limpia.
- **Botón "Limpiar Filtros":** Si la búsqueda no arroja indicadores ("No hay indicadores con los criterios establecidos"), suele ser porque los filtros de *Aplica a* (al ser muy estrictos) dejaron la lista vacía. Usa "Limpiar filtros" e intenta una combinación más amplia.
- **Rendimiento:** Aunque la app carga cientos de miles de datos rápido, si en Google Sheets se añaden miles de filas completamente en blanco, esto puede ralentizar la carga inicial. (El archivo `Code.gs` ya tiene un filtro para ignorar filas donde el "No." está vacío, pero es buena práctica no tener pestañas infinitas sin datos).
- **El Footer del PDF:** El pie de página ("Elaborado por: ...") está anclado fijamente gracias al CSS (`position: fixed`). Si por algún motivo el contenido choca con este footer en el PDF, ajusten los márgenes desde el navegador y alerten a soporte para aumentar el relleno inferior (`margin-bottom` en `@page`) dentro de `styles.html`. 
- **Mantenimiento en un solo lugar:** Si cambia el Representante de Calidad o si el Formato pasa a la "Versión 03", los cambios estructurales del PDF se realizan modificando el HTML/CSS (`index.html` tabla `print-table`), no requiere reconstruir la base de datos.

/**
 * Configuración de PostCSS para el proyecto Angular.
 *
 * Angular's application builder (esbuild) detecta automáticamente
 * este archivo y aplica los plugins a todos los archivos CSS.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

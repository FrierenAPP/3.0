const { procesarColores } = require('./colores.js');

// Caracteres del spinner (puntos giratorios como npm)
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Función para mostrar spinner con tiempo limitado
function mostrarSpinner(texto, duracion = 2000) {
    return new Promise((resolve) => {
        let frameIndex = 0;
        
        const interval = setInterval(() => {
            // Limpiar línea actual y volver al inicio
            process.stdout.write('\r');
            
            // Reemplazar [carga] con el frame actual del spinner
            const textoConSpinner = texto.replace('[carga]', spinnerFrames[frameIndex]);
            
            // Mostrar texto con colores (sin salto de línea)
            process.stdout.write(procesarColores(textoConSpinner));
            
            // Siguiente frame
            frameIndex = (frameIndex + 1) % spinnerFrames.length;
        }, 80); // Cambiar frame cada 80ms
        
        // Detener spinner después de la duración
        setTimeout(() => {
            clearInterval(interval);
            
            // Mostrar texto final con salto de línea
            process.stdout.write('\r');
            const textoFinal = texto.replace('[carga]', spinnerFrames[0]);
            console.log(procesarColores(textoFinal));
            
            resolve();
        }, duracion);
    });
}

module.exports = {
    mostrarSpinner
};
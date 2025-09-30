const { procesarColores } = require('./colores.js');

// Caracteres del spinner (puntos giratorios como npm)
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// Función para mostrar spinner con tiempo limitado
function mostrarSpinner(texto, duracion = 2000) {
    return new Promise((resolve) => {
        let frameIndex = 0;
        
        const interval = setInterval(() => {
            // Limpiar línea actual
            process.stdout.write('\r\x1b[K');
            
            // Reemplazar [carga] con el frame actual del spinner
            const textoConSpinner = texto.replace('[carga]', spinnerFrames[frameIndex]);
            
            // Mostrar texto con colores
            process.stdout.write(procesarColores(textoConSpinner));
            
            // Siguiente frame
            frameIndex = (frameIndex + 1) % spinnerFrames.length;
        }, 100); // Cambiar frame cada 100ms
        
        // Detener spinner después de la duración
        setTimeout(() => {
            clearInterval(interval);
            // Limpiar línea y mostrar texto final
            process.stdout.write('\r\x1b[K');
            const textoFinal = texto.replace('[carga]', '⠋');
            console.log(procesarColores(textoFinal));
            resolve();
        }, duracion);
    });
}

module.exports = {
    mostrarSpinner
};
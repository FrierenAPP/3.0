// Códigos de color ANSI
const colores = {
    reset: '\x1b[0m',
    
    // Colores de texto
    negro: '\x1b[30m',
    rojo: '\x1b[31m',
    verde: '\x1b[32m',
    amarillo: '\x1b[33m',
    azul: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    blanco: '\x1b[37m',
    
    // Colores brillantes
    gris: '\x1b[90m',
    rojo_brillante: '\x1b[91m',
    verde_brillante: '\x1b[92m',
    amarillo_brillante: '\x1b[93m',
    azul_brillante: '\x1b[94m',
    magenta_brillante: '\x1b[95m',
    cyan_brillante: '\x1b[96m',
    
    // Estilos
    negrita: '\x1b[1m',
    subrayado: '\x1b[4m',
    parpadeo: '\x1b[5m'
};

// Función para procesar texto con etiquetas [color]
function procesarColores(texto) {
    return texto
        .replace(/\[negro\]/g, colores.negro)
        .replace(/\[rojo\]/g, colores.rojo)
        .replace(/\[verde\]/g, colores.verde)
        .replace(/\[amarillo\]/g, colores.amarillo)
        .replace(/\[azul\]/g, colores.azul)
        .replace(/\[magenta\]/g, colores.magenta)
        .replace(/\[cyan\]/g, colores.cyan)
        .replace(/\[blanco\]/g, colores.blanco)
        .replace(/\[gris\]/g, colores.gris)
        .replace(/\[rojo_brillante\]/g, colores.rojo_brillante)
        .replace(/\[verde_brillante\]/g, colores.verde_brillante)
        .replace(/\[amarillo_brillante\]/g, colores.amarillo_brillante)
        .replace(/\[azul_brillante\]/g, colores.azul_brillante)
        .replace(/\[magenta_brillante\]/g, colores.magenta_brillante)
        .replace(/\[cyan_brillante\]/g, colores.cyan_brillante)
        .replace(/\[negrita\]/g, colores.negrita)
        .replace(/\[subrayado\]/g, colores.subrayado)
        .replace(/\[parpadeo\]/g, colores.parpadeo)
        .replace(/\[reset\]/g, colores.reset) + colores.reset; // Siempre termina en reset
}

// Función simple para console.log con colores
function log(texto) {
    console.log(procesarColores(texto));
}

module.exports = {
    colores,
    procesarColores,
    log
};
const textos = require('../utilidades/textos.js');
const { log } = require('../utilidades/colores.js');

// Array para trackear módulos cargados y fallidos
const modulosCargados = [];
const modulosFallidos = [];

// Función para registrar que un módulo se cargó correctamente
function moduloCargado(nombreModulo) {
    modulosCargados.push(nombreModulo);
    log('\n' + textos.MODULO_CARGADO.replace('[nombre]', nombreModulo));
}

// Función para registrar que un módulo falló al cargar
function moduloFallo(nombreModulo, error) {
    modulosFallidos.push(nombreModulo);
    log('\n' + textos.ERROR_CARGAR_MODULO.replace('[nombre]', nombreModulo));
    if (error) {
        console.error(error);
    }
}

// Función para mostrar resumen final de carga de módulos
function resumenModulos() {
    if (modulosFallidos.length === 0) {
        log(textos.TODOS_MODULOS_OK);
    } else {
        const modulosFallidosTexto = modulosFallidos.join(', ');
        log(textos.MODULOS_FALLARON.replace('[modulos]', modulosFallidosTexto));
    }
}

module.exports = {
    moduloCargado,
    moduloFallo,
    resumenModulos
};
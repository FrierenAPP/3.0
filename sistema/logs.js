const textos = require('../utilidades/textos.js');
const { log } = require('../utilidades/colores.js');

// Array para trackear funciones cargadas y fallidas
const funcionesCargadas = [];
const funcionesFallidas = [];

// Función para registrar que una función se cargó correctamente
function funcionCargada(nombreFuncion) {
    funcionesCargadas.push(nombreFuncion);
    log(textos.FUNCION_CARGADA.replace('[nombre]', nombreFuncion));
}

// Función para registrar que una función falló al cargar
function funcionFallo(nombreFuncion, error) {
    funcionesFallidas.push(nombreFuncion);
    log(textos.ERROR_CARGAR_FUNCION.replace('[nombre]', nombreFuncion));
    if (error) {
        console.error(error);
    }
}

// Función para mostrar resumen final de carga de funciones
function resumenFunciones() {
    if (funcionesFallidas.length === 0) {
        log(textos.TODAS_FUNCIONES_OK);
    } else {
        const funcionesFallidasTexto = funcionesFallidas.join(', ');
        log(textos.FUNCIONES_FALLARON.replace('[funciones]', funcionesFallidasTexto));
    }
}

module.exports = {
    funcionCargada,
    funcionFallo,
    resumenFunciones
};
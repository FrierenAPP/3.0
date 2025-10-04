const { EmbedBuilder } = require('discord.js');
const textos = require('../../utilidades/textos.js');
const imagenes = require('../../utilidades/imagenes.js');

// Total de páginas (actualizar cuando agregues más)
const TOTAL_PAGINAS = 2;

// Metadata de cada página (nombre del módulo)
const metadataPaginas = [
    { nombre: 'Introducción' },
    { nombre: 'Música' }
];

// Función para generar título dinámico
function generarTitulo(numeroPagina) {
    const metadata = metadataPaginas[numeroPagina - 1];
    const nombreModulo = metadata ? metadata.nombre : 'Desconocido';
    
    return `${textos.AYUDA_TITULO_PRINCIPAL} ¦ ${nombreModulo}${' '.repeat(30)}Pág. ${numeroPagina}`;
}

// Definir todas las páginas
const paginas = [
    // Página 1: Introducción
    (usuario, numeroPagina) => {
        const mencion = `<@${usuario.id}>`;
        return new EmbedBuilder()
            .setColor(12965297)
            .setTitle(textos.AYUDA_TITULO)
            .setAuthor({
                name: generarTitulo(numeroPagina),
                iconURL: imagenes.ICON_FRIEREN
            })
            .setDescription(textos.AYUDA_DESCRIPCION_PRINCIPAL(mencion))
            .setImage(imagenes.AYUDA_BANNER)
    },

    // Página 2: Módulo de Música
    (usuario, numeroPagina) => {
        return new EmbedBuilder()
            .setColor(12965297)
            .setAuthor({
                name: generarTitulo(numeroPagina),
                iconURL: imagenes.ICON_FRIEREN
            })
            .setDescription(textos.AYUDA_MUSICA_DESCRIPCION)
            .addFields(
                {
                    name: textos.AYUDA_MUSICA_PLAY_NOMBRE,
                    value: textos.AYUDA_MUSICA_PLAY_DESCRIPCION
                }
            )
            .setTimestamp();
    }
];

function obtenerEmbedPorPagina(numeroPagina, usuario) {
    const indice = numeroPagina - 1;
    
    if (indice < 0 || indice >= paginas.length) {
        return null;
    }
    
    return paginas[indice](usuario, numeroPagina);
}

function obtenerEmbedPorModulo(modulo, usuario) {
    const mapeoModulos = {
        'musica': 2,
        'música': 2,
        'music': 2
    };
    
    const numeroPagina = mapeoModulos[modulo.toLowerCase()];
    
    if (!numeroPagina) {
        return null;
    }
    
    return obtenerEmbedPorPagina(numeroPagina, usuario);
}

function obtenerTotalPaginas() {
    return TOTAL_PAGINAS;
}

module.exports = {
    obtenerEmbedPorPagina,
    obtenerEmbedPorModulo,
    obtenerTotalPaginas
};
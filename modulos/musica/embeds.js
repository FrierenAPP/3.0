const { EmbedBuilder } = require('discord.js');
const textos = require('../../utilidades/textos.js');
const imagenes = require('../../utilidades/imagenes.js');

// Títulos posibles para el embed de reproduciendo ahora
const TITULOS_REPRODUCIENDO = [
    'Una nueva melodía ha despertado',
    'Una nueva voz musical se hace escuchar',
    'Una nueva sinfonía ha despertado',
    'Un ritmo fresco se hace presente',
    'Un acorde desconocido toma vida'
];

// Títulos posibles para el embed de agregado a la cola
const TITULOS_EN_COLA = [
    'Una nueva armonía aguarda su momento',
    'Un nuevo sonido se alista para sonar',
    'Un nuevo compás se ha puesto en espera',
    'Un nuevo ritmo espera su turno',
    'Un nuevo acorde se une a la espera'
];

// Variables para trackear los últimos títulos usados
let ultimoTituloReproduciendoIndex = -1;
let ultimoTituloColaIndex = -1;

/**
 * Obtiene un título aleatorio diferente al anterior
 */
function obtenerTituloAleatorio(arrayTitulos, ultimoIndex) {
    let nuevoIndex;
    
    if (ultimoIndex === -1 || arrayTitulos.length === 1) {
        nuevoIndex = Math.floor(Math.random() * arrayTitulos.length);
    } else {
        const indicesDisponibles = [];
        for (let i = 0; i < arrayTitulos.length; i++) {
            if (i !== ultimoIndex) {
                indicesDisponibles.push(i);
            }
        }
        
        const randomPos = Math.floor(Math.random() * indicesDisponibles.length);
        nuevoIndex = indicesDisponibles[randomPos];
    }
    
    return { titulo: arrayTitulos[nuevoIndex], index: nuevoIndex };
}

/**
 * Embed para cuando se reproduce una canción por primera vez (cola vacía)
 */
function embedReproduciendoAhora(track, usuario) {
    const mencion = `<@${usuario.id}>`;
    const resultado = obtenerTituloAleatorio(TITULOS_REPRODUCIENDO, ultimoTituloReproduciendoIndex);
    ultimoTituloReproduciendoIndex = resultado.index;
    
    return new EmbedBuilder()
        .setColor(12965297)
        .setAuthor({
            name: resultado.titulo,
            iconURL: imagenes.ICON_FRIEREN
        })
        .setDescription(`¡Hey ${mencion}! Tu canción ha comenzado a sonar:\n‎`)
        .addFields(
            { 
                name: 'Canción', 
                value: track.info.title, 
                inline: true 
            },
            { 
                name: 'Artista', 
                value: track.info.author || 'Desconocido', 
                inline: true 
            }
        )
        .setThumbnail(track.info.artworkUrl || null)
        .setImage('https://i.imgur.com/WFcSmtR.png');
}

/**
 * Embed para cuando se agrega una canción a la cola
 */
function embedAgregadoACola(track, usuario, posicion, queue) {
    const mencion = `<@${usuario.id}>`;
    const resultado = obtenerTituloAleatorio(TITULOS_EN_COLA, ultimoTituloColaIndex);
    ultimoTituloColaIndex = resultado.index;
    
    let listaCola = '';
    const cancionesEnCola = queue.tracks || [];
    const posicionCancionNueva = cancionesEnCola.length;
    
    if (posicionCancionNueva >= 7) {
        for (let i = 0; i < 5; i++) {
            const cancion = cancionesEnCola[i];
            const numero = i + 1;
            const titulo = cancion.info.title;
            const artista = cancion.info.author || 'Desconocido';
            listaCola += `\`${numero}\` ${titulo} - ${artista}\n`;
        }
        
        listaCola += `\`\`...\`\`\n`;
        
        const ultimaCancion = cancionesEnCola[cancionesEnCola.length - 1];
        listaCola += `\`${posicionCancionNueva}\` **${ultimaCancion.info.title} - ${ultimaCancion.info.author || 'Desconocido'}**`;
    } else {
        for (let i = 0; i < cancionesEnCola.length; i++) {
            const cancion = cancionesEnCola[i];
            const numero = i + 1;
            const titulo = cancion.info.title;
            const artista = cancion.info.author || 'Desconocido';
            
            if (i === cancionesEnCola.length - 1) {
                listaCola += `\`${numero}\` **${titulo} - ${artista}**`;
            } else {
                listaCola += `\`${numero}\` ${titulo} - ${artista}\n`;
            }
        }
    }
    
    if (!listaCola) {
        listaCola = 'La cola está vacía';
    }
    
    return new EmbedBuilder()
        .setColor(12965297)
        .setAuthor({
            name: resultado.titulo,
            iconURL: imagenes.ICON_FRIEREN
        })
        .setDescription(`¡Hey ${mencion}! Tu canción se ha agregado a la cola, se encuentra esperando en el puesto ${posicion}.\n‎`)
        .addFields(
            { 
                name: 'Canción', 
                value: track.info.title, 
                inline: true 
            },
            { 
                name: 'Artista', 
                value: track.info.author || 'Desconocido', 
                inline: true 
            },
            {
                name: '‎\nVista rápida de la Cola de Reproducción',
                value: listaCola,
                inline: false
            }
        )
        .setThumbnail(track.info.artworkUrl || null)
        .setImage('https://i.imgur.com/WFcSmtR.png');
}

/**
 * Embed para cuando se agrega una playlist
 */
function embedPlaylistAgregada(playlist, usuario, cantidadCanciones) {
    return null;
}

module.exports = {
    embedReproduciendoAhora,
    embedAgregadoACola,
    embedPlaylistAgregada
};
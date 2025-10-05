const { EmbedBuilder } = require('discord.js');
const textos = require('../utilidades/textos.js');
const imagenes = require('../utilidades/imagenes.js');
const { log } = require('../utilidades/colores.js');
const { funcionCargada, funcionFallo } = require('./logs.js');

// Set para trackear servidores a los que ya se envió presentación
const servidoresEnviados = new Set();

// Función para enviar mensaje de presentación al owner
async function enviarPresentacion(guild) {
    // Verificar si ya se envió presentación a este servidor
    if (servidoresEnviados.has(guild.id)) {
        return;
    }
    
    let exitoso = false;
    
    try {
        // Obtener el owner del servidor
        const owner = await guild.fetchOwner();
        
        // Crear el embed de bienvenida
        const embed = new EmbedBuilder()
            .setTitle(textos.BIENVENIDA_TITULO)
            .setDescription(
                textos.BIENVENIDA_DESCRIPCION
                    .replace('@mencion', `<@${owner.user.id}>`)
                    .replace('<nombreservidor>', guild.name)
            )
            .setColor(12965297)
            .setAuthor({
                name: textos.BIENVENIDA_AUTHOR,
                iconURL: imagenes.BIENVENIDA_AUTHOR_ICON
            })
            .setThumbnail(imagenes.BIENVENIDA_THUMBNAIL)
            .setImage(imagenes.BIENVENIDA_IMAGEN)
            .setFooter({
                text: textos.BIENVENIDA_FOOTER,
                iconURL: imagenes.BIENVENIDA_FOOTER_ICON
            });
        
        // Enviar DM al owner
        await owner.send({ embeds: [embed] });
        
        // Marcar este servidor como enviado
        servidoresEnviados.add(guild.id);
        exitoso = true;
        
    } catch (error) {
        // Si no puede enviar el DM, marcar como fallido
        exitoso = false;
        log(textos.PRESENTACION_ERROR_DM);
        console.error(error);
    }
    
    // Notificar al sistema de logs si existe
    try {
        const { marcarPresentacionEnviada } = require('./servidor_log.js');
        marcarPresentacionEnviada(guild.id, exitoso);
    } catch (e) {
        // El módulo servidor_log no está cargado, continuar
    }
}

// Inicializar función de presentación
function inicializar() {
    try {
        // Aquí iría cualquier inicialización necesaria
        funcionCargada('presentacion');
        return true;
    } catch (error) {
        funcionFallo('presentacion', error);
        return false;
    }
}

module.exports = {
    enviarPresentacion,
    inicializar
};
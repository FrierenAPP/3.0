const { EmbedBuilder } = require('discord.js');
const { funcionCargada, funcionFallo } = require('./logs.js');

// ID del canal donde enviar los logs de servidores
const CANAL_LOG_ID = '1421599246833946785';

// Variable para trackear intentos de presentación
const intentosPresentacion = new Map();

// Función para enviar embed de log cuando se une a un servidor
async function enviarLogServidor(guild) {
    try {
        // Buscar el canal de logs
        const canal = guild.client.channels.cache.get(CANAL_LOG_ID);
        if (!canal) {
            return; // Canal no encontrado, no hacer nada
        }

        // Verificar si se envió presentación exitosamente
        const presentacionEnviada = intentosPresentacion.get(guild.id) || false;
        const estadoPresentacion = presentacionEnviada ? "✅ Enviada exitosamente" : "❌ No se pudo enviar";

        // Crear embed con información del servidor
        const embed = new EmbedBuilder()
            .setTitle("Frieren se ha unido a un nuevo servidor")
            .setColor(12965297)
            .setAuthor({
                name: guild.name,
                iconURL: guild.iconURL() || undefined
            })
            .addFields(
                { name: "Servidor", value: guild.name, inline: true },
                { name: "Miembros", value: guild.memberCount.toString(), inline: true },
                { name: "Presentación enviada", value: estadoPresentacion, inline: true }
            )
            .setThumbnail(guild.iconURL())
            .setFooter({
                text: `Fecha: ${new Date().toLocaleString()}`
            });

        // Enviar embed al canal
        await canal.send({ embeds: [embed] });

    } catch (error) {
        // No hacer logs en consola como solicitado
    }
}

// Función para marcar que se intentó enviar presentación
function marcarPresentacionEnviada(guildId, exitoso = true) {
    intentosPresentacion.set(guildId, exitoso);
}

// Inicializar función
function inicializar() {
    try {
        funcionCargada('servidor_log');
        return true;
    } catch (error) {
        funcionFallo('servidor_log', error);
        return false;
    }
}

module.exports = {
    enviarLogServidor,
    marcarPresentacionEnviada,
    inicializar
};
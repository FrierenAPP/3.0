const textos = require('../../utilidades/textos.js');
const { log } = require('../../utilidades/colores.js');
const { procesarQuery } = require('./utilidades_busqueda.js');
const { embedReproduciendoAhora, embedAgregadoACola, embedPlaylistAgregada } = require('./embeds.js');

let lavalinkManager = null;

function registrar(client, musicManager) {
    lavalinkManager = musicManager;

    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.content.startsWith('f!')) return;

        const args = message.content.slice(2).trim().split(/ +/);
        const comando = args.shift().toLowerCase();

        if (comando === 'play') {
            await comandoPlay(message, args);
        }
    });
}

async function comandoPlay(message, args) {
    try {
        if (!lavalinkManager) {
            return message.reply(textos.MUSICA_ERROR_LAVALINK);
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply(textos.MUSICA_ERROR_NO_VOZ);
        }

        if (!args.length) {
            return message.reply(textos.MUSICA_PROPORCIONAR_CANCION);
        }

        const query = args.join(' ');

        let player = lavalinkManager.getPlayer(message.guild.id);
        if (!player) {
            player = lavalinkManager.createPlayer({
                guildId: message.guild.id,
                voiceChannelId: voiceChannel.id,
                textChannelId: message.channel.id,
                selfDeaf: true,
                selfMute: false,
                volume: 100
            });
            await player.connect();
        }

        const { result, esDirecto, error, desdeCache } = await procesarQuery(player, query, message.author);

        if (error === 'URL_NO_PERMITIDA') {
            return message.reply(textos.MUSICA_LINK_NO_PERMITIDO);
        }

        if (!result || !result.tracks || result.tracks.length === 0) {
            return message.reply(textos.MUSICA_NO_ENCONTRADA_PLATAFORMAS);
        }

        if (result.loadType === 'playlist') {
            // TODO: Soporte para playlists aún no implementado
            return message.reply('El soporte para playlists aún no está disponible. Por favor, agrega canciones individualmente.');
        } else {
            const track = result.tracks[0];
            
            if (!track || !track.info) {
                return message.reply(textos.MUSICA_ERROR_PROCESAR);
            }
            
            // Calcular posición ANTES de agregar a la cola
            // Posición 0 = Reproduciendo ahora
            // Posición 1+ = En la fila esperando
            const hayCancionReproduciendo = player.queue.current !== null;
            const posicionFila = hayCancionReproduciendo 
                ? player.queue.tracks.length + 1  // Siguiente posición en la cola
                : 0;  // Reproduciendo ahora
            const textoFila = posicionFila === 0 
                ? textos.MUSICA_REPRODUCIENDO_AHORA
                : textos.MUSICA_PUESTO_EN_FILA.replace('[posicion]', posicionFila);
            
            player.queue.add(track);
            
            const duracionMs = track.info.length || track.info.duration || track.length || track.duration;
            const duracion = formatearDuracion(duracionMs);
            
            // Elegir embed según si es primera canción o va a la cola
            const embed = posicionFila === 0 
                ? embedReproduciendoAhora(track, message.author)
                : embedAgregadoACola(track, message.author, posicionFila, player.queue);
            
            await message.reply({ embeds: [embed] });
        }

        if (!player.playing && !player.paused) {
            await player.play();
        }

    } catch (error) {
        log(textos.COMANDO_ERROR_PLAY);
        console.error(error);
        message.reply(textos.MUSICA_ERROR_PROCESAR);
    }
}

function formatearDuracion(ms) {
    if (!ms || isNaN(ms) || ms <= 0) {
        return 'Desconocido';
    }
    
    const segundos = Math.floor(ms / 1000);
    const minutos = Math.floor(segundos / 60);
    const segsRestantes = segundos % 60;
    return `${minutos}:${segsRestantes.toString().padStart(2, '0')}`;
}

module.exports = {
    registrar
};
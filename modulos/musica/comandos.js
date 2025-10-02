const textos = require('../../utilidades/textos.js');

let lavalinkManager = null;

// Registrar comandos de música
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

// Comando: f!play [búsqueda o URL]
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
            return message.reply('Debes proporcionar una canción para buscar o un link');
        }

        const query = args.join(' ');

        // Mensaje de estado
        const statusMessage = await message.reply('🔍 Buscando...');

        // Crear o obtener el player
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

        // Buscar - LavaSrc se encarga automáticamente de:
        // - Detectar si es Spotify/Deezer/Apple Music/YouTube
        // - Extraer metadata
        // - Buscar en YouTube
        const result = await player.search({ query: query }, message.author);

        if (!result || !result.tracks || result.tracks.length === 0) {
            await statusMessage.edit('❌ No se encontró ninguna canción');
            return;
        }

        // Si es una playlist
        if (result.loadType === 'playlist') {
            for (const track of result.tracks) {
                player.queue.add(track);
            }
            await statusMessage.edit(`📑 Playlist añadida: **${result.playlistInfo.name}** (${result.tracks.length} canciones)`);
        } else {
            // Canción individual
            const track = result.tracks[0];
            player.queue.add(track);
            
            const mensaje = player.playing 
                ? `📝 Agregada a la cola: **${track.info.title}**`
                : `🎵 Reproduciendo: **${track.info.title}**`;
            
            await statusMessage.edit(mensaje);
        }

        // Iniciar reproducción si no está reproduciendo
        if (!player.playing && !player.paused) {
            await player.play();
        }

    } catch (error) {
        console.error('Error en comando play:', error);
        message.reply('❌ Ocurrió un error al procesar tu solicitud');
    }
}

module.exports = {
    registrar
};

const { EmbedBuilder } = require('discord.js');
const textos = require('../../utilidades/textos.js');
const { procesarQuery } = require('./utilidades_busqueda.js');

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
            for (const track of result.tracks) {
                player.queue.add(track);
            }
            
            const playlistName = result.playlist?.name || 'Playlist sin nombre';
            
            const embedPlaylist = new EmbedBuilder()
                .setColor(12965297)
                .setTitle('Playlist añadida')
                .setDescription(`**${playlistName}**\n${result.tracks.length} canciones agregadas a la cola`)
                .addFields(
                    { name: 'Canciones', value: result.tracks.length.toString(), inline: true }
                )
                .setThumbnail(result.playlist?.artworkUrl || null)
                .setFooter({ text: `Solicitado por ${message.author.username}` })
                .setTimestamp();
            
            await message.reply({ embeds: [embedPlaylist] });
        } else {
            const track = result.tracks[0];
            
            if (!track || !track.info) {
                return message.reply(textos.MUSICA_ERROR_PROCESAR);
            }
            
            player.queue.add(track);
            
            const duracionMs = track.info.length || track.info.duration || track.length || track.duration;
            const duracion = formatearDuracion(duracionMs);
            
            const embed = new EmbedBuilder()
                .setColor(12965297)
                .setTitle(player.playing ? 'Agregada a la cola' : 'Reproduciendo ahora')
                .setDescription(`**${track.info.title}**`)
                .addFields(
                    { name: 'Artista', value: track.info.author || 'Desconocido', inline: true },
                    { name: 'Duración', value: duracion, inline: true }
                )
                .setThumbnail(track.info.artworkUrl || null)
                .setFooter({ 
                    text: `Solicitado por ${message.author.username}${desdeCache ? ' • Desde caché ⚡' : ''}` 
                })
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        }

        if (!player.playing && !player.paused) {
            await player.play();
        }

    } catch (error) {
        console.error('Error en comando play:', error);
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
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { obtenerEmbedPorPagina, obtenerEmbedPorModulo, obtenerTotalPaginas } = require('./embeds.js');
const textos = require('../../utilidades/textos.js');

const paginasActivas = new Map();

function cargar(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.content.startsWith('f!')) return;

        const args = message.content.slice(2).trim().split(/ +/);
        const comando = args.shift().toLowerCase();

        if (comando === 'help' || comando === 'ayuda') {
            const parametro = args[0] ? args[0].toLowerCase() : null;
            let numeroPagina = 1;
            let embed = null;

            if (parametro && parametro.startsWith('pag')) {
                const num = parseInt(parametro.substring(3));
                if (!isNaN(num) && num >= 1 && num <= obtenerTotalPaginas()) {
                    numeroPagina = num;
                    embed = obtenerEmbedPorPagina(numeroPagina, message.author);
                }
            } else if (parametro) {
                embed = obtenerEmbedPorModulo(parametro, message.author);
                if (parametro === 'musica' || parametro === 'música') {
                    numeroPagina = 2;
                }
            } else {
                embed = obtenerEmbedPorPagina(1, message.author);
            }

            if (!embed) {
                return message.reply(textos.AYUDA_NO_ENCONTRADA);
            }

            const botones = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('help_inicio')
                        .setEmoji({ name: 'JhinComfy1', id: '1423774894415417374' })
                        .setLabel(textos.AYUDA_BOTON_INICIO)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('help_anterior')
                        .setEmoji({ name: 'KaiSa_Hi', id: '1423839873411973162' })
                        .setLabel(textos.AYUDA_BOTON_ANTERIOR)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(numeroPagina === 1),
                    new ButtonBuilder()
                        .setCustomId('help_siguiente')
                        .setEmoji({ name: 'Aurora_Wow', id: '1423767867504984224' })
                        .setLabel(textos.AYUDA_BOTON_SIGUIENTE)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(numeroPagina === obtenerTotalPaginas())
                );

            const respuesta = await message.reply({ 
                embeds: [embed],
                components: [botones]
            });

            paginasActivas.set(respuesta.id, {
                paginaActual: numeroPagina,
                usuarioId: message.author.id
            });

            setTimeout(() => {
                paginasActivas.delete(respuesta.id);
            }, 15 * 60 * 1000);
        }
    });

    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isButton()) return;

        const dataPagina = paginasActivas.get(interaction.message.id);
        
        if (!dataPagina) {
            return interaction.reply({ 
                content: textos.AYUDA_SESION_EXPIRADA, 
                ephemeral: true 
            });
        }

        if (interaction.user.id !== dataPagina.usuarioId) {
            return interaction.reply({ 
                content: textos.AYUDA_NO_ES_TUYO, 
                ephemeral: true 
            });
        }

        let nuevaPagina = dataPagina.paginaActual;

        if (interaction.customId === 'help_anterior') {
            nuevaPagina = Math.max(1, dataPagina.paginaActual - 1);
        } else if (interaction.customId === 'help_siguiente') {
            nuevaPagina = Math.min(obtenerTotalPaginas(), dataPagina.paginaActual + 1);
        } else if (interaction.customId === 'help_inicio') {
            nuevaPagina = 1;
        }

        dataPagina.paginaActual = nuevaPagina;

        const nuevoEmbed = obtenerEmbedPorPagina(nuevaPagina, interaction.user);

        const botones = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_inicio')
                    .setEmoji({ name: 'JhinComfy1', id: '1423774894415417374' })
                    .setLabel(textos.AYUDA_BOTON_INICIO)
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('help_anterior')
                    .setEmoji({ name: 'KaiSa_Hi', id: '1423839873411973162' })
                    .setLabel(textos.AYUDA_BOTON_ANTERIOR)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(nuevaPagina === 1),
                new ButtonBuilder()
                    .setCustomId('help_siguiente')
                    .setEmoji({ name: 'Aurora_Wow', id: '1423767867504984224' })
                    .setLabel(textos.AYUDA_BOTON_SIGUIENTE)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(nuevaPagina === obtenerTotalPaginas())
            );

        await interaction.update({
            embeds: [nuevoEmbed],
            components: [botones]
        });
    });
}

module.exports = {
    cargar
};
const { LavalinkManager } = require('lavalink-client');
const textos = require('../../utilidades/textos.js');
const { log } = require('../../utilidades/colores.js');
const { moduloCargado, moduloFallo } = require('../../sistema/logs_modulos.js');
const cacheManager = require('./cache_manager.js');

let lavalinkManager = null;

async function cargar(client) {
    try {
        // Mostrar encabezado de dependencias
        log(textos.MUSICA_CARGANDO_DEPENDENCIAS);
        
        // Crear instancia de LavalinkManager
        lavalinkManager = new LavalinkManager({
            nodes: [
                {
                    authorization: 'mipasswordsegura',
                    host: 'mi-lavalink-production.up.railway.app',
                    port: 443,
                    id: 'Main',
                    secure: true
                }
            ],
            sendToShard: (guildId, payload) => {
                const guild = client.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            },
            client: {
                id: client.user?.id || 'unknown',
                username: client.user?.username || 'Bot'
            },
            playerOptions: {
                clientBasedPositionUpdateInterval: 150,
                defaultSearchPlatform: 'ytsearch',
                volumeDecrementer: 0.75,
                requesterTransformer: (requester) => requester
            },
            queueOptions: {
                maxPreviousTracks: 25
            }
        });

        // Eventos de Lavalink
        lavalinkManager.nodeManager.on('disconnect', (node, reason) => {
            log(textos.LAVALINK_DESCONECTADO
                .replace('[id]', node.id)
                .replace('[razon]', reason.reason));
        });

        lavalinkManager.nodeManager.on('error', (node, error) => {
            log(textos.LAVALINK_ERROR.replace('[id]', node.id));
            console.error(error);
        });

        client.on('raw', (d) => {
            lavalinkManager.sendRawData(d);
        });

        // Esperar a que Lavalink conecte
        await new Promise((resolve) => {
            lavalinkManager.nodeManager.once('connect', (node) => {
                log(textos.LAVALINK_CONECTADO.replace('[id]', node.id));
                resolve();
            });
            
            if (client.isReady()) {
                lavalinkManager.init({ 
                    id: client.user.id,
                    username: client.user.username 
                });
            } else {
                client.once('ready', () => {
                    lavalinkManager.init({ 
                        id: client.user.id,
                        username: client.user.username 
                    });
                });
            }
            
            // Timeout de 5 segundos por si no conecta
            setTimeout(() => resolve(), 5000);
        });

        // Inicializar el caché DESPUÉS de que Lavalink conecte
        cacheManager.inicializar();

        // Cargar comandos
        const comandos = require('./comandos.js');
        comandos.registrar(client, lavalinkManager);
        
        // Marcar módulo como cargado
        moduloCargado('musica');
        
    } catch (error) {
        moduloFallo('musica', error);
    }
}

module.exports = {
    cargar,
    getLavalinkManager: () => lavalinkManager,
    getCacheManager: () => cacheManager
};
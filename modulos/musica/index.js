const { LavalinkManager } = require('lavalink-client');
const textos = require('../../utilidades/textos.js');
const { moduloCargado, moduloFallo } = require('../../sistema/logs_modulos.js');
const cacheManager = require('./cache_manager.js');

let lavalinkManager = null;

function cargar(client) {
    try {
        // Inicializar el caché
        cacheManager.inicializar();
        
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
        lavalinkManager.nodeManager.on('connect', (node) => {
            console.log(`Nodo Lavalink conectado: ${node.id}`);
        });

        lavalinkManager.nodeManager.on('disconnect', (node, reason) => {
            console.log(`Nodo Lavalink desconectado: ${node.id} - ${reason.reason}`);
        });

        lavalinkManager.nodeManager.on('error', (node, error) => {
            console.error(`Error en nodo Lavalink ${node.id}:`, error);
        });

        client.on('raw', (d) => {
            lavalinkManager.sendRawData(d);
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

        // Cargar comandos
        const comandos = require('./comandos.js');
        comandos.registrar(client, lavalinkManager);

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
const cacheManager = require('./cache_manager.js');

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function esURL(texto) {
    try {
        new URL(texto);
        return true;
    } catch {
        return false;
    }
}

function esCanalOficial(canal) {
    if (!canal) return false;
    const canalLower = canal.toLowerCase();
    if (canal.endsWith(' - Topic')) return true;
    if (canalLower.endsWith('vevo')) return true;
    return false;
}

function extraerArtistaDeCanal(canal) {
    if (!canal) return null;
    if (canal.endsWith(' - Topic')) {
        return canal.replace(' - Topic', '');
    }
    if (canal.toLowerCase().endsWith('vevo')) {
        return canal.slice(0, -4).trim();
    }
    return canal;
}

function limpiarTituloYouTube(titulo) {
    return titulo
        .replace(/\s*\[.*?\]/g, '')
        .replace(/\s*\(official.*?\)/gi, '')
        .replace(/\s*\(audio.*?\)/gi, '')
        .replace(/\s*\(lyric.*?\)/gi, '')
        .replace(/\s*\(music.*?video.*?\)/gi, '')
        .replace(/\s*\(visualizer.*?\)/gi, '')
        .replace(/\s*\(hd\)/gi, '')
        .replace(/\s*\(4k\)/gi, '')
        .replace(/\s*\(video\s+oficial.*?\)/gi, '')
        .replace(/\s*\(audio\s+oficial.*?\)/gi, '')
        .replace(/\s*\(letra.*?\)/gi, '')
        .replace(/\s*\(lyrics.*?\)/gi, '')
        .replace(/\s*\(en\s+vivo.*?\)/gi, '')
        .replace(/\s*\(live.*?\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parsearQuery(query) {
    const queryLimpia = query
        .replace(/[()[\]{}]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    
    let titulo = '';
    let artistas = '';
    
    if (queryLimpia.includes(' - ')) {
        const partes = queryLimpia.split(' - ');
        artistas = partes[0].trim();
        titulo = partes.slice(1).join(' - ').trim();
    } else if (queryLimpia.includes(' by ')) {
        const partes = queryLimpia.split(' by ');
        titulo = partes[0].trim();
        artistas = partes.slice(1).join(' by ').trim();
    } else {
        titulo = queryLimpia;
    }
    
    return {
        original: query,
        titulo: normalizar(titulo),
        artistas: normalizar(artistas),
        completo: normalizar(queryLimpia)
    };
}

function generarEstrategias(parsed) {
    const estrategias = [];
    
    if (parsed.artistas && parsed.titulo) {
        estrategias.push(`${parsed.artistas} ${parsed.titulo}`);
        estrategias.push(`${parsed.titulo} ${parsed.artistas}`);
        estrategias.push(`artist:"${parsed.artistas}" ${parsed.titulo}`);
        estrategias.push(parsed.titulo);
        estrategias.push(parsed.artistas);
    } else if (parsed.titulo) {
        estrategias.push(parsed.titulo);
        estrategias.push(`artist:"${parsed.titulo}"`);
    }
    
    estrategias.push(parsed.completo);
    
    return [...new Set(estrategias)];
}

function calcularSimilitud(parsed, track) {
    const tituloTrack = normalizar(track.info.title);
    const artistaTrack = normalizar(track.info.author);
    
    if (parsed.artistas && parsed.titulo) {
        // Caso 1: Tenemos artista y título separados
        const simTituloA = similitudTexto(parsed.titulo, tituloTrack);
        const simArtistaA = similitudTexto(parsed.artistas, artistaTrack);
        const scoreA = (0.7 * simTituloA) + (0.3 * simArtistaA);
        
        const simTituloB = similitudTexto(parsed.artistas, tituloTrack);
        const simArtistaB = similitudTexto(parsed.titulo, artistaTrack);
        const scoreB = (0.7 * simTituloB) + (0.3 * simArtistaB);
        
        return Math.max(scoreA, scoreB);
    } else {
        // Caso 2: Solo tenemos un texto completo (título + artista juntos)
        // Comparar contra título del track
        const simTitulo = similitudTexto(parsed.titulo || parsed.completo, tituloTrack);
        
        // Comparar contra artista del track
        const simArtista = similitudTexto(parsed.titulo || parsed.completo, artistaTrack);
        
        // Comparar contra título + artista combinados
        const trackCompleto = normalizar(`${track.info.author} ${track.info.title}`);
        const simCompleto = similitudTexto(parsed.completo, trackCompleto);
        
        // Usar el mejor match
        return Math.max(simTitulo, simArtista, simCompleto);
    }
}

function similitudTexto(str1, str2) {
    const palabras1 = new Set(str1.split(' ').filter(w => w.length > 2));
    const palabras2 = new Set(str2.split(' ').filter(w => w.length > 2));
    
    if (palabras1.size === 0 || palabras2.size === 0) return 0;
    
    const interseccion = new Set([...palabras1].filter(x => palabras2.has(x)));
    const union = new Set([...palabras1, ...palabras2]);
    
    return interseccion.size / union.size;
}

function normalizar(texto) {
    return texto
        .toLowerCase()
        .replace(/[()[\]{}]/g, ' ')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function procesarQuery(player, query, requester) {
    const esLinkDirecto = esURL(query);
    let queryBusqueda = query;
    let youtubeData = null;

    // PASO 1: Buscar en YouTube
    if (esLinkDirecto) {
        if (query.includes('spotify.com') || query.includes('music.apple.com')) {
            const result = await player.search({ query: query }, requester);
            return { result, esDirecto: true };
        } else if (query.includes('youtube.com') || query.includes('youtu.be') || query.includes('music.youtube.com')) {
            const ytResult = await player.search({ query: query }, requester);
            
            if (!ytResult?.tracks?.length) {
                return { result: null, esDirecto: false };
            }
            
            const trackYT = ytResult.tracks[0];
            const tituloYT = trackYT.info.title;
            const autorYT = trackYT.info.author;
            const tituloLimpio = limpiarTituloYouTube(tituloYT);
            const esOficial = esCanalOficial(autorYT);
            const tieneSeparador = tituloLimpio.includes(' - ') || tituloLimpio.includes(' by ');
            
            if (tieneSeparador) {
                queryBusqueda = tituloLimpio;
            } else if (esOficial) {
                const artistaCanal = extraerArtistaDeCanal(autorYT);
                queryBusqueda = `${artistaCanal} - ${tituloLimpio}`;
            } else {
                queryBusqueda = tituloLimpio;
            }
        } else {
            return { result: null, esDirecto: false, error: 'URL_NO_PERMITIDA' };
        }
    } else {
        const ytResult = await player.search({ query: `ytsearch:${query}` }, requester);
        
        if (!ytResult?.tracks?.length) {
            return { result: null, esDirecto: false };
        }
        
        const trackYT = ytResult.tracks[0];
        const tituloYT = trackYT.info.title;
        const autorYT = trackYT.info.author;
        const tituloLimpio = limpiarTituloYouTube(tituloYT);
        const esOficial = esCanalOficial(autorYT);
        const tieneSeparador = tituloLimpio.includes(' - ') || tituloLimpio.includes(' by ');
        const esCompleto = tituloLimpio.split(' ').length >= query.split(' ').length;
        
        if (tieneSeparador || (esCompleto && !query.includes(' - '))) {
            queryBusqueda = tituloLimpio;
        } else if (esOficial) {
            const artistaCanal = extraerArtistaDeCanal(autorYT);
            queryBusqueda = `${artistaCanal} - ${tituloLimpio}`;
        } else {
            queryBusqueda = query;
        }
        
        const parsed = parsearQuery(tituloLimpio);
        youtubeData = {
            titulo: parsed.titulo || tituloLimpio,
            artista: parsed.artistas || (esOficial ? extraerArtistaDeCanal(autorYT) : 'Desconocido'),
            tituloCompleto: tituloLimpio,
            canal: autorYT
        };
    }

    // PASO 2: Verificar caché
    const resultadoCache = cacheManager.obtener(query);
    if (resultadoCache) {
        const ytResult = await player.search({ query: `ytsearch:${query}` }, requester);
        
        if (ytResult?.tracks?.length > 0) {
            ytResult.tracks[0].info.title = resultadoCache.metadata.titulo;
            ytResult.tracks[0].info.author = resultadoCache.metadata.artista;
            ytResult.tracks[0].info.artworkUrl = resultadoCache.metadata.artworkUrl;
            ytResult.tracks[0].info.duration = resultadoCache.metadata.duracion;
            ytResult.tracks[0].info.length = resultadoCache.metadata.duracion;
            ytResult.tracks[0].info.isrc = resultadoCache.metadata.isrc;
            
            return { 
                result: ytResult, 
                esDirecto: false, 
                desdeCache: true 
            };
        }
    }

 // PASO 3: Buscar en plataformas
const plataformas = [
    { nombre: "Spotify", prefijo: "spsearch:" },
    { nombre: "Apple Music", prefijo: "amsearch:" }
];

const parsed = parsearQuery(queryBusqueda);
const estrategias = generarEstrategias(parsed);

console.log('\n📝 Buscando en plataformas de streaming:');
console.log('════════════════════════════════════════');

let mejorResultado = null;
let mejorSimilitud = 0;
let mejorPlataforma = null;

for (const plat of plataformas) {
    console.log(`\n🔎 ${plat.nombre}:`);
    
    for (let i = 0; i < estrategias.length; i++) {
        const estrategia = estrategias[i];
        console.log(`\n   Intento ${i + 1}: "${estrategia}"`);
        
        const searchResult = await player.search({ 
            query: `${plat.prefijo}${estrategia}` 
        }, requester);
        
        if (searchResult?.tracks?.length > 0) {
            const track = searchResult.tracks[0];
            console.log(`   Encontrado: "${track.info.title}" - ${track.info.author}`);
            
            const similitud = calcularSimilitud(parsed, track);
            console.log(`   Similitud: ${(similitud * 100).toFixed(2)}%`);
            
            if (similitud > mejorSimilitud) {
                mejorSimilitud = similitud;
                mejorResultado = searchResult;
                mejorPlataforma = plat.nombre;
            }
            
            if (similitud >= 0.5) {
                console.log(`   ✅ ACEPTADO (similitud >= 50%)`);
                console.log('════════════════════════════════════════\n');
                
                const trackInfo = searchResult.tracks[0].info;
                cacheManager.guardarResultado(
                    query,
                    youtubeData,
                    {
                        esMusica: true,
                        plataforma: plat.nombre.toLowerCase().replace(' ', ''),
                        similitud: similitud
                    },
                    {
                        titulo: trackInfo.title,
                        artista: trackInfo.author,
                        artworkUrl: trackInfo.artworkUrl,
                        duracion: trackInfo.duration || trackInfo.length,
                        isrc: trackInfo.isrc
                    }
                );
                
                const ytResult = await player.search({ query: `ytsearch:${query}` }, requester);
                
                if (ytResult?.tracks?.length > 0) {
                    ytResult.tracks[0].info.title = trackInfo.title;
                    ytResult.tracks[0].info.author = trackInfo.author;
                    ytResult.tracks[0].info.artworkUrl = trackInfo.artworkUrl;
                    ytResult.tracks[0].info.isrc = trackInfo.isrc;
                    ytResult.tracks[0].info.duration = trackInfo.duration || trackInfo.length;
                    ytResult.tracks[0].info.length = trackInfo.duration || trackInfo.length;
                    
                    return { result: ytResult, esDirecto: false };
                }
                
                return { result: searchResult, esDirecto: false };
            }
        } else {
            console.log(`   ❌ No encontrado`);
        }
    }
}

if (mejorResultado && mejorSimilitud >= 0.2) {
    console.log(`\n⚠️  Usando mejor resultado de ${mejorPlataforma} (${(mejorSimilitud * 100).toFixed(2)}%)`);
    console.log('════════════════════════════════════════\n');
    
    const trackInfo = mejorResultado.tracks[0].info;
    cacheManager.guardarResultado(
        query,
        youtubeData,
        {
            esMusica: true,
            plataforma: mejorPlataforma.toLowerCase().replace(' ', ''),
            similitud: mejorSimilitud
        },
        {
            titulo: trackInfo.title,
            artista: trackInfo.author,
            artworkUrl: trackInfo.artworkUrl,
            duracion: trackInfo.duration || trackInfo.length,
            isrc: trackInfo.isrc
        }
    );
    
    const ytResult = await player.search({ query: `ytsearch:${query}` }, requester);
    
    if (ytResult?.tracks?.length > 0) {
        ytResult.tracks[0].info.title = trackInfo.title;
        ytResult.tracks[0].info.author = trackInfo.author;
        ytResult.tracks[0].info.artworkUrl = trackInfo.artworkUrl;
        ytResult.tracks[0].info.isrc = trackInfo.isrc;
        ytResult.tracks[0].info.duration = trackInfo.duration || trackInfo.length;
        ytResult.tracks[0].info.length = trackInfo.duration || trackInfo.length;
        
        return { result: ytResult, esDirecto: false };
    }
    
    return { result: mejorResultado, esDirecto: false };
}

console.log('════════════════════════════════════════\n');
return { result: null, esDirecto: false };
    if (mejorResultado && mejorSimilitud >= 0.2) {
        const trackInfo = mejorResultado.tracks[0].info;
        cacheManager.guardarResultado(
            query,
            youtubeData,
            {
                esMusica: true,
                plataforma: mejorPlataforma.toLowerCase().replace(' ', ''),
                similitud: mejorSimilitud
            },
            {
                titulo: trackInfo.title,
                artista: trackInfo.author,
                artworkUrl: trackInfo.artworkUrl,
                duracion: trackInfo.duration || trackInfo.length,
                isrc: trackInfo.isrc
            }
        );
        
        const ytResult = await player.search({ query: `ytsearch:${query}` }, requester);
        
        if (ytResult?.tracks?.length > 0) {
            ytResult.tracks[0].info.title = trackInfo.title;
            ytResult.tracks[0].info.author = trackInfo.author;
            ytResult.tracks[0].info.artworkUrl = trackInfo.artworkUrl;
            ytResult.tracks[0].info.isrc = trackInfo.isrc;
            ytResult.tracks[0].info.duration = trackInfo.duration || trackInfo.length;
            ytResult.tracks[0].info.length = trackInfo.duration || trackInfo.length;
            
            return { result: ytResult, esDirecto: false };
        }
        
        return { result: mejorResultado, esDirecto: false };
    }
    
    return { result: null, esDirecto: false };
}

module.exports = {
    procesarQuery
};
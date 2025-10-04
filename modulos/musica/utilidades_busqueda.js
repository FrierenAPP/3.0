// Función para determinar si un canal es oficial/confiable
function esCanalOficial(canal) {
    if (!canal) return false;
    
    const canalLower = canal.toLowerCase();
    
    // Canales Topic son oficiales de YouTube Music
    if (canal.endsWith(' - Topic')) return true;
    
    // Canales VEVO son oficiales
    if (canalLower.endsWith('vevo')) return true;
    
    // Todo lo demás NO es confiable
    return false;
}

// Función para extraer nombre del artista de canales oficiales
function extraerArtistaDeCanal(canal) {
    if (!canal) return null;
    
    // Si termina en " - Topic", quitar eso
    if (canal.endsWith(' - Topic')) {
        return canal.replace(' - Topic', '');
    }
    
    // Si termina en "VEVO", quitar eso
    if (canal.toLowerCase().endsWith('vevo')) {
        return canal.slice(0, -4).trim();
    }
    
    return canal;
}

// Función para limpiar títulos de YouTube (quitar basura)
function limpiarTituloYouTube(titulo) {
    return titulo
        // Remover contenido entre corchetes []
        .replace(/\s*\[.*?\]/g, '')
        // Remover contenido entre paréntesis () que contenga palabras clave (inglés)
        .replace(/\s*\(official.*?\)/gi, '')
        .replace(/\s*\(audio.*?\)/gi, '')
        .replace(/\s*\(lyric.*?\)/gi, '')
        .replace(/\s*\(music.*?video.*?\)/gi, '')
        .replace(/\s*\(visualizer.*?\)/gi, '')
        .replace(/\s*\(hd\)/gi, '')
        .replace(/\s*\(4k\)/gi, '')
        // Remover contenido entre paréntesis () que contenga palabras clave (español)
        .replace(/\s*\(video\s+oficial.*?\)/gi, '')
        .replace(/\s*\(audio\s+oficial.*?\)/gi, '')
        .replace(/\s*\(letra.*?\)/gi, '')
        .replace(/\s*\(lyrics.*?\)/gi, '')
        .replace(/\s*\(en\s+vivo.*?\)/gi, '')
        .replace(/\s*\(live.*?\)/gi, '')
        // Limpiar espacios múltiples
        .replace(/\s+/g, ' ')
        .trim();
}

// Función para detectar si es una URL
function esURL(texto) {
    try {
        new URL(texto);
        return true;
    } catch {
        return false;
    }
}

// Parsear query para separar título y artistas
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

// Generar estrategias de búsqueda
function generarEstrategias(parsed) {
    const estrategias = [];
    
    if (parsed.artistas && parsed.titulo) {
        // Con artista y título
        estrategias.push(`${parsed.artistas} ${parsed.titulo}`);
        estrategias.push(`${parsed.titulo} ${parsed.artistas}`);
        estrategias.push(`artist:"${parsed.artistas}" ${parsed.titulo}`);
        estrategias.push(parsed.titulo);
        estrategias.push(parsed.artistas);
    } else if (parsed.titulo) {
        // Solo título
        estrategias.push(parsed.titulo);
        estrategias.push(`artist:"${parsed.titulo}"`);
    }
    
    estrategias.push(parsed.completo);
    
    return [...new Set(estrategias)];
}

// Calcular similitud entre parsed y track
function calcularSimilitud(parsed, track) {
    const tituloTrack = normalizar(track.info.title);
    const artistaTrack = normalizar(track.info.author);
    
    if (parsed.artistas && parsed.titulo) {
        // Probar AMBAS interpretaciones (título-artista puede estar invertido)
        
        // Interpretación A: parsed.artistas = artista, parsed.titulo = título
        const simTituloA = similitudTexto(parsed.titulo, tituloTrack);
        const simArtistaA = similitudTexto(parsed.artistas, artistaTrack);
        const scoreA = (0.7 * simTituloA) + (0.3 * simArtistaA);
        
        // Interpretación B: INVERTIDO (parsed.artistas = título, parsed.titulo = artista)
        const simTituloB = similitudTexto(parsed.artistas, tituloTrack);
        const simArtistaB = similitudTexto(parsed.titulo, artistaTrack);
        const scoreB = (0.7 * simTituloB) + (0.3 * simArtistaB);
        
        // Usar la mejor interpretación
        return Math.max(scoreA, scoreB);
    } else {
        // Solo comparar con título
        return similitudTexto(parsed.titulo, tituloTrack);
    }
}

// Similitud entre textos
function similitudTexto(str1, str2) {
    const palabras1 = new Set(str1.split(' ').filter(w => w.length > 2));
    const palabras2 = new Set(str2.split(' ').filter(w => w.length > 2));
    
    if (palabras1.size === 0 || palabras2.size === 0) return 0;
    
    const interseccion = new Set([...palabras1].filter(x => palabras2.has(x)));
    const union = new Set([...palabras1, ...palabras2]);
    
    return interseccion.size / union.size;
}

// Normalizar texto
function normalizar(texto) {
    return texto
        .toLowerCase()
        // NO eliminar acentos si hay caracteres no-latinos
        .replace(/[()[\]{}]/g, ' ')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Permitir cualquier letra Unicode y números
        .replace(/\s+/g, ' ')
        .trim();
}

// Función principal para procesar query y obtener la mejor búsqueda
async function procesarQuery(player, query, requester) {
    const esLinkDirecto = esURL(query);
    let queryBusqueda = query;

    // PASO 1: Determinar la query para búsqueda
    if (esLinkDirecto) {
        if (query.includes('spotify.com') || query.includes('music.apple.com')) {
            // Links de Spotify/Apple se cargan directamente
            const result = await player.search({ query: query }, requester);
            return { result, esDirecto: true };
        } else if (query.includes('youtube.com') || query.includes('youtu.be') || query.includes('music.youtube.com')) {
            // Link de YouTube - extraer info
            const ytResult = await player.search({ query: query }, requester);
            
            if (!ytResult?.tracks?.length) {
                return { result: null, esDirecto: false };
            }
            
            const trackYT = ytResult.tracks[0];
            const tituloYT = trackYT.info.title;
            const autorYT = trackYT.info.author;
            
            console.log('🎥 Título de YouTube:', tituloYT);
            console.log('👤 Canal:', autorYT);
            
            const tituloLimpio = limpiarTituloYouTube(tituloYT);
            console.log('🧹 Título limpio:', tituloLimpio);
            
            const esOficial = esCanalOficial(autorYT);
            console.log('🔍 ¿Canal oficial?:', esOficial);
            
            const tieneSeparador = tituloLimpio.includes(' - ') || tituloLimpio.includes(' by ');
            
            if (tieneSeparador) {
                queryBusqueda = tituloLimpio;
                console.log('✅ Usando título completo de YouTube');
            } else if (esOficial) {
                const artistaCanal = extraerArtistaDeCanal(autorYT);
                queryBusqueda = `${artistaCanal} - ${tituloLimpio}`;
                console.log('✅ Canal oficial detectado, combinando:', queryBusqueda);
            } else {
                queryBusqueda = tituloLimpio;
                console.log('⚠️  Canal no oficial, solo usando título');
            }
        } else {
            // URL no permitida
            return { result: null, esDirecto: false, error: 'URL_NO_PERMITIDA' };
        }
    } else {
        // BÚSQUEDA DE TEXTO: Primero buscar en YouTube
        console.log('🔍 Buscando primero en YouTube:', query);
        const ytResult = await player.search({ query: `ytsearch:${query}` }, requester);
        
        if (!ytResult?.tracks?.length) {
            return { result: null, esDirecto: false };
        }
        
        const trackYT = ytResult.tracks[0];
        const tituloYT = trackYT.info.title;
        const autorYT = trackYT.info.author;
        
        console.log('🎥 YouTube encontró:', tituloYT);
        console.log('👤 Canal:', autorYT);
        
        const tituloLimpio = limpiarTituloYouTube(tituloYT);
        console.log('🧹 Título limpio:', tituloLimpio);
        
        const esOficial = esCanalOficial(autorYT);
        console.log('🔍 ¿Canal oficial?:', esOficial);
        
        const tieneSeparador = tituloLimpio.includes(' - ') || tituloLimpio.includes(' by ');
        const esCompleto = tituloLimpio.split(' ').length >= query.split(' ').length;
        
        if (tieneSeparador || (esCompleto && !query.includes(' - '))) {
            queryBusqueda = tituloLimpio;
            console.log('✅ Usando título de YouTube');
        } else if (esOficial) {
            const artistaCanal = extraerArtistaDeCanal(autorYT);
            queryBusqueda = `${artistaCanal} - ${tituloLimpio}`;
            console.log('✅ Canal oficial detectado, combinando:', queryBusqueda);
        } else {
            queryBusqueda = query;
            console.log('⚠️  Canal no oficial, usando query original');
        }
    }

    // PASO 2: Buscar en plataformas con sistema robusto
    const plataformas = [
        { nombre: "Spotify", prefijo: "spsearch:" },
        { nombre: "Apple Music", prefijo: "amsearch:" }
    ];

    console.log('\n📝 Query de búsqueda:', queryBusqueda);
    
    const parsed = parsearQuery(queryBusqueda);
    console.log('📝 Parseado:', parsed);
    
    const estrategias = generarEstrategias(parsed);
    console.log('🎯 Estrategias:', estrategias.length);
    console.log('════════════════════════════════════════');

    let mejorResultado = null;
    let mejorSimilitud = 0;
    let mejorPlataforma = null;

    // Probar cada plataforma
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
                    return { result: searchResult, esDirecto: false };
                }
            } else {
                console.log(`   ❌ No encontrado`);
            }
        }
    }

    // Si ninguno superó 50%, usar el mejor si es >= 20%
    if (mejorResultado && mejorSimilitud >= 0.2) {
        console.log(`\n⚠️  Usando mejor resultado de ${mejorPlataforma} (${(mejorSimilitud * 100).toFixed(2)}%)`);
        console.log('════════════════════════════════════════\n');
        return { result: mejorResultado, esDirecto: false };
    }
    
    console.log('════════════════════════════════════════\n');
    return { result: null, esDirecto: false };
}

module.exports = {
    procesarQuery
};
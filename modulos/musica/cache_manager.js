const fs = require('fs');
const path = require('path');

class CacheManager {
    constructor(opciones = {}) {
        this.CACHE_FILE = path.join(__dirname, '../../datos/cache_musica.json');
        this.MAX_CACHE_SIZE = opciones.maxSize || 1000;
        this.AUTO_SAVE_INTERVAL = opciones.autoSaveInterval || 300000; // 5 minutos
        
        this.cache = new Map();
        this.metadata = new Map();
        
        this.estadisticas = {
            aciertos: 0,
            fallos: 0,
            totalBusquedas: 0,
            ultimoGuardado: null
        };
        
        this.autoSaveTimer = null;
    }
    
    inicializar() {
        try {
            const dir = path.dirname(this.CACHE_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            this.cargar();
            this.iniciarAutoGuardado();
            this.configurarGuardadoAlCerrar();
            
            console.log(`📦 Cache Manager inicializado: ${this.cache.size} canciones`);
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Cache Manager:', error);
            return false;
        }
    }
    
    cargar() {
        try {
            if (!fs.existsSync(this.CACHE_FILE)) {
                console.log('📦 No hay caché previo, iniciando vacío');
                return;
            }
            
            const data = JSON.parse(fs.readFileSync(this.CACHE_FILE, 'utf8'));
            
            if (data.cache) {
                Object.entries(data.cache).forEach(([key, value]) => {
                    this.cache.set(key, value);
                });
            }
            
            if (data.metadata) {
                Object.entries(data.metadata).forEach(([key, value]) => {
                    this.metadata.set(key, value);
                });
            }
            
            if (data.estadisticas) {
                this.estadisticas = { ...this.estadisticas, ...data.estadisticas };
            }
            
            console.log(`✅ Caché cargado: ${this.cache.size} canciones`);
            
        } catch (error) {
            console.error('❌ Error cargando caché:', error);
        }
    }
    
    guardar() {
        try {
            const data = {
                version: '3.0',
                timestamp: Date.now(),
                cache: Object.fromEntries(this.cache),
                metadata: Object.fromEntries(this.metadata),
                estadisticas: this.estadisticas
            };
            
            fs.writeFileSync(this.CACHE_FILE, JSON.stringify(data, null, 2));
            this.estadisticas.ultimoGuardado = Date.now();
            
            console.log(`💾 Caché guardado: ${this.cache.size} canciones`);
            return true;
        } catch (error) {
            console.error('❌ Error guardando caché:', error);
            return false;
        }
    }
    
    iniciarAutoGuardado() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            this.guardar();
        }, this.AUTO_SAVE_INTERVAL);
    }
    
    configurarGuardadoAlCerrar() {
        const guardarYSalir = () => {
            console.log('\n🛑 Cerrando bot, guardando caché...');
            this.guardar();
            process.exit(0);
        };
        
        process.on('SIGINT', guardarYSalir);
        process.on('SIGTERM', guardarYSalir);
    }
    
    // Generar clave basada en el RESULTADO (artista + título), no en la búsqueda del usuario
    generarClaveDesdeResultado(titulo, artista) {
        const claveNormalizada = `${artista} ${titulo}`
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '')
            .replace(/[^\w]/g, ''); // Quitar caracteres especiales y espacios
        
        return claveNormalizada;
    }
    
    // Normalizar query del usuario
    normalizarClave(query) {
        return query
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
    }
    
    // En la función obtener(), cambiar todos los console.log por uno solo:
obtener(query) {
    const queryNormalizada = this.normalizarClave(query);
    this.estadisticas.totalBusquedas++;
    
    for (const [key, datos] of this.cache) {
        if (datos.busquedasRelacionadas && 
            datos.busquedasRelacionadas.includes(queryNormalizada)) {
            
            const meta = this.metadata.get(key);
            meta.ultimoUso = Date.now();
            meta.usos++;
            
            this.estadisticas.aciertos++;
            
            // UN SOLO LOG
            console.log(`✅ Caché: "${datos.metadata.titulo}" (${meta.usos} usos)`);
            
            return datos;
        }
    }
    
    this.estadisticas.fallos++;
    // Sin log aquí
    return null;
}
    
    // Guardar resultado usando la canción como clave, no la búsqueda del usuario
    guardarResultado(query, youtubeData, validacionData, metadataVisual) {
        // Generar clave basada en el RESULTADO (artista + título)
        const key = this.generarClaveDesdeResultado(
            metadataVisual.titulo,
            metadataVisual.artista
        );
        
        const queryNormalizada = this.normalizarClave(query);
        
        // Verificar si ya existe
        if (this.cache.has(key)) {
            // Ya existe, solo actualizar búsquedas relacionadas y metadata
            const datosExistentes = this.cache.get(key);
            
            // Asegurar que existe el array de búsquedas relacionadas
            if (!datosExistentes.busquedasRelacionadas) {
                datosExistentes.busquedasRelacionadas = [];
            }
            
            // Agregar query a búsquedas relacionadas si no existe
            if (!datosExistentes.busquedasRelacionadas.includes(queryNormalizada)) {
                datosExistentes.busquedasRelacionadas.push(queryNormalizada);
            }
            
            // Actualizar metadata de uso
            const meta = this.metadata.get(key);
            meta.ultimoUso = Date.now();
            meta.usos++;
            
            console.log(`💾 Actualizado en caché "${metadataVisual.titulo}" - ${metadataVisual.artista}`);
            console.log(`   📝 Nueva búsqueda agregada: "${query}"`);
            console.log(`   📊 Total búsquedas para esta canción: ${datosExistentes.busquedasRelacionadas.length}`);
            
            // Guardar periódicamente
            if (this.cache.size % 20 === 0) {
                this.guardar();
            }
            
            return;
        }
        
        // Si no existe, crear nueva entrada
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            this.eliminarMenosPrioritario();
        }
        
        const datosCache = {
            youtube: {
                tituloEncontrado: youtubeData.titulo,
                artistaEncontrado: youtubeData.artista,
                tituloCompleto: youtubeData.tituloCompleto,
                canal: youtubeData.canal
            },
            validacion: {
                esMusica: validacionData.esMusica,
                plataforma: validacionData.plataforma,
                similitud: validacionData.similitud
            },
            metadata: {
                titulo: metadataVisual.titulo,
                artista: metadataVisual.artista,
                artworkUrl: metadataVisual.artworkUrl,
                duracion: metadataVisual.duracion,
                isrc: metadataVisual.isrc
            },
            busquedasRelacionadas: [queryNormalizada]
        };
        
        this.cache.set(key, datosCache);
        
        this.metadata.set(key, {
            ultimoUso: Date.now(),
            usos: 1
        });
        
        console.log(`💾 Guardado en caché "${metadataVisual.titulo}" - ${metadataVisual.artista} (${this.cache.size}/${this.MAX_CACHE_SIZE})`);
        console.log(`   🎵 YouTube: "${youtubeData.tituloCompleto}"`);
        console.log(`   ✓ Validado en ${validacionData.plataforma}`);
        
        if (this.cache.size % 20 === 0) {
            this.guardar();
        }
    }
    
    eliminarMenosPrioritario() {
        let keyAEliminar = null;
        let menorPrioridad = Infinity;
        
        const ahora = Date.now();
        
        for (const [key, meta] of this.metadata) {
            const diasDesdeUso = (ahora - meta.ultimoUso) / (1000 * 60 * 60 * 24);
            const prioridad = meta.usos * 10 - diasDesdeUso;
            
            if (prioridad < menorPrioridad) {
                menorPrioridad = prioridad;
                keyAEliminar = key;
            }
        }
        
        if (keyAEliminar) {
            const datos = this.cache.get(keyAEliminar);
            this.cache.delete(keyAEliminar);
            this.metadata.delete(keyAEliminar);
            console.log(`🗑️ Caché lleno, eliminada: "${datos?.metadata?.titulo || 'Desconocida'}"`);
        }
    }
    
    limpiarAntiguas(diasMaximos = 60) {
        const ahora = Date.now();
        let eliminadas = 0;
        
        for (const [key, meta] of this.metadata) {
            const dias = (ahora - meta.ultimoUso) / (1000 * 60 * 60 * 24);
            if (dias > diasMaximos) {
                this.cache.delete(key);
                this.metadata.delete(key);
                eliminadas++;
            }
        }
        
        if (eliminadas > 0) {
            this.guardar();
            console.log(`🗑️ Limpiadas ${eliminadas} canciones antiguas`);
        }
        
        return eliminadas;
    }
    
    calcularTasaAcierto() {
        if (this.estadisticas.totalBusquedas === 0) return 0;
        return ((this.estadisticas.aciertos / this.estadisticas.totalBusquedas) * 100).toFixed(1);
    }
    
    obtenerEstadisticas() {
        const canciones = Array.from(this.metadata.entries())
            .map(([key, meta]) => {
                const datos = this.cache.get(key);
                return {
                    titulo: datos.metadata.titulo,
                    artista: datos.metadata.artista,
                    plataforma: datos.validacion.plataforma,
                    usos: meta.usos,
                    busquedasRelacionadas: datos.busquedasRelacionadas.length,
                    ultimoUso: new Date(meta.ultimoUso).toLocaleString()
                };
            })
            .sort((a, b) => b.usos - a.usos)
            .slice(0, 10);
        
        return {
            tamaño: this.cache.size,
            maximo: this.MAX_CACHE_SIZE,
            porcentajeLleno: ((this.cache.size / this.MAX_CACHE_SIZE) * 100).toFixed(1),
            totalBusquedas: this.estadisticas.totalBusquedas,
            aciertos: this.estadisticas.aciertos,
            fallos: this.estadisticas.fallos,
            tasaAcierto: this.calcularTasaAcierto() + '%',
            ultimoGuardado: this.estadisticas.ultimoGuardado 
                ? new Date(this.estadisticas.ultimoGuardado).toLocaleString() 
                : 'Nunca',
            top10Canciones: canciones
        };
    }
    
    limpiarTodo() {
        this.cache.clear();
        this.metadata.clear();
        this.estadisticas = {
            aciertos: 0,
            fallos: 0,
            totalBusquedas: 0,
            ultimoGuardado: null
        };
        this.guardar();
        console.log('🗑️ Caché completamente limpiado');
    }
}

const cacheManager = new CacheManager({
    maxSize: 1000,
    autoSaveInterval: 300000
});

module.exports = cacheManager;
const fs = require('fs');
const path = require('path');
const textos = require('../../utilidades/textos.js');
const { log } = require('../../utilidades/colores.js');

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
            
            return true;
        } catch (error) {
            log(textos.CACHE_ERROR_INICIALIZAR);
            console.error(error);
            return false;
        }
    }
    
    cargar() {
        try {
            if (!fs.existsSync(this.CACHE_FILE)) {
                log(textos.CACHE_NO_PREVIO);
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
            
            log(textos.CACHE_CARGADO.replace('[size]', this.cache.size));
            
        } catch (error) {
            log(textos.CACHE_ERROR_CARGAR);
            console.error(error);
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
            
            log(textos.CACHE_GUARDADO.replace('[size]', this.cache.size));
            return true;
        } catch (error) {
            log(textos.CACHE_ERROR_GUARDAR);
            console.error(error);
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
            log(textos.CACHE_CERRANDO);
            this.guardar();
            process.exit(0);
        };
        
        process.on('SIGINT', guardarYSalir);
        process.on('SIGTERM', guardarYSalir);
    }
    
    generarClaveDesdeResultado(titulo, artista) {
        const claveNormalizada = `${artista} ${titulo}`
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '')
            .replace(/[^\w]/g, '');
        
        return claveNormalizada;
    }
    
    normalizarClave(query) {
        return query
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
    }
    
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
                
                log(textos.CACHE_ACIERTO
                    .replace('[titulo]', datos.metadata.titulo)
                    .replace('[usos]', meta.usos));
                
                return datos;
            }
        }
        
        this.estadisticas.fallos++;
        return null;
    }
    
    guardarResultado(query, youtubeData, validacionData, metadataVisual) {
        const key = this.generarClaveDesdeResultado(
            metadataVisual.titulo,
            metadataVisual.artista
        );
        
        const queryNormalizada = this.normalizarClave(query);
        
        if (this.cache.has(key)) {
            const datosExistentes = this.cache.get(key);
            
            if (!datosExistentes.busquedasRelacionadas) {
                datosExistentes.busquedasRelacionadas = [];
            }
            
            if (!datosExistentes.busquedasRelacionadas.includes(queryNormalizada)) {
                datosExistentes.busquedasRelacionadas.push(queryNormalizada);
            }
            
            const meta = this.metadata.get(key);
            meta.ultimoUso = Date.now();
            meta.usos++;
            
            log(textos.CACHE_ACTUALIZADO
                .replace('[titulo]', metadataVisual.titulo)
                .replace('[artista]', metadataVisual.artista));
            log(textos.CACHE_NUEVA_BUSQUEDA.replace('[query]', query));
            log(textos.CACHE_TOTAL_BUSQUEDAS.replace('[total]', datosExistentes.busquedasRelacionadas.length));
            
            if (this.cache.size % 20 === 0) {
                this.guardar();
            }
            
            return;
        }
        
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
        
        log(textos.CACHE_GUARDADO_NUEVO
            .replace('[titulo]', metadataVisual.titulo)
            .replace('[artista]', metadataVisual.artista)
            .replace('[size]', this.cache.size)
            .replace('[max]', this.MAX_CACHE_SIZE));
        log(textos.CACHE_YOUTUBE.replace('[titulo]', youtubeData.tituloCompleto));
        log(textos.CACHE_VALIDADO.replace('[plataforma]', validacionData.plataforma));
        
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
            log(textos.CACHE_ELIMINADO.replace('[titulo]', datos?.metadata?.titulo || 'Desconocida'));
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
            log(textos.CACHE_LIMPIADAS.replace('[cantidad]', eliminadas));
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
        log(textos.CACHE_LIMPIADO_TODO);
    }
}

const cacheManager = new CacheManager({
    maxSize: 1000,
    autoSaveInterval: 300000
});

module.exports = cacheManager;
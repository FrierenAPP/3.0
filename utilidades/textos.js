module.exports = {
    // Mensajes del sistema
    BOT_CONECTADO: "\n[verde]· La aplicación se ha encendido correctamente.[reset]",
    
    // Mensajes de error
    ERROR_CARGAR_MODULO: "Error cargando módulo",
    
    // Logs de funciones
    INICIANDO_FUNCIONES: "[verde][carga] [reset]Iniciando carga de funciones:",
    FUNCION_CARGADA: "\n[verde]· [reset]Función [azul][nombre][reset] cargada exitosamente.",
    ERROR_CARGAR_FUNCION: "[rojo]· [reset]Error al cargar la función [nombre].",
    TODAS_FUNCIONES_OK: "[verde]· [reset]Todas las funciones se cargaron sin errores.",
    FUNCIONES_FALLARON: "Las siguientes funciones fallaron al cargar: [funciones]",

    // Logs de módulos
    INICIANDO_MODULOS: "[verde][carga] [reset]Iniciando carga de módulos.",
    MODULO_CARGADO: "[verde]· [reset]Módulo [azul][nombre][reset] cargado exitosamente.",
    ERROR_CARGAR_MODULO: "[rojo]· [reset]Error al cargar módulo [nombre].",
    TODOS_MODULOS_OK: "[verde]· [reset]Todos los módulos se cargaron sin errores.",
    MODULOS_FALLARON: "Las siguientes módulos fallaron al cargar: [modulos]",
    
    // Mensaje de bienvenida a servidores
    BIENVENIDA_TITULO: "¡Bienvenido a los bosques mágicos!",
    BIENVENIDA_DESCRIPCION: "No te habia visto antes, ¿es tu primera vez por aca? ¡Es un verdadero placer conocerte @mencion!\n\nRecientemente fui invitada a uno de tus servidores, y estoy emocionada de unirme a tu comunidad **<nombreservidor>**.\n\nSoy Frieren, una aplicación para Discord diseñada para ayudarte a llevar la gestión de comunidades y equipos de una manera ordenada, ágil y profesional. \n\nMi propósito es sencillo pero esencial, me encargo de centralizar herramientas importantes y automatizar procesos, para que la carga administrativa sea más ligera y la colaboración fluya sin obstáculos. De esta manera, todos podrán concentrarse en lo que realmente importa dentro del equipo.\n\nSi no sabes por dónde empezar, no te preocupes, podemos explorar juntos mi Documentación Elfica y descubrir poco a poco todo lo que puedo ofrecerte.\n\nQue nuestra travesía en los bosques mágicos sea tan brillante como las estrellas que iluminan la noche.",
    BIENVENIDA_AUTHOR: "¡Frieren se une a la aventura!",
    BIENVENIDA_FOOTER: "Frieren ¦ Aplicacion corporativa multiproposito.",

// Módulo de música
MUSICA_NO_ENCONTRADA: "No se encontró ninguna canción",
MUSICA_NO_ENCONTRADA_PLATAFORMAS: "No se encontró en Spotify, Apple Music ni YouTube Music",
MUSICA_PROPORCIONAR_CANCION: "Debes proporcionar una canción para buscar o un link",
MUSICA_ERROR_PROCESAR: "Ocurrió un error al procesar tu solicitud",
MUSICA_ERROR_NO_VOZ: "Debes estar en un canal de voz para usar este comando",
MUSICA_ERROR_LAVALINK: "El sistema de música no está disponible en este momento",
MUSICA_LINK_NO_PERMITIDO: "Solo se permiten links de Spotify, Apple Music, YouTube o YouTube Music",

// Módulo de ayuda
AYUDA_TITULO_PRINCIPAL: 'Enciclopedia Encantada',
AYUDA_TITULO: 'El comienzo de la Exploración',
AYUDA_DESCRIPCION_PRINCIPAL: (mencion) => 
`¡Hola, viajero ${mencion}!\n\n` +
    `Has abierto el panel de ayuda de Frieren. Aquí encontrarás una guía organizada con todos los módulos disponibles y la manera en que puedes utilizarlos.\n\n` +
    `Cada módulo reúne un conjunto de comandos diseñados para hacer tu experiencia más fácil, divertida y ordenada. Ya sea que quieras reproducir música, acceder a útiles herramientas de organización o pasar un buen rato con mis integraciones, todo lo que necesitas está aquí.\n\n` +
    `Para explorar los módulos y sus comandos, utiliza los botones de navegación: Página Anterior para retroceder, Página Siguiente para avanzar e introducción para volver a esta página. También puedes ir directo a un módulo específico con el siguiente comando:\n\n` +
    `⠀<:Frieren:1423486175145889792>⠀\`f!help <módulo>\`.\n\nPrueba con \`f!help música\` y deja que las melodías mágicas acompañen tu travesía con mi reproductor de música.\n\n` +
    `De igual forma puedes ir directamente a consultar una página de la enciclopedia con ayuda del comando:\n\n` +
    `⠀<:Frieren:1423486175145889792>⠀\`f!help Pag<Número de página>\`.\n\nUsa \`f!help Pag4\` y permite que los secretos de esa página se revelen ante tus ojos.\n\n` +
    `Con esto podrás conocer a fondo cada módulo y aprender a invocar sus comandos de manera rápida y sencilla. ¿Comenzamos?\n\n` +
    `Ya conoces el camino para comenzar a explorar y aprender todo lo que Frieren puede hacer por ti.`,

AYUDA_PAGINA_DE: (actual, total) => `Página ${actual} de ${total}`,
AYUDA_PAGINA_SOLICITADA: (actual, total, username) => `Página ${actual} de ${total} • Solicitado por ${username}`,

// Módulo de ayuda - Música
AYUDA_MUSICA_TITULO: 'Módulo de Música',
AYUDA_MUSICA_DESCRIPCION: 'Sistema completo de reproducción de música desde Spotify, Apple Music y YouTube.',
AYUDA_MUSICA_PLAY_NOMBRE: '🎵 f!play <búsqueda/link>',
AYUDA_MUSICA_PLAY_DESCRIPCION: 
    'Reproduce una canción buscándola en las plataformas musicales.\n' +
    '**Ejemplos:**\n' +
    '• `f!play duki`\n' +
    '• `f!play monaco - bad bunny`\n' +
    '• `f!play https://open.spotify.com/track/...`',

// Mensajes de error del módulo de ayuda
AYUDA_NO_ENCONTRADA: 'Módulo o página no encontrada. Usa `f!help` para ver las opciones disponibles.',
AYUDA_SESION_EXPIRADA: 'Esta sesión de ayuda ha expirado. Usa `f!help` para abrir una nueva.',
AYUDA_NO_ES_TUYO: 'Este panel de ayuda no es tuyo. Usa `f!help` para abrir el tuyo.',

// Botones de ayuda
AYUDA_BOTON_INICIO: ' Introducción',
AYUDA_BOTON_ANTERIOR: 'Página Anterior',
AYUDA_BOTON_SIGUIENTE: 'Página Siguiente',

    // Aquí irán todos los demás textos conforme los vayamos necesitando
};
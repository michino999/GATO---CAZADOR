// ============================================================
//  CONFIGURACIÓN GLOBAL, CONSTANTES Y ESTADO PERSISTENTE
// ============================================================
const ANCHO_CAMARA = 600;
const ALTO_CAMARA = 400;
const ANCHO_MUNDO = 1800;
const ALTO_MUNDO = 1200;

const DURACION_PARTIDA = 75;
const CAPTURAS_POR_NIVEL = 5;
const NIVELES_POR_RATON = 2;
const BONUS_TIEMPO_NIVEL = 6;
const DISTANCIA_MIN_APARICION = 240;
const MAX_NIVEL_MEJORA = 5;
const TOPE_APRENDIZAJE = 250;

const VELOCIDAD_GATO_1V1 = 335;
const VELOCIDAD_RATON_1V1 = 355;
const VELOCIDAD_RATON_JUGADOR_VUDU = 355;
const VELOCIDAD_JEFE_FACILIER_BASE = 275;

const FONDOS_HEX = [0x0d1322, 0x111827, 0x17153b, 0x092635, 0x1e1b4b];
const RATONES = ["🐭", "🐀", "🐹", "🐿️"];

const DIFICULTADES = [
    { nombre: "Fácil", velGato: 335, factorRaton: 0.78, monedasPorCaptura: 5 },
    { nombre: "Normal", velGato: 360, factorRaton: 0.92, monedasPorCaptura: 8 },
    { nombre: "Difícil", velGato: 385, factorRaton: 1.05, monedasPorCaptura: 12 }
];

const SKINS = [
    { emoji: "🐱", nombre: "Gato Clásico", precio: 0, velocidad: 1.0, costoMejora: 80, skillName: "Impulso Felino", skillType: "overdrive", skillCd: 7, skillColor: "#38bdf8", skillHex: 0x38bdf8, descripcion: "Cazador ágil · Poder: Impulso Felino." },
    { emoji: "🐈‍⬛", nombre: "Sombra Nocturna", precio: 120, velocidad: 1.06, costoMejora: 110, skillName: "Paso Sombrío", skillType: "overdrive", skillCd: 6.5, skillColor: "#a855f7", skillHex: 0xa855f7, descripcion: "Sigiloso · Poder: Paso Sombrío veloz." },
    { emoji: "🐯", nombre: "Tigre Bengala", precio: 280, velocidad: 1.12, costoMejora: 140, skillName: "Zarpa Feroz", skillType: "overdrive", skillCd: 6, skillColor: "#fb923c", skillHex: 0xfb923c, descripcion: "Depredador · Poder: Zarpa Feroz." },
    { emoji: "🦁", nombre: "León Dorado", precio: 550, velocidad: 1.18, costoMejora: 180, skillName: "Rugido Sísmico", skillType: "stun", skillCd: 8, skillColor: "#facc15", skillHex: 0xfacc15, descripcion: "Rey · Onda física que empuja cajas y aturde 2.5s." },
    { emoji: "🐆", nombre: "Guepardo Turbo", precio: 950, velocidad: 1.25, costoMejora: 220, skillName: "Velocidad Relámpago", skillType: "overdrive", skillCd: 6, skillColor: "#22d3ee", skillHex: 0x22d3ee, descripcion: "Velocista · Poder Anime: Dash supersónico." },
    { emoji: "tate", archivoBase: "tate.png", icono: "⭐", nombre: "Tate", precio: 0, velocidad: 1.22, costoMejora: 200, secreta: true, skillName: "Destello Estelar", skillType: "blink", skillCd: 6.5, skillColor: "#fde047", skillHex: 0xfde047, descripcion: "Legendario · Teletransporte directo cerca del ratón." },
    { emoji: "tate_sombrero", archivoBase: "tate.png", icono: "🎩", nombre: "Tate del Infierno", precio: 0, velocidad: 1.32, costoMejora: 300, secreta: true, sombrero: true, skillName: "Dominio Infernal", skillType: "magnet", skillCd: 7.5, skillColor: "#ef4444", skillHex: 0xef4444, descripcion: "Infernal · Vórtice gravitacional que atrae ratón y cajas." },
    { emoji: "tate_facilier", archivoBase: "tate.png", icono: "🃏", nombre: "Tate Dr. Facilier", precio: 0, velocidad: 1.35, costoMejora: 320, secreta: true, facilier: true, skillName: "Pacto de Sombras", skillType: "voodoo", skillCd: 7.5, skillColor: "#c084fc", skillHex: 0xc084fc, descripcion: "Maestro Vudú · Invoca y aturde al ratón." }
];

const cacheDataUrlSkins = { "tate.png": "tate.png" };

function cargarImagenTate() {
    const rutasPosibles = ["tate.png", "cat.png", "./tate.png"];
    let indice = 0;

    function intentarSiguiente() {
        if (indice >= rutasPosibles.length) return;
        const ruta = rutasPosibles[indice++];
        const img = new Image();
        img.onload = () => {
            cacheDataUrlSkins["tate.png"] = ruta;
            const brandImg = document.getElementById("brand-tate-img");
            if (brandImg) {
                brandImg.src = ruta;
                brandImg.style.display = "inline-block";
            }
            const brandFallback = document.getElementById("brand-fallback");
            if (brandFallback) brandFallback.style.display = "none";
            const quizImg = document.getElementById("quiz-img-tate");
            if (quizImg) quizImg.src = ruta;
            if (typeof actualizarBotonesTienda === "function") actualizarBotonesTienda();
        };
        img.onerror = intentarSiguiente;
        img.src = ruta;
    }
    intentarSiguiente();
}

// --- Utilidades seguras de almacenamiento ---
function leerJSONSeguro(texto, respaldo) {
    if (!texto || typeof texto !== "string") return respaldo;
    try {
        const parsed = JSON.parse(texto);
        return parsed !== null && parsed !== undefined ? parsed : respaldo;
    } catch (e) {
        return respaldo;
    }
}

let sesion = null;
function claveAlmacen(k) { return sesion ? `gc_${sesion.uid}_${k}` : `gc_local_${k}`; }
function leerNumero(k) {
    try { return Number(localStorage.getItem(claveAlmacen(k))) || 0; } catch (e) { return 0; }
}
function leerTexto(k, def) {
    try { return localStorage.getItem(claveAlmacen(k)) || def; } catch (e) { return def; }
}
function leerLista(k, def) {
    const v = leerJSONSeguro(leerTexto(k, ""), def);
    return Array.isArray(v) ? v : def;
}
function leerObjeto(k, def) {
    const v = leerJSONSeguro(leerTexto(k, ""), def);
    return v && typeof v === "object" && !Array.isArray(v) ? v : def;
}
function guardarLocal(k, v) {
    try { localStorage.setItem(claveAlmacen(k), v); } catch (e) {}
}
function guardar(k, v) {
    guardarLocal(k, v);
    guardarLocal("actualizado", Date.now());
    if (typeof programarSubidaNube === "function") programarSubidaNube();
}

let record = leerNumero("record");
let monedas = leerNumero("monedas");
let capturasTotales = leerNumero("capturasTotales");
let victorias1v1 = leerNumero("victorias1v1");
let misionesReclamadas = leerObjeto("misionesReclamadas", {});
let experienciaRaton = leerNumero("experienciaRaton");
let dificultad = Math.min(3, Math.max(1, leerNumero("dificultad") || 1));
let velocidadGato = DIFICULTADES[dificultad - 1].velGato;
let skinsCompradas = leerLista("skinsCompradas", ["🐱"]);
if (!skinsCompradas.includes("🐱")) skinsCompradas.push("🐱");
let nivelesSkins = leerObjeto("nivelesSkins", { "🐱": 1 });
let skinActual = leerTexto("skin", "🐱");
if (skinActual !== "custom_cat" && !skinsCompradas.includes(skinActual)) skinActual = "🐱";

let sonidoActivo = leerTexto("sonido", "1") === "1";
let musicaActiva = leerTexto("musica", "1") === "1";

let juegoIniciado = false;
let pausado = false;
let tiempo = DURACION_PARTIDA;
let puntos = 0;
let nivel = 1;
let monedasPartida = 0;
let ultimoSegundoMostrado = null;

// Variables de estado Multijugador 1v1
let modoMulti = false;
let modoJefeFacilier = false;
let rolMulti = null;
let esAnfitrionMulti = false;
let salaId = null;
let enFlujoMulti = false;
let desuscribirSala = null;
let desuscribirRival = null;
let skinGatoSala = "🐱";
let customGatoSala = null;
let ganadoraMulti = null;
let destinoRemoto = { x: 100, y: 200 };
let ultimaPosEnviada = { x: -1, y: -1 };
let ultimoSegundoEnviado = -1;
let ultimaSyncRed = 0;

// Variables de habilidades y mundo abierto
let cooldownHabilidad = 0;
let habilidadActivaTipo = null;
let habilidadActivaTimer = 0;
let ratonAturdidoTimer = 0;

let vidasGato = 3;
let modoFuriaTimer = 0;
let invulnerableTimer = 0;
let perroAturdidoTimer = 0;
let cooldownPortal = 0;

const teclas = { arriba: false, abajo: false, izquierda: false, derecha: false };
// Joystick virtual táctil normalizado (-1 a 1)
const toque = { activo: false, pointerId: null, origenX: 0, origenY: 0, dx: 0, dy: 0 };

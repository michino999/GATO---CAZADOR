// ============================================================
//  IA DEL RATÓN: RED NEURONAL + APRENDIZAJE POR REFUERZO (DQN)
// ============================================================
const ENTRADAS_RED = 6;
const OCULTAS_RED = 24;
const SALIDAS_RED = 8;
const CLAVE_RED = "redRatonV1";
const TASA_APRENDIZAJE = 0.01;
const DESCUENTO = 0.9;
const TAMANO_LOTE = 32;
const MEMORIA_MAX = 4000;
const PREMIO_VIVO = 0.1;
const CASTIGO_CAPTURA_RED = -10;
const SEGUNDOS_ENTRE_DECISIONES = 0.2;

function crearRed() {
    const aleatorio = () => Math.random() * 2 - 1;
    return {
        w1: Array.from({ length: OCULTAS_RED * (ENTRADAS_RED + 1) }, () => aleatorio() / Math.sqrt(ENTRADAS_RED)),
        w2: Array.from({ length: SALIDAS_RED * (OCULTAS_RED + 1) }, () => aleatorio() / Math.sqrt(OCULTAS_RED))
    };
}

let redRaton = (() => {
    try {
        const guardada = JSON.parse(localStorage.getItem(CLAVE_RED));
        if (guardada && guardada.w1 && guardada.w2) return guardada;
    } catch (e) {}
    return crearRed();
})();

function guardarRed() {
    try {
        localStorage.setItem(CLAVE_RED, JSON.stringify(redRaton));
        localStorage.setItem("partidasEntrenadasRed", partidasEntrenadas);
    } catch (e) {}
}

function tanh(x) { return Math.tanh(x); }
function dTanh(y) { return 1 - y * y; }

function propagarRed(entrada, red) {
    const ocultas = new Float64Array(OCULTAS_RED);
    for (let i = 0; i < OCULTAS_RED; i++) {
        let suma = red.w1[i * (ENTRADAS_RED + 1)];
        for (let j = 0; j < ENTRADAS_RED; j++) suma += entrada[j] * red.w1[i * (ENTRADAS_RED + 1) + j + 1];
        ocultas[i] = tanh(suma);
    }
    const salidas = new Float64Array(SALIDAS_RED);
    for (let i = 0; i < SALIDAS_RED; i++) {
        let suma = red.w2[i * (OCULTAS_RED + 1)];
        for (let j = 0; j < OCULTAS_RED; j++) suma += ocultas[j] * red.w2[i * (OCULTAS_RED + 1) + j + 1];
        salidas[i] = suma;
    }
    return { ocultas, salidas };
}

function entrenarLote(lote, red) {
    if (lote.length === 0) return;
    for (const exp of lote) {
        const resAnt = propagarRed(exp.estado, red);
        const resNuevo = propagarRed(exp.estadoNuevo, red);
        let maxQuesNuevo = resNuevo.salidas[0];
        for (let i = 1; i < SALIDAS_RED; i++) if (resNuevo.salidas[i] > maxQuesNuevo) maxQuesNuevo = resNuevo.salidas[i];

        const objetivoQ = new Float64Array(resAnt.salidas);
        objetivoQ[exp.accion] = exp.recompensa + DESCUENTO * maxQuesNuevo;

        const gradSalidas = new Float64Array(SALIDAS_RED);
        for (let i = 0; i < SALIDAS_RED; i++) gradSalidas[i] = objetivoQ[i] - resAnt.salidas[i];

        const gradOcultas = new Float64Array(OCULTAS_RED);
        for (let i = 0; i < OCULTAS_RED; i++) {
            let error = 0;
            for (let j = 0; j < SALIDAS_RED; j++) error += gradSalidas[j] * red.w2[j * (OCULTAS_RED + 1) + i + 1];
            gradOcultas[i] = error * dTanh(resAnt.ocultas[i]);
        }

        for (let i = 0; i < SALIDAS_RED; i++) {
            red.w2[i * (OCULTAS_RED + 1)] += TASA_APRENDIZAJE * gradSalidas[i];
            for (let j = 0; j < OCULTAS_RED; j++) red.w2[i * (OCULTAS_RED + 1) + j + 1] += TASA_APRENDIZAJE * gradSalidas[i] * resAnt.ocultas[j];
        }
        for (let i = 0; i < OCULTAS_RED; i++) {
            red.w1[i * (ENTRADAS_RED + 1)] += TASA_APRENDIZAJE * gradOcultas[i];
            for (let j = 0; j < ENTRADAS_RED; j++) red.w1[i * (ENTRADAS_RED + 1) + j + 1] += TASA_APRENDIZAJE * gradOcultas[i] * exp.estado[j];
        }
    }
}

const ACCIONES_IA = [
    { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
    { dx: -0.707, dy: -0.707 }, { dx: 0.707, dy: -0.707 },
    { dx: -0.707, dy: 0.707 }, { dx: 0.707, dy: 0.707 }
];

let partidasEntrenadas = Number(localStorage.getItem("partidasEntrenadasRed")) || 0;
let temporizadorDecisionIA = 0;
let ultimoEstadoIA = null;
let ultimaAccionIA = null;
let accionActualRaton = ACCIONES_IA[0];
let memoria = [];

function obtenerEstadoRed(rx, ry, gx, gy) {
    return [rx / ANCHO_MUNDO, ry / ALTO_MUNDO, gx / ANCHO_MUNDO, gy / ALTO_MUNDO, (gx - rx) / ANCHO_MUNDO, (gy - ry) / ALTO_MUNDO];
}

function entrenarIAAcelerado() {
    const numPartidas = 50;
    let capturasSim = 0;
    for (let p = 0; p < numPartidas; p++) {
        let simGato = { x: Math.random() * (ANCHO_MUNDO - 35), y: Math.random() * (ALTO_MUNDO - 35) };
        let simRaton = { x: Math.random() * (ANCHO_MUNDO - 28), y: Math.random() * (ALTO_MUNDO - 28) };
        for (let s = 0; s < 150; s++) {
            const estado = obtenerEstadoRed(simRaton.x, simRaton.y, simGato.x, simGato.y);
            const res = propagarRed(estado, redRaton);
            let accion = 0;
            if (Math.random() < 0.2) accion = Math.floor(Math.random() * SALIDAS_RED);
            else {
                let maxQ = res.salidas[0];
                for (let i = 1; i < SALIDAS_RED; i++) if (res.salidas[i] > maxQ) { maxQ = res.salidas[i]; accion = i; }
            }
            const mov = ACCIONES_IA[accion];
            simRaton.x = Math.max(0, Math.min(ANCHO_MUNDO - 28, simRaton.x + mov.dx * 4.5));
            simRaton.y = Math.max(0, Math.min(ALTO_MUNDO - 28, simRaton.y + mov.dy * 4.5));
            const dx = simRaton.x - simGato.x;
            const dy = simRaton.y - simGato.y;
            const dist = Math.hypot(dx, dy) || 1;
            simGato.x = Math.max(0, Math.min(ANCHO_MUNDO - 35, simGato.x + (dx / dist) * 4.8));
            simGato.y = Math.max(0, Math.min(ALTO_MUNDO - 35, simGato.y + (dy / dist) * 4.8));
            const distDespues = Math.hypot(simRaton.x - simGato.x, simRaton.y - simGato.y);
            const estadoNuevo = obtenerEstadoRed(simRaton.x, simRaton.y, simGato.x, simGato.y);
            if (distDespues < 34) {
                capturasSim++;
                memoria.push({ estado, accion, recompensa: CASTIGO_CAPTURA_RED, estadoNuevo });
                break;
            }
            memoria.push({ estado, accion, recompensa: PREMIO_VIVO, estadoNuevo });
            if (memoria.length > MEMORIA_MAX) memoria.shift();
        }
        if (memoria.length >= TAMANO_LOTE) {
            const lote = [];
            for (let i = 0; i < TAMANO_LOTE; i++) lote.push(memoria[Math.floor(Math.random() * memoria.length)]);
            entrenarLote(lote, redRaton);
        }
    }
    partidasEntrenadas += numPartidas;
    experienciaRaton += Math.floor(capturasSim / 2) + 5;
    guardarRed();
    guardar("experienciaRaton", experienciaRaton);
    actualizarNivelVisualIA();
    sonar("nivel");
    mostrarLogro(`🧠 ¡Red Neuronal entrenada (${partidasEntrenadas} partidas)!`);
}

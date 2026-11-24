// ============================================================
//  SECRETOS: TATE NORMAL + TATE CON SOMBRERO + TATE DR. FACILIER
// ============================================================
const PATRON_SECRETO = ["arriba", "arriba", "abajo", "abajo", "izquierda", "derecha", "izquierda", "derecha"];
const PATRON_INFIERNO = ["izquierda", "derecha", "arriba", "abajo", "izquierda", "derecha", "arriba", "abajo", "arriba", "arriba", "abajo", "abajo"];
const PATRON_FACILIER = ["arriba", "abajo", "arriba", "abajo", "izquierda", "derecha", "arriba", "abajo"];
const PAUSA_MAX_PATRON = 3000;
const PREGUNTAS_POR_INTENTO = 5;
const PREGUNTAS_INFIERNO_CANTIDAD = 10;
const RETRASO_ACIERTO = 700;
const RETRASO_FALLO = 2400;

const PREGUNTAS = [
    { pregunta: "¿Cuántas horas al día duerme, en promedio, un gato adulto?", opciones: ["De 3 a 5 horas", "Unas 8 horas", "De 12 a 16 horas", "Casi 22 horas"], correcta: 2 },
    { pregunta: "¿Qué diosa del antiguo Egipto se representaba con cabeza de gata?", opciones: ["Bastet", "Hathor", "Isis", "Neftis"], correcta: 0 },
    { pregunta: "En Japón, ¿cómo se llama el gato de la suerte que levanta una pata?", opciones: ["Maneki-neko", "Daruma", "Tanuki", "Kitsune"], correcta: 0 },
    { pregunta: "¿Cómo se llama el gato de sonrisa gigante que aparece en «Alicia en el país de las maravillas»?", opciones: ["El gato de Cheshire", "Garfield", "El gato con botas", "Félix"], correcta: 0 },
    { pregunta: "¿Cómo se llama el gesto del gato de presionar con las patas delanteras sobre una superficie blanda?", opciones: ["Amasar", "Rasguñar", "Marcar", "Cazar"], correcta: 0 },
    { pregunta: "¿Qué sabor NO pueden percibir los gatos?", opciones: ["Dulce", "Salado", "Amargo", "Ácido"], correcta: 0 },
    { pregunta: "Si un gato se acerca a ti con la cola levantada, ¿qué suele significar?", opciones: ["Que te saluda con confianza", "Que quiere pelear", "Que tiene mucho frío", "Que se va a dormir"], correcta: 0 },
    { pregunta: "¿Qué famoso experimento mental de la física usa a un gato dentro de una caja?", opciones: ["El gato de Schrödinger", "El péndulo de Foucault", "La paradoja de Zenón", "La rueda de Faraday"], correcta: 0 },
    { pregunta: "¿De qué animal salvaje descienden los gatos domésticos?", opciones: ["Del gato montés (Felis silvestris lybica)", "Del lince ibérico", "Del leopardo", "Del tigre"], correcta: 0 },
    { pregunta: "¿Qué gato naranja de las tiras cómicas es famoso por amar la lasaña?", opciones: ["Garfield", "Tom", "Silvestre", "Félix"], correcta: 0 },
    { pregunta: "¿De qué color es la nariz de Tate?", opciones: ["Rosada", "Negra", "Azul", "Verde"], correcta: 0 }
];

const PREGUNTAS_INFIERNO = [
    { pregunta: "¿Cuántos músculos independientes tiene un gato en CADA oreja?", opciones: ["32 músculos", "12 músculos", "18 músculos", "44 músculos"], correcta: 0 },
    { pregunta: "¿Cuántos huesos tiene en total el esqueleto de un gato adulto promedio?", opciones: ["230 a 244 huesos", "206 huesos", "185 huesos", "310 huesos"], correcta: 0 },
    { pregunta: "¿Cómo se llama el órgano en el paladar del gato que analiza feromonas (respuesta Flehmen)?", opciones: ["Órgano de Jacobson (vomeronasal)", "Órgano de Corti", "Glándula de Meibomio", "Bulbo de Krause"], correcta: 0 },
    { pregunta: "¿Cómo se llamaba la primera y única gata en viajar al espacio exterior (en 1963)?", opciones: ["Félicette", "Laika", "Belka", "Miss Baker"], correcta: 0 },
    { pregunta: "¿A qué frecuencia (en Hz) ronronea un gato para estimular la regeneración ósea?", opciones: ["Entre 25 y 150 Hz", "Entre 5 y 10 Hz", "Entre 400 y 600 Hz", "Más de 1.000 Hz"], correcta: 0 },
    { pregunta: "¿Cuál es la velocidad máxima que puede alcanzar un gato doméstico en carrera corta?", opciones: ["Unos 48 km/h", "Unos 22 km/h", "Unos 75 km/h", "Unos 95 km/h"], correcta: 0 },
    { pregunta: "¿Cuántos dedos en total tiene normalmente un gato (sumando patas delanteras y traseras)?", opciones: ["18 dedos (5 adelante, 4 atrás)", "20 dedos (5 en cada pata)", "16 dedos (4 en cada pata)", "22 dedos"], correcta: 0 },
    { pregunta: "¿Qué estructura reflectante detrás de la retina hace que los ojos de los gatos brillen de noche?", opciones: ["Tapetum lucidum", "Fóvea centralis", "Córnea vítrea", "Humor acuoso"], correcta: 0 },
    { pregunta: "En Gato Cazador, ¿cuántas entradas y neuronas ocultas tiene la Red Neuronal del ratón?", opciones: ["6 entradas y 24 ocultas", "4 entradas y 12 ocultas", "8 entradas y 32 ocultas", "10 entradas y 16 ocultas"], correcta: 0 },
    { pregunta: "¿Qué gato fue alcalde honorario de Talkeetna (Alaska) durante 20 años?", opciones: ["Stubbs", "Tama", "Larry", "Hank"], correcta: 0 }
];

let patronEntrada = [];
let ultimaEntradaPatron = 0;
let toquesFacilier = 0;
let ultimoToqueFacilier = 0;
let quiz = null;
let temporizadorQuiz = null;

function verificarRequisitosInfierno() {
    const faltan = [];
    if (!skinsCompradas.includes("tate")) faltan.push("1. Tener a Tate normal");
    if (obtenerNivelSkin("tate") < MAX_NIVEL_MEJORA) faltan.push(`2. Tate al LVL 5 (tienes LVL ${obtenerNivelSkin("tate")})`);
    if (record < 45) faltan.push(`3. Récord de 45+ puntos (tienes ${record})`);
    if (capturasTotales < 250) faltan.push(`4. 250+ capturas totales (tienes ${capturasTotales})`);
    if (monedas < 3000) faltan.push(`5. Tener 3000 🪙 de tributo (tienes ${monedas})`);
    return faltan;
}

function toqueSecretoFacilier() {
    if (juegoIniciado || pantallaActual !== "menu-inicio") return;
    const ahora = Date.now();
    if (ahora - ultimoToqueFacilier > 1800) toquesFacilier = 0;
    ultimoToqueFacilier = ahora;
    toquesFacilier++;
    if (toquesFacilier >= 7) {
        toquesFacilier = 0;
        intentarDueloFacilier();
    }
}

function intentarRitualInfierno() {
    const faltan = verificarRequisitosInfierno();
    if (faltan.length > 0) {
        sonar("error");
        alert("🔥 RITUAL DE TATE CON SOMBRERO BLOQUEADO 🔥\n\nPara entrar a la Prueba del Infierno necesitas cumplir TODO esto:\n\n" + faltan.join("\n"));
        return;
    }
    abrirQuiz("infierno");
}

function mezclar(lista) {
    const copia = lista.slice();
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}

function registrarPatron(direccion) {
    const ahora = Date.now();
    if (ahora - ultimaEntradaPatron > PAUSA_MAX_PATRON) patronEntrada = [];
    ultimaEntradaPatron = ahora;
    patronEntrada.push(direccion);
    if (patronEntrada.length > PATRON_INFIERNO.length) patronEntrada.shift();

    if (patronEntrada.length === PATRON_INFIERNO.length && patronEntrada.every((d, i) => d === PATRON_INFIERNO[i])) {
        patronEntrada = [];
        if (skinsCompradas.includes("tate_sombrero")) mostrarLogro("🎩 Ya tienes a Tate con Sombrero");
        else intentarRitualInfierno();
        return;
    }

    const ultimasFacilier = patronEntrada.slice(-PATRON_FACILIER.length);
    if (ultimasFacilier.length === PATRON_FACILIER.length && ultimasFacilier.every((d, i) => d === PATRON_FACILIER[i])) {
        patronEntrada = [];
        intentarDueloFacilier();
        return;
    }

    const ultimas8 = patronEntrada.slice(-PATRON_SECRETO.length);
    if (ultimas8.length === PATRON_SECRETO.length && ultimas8.every((d, i) => d === PATRON_SECRETO[i])) {
        patronEntrada = [];
        abrirQuiz("tate");
    }
}

function abrirQuiz(modo) {
    const cajaFoto = document.getElementById("quiz-foto-tate");
    const imgFoto = document.getElementById("quiz-img-tate");
    if (cajaFoto && imgFoto) {
        imgFoto.src = cacheDataUrlSkins["tate.png"] || "tate.png";
        cajaFoto.style.display = "block";
    }

    if (modo === "infierno") {
        const elegidas = mezclar(PREGUNTAS_INFIERNO).slice(0, PREGUNTAS_INFIERNO_CANTIDAD).map((p) => ({
            texto: p.pregunta,
            opciones: mezclar(p.opciones.map((texto, i) => ({ texto: texto, ok: i === p.correcta })))
        }));
        quiz = { modo: "infierno", preguntas: elegidas, indice: 0, bloqueado: false };
        document.getElementById("quiz-titulo").textContent = "🔥 PRUEBA DEL INFIERNO 🔥";
        sonar("record");
        cambiarPantalla("menu-quiz");
        mostrarPregunta();
        return;
    }

    if (skinsCompradas.includes("tate")) {
        mostrarLogro("Ya encontraste a Tate ⭐ (Sigue el camino del Infierno para su Sombrero 🎩)");
        return;
    }
    const elegidas = mezclar(PREGUNTAS).slice(0, PREGUNTAS_POR_INTENTO).map((p) => ({
        texto: p.pregunta,
        opciones: mezclar(p.opciones.map((texto, i) => ({ texto: texto, ok: i === p.correcta })))
    }));
    quiz = { modo: "tate", preguntas: elegidas, indice: 0, bloqueado: false };
    document.getElementById("quiz-titulo").textContent = "⭐ DESAFÍO SECRETO DE TATE ⭐";
    sonar("equipar");
    cambiarPantalla("menu-quiz");
    mostrarPregunta();
}

function mostrarPregunta() {
    const pregunta = quiz.preguntas[quiz.indice];
    document.getElementById("quiz-progreso").textContent = `Pregunta ${quiz.indice + 1} de ${quiz.preguntas.length}`;
    document.getElementById("quiz-pregunta").textContent = pregunta.texto;
    document.getElementById("quiz-mensaje").textContent = "";
    const contenedor = document.getElementById("quiz-opciones");
    contenedor.textContent = "";
    pregunta.opciones.forEach((opcion) => {
        const boton = document.createElement("button");
        boton.textContent = opcion.texto;
        boton.className = "tactical-btn";
        boton.style.margin = "6px 0";
        boton.onclick = () => responderQuiz(opcion, boton);
        contenedor.appendChild(boton);
    });
    quiz.bloqueado = false;
}

function responderQuiz(opcion, boton) {
    if (!quiz || quiz.bloqueado) return;
    quiz.bloqueado = true;
    const mensaje = document.getElementById("quiz-mensaje");
    if (opcion.ok) {
        boton.className = "tactical-btn btn-green";
        mensaje.textContent = "¡Correcto!";
        sonar("equipar");
        temporizadorQuiz = setTimeout(() => {
            if (!quiz) return;
            quiz.indice++;
            if (quiz.indice >= quiz.preguntas.length) terminarQuiz(true);
            else mostrarPregunta();
        }, RETRASO_ACIERTO);
    } else {
        boton.className = "tactical-btn btn-danger";
        const buena = quiz.preguntas[quiz.indice].opciones.find((o) => o.ok).texto;
        if (quiz.modo === "infierno") {
            const multa = Math.min(monedas, 500);
            monedas -= multa;
            guardar("monedas", monedas);
            mensaje.textContent = `💀 ¡FALLASTE EN EL INFIERNO! Perdiste ${multa} 🪙. Era: ${buena}`;
        } else {
            mensaje.textContent = "Incorrecto. La respuesta era: " + buena;
        }
        sonar("error");
        temporizadorQuiz = setTimeout(() => terminarQuiz(false), RETRASO_FALLO);
    }
}

function terminarQuiz(exito) {
    clearTimeout(temporizadorQuiz);
    const modoTerminado = quiz ? quiz.modo : "tate";
    quiz = null;
    entrarAlMenu();
    if (exito) {
        if (modoTerminado === "infierno") desbloquearTateSombrero();
        else desbloquearTate();
    } else {
        mostrarLogro(modoTerminado === "infierno" ? "🔥 El Infierno te derrotó... ¡vuelve cuando estés listo!" : "Casi... ¡vuelve a intentarlo!");
    }
}

function salirQuiz() {
    clearTimeout(temporizadorQuiz);
    quiz = null;
    entrarAlMenu();
}

function desbloquearTate() {
    if (!skinsCompradas.includes("tate")) {
        skinsCompradas.push("tate");
        nivelesSkins["tate"] = 1;
        guardar("skinsCompradas", JSON.stringify(skinsCompradas));
        guardar("nivelesSkins", JSON.stringify(nivelesSkins));
    }
    construirTienda();
    sonar("record");
    equiparSkin("tate", "⭐ ¡Encontraste a Tate!");
    actualizarBotonesTienda();
    actualizarNivelVisualIA();
}

function desbloquearTateSombrero() {
    if (monedas < 3000) {
        sonar("error");
        mostrarLogro("No tienes los 3000 🪙 del tributo final");
        return;
    }
    monedas -= 3000;
    guardar("monedas", monedas);
    if (!skinsCompradas.includes("tate_sombrero")) {
        skinsCompradas.push("tate_sombrero");
        nivelesSkins["tate_sombrero"] = 1;
        guardar("skinsCompradas", JSON.stringify(skinsCompradas));
        guardar("nivelesSkins", JSON.stringify(nivelesSkins));
    }
    construirTienda();
    sonar("record");
    equiparSkin("tate_sombrero", "🎩🔥 ¡SOBREVIVISTE AL INFIERNO! Tate con Sombrero es tuyo");
    actualizarBotonesTienda();
    actualizarNivelVisualIA();
}

// ============================================================
//  CONTROL PRINCIPAL: FLUJO DE PARTIDA, HABILIDADES Y UI
// ============================================================
const DESCRIPCIONES_PODER = {
    overdrive: {
        nombre: "Turbo Felino",
        texto: "⚡ <strong>Turbo Felino:</strong> Aumenta tu velocidad un 45% durante 3.5 segundos para alcanzar ratones rápidos."
    },
    magnet: {
        nombre: "Imán de Ratones",
        texto: "🧲 <strong>Imán de Ratones:</strong> Atrae hacia ti al ratón y a las cajas cercanas durante 3.5 segundos."
    },
    stun: {
        nombre: "Rugido Sísmico",
        texto: "💥 <strong>Rugido Sísmico:</strong> Lanza una onda que aturde al ratón por 2.5s y empuja las cajas del mapa."
    },
    blink: {
        nombre: "Teletransporte",
        texto: "🌀 <strong>Teletransporte:</strong> Te teletransporta al instante justo al lado del ratón para sorprenderlo."
    }
};

let matrizPixelActual = Array(144).fill(null);
let modoPincelPixel = "pintar";
let pintandoPixel = false;
let listenerPointerUpEditorRegistrado = false;
let ultimaCapturaTimestamp = 0;
let rachaCapturas = 0;

function iniciarEditorPixel() {
    const grid = document.getElementById("grid-pixel-gato");
    if (!grid) return;

    const datos = leerJSONSeguro(localStorage.getItem("gato_custom_usuario"), null);
    if (datos) {
        if (Array.isArray(datos.matriz) && datos.matriz.length === 144) matrizPixelActual = datos.matriz;
        if (datos.nombre) document.getElementById("custom-nombre").value = datos.nombre;
        if (datos.habilidad) document.getElementById("custom-poder").value = datos.habilidad;
        if (datos.sombrero) document.getElementById("custom-sombrero").checked = datos.sombrero;
    } else {
        const orejasYCara = [
            14, 21, 26, 27, 32, 33,
            38, 39, 40, 41, 42, 43, 44, 45,
            50, 51, 52, 53, 54, 55, 56, 57,
            62, 63, 65, 66, 68, 69,
            74, 75, 76, 77, 78, 79, 80, 81,
            87, 88, 89, 90, 91, 92
        ];
        orejasYCara.forEach((idx) => { matrizPixelActual[idx] = "#facc15"; });
        matrizPixelActual[64] = "#0f172a";
        matrizPixelActual[67] = "#0f172a";
        matrizPixelActual[77] = "#f43f5e";
    }

    grid.innerHTML = "";
    for (let i = 0; i < 144; i++) {
        const celda = document.createElement("div");
        celda.style.background = matrizPixelActual[i] || "#0f172a";
        celda.style.cursor = "crosshair";
        celda.dataset.idx = i;

        const pintarCelda = () => {
            const color = document.getElementById("pixel-color").value;
            matrizPixelActual[i] = modoPincelPixel === "pintar" ? color : null;
            celda.style.background = matrizPixelActual[i] || "#0f172a";
        };

        celda.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            pintandoPixel = true;
            pintarCelda();
        });
        celda.addEventListener("pointerenter", () => {
            if (pintandoPixel) pintarCelda();
        });
        grid.appendChild(celda);
    }

    if (!listenerPointerUpEditorRegistrado) {
        listenerPointerUpEditorRegistrado = true;
        window.addEventListener("pointerup", () => { pintandoPixel = false; });
    }
    actualizarDescripcionPoder();
}

function setModoPixel(modo) {
    modoPincelPixel = modo;
}

function limpiarGridPixel() {
    matrizPixelActual = Array(144).fill(null);
    const grid = document.getElementById("grid-pixel-gato");
    if (grid) {
        grid.querySelectorAll("div").forEach((c) => { c.style.background = "#0f172a"; });
    }
}

function actualizarDescripcionPoder() {
    const sel = document.getElementById("custom-poder");
    const desc = document.getElementById("desc-poder-custom");
    if (sel && desc && DESCRIPCIONES_PODER[sel.value]) {
        desc.innerHTML = DESCRIPCIONES_PODER[sel.value].texto;
    }
}

function obtenerSkinActivaCompleta() {
    if (skinActual === "custom_cat") {
        const custom = leerJSONSeguro(localStorage.getItem("gato_custom_usuario"), null);
        if (custom) {
            const infoPoder = DESCRIPCIONES_PODER[custom.habilidad] || DESCRIPCIONES_PODER.overdrive;
            const hex = Number.isFinite(custom.skillHex) ? custom.skillHex : 0x38bdf8;
            return {
                emoji: "custom_cat",
                nombre: custom.nombre,
                skillName: infoPoder.nombre,
                skillType: custom.habilidad || "overdrive",
                skillHex: hex,
                skillColor: "#" + hex.toString(16).padStart(6, "0"),
                skillCd: 7
            };
        }
    }
    return SKINS.find((s) => s.emoji === skinActual) || SKINS[0];
}

function aplicarGatoCustomDesdeUI() {
    const nombre = document.getElementById("custom-nombre").value.trim();
    const color = document.getElementById("pixel-color").value;
    const sombrero = document.getElementById("custom-sombrero").checked;
    const poder = document.getElementById("custom-poder").value;

    guardarGatoCustom(nombre, matrizPixelActual, color, sombrero, poder);
    guardar("skin", "custom_cat");
    if (typeof actualizarBotonesTienda === "function") actualizarBotonesTienda();
    sonar("equipar");
    mostrarLogro(`🎨 ¡${nombre || "Tu Gato Pixel"} guardado y equipado!`);
}

function actualizarBotonHabilidad() {
    const contenedor = document.getElementById("contenedor-habilidad");
    const btn = document.getElementById("btn-habilidad");
    if (!contenedor || !btn) return;

    if (modoJefeFacilier || (modoMulti && rolMulti !== "gato")) {
        contenedor.style.display = "none";
        return;
    }

    contenedor.style.display = "flex";
    const skin = obtenerSkinActivaCompleta();

    if (habilidadActivaTimer > 0) {
        btn.disabled = true;
        btn.textContent = `🔥 ¡${skin.skillName.toUpperCase()} ACTIVO! (${habilidadActivaTimer.toFixed(1)}s)`;
    } else if (cooldownHabilidad > 0) {
        btn.disabled = true;
        btn.textContent = `⏳ RECARGANDO ${skin.skillName.toUpperCase()} (${cooldownHabilidad.toFixed(1)}s)`;
    } else {
        btn.disabled = false;
        btn.textContent = `⚡ ${skin.skillName.toUpperCase()} [ESPACIO]`;
    }
}

function activarHabilidadEspecial() {
    if (!juegoIniciado || pausado || modoJefeFacilier || !escenaActiva) return;
    if (modoMulti && rolMulti !== "gato") return;
    if (cooldownHabilidad > 0 || habilidadActivaTimer > 0) return;

    const skin = obtenerSkinActivaCompleta();
    const gatoObj = escenaActiva.gatoContainer;
    const ratonObj = escenaActiva.ratonContainer;
    const colorHex = skin.skillHex || 0x38bdf8;
    const limX = modoMulti ? ANCHO_CAMARA - 30 : ANCHO_MUNDO - 30;
    const limY = modoMulti ? ALTO_CAMARA - 30 : ALTO_MUNDO - 30;

    prepararAudio();
    sonar("record");
    cooldownHabilidad = skin.skillCd || 7;
    escenaActiva.efectoAnimeCamara(`⚡ ¡${skin.skillName.toUpperCase()}!`, colorHex);

    escenaActiva.emisor.setPosition(gatoObj.x, gatoObj.y);
    escenaActiva.emisor.explode(26);

    if (skin.skillType === "stun") {
        ratonAturdidoTimer = 2.5;
        habilidadActivaTipo = "stun";
        habilidadActivaTimer = 2.5;
        const ang = Phaser.Math.Angle.Between(gatoObj.x, gatoObj.y, ratonObj.x, ratonObj.y);
        ratonObj.body.setVelocity(Math.cos(ang) * 420, Math.sin(ang) * 420);
        escenaActiva.cajas.getChildren().forEach((caja) => {
            const a = Phaser.Math.Angle.Between(gatoObj.x, gatoObj.y, caja.x, caja.y);
            caja.body.setVelocity(Math.cos(a) * 380, Math.sin(a) * 380);
        });
        escenaActiva.textoFlotante(ratonObj.x, ratonObj.y - 20, "¡RUGIDO SÍSMICO!", skin.skillColor);
    } else if (skin.skillType === "blink") {
        const ang = Phaser.Math.Angle.Between(ratonObj.x, ratonObj.y, gatoObj.x, gatoObj.y);
        const nx = Phaser.Math.Clamp(ratonObj.x + Math.cos(ang) * 48, 30, limX);
        const ny = Phaser.Math.Clamp(ratonObj.y + Math.sin(ang) * 48, 30, limY);
        gatoObj.setPosition(nx, ny);
        escenaActiva.emisor.setPosition(nx, ny);
        escenaActiva.emisor.explode(26);
        habilidadActivaTipo = "blink";
        habilidadActivaTimer = 0.6;
    } else if (skin.skillType === "magnet") {
        habilidadActivaTipo = "magnet";
        habilidadActivaTimer = 3.5;
    } else if (skin.skillType === "voodoo") {
        ratonObj.setPosition(
            Phaser.Math.Clamp(gatoObj.x + (Math.random() < 0.5 ? 50 : -50), 30, limX),
            Phaser.Math.Clamp(gatoObj.y + (Math.random() < 0.5 ? 50 : -50), 30, limY)
        );
        ratonAturdidoTimer = 2.0;
        escenaActiva.emisor.setPosition(ratonObj.x, ratonObj.y);
        escenaActiva.emisor.explode(28);
        escenaActiva.textoFlotante(ratonObj.x, ratonObj.y - 20, "¡TRATO VUDÚ!", "#c084fc");
        habilidadActivaTipo = "voodoo";
        habilidadActivaTimer = 2.0;
    } else {
        habilidadActivaTipo = "overdrive";
        habilidadActivaTimer = 3.5;
    }

    if (typeof ejecutarAnimacionHabilidad === "function" && escenaActiva) {
        ejecutarAnimacionHabilidad(escenaActiva, skin, gatoObj.x, gatoObj.y, ratonObj.x, ratonObj.y);
    }

    actualizarBotonHabilidad();
}

function procesarCapturaPhaser() {
    if (!escenaActiva || !juegoIniciado) return;

    if (modoJefeFacilier) {
        terminarDueloFacilier(false);
        return;
    }

    if (modoMulti) {
        if (esAnfitrionMulti && juegoIniciado) {
            ganadoraMulti = "gato";
            nube.actualizarSala(salaId, { estado: "fin", ganador: "gato", tiempo: Math.max(0, Math.ceil(tiempo)) }).catch(() => {});
            terminarJuegoMulti("gato");
        }
        return;
    }

    const dif = DIFICULTADES[dificultad - 1];
    const gatoObj = escenaActiva.gatoContainer;
    const ratonObj = escenaActiva.ratonContainer;

    if (ultimoEstadoIA !== null && ultimaAccionIA !== null) {
        const estadoActual = obtenerEstadoRed(ratonObj.x, ratonObj.y, gatoObj.x, gatoObj.y);
        memoria.push({ estado: ultimoEstadoIA, accion: ultimaAccionIA, recompensa: CASTIGO_CAPTURA_RED, estadoNuevo: estadoActual });
        if (memoria.length > MEMORIA_MAX) memoria.shift();
        if (memoria.length >= TAMANO_LOTE) {
            const lote = [];
            for (let i = 0; i < TAMANO_LOTE; i++) lote.push(memoria[Math.floor(Math.random() * memoria.length)]);
            entrenarLote(lote, redRaton);
            guardarRed();
        }
        ultimoEstadoIA = null;
        ultimaAccionIA = null;
    }

    // Sistema de racha rápida (Combo)
    const ahora = Date.now();
    if (ahora - ultimaCapturaTimestamp <= 4200) {
        rachaCapturas = Math.min(4, rachaCapturas + 1);
    } else {
        rachaCapturas = 1;
    }
    ultimaCapturaTimestamp = ahora;

    const bonusCombo = rachaCapturas > 1 ? (rachaCapturas - 1) * 2 : 0;
    const monedasGanadas = Math.round(dif.monedasPorCaptura * bonusMonedasSkin(skinActual)) + bonusCombo;

    escenaActiva.emisor.setPosition(ratonObj.x, ratonObj.y);
    escenaActiva.emisor.explode(18);
    const textoPremio = rachaCapturas > 1 ? `+${monedasGanadas} 🪙 (COMBO x${rachaCapturas})` : `+${monedasGanadas} 🪙`;
    escenaActiva.textoFlotante(ratonObj.x, ratonObj.y - 16, textoPremio, "#fbbf24");
    escenaActiva.cameras.main.shake(120, 0.007);

    if (cooldownHabilidad > 0) {
        cooldownHabilidad = Math.max(0, cooldownHabilidad - 0.6);
    }

    puntos++;
    capturasTotales++;
    monedas += monedasGanadas;
    monedasPartida += monedasGanadas;
    experienciaRaton++;

    guardar("monedas", monedas);
    guardar("capturasTotales", capturasTotales);
    guardar("experienciaRaton", experienciaRaton);

    const nivelNuevo = Math.floor(puntos / CAPTURAS_POR_NIVEL) + 1;
    if (nivelNuevo > nivel) {
        nivel = nivelNuevo;
        tiempo += BONUS_TIEMPO_NIVEL;
        escenaActiva.ratonTexto.setText(RATONES[Math.floor((nivel - 1) / NIVELES_POR_RATON) % RATONES.length]);
        mostrarLogro(`¡Nivel ${nivel}! +${BONUS_TIEMPO_NIVEL}s extra`);
        sonar("nivel");
    } else {
        sonar("captura");
    }

    actualizarMarcador();
    actualizarNivelVisualIA();
    escenaActiva.reaparecerRatonSeguro();
}

let timerToast = null;
function mostrarLogro(texto) {
    const el = document.getElementById("toast-logro");
    if (!el) return;
    el.textContent = texto;
    el.classList.add("visible");
    clearTimeout(timerToast);
    timerToast = setTimeout(() => el.classList.remove("visible"), 3000);
}

function sincronizarMonedasUI() {
    ["monedas-header", "monedas-tienda", "monedas-valor"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.innerText = monedas;
    });
}

function abrirMisiones() {
    renderizarMisiones();
    cambiarPantalla("menu-misiones");
}

function actualizarNivelVisualIA() {
    const nivelIA = Math.min(10, Math.floor(experienciaRaton / 25) + 1);
    const elNivel = document.getElementById("ia-nivel-texto");
    if (elNivel) elNivel.textContent = `LVL ${nivelIA}/10`;
    const elStats = document.getElementById("ia-stats-texto");
    if (elStats) elStats.textContent = `Partidas simuladas: ${partidasEntrenadas} · Exp: ${experienciaRaton}`;

    const contenedor = document.getElementById("ia-barra-segmentos");
    if (contenedor) {
        contenedor.textContent = "";
        for (let i = 1; i <= 10; i++) {
            const seg = document.createElement("div");
            seg.className = "ia-seg" + (i <= nivelIA ? " activo" : "");
            contenedor.appendChild(seg);
        }
    }

    const badgeInfierno = document.getElementById("badge-tate-infierno");
    if (badgeInfierno) badgeInfierno.style.display = skinsCompradas.includes("tate_sombrero") ? "inline-block" : "none";
    const badgeFacilier = document.getElementById("badge-tate-facilier");
    if (badgeFacilier) badgeFacilier.style.display = skinsCompradas.includes("tate_facilier") ? "inline-block" : "none";

    const elementoRecord = document.getElementById("record-valor");
    if (elementoRecord) elementoRecord.innerText = record;
    const elCapturas = document.getElementById("capturas-totales-valor");
    if (elCapturas) elCapturas.innerText = capturasTotales;
    sincronizarMonedasUI();
    renderizarMisiones();
}

function actualizarMarcador() {
    document.getElementById("puntos-valor").innerText = puntos;
    sincronizarMonedasUI();
    document.getElementById("nivel-valor").innerText = nivel;
    document.getElementById("tiempo-valor").innerText = Math.max(0, Math.ceil(tiempo));
}

const PANTALLAS = ["menu-inicio", "menu-misiones", "menu-multi", "menu-sala", "menu-ajustes", "menu-tienda", "menu-quiz", "fin-juego", "zona-juego"];
let pantallaActual = "menu-inicio";

function cambiarPantalla(pantallaObjetivo) {
    pantallaActual = pantallaObjetivo;
    if (document.activeElement && document.activeElement.tagName === "BUTTON") {
        document.activeElement.blur();
    }
    PANTALLAS.forEach((id) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.style.display = "none";
    });

    document.querySelectorAll(".nav-link-btn").forEach((b) => b.classList.remove("active"));
    if (pantallaObjetivo === "menu-inicio") document.getElementById("nav-inicio")?.classList.add("active");
    if (pantallaObjetivo === "menu-misiones") document.getElementById("nav-misiones")?.classList.add("active");
    if (pantallaObjetivo === "menu-tienda") document.getElementById("nav-tienda")?.classList.add("active");
    if (pantallaObjetivo === "menu-ajustes") document.getElementById("nav-ajustes")?.classList.add("active");

    if (pantallaObjetivo === "zona-juego") {
        document.getElementById("zona-juego").style.display = "flex";
        document.getElementById("marcador").style.display = "flex";
    } else if (pantallaObjetivo === "menu-inicio") {
        document.getElementById("menu-inicio").style.display = "grid";
    } else {
        const pantalla = document.getElementById(pantallaObjetivo);
        if (pantalla) pantalla.style.display = "block";
    }
}

function empezarJuego() {
    modoMulti = false;
    modoJefeFacilier = false;
    rolMulti = null;
    esAnfitrionMulti = false;

    juegoIniciado = true;
    pausado = false;
    toque.activo = false;
    toque.dx = 0;
    toque.dy = 0;
    tiempo = DURACION_PARTIDA;
    puntos = 0;
    nivel = 1;
    monedasPartida = 0;
    rachaCapturas = 0;
    ultimaCapturaTimestamp = 0;
    ultimoSegundoMostrado = null;
    temporizadorDecisionIA = 0;
    ultimoEstadoIA = null;
    ultimaAccionIA = null;

    cooldownHabilidad = 0;
    habilidadActivaTipo = null;
    habilidadActivaTimer = 0;
    ratonAturdidoTimer = 0;
    teclas.arriba = teclas.abajo = teclas.izquierda = teclas.derecha = false;

    document.getElementById("marcador-rol").style.display = "none";
    document.getElementById("marcador-puntos").style.display = "";
    document.getElementById("marcador-monedas").style.display = "";
    document.getElementById("marcador-nivel").style.display = "";

    actualizarBotonHabilidad();
    actualizarMarcador();
    cambiarPantalla("zona-juego");
    iniciarMotorPhaser();
    sincronizarMusica();
}

function intentarDueloFacilier() {
    if (skinsCompradas.includes("tate_facilier")) {
        equiparSkin("tate_facilier", "🎩 Ya venciste a Tate Dr. Facilier");
        actualizarBotonesTienda();
        return;
    }

    const acepta = confirm(
        "🎩✨ ¡TRATO CON EL OTRO LADO! ✨🎩\n\n" +
        "Tate Dr. Facilier aparece con su sombrero vudú y cartas flotantes:\n" +
        "• Los papeles se invierten: TÚ serás el RATÓN 🐭 y ÉL será el GATO CAZADOR 🎩.\n" +
        "• Si sobrevives 75 SEGUNDOS sin que te atrape, lo desbloqueas para siempre.\n" +
        "• Si te atrapa antes, te robará tus Gatomonedas y te dejará con 1.\n\n" +
        "¿Aceptas el trato?"
    );
    if (!acepta) return;

    modoMulti = false;
    modoJefeFacilier = true;
    rolMulti = null;
    esAnfitrionMulti = false;

    juegoIniciado = true;
    pausado = false;
    toque.activo = false;
    toque.dx = 0;
    toque.dy = 0;
    tiempo = DURACION_PARTIDA;
    puntos = 0;
    nivel = 1;
    ultimoSegundoMostrado = null;
    cooldownHabilidad = 0;
    habilidadActivaTipo = null;
    habilidadActivaTimer = 0;
    teclas.arriba = teclas.abajo = teclas.izquierda = teclas.derecha = false;

    const elRol = document.getElementById("marcador-rol");
    elRol.style.display = "";
    elRol.style.color = "#c084fc";
    elRol.innerText = "🎩 DUELO VUDÚ: ¡Huye 75s como RATÓN!";

    document.getElementById("marcador-puntos").style.display = "none";
    document.getElementById("marcador-monedas").style.display = "";
    document.getElementById("marcador-nivel").style.display = "none";
    document.getElementById("tiempo-valor").innerText = DURACION_PARTIDA;

    actualizarBotonHabilidad();
    cambiarPantalla("zona-juego");
    iniciarMotorPhaser();
    sincronizarMusica();
    sonar("record");
    mostrarLogro("🎩 ¡CORRE! Usa los portales y cajas para frenar a Dr. Facilier");
}

function terminarDueloFacilier(victoria) {
    modoJefeFacilier = false;
    juegoIniciado = false;
    document.getElementById("marcador-rol").style.color = "var(--accent-gold-light)";
    sincronizarMusica();

    if (victoria) {
        if (!skinsCompradas.includes("tate_facilier")) {
            skinsCompradas.push("tate_facilier");
            nivelesSkins["tate_facilier"] = 1;
            guardar("skinsCompradas", JSON.stringify(skinsCompradas));
            guardar("nivelesSkins", JSON.stringify(nivelesSkins));
        }
        skinActual = "tate_facilier";
        guardar("skin", skinActual);
        construirTienda();
        actualizarNivelVisualIA();
        sonar("record");

        cambiarPantalla("fin-juego");
        document.getElementById("fin-titulo").innerText = "🎩✨ ¡TRATO SUPERADO!";
        document.getElementById("fin-subtitulo").innerText = "Sobreviviste 75s como ratón. ¡Tate Dr. Facilier se une a tu equipo!";
        document.getElementById("fin-puntos-linea").style.display = "none";
        document.getElementById("fin-monedas-linea").style.display = "none";
        document.getElementById("fin-record-linea").style.display = "none";
        document.getElementById("mensaje-record").style.display = "none";
        document.getElementById("btn-reiniciar").style.display = "none";
        mostrarLogro("🎩🃏 ¡Desbloqueaste a Tate Dr. Facilier!");
    } else {
        monedas = 1;
        guardar("monedas", monedas);
        actualizarNivelVisualIA();
        sonar("error");

        cambiarPantalla("fin-juego");
        document.getElementById("fin-titulo").innerText = "💀🎩 ¡ATRAPADO POR EL VUDÚ!";
        document.getElementById("fin-subtitulo").innerText = "Tate Dr. Facilier cobró el trato: te has quedado con 1 sola moneda.";
        document.getElementById("fin-puntos-linea").style.display = "none";
        document.getElementById("fin-monedas-linea").style.display = "none";
        document.getElementById("fin-record-linea").style.display = "none";
        document.getElementById("mensaje-record").style.display = "none";
        document.getElementById("btn-reiniciar").style.display = "none";
        mostrarLogro("💀 Te quedaste con 1 Gatomoneda...");
    }
}

function terminarJuego() {
    juegoIniciado = false;
    const esRecord = puntos > record;
    if (esRecord) {
        record = puntos;
        guardar("record", record);
    }

    sincronizarMusica();
    subirProgreso();
    sonar(esRecord ? "record" : "fin");
    cambiarPantalla("fin-juego");

    document.getElementById("fin-titulo").innerText = vidasGato <= 0 ? "🐕 ¡ATRAPADO POR EL GUARDIÁN!" : "¡TIEMPO AGOTADO!";
    document.getElementById("fin-subtitulo").innerText = "";
    document.getElementById("fin-puntos-linea").style.display = "";
    document.getElementById("fin-monedas-linea").style.display = "";
    document.getElementById("fin-record-linea").style.display = "";
    document.getElementById("btn-reiniciar").style.display = "";

    document.getElementById("puntos-finales").innerText = puntos;
    document.getElementById("monedas-partida").innerText = monedasPartida;
    document.getElementById("record-final").innerText = record;
    document.getElementById("mensaje-record").style.display = esRecord ? "block" : "none";
    actualizarNivelVisualIA();
}

function copiarRecordWhatsApp() {
    const skin = obtenerSkinActivaCompleta();
    const texto = `🐱 GATO CAZADOR — Nivel ${nivel} | ${puntos} ratones cazados contra la IA (Gen ${partidasEntrenadas || 2319}) 🧠🔥\n` +
                  `🐾 Personaje: ${skin.nombre || skin.emoji}\n` +
                  `¿Puedes superar mi récord? Juega gratis aquí: https://michino999.github.io/GATO---CAZADOR/`;

    navigator.clipboard.writeText(texto).then(() => {
        mostrarLogro("📋 ¡Récord copiado! Pégalo en WhatsApp o Discord");
        sonar("equipar");
    }).catch(() => {
        alert(texto);
    });
}

function reiniciarJuego() { empezarJuego(); }
function abrirAjustes() { cambiarPantalla("menu-ajustes"); }
function abrirTienda() {
    construirTienda();
    cambiarPantalla("menu-tienda");
    sincronizarMonedasUI();
    actualizarBotonesTienda();
}

function volverMenu() {
    limpiarSalaMulti();
    modoMulti = false;
    modoJefeFacilier = false;
    rolMulti = null;
    esAnfitrionMulti = false;
    juegoIniciado = false;
    document.getElementById("marcador-rol").style.color = "var(--accent-gold-light)";
    sincronizarMusica();
    cambiarPantalla("menu-inicio");
    actualizarNivelVisualIA();
}

function actualizarTiempo(dt) {
    if (cooldownHabilidad > 0) {
        cooldownHabilidad = Math.max(0, cooldownHabilidad - dt);
        actualizarBotonHabilidad();
    }
    if (habilidadActivaTimer > 0) {
        habilidadActivaTimer = Math.max(0, habilidadActivaTimer - dt);
        if (habilidadActivaTimer <= 0) habilidadActivaTipo = null;
        actualizarBotonHabilidad();
    }
    if (ratonAturdidoTimer > 0) {
        ratonAturdidoTimer = Math.max(0, ratonAturdidoTimer - dt);
    }

    if (modoJefeFacilier) {
        tiempo -= dt;
        const segundos = Math.max(0, Math.ceil(tiempo));
        if (segundos !== ultimoSegundoMostrado) {
            ultimoSegundoMostrado = segundos;
            document.getElementById("tiempo-valor").innerText = segundos;
        }
        if (tiempo <= 0 && juegoIniciado) terminarDueloFacilier(true);
        return;
    }

    if (modoMulti) {
        if (esAnfitrionMulti) {
            tiempo -= dt;
            const segundos = Math.max(0, Math.ceil(tiempo));
            if (segundos !== ultimoSegundoMostrado) {
                ultimoSegundoMostrado = segundos;
                document.getElementById("tiempo-valor").innerText = segundos;
            }
            if (tiempo <= 0 && juegoIniciado) {
                ganadoraMulti = "raton";
                nube.actualizarSala(salaId, { estado: "fin", ganador: "raton", tiempo: 0 }).catch(() => {});
                terminarJuegoMulti("raton");
            }
        } else {
            const segundos = Math.max(0, Math.ceil(tiempo));
            if (segundos !== ultimoSegundoMostrado) {
                ultimoSegundoMostrado = segundos;
                document.getElementById("tiempo-valor").innerText = segundos;
            }
        }
        return;
    }

    tiempo -= dt;
    const segundos = Math.max(0, Math.ceil(tiempo));
    if (segundos !== ultimoSegundoMostrado) {
        ultimoSegundoMostrado = segundos;
        document.getElementById("tiempo-valor").innerText = segundos;
    }
    if (tiempo <= 0) terminarJuego();
}

function actualizarTextoDificultad() {
    const nombreDif = DIFICULTADES[dificultad - 1].nombre;
    document.getElementById("btn-dificultad").innerText = `Dificultad: ${nombreDif}`;
    const elTexto = document.getElementById("texto-dificultad-actual");
    if (elTexto) elTexto.innerText = `DIFICULTAD: ${nombreDif.toUpperCase()}`;
    const elResumen = document.getElementById("resumen-ajustes");
    if (elResumen) elResumen.innerText = `Dificultad: ${nombreDif} · Sonido: ${sonidoActivo ? "Sí" : "No"} · Música: ${musicaActiva ? "Sí" : "No"}`;
}

function cambiarDificultad() {
    dificultad = (dificultad % 3) + 1;
    velocidadGato = DIFICULTADES[dificultad - 1].velGato;
    guardar("dificultad", dificultad);
    actualizarTextoDificultad();
}
function seleccionarDificultadDirecta(nivelDif) {
    dificultad = nivelDif;
    velocidadGato = DIFICULTADES[dificultad - 1].velGato;
    guardar("dificultad", dificultad);
    actualizarTextoDificultad();
    [1, 2, 3].forEach((n) => {
        const pill = document.getElementById(`pill-dif-${n}`);
        if (pill) pill.classList.toggle("active", n === dificultad);
    });
    sonar("equipar");
}
function actualizarTextoSonido() {
    document.getElementById("btn-sonido").textContent = `Sonido: ${sonidoActivo ? "Sí" : "No"}`;
    actualizarTextoDificultad();
}

function cambiarSonido() {
    sonidoActivo = !sonidoActivo;
    guardar("sonido", sonidoActivo ? "1" : "0");
    actualizarTextoSonido();
    prepararAudio();
    sonar("equipar");
}

function actualizarTextoMusica() {
    document.getElementById("btn-musica").textContent = `Música: ${musicaActiva ? "Sí" : "No"}`;
    actualizarTextoDificultad();
}

function cambiarMusica() {
    musicaActiva = !musicaActiva;
    guardar("musica", musicaActiva ? "1" : "0");
    actualizarTextoMusica();
    prepararAudio();
    sincronizarMusica();
}

function borrarProgreso() {
    if (!confirm("¿Seguro? Se borrarán monedas, skins, mejoras, misiones, récord y el cerebro neuronal de la IA.")) return;
    try {
        ["record", "monedas", "skin", "skinsCompradas", "nivelesSkins", "capturasTotales", "experienciaRaton", "dificultad", "misionesReclamadas", "victorias1v1", CLAVE_RED, "partidasEntrenadasRed"].forEach((clave) => {
            localStorage.removeItem(claveAlmacen(clave));
        });
    } catch (e) {}

    record = 0; monedas = 0; capturasTotales = 0; victorias1v1 = 0;
    misionesReclamadas = {}; skinsCompradas = ["🐱"]; nivelesSkins = { "🐱": 1 };
    skinActual = "🐱"; experienciaRaton = 0; dificultad = 1;
    velocidadGato = DIFICULTADES[0].velGato; redRaton = crearRed(); partidasEntrenadas = 0;

    actualizarTextoDificultad();
    actualizarNivelVisualIA();
    construirTienda();
    if (sesion) {
        guardarLocal("actualizado", Date.now());
        subirProgreso();
    }
    mostrarLogro("Progreso, mejoras y red neuronal borrados");
}

// --- CONTROLES DE TECLADO ---
const MAPA_TECLAS = {
    arrowup: "arriba", w: "arriba",
    arrowdown: "abajo", s: "abajo",
    arrowleft: "izquierda", a: "izquierda",
    arrowright: "derecha", d: "derecha"
};

window.addEventListener("keydown", (e) => {
    if (!e || !e.key) return;
    if (juegoIniciado && (e.code === "Space" || e.key === " ")) {
        e.preventDefault();
        activarHabilidadEspecial();
        return;
    }
    if (juegoIniciado && !modoMulti && !modoJefeFacilier && (e.key === "p" || e.key === "P" || e.key === "Escape")) {
        pausado = !pausado;
        sonar("pausa");
        return;
    }
    const direccion = MAPA_TECLAS[e.key.toLowerCase()];
    if (direccion && juegoIniciado) {
        e.preventDefault();
        teclas[direccion] = true;
        return;
    }
    if (!juegoIniciado && pantallaActual === "menu-inicio") {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        if (direccion) {
            e.preventDefault();
            registrarPatron(direccion);
        }
    }
});

window.addEventListener("keyup", (e) => {
    if (!e || !e.key) return;
    const direccion = MAPA_TECLAS[e.key.toLowerCase()];
    if (direccion) teclas[direccion] = false;
});

window.addEventListener("blur", () => {
    if (juegoIniciado && !modoMulti && !modoJefeFacilier) pausado = true;
    teclas.arriba = teclas.abajo = teclas.izquierda = teclas.derecha = false;
});

["pointerdown", "keydown"].forEach((tipo) => window.addEventListener(tipo, () => prepararAudio()));

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
cargarImagenTate();
construirTienda();
iniciarEditorPixel();
actualizarTextoSonido();
actualizarTextoMusica();
actualizarTextoDificultad();
actualizarNivelVisualIA();
actualizarSesionUI();
cambiarPantalla("menu-inicio");
prepararNube();

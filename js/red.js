// ============================================================
//  CUENTAS + MULTIJUGADOR FIRESTORE (salas1v1 + subcolección pos)
// ============================================================
const FIREBASE_CONFIG = window.FIREBASE_CONFIG_USUARIO || {
    apiKey: "PEGA_AQUI",
    authDomain: "",
    projectId: "",
    appId: ""
};
const FIREBASE_VERSION = "12.19.0";
const DOMINIO_CUENTAS = "gatocazador.example.com";
const RETRASO_SUBIDA_NUBE = 2000;
const FIREBASE_ACTIVO = Boolean(FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith("PEGA"));

let temporizadorNube = null;
let accionEnCurso = false;
let nubeConectada = false;

const nube = {
    listo: false, auth: null, db: null, f: null,
    async iniciar() {
        if (this.listo) return;
        const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
        const [mApp, mAuth, mDb] = await Promise.all([
            import(base + "firebase-app.js"),
            import(base + "firebase-auth.js"),
            import(base + "firebase-firestore.js")
        ]);
        const app = mApp.initializeApp(FIREBASE_CONFIG);
        this.auth = mAuth.getAuth(app);
        this.db = mDb.getFirestore(app);
        this.f = { ...mAuth, ...mDb };
        this.listo = true;
    },
    async asegurarAuthParaSala() {
        if (!this.auth.currentUser && this.f.signInAnonymously) {
            try { await this.f.signInAnonymously(this.auth); } catch (e) {}
        }
    },
    alCambiarSesion(funcion) { return this.f.onAuthStateChanged(this.auth, funcion); },
    async registrar(email, clave) { return (await this.f.createUserWithEmailAndPassword(this.auth, email, clave)).user; },
    async entrar(email, clave) { return (await this.f.signInWithEmailAndPassword(this.auth, email, clave)).user; },
    async salir() { await this.f.signOut(this.auth); },
    async leer(uid) {
        const doc = await this.f.getDoc(this.f.doc(this.db, "jugadores", uid));
        return doc.exists() ? doc.data() : null;
    },
    async escribir(uid, datos) {
        await this.f.setDoc(this.f.doc(this.db, "jugadores", uid), datos, { merge: true });
    },
    async crearSala(codigo, datos) {
        await this.f.setDoc(this.f.doc(this.db, "salas1v1", codigo), datos);
        await Promise.all([
            this.f.setDoc(this.f.doc(this.db, "salas1v1", codigo, "pos", "gato"), { x: 480, y: 200 }),
            this.f.setDoc(this.f.doc(this.db, "salas1v1", codigo, "pos", "raton"), { x: 100, y: 200 })
        ]);
    },
    async leerSala(codigo) {
        const snap = await this.f.getDoc(this.f.doc(this.db, "salas1v1", codigo));
        return snap.exists() ? snap.data() : null;
    },
    async actualizarSala(codigo, datos) {
        if (codigo) await this.f.setDoc(this.f.doc(this.db, "salas1v1", codigo), datos, { merge: true });
    },
    async escribirPosicion(codigo, rol, x, y) {
        if (codigo && rol) await this.f.setDoc(this.f.doc(this.db, "salas1v1", codigo, "pos", rol), { x: x, y: y, ts: Date.now() });
    },
    escucharPosicion(codigo, rolRival, callback) {
        return this.f.onSnapshot(this.f.doc(this.db, "salas1v1", codigo, "pos", rolRival), (snap) => {
            if (snap.exists()) callback(snap.data());
        });
    },
    async borrarSala(codigo) {
        if (!codigo) return;
        await Promise.all([
            this.f.deleteDoc(this.f.doc(this.db, "salas1v1", codigo, "pos", "gato")).catch(() => {}),
            this.f.deleteDoc(this.f.doc(this.db, "salas1v1", codigo, "pos", "raton")).catch(() => {}),
            this.f.deleteDoc(this.f.doc(this.db, "salas1v1", codigo)).catch(() => {})
        ]);
    },
    escucharSala(codigo, callback) {
        return this.f.onSnapshot(this.f.doc(this.db, "salas1v1", codigo), (snap) => {
            callback(snap.exists() ? snap.data() : null);
        });
    }
};

function obtenerPayloadSkinCustom() {
    if (skinActual !== "custom_cat") return null;
    return leerJSONSeguro(localStorage.getItem("gato_custom_usuario"), null);
}

function abrirMultijugador() {
    if (!FIREBASE_ACTIVO) {
        sonar("error");
        mostrarLogro("⚠️ Falta configurar firebase-config.js para el 1v1 online");
        return;
    }
    enFlujoMulti = true;
    document.getElementById("multi-mensaje").textContent = "";
    document.getElementById("multi-codigo-input").value = "";
    cambiarPantalla("menu-multi");
}

function generarCodigoSala() {
    const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let res = "";
    for (let i = 0; i < 6; i++) res += letras[Math.floor(Math.random() * letras.length)];
    return res;
}

function limpiarSalaMulti() {
    if (desuscribirSala) { desuscribirSala(); desuscribirSala = null; }
    if (desuscribirRival) { desuscribirRival(); desuscribirRival = null; }
    salaId = null;
    enFlujoMulti = false;
    customGatoSala = null;
}

async function crearSalaMulti() {
    const msg = document.getElementById("multi-mensaje");
    if (!nube.listo && !(await conectarNube())) { msg.textContent = "Sin conexión con el servidor."; return; }
    msg.textContent = "Creando sala...";
    enFlujoMulti = true;
    await nube.asegurarAuthParaSala();

    const codigo = generarCodigoSala();
    try {
        await nube.crearSala(codigo, {
            estado: "esperando",
            rolHost: "gato",
            skinHost: skinActual,
            customHost: obtenerPayloadSkinCustom(),
            skinGuest: "🐱",
            customGuest: null,
            tiempo: DURACION_PARTIDA,
            ganador: null,
            creadaEn: Date.now()
        });
        salaId = codigo;
        esAnfitrionMulti = true;
        rolMulti = null;
        document.getElementById("sala-codigo-display").textContent = codigo;
        document.getElementById("sala-rol-texto").textContent = "Tu rol: 🎲 Aleatorio al empezar";
        document.getElementById("sala-estado-texto").textContent = "Esperando a que entre tu rival...";
        document.getElementById("btn-iniciar-multi").style.display = "none";
        cambiarPantalla("menu-sala");
        suscribirSala(codigo);
    } catch (e) { msg.textContent = "Error al crear sala."; }
}

async function unirseSalaMulti() {
    const msg = document.getElementById("multi-mensaje");
    const codigo = document.getElementById("multi-codigo-input").value.trim().toUpperCase();
    if (codigo.length !== 6) { msg.textContent = "Escribe el código de 6 caracteres."; return; }
    if (!nube.listo && !(await conectarNube())) { msg.textContent = "Sin conexión."; return; }
    msg.textContent = "Buscando sala...";
    enFlujoMulti = true;
    await nube.asegurarAuthParaSala();

    try {
        const datos = await nube.leerSala(codigo);
        if (!datos) { msg.textContent = "Esa sala no existe."; return; }
        if (datos.estado !== "esperando") { msg.textContent = "La sala ya está llena."; return; }
        await nube.actualizarSala(codigo, {
            estado: "listo",
            skinGuest: skinActual,
            customGuest: obtenerPayloadSkinCustom()
        });
        salaId = codigo;
        esAnfitrionMulti = false;
        rolMulti = null;
        document.getElementById("sala-codigo-display").textContent = codigo;
        document.getElementById("sala-rol-texto").textContent = "Tu rol: 🎲 Aleatorio al empezar";
        document.getElementById("sala-estado-texto").textContent = "¡Conectado! Esperando inicio...";
        document.getElementById("btn-iniciar-multi").style.display = "none";
        cambiarPantalla("menu-sala");
        suscribirSala(codigo);
    } catch (e) { msg.textContent = "Error al entrar en la sala."; }
}

function suscribirSala(codigo) {
    if (desuscribirSala) desuscribirSala();
    desuscribirSala = nube.escucharSala(codigo, (datos) => {
        if (!datos) {
            if (pantallaActual === "menu-sala" || juegoIniciado) { mostrarLogro("El otro jugador cerró la sala"); volverMenu(); }
            return;
        }
        if (pantallaActual === "menu-sala") {
            if (datos.estado === "listo" && esAnfitrionMulti) {
                document.getElementById("sala-estado-texto").textContent = "¡Rival conectado y listo!";
                document.getElementById("btn-iniciar-multi").style.display = "inline-block";
                sonar("equipar");
            }
            if (datos.estado === "jugando") iniciarJuegoMultiLocal(datos);
            return;
        }
        if (juegoIniciado && modoMulti) {
            if (datos.estado === "fin") { terminarJuegoMulti(datos.ganador || "raton"); return; }
            if (!esAnfitrionMulti && typeof datos.tiempo === "number") tiempo = datos.tiempo;
        }
    });
}

async function lanzarPartidaMulti() {
    if (!salaId || !esAnfitrionMulti) return;
    const hostEsGato = Math.random() < 0.5;
    const rolHost = hostEsGato ? "gato" : "raton";
    const datosActuales = await nube.leerSala(salaId);
    if (!datosActuales) return;

    const skinGatoElegida = hostEsGato ? (datosActuales.skinHost || "🐱") : (datosActuales.skinGuest || "🐱");
    const customGatoElegido = hostEsGato ? (datosActuales.customHost || null) : (datosActuales.customGuest || null);

    await Promise.all([
        nube.escribirPosicion(salaId, "gato", 480, 200),
        nube.escribirPosicion(salaId, "raton", 100, 200),
        nube.actualizarSala(salaId, {
            estado: "jugando",
            rolHost: rolHost,
            skinGato: skinGatoElegida,
            customGato: customGatoElegido,
            tiempo: DURACION_PARTIDA,
            ganador: null
        })
    ]);
}

function iniciarJuegoMultiLocal(datos) {
    if (desuscribirRival) { desuscribirRival(); desuscribirRival = null; }
    const rolHost = datos.rolHost || "gato";
    rolMulti = esAnfitrionMulti ? rolHost : (rolHost === "gato" ? "raton" : "gato");
    const rolRival = rolMulti === "gato" ? "raton" : "gato";

    skinGatoSala = datos.skinGato || "🐱";
    customGatoSala = datos.customGato || null;
    ganadoraMulti = null;
    modoMulti = true;
    juegoIniciado = true;
    pausado = false;
    toque.activo = false;
    tiempo = DURACION_PARTIDA;
    puntos = 0;
    ultimoSegundoMostrado = null;
    ultimaPosEnviada = { x: -1, y: -1 };
    ultimoSegundoEnviado = -1;
    cooldownHabilidad = 0;
    habilidadActivaTipo = null;
    habilidadActivaTimer = 0;
    destinoRemoto = rolMulti === "gato" ? { x: 100, y: 200 } : { x: 480, y: 200 };

    desuscribirRival = nube.escucharPosicion(salaId, rolRival, (pos) => {
        if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
            destinoRemoto.x = pos.x;
            destinoRemoto.y = pos.y;
        }
    });

    teclas.arriba = teclas.abajo = teclas.izquierda = teclas.derecha = false;
    const elRol = document.getElementById("marcador-rol");
    elRol.style.display = "";
    elRol.innerText = rolMulti === "gato" ? "Rol: 🐱 GATO (¡Atrápalo!)" : "Rol: 🐭 RATÓN (¡Huye 75s!)";

    document.getElementById("marcador-puntos").style.display = "none";
    document.getElementById("marcador-monedas").style.display = "none";
    document.getElementById("marcador-nivel").style.display = "none";
    document.getElementById("tiempo-valor").innerText = DURACION_PARTIDA;

    actualizarBotonHabilidad();
    cambiarPantalla("zona-juego");
    iniciarMotorPhaser();
    sincronizarMusica();
    sonar("nivel");
}

function enviarEstadoMulti() {
    if (!salaId || !nube.listo || !juegoIniciado || !escenaActiva) return;
    const ahora = Date.now();
    if (ahora - ultimaSyncRed < 50) return;
    let envioAlgo = false;

    if (rolMulti === "gato") {
        const gx = Math.round(escenaActiva.gatoContainer.x);
        const gy = Math.round(escenaActiva.gatoContainer.y);
        if (gx !== ultimaPosEnviada.x || gy !== ultimaPosEnviada.y) {
            ultimaPosEnviada = { x: gx, y: gy };
            envioAlgo = true;
            nube.escribirPosicion(salaId, "gato", gx, gy).catch(() => {});
        }
    } else if (rolMulti === "raton") {
        const rx = Math.round(escenaActiva.ratonContainer.x);
        const ry = Math.round(escenaActiva.ratonContainer.y);
        if (rx !== ultimaPosEnviada.x || ry !== ultimaPosEnviada.y) {
            ultimaPosEnviada = { x: rx, y: ry };
            envioAlgo = true;
            nube.escribirPosicion(salaId, "raton", rx, ry).catch(() => {});
        }
    }

    if (esAnfitrionMulti) {
        const segActual = Math.max(0, Math.ceil(tiempo));
        if (segActual !== ultimoSegundoEnviado) {
            ultimoSegundoEnviado = segActual;
            envioAlgo = true;
            nube.actualizarSala(salaId, { tiempo: segActual }).catch(() => {});
        }
    }
    if (envioAlgo) ultimaSyncRed = ahora;
}

async function salirSalaMulti() {
    const codigo = salaId;
    limpiarSalaMulti();
    if (codigo && nube.listo) nube.borrarSala(codigo).catch(() => {});
    volverMenu();
}

function terminarJuegoMulti(ganador) {
    if (!juegoIniciado && ganadoraMulti === ganador) return;
    ganadoraMulti = ganador;
    juegoIniciado = false;
    const codigo = salaId;
    limpiarSalaMulti();
    if (codigo && esAnfitrionMulti && nube.listo) setTimeout(() => nube.borrarSala(codigo).catch(() => {}), 1500);

    sincronizarMusica();
    const yoGane = (ganador === rolMulti);
    if (yoGane) {
        monedas += 50;
        victorias1v1++;
        guardar("monedas", monedas);
        guardar("victorias1v1", victorias1v1);
        renderizarMisiones();
    }
    sonar(yoGane ? "record" : "fin");
    cambiarPantalla("fin-juego");

    document.getElementById("fin-titulo").innerText = yoGane ? "🏆 ¡GANASTE! (+50 🪙)" : "💀 ¡PERDISTE!";
    document.getElementById("fin-subtitulo").innerText = ganador === "gato" ? "🐱 El Gato atrapó al Ratón." : "🐭 El Ratón sobrevivió el tiempo completo.";
    document.getElementById("fin-puntos-linea").style.display = "none";
    document.getElementById("fin-monedas-linea").style.display = "none";
    document.getElementById("fin-record-linea").style.display = "none";
    document.getElementById("mensaje-record").style.display = "none";
    document.getElementById("btn-reiniciar").style.display = "none";
}

// Limpieza de sala si el jugador cierra la pestaña abruptamente
window.addEventListener("beforeunload", () => {
    if (salaId && nube.listo) {
        nube.borrarSala(salaId).catch(() => {});
    }
});

// --- Progreso <-> nube ---
function datosDeProgreso() {
    return {
        nombre: sesion.nombre, monedas, record, capturasTotales, victorias1v1,
        misionesReclamadas: { ...misionesReclamadas }, skinsCompradas: skinsCompradas.slice(),
        nivelesSkins: { ...nivelesSkins }, skin: skinActual, experienciaRaton, dificultad,
        actualizado: leerNumero("actualizado") || Date.now()
    };
}
function programarSubidaNube() {
    if (!sesion || !nube.listo) return;
    clearTimeout(temporizadorNube);
    temporizadorNube = setTimeout(subirProgreso, RETRASO_SUBIDA_NUBE);
}
async function subirProgreso() {
    clearTimeout(temporizadorNube);
    if (!sesion || !nube.listo) return false;
    try { await nube.escribir(sesion.uid, datosDeProgreso()); return true; } catch (e) { return false; }
}
function recargarProgreso() {
    record = leerNumero("record"); monedas = leerNumero("monedas"); capturasTotales = leerNumero("capturasTotales");
    victorias1v1 = leerNumero("victorias1v1"); misionesReclamadas = leerObjeto("misionesReclamadas", {});
    experienciaRaton = leerNumero("experienciaRaton");
    dificultad = Math.min(3, Math.max(1, leerNumero("dificultad") || 1));
    velocidadGato = DIFICULTADES[dificultad - 1].velGato;
    skinsCompradas = leerLista("skinsCompradas", ["🐱"]);
    if (!skinsCompradas.includes("🐱")) skinsCompradas.push("🐱");
    nivelesSkins = leerObjeto("nivelesSkins", { "🐱": 1 });
    skinActual = leerTexto("skin", "🐱");
    if (skinActual !== "custom_cat" && !skinsCompradas.includes(skinActual)) skinActual = "🐱";
    actualizarTextoDificultad(); actualizarNivelVisualIA(); construirTienda(); actualizarBotonesTienda();
}
async function bajarProgreso() {
    recargarProgreso();
    let datos = null;
    try { datos = await nube.leer(sesion.uid); } catch (e) { return false; }
    if (!datos || leerNumero("actualizado") > Number(datos.actualizado || 0)) { await subirProgreso(); return true; }
    guardarLocal("monedas", Math.max(0, Number(datos.monedas) || 0));
    guardarLocal("record", Math.max(0, Number(datos.record) || 0));
    guardarLocal("capturasTotales", Math.max(0, Number(datos.capturasTotales) || 0));
    guardarLocal("victorias1v1", Math.max(0, Number(datos.victorias1v1) || 0));
    guardarLocal("experienciaRaton", Math.max(0, Number(datos.experienciaRaton) || 0));
    guardarLocal("dificultad", Math.min(3, Math.max(1, Number(datos.dificultad) || 1)));
    guardarLocal("skin", typeof datos.skin === "string" ? datos.skin : "🐱");
    guardarLocal("skinsCompradas", JSON.stringify(Array.isArray(datos.skinsCompradas) ? datos.skinsCompradas : ["🐱"]));
    guardarLocal("nivelesSkins", JSON.stringify(datos.nivelesSkins || { "🐱": 1 }));
    guardarLocal("misionesReclamadas", JSON.stringify(datos.misionesReclamadas || {}));
    guardarLocal("actualizado", Number(datos.actualizado) || 0);
    recargarProgreso();
    return true;
}

function mensajeLogin(texto, esError) {
    const el = document.getElementById("login-mensaje");
    if (el) { el.textContent = texto; el.style.color = esError ? "var(--accent-red)" : "var(--accent-cyan)"; }
}
function bloquearLogin(b) {
    ["btn-entrar", "btn-crear"].forEach((id) => { const btn = document.getElementById(id); if (btn) btn.disabled = b; });
}
function leerFormularioLogin() {
    const nombre = document.getElementById("login-nombre").value.trim().toLowerCase();
    const clave = document.getElementById("login-clave").value;
    if (!/^[a-z0-9_.-]{3,20}$/.test(nombre)) { mensajeLogin("Nombre: de 3 a 20 letras o números", true); return null; }
    if (clave.length < 6) { mensajeLogin("La contraseña necesita al menos 6 caracteres", true); return null; }
    return { nombre, clave, email: `${nombre}@${DOMINIO_CUENTAS}` };
}
function actualizarSesionUI() {
    const estado = document.getElementById("sesion-estado");
    const badge = document.getElementById("estado-cuenta-badge");
    const form = document.getElementById("form-cuenta-integrado");
    const panelActiva = document.getElementById("panel-cuenta-activa");
    if (!estado) return;
    if (!FIREBASE_ACTIVO) {
        if (badge) badge.textContent = "ESTADO: LOCAL";
        estado.textContent = "Modo local activo en este navegador.";
        if (form) form.style.display = "none";
        if (panelActiva) panelActiva.style.display = "none";
        return;
    }
    if (sesion) {
        if (badge) { badge.textContent = "ESTADO: EN NUBE"; badge.style.color = "var(--accent-cyan)"; }
        estado.innerHTML = `Cazador conectado: <strong style="color:#fff;">${sesion.nombre.toUpperCase()}</strong>`;
        if (form) form.style.display = "none";
        if (panelActiva) panelActiva.style.display = "block";
    } else {
        if (badge) { badge.textContent = "ESTADO: LOCAL"; badge.style.color = "var(--accent-green)"; }
        estado.textContent = "Guarda tu progreso en la nube y sincroniza tus monedas y récords.";
        if (form) form.style.display = "block";
        if (panelActiva) panelActiva.style.display = "none";
    }
}
function entrarAlMenu() {
    const clave = document.getElementById("login-clave");
    if (clave) clave.value = "";
    mensajeLogin("", false);
    bloquearLogin(false);
    cambiarPantalla("menu-inicio");
    actualizarSesionUI();
    actualizarNivelVisualIA();
}
async function conectarNube() {
    if (nubeConectada) return true;
    try { await nube.iniciar(); nube.alCambiarSesion(alCambiarSesion); nubeConectada = true; return true; } catch (e) { return false; }
}
async function activarSesion(usuario) {
    sesion = { uid: usuario.uid, nombre: String(usuario.email || "").split("@")[0] };
    return await bajarProgreso();
}
async function crearCuenta() {
    const f = leerFormularioLogin();
    if (!f) return;
    accionEnCurso = true; bloquearLogin(true); mensajeLogin("Creando cuenta...", false);
    try {
        if (!(await conectarNube())) { mensajeLogin("Sin conexión.", true); return; }
        const usuario = await nube.registrar(f.email, f.clave);
        sesion = { uid: usuario.uid, nombre: f.nombre };
        guardarLocal("monedas", monedas); guardarLocal("record", record);
        guardarLocal("capturasTotales", capturasTotales); guardarLocal("victorias1v1", victorias1v1);
        guardarLocal("misionesReclamadas", JSON.stringify(misionesReclamadas));
        guardarLocal("skin", skinActual); guardarLocal("skinsCompradas", JSON.stringify(skinsCompradas));
        guardarLocal("nivelesSkins", JSON.stringify(nivelesSkins));
        guardarLocal("experienciaRaton", experienciaRaton); guardarLocal("dificultad", dificultad);
        guardarLocal("actualizado", Date.now());
        await subirProgreso();
        entrarAlMenu();
        mostrarLogro("¡Cuenta creada! Bienvenido, " + f.nombre);
    } catch (e) { mensajeLogin("Error al crear cuenta.", true); }
    finally { accionEnCurso = false; bloquearLogin(false); }
}
async function iniciarSesion() {
    const f = leerFormularioLogin();
    if (!f) return;
    accionEnCurso = true; bloquearLogin(true); mensajeLogin("Entrando...", false);
    try {
        if (!(await conectarNube())) { mensajeLogin("Sin conexión.", true); return; }
        const usuario = await nube.entrar(f.email, f.clave);
        await activarSesion(usuario);
        entrarAlMenu();
        mostrarLogro("Bienvenido de nuevo, " + sesion.nombre);
    } catch (e) { mensajeLogin("Nombre o contraseña incorrectos.", true); }
    finally { accionEnCurso = false; bloquearLogin(false); }
}
async function cerrarSesion() {
    accionEnCurso = true;
    try { await subirProgreso(); await nube.salir(); } catch (e) {}
    sesion = null; accionEnCurso = false; recargarProgreso(); actualizarSesionUI(); mostrarLogro("Sesión cerrada");
}
function alCambiarSesion(usuario) {
    if (accionEnCurso || juegoIniciado || enFlujoMulti) return;
    if (usuario && !usuario.isAnonymous) {
        if (sesion && sesion.uid === usuario.uid) return;
        activarSesion(usuario).then(entrarAlMenu);
    } else if (sesion) {
        sesion = null; recargarProgreso(); actualizarSesionUI();
    }
}
async function prepararNube() { if (FIREBASE_ACTIVO) await conectarNube(); }

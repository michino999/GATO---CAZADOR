// ============================================================
//  AUDIO SINTETIZADO (WEB AUDIO API)
// ============================================================
let audioCtx = null;
let intervaloMusica = null;

function prepararAudio() {
    if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
    }
}

function sonar(tipo) {
    if (!sonidoActivo) return;
    prepararAudio();
    if (!audioCtx) return;

    const ahora = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (tipo === "captura") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, ahora);
        osc.frequency.exponentialRampToValueAtTime(880, ahora + 0.11);
        gain.gain.setValueAtTime(0.14, ahora);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.12);
        osc.start(ahora);
        osc.stop(ahora + 0.12);
    } else if (tipo === "nivel" || tipo === "record" || tipo === "compra") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, ahora);
        osc.frequency.setValueAtTime(554, ahora + 0.08);
        osc.frequency.setValueAtTime(659, ahora + 0.16);
        gain.gain.setValueAtTime(0.15, ahora);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.3);
        osc.start(ahora);
        osc.stop(ahora + 0.3);
    } else if (tipo === "tunel") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, ahora);
        osc.frequency.exponentialRampToValueAtTime(750, ahora + 0.16);
        gain.gain.setValueAtTime(0.1, ahora);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.17);
        osc.start(ahora);
        osc.stop(ahora + 0.17);
    } else if (tipo === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, ahora);
        osc.frequency.linearRampToValueAtTime(110, ahora + 0.22);
        gain.gain.setValueAtTime(0.14, ahora);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.23);
        osc.start(ahora);
        osc.stop(ahora + 0.23);
    } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ahora);
        gain.gain.setValueAtTime(0.08, ahora);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.07);
        osc.start(ahora);
        osc.stop(ahora + 0.07);
    }
}

function sincronizarMusica() {
    const debeSonar = musicaActiva && juegoIniciado && !pausado;
    if (debeSonar && !intervaloMusica) {
        const notas = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63];
        let paso = 0;
        intervaloMusica = setInterval(() => {
            if (!musicaActiva || !juegoIniciado || pausado || !audioCtx) return;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "triangle";
            osc.frequency.value = notas[paso % notas.length];
            gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0008, audioCtx.currentTime + 0.22);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.23);
            paso++;
        }, 280);
    } else if (!debeSonar && intervaloMusica) {
        clearInterval(intervaloMusica);
        intervaloMusica = null;
    }
}

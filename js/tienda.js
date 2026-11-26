// ============================================================
//  TIENDA, SKINS, MEJORAS Y MISIONES
// ============================================================
function obtenerNivelSkin(emoji) {
    const n = Number(nivelesSkins[emoji]);
    return Number.isFinite(n) && n >= 1 ? Math.min(MAX_NIVEL_MEJORA, Math.floor(n)) : 1;
}
function costoSubirNivelSkin(skin, nivelActual) {
    return Math.round((skin.costoMejora || 100) * Math.pow(1.65, nivelActual - 1));
}
function bonusVelocidadSkin(emoji) {
    const skin = SKINS.find((s) => s.emoji === emoji);
    if (!skin) return 1;
    return skin.velocidad + (obtenerNivelSkin(emoji) - 1) * 0.06;
}
function bonusMonedasSkin(emoji) {
    return 1 + (obtenerNivelSkin(emoji) - 1) * 0.25;
}
function bonusSkin() {
    return bonusVelocidadSkin(skinActual);
}

function actualizarBotonesTienda() {
    SKINS.forEach((skin) => {
        const tarjeta = skin.tarjeta;
        const boton = skin.elemento;
        const btnMejora = skin.botonMejora;
        const infoStats = skin.infoStats;
        const avatarImg = skin.avatarImg;
        const avatarFallback = skin.avatarFallback;
        if (!tarjeta || !boton) return;

        const poseido = skinsCompradas.includes(skin.emoji);
        tarjeta.style.display = skin.secreta && !poseido ? "none" : "block";
        tarjeta.classList.toggle("equipada", poseido && skin.emoji === skinActual);

        if (avatarImg && skin.archivoBase) {
            avatarImg.src = cacheDataUrlSkins[skin.archivoBase] || skin.archivoBase;
            avatarImg.style.display = "block";
            if (avatarFallback) avatarFallback.style.display = "none";
        }

        const simbolo = skin.icono || skin.emoji;
        const nivelPj = obtenerNivelSkin(skin.emoji);
        const velPct = Math.round((bonusVelocidadSkin(skin.emoji) - 1) * 100);
        const monPct = Math.round((bonusMonedasSkin(skin.emoji) - 1) * 100);

        if (poseido) {
            infoStats.innerHTML = `<span style="color:#fff;">${skin.nombre.toUpperCase()}</span> · <span style="color:var(--accent-cyan);">LVL ${nivelPj}/${MAX_NIVEL_MEJORA} · Vel +${velPct}% · 🪙 +${monPct}%</span>`;
            if (skin.emoji === skinActual) {
                boton.textContent = `${simbolo} EQUIPADO`;
                boton.className = "tactical-btn btn-green";
            } else {
                boton.textContent = `${simbolo} EQUIPAR A ${skin.nombre.toUpperCase()}`;
                boton.className = "tactical-btn";
            }

            if (btnMejora) {
                btnMejora.style.display = "block";
                if (nivelPj >= MAX_NIVEL_MEJORA) {
                    btnMejora.textContent = "⭐ NIVEL MÁXIMO (LVL 5)";
                    btnMejora.disabled = true;
                    btnMejora.className = "tactical-btn btn-gold";
                } else {
                    const costo = costoSubirNivelSkin(skin, nivelPj);
                    btnMejora.textContent = `⬆️ MEJORAR A LVL ${nivelPj + 1} (${costo} 🪙)`;
                    btnMejora.disabled = false;
                    btnMejora.className = "tactical-btn btn-peach";
                }
            }
        } else {
            const basePct = Math.round((skin.velocidad - 1) * 100);
            const extra = basePct > 0 ? ` · Base +${basePct}% vel` : "";
            infoStats.innerHTML = `<span style="color:#fff;">${skin.nombre.toUpperCase()}</span> <span style="color:var(--accent-gold-light);">${extra}</span>`;
            boton.textContent = `${simbolo} DESBLOQUEAR (${skin.precio} 🪙)`;
            boton.className = "tactical-btn";
            if (btnMejora) btnMejora.style.display = "none";
        }
    });
}

function construirTienda() {
    const lista = document.getElementById("lista-tienda");
    if (!lista) return;
    lista.textContent = "";
    SKINS.forEach((skin) => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-skin";

        const header = document.createElement("div");
        header.className = "skin-header";

        const avatarImg = document.createElement("img");
        avatarImg.className = "skin-avatar";
        avatarImg.alt = skin.nombre;
        avatarImg.style.display = "none";
        avatarImg.onerror = () => {
            avatarImg.style.display = "none";
            avatarFallback.style.display = "flex";
        };

        const avatarFallback = document.createElement("div");
        avatarFallback.className = "skin-fallback";
        avatarFallback.textContent = skin.icono || skin.emoji;

        const textoBox = document.createElement("div");
        textoBox.style.flex = "1";

        const infoStats = document.createElement("div");
        infoStats.style.fontSize = "0.82rem";
        infoStats.style.fontWeight = "700";

        const desc = document.createElement("div");
        desc.style.fontSize = "0.75rem";
        desc.style.color = "var(--text-muted)";
        desc.style.marginTop = "2px";
        desc.textContent = skin.descripcion || "";

        textoBox.appendChild(infoStats);
        textoBox.appendChild(desc);
        header.appendChild(avatarImg);
        header.appendChild(avatarFallback);
        header.appendChild(textoBox);

        const boton = document.createElement("button");
        boton.className = "tactical-btn";
        boton.onclick = () => comprarOEquipar(skin.emoji, skin.precio);

        const btnMejora = document.createElement("button");
        btnMejora.className = "tactical-btn";
        btnMejora.onclick = () => mejorarSkin(skin.emoji);

        tarjeta.appendChild(header);
        tarjeta.appendChild(boton);
        tarjeta.appendChild(btnMejora);
        lista.appendChild(tarjeta);

        skin.tarjeta = tarjeta;
        skin.elemento = boton;
        skin.botonMejora = btnMejora;
        skin.infoStats = infoStats;
        skin.avatarImg = avatarImg;
        skin.avatarFallback = avatarFallback;
    });
    actualizarBotonesTienda();
}

function comprarOEquipar(emoji, precio) {
    if (skinsCompradas.includes(emoji)) {
        sonar("equipar");
        equiparSkin(emoji);
    } else if (monedas >= precio) {
        monedas -= precio;
        skinsCompradas.push(emoji);
        nivelesSkins[emoji] = 1;
        guardar("monedas", monedas);
        guardar("skinsCompradas", JSON.stringify(skinsCompradas));
        guardar("nivelesSkins", JSON.stringify(nivelesSkins));
        sonar("compra");
        equiparSkin(emoji, "¡Compra exitosa! Personaje equipado");
    } else {
        sonar("error");
        mostrarLogro(`Te faltan ${precio - monedas} Gatomonedas`);
    }
    sincronizarMonedasUI();
    actualizarBotonesTienda();
}

function mejorarSkin(emoji) {
    const skin = SKINS.find((s) => s.emoji === emoji);
    if (!skin || !skinsCompradas.includes(emoji)) return;
    const nivelActual = obtenerNivelSkin(emoji);
    if (nivelActual >= MAX_NIVEL_MEJORA) return;

    const costo = costoSubirNivelSkin(skin, nivelActual);
    if (monedas < costo) {
        sonar("error");
        mostrarLogro(`Te faltan ${costo - monedas} 🪙 para mejorar a ${skin.nombre}`);
        return;
    }

    monedas -= costo;
    const nuevoNivel = nivelActual + 1;
    nivelesSkins[emoji] = nuevoNivel;
    guardar("monedas", monedas);
    guardar("nivelesSkins", JSON.stringify(nivelesSkins));
    sonar("nivel");
    mostrarLogro(`⬆️ ¡${skin.nombre} subió a LVL ${nuevoNivel}!`);
    sincronizarMonedasUI();
    actualizarBotonesTienda();
    renderizarMisiones();
}

function equiparSkin(emoji, mensaje) {
    skinActual = emoji;
    guardar("skin", skinActual);
    const nivelPj = obtenerNivelSkin(emoji);
    const extra = bonusSkin() > 1 ? ` (LVL ${nivelPj} · +${Math.round((bonusSkin() - 1) * 100)}% vel)` : "";
    const info = SKINS.find((s) => s.emoji === emoji);
    const nombre = info ? info.nombre : emoji;
    mostrarLogro((mensaje || "Equipado: " + nombre) + extra);
}

function obtenerRangoIA() {
    const nivelIA = Math.min(10, Math.floor((experienciaRaton || 0) / 25) + 1);
    const gen = Math.max(partidasEntrenadas || 0, nivelIA * 25);

    if (nivelIA <= 2) return { nivel: 1, titulo: "🌱 Aprendiz de Caza", mult: 1, nivelIA };
    if (nivelIA <= 5) return { nivel: 2, titulo: "⚡ Cazador Táctico", mult: 2, nivelIA };
    if (nivelIA <= 8) return { nivel: 3, titulo: "🔥 Domador de Redes", mult: 4, nivelIA };
    return { nivel: 4, titulo: "🧠 Leyenda vs IA Suprema", mult: 8, nivelIA };
}

function obtenerMisionesSegunIA() {
    const rango = obtenerRangoIA();
    const m = rango.mult;

    return [
        {
            id: `cap_rango_${rango.nivel}`,
            tipo: "capturas",
            titulo: `🐾 Cazador ${rango.titulo}`,
            desc: `Atrapa ratones entrenados por la IA`,
            meta: 25 * m,
            premio: 60 * m
        },
        {
            id: `rec_rango_${rango.nivel}`,
            tipo: "record",
            titulo: `🏆 Récord vs IA (LVL ${rango.nivelIA})`,
            desc: `Supera esta puntuación en una partida`,
            meta: 8 + (rango.nivel * 5),
            premio: 90 * m
        },
        {
            id: `ia_rango_${rango.nivel}`,
            tipo: "entrenamiento",
            titulo: `🧠 Evolución Neuronal`,
            desc: `Entrena o juega partidas contra la red`,
            meta: 150 * m,
            premio: 75 * m
        },
        {
            id: `custom_rango_${rango.nivel}`,
            tipo: "custom",
            titulo: `🎨 Cazador Personalizado`,
            desc: `Juega con tu propio gato pixel art equipado`,
            meta: 1,
            premio: 50 * m
        }
    ];
}

function renderizarMisiones() {
    const contenedor = document.getElementById("lista-misiones");
    if (!contenedor) return;

    contenedor.innerHTML = "";
    const rango = obtenerRangoIA();
    const misionesActivas = obtenerMisionesSegunIA();

    // Banner superior que muestra el rango detectado según tu IA
    const banner = document.createElement("div");
    banner.className = "tarjeta-mision";
    banner.style.borderColor = "var(--accent-cyan)";
    banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:var(--accent-cyan);">🧠 Rango IA: ${rango.titulo}</strong>
            <span style="font-size:0.75rem; color:var(--accent-gold-light); font-weight:800;">Premios x${rango.mult}</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
            Las misiones se adaptan automáticamente al nivel de inteligencia de los ratones (LVL ${rango.nivelIA}/10).
        </div>
    `;
    contenedor.appendChild(banner);

    misionesActivas.forEach((m) => {
        let actual = 0;
        if (m.tipo === "capturas") actual = capturasTotales;
        if (m.tipo === "record") actual = record;
        if (m.tipo === "entrenamiento") actual = partidasEntrenadas;
        if (m.tipo === "custom") actual = skinActual === "custom_cat" ? 1 : 0;

        const completada = actual >= m.meta;
        const reclamada = Boolean(misionesReclamadas[m.id]);

        const card = document.createElement("div");
        card.className = "tarjeta-mision";
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${m.titulo}</strong>
                <span style="color:var(--accent-gold-light); font-weight:800;">+${m.premio} 🪙</span>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin:4px 0 8px;">${m.desc} (${Math.min(actual, m.meta)}/${m.meta})</div>
        `;

        const btn = document.createElement("button");
        btn.className = reclamada ? "tactical-btn" : (completada ? "tactical-btn btn-green" : "tactical-btn");
        btn.disabled = reclamada || !completada;
        btn.textContent = reclamada ? "✅ RECLAMADA" : (completada ? `🎁 RECLAMAR ${m.premio} 🪙` : "EN PROGRESO");
        btn.onclick = () => {
            if (!completada || misionesReclamadas[m.id]) return;
            misionesReclamadas[m.id] = true;
            monedas += m.premio;
            guardar("misionesReclamadas", JSON.stringify(misionesReclamadas));
            guardar("monedas", monedas);
            sonar("compra");
            mostrarLogro(`🎁 +${m.premio} Gatomonedas reclamadas`);
            actualizarNivelVisualIA();
        };

        card.appendChild(btn);
        contenedor.appendChild(card);
    });
}


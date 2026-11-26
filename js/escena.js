// ============================================================
//  MOTOR PHASER 3: MUNDO ABIERTO (1800x1200) + CÁMARA + RADAR
// ============================================================
let phaserGame = null;
let escenaActiva = null;

function crearTexturasPhaser(scene) {
    if (!scene.textures.exists("tex-particula")) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(6, 6, 6);
        g.generateTexture("tex-particula", 12, 12);
        g.destroy();
    }
    if (!scene.textures.exists("tex-muro")) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x1e293b, 1);
        g.fillRoundedRect(0, 0, 40, 40, 8);
        g.lineStyle(2, 0x38bdf8, 0.75);
        g.strokeRoundedRect(1, 1, 38, 38, 8);
        g.generateTexture("tex-muro", 40, 40);
        g.destroy();
    }
    if (!scene.textures.exists("tex-caja")) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xd97706, 1);
        g.fillRoundedRect(0, 0, 32, 32, 6);
        g.lineStyle(2, 0xfde047, 0.95);
        g.strokeRoundedRect(1, 1, 30, 30, 6);
        g.lineBetween(4, 4, 28, 28);
        g.lineBetween(28, 4, 4, 28);
        g.generateTexture("tex-caja", 32, 32);
        g.destroy();
    }
    if (!scene.textures.exists("tex-tunel")) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0x020617, 1);
        g.fillCircle(20, 20, 18);
        g.lineStyle(3, 0xa855f7, 0.95);
        g.strokeCircle(20, 20, 17);
        g.lineStyle(2, 0x38bdf8, 0.85);
        g.strokeCircle(20, 20, 10);
        g.generateTexture("tex-tunel", 40, 40);
        g.destroy();
    }
}

class EscenaGatoCazador extends Phaser.Scene {
    constructor() {
        super({ key: "EscenaGatoCazador" });
    }

    preload() {
        this.load.image("tate-sprite", cacheDataUrlSkins["tate.png"] || "tate.png");
    }

    create() {
        escenaActiva = this;
        crearTexturasPhaser(this);

        const anchoActual = modoMulti ? ANCHO_CAMARA : ANCHO_MUNDO;
        const altoActual = modoMulti ? ALTO_CAMARA : ALTO_MUNDO;

        this.physics.world.setBounds(0, 0, anchoActual, altoActual);
        this.cameras.main.setBounds(0, 0, anchoActual, altoActual);

        this.sueloGfx = this.add.graphics();
        this.dibujarZonasMundo(anchoActual, altoActual);

        // HUD fijo en pantalla
        this.barraFondo = this.add.rectangle(ANCHO_CAMARA / 2, 4, ANCHO_CAMARA, 8, 0x1e293b).setScrollFactor(0).setDepth(40);
        this.barraProgreso = this.add.rectangle(0, 4, ANCHO_CAMARA, 8, 0xfacc15).setOrigin(0, 0.5).setScrollFactor(0).setDepth(41);

        this.textoVidas = this.add.text(12, 14, "❤️❤️❤️", { fontSize: "16px" }).setScrollFactor(0).setDepth(45);
        this.textoZona = this.add.text(12, 36, "📍 LA COCINA", {
            fontFamily: "'Press Start 2P', Arial",
            fontSize: "9px",
            color: "#38bdf8",
            backgroundColor: "rgba(6,9,17,0.75)",
            padding: { x: 6, y: 4 }
        }).setScrollFactor(0).setDepth(45);

        this.radarGfx = this.add.graphics().setScrollFactor(0).setDepth(45);

        // Grupos físicos
        this.muros = this.physics.add.staticGroup();
        this.cajas = this.physics.add.group({ bounceX: 0.5, bounceY: 0.5, dragX: 360, dragY: 360, collideWorldBounds: true });
        this.peces = this.physics.add.group();
        this.tuneles = [];

        this.emisor = this.add.particles(0, 0, "tex-particula", {
            speed: { min: 70, max: 250 },
            scale: { start: 0.9, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 520,
            emitting: false
        }).setDepth(30);

        // Jugador Gato
        this.gatoContainer = this.add.container(300, 280).setDepth(16);
        this.auraGfx = this.add.graphics();
        this.gatoContainer.add(this.auraGfx);

        this.gatoSprite = this.add.image(0, 0, "tate-sprite").setDisplaySize(44, 44).setVisible(false);
        this.gatoTexto = this.add.text(0, 0, "🐱", { fontSize: "34px" }).setOrigin(0.5);
        this.sombreroGfx = this.add.graphics().setVisible(false);
        this.dibujarSombreroEnGfx(this.sombreroGfx);
        this.etiquetaGato = this.add.text(0, -28, "", { fontFamily: "'Press Start 2P', Arial", fontSize: "9px", color: "#fbbf24" }).setOrigin(0.5);

        this.gatoContainer.add([this.gatoSprite, this.gatoTexto, this.sombreroGfx, this.etiquetaGato]);
        this.physics.world.enable(this.gatoContainer);
        this.gatoContainer.body.setSize(32, 32).setOffset(-16, -16).setCollideWorldBounds(true).setBounce(0.25);

        // Ratón
        this.ratonContainer = this.add.container(900, 600).setDepth(15);
        this.ratonTexto = this.add.text(0, 0, "🐭", { fontSize: "28px" }).setOrigin(0.5);
        this.stunTexto = this.add.text(0, -20, "💫", { fontSize: "15px" }).setOrigin(0.5).setVisible(false);
        this.etiquetaRaton = this.add.text(0, -24, "", { fontFamily: "'Press Start 2P', Arial", fontSize: "9px", color: "#4ade80" }).setOrigin(0.5);
        this.ratonContainer.add([this.ratonTexto, this.stunTexto, this.etiquetaRaton]);
        this.physics.world.enable(this.ratonContainer);
        this.ratonContainer.body.setSize(24, 24).setOffset(-12, -12).setCollideWorldBounds(true).setBounce(0.35);

        // Perro Guardián
        this.perroContainer = this.add.container(1350, 850).setDepth(16);
        this.perroAlerta = this.add.circle(0, 0, 140, 0xef4444, 0.06).setStrokeStyle(1.5, 0xef4444, 0.3);
        this.perroTexto = this.add.text(0, 0, "🐕", { fontSize: "36px" }).setOrigin(0.5);
        this.perroLabel = this.add.text(0, -26, "GUARDIÁN", { fontFamily: "'Press Start 2P', Arial", fontSize: "8px", color: "#f87171" }).setOrigin(0.5);
        this.perroContainer.add([this.perroAlerta, this.perroTexto, this.perroLabel]);
        this.physics.world.enable(this.perroContainer);
        this.perroContainer.body.setSize(34, 34).setOffset(-17, -17).setCollideWorldBounds(true).setBounce(0.4);

        // Colisiones físicas
        this.physics.add.collider(this.gatoContainer, this.muros);
        this.physics.add.collider(this.ratonContainer, this.muros);
        this.physics.add.collider(this.perroContainer, this.muros);
        this.physics.add.collider(this.cajas, this.muros);
        this.physics.add.collider(this.cajas, this.cajas);
        this.physics.add.collider(this.gatoContainer, this.cajas);
        this.physics.add.collider(this.ratonContainer, this.cajas);
        this.physics.add.collider(this.perroContainer, this.cajas);

        // Overlaps
        this.physics.add.overlap(this.gatoContainer, this.ratonContainer, () => {
            if (juegoIniciado && !pausado) procesarCapturaPhaser();
        });

        this.physics.add.overlap(this.gatoContainer, this.perroContainer, () => {
            if (!juegoIniciado || pausado || modoMulti || modoJefeFacilier) return;
            this.colisionConPerro();
        });

        this.physics.add.overlap(this.gatoContainer, this.peces, (gato, pez) => {
            pez.destroy();
            modoFuriaTimer = 7.0;
            sonar("record");
            this.efectoAnimeCamara("🐟 ¡MODO FURIA! CAZA AL PERRO", 0xfacc15, "#facc15");
            this.time.delayedCall(9000, () => {
                if (juegoIniciado && !modoMulti) this.generarPezPoder();
            });
        });

        // Controles táctiles
        this.input.on("pointerdown", (pointer) => {
            if (!juegoIniciado) return;
            if (pausado && !modoMulti && !modoJefeFacilier) {
                pausado = false;
                this.physics.resume();
                if (this.textoPausa) this.textoPausa.setVisible(false);
                return;
            }
            toque.activo = true;
            toque.x = pointer.worldX;
            toque.y = pointer.worldY;
        });
        this.input.on("pointermove", (pointer) => {
            if (toque.activo) {
                toque.x = pointer.worldX;
                toque.y = pointer.worldY;
            }
        });
        this.input.on("pointerup", () => { toque.activo = false; });

        this.textoPausa = this.add.text(ANCHO_CAMARA / 2, ALTO_CAMARA / 2, "PAUSA", {
            fontFamily: "'Press Start 2P', Arial",
            fontSize: "24px",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.8)",
            padding: { x: 20, y: 14 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(60).setVisible(false);

        this.configurarPartidaEnEscena();
    }

    dibujarZonasMundo(w, h) {
        this.sueloGfx.clear();
        if (modoMulti) {
            this.sueloGfx.fillStyle(0x0b1b3a, 1);
            this.sueloGfx.fillRect(0, 0, w, h);
            return;
        }
        const mw = w / 2;
        const mh = h / 2;
        this.sueloGfx.fillStyle(0x0f172a, 1);
        this.sueloGfx.fillRect(0, 0, mw, mh);

        this.sueloGfx.fillStyle(0x062419, 1);
        this.sueloGfx.fillRect(mw, 0, mw, mh);

        this.sueloGfx.fillStyle(0x1e1528, 1);
        this.sueloGfx.fillRect(0, mh, mw, mh);

        this.sueloGfx.fillStyle(0x0c1e35, 1);
        this.sueloGfx.fillRect(mw, mh, mw, mh);

        this.sueloGfx.lineStyle(1, 0x38bdf8, 0.06);
        for (let x = 0; x <= w; x += 60) this.sueloGfx.lineBetween(x, 0, x, h);
        for (let y = 0; y <= h; y += 60) this.sueloGfx.lineBetween(0, y, w, y);

        this.sueloGfx.lineStyle(3, 0x334155, 0.5);
        this.sueloGfx.strokeRect(2, 2, w - 4, h - 4);
    }

    dibujarSombreroEnGfx(gfx) {
        gfx.clear();
        gfx.fillStyle(0x141418, 1);
        gfx.fillRect(-18, -24, 36, 5);
        gfx.fillRect(-11, -39, 22, 16);
        gfx.fillStyle(0xfacc15, 1);
        gfx.fillRect(-11, -28, 22, 3);
    }

    construirMundoAbierto() {
        this.muros.clear(true, true);
        this.cajas.clear(true, true);
        this.peces.clear(true, true);
        this.tuneles.forEach((t) => t.destroy());
        this.tuneles = [];

        if (modoMulti) return;

        // Paredes entre las 4 habitaciones dejando puertas abiertas
        this.crearMuro(900, 140, 40, 220);
        this.crearMuro(900, 600, 40, 320);
        this.crearMuro(900, 1060, 40, 220);

        this.crearMuro(220, 600, 360, 40);
        this.crearMuro(680, 600, 220, 40);
        this.crearMuro(1120, 600, 220, 40);
        this.crearMuro(1580, 600, 360, 40);

        // Obstáculos por habitación
        this.crearMuro(320, 220, 180, 40);
        this.crearMuro(580, 380, 180, 40);
        this.crearMuro(1250, 200, 40, 200);
        this.crearMuro(1500, 350, 200, 40);
        this.crearMuro(280, 880, 200, 40);
        this.crearMuro(600, 950, 40, 180);
        this.crearMuro(1250, 850, 160, 40);
        this.crearMuro(1520, 950, 160, 40);

        const posCajas = [
            [450, 250], [450, 480], [1150, 300], [1400, 480],
            [420, 750], [720, 850], [1180, 980], [1450, 760]
        ];
        posCajas.forEach(([cx, cy]) => this.crearCaja(cx, cy));

        const p1 = this.add.image(110, 110, "tex-tunel").setDepth(5);
        const p2 = this.add.image(ANCHO_MUNDO - 110, ALTO_MUNDO - 110, "tex-tunel").setDepth(5);
        p1.destino = p2;
        p2.destino = p1;
        this.tuneles.push(p1, p2);

        this.generarPezPoder(1550, 160);
        this.generarPezPoder(220, 1040);
    }

    generarPezPoder(fx, fy) {
        const x = fx || (150 + Math.random() * (ANCHO_MUNDO - 300));
        const y = fy || (150 + Math.random() * (ALTO_MUNDO - 300));
        const pez = this.add.text(x, y, "🐟", { fontSize: "26px" }).setOrigin(0.5).setDepth(10);
        this.physics.world.enable(pez);
        pez.body.setCircle(14);
        this.peces.add(pez);
        this.tweens.add({ targets: pez, y: y - 8, duration: 700, yoyo: true, repeat: -1 });
    }

    crearMuro(x, y, w, h) {
        const muro = this.muros.create(x, y, "tex-muro");
        muro.setDisplaySize(w, h);
        muro.refreshBody();
    }

    crearCaja(x, y) {
        const caja = this.cajas.create(x, y, "tex-caja");
        caja.setBounce(0.55).setDrag(360, 360).setCollideWorldBounds(true);
    }
actualizarAparienciaGato() {
        const skinId = modoJefeFacilier ? "tate_facilier" : (modoMulti ? skinGatoSala : skinActual);
        
        // Si eligió su personaje creado
        if (skinId === "custom_cat") {
            const guardado = localStorage.getItem("gato_custom_usuario");
            if (guardado) {
                const custom = JSON.parse(guardado);
                this.gatoSprite.setVisible(false);
                this.gatoTexto.setVisible(true).setText(custom.icono);
                this.sombreroGfx.setVisible(Boolean(custom.sombrero));
                this.etiquetaGato.setText(custom.nombre.toUpperCase()).setColor("#38bdf8");
                this.skinActualObj = custom;
                return;
            }
        }

        const skin = SKINS.find((s) => s.emoji === skinId) || SKINS[0];

        if (skin.archivoBase && this.textures.exists("tate-sprite")) {
            this.gatoSprite.setVisible(true);
            this.gatoTexto.setVisible(false);
            this.sombreroGfx.setVisible(Boolean(skin.sombrero || skin.facilier));
        } else {
            this.gatoSprite.setVisible(false);
            this.gatoTexto.setVisible(true).setText(skin.icono || skin.emoji);
            this.sombreroGfx.setVisible(false);
        }
        this.skinActualObj = skin;
    }
  

    configurarPartidaEnEscena() {
        vidasGato = 3;
        modoFuriaTimer = 0;
        invulnerableTimer = 0;
        perroAturdidoTimer = 0;

        const anchoActual = modoMulti ? ANCHO_CAMARA : ANCHO_MUNDO;
        const altoActual = modoMulti ? ALTO_CAMARA : ALTO_MUNDO;
        this.physics.world.setBounds(0, 0, anchoActual, altoActual);
        this.cameras.main.setBounds(0, 0, anchoActual, altoActual);
        this.dibujarZonasMundo(anchoActual, altoActual);

        this.actualizarAparienciaGato();
        this.construirMundoAbierto();
        this.cameras.main.setZoom(1);

        if (modoJefeFacilier) {
            this.perroContainer.setVisible(false);
            this.perroContainer.body.enable = false;
            this.textoVidas.setVisible(false);
            this.textoZona.setVisible(true);
            this.radarGfx.setVisible(true);
            this.gatoContainer.setPosition(200, 200);
            this.ratonContainer.setPosition(450, 350);
            this.etiquetaGato.setText("DR. FACILIER").setColor("#c084fc");
            this.etiquetaRaton.setText("TÚ").setColor("#4ade80");
            this.cameras.main.startFollow(this.ratonContainer, true, 0.12, 0.12);
        } else if (modoMulti) {
            this.perroContainer.setVisible(false);
            this.perroContainer.body.enable = false;
            this.textoVidas.setVisible(false);
            this.textoZona.setVisible(false);
            this.radarGfx.setVisible(false);
            this.cameras.main.stopFollow();
            this.cameras.main.setScroll(0, 0);
            this.gatoContainer.setPosition(480, 200);
            this.ratonContainer.setPosition(100, 200);
            this.etiquetaGato.setText(rolMulti === "gato" ? "TÚ" : "");
            this.etiquetaRaton.setText(rolMulti === "raton" ? "TÚ" : "");
        } else {
            this.perroContainer.setVisible(true);
            this.perroContainer.body.enable = true;
            this.perroContainer.setPosition(1350, 850);
            this.textoVidas.setVisible(true).setText("❤️❤️❤️");
            this.textoZona.setVisible(true);
            this.radarGfx.setVisible(true);
            this.gatoContainer.setPosition(300, 280);
            this.etiquetaGato.setText("");
            this.etiquetaRaton.setText("");
            this.cameras.main.startFollow(this.gatoContainer, true, 0.12, 0.12);
            this.reaparecerRatonSeguro();
        }
    }

    colisionConPerro() {
        if (perroAturdidoTimer > 0) return;

        if (modoFuriaTimer > 0) {
            perroAturdidoTimer = 6.0;
            puntos += 5;
            capturasTotales += 2;
            monedas += 25;
            monedasPartida += 25;
            guardar("monedas", monedas);
            guardar("capturasTotales", capturasTotales);
            actualizarMarcador();
            sonar("nivel");
            this.cameras.main.shake(220, 0.015);
            this.emisor.setPosition(this.perroContainer.x, this.perroContainer.y);
            this.emisor.explode(28);
            this.textoFlotante(this.perroContainer.x, this.perroContainer.y - 24, "¡PERRO ESPANTADO +5 PTS!", "#facc15");
            return;
        }

        if (invulnerableTimer > 0) return;

        vidasGato--;
        invulnerableTimer = 2.2;
        sonar("error");
        this.cameras.main.shake(280, 0.02);
        this.textoVidas.setText("❤️".repeat(Math.max(0, vidasGato)) || "💀");
        this.textoFlotante(this.gatoContainer.x, this.gatoContainer.y - 24, "¡MORDIDA! -1 VIDA", "#ef4444");

        const ang = Phaser.Math.Angle.Between(this.perroContainer.x, this.perroContainer.y, this.gatoContainer.x, this.gatoContainer.y);
        this.gatoContainer.body.setVelocity(Math.cos(ang) * 420, Math.sin(ang) * 420);

        if (vidasGato <= 0) {
            mostrarLogro("🐕 ¡El Perro Guardián te atrapó!");
            terminarJuego();
        }
    }

    reaparecerRatonSeguro() {
        const gx = this.gatoContainer.x;
        const gy = this.gatoContainer.y;

        for (let intento = 0; intento < 45; intento++) {
            const rx = 80 + Math.random() * (ANCHO_MUNDO - 160);
            const ry = 80 + Math.random() * (ALTO_MUNDO - 160);
            if (Math.hypot(rx - gx, ry - gy) < DISTANCIA_MIN_APARICION) continue;

            let chocaMuro = false;
            this.muros.getChildren().forEach((m) => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(
                    new Phaser.Geom.Rectangle(rx - 20, ry - 20, 40, 40),
                    m.getBounds()
                )) chocaMuro = true;
            });
            if (!chocaMuro) {
                this.ratonContainer.setPosition(rx, ry);
                this.ratonContainer.body.setVelocity(0, 0);
                return;
            }
        }
        this.ratonContainer.setPosition(ANCHO_MUNDO - 160, ALTO_MUNDO - 160);
    }

    efectoAnimeCamara(texto, colorHex, colorStr) {
        this.cameras.main.shake(260, 0.014);
        this.cameras.main.zoomTo(1.15, 180, "Sine.easeOut", true, (cam, prog) => {
            if (prog === 1) this.cameras.main.zoomTo(1.0, 420, "Sine.easeInOut");
        });

        const banner = this.add.text(ANCHO_CAMARA / 2, ALTO_CAMARA / 2, texto, {
            fontFamily: "'Press Start 2P', Arial",
            fontSize: "13px",
            color: "#ffffff",
            backgroundColor: "rgba(6, 9, 17, 0.88)",
            padding: { x: 16, y: 12 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(55);

        this.tweens.add({
            targets: banner,
            scale: { from: 0.7, to: 1.05 },
            alpha: { from: 1, to: 0 },
            duration: 1100,
            ease: "Power2",
            onComplete: () => banner.destroy()
        });

        const onda = this.add.circle(this.gatoContainer.x, this.gatoContainer.y, 14).setStrokeStyle(4, colorHex, 1).setDepth(20);
        this.tweens.add({
            targets: onda,
            radius: 190,
            alpha: 0,
            duration: 480,
            onComplete: () => onda.destroy()
        });
    }

    textoFlotante(x, y, mensaje, color) {
        const txt = this.add.text(x, y, mensaje, {
            fontFamily: "'Press Start 2P', Arial",
            fontSize: "11px",
            color: color || "#fbbf24"
        }).setOrigin(0.5).setDepth(45);
        this.tweens.add({
            targets: txt,
            y: y - 34,
            alpha: 0,
            duration: 850,
            onComplete: () => txt.destroy()
        });
    }

    dibujarRadar() {
        if (modoMulti) return;
        this.radarGfx.clear();
        const rw = 120;
        const rh = 80;
        const rx = ANCHO_CAMARA - rw - 12;
        const ry = 14;

        this.radarGfx.fillStyle(0x060911, 0.82);
        this.radarGfx.fillRoundedRect(rx, ry, rw, rh, 6);
        this.radarGfx.lineStyle(1.5, 0x38bdf8, 0.7);
        this.radarGfx.strokeRoundedRect(rx, ry, rw, rh, 6);

        const gx = rx + (this.gatoContainer.x / ANCHO_MUNDO) * rw;
        const gy = ry + (this.gatoContainer.y / ALTO_MUNDO) * rh;
        this.radarGfx.fillStyle(0xfacc15, 1);
        this.radarGfx.fillCircle(gx, gy, 3.5);

        const mx = rx + (this.ratonContainer.x / ANCHO_MUNDO) * rw;
        const my = ry + (this.ratonContainer.y / ALTO_MUNDO) * rh;
        this.radarGfx.fillStyle(0x4ade80, 1);
        this.radarGfx.fillCircle(mx, my, 3);

        if (this.perroContainer.visible) {
            const px = rx + (this.perroContainer.x / ANCHO_MUNDO) * rw;
            const py = ry + (this.perroContainer.y / ALTO_MUNDO) * rh;
            this.radarGfx.fillStyle(modoFuriaTimer > 0 ? 0x38bdf8 : 0xef4444, 1);
            this.radarGfx.fillCircle(px, py, 3.5);
        }
    }

    update(time, delta) {
        if (!juegoIniciado) return;
        sincronizarMusica();

        if (pausado && !modoMulti && !modoJefeFacilier) {
            this.physics.pause();
            this.textoPausa.setVisible(true);
            return;
        } else {
            this.physics.resume();
            this.textoPausa.setVisible(false);
        }

        const dt = Math.min(delta / 1000, 0.1);
        if (modoFuriaTimer > 0) modoFuriaTimer = Math.max(0, modoFuriaTimer - dt);
        if (invulnerableTimer > 0) invulnerableTimer = Math.max(0, invulnerableTimer - dt);
        if (perroAturdidoTimer > 0) perroAturdidoTimer = Math.max(0, perroAturdidoTimer - dt);
        if (cooldownPortal > 0) cooldownPortal = Math.max(0, cooldownPortal - dt);

        this.gatoContainer.setAlpha(invulnerableTimer > 0 ? (Math.sin(time * 0.03) > 0 ? 0.35 : 1) : 1);

        this.auraGfx.clear();
        const t = time * 0.006;
        if (modoFuriaTimer > 0 || (this.skinActualObj && (this.skinActualObj.facilier || this.skinActualObj.sombrero || habilidadActivaTimer > 0))) {
            const col = modoFuriaTimer > 0 ? 0xfacc15 : (this.skinActualObj.skillHex || 0xa855f7);
            this.auraGfx.fillStyle(col, 0.28 + Math.sin(t * 2) * 0.08);
            this.auraGfx.fillCircle(0, 0, 32 + Math.sin(t * 3) * 4);
            this.auraGfx.lineStyle(2.5, col, 0.9);
            this.auraGfx.strokeCircle(0, 0, 28 + Math.cos(t * 2) * 3);
        }

        this.tuneles.forEach((tun) => { tun.rotation += 1.8 * dt; });
        this.revisarPortalesMundo();

        if (!modoMulti) {
            const ref = modoJefeFacilier ? this.ratonContainer : this.gatoContainer;
            const este = ref.x >= ANCHO_MUNDO / 2;
            const sur = ref.y >= ALTO_MUNDO / 2;
            const nombreZona = !este && !sur ? "🍳 LA COCINA" : (este && !sur ? "🌿 EL JARDÍN" : (!este && sur ? "🌙 CALLEJÓN VUDÚ" : "🧪 LABORATORIO IA"));
            this.textoZona.setText(`📍 ${nombreZona}`);
        }

        if (modoJefeFacilier) {
            this.moverEntidadConEntrada(this.ratonContainer, VELOCIDAD_RATON_JUGADOR_VUDU);
            const boostFinal = tiempo <= 15 ? 25 : 0;
            this.physics.moveToObject(this.gatoContainer, this.ratonContainer, VELOCIDAD_JEFE_FACILIER_BASE + boostFinal);
        } else if (modoMulti) {
            if (rolMulti === "gato") {
                const boost = habilidadActivaTipo === "overdrive" ? 1.45 : 1.0;
                this.moverEntidadConEntrada(this.gatoContainer, VELOCIDAD_GATO_1V1 * boost);
                this.ratonContainer.x += (destinoRemoto.x - this.ratonContainer.x) * 0.35;
                this.ratonContainer.y += (destinoRemoto.y - this.ratonContainer.y) * 0.35;
            } else {
                this.moverEntidadConEntrada(this.ratonContainer, VELOCIDAD_RATON_1V1);
                this.gatoContainer.x += (destinoRemoto.x - this.gatoContainer.x) * 0.35;
                this.gatoContainer.y += (destinoRemoto.y - this.gatoContainer.y) * 0.35;
            }
            enviarEstadoMulti();
        } else {
            const boost = (habilidadActivaTipo === "overdrive" || modoFuriaTimer > 0) ? 1.45 : 1.0;
            this.moverEntidadConEntrada(this.gatoContainer, velocidadGato * bonusSkin() * boost);
            this.actualizarRatonIAPhaser(dt);
            this.actualizarPerroGuardian();
        }

        if (modoJefeFacilier || modoMulti) {
            const prog = Math.max(0, tiempo / DURACION_PARTIDA);
            this.barraProgreso.width = ANCHO_CAMARA * prog;
            this.barraProgreso.fillColor = tiempo <= 10 ? 0xef4444 : (modoJefeFacilier ? 0xa855f7 : 0x22c55e);
        } else {
            const prog = (puntos % CAPTURAS_POR_NIVEL) / CAPTURAS_POR_NIVEL;
            this.barraProgreso.width = ANCHO_CAMARA * prog;
            this.barraProgreso.fillColor = modoFuriaTimer > 0 ? 0xfacc15 : 0x38bdf8;
        }

        this.stunTexto.setVisible(ratonAturdidoTimer > 0);
        this.dibujarRadar();
        actualizarTiempo(dt);
    }

    actualizarPerroGuardian() {
        if (!this.perroContainer.visible) return;
        if (perroAturdidoTimer > 0) {
            this.perroContainer.body.setVelocity(0, 0);
            this.perroLabel.setText("💫 ATURDIDO");
            return;
        }

        const distGato = Phaser.Math.Distance.Between(this.perroContainer.x, this.perroContainer.y, this.gatoContainer.x, this.gatoContainer.y);
        if (modoFuriaTimer > 0) {
            this.perroLabel.setText("😱 ¡HUYE!");
            const ang = Phaser.Math.Angle.Between(this.gatoContainer.x, this.gatoContainer.y, this.perroContainer.x, this.perroContainer.y);
            this.perroContainer.body.setVelocity(Math.cos(ang) * 210, Math.sin(ang) * 210);
        } else if (distGato < 340) {
            this.perroLabel.setText("💢 ¡TE VIO!");
            this.physics.moveToObject(this.perroContainer, this.gatoContainer, 225 + nivel * 8);
        } else {
            this.perroLabel.setText("🐕 PATRULLANDO");
            this.physics.moveToObject(this.perroContainer, this.gatoContainer, 115);
        }
    }

    revisarPortalesMundo() {
        if (cooldownPortal > 0 || this.tuneles.length < 2) return;
        for (const tun of this.tuneles) {
            if (Math.hypot(this.gatoContainer.x - tun.x, this.gatoContainer.y - tun.y) < 26) {
                cooldownPortal = 3.0;
                sonar("tunel");
                this.emisor.setPosition(tun.x, tun.y);
                this.emisor.explode(18);
                this.gatoContainer.setPosition(tun.destino.x, tun.destino.y);
                this.emisor.setPosition(tun.destino.x, tun.destino.y);
                this.emisor.explode(18);
                this.textoFlotante(tun.destino.x, tun.destino.y - 24, "¡PORTAL!", "#a855f7");
                return;
            }
            if (Math.hypot(this.ratonContainer.x - tun.x, this.ratonContainer.y - tun.y) < 24) {
                cooldownPortal = 3.0;
                sonar("tunel");
                this.ratonContainer.setPosition(tun.destino.x, tun.destino.y);
                return;
            }
        }
    }

    moverEntidadConEntrada(entidad, velocidad) {
        let dx = (teclas.derecha ? 1 : 0) - (teclas.izquierda ? 1 : 0);
        let dy = (teclas.abajo ? 1 : 0) - (teclas.arriba ? 1 : 0);

        if (dx !== 0 && dy !== 0) {
            dx *= Math.SQRT1_2;
            dy *= Math.SQRT1_2;
        }

        if (toque.activo) {
            const ox = toque.x - entidad.x;
            const oy = toque.y - entidad.y;
            const dist = Math.hypot(ox, oy);
            if (dist > 10) {
                dx = ox / dist;
                dy = oy / dist;
            } else {
                dx = 0;
                dy = 0;
            }
        }
        entidad.body.setVelocity(dx * velocidad, dy * velocidad);
    }
actualizarRatonIAPhaser(dt) {
        if (ratonAturdidoTimer > 0) {
            this.ratonContainer.body.setVelocity(0, 0);
            return;
        }

        if (habilidadActivaTipo === "magnet") {
            this.physics.moveToObject(this.ratonContainer, this.gatoContainer, 240);
            this.cajas.getChildren().forEach((caja) => {
                if (Math.hypot(caja.x - this.gatoContainer.x, caja.y - this.gatoContainer.y) < 220) {
                    this.physics.moveToObject(caja, this.gatoContainer, 160);
                }
            });
            return;
        }

        const dif = DIFICULTADES[dificultad - 1];
        temporizadorDecisionIA += dt;

        if (temporizadorDecisionIA >= SEGUNDOS_ENTRE_DECISIONES) {
            temporizadorDecisionIA = 0;

            // Predecimos dónde estará el gato en 0.35 segundos según su velocidad
            const gatoFuturoX = this.gatoContainer.x + (this.gatoContainer.body.velocity.x * 0.35);
            const gatoFuturoY = this.gatoContainer.y + (this.gatoContainer.body.velocity.y * 0.35);
            const estadoActual = obtenerEstadoRed(this.ratonContainer.x, this.ratonContainer.y, gatoFuturoX, gatoFuturoY);

            if (ultimoEstadoIA !== null && ultimaAccionIA !== null) {
                // Castigo si el ratón choca contra muro o caja; premio extra si se aleja
                const chocoPared = this.ratonContainer.body.blocked.none === false;
                const distGato = Math.hypot(this.ratonContainer.x - this.gatoContainer.x, this.ratonContainer.y - this.gatoContainer.y);
                let recompensa = PREMIO_VIVO;
                if (chocoPared) recompensa -= 1.5; // Aprende a no acorralarse contra paredes
                if (distGato > 260) recompensa += 0.4; // Premia mantener distancia segura

                memoria.push({ estado: ultimoEstadoIA, accion: ultimaAccionIA, recompensa: recompensa, estadoNuevo: estadoActual });
                if (memoria.length > MEMORIA_MAX) memoria.shift();
                if (memoria.length >= TAMANO_LOTE) {
                    const lote = [];
                    for (let i = 0; i < TAMANO_LOTE; i++) lote.push(memoria[Math.floor(Math.random() * memoria.length)]);
                    entrenarLote(lote, redRaton);
                }
            }

            const epsilon = Math.max(0.04, 0.25 - partidasEntrenadas * 0.001);
            let accionElegida = 0;
            const res = propagarRed(estadoActual, redRaton);

            if (Math.random() < epsilon) {
                accionElegida = Math.floor(Math.random() * SALIDAS_RED);
            } else {
                let mejorQ = res.salidas[0];
                for (let i = 1; i < SALIDAS_RED; i++) {
                    if (res.salidas[i] > mejorQ) { mejorQ = res.salidas[i]; accionElegida = i; }
                }
            }

            accionActualRaton = ACCIONES_IA[accionElegida];
            ultimoEstadoIA = estadoActual;
            ultimaAccionIA = accionElegida;
        }

        const mov = accionActualRaton || ACCIONES_IA[0];
        const nivelAprendizaje = Math.min(experienciaRaton, TOPE_APRENDIZAJE);
        let vel = (170 + nivel * 15 + nivelAprendizaje * 0.72) * dif.factorRaton;
        vel = Math.min(vel, velocidadGato * 1.05);
        this.ratonContainer.body.setVelocity(mov.dx * vel, mov.dy * vel);
    }
}

function guardarGatoCustom(nombre, icono, colorHex, conSombrero, poder) {
    const custom = {
        nombre: nombre || "Mi Gato",
        emoji: "custom_cat",
        icono: icono || "🐱",
        skillHex: parseInt(colorHex.replace("#", "0x"), 16),
        sombrero: conSombrero,
        habilidad: poder // "overdrive" o "magnet"
    };
    localStorage.setItem("gato_custom_usuario", JSON.stringify(custom));
    skinActual = "custom_cat";
}

function iniciarMotorPhaser() {
    if (phaserGame) {
        if (escenaActiva) escenaActiva.configurarPartidaEnEscena();
        return;
    }
    phaserGame = new Phaser.Game({
        type: Phaser.AUTO,
        width: ANCHO_CAMARA,
        height: ALTO_CAMARA,
        parent: "phaser-contenedor",
        backgroundColor: "#0d1322",
        physics: {
            default: "arcade",
            arcade: { debug: false }
        },
        scene: [EscenaGatoCazador]
    });
}
    
        },
        scene: [EscenaGatoCazador]
    });
}

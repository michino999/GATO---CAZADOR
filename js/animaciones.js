// ==========================================
// ANIMACIONES ESTILO THE BATTLE CATS
// ==========================================

function ejecutarAnimacionHabilidad(escena, skin, origenX, origenY, destinoX, destinoY) {
    if (!escena || !skin) return;

    const tipo = skin.skillType || "overdrive";
    const colorHex = skin.skillHex || 0x38bdf8;
    const ancho = escena.cameras.main.width || 800;
    const alto = escena.cameras.main.height || 520;

    // 1. Telón dramático + Franja estilo manga/Battle Cats con el nombre del ataque
    const telon = escena.add.rectangle(ancho / 2, alto / 2, ancho, alto, 0x000000, 0.52)
        .setScrollFactor(0).setDepth(100);
    escena.tweens.add({
        targets: telon,
        alpha: 0,
        duration: 600,
        onComplete: () => telon.destroy()
    });

    const franja = escena.add.rectangle(ancho / 2, alto * 0.24, ancho, 48, colorHex, 0.9)
        .setScrollFactor(0).setDepth(102).setScale(1, 0);

    const textoAtaque = escena.add.text(ancho / 2, alto * 0.24, `★ ${(skin.skillName || "PODER ESPECIAL").toUpperCase()} ★`, {
        fontFamily: "'Press Start 2P', Arial",
        fontSize: "13px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(103);

    escena.tweens.add({
        targets: franja,
        scaleY: 1,
        duration: 110,
        yoyo: true,
        hold: 380,
        onComplete: () => franja.destroy()
    });

    escena.tweens.add({
        targets: textoAtaque,
        x: { from: ancho + 180, to: ancho / 2 },
        duration: 150,
        ease: "Back.easeOut",
        onComplete: () => {
            escena.tweens.add({
                targets: textoAtaque,
                alpha: 0,
                delay: 340,
                duration: 180,
                onComplete: () => textoAtaque.destroy()
            });
        }
    });

    // 2. Deformación caricaturesca del gato (Squash & Stretch)
    if (escena.gatoContainer) {
        escena.tweens.add({
            targets: escena.gatoContainer,
            scaleX: 1.65,
            scaleY: 0.6,
            duration: 120,
            yoyo: true,
            ease: "Quad.easeOut"
        });
    }

    // 3. Animación única según el gato
    if (tipo === "blink") {
        // TATE: Rayo celestial + estrella gigante estilo Uber Rare
        const rayo = escena.add.rectangle(destinoX, destinoY - 220, 60, 480, 0xfef08a, 0.95).setDepth(95);
        const nucleo = escena.add.rectangle(destinoX, destinoY - 220, 22, 480, 0xffffff, 1).setDepth(96);
        escena.tweens.add({
            targets: [rayo, nucleo],
            scaleX: 0,
            alpha: 0,
            duration: 450,
            ease: "Power2",
            onComplete: () => { rayo.destroy(); nucleo.destroy(); }
        });

        const estrella = escena.add.star(destinoX, destinoY, 6, 16, 65, 0xfacc15, 0.95).setDepth(94);
        escena.tweens.add({
            targets: estrella,
            scale: 2.4,
            angle: 120,
            alpha: 0,
            duration: 480,
            onComplete: () => estrella.destroy()
        });

    } else if (tipo === "stun") {
        // LEÓN DORADO: Triple onda sónica expansiva (Rugido Sísmico)
        for (let i = 0; i < 3; i++) {
            const onda = escena.add.circle(origenX, origenY, 18)
                .setStrokeStyle(6 - i * 1.5, 0xfacc15, 1)
                .setDepth(94);
            escena.tweens.add({
                targets: onda,
                radius: 250 + i * 40,
                alpha: 0,
                delay: i * 80,
                duration: 480,
                onComplete: () => onda.destroy()
            });
        }

    } else if (tipo === "magnet") {
        // TATE INFIERNO: Círculo rúnico giratorio + llamas ascendentes
        const circulo = escena.add.graphics({ x: origenX, y: origenY }).setDepth(94);
        circulo.lineStyle(4, 0xef4444, 1);
        circulo.strokeCircle(0, 0, 85);
        circulo.strokeCircle(0, 0, 50);
        for (let a = 0; a < 6; a++) {
            const ang = (a * Math.PI) / 3;
            circulo.lineBetween(Math.cos(ang) * 50, Math.sin(ang) * 50, Math.cos(ang) * 105, Math.sin(ang) * 105);
        }
        escena.tweens.add({
            targets: circulo,
            angle: 360,
            scale: { from: 0.4, to: 1.65 },
            alpha: { from: 1, to: 0 },
            duration: 1800,
            onComplete: () => circulo.destroy()
        });

    } else if (tipo === "voodoo") {
        // DR. FACILIER: Cartas vudú girando + explosión morada
        const simbolos = ["🃏", "🔮", "💀", "🎴", "✨"];
        for (let i = 0; i < 12; i++) {
            const ang = (i / 12) * Math.PI * 2;
            const carta = escena.add.text(
                destinoX + Math.cos(ang) * 125,
                destinoY + Math.sin(ang) * 125,
                simbolos[i % simbolos.length],
                { fontSize: "22px" }
            ).setOrigin(0.5).setDepth(95);

            escena.tweens.add({
                targets: carta,
                x: destinoX,
                y: destinoY,
                angle: 360,
                scale: { from: 1.5, to: 0.2 },
                alpha: 0,
                duration: 540,
                ease: "Back.easeIn",
                onComplete: () => carta.destroy()
            });
        }

        const auraMorada = escena.add.circle(destinoX, destinoY, 22, 0xa855f7, 0.8).setDepth(93);
        escena.tweens.add({
            targets: auraMorada,
            scale: 4.8,
            alpha: 0,
            duration: 520,
            onComplete: () => auraMorada.destroy()
        });

    } else {
        // CLÁSICO / GUEPARDO: Estela de clones fantasma a toda velocidad
        escena.time.addEvent({
            delay: 85,
            repeat: 20,
            callback: () => {
                if (!escena.gatoContainer) return;
                const fantasma = escena.add.text(
                    escena.gatoContainer.x,
                    escena.gatoContainer.y,
                    skin.icono || skin.emoji || "🐱",
                    { fontSize: "34px" }
                ).setOrigin(0.5).setAlpha(0.75).setTint(colorHex).setDepth(90);

                escena.tweens.add({
                    targets: fantasma,
                    alpha: 0,
                    scale: 0.5,
                    duration: 280,
                    onComplete: () => fantasma.destroy()
                });
            }
        });
    }

    // 4. Sacudida de cámara en el impacto
    escena.cameras.main.shake(300, 0.02);
}

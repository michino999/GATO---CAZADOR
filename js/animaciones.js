// ==========================================
// ANIMACIONES ESTILO THE BATTLE CATS
// ==========================================

function ejecutarAnimacionHabilidad(escena, skin, origenX, origenY, destinoX, destinoY) {
    if (!escena || !skin) return;

    const tipo = skin.skillType;
    const colorHex = skin.skillHex || 0x38bdf8;
    const ancho = escena.cameras.main.width;
    const alto = escena.cameras.main.height;

    // 1. Telón dramático + Franja estilo manga con el nombre del ataque
    const telon = escena.add.rectangle(ancho / 2, alto / 2, ancho, alto, 0x000000, 0.48)
        .setScrollFactor(0).setDepth(50);
    escena.tweens.add({
        targets: telon,
        alpha: 0,
        duration: 580,
        onComplete: () => telon.destroy()
    });

    const franja = escena.add.rectangle(ancho / 2, alto * 0.24, ancho, 44, colorHex, 0.88)
        .setScrollFactor(0).setDepth(52).setScale(1, 0);

    const textoAtaque = escena.add.text(ancho / 2, alto * 0.24, `★ ${skin.skillName.toUpperCase()} ★`, {
        fontFamily: "'Press Start 2P', Arial",
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(53);

    escena.tweens.add({
        targets: franja,
        scaleY: 1,
        duration: 110,
        yoyo: true,
        hold: 360,
        onComplete: () => franja.destroy()
    });

    escena.tweens.add({
        targets: textoAtaque,
        x: { from: ancho + 160, to: ancho / 2 },
        duration: 150,
        ease: "Back.easeOut",
        onComplete: () => {
            escena.tweens.add({
                targets: textoAtaque,
                alpha: 0,
                delay: 320,
                duration: 180,
                onComplete: () => textoAtaque.destroy()
            });
        }
    });

    // 2. Deformación caricaturesca del gato (Squash & Stretch)
    if (escena.gatoContainer) {
        escena.tweens.add({
            targets: escena.gatoContainer,
            scaleX: 1.6,
            scaleY: 0.6,
            duration: 110,
            yoyo: true,
            ease: "Quad.easeOut"
        });
    }

    // 3. Animación única según el gato
    if (tipo === "blink") {
        // TATE: Rayo celestial + estrella gigante estilo Uber Rare
        const rayo = escena.add.rectangle(destinoX, destinoY - 220, 56, 480, 0xfef08a, 0.95).setDepth(35);
        const nucleo = escena.add.rectangle(destinoX, destinoY - 220, 20, 480, 0xffffff, 1).setDepth(36);
        escena.tweens.add({
            targets: [rayo, nucleo],
            scaleX: 0,
            alpha: 0,
            duration: 420,
            ease: "Power2",
            onComplete: () => { rayo.destroy(); nucleo.destroy(); }
        });

        const estrella = escena.add.star(destinoX, destinoY, 6, 14, 60, 0xfacc15, 0.9).setDepth(34);
        escena.tweens.add({
            targets: estrella,
            scale: 2.3,
            angle: 120,
            alpha: 0,
            duration: 460,
            onComplete: () => estrella.destroy()
        });

    } else if (tipo === "stun") {
        // LEÓN DORADO: Triple onda sónica expansiva (Rugido Sísmico)
        for (let i = 0; i < 3; i++) {
            const onda = escena.add.circle(origenX, origenY, 16)
                .setStrokeStyle(6 - i * 1.5, 0xfacc15, 1)
                .setDepth(28);
            escena.tweens.add({
                targets: onda,
                radius: 240 + i * 35,
                alpha: 0,
                delay: i * 80,
                duration: 460,
                onComplete: () => onda.destroy()
            });
        }

    } else if (tipo === "magnet") {
        // TATE INFIERNO: Círculo rúnico giratorio + llamas ascendentes
        const circulo = escena.add.graphics({ x: origenX, y: origenY }).setDepth(14);
        circulo.lineStyle(4, 0xef4444, 1);
        circulo.strokeCircle(0, 0, 80);
        circulo.strokeCircle(0, 0, 48);
        for (let a = 0; a < 6; a++) {
            const ang = (a * Math.PI) / 3;
            circulo.lineBetween(Math.cos(ang) * 48, Math.sin(ang) * 48, Math.cos(ang) * 100, Math.sin(ang) * 100);
        }
        escena.tweens.add({
            targets: circulo,
            angle: 360,
            scale: { from: 0.4, to: 1.6 },
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
                destinoX + Math.cos(ang) * 120,
                destinoY + Math.sin(ang) * 120,
                simbolos[i % simbolos.length],
                { fontSize: "20px" }
            ).setOrigin(0.5).setDepth(35);

            escena.tweens.add({
                targets: carta,
                x: destinoX,
                y: destinoY,
                angle: 360,
                scale: { from: 1.4, to: 0.2 },
                alpha: 0,
                duration: 520,
                ease: "Back.easeIn",
                onComplete: () => carta.destroy()
            });
        }

        const auraMorada = escena.add.circle(destinoX, destinoY, 20, 0xa855f7, 0.75).setDepth(33);
        escena.tweens.add({
            targets: auraMorada,
            scale: 4.5,
            alpha: 0,
            duration: 500,
            onComplete: () => auraMorada.destroy()
        });

    } else {
        // CLÁSICO / GUEPARDO: Estela de clones fantasma a toda velocidad
        escena.time.addEvent({
            delay: 85,
            repeat: 18,
            callback: () => {
                if (!escena.gatoContainer) return;
                const fantasma = escena.add.text(
                    escena.gatoContainer.x,
                    escena.gatoContainer.y,
                    skin.icono || skin.emoji || "🐱",
                    { fontSize: "34px" }
                ).setOrigin(0.5).setAlpha(0.65).setTint(colorHex).setDepth(14);

                escena.tweens.add({
                    targets: fantasma,
                    alpha: 0,
                    scale: 0.5,
                    duration: 260,
                    onComplete: () => fantasma.destroy()
                });
            }
        });
    }

    // 4. Sacudida de cámara en el impacto
    escena.cameras.main.shake(280, 0.018);
}

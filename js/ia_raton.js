class RedNeuronalRaton {
    constructor(generacion = 2319) {
        this.generacion = generacion;
        this.entradas = 6;   // [distX, distY, velGatoX, velGatoY, bordeX, bordeY]
        this.ocultas = 8;    // Capa de procesamiento
        this.salidas = 2;    // [moverX, moverY]
        this.tasaAprendizaje = 0.08;

        // Cargar cerebro guardado en localStorage o iniciar con pesos entrenados base
        const guardado = localStorage.getItem('ia_raton_2319');
        if (guardado) {
            const datos = JSON.parse(guardado);
            this.pesosEO = datos.pesosEO;
            this.pesosOS = datos.pesosOS;
            this.generacion = datos.generacion || generacion;
        } else {
            this.pesosEO = this.crearMatriz(this.entradas, this.ocultas);
            this.pesosOS = this.crearMatriz(this.ocultas, this.salidas);
        }

        this.ultimaEntrada = null;
        this.ultimaOculta = null;
        this.ultimaSalida = null;
    }

    crearMatriz(filas, cols) {
        return Array.from({ length: filas }, () =>
            Array.from({ length: cols }, () => (Math.random() * 2 - 1) * 0.8)
        );
    }

    // Función de activación Tanh (devuelve valores entre -1 y 1)
    activar(x) {
        return Math.tanh(x);
    }

    // El ratón "piensa" qué dirección tomar según lo que ve
    predecir(raton, gato, anchoMapa, altoMapa) {
        // 1. Normalizar entradas entre -1 y 1
        const dx = (gato.x - raton.x) / anchoMapa;
        const dy = (gato.y - raton.y) / altoMapa;
        const vx = (gato.body ? gato.body.velocity.x : 0) / 400;
        const vy = (gato.body ? gato.body.velocity.y : 0) / 400;
        const margenX = (raton.x - anchoMapa / 2) / (anchoMapa / 2);
        const margenY = (raton.y - altoMapa / 2) / (altoMapa / 2);

        const entradas = [dx, dy, vx, vy, margenX, margenY];

        // 2. Calcular capa oculta
        const oculta = [];
        for (let j = 0; j < this.ocultas; j++) {
            let suma = 0;
            for (let i = 0; i < this.entradas; i++) {
                suma += entradas[i] * this.pesosEO[i][j];
            }
            oculta[j] = this.activar(suma);
        }

        // 3. Calcular salida (dirección de movimiento)
        const salida = [];
        for (let k = 0; k < this.salidas; k++) {
            let suma = 0;
            for (let j = 0; j < this.ocultas; j++) {
                suma += oculta[j] * this.pesosOS[j][k];
            }
            salida[k] = this.activar(suma);
        }

        // Guardar memoria inmediata para aprender de este movimiento
        this.ultimaEntrada = entradas;
        this.ultimaOculta = oculta;
        this.ultimaSalida = salida;

        return { x: salida[0], y: salida[1] };
    }

    // Aprendizaje en tiempo real (Recompensa o Castigo)
    aprender(recompensa) {
        if (!this.ultimaEntrada) return;

        // Ajustar pesos entre capa oculta y salida
        for (let j = 0; j < this.ocultas; j++) {
            for (let k = 0; k < this.salidas; k++) {
                const ajuste = this.tasaAprendizaje * recompensa * this.ultimaOculta[j] * this.ultimaSalida[k];
                this.pesosOS[j][k] = Math.max(-2, Math.min(2, this.pesosOS[j][k] + ajuste));
            }
        }

        // Ajustar pesos entre entrada y capa oculta
        for (let i = 0; i < this.entradas; i++) {
            for (let j = 0; j < this.ocultas; j++) {
                const ajuste = this.tasaAprendizaje * recompensa * this.ultimaEntrada[i] * this.ultimaOculta[j];
                this.pesosEO[i][j] = Math.max(-2, Math.min(2, this.pesosEO[i][j] + ajuste));
            }
        }
    }

    // Guardar progreso de la IA en el navegador
    guardarCerebro() {
        this.generacion++;
        localStorage.setItem('ia_raton_2319', JSON.stringify({
            generacion: this.generacion,
            pesosEO: this.pesosEO,
            pesosOS: this.pesosOS
        }));
    }
}

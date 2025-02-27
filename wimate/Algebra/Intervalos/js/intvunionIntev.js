(function() {
  // --- Parámetros y utilidades ---
  const canvas = document.getElementById("canvasUnionIntvs");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const MARGIN = 50; // margen para la recta numérica

  // Rango del "mundo": de -2 a 10 (para intervalos enteros)
  const worldMin = -2, worldMax = 10;
  function worldToCanvas(x) {
    return MARGIN + ((x - worldMin) / (worldMax - worldMin)) * (WIDTH - 2 * MARGIN);
  }
  function canvasToWorld(x) {
    return worldMin + ((x - MARGIN) / (WIDTH - 2 * MARGIN)) * (worldMax - worldMin);
  }
  const RADIUS = 8; // radio para dibujar los discos de los extremos

  // --- Intervalos iniciales fijos ---
  // Intervalo 1 inicial: [0,4]
  let intervalo1 = {
    a: 0,
    b: 4,
    aClosed: true,
    bClosed: true,
    color: "blue",
    grosor: 6
  };
  // Intervalo 2 inicial: ]2,6[ (ambos extremos abiertos)
  let intervalo2 = {
    p: 2,
    q: 6,
    pClosed: false,
    qClosed: false,
    color: "green",
    grosor: 8,
    alpha: 0.6
  };

  // La unión se calculará al pulsar el botón "Cálculo y representación gráfica de la Union".
  // Será un objeto si se fusionan o un array de dos intervalos si son disjuntos.
  let unionIntervalo = null;

  // Variables para el control del arrastre (si se implementara interactividad adicional)
  let dragging = null; // { id: "intervalo1" o "intervalo2", extremo: "a"/"b" o "p"/"q" }
  let offsetX = 0;
  let skipMouseup = false; // para evitar que el mouseup sobrescriba una actualización tras dblclick

  // Referencias a los controles HTML
  const int1Input = document.getElementById("int1Union");
  const int2Input = document.getElementById("int2Union");
  const resultadoDiv = document.getElementById("resultadoUnion");

  // --- Función de redondeo ---
  // Redondea a dos decimales; si la parte decimal es menor que 0.08, redondea al entero.
  function redondear(x) {
    const factor = 100;
    let r = Math.round(x * factor) / factor;
    const diff = Math.abs(x - Math.round(x));
    return diff < 0.08 ? Math.round(x) : r;
  }

  // --- Actualizar campos de texto ---
  // Actualiza los inputs con la notación de cada intervalo.
  function actualizarCamposTexto() {
    const int1 = (intervalo1.aClosed ? "[" : "]") + intervalo1.a + "," + intervalo1.b + (intervalo1.bClosed ? "]" : "[");
    const int2 = (intervalo2.pClosed ? "[" : "]") + intervalo2.p + "," + intervalo2.q + (intervalo2.qClosed ? "]" : "[");
    int1Input.value = int1;
    int2Input.value = int2;
  }

  // --- Generar intervalos aleatorios ---
  // Genera dos intervalos aleatorios (con extremos enteros entre -2 y 10) y actualiza los campos de texto.
  // Además, limpia la zona de graficación y el resultado.
  function generarIntervalos() {
    function randomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // Generar para el primer intervalo: a entre -2 y 9, b entre a+1 y 10.
    const a = randomInt(worldMin, 9);
    const b = randomInt(a + 1, worldMax);
    intervalo1 = {
      a: a,
      b: b,
      aClosed: Math.random() < 0.5,
      bClosed: Math.random() < 0.5,
      color: "blue",
      grosor: 6
    };
    // Generar para el segundo intervalo: p entre -2 y 9, q entre p+1 y 10.
    const p = randomInt(worldMin, 9);
    const q = randomInt(p + 1, worldMax);
    intervalo2 = {
      p: p,
      q: q,
      pClosed: Math.random() < 0.5,
      qClosed: Math.random() < 0.5,
      color: "green",
      grosor: 8,
      alpha: 0.6
    };
    unionIntervalo = null; // se borra la unión previa
    // Limpiar la zona de graficación y el div de resultado.
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    resultadoDiv.innerHTML = "";
    actualizarCamposTexto();
  }

  // --- Cálculo de la Unión ---
  // Se consideran disjuntos si:
  //   • leftInterval.b < rightInterval.p, o
  //   • leftInterval.b === rightInterval.p y ambos extremos (b y p) son abiertos.
  function calcularUnion() {
    let leftInterval, rightInterval;
    if (intervalo1.a <= intervalo2.p) {
      leftInterval = intervalo1;
      rightInterval = intervalo2;
    } else {
      leftInterval = intervalo2;
      rightInterval = intervalo1;
    }
    if (leftInterval.b < rightInterval.p ||
       (leftInterval.b === rightInterval.p && !leftInterval.bClosed && !rightInterval.pClosed)) {
      // Son disjuntos: la unión es la unión de ambos intervalos (se muestran por separado).
      unionIntervalo = [
        { left: intervalo1.a, right: intervalo1.b, leftClosed: intervalo1.aClosed, rightClosed: intervalo1.bClosed },
        { left: intervalo2.p, right: intervalo2.q, leftClosed: intervalo2.pClosed, rightClosed: intervalo2.qClosed }
      ];
    } else {
      // Se fusionan:
      const unionLeft = leftInterval.a;
      const unionLeftClosed = (intervalo1.a === intervalo2.p)
          ? (intervalo1.aClosed || intervalo2.pClosed)
          : (leftInterval === intervalo1 ? intervalo1.aClosed : intervalo2.pClosed);
      let unionRight, unionRightClosed;
      if (intervalo1.b > intervalo2.q) {
        unionRight = intervalo1.b;
        unionRightClosed = intervalo1.bClosed;
      } else if (intervalo1.b < intervalo2.q) {
        unionRight = intervalo2.q;
        unionRightClosed = intervalo2.qClosed;
      } else {
        unionRight = intervalo1.b;
        unionRightClosed = intervalo1.bClosed || intervalo2.qClosed;
      }
      unionIntervalo = { left: unionLeft, right: unionRight, leftClosed: unionLeftClosed, rightClosed: unionRightClosed };
    }
    actualizarSalida();
    dibujar();
  }

  // --- Dibujo ---
  function dibujar() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const yLine = HEIGHT / 2;
    // Dibujar la recta numérica.
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, yLine);
    ctx.lineTo(WIDTH - MARGIN, yLine);
    ctx.stroke();
    // Dibujar marcas y números (cada unidad).
    ctx.fillStyle = "black";
    for (let i = Math.ceil(worldMin); i <= worldMax; i++) {
      const x = worldToCanvas(i);
      ctx.beginPath();
      ctx.moveTo(x, yLine - 5);
      ctx.lineTo(x, yLine + 5);
      ctx.stroke();
      ctx.fillText(i, x - 3, yLine + 20);
    }
    // Dibujar el primer intervalo (azul).
    dibujarIntervalo(intervalo1.a, intervalo1.b, intervalo1.aClosed, intervalo1.bClosed,
                     intervalo1.color, intervalo1.grosor, yLine);
    // Dibujar el segundo intervalo (verde, con transparencia).
    ctx.save();
    ctx.globalAlpha = intervalo2.alpha;
    dibujarIntervalo(intervalo2.p, intervalo2.q, intervalo2.pClosed, intervalo2.qClosed,
                     intervalo2.color, intervalo2.grosor, yLine);
    ctx.restore();
    // Dibujar la unión en magenta, 50 px arriba de la recta (si se ha calculado).
    if (unionIntervalo) {
      if (Array.isArray(unionIntervalo)) {
        unionIntervalo.forEach(seg => {
          dibujarIntervalo(seg.left, seg.right, seg.leftClosed, seg.rightClosed,
                           "magenta", 8, yLine - 50);
        });
      } else {
        dibujarIntervalo(unionIntervalo.left, unionIntervalo.right,
                         unionIntervalo.leftClosed, unionIntervalo.rightClosed,
                         "magenta", 8, yLine - 50);
      }
    }
  }

  // Dibuja un intervalo: traza el segmento y dibuja los discos en los extremos.
  function dibujarIntervalo(x1, x2, x1Closed, x2Closed, color, grosor, y) {
    const cx1 = worldToCanvas(x1);
    const cx2 = worldToCanvas(x2);
    ctx.strokeStyle = color;
    ctx.lineWidth = grosor;
    ctx.beginPath();
    ctx.moveTo(cx1, y);
    ctx.lineTo(cx2, y);
    ctx.stroke();
    function dibujarExtremo(x, cerrado) {
      ctx.beginPath();
      ctx.arc(x, y, RADIUS, 0, 2 * Math.PI);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (cerrado) {
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
    dibujarExtremo(cx1, x1Closed);
    dibujarExtremo(cx2, x2Closed);
  }

  // --- Impresión con MathJax ---
  // Actualiza el div "resultadoUnion" con la notación de la unión en el formato:
  // [a,b] ∪ [p,q[ = ... 
  function actualizarSalida() {
    const a = redondear(intervalo1.a);
    const b = redondear(intervalo1.b);
    const p = redondear(intervalo2.p);
    const q = redondear(intervalo2.q);
    const int1 = (intervalo1.aClosed ? "[" : "]") + a + "," + b + (intervalo1.bClosed ? "]" : "[");
    const int2 = (intervalo2.pClosed ? "[" : "]") + p + "," + q + (intervalo2.qClosed ? "]" : "[");
    let unionStr = "";
    if (unionIntervalo) {
      if (Array.isArray(unionIntervalo)) {
        unionStr = unionIntervalo.map(seg => {
          const L = redondear(seg.left);
          const R = redondear(seg.right);
          const leftB = seg.leftClosed ? "[" : "]";
          const rightB = seg.rightClosed ? "]" : "[";
          return leftB + L + "," + R + rightB;
        }).join(" \\cup ");
      } else {
        const L = redondear(unionIntervalo.left);
        const R = redondear(unionIntervalo.right);
        const leftB = unionIntervalo.leftClosed ? "[" : "]";
        const rightB = unionIntervalo.rightClosed ? "]" : "[";
        unionStr = leftB + L + "," + R + rightB;
      }
    }
    const texString = `\\( ${int1} \\cup ${int2} = ${unionStr} \\)`;
    resultadoDiv.innerHTML = texString;
    if (window.MathJax) {
      MathJax.typesetPromise();
    }
  }

  // --- Eventos de los botones ---
  // Al presionar "Generar Intervalos": se generan nuevos intervalos aleatorios,
  // se limpian la zona de graficación y el resultado, y se actualizan los campos de texto.
  document.getElementById("btnGenerarUnion").addEventListener("click", () => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    resultadoDiv.innerHTML = "";
    generarIntervalos();
  });
  // Al presionar "Cálculo y representación gráfica de la Union": se calcula la unión y se dibuja.
  document.getElementById("btnCalcularUnion").addEventListener("click", () => {
    calcularUnion();
  });

  // Al cargar, se actualizan los campos de texto (intervalos iniciales [0,4] y ]2,6[)
  actualizarCamposTexto();
})();

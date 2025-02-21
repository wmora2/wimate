(function() {
  // --- Parámetros y utilidades ---
  const canvas = document.getElementById("canvasUnion");
  const ctx = canvas.getContext("2d");
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const MARGIN = 50; // margen para la recta numérica

  // Rango del "mundo": de -10 a 10
  const worldMin = -10, worldMax = 10;
  function worldToCanvas(x) {
    return MARGIN + ((x - worldMin) / (worldMax - worldMin)) * (WIDTH - 2 * MARGIN);
  }
  function canvasToWorld(x) {
    return worldMin + ((x - MARGIN) / (WIDTH - 2 * MARGIN)) * (worldMax - worldMin);
  }
  const RADIUS = 8; // radio para los discos de los extremos

  // --- Datos de los intervalos iniciales ---
  let intervalo1 = {
    a: -2,
    b: 3,
    aClosed: true,
    bClosed: true,
    color: "blue",
    grosor: 6
  };
  let intervalo2 = {
    p: 0,
    q: 4,
    pClosed: true,
    qClosed: false,
    color: "green",
    grosor: 8,
    alpha: 0.6
  };

  // La unión se calcula al soltar el mouse.
  // Si se solapan (o tocan con al menos un extremo cerrado) se fusionan;
  // si son disjuntos (b < p o coinciden en el extremo y ambos son abiertos) se muestran como dos segmentos.
  let unionIntervalo = null;

  // Variables para el control del arrastre
  let dragging = null; // { id: "intervalo1" o "intervalo2", extremo: "a"/"b" o "p"/"q" }
  let offsetX = 0;
  let skipMouseup = false; // bandera para evitar que mouseup sobrescriba una actualización de dblclick

  // Referencias a los controles (si se quieren seguir usando)
  const int1Input = document.getElementById("intUnion");
  const int2Input = document.getElementById("int2Union");
  const resultadoDiv = document.getElementById("resultadoUnion");

  // --- Función de redondeo ---
  function redondear(x) {
    const factor = 100;
    let r = Math.round(x * factor) / factor;
    const diff = Math.abs(x - Math.round(x));
    return (diff < 0.08) ? Math.round(x) : r;
  }

  // --- Cálculo de la Unión ---
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
      unionIntervalo = [
        { left: intervalo1.a, right: intervalo1.b, leftClosed: intervalo1.aClosed, rightClosed: intervalo1.bClosed },
        { left: intervalo2.p, right: intervalo2.q, leftClosed: intervalo2.pClosed, rightClosed: intervalo2.qClosed }
      ];
      return;
    }
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

  // --- Dibujo ---
  function dibujar() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    const yLine = HEIGHT / 2;
    // Dibujar la recta numérica
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(MARGIN, yLine);
    ctx.lineTo(WIDTH - MARGIN, yLine);
    ctx.stroke();
    // Marcas y números
    ctx.fillStyle = "black";
    for (let i = Math.ceil(worldMin); i <= worldMax; i++) {
      const x = worldToCanvas(i);
      ctx.beginPath();
      ctx.moveTo(x, yLine - 5);
      ctx.lineTo(x, yLine + 5);
      ctx.stroke();
      ctx.fillText(i, x - 3, yLine + 20);
    }
    // Dibujar intervalo 1 (azul)
    dibujarIntervalo(intervalo1.a, intervalo1.b, intervalo1.aClosed, intervalo1.bClosed,
                     intervalo1.color, intervalo1.grosor, yLine);
    // Dibujar intervalo 2 (verde, con transparencia)
    ctx.save();
    ctx.globalAlpha = intervalo2.alpha;
    dibujarIntervalo(intervalo2.p, intervalo2.q, intervalo2.pClosed, intervalo2.qClosed,
                     intervalo2.color, intervalo2.grosor, yLine);
    ctx.restore();
    // Dibujar la unión en magenta, 50 px arriba de la recta
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
    // Imprimir la notación de la unión directamente sobre el canvas, justo encima del segmento magenta.
    imprimirUnionEnCanvas(yLine - 70);
  }

  // Dibuja un intervalo: traza el segmento y dibuja los extremos
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

  // Imprime la notación de la unión sobre el canvas, justo encima del segmento magenta.
  function imprimirUnionEnCanvas(yPos) {
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
        }).join(" ∪ ");
      } else {
        const L = redondear(unionIntervalo.left);
        const R = redondear(unionIntervalo.right);
        const leftB = unionIntervalo.leftClosed ? "[" : "]";
        const rightB = unionIntervalo.rightClosed ? "]" : "[";
        unionStr = leftB + L + "," + R + rightB;
      }
    }
    // Construir la cadena de unión
    const unionTexto = `${int1} ∪ ${int2} = ${unionStr}`;
    // Configurar el estilo del texto
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "black";
    // Centrar el texto horizontalmente
    const textWidth = ctx.measureText(unionTexto).width;
    const xText = (WIDTH - textWidth) / 2;
    ctx.fillText(unionTexto, xText, yPos);
  }

  // --- Eventos del ratón ---
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const yLine = HEIGHT / 2;
    function revisarExtremo(xWorld, idIntervalo, extremo) {
      const cx = worldToCanvas(xWorld);
      if (Math.abs(mouseX - cx) < RADIUS + 3 && Math.abs(mouseY - yLine) < RADIUS + 3) {
        dragging = { id: idIntervalo, extremo: extremo };
        offsetX = canvasToWorld(mouseX) - xWorld;
      }
    }
    revisarExtremo(intervalo1.a, "intervalo1", "a");
    revisarExtremo(intervalo1.b, "intervalo1", "b");
    revisarExtremo(intervalo2.p, "intervalo2", "p");
    revisarExtremo(intervalo2.q, "intervalo2", "q");
  });

  canvas.addEventListener("mousemove", (e) => {
    if (dragging) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const newVal = canvasToWorld(mouseX) - offsetX;
      if (dragging.id === "intervalo1") {
        if (dragging.extremo === "a" && newVal < intervalo1.b - 0.1) {
          intervalo1.a = newVal;
        } else if (dragging.extremo === "b" && newVal > intervalo1.a + 0.1) {
          intervalo1.b = newVal;
        }
      } else if (dragging.id === "intervalo2") {
        if (dragging.extremo === "p" && newVal < intervalo2.q - 0.1) {
          intervalo2.p = newVal;
        } else if (dragging.extremo === "q" && newVal > intervalo2.p + 0.1) {
          intervalo2.q = newVal;
        }
      }
      dibujar();
    }
  });

  canvas.addEventListener("mouseup", () => {
    if (skipMouseup) {
      skipMouseup = false;
      return;
    }
    if (dragging) {
      calcularUnion();
      dragging = null;
      dibujar();
    }
  });

  canvas.addEventListener("dblclick", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const yLine = HEIGHT / 2;
    function toggleExtremo(xWorld, propiedad, objeto) {
      const cx = worldToCanvas(xWorld);
      if (Math.abs(mouseX - cx) < RADIUS + 3 && Math.abs(mouseY - yLine) < RADIUS + 3) {
        objeto[propiedad] = !objeto[propiedad];
      }
    }
    toggleExtremo(intervalo1.a, "aClosed", intervalo1);
    toggleExtremo(intervalo1.b, "bClosed", intervalo1);
    toggleExtremo(intervalo2.p, "pClosed", intervalo2);
    toggleExtremo(intervalo2.q, "qClosed", intervalo2);
    calcularUnion();
    dibujar();
    // Evita que el mouseup posterior sobrescriba esta actualización.
    skipMouseup = true;
  });

  // Calcular unión inicial y dibujar
  calcularUnion();
  dibujar();
})();

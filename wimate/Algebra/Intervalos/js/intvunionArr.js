
/*
  Este script implementa:
    1. Un canvas interactivo contenido en un <div class="micaja">.
    2. Representación en la recta numérica de dos intervalos:
         • Primer intervalo: [a, b] (inicialmente [-2, 3])
         • Segundo intervalo: [p, q[ (inicialmente [0, 4[)
    3. Los intervalos se dibujan como segmentos gruesos:
         - Azul para el primero.
         - Verde (más grueso y con transparencia) para el segundo.
       Los extremos se representan con un disco relleno (si está cerrado) o disco abierto (si está abierto).
    4. Los extremos se pueden arrastrar y con doble click se cambia su estado (abierto/cerrado).
    5. Al soltar el ratón se calcula y dibuja la unión de los intervalos (en magenta) sobre la recta.
    6. Dentro del contenedor, justo debajo de la recta, se imprime la notación de la unión utilizando MathJax.
    7. Los extremos se redondean a dos decimales; si la parte decimal es menor que 0.08 se redondea al entero.
*/

// --- Parámetros iniciales y utilidades ---
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const MARGIN = 50;  // margen para la recta

// Definimos el mundo: de -10 a 10
const worldMin = -10, worldMax = 10;
function worldToCanvas(x) {
  return MARGIN + ((x - worldMin) / (worldMax - worldMin)) * (WIDTH - 2 * MARGIN);
}
function canvasToWorld(x) {
  return worldMin + ((x - MARGIN) / (WIDTH - 2 * MARGIN)) * (worldMax - worldMin);
}

// Radio para los discos de los extremos
const RADIUS = 8;

// Datos de los intervalos
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
  qClosed: false,  // [0,4[
  color: "green",
  grosor: 10,
  alpha: 0.6  // transparencia
};

// Unión (se calcula al soltar el ratón)
let unionIntervalo = null; // {left, right, leftClosed, rightClosed}

// Para el control de arrastre
let dragging = null; // { id: "intervalo1" o "intervalo2", extremo: "a", "b", "p" o "q" }
let offsetX = 0;

// --- Funciones de redondeo ---
// Redondea a dos decimales y, si la parte decimal es menor que 0.08, redondea al entero.
function redondear(x) {
  let factor = 100;
  let r = Math.round(x * factor) / factor;
  let diff = Math.abs(x - Math.round(x));
  if(diff < 0.08) {
    return Math.round(x);
  }
  return r;
}

// --- Cálculo de la Unión ---
// La unión se obtiene tomando el menor extremo y el mayor extremo de los intervalos.
function calcularUnion() {
  // Extremo izquierdo:
  let left, leftClosed;
  let min1 = intervalo1.a, min2 = intervalo2.p;
  if(min1 < min2) {
    left = min1;
    leftClosed = intervalo1.aClosed;
  } else if(min2 < min1) {
    left = min2;
    leftClosed = intervalo2.pClosed;
  } else {
    left = min1;
    leftClosed = intervalo1.aClosed || intervalo2.pClosed;
  }
  // Extremo derecho:
  let right, rightClosed;
  let max1 = intervalo1.b, max2 = intervalo2.q;
  if(max1 > max2) {
    right = max1;
    rightClosed = intervalo1.bClosed;
  } else if(max2 > max1) {
    right = max2;
    rightClosed = intervalo2.qClosed;
  } else {
    right = max1;
    rightClosed = intervalo1.bClosed || intervalo2.qClosed;
  }
  unionIntervalo = { left, right, leftClosed, rightClosed };
}

// --- Dibujo ---
function dibujar() {
  // Limpiar canvas
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  
  // Dibuja la recta numérica (línea horizontal en el centro)
  let yLine = HEIGHT / 2;
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN, yLine);
  ctx.lineTo(WIDTH - MARGIN, yLine);
  ctx.stroke();
  
  // Dibuja marcas en la recta (cada 1 unidad)
  ctx.fillStyle = "black";
  for(let i = Math.ceil(worldMin); i <= worldMax; i++){
    let x = worldToCanvas(i);
    ctx.beginPath();
    ctx.moveTo(x, yLine - 5);
    ctx.lineTo(x, yLine + 5);
    ctx.stroke();
    ctx.fillText(i, x - 3, yLine + 20);
  }
  
  // Dibuja el primer intervalo (azul)
  dibujarIntervalo(intervalo1.a, intervalo1.b, intervalo1.aClosed, intervalo1.bClosed, intervalo1.color, intervalo1.grosor, yLine);
  
  // Dibuja el segundo intervalo (verde con transparencia)
  ctx.save();
  ctx.globalAlpha = intervalo2.alpha;
  dibujarIntervalo(intervalo2.p, intervalo2.q, intervalo2.pClosed, intervalo2.qClosed, intervalo2.color, intervalo2.grosor, yLine);
  ctx.restore();
  
  // Dibuja la unión (en magenta) si existe, un poco más arriba de la recta
  if(unionIntervalo) {
    dibujarIntervalo(unionIntervalo.left, unionIntervalo.right, unionIntervalo.leftClosed, unionIntervalo.rightClosed, "magenta", 8, yLine - 50);
  }
  
  // Actualiza la salida MathJax en el div .salida
  actualizarSalida();
}

// Función para dibujar un intervalo
function dibujarIntervalo(x1, x2, x1Closed, x2Closed, color, grosor, y) {
  let cx1 = worldToCanvas(x1);
  let cx2 = worldToCanvas(x2);
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
    if(cerrado) {
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
  dibujarExtremo(cx1, x1Closed);
  dibujarExtremo(cx2, x2Closed);
}

// --- Impresión con MathJax ---
function actualizarSalida() {
  // Redondeo de extremos
  let a = redondear(intervalo1.a);
  let b = redondear(intervalo1.b);
  let p = redondear(intervalo2.p);
  let q = redondear(intervalo2.q);
  
  let unionStr = "";
  if(unionIntervalo) {
    let L = redondear(unionIntervalo.left);
    let R = redondear(unionIntervalo.right);
    // Notación: extremo izquierdo: [ si cerrado, ] si abierto; derecho: ] si cerrado, [ si abierto.
    let leftBracket = unionIntervalo.leftClosed ? "[" : "]";
    let rightBracket = unionIntervalo.rightClosed ? "]" : "[";
    unionStr = leftBracket + L + "," + R + rightBracket;
  }
  
  // Intervalos individuales con la misma notación:
  let int1 = (intervalo1.aClosed ? "[" : "]") + a + "," + b + (intervalo1.bClosed ? "]" : "[");
  let int2 = (intervalo2.pClosed ? "[" : "]") + p + "," + q + (intervalo2.qClosed ? "]" : "[");
  let unionSimbolo = "\\cup";
  
  let texString = `\\( ${int1} ${unionSimbolo} ${int2} = ${unionStr} \\)`;
  document.querySelector(".salida").innerHTML = texString;
  if(window.MathJax){
    MathJax.typesetPromise();
  }
}

// --- Manejo de eventos ---
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const yLine = HEIGHT / 2;
  
  function revisarExtremo(xWorld, idIntervalo, extremo) {
    let cx = worldToCanvas(xWorld);
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
  if(dragging) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let newVal = canvasToWorld(mouseX) - offsetX;
    
    if(dragging.id === "intervalo1") {
      if(dragging.extremo === "a") {
        if(newVal < intervalo1.b - 0.1) intervalo1.a = newVal;
      } else { // extremo "b"
        if(newVal > intervalo1.a + 0.1) intervalo1.b = newVal;
      }
    } else if(dragging.id === "intervalo2") {
      if(dragging.extremo === "p") {
        if(newVal < intervalo2.q - 0.1) intervalo2.p = newVal;
      } else { // extremo "q"
        if(newVal > intervalo2.p + 0.1) intervalo2.q = newVal;
      }
    }
    dibujar();
  }
});

canvas.addEventListener("mouseup", (e) => {
  if(dragging) {
    calcularUnion();
    dragging = null;
    dibujar();
  }
});

canvas.addEventListener("dblclick", (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const yLine = HEIGHT / 2;
  
  function toggleExtremo(xWorld, propiedad, objeto) {
    let cx = worldToCanvas(xWorld);
    if (Math.abs(mouseX - cx) < RADIUS + 3 && Math.abs(mouseY - yLine) < RADIUS + 3) {
      objeto[propiedad] = !objeto[propiedad];
    }
  }
  
  toggleExtremo(intervalo1.a, "aClosed", intervalo1);
  toggleExtremo(intervalo1.b, "bClosed", intervalo1);
  toggleExtremo(intervalo2.p, "pClosed", intervalo2);
  toggleExtremo(intervalo2.q, "qClosed", intervalo2);
  
  dibujar();
});

// Dibuja la escena inicial
dibujar();


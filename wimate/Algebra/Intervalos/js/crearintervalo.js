(function(){
 "use strict";
    // CONFIGURACIÓN DEL CANVAS INTERACTIVO
    const canvas = document.getElementById("canvasInteractive");
    const ctx = canvas.getContext("2d");
    const margin = 50;
    const domainMin = -2;
    const domainMax = 6;
    const scale = (canvas.width - 2 * margin) / (domainMax - domainMin);

    // Variables del intervalo interactivo
    let leftVal = 2.0, rightVal = 4.0;
    let leftClosed = true, rightClosed = true;

    // Variables para manejo de arrastre
    let draggingDisk = null; // "left" o "right"
    const diskRadius = 8;
    const minGap = 0.1;  // separación mínima entre extremos

    // Funciones de conversión
    function xToCanvas(x) {
      return margin + (x - domainMin) * scale;
    }
    function canvasToX(px) {
      return domainMin + (px - margin) / scale;
    }

    // Función de formato:
    // Redondea a dos decimales; si la parte decimal es menor que 0.08, devuelve el entero más cercano.
    function formatVal(num) {
      let roundedTwo = Math.round(num * 100) / 100; // redondeo a 2 decimales
      let fractional = roundedTwo - Math.floor(roundedTwo);
      if (fractional < 0.08) {
        return Math.round(roundedTwo).toString();
      } else {
        return roundedTwo.toFixed(2);
      }
    }

    // Actualiza la notación del intervalo en el contenedor y renderiza con MathJax
    function updateMathJax() {
      // Notación: extremo izquierdo: "[" si cerrado, "]" si abierto; extremo derecho: "]" si cerrado, "[" si abierto.
      const leftSymbol = leftClosed ? "[" : "]";
      const rightSymbol = rightClosed ? "]" : "[";
      // Utilizamos la función de formato para los valores
      const intervalStr = `${leftSymbol}${formatVal(leftVal)}, ${formatVal(rightVal)}${rightSymbol}`;
      document.getElementById("intervalDisplayInteractive").innerHTML = `$$${intervalStr}$$`;
      MathJax.typesetPromise();
    }

    // Dibuja la recta numérica, el segmento del intervalo y los discos de los extremos
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const yLine = 100;
      
      // Dibuja la recta numérica
      ctx.beginPath();
      ctx.moveTo(margin, yLine);
      ctx.lineTo(canvas.width - margin, yLine);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Marcas en cada entero de -2 a 6
      for (let i = domainMin; i <= domainMax; i++) {
        const xPos = xToCanvas(i);
        ctx.beginPath();
        ctx.moveTo(xPos, yLine - 5);
        ctx.lineTo(xPos, yLine + 5);
        ctx.stroke();
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(i, xPos, yLine + 20);
      }

      // Flecha al final de la recta
      const arrowSize = 10;
      const endX = canvas.width - margin;
      ctx.beginPath();
      ctx.moveTo(endX, yLine);
      ctx.lineTo(endX - arrowSize, yLine - arrowSize/2);
      ctx.lineTo(endX - arrowSize, yLine + arrowSize/2);
      ctx.closePath();
      ctx.fill();

      // Dibuja el segmento del intervalo (azul y grueso)
      const xA = xToCanvas(leftVal);
      const xB = xToCanvas(rightVal);
      ctx.beginPath();
      ctx.moveTo(xA, yLine);
      ctx.lineTo(xB, yLine);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 6;
      ctx.stroke();

      // Función auxiliar para dibujar cada disco
      function drawDisk(x, isClosed) {
        ctx.beginPath();
        ctx.arc(x, yLine, diskRadius, 0, 2 * Math.PI);
        if (isClosed) {
          ctx.fillStyle = "blue";
          ctx.fill();
        } else {
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      // Dibuja los discos en cada extremo
      drawDisk(xA, leftClosed);
      drawDisk(xB, rightClosed);

      // Muestra los valores numéricos debajo de cada disco (usando la función de formato)
      ctx.font = "14px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText(formatVal(leftVal), xA, yLine + 40);
      ctx.fillText(formatVal(rightVal), xB, yLine + 40);
    }

    // Actualiza el dibujo y la notación
    function update() {
      // Se garantiza que leftVal < rightVal (con separación mínima)
      if (leftVal > rightVal - minGap) {
        leftVal = rightVal - minGap;
      }
      if (rightVal < leftVal + minGap) {
        rightVal = leftVal + minGap;
      }
      draw();
      updateMathJax();
    }

    // Eventos de ratón para interacción
    let isDragging = false;
    canvas.addEventListener("mousedown", function(e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const yLine = 100;
      const leftX = xToCanvas(leftVal);
      const rightX = xToCanvas(rightVal);
      if (Math.hypot(mouseX - leftX, mouseY - yLine) <= diskRadius + 2) {
        draggingDisk = "left";
        isDragging = true;
      } else if (Math.hypot(mouseX - rightX, mouseY - yLine) <= diskRadius + 2) {
        draggingDisk = "right";
        isDragging = true;
      }
    });

    canvas.addEventListener("mousemove", function(e) {
      if (!isDragging || !draggingDisk) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      let newVal = canvasToX(mouseX);
      if (draggingDisk === "left") {
        newVal = Math.min(newVal, rightVal - minGap);
        newVal = Math.max(newVal, domainMin);
        leftVal = newVal;
      } else if (draggingDisk === "right") {
        newVal = Math.max(newVal, leftVal + minGap);
        newVal = Math.min(newVal, domainMax);
        rightVal = newVal;
      }
      update();
    });

    canvas.addEventListener("mouseup", function() {
      isDragging = false;
      draggingDisk = null;
    });

    canvas.addEventListener("mouseleave", function() {
      isDragging = false;
      draggingDisk = null;
    });

    // Doble clic para alternar el estado de cada disco
    canvas.addEventListener("dblclick", function(e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const yLine = 100;
      const leftX = xToCanvas(leftVal);
      const rightX = xToCanvas(rightVal);
      if (Math.hypot(mouseX - leftX, mouseY - yLine) <= diskRadius + 2) {
        leftClosed = !leftClosed;
      } else if (Math.hypot(mouseX - rightX, mouseY - yLine) <= diskRadius + 2) {
        rightClosed = !rightClosed;
      }
      update();
    });

    // Inicializar con el intervalo [2,4]
    update();
  })();
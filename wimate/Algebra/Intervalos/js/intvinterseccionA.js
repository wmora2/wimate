 (function(){
      "use strict";
      // CONFIGURACIÓN DEL CANVAS Y DOMINIO DE LA RECTA
      const canvas = document.getElementById("canvasIntersect2");
      const ctx = canvas.getContext("2d");
      const margin = 50;
      const domainMin = -2;
      const domainMax = 6;
      const scale = (canvas.width - 2 * margin) / (domainMax - domainMin);
      const yLine = 150; // línea numérica en el canvas

      // INTERVALOS: cada uno tiene { a, b, leftClosed, rightClosed, color, grosor, alpha }
      let int1 = { a: -2, b: 3, leftClosed: true, rightClosed: true, color: "blue", grosor: 6, alpha: 1.0 };
      let int2 = { a: 0, b: 4, leftClosed: true, rightClosed: false, color: "green", grosor: 8, alpha: 0.6 };

      // INTERSECCIÓN (se calculará al soltar el ratón)
      let interseccion = null; // similar: { a, b, leftClosed, rightClosed, color:"magenta", grosor: 6, alpha: 1.0 }

      // Para arrastre: se guarda { interval: 1 o 2, edge: "left" o "right" }
      let dragTarget = null;

      // Función de formato: redondea a dos decimales y, si la parte decimal es < 0.08, redondea al entero más cercano.
      function formatVal(num) {
        let r = Math.round(num * 100) / 100;
        let fractional = r - Math.floor(r);
        if (fractional < 0.08) {
          return Math.round(r);
        }
        return r.toFixed(2);
      }

      // Funciones de conversión entre valor y coordenada
      function xToCanvas(x) {
        return margin + (x - domainMin) * scale;
      }
      function canvasToX(px) {
        return domainMin + (px - margin) / scale;
      }

      // Dibuja la recta numérica con marcas y flecha
      function dibujarRecta() {
        // Línea base
        ctx.beginPath();
        ctx.moveTo(margin, yLine);
        ctx.lineTo(canvas.width - margin, yLine);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
        // Marcas y números
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        for(let i = domainMin; i <= domainMax; i++){
          const xPos = xToCanvas(i);
          ctx.beginPath();
          ctx.moveTo(xPos, yLine - 5);
          ctx.lineTo(xPos, yLine + 5);
          ctx.stroke();
          ctx.fillText(i, xPos, yLine + 20);
        }
        // Flecha al final
        const arrowSize = 10;
        const endX = canvas.width - margin;
        ctx.beginPath();
        ctx.moveTo(endX, yLine);
        ctx.lineTo(endX - arrowSize, yLine - arrowSize/2);
        ctx.lineTo(endX - arrowSize, yLine + arrowSize/2);
        ctx.closePath();
        ctx.fill();
      }

      // Función para dibujar un intervalo dado
      // Parámetros: intervalo (con propiedades definidas), yPos (vertical), se usa para cada intervalo e intersección.
      function dibujarIntervalo(intervalo, yPos) {
        const xA = xToCanvas(intervalo.a);
        const xB = xToCanvas(intervalo.b);
        ctx.save();
        ctx.globalAlpha = intervalo.alpha;
        // Dibujar segmento grueso
        ctx.beginPath();
        ctx.moveTo(xA, yPos);
        ctx.lineTo(xB, yPos);
        ctx.strokeStyle = intervalo.color;
        ctx.lineWidth = intervalo.grosor;
        ctx.stroke();
        // Dibujar extremos
        function dibujarDisco(x, closed) {
          ctx.beginPath();
          ctx.arc(x, yPos, 8, 0, 2*Math.PI);
          if(closed) {
            ctx.fillStyle = intervalo.color;
            ctx.fill();
          } else {
            ctx.strokeStyle = intervalo.color;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        dibujarDisco(xA, intervalo.leftClosed);
        dibujarDisco(xB, intervalo.rightClosed);
        ctx.restore();
      }

      // Dibuja toda la escena: recta, intervalos y, si existe, la intersección.
      function dibujarTodo() {
        ctx.clearRect(0,0,canvas.width, canvas.height);
        dibujarRecta();
        // Dibujar intervalo 1 (blue) en la línea base
        dibujarIntervalo(int1, yLine);
        // Dibujar intervalo 2 (green) en la misma línea (se dibuja sobre el azul, pero con grosor mayor y transparencia)
        dibujarIntervalo(int2, yLine);
        // Si hay intersección, dibujarla en una línea superior (por ejemplo, 30px arriba)
        if(interseccion) {
          dibujarIntervalo(interseccion, yLine - 30);
        }
        actualizarImpresion();
      }

      // Calcula la intersección de los dos intervalos
      function calcularInterseccion(i1, i2) {
        let L, R;
        let leftClosed, rightClosed;
        // El extremo izquierdo de la intersección es el máximo de los dos extremos izquierdos.
        if(i1.a > i2.a) {
          L = i1.a;
          leftClosed = i1.leftClosed;
        } else if(i1.a < i2.a) {
          L = i2.a;
          leftClosed = i2.leftClosed;
        } else { // iguales
          L = i1.a;
          leftClosed = i1.leftClosed && i2.leftClosed;
        }
        // El extremo derecho es el mínimo de los dos extremos derechos.
        if(i1.b < i2.b) {
          R = i1.b;
          rightClosed = i1.rightClosed;
        } else if(i1.b > i2.b) {
          R = i2.b;
          rightClosed = i2.rightClosed;
        } else {
          R = i1.b;
          rightClosed = i1.rightClosed && i2.rightClosed;
        }
        // Existe intersección si L < R, o si L==R y ambos extremos son cerrados.
        if(L < R || (L === R && leftClosed && rightClosed)) {
          return {
            a: L,
            b: R,
            leftClosed: leftClosed,
            rightClosed: rightClosed,
            color: "magenta",
            grosor: 6,
            alpha: 1.0
          };
        } else {
          return null;
        }
      }

      // Actualiza la impresión de los intervalos y su intersección en la parte superior usando MathJax
      function actualizarImpresion() {
        // Formatea cada intervalo usando la notación:
        // [ si es cerrado, ] si es abierto (para el extremo izquierdo se usa "[" si cerrado, "]" si abierto;
        // para el derecho se usa "]" si cerrado, "[" si abierto)
        function notacion(intervalo) {
          const leftSym = intervalo.leftClosed ? "[" : "]";
          const rightSym = intervalo.rightClosed ? "]" : "[";
          return `${leftSym}${formatVal(intervalo.a)}, ${formatVal(intervalo.b)}${rightSym}`;
        }
        let texto = `$$${notacion(int1)}\\;\\cap\\;${notacion(int2)}\\;=\\;`;
        if(interseccion) {
          texto += notacion(interseccion);
        } else {
          texto += "\\emptyset";
        }
        texto += "$$";
        document.getElementById("resultDisplayIntersect2").innerHTML = texto;
        MathJax.typesetPromise();
      }

      // EVENTOS DE MOUSE PARA ARRASTRE Y DOBLE CLIC
      canvas.addEventListener("mousedown", function(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        // Se consideran ambos intervalos y ambos extremos (para cada, se comprueba proximidad a la coordenada correspondiente)
        const tol = 10; // tolerancia en píxeles
        // Función que determina si (mx,my) está cerca de (x, y0)
        function cerca(x, y0) {
          return Math.hypot(mx - x, my - y0) <= tol;
        }
        // Revisamos para int1 (línea yLine) y para int2 (la misma línea)  
        const x1a = xToCanvas(int1.a);
        const x1b = xToCanvas(int1.b);
        const x2a = xToCanvas(int2.a);
        const x2b = xToCanvas(int2.b);
        if(cerca(x1a, yLine)) {
          dragTarget = { interval: 1, edge: "left" };
        } else if(cerca(x1b, yLine)) {
          dragTarget = { interval: 1, edge: "right" };
        } else if(cerca(x2a, yLine)) {
          dragTarget = { interval: 2, edge: "left" };
        } else if(cerca(x2b, yLine)) {
          dragTarget = { interval: 2, edge: "right" };
        }
      });

      // Evento doble clic para cambiar el estado de abierto/cerrado en el extremo seleccionado
      canvas.addEventListener("dblclick", function(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const tol = 10;
        function cerca(x, y0) { return Math.hypot(mx - x, my - y0) <= tol; }
        const x1a = xToCanvas(int1.a);
        const x1b = xToCanvas(int1.b);
        const x2a = xToCanvas(int2.a);
        const x2b = xToCanvas(int2.b);
        // Para cada extremo se alterna el estado si el clic es cercano.
        if(cerca(x1a, yLine)) {
          int1.leftClosed = !int1.leftClosed;
        } else if(cerca(x1b, yLine)) {
          int1.rightClosed = !int1.rightClosed;
        } else if(cerca(x2a, yLine)) {
          int2.leftClosed = !int2.leftClosed;
        } else if(cerca(x2b, yLine)) {
          int2.rightClosed = !int2.rightClosed;
        }
        // Al cambiar, se recalcula la intersección (si procede) y se redibuja.
        interseccion = calcularInterseccion(int1, int2);
        dibujarTodo();
      });

      // Evento mousemove para arrastrar de forma continua y suave
      canvas.addEventListener("mousemove", function(e) {
        if(!dragTarget) return;
        const rect = canvas.getBoundingClientRect();
        let nuevoVal = canvasToX(e.clientX - rect.left);
        // Limitar al dominio
        if(nuevoVal < domainMin) nuevoVal = domainMin;
        if(nuevoVal > domainMax) nuevoVal = domainMax;
        // Según qué intervalo y qué extremo se está arrastrando
        if(dragTarget.interval === 1) {
          if(dragTarget.edge === "left") {
            if(nuevoVal >= int1.b) nuevoVal = int1.b - 0.1;
            int1.a = Math.round(nuevoVal*100)/100;
          } else {
            if(nuevoVal <= int1.a) nuevoVal = int1.a + 0.1;
            int1.b = Math.round(nuevoVal*100)/100;
          }
        } else if(dragTarget.interval === 2) {
          if(dragTarget.edge === "left") {
            if(nuevoVal >= int2.b) nuevoVal = int2.b - 0.1;
            int2.a = Math.round(nuevoVal*100)/100;
          } else {
            if(nuevoVal <= int2.a) nuevoVal = int2.a + 0.1;
            int2.b = Math.round(nuevoVal*100)/100;
          }
        }
        // Mientras se arrastra, podemos recalcular la intersección pero no forzar su dibujo hasta soltar.
        interseccion = calcularInterseccion(int1, int2);
        dibujarTodo();
      });

      // Al soltar el mouse, se limpia el dragTarget
      canvas.addEventListener("mouseup", function(e) {
        dragTarget = null;
      });
      canvas.addEventListener("mouseleave", function(e) {
        dragTarget = null;
      });

      // Al iniciar, se calcula la intersección (si existe) y se dibuja
      function iniciar() {
        interseccion = calcularInterseccion(int1, int2);
        dibujarTodo();
      }
      iniciar();
    })();

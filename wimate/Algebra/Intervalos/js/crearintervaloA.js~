    let datosIntervalo; // Variable global para almacenar el intervalo generado

    // Función que genera un intervalo aleatorio
    function randomIntervalo() {
      // Generar dos números aleatorios entre -2 y 6
      let num1 = Math.random() * 8 - 2;  // (-2 a 6)
      let num2 = Math.random() * 8 - 2;
      // Aseguramos que a <= b
      let a = Math.min(num1, num2);
      let b = Math.max(num1, num2);
      // Redondeamos a 2 decimales (opcional)
      a = Math.round(a * 100) / 100;
      b = Math.round(b * 100) / 100;

      // Elegir aleatoriamente el tipo de intervalo
      const tipos = [
        { left: "[", right: "]" },  // [a, b]
        { left: "]", right: "]" },  // ]a, b]
        { left: "]", right: "[" },  // ]a, b[
        { left: "[", right: "[" }   // [a, b[
      ];
      let indice = Math.floor(Math.random() * tipos.length);
      let tipo = tipos[indice];

      // Construir el string del intervalo
      let intervaloStr = tipo.left + a + ", " + b + tipo.right;

      return { a, b, intervaloStr, tipo };
    }

    // Función para dibujar la recta numérica y el intervalo en el canvas
    function dibujar() {
      // Obtenemos el canvas y su contexto
      let canvas = document.getElementById("canvas");
      let ctx = canvas.getContext("2d");

      // Limpiar el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Parámetros para el dibujo
      const margin = 50;
      const minX = -3;
      const maxX = 7;
      const escala = (canvas.width - 2 * margin) / (maxX - minX);
      const yLine = 100; // posición vertical de la recta

      // DIBUJAR LA RECTA NUMÉRICA
      ctx.beginPath();
      ctx.moveTo(margin, yLine);
      ctx.lineTo(canvas.width - margin, yLine);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dibujar las marcas (ticks) de cada entero entre minX y maxX
      for (let i = Math.ceil(minX); i <= maxX; i++) {
        let x = margin + (i - minX) * escala;
        ctx.beginPath();
        ctx.moveTo(x, yLine - 5);
        ctx.lineTo(x, yLine + 5);
        ctx.stroke();
        // Etiqueta numérica debajo del tick
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(i, x, yLine + 20);
      }

      // Dibujar flecha al final de la recta
      const arrowSize = 10;
      let endX = canvas.width - margin;
      ctx.beginPath();
      ctx.moveTo(endX, yLine);
      ctx.lineTo(endX - arrowSize, yLine - arrowSize / 2);
      ctx.lineTo(endX - arrowSize, yLine + arrowSize / 2);
      ctx.closePath();
      ctx.fill();

      // Convertir los valores a coordenadas en el canvas
      let xA = margin + (datosIntervalo.a - minX) * escala;
      let xB = margin + (datosIntervalo.b - minX) * escala;

      // DIBUJAR EL SEGMENTO AZUL GRUESO (representación del intervalo)
      ctx.beginPath();
      ctx.moveTo(xA, yLine);
      ctx.lineTo(xB, yLine);
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 6;
      ctx.stroke();

      // Función para dibujar un disco en el extremo
      function dibujarDisco(x, tipoCierre) {
        const radio = 8;
        ctx.beginPath();
        ctx.arc(x, yLine, radio, 0, 2 * Math.PI);
        if (tipoCierre === "cerrado") {
          ctx.fillStyle = "blue";
          ctx.fill();
        } else {
          ctx.strokeStyle = "blue";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Determinar si cada extremo es cerrado u abierto
      let extremoIzquierdoCerrado = (datosIntervalo.tipo.left === "[");
      let extremoDerechoCerrado  = (datosIntervalo.tipo.right === "]");

      dibujarDisco(xA, extremoIzquierdoCerrado ? "cerrado" : "abierto");
      dibujarDisco(xB, extremoDerechoCerrado ? "cerrado" : "abierto");

      // Imprimir los valores de a y b debajo de cada disco
      ctx.font = "14px Arial";
      ctx.fillStyle = "black";
      ctx.textAlign = "center";
      ctx.fillText(datosIntervalo.a, xA, yLine + 30);
      ctx.fillText(datosIntervalo.b, xB, yLine + 30);
    }

    // Función para generar un nuevo intervalo aleatorio y limpiar el canvas
    function generarIntervalo() {
      datosIntervalo = randomIntervalo();
      document.getElementById("intervalo").value = datosIntervalo.intervaloStr;

      // Limpiar el canvas
      let canvas = document.getElementById("canvas");
      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Asignar eventos a los botones
    document.getElementById("btnGenerarIntervalo").addEventListener("click", generarIntervalo);
    document.getElementById("btnGenerar").addEventListener("click", function() {
      if (datosIntervalo) {
        dibujar();
      }
    });

    // Al cargarse el DOM se genera un intervalo inicial
    document.addEventListener("DOMContentLoaded", generarIntervalo);
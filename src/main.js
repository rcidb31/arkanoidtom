     /*//////////////////ESTRUCTURA CANVAS ///////////////////////////*/

    
     /* Seleccionamos el canvas y el contexto 2d */
     const canvas = document.querySelector('canvas'); // querySelector selecciona el primer elemento que coincida con el selector
     const ctx = canvas.getContext('2d'); // ctx es el contexto 2d del canvas
     canvas.width = 448; // ancho del canvas
     canvas.height = 400; // alto del canvas
  
     
     /*//////////////////////////PALA////////////////////////////*/
     
     /* Constantes pala */

     const paddleHeight = 10; // altura de la pala
     const paddleWidth = 75; // ancho de la pala

     /* posicion en x y pala en lienzo canvas */

     let paddleX = (canvas.width - paddleWidth) / 2; // posicion en el centro del canvas
     let paddleY = canvas.height - paddleHeight; // posicion en la parte inferior del canvas
 
     /*Variables pala*/

     let rightPressed = false; // si la tecla derecha esta presionada
     let leftPressed = false; // si la tecla izquierda esta presionada

     /*Sencibilidad de pala*/

     const paddle_sensitive = 10; // sensibilidad de la pala

     /*Funcion dibujar pala*/

     function drawPaddle() {
       ctx.fillStyle = 'red'; // color de la pala
       ctx.fillRect(
       paddleX, // posicion en x de la pala
       paddleY, // posicion en y de la pala
       paddleWidth, // ancho de la pala
       paddleHeight); // altura de la pala

     }
    
     /*funcion que escucha eventos movimiento de teclas */

     function initEvent() {
        document.addEventListener('keydown', keyDownHandler, false); // escuchamos cuando se presiona una tecla
        document.addEventListener('keyup', keyUpHandler, false); // escuchamos cuando se suelta una tecla


     /* funcion que escucha evento hacia abajo*/   

        function keyDownHandler(e) {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
                rightPressed = true;
            } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
                leftPressed = true;
            }
        }
     }
    
     /* funcion que escucha eventos tecla arriba */

        function keyUpHandler(e) {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
            rightPressed = false;
        } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
            leftPressed = false;
        }
     }

     // funcion para mover la pala 

        function paddleMovement() {
           if (rightPressed && paddleX < canvas.width - paddleWidth) {
            paddleX += paddle_sensitive;
        } else if (leftPressed && paddleX > 0) {
            paddleX -= paddle_sensitive;
        }
     }






     /*/////////////////////////PELOTA///////////////////////////*/
    
     
     /* condiciones cuando la bola toca la paleta en toda su extension */
     
     const isBallSameXasPaddle = x => x > paddleX && x < paddleX + paddleWidth; // si la bola esta en la misma posicion que la pala X 
     const isBallSameYasPaddle = y => y > paddleY; // si la bola esta en la misma posicion que la pala en la Y 
     
     /* Constante radio pelota */

     const ballRadius = 10; 
   
     /* posicion en x y bola en lienzo canvas */

     let x = canvas.width / 2;  // posicion en el centro del canvas
     let y = canvas.height - 30; // posicion en la parte inferior del canvas

     // velocidad de la bola

     let dx = 2;
     let dy = -2;
    
    
     /*Funcion dibujar bola*/
     
     function drawBall() {
        ctx.beginPath(); // comenzamos a dibujar llamamos al contexto 2d
        ctx.arc(x, y, ballRadius, 0, Math.PI *2); // dibujamos un circulo
        ctx.fillStyle = '#39ff14'; // color del circulo
        ctx.fill(); // rellenamos el circulo
        ctx.closePath(); // cerramos el circulo , metodo close path para cerrar la figura. 
     }

  
     /* funcion para mover la bola entienda los bordes del canvas y sus coliciones 
      y cambie de direccion al ser multiplicado por -1 o -dx */
    
      function ballMovement(isBallSameXasPaddle, isBallSameYasPaddle) {
       
       // si la bola toca los bordes laterales invertimos la direccion

       if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) { 
           dx = -dx; // invertimos el signo  de la  direccion 
       }
       // si la bola toca el borde superior invertimos la direccion

       if (y + dy < ballRadius) { 
           dy = -dy;
       } 
       // si la bola toca el suelo invertimos la direccion

       else if (y + dy > canvas.height - ballRadius) { 
           
           if (x > paddleX && x < paddleX + paddleWidth) { 
               dy = -dy;
           } 
           
           else {
               console.log('GAME OVER'); // si la bola toca el borde inferior y no toca la pala GAME OVER
               document.location.reload(); // recargamos la pagina
           }
       }

      //definimos la velocidad de la bola con el incremento de x y y

       x += dx, // incremento en valor de x la velocidad de la bola
       y += dy // movemos la bola en el eje y
    }
   
     /*////////////////////////// limpiar canvas ////////////////////////*/

     // para que no renderice los frames anteriores aplicamos clearcanvas // 
     function cleanCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // limpiamos el canvas
     }
    



     
     /*////////////////////////// ladrillos ///////////////////////////*/
    
     function drawBricks() {}


     
  
    
    function collisionDetection() {}





     /*//////////////////////////llamado a funciones ///////////////////////////*/

     // funcion para dibujar , se ejecuta recursivamente
     function draw () {

     // limpiamos el canvas    
     cleanCanvas();   
     // llamamos a la funcion drawBall para dibujar la bola
     drawBall(); 
     // dibujamos la pala
     drawPaddle(); 
     // dibujamos los ladrillos    
     drawBricks();  
     // detectamos las colisiones 
     collisionDetection();
     // movemos la bola
     ballMovement(); 
     // movemos la pala
     paddleMovement(); 
      // requestAnimationFrame es una funcion que se ejecuta recursivamente 
     window.requestAnimationFrame(draw); 
    }

     /*////////////////////////// Iniciaciones ///////////////////////////*/

    draw(); // llamamos a la funcion draw para que se ejecute recursivamente
    initEvent(); // llamamos a la funcion initEvent para que escuche los eventos de teclado